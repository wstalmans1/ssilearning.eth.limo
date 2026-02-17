# Phase 2 Implementation Guide: DID Registry

Welcome to Phase 2! In this phase, you'll implement and understand a Decentralized Identifier (DID) Registry on Ethereum.

## 📋 Prerequisites

Before starting, make sure you've completed:
- ✅ Phase 0: Foundation concepts
- ✅ Phase 1: SSI architecture understanding
- ✅ Read the `02_LEARNING_PATH.md` document

## 🎯 Learning Objectives

By the end of this phase, you will:
1. Understand what DIDs are and why they're important
2. Know how to store DID information on-chain efficiently
3. Implement a DID registry smart contract
4. Test the registry functionality
5. Deploy the contract to a test network

## 📖 Step-by-Step Guide

### Step 1: Review the Contract

First, let's examine the DID Registry contract:

**File**: `packages/contracts/contracts/SSI/DIDRegistry.sol`

**Key Questions to Answer** (think about these as you read):
1. Why do we store document hashes instead of full documents?
2. Why is access control important for DID updates?
3. What information do we need to store for each DID?

**Take your time** reading through the annotations. Every comment explains:
- **WHAT** the code does
- **HOW** it works
- **WHY** we made these design choices

### Step 2: Understand the Data Structures

The contract uses two main data structures:

#### 1. DIDRecord Struct
```solidity
struct DIDRecord {
    address controller;        // Who controls this DID
    bytes32 documentHash;     // Hash of the DID Document
    uint256 registeredAt;     // Registration timestamp
    uint256 updatedAt;       // Last update timestamp
}
```

**Why this structure?**
- Groups related data together
- Makes code more readable
- Efficient storage pattern

#### 2. Mappings
```solidity
mapping(string => DIDRecord) private _dids;              // DID -> Record
mapping(address => string) private _controllerToDID;      // Address -> DID
```

**Why two mappings?**
- Forward lookup: "What's the info for this DID?"
- Reverse lookup: "What DID does this address control?"

### Step 3: Compile the Contract

Let's compile the contract to make sure everything is correct:

```bash
cd packages/contracts
pnpm contracts:compile
```

**What happens:**
- Solidity compiler checks syntax
- Generates bytecode (what runs on-chain)
- Generates ABI (Application Binary Interface - how to call functions)
- Creates TypeScript types for testing

**If you get errors:**
- Check Solidity version (should be ^0.8.28)
- Make sure all imports are correct
- Verify file structure matches

### Step 4: Run the Tests

Now let's run the test suite to see how the contract works:

```bash
pnpm contracts:test --grep "DIDRegistry"
```

**What the tests demonstrate:**
1. **Registration**: How to register a new DID
2. **Updates**: How to update DID documents
3. **Transfers**: How to transfer DID ownership
4. **Resolution**: How to look up DID information
5. **Security**: Edge cases and access control

**Read the test file** (`test/SSI/DIDRegistry.test.ts`) - it has detailed comments explaining each test.

### Step 5: Understand Gas Costs

Let's analyze the gas costs:

**Registration**: ~50,000 - 70,000 gas
- Why so much? We're storing data in two mappings and emitting an event

**Update**: ~30,000 - 40,000 gas
- Cheaper because we're only updating existing storage

**Resolution (read)**: ~2,100 gas (warm) or ~100 gas (cold)
- Very cheap! Reads don't modify state

**Why this matters:**
- Users pay gas fees
- We want to minimize costs
- That's why we store hashes, not full documents

### Step 6: Deploy to Local Network

Let's deploy to a local Hardhat network:

```bash
# Start local node (in one terminal)
pnpm anvil:start

# Deploy (in another terminal)
pnpm --filter contracts exec hardhat deploy --network localhost --tags DIDRegistry
```

**What happens:**
- Contract is compiled
- Deployed to local blockchain
- You get a contract address
- Contract is ready to use!

### Step 7: Interact with the Contract

Let's interact with the deployed contract. Create a simple script:

**File**: `packages/contracts/scripts/interact-did-registry.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  // Get the deployed contract address from deployments
  const { deployments } = await import("hardhat");
  const didRegistryAddress = (await deployments.get("DIDRegistry")).address;
  
  // Get contract instance
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = DIDRegistry.attach(didRegistryAddress);
  
  // Get a signer (your account)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Create a DID
  const did = `did:ethr:${signer.address}`;
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes("my-did-document"));
  
  // Register the DID
  console.log("Registering DID:", did);
  const tx = await didRegistry.connect(signer).registerDID(did, documentHash);
  await tx.wait();
  console.log("✅ DID registered!");
  
  // Resolve the DID
  const [controller, hash] = await didRegistry.resolveDID(did);
  console.log("Controller:", controller);
  console.log("Document Hash:", hash);
}

main().catch(console.error);
```

Run it:
```bash
pnpm --filter contracts exec hardhat run scripts/interact-did-registry.ts --network localhost
```

### Step 8: Deploy to Testnet (Optional)

Ready for a testnet deployment?

```bash
# Make sure you have .env.hardhat.local configured
pnpm --filter contracts exec hardhat deploy --network sepolia --tags DIDRegistry
```

**What you need:**
- Sepolia ETH (get from faucet)
- RPC URL in `.env.hardhat.local`
- Private key or mnemonic

## 🤔 Reflection Questions

After completing this phase, answer these questions:

1. **Why do we use hashes instead of storing full DID Documents?**
   - Think about gas costs
   - Think about privacy
   - Think about flexibility

2. **What happens if someone tries to register a DID that already exists?**
   - How does the contract prevent this?
   - Why is this important?

3. **Why can only the controller update a DID?**
   - What would happen if anyone could update?
   - How does this relate to self-sovereignty?

4. **What's the difference between `didExists()` and `resolveDID()`?**
   - When would you use each?
   - Which is more gas efficient?

## 🎓 Key Takeaways

1. **DIDs are self-sovereign identifiers** - you control them
2. **On-chain storage is expensive** - store only what's necessary
3. **Access control is critical** - only owners can modify their DIDs
4. **Events are cheaper than storage** - use them for historical data
5. **Mappings enable efficient lookups** - both forward and reverse

## 🚀 Next Steps

Once you're comfortable with Phase 2:
1. ✅ Understand all the code and annotations
2. ✅ Run all tests successfully
3. ✅ Deploy and interact with the contract
4. ✅ Answer the reflection questions
5. ✅ Move to Phase 3: Verifiable Credentials

## 📚 Additional Reading

- [W3C DID Specification](https://www.w3.org/TR/did-core/)
- [Ethereum DID Method](https://github.com/decentralized-identity/ethr-did-resolver)
- [Gas Optimization Tips](https://docs.soliditylang.org/en/latest/gas-optimization.html)

## 💡 Experiment Ideas

Try these to deepen your understanding:

1. **Modify the contract** to allow multiple DIDs per address
2. **Add a function** to get all DIDs (hint: you'll need events)
3. **Implement DID deactivation** (marking a DID as inactive)
4. **Add DID expiration** (DIDs that expire after a certain time)

---

**Remember**: Take your time, experiment, and don't hesitate to ask questions. Understanding the fundamentals is more important than rushing ahead!

