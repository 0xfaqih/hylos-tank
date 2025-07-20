// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MyNFT
 * @dev A simple ERC721 NFT contract with batch minting capabilities.
 */
contract MyNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    /**
     * @dev Mints a single new token to the specified recipient.
     * Only the owner can call this function.
     * @param to The address that will receive the minted token.
     */
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    /**
     * @dev Mints a batch of new tokens to the specified recipient.
     * Only the owner can call this function.
     * @param to The address that will receive the minted tokens.
     * @param amount The number of tokens to mint.
     */
    function mintBatch(address to, uint256 amount) public onlyOwner {
        require(amount > 0, "MyNFT: amount must be greater than zero");
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }
}