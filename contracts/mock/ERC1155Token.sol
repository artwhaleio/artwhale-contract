// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable not-rely-on-time

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract ERC1155Token is ERC1155, Ownable, ERC1155Supply {

    event CreateToken(
        address indexed admin,
        uint256 tokenCount,
        uint256 timestamp
    );

    string private _name;
    string private _symbol;
    uint256 private _totalTokens;

    constructor(string memory name_, string memory symbol_) ERC1155("") {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function totalTokens() public view returns (uint256) {
        return _totalTokens;
    }

    function createToken(uint256 tokenCount) public onlyOwner {
        _totalTokens += tokenCount;

        emit CreateToken(msg.sender, tokenCount, block.timestamp);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            require(ids[i] < _totalTokens, "ERC1155Token: id does not exist");
        }
    }
}
