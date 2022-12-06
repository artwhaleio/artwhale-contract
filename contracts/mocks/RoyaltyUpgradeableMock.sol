// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

// solhint-disable no-empty-blocks, func-name-mixedcase

// inheritance
import "../token/lib/RoyaltyUpgradeable.sol";

contract RoyaltyUpgradeableMock is RoyaltyUpgradeable {
    constructor() initializer {
        __Royalty_init();
    }

    function checkRoyalty(RoyaltyInfo[] memory royalty) external pure virtual {
        _checkRoyalty(royalty);
    }
}
