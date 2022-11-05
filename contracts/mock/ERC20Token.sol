// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, ERC20Burnable, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}