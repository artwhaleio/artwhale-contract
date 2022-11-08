// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PaidMint is Ownable {
    uint256 private _mintPrice;

    event SetMintPrice(
        address indexed sender,
        uint256 indexed oldMintPrice,
        uint256 indexed newMintPrice
    );

    constructor(uint256 mintPrice_) {
        _setMintPrice(mintPrice_);
    }

    function setMintPrice(uint256 mintPrice_) public virtual onlyOwner {
        _setMintPrice(mintPrice_);
    }

    function mintPrice() public view returns(uint256) {
        return _mintPrice;
    }

    function _setMintPrice(uint256 mintPrice_) internal {
        emit SetMintPrice({
            sender: msg.sender,
            oldMintPrice: _mintPrice,
            newMintPrice: mintPrice_
        });

        _mintPrice = mintPrice_;
    }
}
