// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/TokenOperator.sol";

// libs
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract ArtBlockERC1155 is ERC1155, ERC1155Supply, EIP712, ERC2981, Ownable, TokenOperator {

    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint256 => bool) public nonces;

    event Mint(
        address indexed target,
        uint256 indexed tokenId,
        uint256 indexed tokenAmount,
        uint256 nonce,
        uint256 deadline,
        bytes signature
    );

    // solhint-disable-next-line var-name-mixedcase
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address target,uint256 tokenId,uint256 tokenAmount,uint256 nonce,uint256 deadline)");

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) ERC1155("") EIP712(name_, "1") {
        name = name_;
        symbol = symbol_;
        _setURI(uri_);
        _setupRoyaltyERC2981(royaltyReceiver, royaltyFeeNumerator);
    }

    function setupRoyaltyERC2981(address royaltyReceiver, uint96 royaltyFeeNumerator) external onlyOwner {
        _setupRoyaltyERC2981(royaltyReceiver, royaltyFeeNumerator);
    }

    function setURI(string memory newuri) public virtual onlyOwner {
        _setURI(newuri);
    }

    function mint(
        address target,
        uint256 tokenId,
        uint256 tokenAmount,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public virtual {
        require(!nonces[nonce], "ArtBlockERC1155: nonce already used");
        require(block.timestamp <= deadline, "ArtBlockERC1155: expired deadline");

        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, target, tokenId, tokenAmount, nonce, deadline));

        bytes32 digest = _hashTypedDataV4(structHash);

        require(SignatureChecker.isValidSignatureNow(operator(), digest, signature), "ArtBlockERC1155: invalid signature");

        _mint(target, tokenId, tokenAmount, "0x");

        emit Mint({
            target: target,
            tokenId: tokenId,
            tokenAmount: tokenAmount,
            nonce: nonce,
            deadline: deadline,
            signature: signature   
        });
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
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