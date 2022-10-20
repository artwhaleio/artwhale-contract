// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// libs
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC1155SignatureMint is ERC1155, ERC1155Supply, EIP712, Ownable {

    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint256 => bool) public nonces;

    event Mint(
        address indexed tokenOwner,
        uint256 indexed tokenId,
        uint256 indexed tokenAmount,
        uint256 nonce,
        uint256 deadline,
        bytes signature
    );

    // solhint-disable-next-line var-name-mixedcase
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address tokenOwner,uint256 tokenId,uint256 tokenAmount,uint256 nonce,uint256 deadline)");

    constructor(string memory name_, string memory symbol_) ERC1155("") EIP712(name_, "1") {
        name = name_;
        symbol = symbol_;
    }

    function setURI(string memory newuri) public virtual onlyOwner {
        _setURI(newuri);
    }

    function mint(
        address tokenOwner,
        uint256 tokenId,
        uint256 tokenAmount,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public virtual {
        require(!nonces[nonce], "ERC721SignatureMint: nonce already used");
        require(block.timestamp <= deadline, "ERC721SignatureMint: expired deadline");

        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, tokenOwner, tokenId, tokenAmount, nonce, deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, signature);
        require(signer == owner(), "ERC721SignatureMint: invalid signature");

        _mint(tokenOwner, tokenId, tokenAmount, "0x");
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from == address(0)) {
            for (uint256 i = 0; i < amounts.length; ++i) {
                totalSupply += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < amounts.length; ++i) {
                totalSupply -= amounts[i];
            }
        }
    }
}