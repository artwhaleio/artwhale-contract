// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

// solhint-disable no-empty-blocks, func-name-mixedcase

// inheritance
import "../token/lib/TokenOperatorUpgradeable.sol";

contract TokenOperatorUpgradeableMock is TokenOperatorUpgradeable {
    constructor() initializer {
        __TokenOperator_init();
    }

    function onlyForOperator() external onlyOperator {}
}
