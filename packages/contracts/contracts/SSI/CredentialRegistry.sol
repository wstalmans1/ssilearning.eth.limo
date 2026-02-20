// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Credential Registry
 * @notice On-chain registry for Verifiable Credential hashes and revocation status
 * @dev Phase 3 of SSI learning path - Verifiable Credentials
 *
 * WHAT THIS CONTRACT DOES:
 * - Stores a hash of each issued credential (for revocation lookup)
 * - Allows issuers to revoke credentials they issued
 * - Lets verifiers check if a credential is revoked (isRevoked(hash))
 *
 * WHY ON-CHAIN:
 * - Credentials are stored off-chain (IPFS, holder wallet) - too large and private
 * - We only need revocation status: "Is this credential still valid?"
 * - Verifiers can check revocation without contacting the issuer
 *
 * FLOW:
 * 1. Issuer creates VC off-chain, signs it, computes hash of the credential
 * 2. Issuer calls registerCredential(hash) - pays gas, becomes the issuer on-chain
 * 3. Holder stores the signed VC (off-chain)
 * 4. Verifier receives VC from holder, gets hash, calls isRevoked(hash)
 * 5. If revoked, issuer previously called revokeCredential(hash)
 */
contract CredentialRegistry {
    /**
     * @notice Emitted when a credential is registered
     * @param credentialHash The hash of the Verifiable Credential
     * @param issuer The address that registered (and issued) the credential
     *
     * WHY EMIT:
     * - Indexers can build a list of credentials per issuer
     * - Auditable trail of all issued credentials
     */
    event CredentialRegistered(bytes32 indexed credentialHash, address indexed issuer);

    /**
     * @notice Emitted when a credential is revoked
     * @param credentialHash The hash of the revoked credential
     * @param issuer The issuer who revoked it
     *
     * WHY REVOCATION:
     * - Degrees can be revoked (fraud discovered)
     * - Licenses can expire or be suspended
     * - Employment credentials become invalid when job ends
     */
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);

    /**
     * @dev Stores credential info: who issued it and whether it's revoked
     */
    struct CredentialRecord {
        address issuer;
        bool revoked;
        uint256 registeredAt;
    }

    mapping(bytes32 => CredentialRecord) private _credentials;

    /**
     * @notice Register a credential hash when issuing
     * @param credentialHash The hash of the Verifiable Credential (typically SHA-256)
     *
     * @dev The caller (msg.sender) becomes the issuer. Only the issuer can later revoke.
     *      The same hash cannot be registered twice (idempotent: revert if exists).
     *
     * GAS: ~50,000 - 70,000 gas
     */
    function registerCredential(bytes32 credentialHash) external {
        CredentialRecord storage record = _credentials[credentialHash];
        require(record.issuer == address(0), "CredentialRegistry: already registered");
        record.issuer = msg.sender;
        record.revoked = false;
        record.registeredAt = block.timestamp;
        emit CredentialRegistered(credentialHash, msg.sender);
    }

    /**
     * @notice Revoke a credential
     * @param credentialHash The hash of the credential to revoke
     *
     * @dev Only the original issuer can revoke. Revocation is permanent.
     */
    function revokeCredential(bytes32 credentialHash) external {
        CredentialRecord storage record = _credentials[credentialHash];
        require(record.issuer != address(0), "CredentialRegistry: credential not found");
        require(record.issuer == msg.sender, "CredentialRegistry: only issuer can revoke");
        require(!record.revoked, "CredentialRegistry: already revoked");
        record.revoked = true;
        emit CredentialRevoked(credentialHash, msg.sender);
    }

    /**
     * @notice Check if a credential is revoked
     * @param credentialHash The hash of the credential to check
     * @return True if revoked, false if valid or unknown
     */
    function isRevoked(bytes32 credentialHash) external view returns (bool) {
        return _credentials[credentialHash].revoked;
    }

    /**
     * @notice Get full credential record
     * @param credentialHash The hash of the credential
     * @return issuer The address that issued the credential
     * @return revoked Whether the credential is revoked
     * @return registeredAt Timestamp when registered
     */
    function getCredential(bytes32 credentialHash)
        external
        view
        returns (address issuer, bool revoked, uint256 registeredAt)
    {
        CredentialRecord storage record = _credentials[credentialHash];
        return (record.issuer, record.revoked, record.registeredAt);
    }

    /**
     * @notice Check if a credential exists (was ever registered)
     * @param credentialHash The hash to check
     */
    function credentialExists(bytes32 credentialHash) external view returns (bool) {
        return _credentials[credentialHash].issuer != address(0);
    }
}
