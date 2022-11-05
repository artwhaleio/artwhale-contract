// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/TokenOperator.sol";

// libs
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract ArtBlockERC721 is ERC721, ERC721Enumerable, ERC721URIStorage, EIP712, ERC2981, Ownable, TokenOperator {

    // solhint-disable-next-line var-name-mixedcase
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address target,uint256 tokenId,string uri,uint256 nonce,uint256 deadline)");

    mapping(uint256 => bool) public nonces;

    event Mint(
        address indexed target,
        uint256 indexed tokenId,
        string uri,
        uint256 nonce,
        uint256 deadline,
        bytes signature
    );

    constructor(string memory name_, string memory symbol_, address royaltyReceiver, uint96 royaltyFeeNumerator) ERC721(name_, symbol_) EIP712(name_, "1") {
        _setupRoyaltyERC2981(royaltyReceiver, royaltyFeeNumerator);
    }

    function setupRoyaltyERC2981(address royaltyReceiver, uint96 royaltyFeeNumerator) external onlyOwner {
        _setupRoyaltyERC2981(royaltyReceiver, royaltyFeeNumerator);
    }

    function mint(
        address target,
        uint256 tokenId,
        string memory uri,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public virtual {
        require(!nonces[nonce], "ArtBlockERC721: nonce already used");
        require(block.timestamp <= deadline, "ArtBlockERC721: expired deadline");

        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, target, tokenId, keccak256(bytes(uri)), nonce, deadline));

        bytes32 digest = _hashTypedDataV4(structHash);

        require(SignatureChecker.isValidSignatureNow(operator(), digest, signature), "ArtBlockERC721: invalid signature");

        _mint(target, tokenId);
        _setTokenURI(tokenId, uri);

        emit Mint({
            target: target,
            tokenId: tokenId,
            uri: uri,
            nonce: nonce,
            deadline: deadline,
            signature: signature   
        });
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
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    //
    // internal methods
    //

    function _setupRoyaltyERC2981(address receiver, uint96 feeNumerator) internal {
        if (receiver != address(0)) {
            _setDefaultRoyalty(receiver, feeNumerator);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }
}
