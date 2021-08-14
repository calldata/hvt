// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import {HardhatRuntimeEnvironment} from "hardhat/types";


async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network} = hre
  const {deploy, save, getArtifact} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("TestToken", {
    from: deployer,
    log: true,
    args: []
  })
}

deployment.tags = ["TestToken"]
export default deployment
