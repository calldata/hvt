import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { HVTVault, TestToken } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Hvt", () => {
  let tokenContract: any;
  let hvtContract: any;

  beforeEach(async () => {
    const [deployer] = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("TestToken");
    tokenContract = await tokenFactory.deploy();

    const hvtFactory = await ethers.getContractFactory("HVTVault");
    hvtContract = await hvtFactory.deploy(tokenContract.address);
  });

  describe("hvt valut", () => {
    it("test deposit", async () => {
      const [deployer] = await ethers.getSigners();

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(18).mul(1000));
    })

    it("test deposit", async () => {
      const [deployer] = await ethers.getSigners();

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(18).mul(1000));

      for (let i = 0; i < 48; i++) {
        await ethers.provider.send("evm_mine", []);
      }
  
      const total = await hvtContract.totalReleased(deployer.address);
      console.log("total: ", ethers.utils.formatUnits(total));
    })

    it("test deposit then deposit", async () => {
      const [deployer] = await ethers.getSigners();

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(18).mul(1000));

      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const total1 = await hvtContract.totalReleased(deployer.address);
      console.log("total1: ", ethers.utils.formatUnits(total1));

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(18).mul(1000));

      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const total2 = await hvtContract.totalReleased(deployer.address);
      console.log("total2: ", ethers.utils.formatUnits(total2));
    })
  })
});
