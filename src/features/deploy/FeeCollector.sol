// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FeeCollector
 * @dev This contract demonstrates a practical use case for Helios's Chronos
 * feature: collecting fees and transferring them to a treasury on a schedule.
 * This pattern is common in DeFi protocols for managing protocol revenue.
 */
contract FeeCollector is Ownable {
    address public treasury;

    event FeesTransferred(address indexed to, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);

    constructor(address initialOwner, address _treasury) Ownable(initialOwner) {
        treasury = _treasury;
    }

    /**
     * @dev Public function to receive Ether (fees). Anyone can send funds here.
     */
    receive() external payable {}

    /**
     * @dev Transfers all collected fees (the entire contract balance) to the treasury address.
     * This function is designed to be called automatically by the Chronos precompile.
     * The require statement ensures that only the Chronos precompile can trigger the transfer.
     */
    function sendFeesToTreasury() public {
        // The address 0x0000000000000000000000000000000000000830 is the Chronos precompile address.
        require(msg.sender == 0x0000000000000000000000000000000000000830, "Caller is not Chronos");

        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(treasury).transfer(balance);
            emit FeesTransferred(treasury, balance);
        }
    }

    /**
     * @dev Allows the owner to update the treasury address.
     * @param _newTreasury The new address to which fees will be sent.
     */
    function setTreasury(address _newTreasury) public onlyOwner {
        require(_newTreasury != address(0), "Treasury address cannot be zero");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /**
     * @dev A manual way for the owner to withdraw funds in case the Chronos task fails.
     */
    function emergencyWithdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
}
