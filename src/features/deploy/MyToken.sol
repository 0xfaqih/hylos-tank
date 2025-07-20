// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev A simple ERC20 token where the initial supply is minted to a specified owner.
 * The contract ownership is also transferred to this owner.
 */
contract MyToken is ERC20, Ownable {
    /**
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     * @param initialSupply The total amount of tokens to mint, with decimals.
     * @param initialOwner The address that will receive the initial supply and contract ownership.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }
}