// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/access/Ownable.sol";
import "../../interface/ITokenOperator.sol";

abstract contract TokenOperator is Ownable, ITokenOperator {
    address private _operator;

    modifier onlyOperator() {
        require(operator() == _msgSender(), "TokenOperator: caller is not the operator");
        _;
    }

    function setOperator(address newOperator_) public virtual override onlyOwner {
        _setOperator(newOperator_);
    }

    function operator() public view virtual override returns(address) {
        return _operator;
    }

    //
    // internal methods
    //

    function _setOperator(address newOperator_) internal {
        emit SetOperator({
            sender: msg.sender,
            oldOperator: _operator,
            newOperator: newOperator_
        });

        _operator = newOperator_;
    }
}
