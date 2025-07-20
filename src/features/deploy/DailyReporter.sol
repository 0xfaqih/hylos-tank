// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DailyReporter
 * @dev This contract demonstrates using Chronos to create a periodic on-chain log or report.
 * The `createDailyReport` function emits an event with a status message, which can be
 * tracked by off-chain services or other contracts.
 */
contract DailyReporter is Ownable {
    uint256 public reportCount;
    string public lastReportMessage;

    event ReportCreated(uint256 indexed reportId, string message, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Creates an on-chain report by emitting an event.
     * This function is designed to be called by the Chronos precompile.
     * @param message The content of the report to be logged.
     */
    function createDailyReport(string memory message) public {
        // The address 0x0000000000000000000000000000000000000830 is the Chronos precompile address.
        require(msg.sender == 0x0000000000000000000000000000000000000830, "Caller is not Chronos");

        reportCount++;
        lastReportMessage = message;
        emit ReportCreated(reportCount, message, block.timestamp);
    }
}
