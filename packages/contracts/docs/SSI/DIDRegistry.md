# Solidity API

## DIDRegistry

A decentralized registry for Decentralized Identifiers (DIDs) on Ethereum

_This contract implements Phase 2 of the SSI learning path - DID Registry

WHAT THIS CONTRACT DOES:
- Registers DIDs (Decentralized Identifiers) on-chain
- Associates Ethereum addresses with DIDs
- Stores DID Document hashes (not full documents for gas efficiency)
- Allows DID owners to update their DID Document hash
- Enables DID resolution (looking up a DID to get its document hash)

WHY WE NEED THIS:
1. Decentralization: No single entity controls identity registration
2. Immutability: Once registered, DID ownership can't be falsified
3. Verifiability: Anyone can verify who owns a DID
4. On-chain Resolution: Smart contracts can resolve DIDs to documents

HOW IT WORKS:
- Each DID is associated with an Ethereum address (the DID controller)
- DID Documents are stored off-chain (IPFS, databases, etc.)
- Only the hash of the DID Document is stored on-chain (saves gas)
- The hash allows verification that a DID Document hasn't been tampered with

LEARNING NOTES:
- This is a simplified DID registry for learning purposes
- Real-world DID registries may have additional features (key rotation, service endpoints, etc.)
- We use the "ethr" DID method (did:ethr:0x...)_

### DIDRegistered

```solidity
event DIDRegistered(string did, address controller, bytes32 documentHash, string documentURI)
```

Emitted when a new DID is registered

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The Decentralized Identifier (e.g., "did:ethr:0x123...") |
| controller | address | The Ethereum address that controls this DID |
| documentHash | bytes32 | The hash of the DID Document (for verification) |
| documentURI | string | The location where the DID Document can be fetched WHY WE EMIT EVENTS: - Events are cheaper than storage (for historical data) - Frontend apps can listen to events for real-time updates - Events provide a searchable history of DID registrations - documentURI in event allows off-chain indexing without querying storage |

### DIDDocumentUpdated

```solidity
event DIDDocumentUpdated(string did, bytes32 newDocumentHash, string newDocumentURI, bytes32 previousDocumentHash)
```

Emitted when a DID Document is updated

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The DID being updated |
| newDocumentHash | bytes32 | The new hash of the DID Document |
| newDocumentURI | string | The new location of the DID Document |
| previousDocumentHash | bytes32 | The previous hash (for tracking changes) WHY ALLOW UPDATES: - DID Documents may need to be updated (new keys, new services) - The hash changes when the document changes - The URI may change if document is moved to new location - We track both old and new values for audit purposes |

### DIDOwnershipTransferred

```solidity
event DIDOwnershipTransferred(string did, address previousController, address newController)
```

Emitted when DID ownership is transferred

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The DID being transferred |
| previousController | address | The previous owner |
| newController | address | The new owner WHY ALLOW TRANSFERS: - Users may want to migrate to a new wallet - Organizations may transfer DID control - Important for DID recovery scenarios |

### DIDRecord

_Structure to store DID information

WHY THIS STRUCTURE:
- controller: The Ethereum address that owns/controls this DID
- documentHash: Hash of the DID Document (for verification)
- documentURI: Location where the DID Document can be fetched (IPFS CID, HTTP URL, etc.)
- registeredAt: Timestamp of registration (useful for analytics)
- updatedAt: Last update timestamp (for tracking changes)

