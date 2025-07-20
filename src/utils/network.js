/**
 * Network Utilities
 * Centralized network-related functions
 */

const { ethers } = require('ethers');

class NetworkUtils {
    /**
     * Create provider instance
     * @param {string} rpcUrl - RPC URL
     * @param {number} chainId - Chain ID (optional)
     * @param {string} name - Network name (optional)
     * @returns {object} Provider instance
     */
    static createProvider(rpcUrl, chainId = null, name = null) {
        try {
            const options = {};
            if (chainId) options.chainId = chainId;
            if (name) options.name = name;
            
            return new ethers.JsonRpcProvider(rpcUrl, options);
        } catch (error) {
            throw new Error(`Failed to create provider: ${error.message}`);
        }
    }

    /**
     * Validate network connection
     * @param {object} provider - Provider instance
     * @returns {Promise<boolean>} Connection status
     */
    static async validateConnection(provider) {
        try {
            await provider.getNetwork();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get network information
     * @param {object} provider - Provider instance
     * @returns {Promise<object>} Network information
     */
    static async getNetworkInfo(provider) {
        try {
            return await provider.getNetwork();
        } catch (error) {
            throw new Error(`Failed to get network info: ${error.message}`);
        }
    }

    /**
     * Get gas price
     * @param {object} provider - Provider instance
     * @returns {Promise<bigint>} Gas price in wei
     */
    static async getGasPrice(provider) {
        try {
            const feeData = await provider.getFeeData();
            return feeData.gasPrice || 0n;
        } catch (error) {
            throw new Error(`Failed to get gas price: ${error.message}`);
        }
    }

    /**
     * Estimate gas for transaction
     * @param {object} provider - Provider instance
     * @param {object} transaction - Transaction object
     * @returns {Promise<bigint>} Estimated gas
     */
    static async estimateGas(provider, transaction) {
        try {
            return await provider.estimateGas(transaction);
        } catch (error) {
            throw new Error(`Failed to estimate gas: ${error.message}`);
        }
    }

    /**
     * Get block number
     * @param {object} provider - Provider instance
     * @returns {Promise<number>} Current block number
     */
    static async getBlockNumber(provider) {
        try {
            return await provider.getBlockNumber();
        } catch (error) {
            throw new Error(`Failed to get block number: ${error.message}`);
        }
    }

    /**
     * Wait for transaction confirmation
     * @param {object} provider - Provider instance
     * @param {string} txHash - Transaction hash
     * @param {number} confirmations - Number of confirmations (default: 1)
     * @returns {Promise<object>} Transaction receipt
     */
    static async waitForTransaction(provider, txHash, confirmations = 1) {
        try {
            return await provider.waitForTransaction(txHash, confirmations);
        } catch (error) {
            throw new Error(`Failed to wait for transaction: ${error.message}`);
        }
    }

    /**
     * Get transaction receipt
     * @param {object} provider - Provider instance
     * @param {string} txHash - Transaction hash
     * @returns {Promise<object|null>} Transaction receipt
     */
    static async getTransactionReceipt(provider, txHash) {
        try {
            return await provider.getTransactionReceipt(txHash);
        } catch (error) {
            throw new Error(`Failed to get transaction receipt: ${error.message}`);
        }
    }
}

module.exports = { NetworkUtils }; 