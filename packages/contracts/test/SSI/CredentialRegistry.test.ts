import { expect } from "chai";
import { ethers } from "hardhat";
import type { CredentialRegistry } from "../../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("CredentialRegistry", function () {
  let credentialRegistry: CredentialRegistry;
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("credential-json"));

  async function deployFixture() {
    const [issuer, other] = await ethers.getSigners();
    const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
    const registry = await CredentialRegistryFactory.deploy();
    return { registry, issuer, other };
  }

  beforeEach(async function () {
    const { registry } = await loadFixture(deployFixture);
    credentialRegistry = registry;
  });

  describe("registerCredential", function () {
    it("allows issuer to register a credential hash", async function () {
      const [issuer] = await ethers.getSigners();
      await credentialRegistry.connect(issuer).registerCredential(sampleHash);
      const [retIssuer, revoked] = await credentialRegistry.getCredential(sampleHash);
      expect(retIssuer).to.equal(issuer.address);
      expect(revoked).to.be.false;
      expect(await credentialRegistry.isRevoked(sampleHash)).to.be.false;
      expect(await credentialRegistry.credentialExists(sampleHash)).to.be.true;
    });

    it("emits CredentialRegistered event", async function () {
      const [issuer] = await ethers.getSigners();
      await expect(credentialRegistry.connect(issuer).registerCredential(sampleHash))
        .to.emit(credentialRegistry, "CredentialRegistered")
        .withArgs(sampleHash, issuer.address);
    });

    it("reverts when credential already registered", async function () {
      const [issuer] = await ethers.getSigners();
      await credentialRegistry.connect(issuer).registerCredential(sampleHash);
      await expect(
        credentialRegistry.connect(issuer).registerCredential(sampleHash)
      ).to.be.revertedWith("CredentialRegistry: already registered");
    });
  });

  describe("revokeCredential", function () {
    beforeEach(async function () {
      const [issuer] = await ethers.getSigners();
      await credentialRegistry.connect(issuer).registerCredential(sampleHash);
    });

    it("allows issuer to revoke", async function () {
      const [issuer] = await ethers.getSigners();
      await credentialRegistry.connect(issuer).revokeCredential(sampleHash);
      expect(await credentialRegistry.isRevoked(sampleHash)).to.be.true;
      const [, revoked] = await credentialRegistry.getCredential(sampleHash);
      expect(revoked).to.be.true;
    });

    it("emits CredentialRevoked event", async function () {
      const [issuer] = await ethers.getSigners();
      await expect(credentialRegistry.connect(issuer).revokeCredential(sampleHash))
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(sampleHash, issuer.address);
    });

    it("reverts when non-issuer tries to revoke", async function () {
      const [, other] = await ethers.getSigners();
      await expect(
        credentialRegistry.connect(other).revokeCredential(sampleHash)
      ).to.be.revertedWith("CredentialRegistry: only issuer can revoke");
    });

    it("reverts when credential not found", async function () {
      const [issuer] = await ethers.getSigners();
      const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(unknownHash)
      ).to.be.revertedWith("CredentialRegistry: credential not found");
    });

    it("reverts when already revoked", async function () {
      const [issuer] = await ethers.getSigners();
      await credentialRegistry.connect(issuer).revokeCredential(sampleHash);
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(sampleHash)
      ).to.be.revertedWith("CredentialRegistry: already revoked");
    });
  });

  describe("getCredential", function () {
    it("returns zeros for unknown credential", async function () {
      const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
      const [issuer, revoked, registeredAt] = await credentialRegistry.getCredential(unknownHash);
      expect(issuer).to.equal(ethers.ZeroAddress);
      expect(revoked).to.be.false;
      expect(registeredAt).to.equal(0n);
    });
  });
});
