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
      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(ethers.BigNumber.from(10).pow(18).mul(1000));
      expect(await tokenContract.balanceOf(hvtContract.address)).to.eq(ethers.BigNumber.from(10).pow(18).mul(1000));
    })

    it("test withdrawable", async () => {
      const [deployer] = await ethers.getSigners();

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(ethers.BigNumber.from(10).pow(18).mul(1000));

      let w = await hvtContract.withrawable(deployer.address)
      console.log("wwwwwww111: ", w.toString());
      for (let i = 0; i < 101; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      w = await hvtContract.withrawable(deployer.address);
      console.log(`block: ${await ethers.provider.getBlockNumber()}, withrawable: ${w.toString()}`);
    })

    it("test harvest", async () => {
      const [deployer] = await ethers.getSigners();

      const bal1 = await tokenContract.balanceOf(deployer.address);

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(1000));
      await hvtContract.deposit(ethers.BigNumber.from(10).pow(18).mul(1000));

      let w = await hvtContract.withrawable(deployer.address)
      console.log("wwwwwww111: ", w.toString());
      for (let i = 0; i < 300; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await hvtContract.harvest();
      const bal2 = await tokenContract.balanceOf(deployer.address);
      console.log("baL: ", bal1.toString() - bal2.toString());

      const releasedAmount1 = await hvtContract.totalReleased(deployer.address);
      console.log("released amount: ", releasedAmount1.toString())

      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      w = await hvtContract.withrawable(deployer.address);
      console.log("wwwwww222: ", w.toString());

      await hvtContract.harvest();

      w = await hvtContract.withrawable(deployer.address);
      console.log("wwwwww333: ", w.toString());
    })

    it("test deposit then deposit", async () => {
      const [deployer] = await ethers.getSigners();

      await tokenContract.approve(hvtContract.address, ethers.BigNumber.from(10).pow(18).mul(2000));
      await hvtContract.deposit(ethers.BigNumber.from(10).pow(18).mul(1000));

      for (let i = 0; i < 300; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      let w = await hvtContract.withrawable(deployer.address);

      console.log("w1: ", w.toString());

      await hvtContract.deposit(ethers.BigNumber.from(10).pow(18).mul(1000));
      w = await hvtContract.withrawable(deployer.address);
      console.log("w2: ", w.toString());

      for (let i = 0; i < 200; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      w = await hvtContract.withrawable(deployer.address);
      console.log(`w3: ${w.toString()}, block: ${ethers.provider.blockNumber}`);
    })
  })
});
