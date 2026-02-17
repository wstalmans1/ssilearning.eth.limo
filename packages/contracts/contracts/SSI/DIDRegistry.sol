// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title DID Registry
 * @notice A decentralized registry for Decentralized Identifiers (DIDs) on Ethereum
 * @dev This contract implements Phase 2 of the SSI learning path - DID Registry
 * 
 * WHAT THIS CONTRACT DOES:
 * - Registers DIDs (Decentralized Identifiers) on-chain
 * - Associates Ethereum addresses with DIDs
 * - Stores DID Document hashes (not full documents for gas efficiency)
 * - Allows DID owners to update their DID Document hash
 * - Enables DID resolution (looking up a DID to get its document hash)
 * 
 * WHY WE NEED THIS:
 * 1. Decentralization: No single entity controls identity registration
 * 2. Immutability: Once registered, DID ownership can't be falsified
 * 3. Verifiability: Anyone can verify who owns a DID
 * 4. On-chain Resolution: Smart contracts can resolve DIDs to documents
 * 
 * HOW IT WORKS:
 * - Each DID is associated with an Ethereum address (the DID controller)
 * - DID Documents are stored off-chain (IPFS, databases, etc.)
 * - Only the hash of the DID Document is stored on-chain (saves gas)
 * - The hash allows verification that a DID Document hasn't been tampered with
 * 
 * LEARNING NOTES:
 * - This is a simplified DID registry for learning purposes
 * - Real-world DID registries may have additional features (key rotation, service endpoints, etc.)
 * - We use the "ethr" DID method (did:ethr:0x...)
 */
