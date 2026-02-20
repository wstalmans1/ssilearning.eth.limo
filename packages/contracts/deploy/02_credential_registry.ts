import type { DeployFunction } from 'hardhat-deploy/types';

/**
 * @title Credential Registry Deployment Script
 * @notice Deploys the Credential Registry for Phase 3 of SSI learning path
 * @dev Standalone deployment - no constructor args
 */
const func: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log('Deploying Credential Registry...');
  console.log('Deployer:', deployer);

  const deployment = await deploy('CredentialRegistry', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  if (deployment.newlyDeployed) {
    console.log(`✅ Credential Registry deployed at: ${deployment.address}`);
  } else {
    console.log(`ℹ️  Credential Registry already deployed at: ${deployment.address}`);
  }
};

export default func;
func.tags = ['CredentialRegistry', 'SSI'];
