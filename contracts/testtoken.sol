// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    constructor() ERC20("TestToken", "TT") {
        _mint(msg.sender, 10 ** 9 * 1 ether);
    }

    function decimals() override public pure returns (uint8) {
        return 8;
    }
}