WHY STORE documentURI:
- CRITICAL: Without this, resolvers don't know WHERE to fetch the document!
- Enables complete DID resolution: hash tells you WHAT to verify, URI tells you WHERE to get it
- Can store IPFS CID (ipfs://Qm...), HTTP URL (https://...), or any URI format

TRADE-OFF:
- Costs extra gas (~20,000 gas for string storage)
- But enables direct on-chain resolution without off-chain infrastructure
- Alternative: Store URI in events (cheaper but requires indexing)

WHY STORE TIMESTAMPS:
- Useful for auditing and compliance
- Can be used to detect suspicious activity
- Helps with credential expiration logic_

```solidity
struct DIDRecord {
  address controller;
  bytes32 documentHash;
  string documentURI;
  uint256 registeredAt;
  uint256 updatedAt;
}
```

### registerDID

```solidity
function registerDID(string did, bytes32 documentHash, string documentURI) external
```

Registers a new DID

_Requirements:
- DID must not already be registered
- Caller must not already control a DID
- DID format should be validated (simplified here for learning)
- documentURI should not be empty (enables resolution)

HOW IT WORKS:
1. Check if DID already exists (revert if yes)
2. Check if caller already has a DID (revert if yes - simplified)
3. Validate documentURI is not empty (critical for resolution)
4. Store the DID record (including hash AND URI)
5. Store reverse mapping (address -> DID)
6. Emit event for frontend/off-chain systems

COMPLETE RESOLUTION FLOW:
1. Resolver calls resolveDID() → gets documentHash and documentURI
2. Resolver fetches document from documentURI (IPFS, HTTP, etc.)
3. Resolver hashes the fetched document
4. Resolver compares: fetched hash == documentHash? → Authentic!

GAS COST: ~70,000 - 90,000 gas (depending on DID and URI string lengths)

SECURITY CONSIDERATIONS:
- Only the caller can register a DID for themselves
- No one can register a DID for someone else
- DID format validation is simplified (add more checks in production)
- documentURI should point to immutable content (IPFS) or trusted source_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The Decentralized Identifier (must follow format: "did:ethr:0x...") |
| documentHash | bytes32 | The hash of the DID Document (SHA-256 recommended) |
| documentURI | string | The location where the DID Document can be fetched                    Examples: "ipfs://QmXoypizj..." or "https://example.com/did-docs/123" |

### updateDIDDocument

```solidity
function updateDIDDocument(string did, bytes32 newDocumentHash, string newDocumentURI) external
```

Updates the DID Document for an existing DID

_Requirements:
- DID must exist
- Caller must be the DID controller
- newDocumentURI must not be empty

WHY ALLOW UPDATES:
- DID Documents may need updates (add new keys, services)
- When document changes, hash changes
- Document may be moved to new location (new IPFS CID, etc.)
- This allows DID evolution without re-registration

USE CASES:
- Adding a new public key for authentication
- Adding a service endpoint (e.g., credential wallet)
- Updating recovery mechanisms
- Moving document to new storage location

SECURITY:
- Only the controller can update
- Old hash is preserved in event for audit trail
- Both hash and URI are updated atomically_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The DID to update |
| newDocumentHash | bytes32 | The new hash of the DID Document |
| newDocumentURI | string | The new location of the DID Document (can be same as before) |

### transferDIDOwnership

```solidity
function transferDIDOwnership(string did, address newController) external
```

Transfers DID ownership to a new address

_Requirements:
- DID must exist
- Caller must be current controller
- New controller must not already have a DID (simplified)

WHY ALLOW TRANSFERS:
- Users may migrate to new wallets
- Organizations may transfer control
- Important for DID recovery scenarios

SECURITY CONSIDERATIONS:
- Only current controller can transfer
- Consider adding a delay/confirmation for production
- Consider multi-sig for important DIDs_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The DID to transfer |
| newController | address | The new controller address |

### resolveDID

```solidity
function resolveDID(string did) external view returns (address controller, bytes32 documentHash, string documentURI, uint256 registeredAt, uint256 updatedAt)
```

Resolves a DID to its record

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The DID to resolve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| controller | address | The address that controls this DID |
| documentHash | bytes32 | The hash of the DID Document (for verification) |
| documentURI | string | The location where the DID Document can be fetched |
| registeredAt | uint256 | When the DID was registered |
| updatedAt | uint256 | When the DID was last updated WHAT IS DID RESOLUTION: - The process of looking up a DID to get its information - Similar to DNS lookup (domain name -> IP address) - Here: DID -> DID Document hash, URI, and controller COMPLETE RESOLUTION FLOW: 1. Call resolveDID() → Get documentHash and documentURI 2. Fetch document from documentURI (IPFS, HTTP, etc.) 3. Hash the fetched document (SHA-256) 4. Compare: fetched hash == documentHash?    - If YES → Document is authentic ✓    - If NO → Document was tampered with ✗ WHY THIS FUNCTION: - Enables verifiers to resolve issuer DIDs - Allows checking DID ownership - Provides ALL information needed for complete resolution - documentURI solves the "where to fetch" problem you identified! GAS COST: ~2,100 gas (warm storage read) |

### getDIDByController

```solidity
function getDIDByController(address controller) external view returns (string)
```

Gets the DID controlled by an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| controller | address | The address to look up |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | did The DID controlled by this address (empty if none) WHY THIS FUNCTION: - Frontend: "What's my DID?" - Reverse lookup: Address -> DID - Useful for wallet integrations NOTE: Returns empty string if address has no DID |

### didExists

```solidity
function didExists(string did) external view returns (bool)
```

Checks if a DID exists

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | string | The DID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | exists True if DID is registered, false otherwise WHY THIS FUNCTION: - Simple boolean check (more gas efficient than full resolution) - Useful for validation before operations - Clearer intent than checking controller != address(0) |

### hasDID

```solidity
function hasDID(address controller) external view returns (bool)
```

Checks if an address controls a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| controller | address | The address to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | hasDID True if address controls a DID, false otherwise WHY THIS FUNCTION: - Quick check before registration - Useful for UI state management - More readable than checking getDIDByController result |

