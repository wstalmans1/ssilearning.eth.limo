# Phase 3 Implementation Guide: Verifiable Credentials

Welcome to Phase 3! In this phase, you'll implement Verifiable Credentials (VCs) that build on the DID Registry from Phase 2.

## 📋 Prerequisites

Before starting, make sure you've completed:
- ✅ Phase 0: Foundation concepts
- ✅ Phase 1: SSI architecture understanding
- ✅ Phase 2: DID Registry (contract deployed, DApp working)
- ✅ You can register and resolve DIDs

## 🎯 Learning Objectives

By the end of this phase, you will:
1. Understand the structure of Verifiable Credentials (W3C standard)
2. Create and sign credentials off-chain
3. Store credential hashes on-chain for revocation checking
4. Verify credentials cryptographically
5. Build Issuer and Verifier flows in the DApp

## 📖 What is a Verifiable Credential?

A **Verifiable Credential** is a tamper-evident credential that:
- Contains **claims** about a subject (e.g. "Alice has a degree in CS")
- Has **cryptographic proof** from an issuer
- Can be **verified without contacting** the issuer
- Follows the [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)

### The Three Actors

```
   Issuer                    Holder                    Verifier
   (University)     →       (Student)        →         (Employer)
   Creates degree   →   Stores in wallet   →   Checks degree is valid
```

## 📖 Step-by-Step Guide

### Step 1: Understand the VC Structure

A minimal Verifiable Credential looks like this:

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "UniversityDegreeCredential"],
  "issuer": "did:ethr:0xIssuerAddress",
  "issuanceDate": "2024-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:ethr:0xHolderAddress",
    "degree": "Bachelor of Science",
    "university": "Example University"
  },
  "proof": {
    "type": "EthereumEoaSignature2020",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:ethr:0xIssuerAddress#controller",
    "created": "2024-01-01T00:00:00Z",
    "signatureValue": "0x..."
  }
}
```

**Key components:**
- **issuer**: DID of the entity that created the credential (must be in our DID Registry)
- **credentialSubject**: The holder and the claims
- **proof**: Cryptographic signature — verifier checks this without calling the issuer

### Step 2: Review the CredentialRegistry Contract

**File**: `packages/contracts/contracts/SSI/CredentialRegistry.sol`

**What it does:**
- Stores credential hashes on-chain (for revocation lookup)
- Allows issuers to register credentials when issuing
- Allows issuers to revoke credentials
- Verifiers can check `isRevoked(credentialHash)` before trusting a credential

**Why hashes?**
- Full VCs contain personal data → store off-chain (IPFS, holder's wallet)
- On-chain we only need a **revocation index**: hash → revoked?
- Same pattern as DID Documents: hash for verification, URI for location

### Step 3: The Credential Lifecycle

#### Issuance Flow
1. Holder requests credential from Issuer (e.g. student requests transcript)
2. Issuer creates VC JSON with claims
3. Issuer signs the VC with their Ethereum key (the one controlling their DID)
4. Issuer calls `registerCredential(credentialHash)` on CredentialRegistry
5. Issuer gives the signed VC to the Holder (QR, link, etc.)

#### Verification Flow
1. Holder presents VC to Verifier (QR, file, etc.)
2. Verifier fetches credential hash from the VC
3. Verifier calls `isRevoked(credentialHash)` on CredentialRegistry
4. Verifier resolves Issuer DID to get public key
5. Verifier checks the signature on the VC
6. If all pass → credential is valid

### Step 4: Compile and Test

```bash
cd packages/contracts
pnpm contracts:compile
pnpm contracts:test --grep "CredentialRegistry"
```

### Step 5: Deploy

```bash
# CredentialRegistry needs the DIDRegistry address
pnpm --filter contracts exec hardhat deploy --network sepolia --tags CredentialRegistry
```

### Step 6: DApp Pages

#### Issue Credential (Issuer role)
- Select credential type (e.g. "Simple Attestation")
- Enter subject DID (the holder)
- Enter claims (key-value)
- Sign with your wallet (you must have a DID)
- Register hash on-chain
- Download or copy the signed VC

#### Verify Credential (Verifier role)
- Paste or upload a VC JSON
- App checks: signature, revocation status, issuer DID
- Shows validity and extracted claims

## 🤔 Reflection Questions

1. **Why do we store only the hash on-chain?**
   - Think about gas, privacy, and data size

2. **What happens if an issuer loses their key?**
   - Can they revoke credentials they issued?

3. **Why must the issuer have a DID?**
   - How does the verifier know which public key to use?

4. **What is credential binding?**
   - Why do we include the holder's DID in credentialSubject?

## 🎓 Key Takeaways

1. **VCs are off-chain** — store in IPFS or wallet; on-chain is for revocation/settlement
2. **Signatures enable trust** — verifier doesn't need to call issuer
3. **Revocation is critical** — credentials can become invalid (degree revoked, license expired)
4. **DIDs connect everything** — issuer and subject are DIDs; we resolve them for keys

## 🚀 Next Steps

Once Phase 3 is complete:
1. Try issuing a credential to yourself
2. Verify it in the Verify tab
3. Revoke it and verify again — it should fail
4. Move to Phase 4: richer schemas and selective disclosure

## 📚 Additional Reading

- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [EthereumEoaSignature2020](https://w3c.github.io/vc-di-ecdsa/#ethereum-eoa-signature-2020)
- [DIF Credential Status](https://identity.foundation/credential-status/)
