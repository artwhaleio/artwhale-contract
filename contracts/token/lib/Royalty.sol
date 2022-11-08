// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

abstract contract Royalty is Ownable, ERC165 {
    struct RoyaltyInfo {
        address receiver;
        uint256 royaltyFraction;
    }

    RoyaltyInfo[] private _defaultRoyaltyInfo;
    mapping(uint256 => RoyaltyInfo[]) private _tokenRoyaltyInfo;

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) public view virtual returns (address[] memory, uint256[] memory) {
        RoyaltyInfo[] memory royalty = _tokenRoyaltyInfo[_tokenId];

        if (royalty.length == 0) {
            royalty = _defaultRoyaltyInfo;
        }

        address[] memory targets = new address[](royalty.length);
        uint256[] memory amounts = new uint256[](royalty.length);
        for (uint256 i = 0; i < royalty.length; i++) {
            targets[i] = royalty[i].receiver;
            amounts[i] = (_salePrice * royalty[i].royaltyFraction) / _feeDenominator();
        }

        return (targets, amounts);
    }

    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
    }

    function _setDefaultRoyalty(RoyaltyInfo[] memory defaultRoyaltyInfo_) internal virtual {
        // add checking

        _defaultRoyaltyInfo = defaultRoyaltyInfo_;
    }

    function _deleteDefaultRoyalty() internal virtual {
        delete _defaultRoyaltyInfo;
    }

    // function _setTokenRoyalty(
    //     uint256 tokenId,
    //     address receiver,
    //     uint96 feeNumerator
    // ) internal virtual {
    //     require(feeNumerator <= _feeDenominator(), "ERC2981: royalty fee will exceed salePrice");
    //     require(receiver != address(0), "ERC2981: Invalid parameters");

    //     _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, feeNumerator);
    // }

    function _resetTokenRoyalty(uint256 tokenId) internal virtual {
        delete _tokenRoyaltyInfo[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165) returns (bool) {
        return 
        // interfaceId == type(IERC2981).interfaceId ||
        super.supportsInterface(interfaceId);
    }
}