contract DIDRegistry {
    /**
     * @notice Emitted when a new DID is registered
     * @param did The Decentralized Identifier (e.g., "did:ethr:0x123...")
     * @param controller The Ethereum address that controls this DID
     * @param documentHash The hash of the DID Document (for verification)
     * @param documentURI The location where the DID Document can be fetched
     * 
     * WHY WE EMIT EVENTS:
     * - Events are cheaper than storage (for historical data)
     * - Frontend apps can listen to events for real-time updates
     * - Events provide a searchable history of DID registrations
     * - documentURI in event allows off-chain indexing without querying storage
     */
    event DIDRegistered(
        string indexed did,
        address indexed controller,
        bytes32 documentHash,
        string documentURI
    );

    /**
     * @notice Emitted when a DID Document is updated
     * @param did The DID being updated
     * @param newDocumentHash The new hash of the DID Document
     * @param newDocumentURI The new location of the DID Document
     * @param previousDocumentHash The previous hash (for tracking changes)
     * 
     * WHY ALLOW UPDATES:
     * - DID Documents may need to be updated (new keys, new services)
     * - The hash changes when the document changes
     * - The URI may change if document is moved to new location
     * - We track both old and new values for audit purposes
     */
    event DIDDocumentUpdated(
        string indexed did,
        bytes32 newDocumentHash,
        string newDocumentURI,
        bytes32 previousDocumentHash
    );

    /**
     * @notice Emitted when DID ownership is transferred
     * @param did The DID being transferred
     * @param previousController The previous owner
     * @param newController The new owner
     * 
     * WHY ALLOW TRANSFERS:
     * - Users may want to migrate to a new wallet
     * - Organizations may transfer DID control
     * - Important for DID recovery scenarios
     */
    event DIDOwnershipTransferred(
        string indexed did,
        address indexed previousController,
        address indexed newController
    );

    /**
     * @dev Structure to store DID information
     * 
     * WHY THIS STRUCTURE:
     * - controller: The Ethereum address that owns/controls this DID
     * - documentHash: Hash of the DID Document (for verification)
     * - documentURI: Location where the DID Document can be fetched (IPFS CID, HTTP URL, etc.)
     * - registeredAt: Timestamp of registration (useful for analytics)
     * - updatedAt: Last update timestamp (for tracking changes)
     * 
     * WHY STORE documentURI:
     * - CRITICAL: Without this, resolvers don't know WHERE to fetch the document!
     * - Enables complete DID resolution: hash tells you WHAT to verify, URI tells you WHERE to get it
     * - Can store IPFS CID (ipfs://Qm...), HTTP URL (https://...), or any URI format
     * 
     * TRADE-OFF:
     * - Costs extra gas (~20,000 gas for string storage)
     * - But enables direct on-chain resolution without off-chain infrastructure
     * - Alternative: Store URI in events (cheaper but requires indexing)
     * 
     * WHY STORE TIMESTAMPS:
     * - Useful for auditing and compliance
     * - Can be used to detect suspicious activity
     * - Helps with credential expiration logic
     */
    struct DIDRecord {
        address controller;        // Who controls this DID
        bytes32 documentHash;      // Hash of the DID Document (for verification)
        string documentURI;        // Where to fetch the DID Document (e.g., "ipfs://Qm..." or "https://...")
        uint256 registeredAt;      // When was this DID registered
        uint256 updatedAt;         // When was it last updated
    }

    /**
     * @dev Mapping from DID string to DIDRecord
     * 
     * WHY USE MAPPING:
     * - O(1) lookup time (very efficient)
     * - Easy to check if a DID exists (check if controller != address(0))
     * - Gas efficient for reads
     * 
     * STORAGE COST:
     * - Each DID record costs ~20,000 gas to store
     * - Reading costs ~2,100 gas (warm) or ~100 gas (cold)
     */
    mapping(string => DIDRecord) private _dids;

    /**
     * @dev Mapping from controller address to DID
     * 
     * WHY THIS MAPPING:
     * - Allows reverse lookup: "What DID does this address control?"
     * - Useful for frontend: "Show me my DID"
     * - Enables one-address-to-one-DID relationship (simplified for learning)
     * 
     * NOTE: In real-world, one address might control multiple DIDs
     * This is simplified for learning purposes
     */
    mapping(address => string) private _controllerToDID;

    /**
     * @notice Registers a new DID
     * @param did The Decentralized Identifier (must follow format: "did:ethr:0x...")
     * @param documentHash The hash of the DID Document (SHA-256 recommended)
     * @param documentURI The location where the DID Document can be fetched
     *                    Examples: "ipfs://QmXoypizj..." or "https://example.com/did-docs/123"
     * 
     * @dev Requirements:
     * - DID must not already be registered
     * - Caller must not already control a DID
     * - DID format should be validated (simplified here for learning)
     * - documentURI should not be empty (enables resolution)
     * 
     * HOW IT WORKS:
     * 1. Check if DID already exists (revert if yes)
     * 2. Check if caller already has a DID (revert if yes - simplified)
     * 3. Validate documentURI is not empty (critical for resolution)
     * 4. Store the DID record (including hash AND URI)
     * 5. Store reverse mapping (address -> DID)
     * 6. Emit event for frontend/off-chain systems
     * 
     * COMPLETE RESOLUTION FLOW:
     * 1. Resolver calls resolveDID() → gets documentHash and documentURI
     * 2. Resolver fetches document from documentURI (IPFS, HTTP, etc.)
     * 3. Resolver hashes the fetched document
     * 4. Resolver compares: fetched hash == documentHash? → Authentic!
     * 
     * GAS COST: ~70,000 - 90,000 gas (depending on DID and URI string lengths)
     * 
     * SECURITY CONSIDERATIONS:
     * - Only the caller can register a DID for themselves
     * - No one can register a DID for someone else
     * - DID format validation is simplified (add more checks in production)
     * - documentURI should point to immutable content (IPFS) or trusted source
     */
    function registerDID(
        string memory did,
        bytes32 documentHash,
        string memory documentURI
    ) external {
        // WHY CHECK: Prevent overwriting existing DIDs
        // This ensures DID uniqueness (critical for identity systems)
        require(
            _dids[did].controller == address(0),
            "DIDRegistry: DID already registered"
        );

        // WHY CHECK: Simplified - one address = one DID
        // In production, you might allow multiple DIDs per address
        require(
            bytes(_controllerToDID[msg.sender]).length == 0,
            "DIDRegistry: Address already has a DID"
        );

        // WHY CHECK: documentURI is critical - without it, resolvers can't fetch the document!
        // This solves the "chicken and egg" problem you identified
        require(
            bytes(documentURI).length > 0,
            "DIDRegistry: documentURI cannot be empty"
        );

        // WHY STORE TIMESTAMP: Useful for auditing and analytics
        uint256 timestamp = block.timestamp;

        // Store the DID record
        // WHY STRUCT: Groups related data together, easier to manage
        _dids[did] = DIDRecord({
            controller: msg.sender,        // The caller owns this DID
            documentHash: documentHash,   // Hash of document (for verification)
            documentURI: documentURI,     // Where to fetch the document (IPFS, HTTP, etc.)
            registeredAt: timestamp,      // When registered
            updatedAt: timestamp          // Initially same as registered
        });

        // Store reverse mapping for efficient lookup
        // WHY: Allows "what DID does this address control?" queries
        _controllerToDID[msg.sender] = did;

        // WHY EMIT EVENT: Cheaper than storage, enables off-chain indexing
        // Includes documentURI so indexers can build DID → Location databases
        emit DIDRegistered(did, msg.sender, documentHash, documentURI);
    }

    /**
     * @notice Updates the DID Document for an existing DID
     * @param did The DID to update
     * @param newDocumentHash The new hash of the DID Document
     * @param newDocumentURI The new location of the DID Document (can be same as before)
     * 
     * @dev Requirements:
     * - DID must exist
     * - Caller must be the DID controller
     * - newDocumentURI must not be empty
     * 
     * WHY ALLOW UPDATES:
     * - DID Documents may need updates (add new keys, services)
     * - When document changes, hash changes
     * - Document may be moved to new location (new IPFS CID, etc.)
     * - This allows DID evolution without re-registration
     * 
     * USE CASES:
     * - Adding a new public key for authentication
     * - Adding a service endpoint (e.g., credential wallet)
     * - Updating recovery mechanisms
     * - Moving document to new storage location
     * 
     * SECURITY:
     * - Only the controller can update
     * - Old hash is preserved in event for audit trail
     * - Both hash and URI are updated atomically
     */
    function updateDIDDocument(
        string memory did,
        bytes32 newDocumentHash,
        string memory newDocumentURI
    ) external {
        // WHY CHECK: Ensure DID exists
        DIDRecord storage record = _dids[did];
        require(
            record.controller != address(0),
            "DIDRegistry: DID does not exist"
        );

        // WHY CHECK: Only controller can update
        // This is critical for security - prevents unauthorized changes
        require(
            record.controller == msg.sender,
            "DIDRegistry: Only controller can update"
        );

        // WHY CHECK: documentURI is required for resolution
        require(
            bytes(newDocumentURI).length > 0,
            "DIDRegistry: documentURI cannot be empty"
        );

        // WHY STORE OLD HASH: For audit trail and event emission
        bytes32 previousHash = record.documentHash;

        // Update both hash and URI atomically
        // WHY ATOMIC: Ensures hash and URI always match
        record.documentHash = newDocumentHash;
        record.documentURI = newDocumentURI;
        record.updatedAt = block.timestamp;

        // WHY EMIT EVENT: Track all updates for auditing
        emit DIDDocumentUpdated(did, newDocumentHash, newDocumentURI, previousHash);
    }

    /**
     * @notice Transfers DID ownership to a new address
     * @param did The DID to transfer
     * @param newController The new controller address
     * 
     * @dev Requirements:
     * - DID must exist
     * - Caller must be current controller
     * - New controller must not already have a DID (simplified)
     * 
     * WHY ALLOW TRANSFERS:
     * - Users may migrate to new wallets
     * - Organizations may transfer control
     * - Important for DID recovery scenarios
     * 
     * SECURITY CONSIDERATIONS:
     * - Only current controller can transfer
     * - Consider adding a delay/confirmation for production
     * - Consider multi-sig for important DIDs
     */
    function transferDIDOwnership(string memory did, address newController)
        external
    {
        // WHY CHECK: Ensure DID exists
        DIDRecord storage record = _dids[did];
        require(
            record.controller != address(0),
            "DIDRegistry: DID does not exist"
        );

        // WHY CHECK: Only controller can transfer
        require(
            record.controller == msg.sender,
            "DIDRegistry: Only controller can transfer"
        );

        // WHY CHECK: Prevent overwriting (simplified - one DID per address)
        require(
            bytes(_controllerToDID[newController]).length == 0,
            "DIDRegistry: New controller already has a DID"
        );

        // WHY STORE OLD CONTROLLER: For event emission
        address previousController = record.controller;

        // Update reverse mapping
        delete _controllerToDID[previousController];
        _controllerToDID[newController] = did;

        // Transfer ownership
        record.controller = newController;
        record.updatedAt = block.timestamp;

        // WHY EMIT EVENT: Track ownership changes
        emit DIDOwnershipTransferred(did, previousController, newController);
    }

    /**
     * @notice Resolves a DID to its record
     * @param did The DID to resolve
     * @return controller The address that controls this DID
     * @return documentHash The hash of the DID Document (for verification)
     * @return documentURI The location where the DID Document can be fetched
     * @return registeredAt When the DID was registered
     * @return updatedAt When the DID was last updated
     * 
     * WHAT IS DID RESOLUTION:
     * - The process of looking up a DID to get its information
     * - Similar to DNS lookup (domain name -> IP address)
     * - Here: DID -> DID Document hash, URI, and controller
     * 
     * COMPLETE RESOLUTION FLOW:
     * 1. Call resolveDID() → Get documentHash and documentURI
     * 2. Fetch document from documentURI (IPFS, HTTP, etc.)
     * 3. Hash the fetched document (SHA-256)
     * 4. Compare: fetched hash == documentHash?
     *    - If YES → Document is authentic ✓
     *    - If NO → Document was tampered with ✗
     * 
     * WHY THIS FUNCTION:
     * - Enables verifiers to resolve issuer DIDs
     * - Allows checking DID ownership
     * - Provides ALL information needed for complete resolution
     * - documentURI solves the "where to fetch" problem you identified!
     * 
     * GAS COST: ~2,100 gas (warm storage read)
     */
    function resolveDID(string memory did)
        external
        view
        returns (
            address controller,
            bytes32 documentHash,
            string memory documentURI,
            uint256 registeredAt,
            uint256 updatedAt
        )
    {
        // WHY CHECK: Return zero values if DID doesn't exist
        // This allows callers to check if DID exists
        DIDRecord memory record = _dids[did];
        
        return (
            record.controller,
            record.documentHash,
            record.documentURI,
            record.registeredAt,
            record.updatedAt
        );
    }

    /**
     * @notice Gets the DID controlled by an address
     * @param controller The address to look up
     * @return did The DID controlled by this address (empty if none)
     * 
     * WHY THIS FUNCTION:
     * - Frontend: "What's my DID?"
     * - Reverse lookup: Address -> DID
     * - Useful for wallet integrations
     * 
     * NOTE: Returns empty string if address has no DID
     */
    function getDIDByController(address controller)
        external
        view
        returns (string memory)
    {
        return _controllerToDID[controller];
    }

    /**
     * @notice Checks if a DID exists
     * @param did The DID to check
     * @return exists True if DID is registered, false otherwise
     * 
     * WHY THIS FUNCTION:
     * - Simple boolean check (more gas efficient than full resolution)
     * - Useful for validation before operations
     * - Clearer intent than checking controller != address(0)
     */
    function didExists(string memory did) external view returns (bool) {
        return _dids[did].controller != address(0);
    }

    /**
     * @notice Checks if an address controls a DID
     * @param controller The address to check
     * @return hasDID True if address controls a DID, false otherwise
     * 
     * WHY THIS FUNCTION:
     * - Quick check before registration
     * - Useful for UI state management
     * - More readable than checking getDIDByController result
     */
    function hasDID(address controller) external view returns (bool) {
        return bytes(_controllerToDID[controller]).length > 0;
    }
}

