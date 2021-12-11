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
    uint256 public constant BLOCKS_PER_DAY = 100;

    struct ReleaseSched {
        int256 startRatio;
        int256 releaseRatio;
    }

    struct ReleaseStatus {
        uint256 startBlock;
        uint256 startAmount;
        uint256 releasedAmount;
        uint256 totalReleased;
    }

    mapping(address => ReleaseSched) releaseSched;

    mapping(address => uint256) balance;

    mapping(address => ReleaseStatus) releaseStatus;

    IERC20 public tokenAddr;

    constructor(IERC20 addr) {
        tokenAddr = addr;
    }

    function setReleaseSched(uint256 initialAmount, uint256 ratio) external onlyOwner {
        revert("Not implement");
    }

    function deposit(address user, uint256 amount) external onlyOwner {
        if (balance[user] > 0) {
            _harvest(user);
            balance[user] += amount;

            ReleaseStatus storage status = releaseStatus[user];
            status.startAmount = balance[user];
            status.startBlock = block.number;
            status.releasedAmount = 0;
        } else {
            balance[user] = amount;
            // default 0.5% and 99.7%
            releaseSched[user] = ReleaseSched(5 * 10 ** 15, 997 * 10 ** 15);
            releaseStatus[user] = ReleaseStatus(block.number, amount, 0, 0);
        }

        SafeERC20.safeTransferFrom(tokenAddr, msg.sender, address(this), amount);
    }

    function withrawable(address addr) public view returns (int256) {
        ReleaseSched memory sched = releaseSched[addr];
        ReleaseStatus memory status = releaseStatus[addr];

        uint256 n = elapsedDays(status.startBlock);
        int256 a1 = status.startAmount.toInt256() * sched.startRatio / wad();
        int256 q = sched.releaseRatio;
        int256 qn = q.powu(n);
        int256 sn = a1 * (wad() - qn) / (wad() - q);
        int256 an_puls_1 = a1 * qn / wad();
        uint256 ratio = (block.number - status.startBlock - n * BLOCKS_PER_DAY) * wad().toUint256() / BLOCKS_PER_DAY;
        int256 frac = ratio.toInt256() * an_puls_1 / wad();
        return sn + frac - status.releasedAmount.toInt256();
    }

    function harvest() public {
        _harvest(msg.sender);
    }

    function totalReleased(address addr) external view returns (uint256) {
        return releaseStatus[addr].totalReleased;   
    }

    function unReleased(address addr) external view returns (uint256) {
        return balance[addr];
    }

    function wad() internal pure returns (int256) {
        return 10 ** 18;
    }

    function elapsedDays(uint256 blockNumber) view internal returns (uint256) {
        return (block.number - blockNumber) / BLOCKS_PER_DAY;
    }

    function _harvest(address user) internal {
        ReleaseStatus storage status = releaseStatus[user];

        int256 w = withrawable(user);
        balance[user] -= w.toUint256();

        status.releasedAmount += w.toUint256();
        status.totalReleased += w.toUint256();

        SafeERC20.safeTransfer(tokenAddr, user, w.toUint256());
    }
}
