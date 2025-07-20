// contracts/Heartbeat.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Heartbeat
 * @dev This contract demonstrates a simple use case for Chronos by emitting a "ping" event on a schedule.
 */
contract Heartbeat is Ownable {

    event Ping(uint256 indexed blockNumber, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Emits a Ping event.
     * This function is designed to be called by the Chronos precompile.
     * The require statement ensures that only the Chronos precompile can trigger the event.
     */
    function sendPing() public {
        // The address 0x0000000000000000000000000000000000000830 is the Chronos precompile address.
        require(msg.sender == 0x0000000000000000000000000000000000000830, "Caller is not Chronos");

        emit Ping(block.number, block.timestamp);
    }
}