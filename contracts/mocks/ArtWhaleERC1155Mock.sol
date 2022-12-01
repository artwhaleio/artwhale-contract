// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

// solhint-disable no-empty-blocks

import "../token/ArtWhaleERC1155.sol";

contract ArtWhaleERC1155Mock is ArtWhaleERC1155 {
    constructor(string memory name_, string memory symbol_) initializer {
        __ArtWhaleERC1155_init(
            name_,
            symbol_,
            "",
            address(0),
            new RoyaltyInfo[](0)
        );
    }

    function mintTo(
        address to_,
        uint256 tokenId_,
        uint256 amount_
    ) public onlyOwner {
        _mint(to_, tokenId_, amount_, "0x");
    }
}
