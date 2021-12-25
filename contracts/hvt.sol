// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "prb-math/contracts/PRBMathSD59x18.sol";

contract HVTVault is Ownable {
    using PRBMathSD59x18 for int256;
    using SafeCast for uint256;
    using SafeCast for int256;

    // 24 * 60 * 60 / 13 = 6646
    uint256 public constant BLOCKS_PER_DAY = 6646;

    IERC20 public tokenAddr;

    struct Deposit {
        // 充值的数量
        uint256 amount;
        // 充值时的区块号
        uint256 blockNo;
    }

    // 每个用户的充值记录
    mapping(address => Deposit[]) depositRecord;

    // 用户已经取走的
    mapping(address => uint256) userWithdrawed;

    uint256 public constant RATIO = 5e15;

    uint256 public constant DECAY = 997e15;

    mapping(address => uint256) totalDeposit;

    constructor(IERC20 addr) {
        tokenAddr = addr;
    }

    // 获取用户已经取走的数量
    function getUserWithrawn(address user) public view returns (uint256) {
        return userWithdrawed[user];
    }

    // 当前已经释放的总量
    function totalReleased(address user) public view returns (uint256) {
        uint256 len = depositRecord[user].length;
        
        if (len == 0) {
            return 0;
        }

        Deposit[] memory deposit = new Deposit[](len + 1);

        for (uint i = 0; i < depositRecord[user].length; i++) {
            deposit[i] = depositRecord[user][i];
        }

        deposit[len] = Deposit(0, block.number);

        uint256 release = 0;
        uint256 totalEpochs = 0;
        uint256 totalAmount = 0;

        // 两次存款之间应该释放的总量
        for (uint256 i = 1; i < deposit.length; i++) {
            totalEpochs += (deposit[i].blockNo - deposit[i - 1].blockNo) / BLOCKS_PER_DAY;
            totalAmount += deposit[i - 1].amount;
            release += getDepositRelease(deposit[i - 1].blockNo, deposit[i].blockNo, totalAmount, totalEpochs);
            totalAmount -= release;
        }

        return release;
    }

    // 还未释放的数量
    function unReleased(address user) public view returns (uint256) {
        Deposit[] memory userDeposit = depositRecord[user];
        uint256 total = 0;

        for (uint256 i = 0; i < userDeposit.length; i++) {
            total += userDeposit[i].amount;
        }

        return total - totalReleased(user);
    }

    // 已经释放，但是用户还未领取的数量
    function unWithdraw(address user) public view returns (uint256) {
        return totalReleased(user) - userWithdrawed[user];
    }

    // 两笔存款间隔之间可以释放的数量
    function getDepositRelease(uint256 startBlock, uint256 endBlock, uint256 startAmount, uint256 totalEpochs) internal pure returns (uint256) {
        uint256 epochs = (endBlock - startBlock) / BLOCKS_PER_DAY;
        uint256 release = 0;

        if (epochs > 0) {
            uint256 d = DECAY.toInt256().powu(totalEpochs - epochs).toUint256();
            uint256 ratio = RATIO * d / wad();

            for (uint256 i = 0; i < epochs; i++) {
                release += startAmount * ratio / wad();
                startAmount = startAmount - startAmount * ratio / wad();
                ratio = ratio * DECAY / wad();
            }

            uint256 remain = (endBlock - startBlock) % BLOCKS_PER_DAY;
            if (remain > 0) {
                uint256 lastAmount = startAmount * ratio / BLOCKS_PER_DAY / wad() * remain;
                release += lastAmount;
            }
        } else {
            uint256 diff_block = endBlock - startBlock;
            uint256 d = DECAY.toInt256().powu(totalEpochs).toUint256();
            uint256 ratio = RATIO * d / wad();
            release = startAmount * ratio / BLOCKS_PER_DAY * diff_block / wad();
        }

        return release;
    }

    // 管理员给用户充值
    function deposit(address user, uint256 amount) external onlyOwner {
        depositRecord[user].push(Deposit(amount, block.number));
        totalDeposit[user] += amount;
    }

    // 用户取款
    function withdraw(uint256 amount) external {
        uint256 w = userWithdrawed[msg.sender];
        require(w + amount <= totalReleased(msg.sender), "HVT: funds not enough");

        userWithdrawed[msg.sender] += amount;
        SafeERC20.safeTransfer(tokenAddr, msg.sender, amount);
    }

    function wad() internal pure returns (uint256) {
        return 1e18;
    }
}