// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// libs
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC721SignatureMint is ERC721, ERC721Enumerable, ERC721URIStorage, EIP712, Ownable {

    event Mint(
        address indexed tokenOwner,
        uint256 indexed tokenId,
        string uri,
        uint256 nonce,
        uint256 deadline,
        bytes signature
    );

    // solhint-disable-next-line var-name-mixedcase
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address tokenOwner,uint256 tokenId,string uri,uint256 nonce,uint256 deadline)");

    mapping(uint256 => bool) public nonces;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) EIP712(name_, "1") {}

    function mint(
        address tokenOwner,
        uint256 tokenId,
        string memory uri,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public virtual {
        require(!nonces[nonce], "ERC721SignatureMint: nonce already used");
        require(block.timestamp <= deadline, "ERC721SignatureMint: expired deadline");

        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, tokenOwner, tokenId, keccak256(bytes(uri)), nonce, deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, signature);
        require(signer == owner(), "ERC721SignatureMint: invalid signature");

        _mint(tokenOwner, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
