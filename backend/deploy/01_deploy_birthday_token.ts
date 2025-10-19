// deploy/01_deploy_birthday_token.ts

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // The constructor of BirthdayConfidentialToken expects three arguments: name, symbol, uri
  const name = "Birthday Confidential Token";
  const symbol = "BCT";
  const uri = "";

  const deployed = await deploy("BirthdayConfidentialToken", {
    from: deployer,
    args: [name, symbol, uri],
    log: true,
    // you can optionally specify waitConfirmations depending on the network
    // waitConfirmations: hre.network.config.chainId === 1 ? 5 : 1,
  });

  console.log(`BirthdayConfidentialToken deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_birthday_confidential_token";
func.tags = ["BirthdayConfidentialToken", "token"];
