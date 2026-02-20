# Solidity API

## CredentialRegistry

On-chain registry for Verifiable Credential hashes and revocation status

_Phase 3 of SSI learning path - Verifiable Credentials

WHAT THIS CONTRACT DOES:
- Stores a hash of each issued credential (for revocation lookup)
- Allows issuers to revoke credentials they issued
- Lets verifiers check if a credential is revoked (isRevoked(hash))

WHY ON-CHAIN:
- Credentials are stored off-chain (IPFS, holder wallet) - too large and private
- We only need revocation status: "Is this credential still valid?"
- Verifiers can check revocation without contacting the issuer

FLOW:
1. Issuer creates VC off-chain, signs it, computes hash of the credential
2. Issuer calls registerCredential(hash) - pays gas, becomes the issuer on-chain
3. Holder stores the signed VC (off-chain)
4. Verifier receives VC from holder, gets hash, calls isRevoked(hash)
5. If revoked, issuer previously called revokeCredential(hash)_

### CredentialRegistered

```solidity
event CredentialRegistered(bytes32 credentialHash, address issuer)
```

Emitted when a credential is registered

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash of the Verifiable Credential |
| issuer | address | The address that registered (and issued) the credential WHY EMIT: - Indexers can build a list of credentials per issuer - Auditable trail of all issued credentials |

### CredentialRevoked

```solidity
event CredentialRevoked(bytes32 credentialHash, address issuer)
```

Emitted when a credential is revoked

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash of the revoked credential |
| issuer | address | The issuer who revoked it WHY REVOCATION: - Degrees can be revoked (fraud discovered) - Licenses can expire or be suspended - Employment credentials become invalid when job ends |

### CredentialRecord

_Stores credential info: who issued it and whether it's revoked_

```solidity
struct CredentialRecord {
  address issuer;
  bool revoked;
  uint256 registeredAt;
}
```

### registerCredential

```solidity
function registerCredential(bytes32 credentialHash) external
```

Register a credential hash when issuing

_The caller (msg.sender) becomes the issuer. Only the issuer can later revoke.
     The same hash cannot be registered twice (idempotent: revert if exists).

GAS: ~50,000 - 70,000 gas_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash of the Verifiable Credential (typically SHA-256) |

### revokeCredential

```solidity
function revokeCredential(bytes32 credentialHash) external
```

Revoke a credential

_Only the original issuer can revoke. Revocation is permanent._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash of the credential to revoke |

### isRevoked

```solidity
function isRevoked(bytes32 credentialHash) external view returns (bool)
```

Check if a credential is revoked

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash of the credential to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if revoked, false if valid or unknown |

### getCredential

```solidity
function getCredential(bytes32 credentialHash) external view returns (address issuer, bool revoked, uint256 registeredAt)
```

Get full credential record

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash of the credential |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| issuer | address | The address that issued the credential |
| revoked | bool | Whether the credential is revoked |
| registeredAt | uint256 | Timestamp when registered |

### credentialExists

```solidity
function credentialExists(bytes32 credentialHash) external view returns (bool)
```

Check if a credential exists (was ever registered)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| credentialHash | bytes32 | The hash to check |

