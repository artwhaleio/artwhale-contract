// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

// solhint-disable no-empty-blocks

// inheritance
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenOperator is Ownable {
    address private _operator;

    event SetOperator(
        address indexed sender_,
        address indexed oldOperator_,
        address indexed newOperator_,
        uint256 timestamp_
    );

    function setOperator(address newOperator_) public onlyOwner {
        emit SetOperator({
            sender_: msg.sender,
            oldOperator_: _operator,
            newOperator_: newOperator_,
            timestamp_: block.timestamp
        });

        _operator = newOperator_;
    }

    function operator() public view returns(address) {
        return _operator;
    }
}
