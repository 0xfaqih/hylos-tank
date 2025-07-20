// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for the AI Precompile at address 0x0000000000000000000000000000000000000832
interface IAIPrecompile {
    function aicall(string memory model, string memory prompt) external payable returns (string memory);
}

/**
 * @title AIAgent
 * @dev This contract acts as a safe wrapper around the Helios AI precompile.
 * It allows users to query an AI model and captures the response or any errors
 * in events, preventing the entire transaction from reverting if the precompile fails.
 */
contract AIAgent is Ownable {
    // The fixed, official address for the AI precompile on the Helios Network.
    IAIPrecompile private constant AI_PRECOMPILE = IAIPrecompile(0x0000000000000000000000000000000000000832);

    // Event to log successful AI responses.
    event AIResponse(address indexed user, string model, string prompt, string response);
    // Event to log errors returned by the AI precompile.
    event AIError(address indexed user, string model, string prompt, bytes reason);

    /**
     * @dev The owner is set to the deployer's address.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Public, payable function to call the AI precompile.
     * It uses a try-catch block to handle potential reversions from the precompile.
     * @param model The identifier for the AI model (e.g., "gemma-7b").
     * @param prompt The input text/question for the AI model.
     */
    function askAI(string memory model, string memory prompt) public payable {
        try AI_PRECOMPILE.aicall{value: msg.value}(model, prompt) returns (string memory response) {
            emit AIResponse(msg.sender, model, prompt, response);
        } catch (bytes memory reason) {
            emit AIError(msg.sender, model, prompt, reason);
        }
    }
}
