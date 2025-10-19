// deploy/02_deploy_contribution_pool.ts

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // You need to have deployed your token contract already and get its address
  const tokenDeployment = await hre.deployments.get("BirthdayConfidentialToken");
  const tokenAddress = tokenDeployment.address;

  console.log("Deploying ContributionPool with token:", tokenAddress);

  const deployment = await deploy("ContributionPool", {
    from: deployer,
    args: [tokenAddress],       // constructor expects the token contract address
    log: true,
    // waitConfirmations: hre.network.config.chainId === 1 ? 5 : 1,
  });

  console.log(`ContributionPool deployed at: ${deployment.address}`);
};

export default func;
func.id = "deploy_contribution_pool";
func.tags = ["ContributionPool", "pool"];
