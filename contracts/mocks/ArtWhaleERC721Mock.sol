// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

import "../token/ArtWhaleERC721.sol";

contract ArtWhaleERC721Mock is ArtWhaleERC721 {

    constructor(
        string memory name_,
        string memory symbol_
    ) ArtWhaleERC721(name_, symbol_, msg.sender, new RoyaltyInfo[](0)) {}

    function mintTo(address to_, uint256 tokenId_, string memory uri_) public onlyOwner {
        _mint(to_, tokenId_);
        _setTokenURI(tokenId_, uri_);
    }

}
