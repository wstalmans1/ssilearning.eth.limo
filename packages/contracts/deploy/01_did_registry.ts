import type { DeployFunction } from 'hardhat-deploy/types';

/**
 * @title DID Registry Deployment Script
 * @notice Deploys the DID Registry contract for Phase 2 of SSI learning path
 * @dev This script demonstrates how to deploy the DID Registry
 * 
 * WHAT THIS DOES:
 * - Deploys the DIDRegistry contract
 * - Makes it available for use in the SSI system
 * 
 * HOW TO USE:
 * - Run: pnpm contracts:deploy --network <network> --tags DIDRegistry
 * - Or: pnpm --filter contracts exec hardhat deploy --network sepolia --tags DIDRegistry
 * 
 * WHY SEPARATE DEPLOYMENT SCRIPT:
 * - Allows selective deployment (only deploy what you need)
 * - Can deploy to different networks easily
 * - Tags allow grouping related deployments
 */
const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // WHY LOG: Helps track what's being deployed
  console.log('Deploying DID Registry...');
  console.log('Deployer:', deployer);

  // Deploy the contract
  // WHY THESE OPTIONS:
  // - from: deployer - who pays for deployment
  // - log: true - show deployment details in console
  // - args: [] - constructor arguments (none for DIDRegistry)
  const deployment = await deploy('DIDRegistry', {
    from: deployer,
    args: [], // No constructor arguments
    log: true, // Print deployment info
    waitConfirmations: 1, // Wait for 1 confirmation (adjust for production)
  });

  // WHY LOG: Confirms successful deployment
  if (deployment.newlyDeployed) {
    console.log(`✅ DID Registry deployed at: ${deployment.address}`);
    console.log(`   Transaction hash: ${deployment.transactionHash}`);
  } else {
    console.log(`ℹ️  DID Registry already deployed at: ${deployment.address}`);
  }
};

export default func;

// WHY TAG: Allows deploying just this contract with --tags DIDRegistry
func.tags = ['DIDRegistry', 'SSI'];

// WHY DEPENDENCIES: If other contracts depend on this, list them here
func.dependencies = [];

