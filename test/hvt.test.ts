import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { HVTVault, TestToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
const { expect } = chai;

describe("Hvt", () => {
  let tokenContract: TestToken;
  let hvtContract: HVTVault;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [deployer, user] = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("TestToken");
    tokenContract = await tokenFactory.deploy() as TestToken;

    const hvtFactory = await ethers.getContractFactory("HVTVault");
    hvtContract = await hvtFactory.deploy(tokenContract.address) as HVTVault;
  });

  describe("hvt valut", () => {
    it("test deposit", async () => {
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(8).mul(1000));
    })

    it("test deposit", async () => {
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(8).mul(1000));
      console.log("block number 11: ", await ethers.provider.getBlockNumber())

      for (let i = 0; i < 40; i++) {
        await ethers.provider.send("evm_mine", []);
      }
  
      console.log("block number 22: ", await ethers.provider.getBlockNumber())

      const total = await hvtContract.totalReleased(deployer.address);
      console.log("total: ", ethers.utils.formatUnits(total, 8));
    })

    it("test deposit then deposit", async () => {
      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(8).mul(1000));

      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const total1 = await hvtContract.totalReleased(deployer.address);
      console.log("total1: ", ethers.utils.formatUnits(total1, 8));

      await hvtContract.deposit(deployer.address, ethers.BigNumber.from(10).pow(8).mul(1000));

      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const total2 = await hvtContract.totalReleased(deployer.address);
      console.log("total2: ", ethers.utils.formatUnits(total2, 8));
    })

    it("test withdraw", async () => {
      await tokenContract.transfer(hvtContract.address, ethers.BigNumber.from(10).pow(8).mul(3000));
      const decimal = await tokenContract.decimals()
      console.log("decimal: ", decimal)
      await hvtContract.deposit(user.address, ethers.BigNumber.from(10).pow(8).mul(1000));

      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const t = await hvtContract.totalReleased(user.address);
      console.log("user.addres: ", user.address);
      console.log("deployer address: ", deployer.address)
      console.log("ttt: ", ethers.utils.formatUnits(t, 8));

      const s = await hvtContract.unWithdraw(user.address);
      console.log("sss: ", ethers.utils.formatUnits(s, 8));
      expect(s).to.be.eq(t);
      const bal111 = await tokenContract.balanceOf(hvtContract.address)
      console.log("bal111: ", ethers.utils.formatUnits(bal111, 8));
      console.log("block number 1: ", await ethers.provider.getBlockNumber());

      const s4 = await hvtContract.connect(user).unWithdraw(user.address);
      console.log("unWithdraw11: ", ethers.utils.formatUnits(s4, 8))
      await hvtContract.connect(user).withdraw(t);
      const s2 = await hvtContract.unWithdraw(user.address);
      console.log("unWithdraw22: ", ethers.utils.formatUnits(s2, 8));


      const bal222 = await tokenContract.balanceOf(hvtContract.address)
      console.log("bal222: ", ethers.utils.formatUnits(bal222, 8));


      // const s2 = await hvtContract.unWithdraw(user.address);
      console.log("block number 2: ", await ethers.provider.getBlockNumber())

      console.log("s22222", ethers.utils.formatUnits(s2, 8))
      const s3 = await tokenContract.balanceOf(user.address)
      expect(s3).eq(t);
    })
  })
});
