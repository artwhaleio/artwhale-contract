// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/TokenOperator.sol";
import "./lib/Royalty.sol";

// libs
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract ArtWhaleERC721 is ERC721, ERC721Enumerable, ERC721URIStorage, EIP712, Ownable, TokenOperator, Royalty {

    using Address for address payable;

    // solhint-disable-next-line var-name-mixedcase
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address target,uint256 tokenId,string uri,uint256 mintPrice,uint256 nonce,uint256 deadline)");

    mapping(uint256 => bool) public nonces;

    event Mint(
        address indexed target,
        uint256 indexed tokenId,
        string uri,
        uint256 mintPrice,
        uint256 nonce,
        uint256 deadline,
        bytes signature
    );

    constructor(
        string memory name_,
        string memory symbol_,
        address operator_,
        RoyaltyInfo[] memory defaultRoyaltyInfo_
    ) ERC721(name_, symbol_) EIP712(name_, "1") TokenOperator(operator_) {

        _setDefaultRoyalty(defaultRoyaltyInfo_);
    }

    function setURI(uint256 tokenId_, string memory uri_) public virtual onlyOperator {
        _setTokenURI(tokenId_, uri_);
    }

    function mint(
        address target_,
        uint256 tokenId_,
        string memory uri_,
        uint256 mintPrice_,
        uint256 nonce_,
        uint256 deadline_,
        bytes memory signature_
    ) public payable virtual {
        require(!nonces[nonce_], "ArtWhaleERC721: nonce already used");
        require(block.timestamp <= deadline_, "ArtWhaleERC721: expired deadline");
        require(msg.value == mintPrice_, "ArtWhaleERC721: wrong mint price");

        payable(operator()).sendValue(msg.value);

        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, target_, tokenId_, keccak256(bytes(uri_)), mintPrice_, nonce_, deadline_));

        bytes32 digest = _hashTypedDataV4(structHash);

        require(SignatureChecker.isValidSignatureNow(operator(), digest, signature_), "ArtWhaleERC721: invalid signature");

        _mint(target_, tokenId_);
        _setTokenURI(tokenId_, uri_);

        emit Mint({
            target: target_,
            tokenId: tokenId_,
            uri: uri_,
            mintPrice: mintPrice_,
            nonce: nonce_,
            deadline: deadline_,
            signature: signature_
        });
    }

    function tokenURI(uint256 tokenId_)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId_);
    }

    function supportsInterface(bytes4 interfaceId_)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return interfaceId_ == type(IRoyalty).interfaceId || super.supportsInterface(interfaceId_);
    }

    //
    // internal methods
    //

    function _beforeTokenTransfer(address from_, address to_, uint256 tokenId_)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from_, to_, tokenId_);
    }

    function _burn(uint256 tokenId_) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId_);
        _resetTokenRoyalty(tokenId_);
    }
}
