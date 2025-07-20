// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AutonomousMint
 * @dev This contract demonstrates Helios's Autonomous CRON Task feature.
 * It allows the owner to schedule a recurring mint of an NFT.
 * The cronMint() function is designed to be called by the Chronos precompile.
 */
contract AutonomousMint is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("Autonomous NFT", "AUTO")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new NFT to the contract owner.
     * This function is intended to be called by the Chronos precompile (0x...830).
     * The require statement ensures that only the precompile can trigger the mint,
     * preventing unauthorized minting.
     */
    function cronMint() public {
        // The address 0x0000000000000000000000000000000000000830 is the Chronos precompile address.
        require(msg.sender == 0x0000000000000000000000000000000000000830, "Caller is not Chronos");
        _safeMint(owner(), _nextTokenId);
        _nextTokenId++;
    }

    /**
     * @dev Allows the owner to withdraw any Ether sent to the contract.
     * This is useful for retrieving the remaining balance from the CRON task deposit.
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
