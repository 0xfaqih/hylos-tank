// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for the Hyperion Precompile at 0x0000000000000000000000000000000000000831
interface IHyperion {
    function query(string calldata endpoint, string calldata params) external payable returns (bytes memory);
}

/**
 * @title HyperionQuery
 * @dev This contract acts as a safe and robust wrapper around the Helios Hyperion precompile.
 * It allows for both structured (JSON-based) and raw (direct bytes) queries to external
 * data sources and other blockchains.
 */
contract HyperionQuery is Ownable {
    // The fixed, official address for the Hyperion precompile on the Helios Network.
    IHyperion private constant HYPERION_PRECOMPILE = IHyperion(0x0000000000000000000000000000000000000831);

    // Event to log successful responses from Hyperion.
    event HyperionResponse(address indexed user, string endpoint, string params, bytes response);
    // Event to log any errors returned by the precompile.
    event HyperionError(address indexed user, string endpoint, string params, bytes reason);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Performs a structured query to a Hyperion endpoint.
     * Use this for endpoints that expect structured data (like JSON) in the params.
     * The response is captured in the `HyperionResponse` event.
     * @param endpoint The Hyperion API endpoint to query (e.g., "v2/history/get_actions").
     * @param params The JSON string of parameters for the query.
     */
    function performStructuredQuery(string memory endpoint, string memory params) public payable {
        try HYPERION_PRECOMPILE.query{value: msg.value}(endpoint, params) returns (bytes memory response) {
            emit HyperionResponse(msg.sender, endpoint, params, response);
        } catch (bytes memory reason) {
            emit HyperionError(msg.sender, endpoint, params, reason);
        }
    }

    /**
     * @dev Performs a raw query to a Hyperion endpoint.
     * Use this for endpoints that require direct byte manipulation or non-JSON parameters.
     * The response is captured in the `HyperionResponse` event.
     * @param endpoint The Hyperion API endpoint to query.
     * @param params The raw string of parameters for the query.
     */
    function performRawQuery(string memory endpoint, string memory params) public payable {
        try HYPERION_PRECOMPILE.query{value: msg.value}(endpoint, params) returns (bytes memory response) {
            emit HyperionResponse(msg.sender, endpoint, params, response);
        } catch (bytes memory reason) {
            emit HyperionError(msg.sender, endpoint, params, reason);
        }
    }
}