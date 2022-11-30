// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/TokenOperator.sol";
import "./lib/Royalty.sol";

// libs
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract ArtWhaleERC1155 is ERC1155, ERC1155Supply, EIP712, Ownable, TokenOperator, Royalty {

    using Address for address payable;

    // solhint-disable-next-line var-name-mixedcase
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address target,uint256 tokenId,uint256 tokenAmount,uint256 mintPrice,uint256 nonce,uint256 deadline)");

    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint256 => bool) public nonces;

    event Mint(
        address indexed target,
        uint256 indexed tokenId,
        uint256 indexed tokenAmount,
        uint256 mintPrice,
        uint256 nonce,
        uint256 deadline,
        bytes signature
    );

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_,
        address operator_,
        RoyaltyInfo[] memory defaultRoyaltyInfo_
    ) ERC1155("") EIP712(name_, "1") {
        name = name_;
        symbol = symbol_;
        _setURI(uri_);
        _setOperator(operator_);
        _setDefaultRoyalty(defaultRoyaltyInfo_);
    }

    function setURI(string memory newuri) public virtual onlyOperator {
        _setURI(newuri);
    }

    function mint(
        address target_,
        uint256 tokenId_,
        uint256 tokenAmount_,
        uint256 mintPrice_,
        uint256 nonce_,
        uint256 deadline_,
        bytes memory signature_
    ) public payable virtual {
        require(!nonces[nonce_], "ArtWhaleERC1155: nonce already used");
        require(block.timestamp <= deadline_, "ArtWhaleERC1155: expired deadline");
        require(msg.value == mintPrice_, "ArtWhaleERC1155: wrong mint price");

        payable(operator()).sendValue(msg.value);

        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, target_, tokenId_, tokenAmount_, mintPrice_, nonce_, deadline_));

        bytes32 digest = _hashTypedDataV4(structHash);

        require(SignatureChecker.isValidSignatureNow(operator(), digest, signature_), "ArtWhaleERC1155: invalid signature");

        _mint(target_, tokenId_, tokenAmount_, "0x");

        emit Mint({
            target: target_,
            tokenId: tokenId_,
            tokenAmount: tokenAmount_,
            mintPrice: mintPrice_,
            nonce: nonce_,
            deadline: deadline_,
            signature: signature_
        });
    }

    function supportsInterface(bytes4 interfaceId_)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return interfaceId_ == type(IRoyalty).interfaceId || super.supportsInterface(interfaceId_);
    }

    //
    // internal methods
    //

    function _beforeTokenTransfer(
        address operator_,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator_, from, to, ids, amounts, data);

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