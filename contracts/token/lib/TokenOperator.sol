// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract TokenOperator is Ownable {
    address private _operator;

    event SetOperator(
        address indexed sender,
        address indexed oldOperator,
        address indexed newOperator
    );

    modifier onlyOperator() {
        require(operator() == _msgSender(), "TokenOperator: caller is not the operator");
        _;
    }

    constructor(address newOperator_) {
        _setOperator(newOperator_);
    }

    function setOperator(address newOperator_) public virtual onlyOwner {
        _setOperator(newOperator_);
    }

    function operator() public view virtual returns(address) {
        return _operator;
    }

    function _setOperator(address newOperator_) internal {
        emit SetOperator({
            sender: msg.sender,
            oldOperator: _operator,
            newOperator: newOperator_
        });

        _operator = newOperator_;
    }
}
