import { expect } from "chai";
import { ethers } from "hardhat";
import { DIDRegistry } from "../../typechain-types";

/**
 * @title DID Registry Test Suite
 * @notice Comprehensive tests for the DID Registry contract
 * @dev These tests demonstrate how to interact with the DID Registry
 * 
 * LEARNING OBJECTIVES:
 * - Understand how to test smart contracts
 * - Learn how to interact with the DID Registry
 * - See real-world usage patterns
 * - Understand edge cases and security considerations
 */

describe("DIDRegistry", function () {
  let didRegistry: DIDRegistry;
  let owner: any;
  let user1: any;
  let user2: any;

  // Sample DID and document hash for testing
  const sampleDID = "did:ethr:0x1234567890123456789012345678901234567890";
  const sampleDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("sample-did-document"));

  /**
   * @notice Setup function that runs before each test
   * @dev This is a common pattern in testing - setup fresh state for each test
   * 
   * WHY THIS PATTERN:
   * - Ensures tests don't interfere with each other
   * - Fresh contract deployment for each test
   * - Clean slate for predictable testing
   */
  beforeEach(async function () {
    // Get signers (test accounts)
    // WHY: We need accounts to test with
    // Hardhat provides 20 test accounts by default
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    // WHY: Each test gets a fresh contract instance
    const DIDRegistryFactory = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistryFactory.deploy();
    await didRegistry.waitForDeployment();
  });

  /**
   * @notice Test: Registering a new DID
   * @dev This test demonstrates the basic registration flow
   * 
   * WHAT WE'RE TESTING:
   * - Can register a DID successfully
   * - Event is emitted correctly
   * - DID can be resolved after registration
   */
  describe("Registration", function () {
    it("Should register a new DID", async function () {
      // WHY: We use user1 to register (not owner)
      // This tests that anyone can register their own DID
      await expect(
        didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash)
      )
        .to.emit(didRegistry, "DIDRegistered")
        .withArgs(sampleDID, user1.address, sampleDocumentHash);

      // WHY: Verify the registration worked
      // We check that we can resolve the DID and get correct information
      const [controller, documentHash] = await didRegistry.resolveDID(sampleDID);
      
      expect(controller).to.equal(user1.address);
      expect(documentHash).to.equal(sampleDocumentHash);
    });

    it("Should prevent duplicate DID registration", async function () {
      // WHY: Register first time (should succeed)
      await didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash);

      // WHY: Try to register same DID again (should fail)
      // This tests the uniqueness requirement
      await expect(
        didRegistry.connect(user2).registerDID(sampleDID, sampleDocumentHash)
      ).to.be.revertedWith("DIDRegistry: DID already registered");
    });

    it("Should prevent one address from registering multiple DIDs", async function () {
      // WHY: Register first DID (should succeed)
      await didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash);

      // WHY: Try to register second DID with same address (should fail)
      // This tests the one-DID-per-address rule (simplified for learning)
      const secondDID = "did:ethr:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      await expect(
        didRegistry.connect(user1).registerDID(secondDID, sampleDocumentHash)
      ).to.be.revertedWith("DIDRegistry: Address already has a DID");
    });

    it("Should allow different addresses to register different DIDs", async function () {
      // WHY: This tests that multiple users can have their own DIDs
      const user1DID = "did:ethr:0x1111111111111111111111111111111111111111";
      const user2DID = "did:ethr:0x2222222222222222222222222222222222222222";

      await didRegistry.connect(user1).registerDID(user1DID, sampleDocumentHash);
      await didRegistry.connect(user2).registerDID(user2DID, sampleDocumentHash);

      // WHY: Verify both DIDs exist and are controlled by correct addresses
      expect(await didRegistry.didExists(user1DID)).to.be.true;
      expect(await didRegistry.didExists(user2DID)).to.be.true;
      
      const user1Controller = (await didRegistry.resolveDID(user1DID))[0];
      const user2Controller = (await didRegistry.resolveDID(user2DID))[0];
      
      expect(user1Controller).to.equal(user1.address);
      expect(user2Controller).to.equal(user2.address);
    });
  });

  /**
   * @notice Test: Updating DID Documents
   * @dev Tests the update functionality
   */
  describe("Updates", function () {
    beforeEach(async function () {
      // WHY: Setup - register a DID first
      // This is a common pattern: setup state, then test operations on that state
      await didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash);
    });

    it("Should allow controller to update DID document hash", async function () {
      // WHY: Create a new document hash (simulating document update)
      const newDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("updated-document"));

      // WHY: Update should succeed and emit event
      await expect(
        didRegistry.connect(user1).updateDIDDocument(sampleDID, newDocumentHash)
      )
        .to.emit(didRegistry, "DIDDocumentUpdated")
        .withArgs(sampleDID, newDocumentHash, sampleDocumentHash);

      // WHY: Verify the update worked
      const [, updatedHash] = await didRegistry.resolveDID(sampleDID);
      expect(updatedHash).to.equal(newDocumentHash);
    });

    it("Should prevent non-controller from updating", async function () {
      // WHY: This tests access control - only controller can update
      const newDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("malicious-update"));

      // WHY: user2 should not be able to update user1's DID
      await expect(
        didRegistry.connect(user2).updateDIDDocument(sampleDID, newDocumentHash)
      ).to.be.revertedWith("DIDRegistry: Only controller can update");
    });

    it("Should prevent updating non-existent DID", async function () {
      // WHY: This tests error handling for invalid operations
      const nonExistentDID = "did:ethr:0x0000000000000000000000000000000000000000";
      const newDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("update"));

      await expect(
        didRegistry.connect(user1).updateDIDDocument(nonExistentDID, newDocumentHash)
      ).to.be.revertedWith("DIDRegistry: DID does not exist");
    });
  });

  /**
   * @notice Test: Ownership Transfer
   * @dev Tests transferring DID control to another address
   */
  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      // WHY: Setup - register a DID first
      await didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash);
    });

    it("Should allow controller to transfer ownership", async function () {
      // WHY: Transfer should succeed and emit event
      await expect(
        didRegistry.connect(user1).transferDIDOwnership(sampleDID, user2.address)
      )
        .to.emit(didRegistry, "DIDOwnershipTransferred")
        .withArgs(sampleDID, user1.address, user2.address);

      // WHY: Verify ownership changed
      const [controller] = await didRegistry.resolveDID(sampleDID);
      expect(controller).to.equal(user2.address);

      // WHY: Verify reverse mapping updated
      const didByController = await didRegistry.getDIDByController(user2.address);
      expect(didByController).to.equal(sampleDID);
    });

    it("Should prevent non-controller from transferring", async function () {
      // WHY: This tests access control
      await expect(
        didRegistry.connect(user2).transferDIDOwnership(sampleDID, user2.address)
      ).to.be.revertedWith("DIDRegistry: Only controller can transfer");
    });

    it("Should prevent transferring to address that already has a DID", async function () {
      // WHY: Setup - give user2 their own DID first
      const user2DID = "did:ethr:0x2222222222222222222222222222222222222222";
      await didRegistry.connect(user2).registerDID(user2DID, sampleDocumentHash);

      // WHY: user1 should not be able to transfer to user2 (who already has a DID)
      // This tests the one-DID-per-address rule
      await expect(
        didRegistry.connect(user1).transferDIDOwnership(sampleDID, user2.address)
      ).to.be.revertedWith("DIDRegistry: New controller already has a DID");
    });
  });

  /**
   * @notice Test: Resolution and Lookup
   * @dev Tests querying DID information
   */
  describe("Resolution", function () {
    beforeEach(async function () {
      // WHY: Setup - register a DID
      await didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash);
    });

    it("Should resolve existing DID", async function () {
      // WHY: Test the resolution function
      const [controller, documentHash, registeredAt, updatedAt] = 
        await didRegistry.resolveDID(sampleDID);

      expect(controller).to.equal(user1.address);
      expect(documentHash).to.equal(sampleDocumentHash);
      expect(registeredAt).to.be.greaterThan(0);
      expect(updatedAt).to.equal(registeredAt); // Initially same
    });

    it("Should return zero values for non-existent DID", async function () {
      // WHY: Test error handling - what happens when DID doesn't exist?
      const nonExistentDID = "did:ethr:0x0000000000000000000000000000000000000000";
      const [controller, documentHash] = await didRegistry.resolveDID(nonExistentDID);

      expect(controller).to.equal(ethers.ZeroAddress);
      expect(documentHash).to.equal(ethers.ZeroHash);
    });

    it("Should check if DID exists", async function () {
      // WHY: Test the convenience function
      expect(await didRegistry.didExists(sampleDID)).to.be.true;
      
      const nonExistentDID = "did:ethr:0x0000000000000000000000000000000000000000";
      expect(await didRegistry.didExists(nonExistentDID)).to.be.false;
    });

    it("Should get DID by controller address", async function () {
      // WHY: Test reverse lookup
      const did = await didRegistry.getDIDByController(user1.address);
      expect(did).to.equal(sampleDID);
    });

    it("Should check if address has a DID", async function () {
      // WHY: Test convenience function
      expect(await didRegistry.hasDID(user1.address)).to.be.true;
      expect(await didRegistry.hasDID(user2.address)).to.be.false;
    });
  });

  /**
   * @notice Test: Edge Cases and Security
   * @dev Tests security considerations and edge cases
   */
  describe("Security and Edge Cases", function () {
    it("Should handle empty string DID", async function () {
      // WHY: Test input validation
      // In production, you'd want stricter validation
      const emptyDID = "";
      await expect(
        didRegistry.connect(user1).registerDID(emptyDID, sampleDocumentHash)
      ).to.not.be.reverted; // Current implementation allows this (simplified)
    });

    it("Should handle very long DID strings", async function () {
      // WHY: Test gas costs and limits
      // Long strings cost more gas
      const longDID = "did:ethr:" + "0".repeat(100);
      await expect(
        didRegistry.connect(user1).registerDID(longDID, sampleDocumentHash)
      ).to.not.be.reverted;
    });

    it("Should maintain correct timestamps", async function () {
      // WHY: Test that timestamps are recorded correctly
      const beforeRegistration = Math.floor(Date.now() / 1000);
      
      await didRegistry.connect(user1).registerDID(sampleDID, sampleDocumentHash);
      
      const [, , registeredAt] = await didRegistry.resolveDID(sampleDID);
      const afterRegistration = Math.floor(Date.now() / 1000);

      // WHY: Timestamp should be between before and after
      // Note: block.timestamp may be slightly different from Date.now()
      expect(registeredAt).to.be.greaterThanOrEqual(beforeRegistration - 5); // Allow 5s variance
      expect(registeredAt).to.be.lessThanOrEqual(afterRegistration + 5);
    });
  });
});

