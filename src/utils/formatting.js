/**
 * Formatting Utilities
 * Centralized formatting functions for various data types
 */

const { ethers } = require('ethers');

class FormattingUtils {
    /**
     * Format balance with specified decimals
     * @param {string|number} balance - Balance to format
     * @param {number} decimals - Number of decimals (default: 18)
     * @returns {string} Formatted balance
     */
    static formatBalance(balance, decimals = 18) {
        return ethers.formatUnits(balance, decimals);
    }

    /**
     * Parse balance from string to BigInt
     * @param {string} amount - Amount string to parse
     * @param {number} decimals - Number of decimals (default: 18)
     * @returns {bigint} Parsed balance
     */
    static parseBalance(amount, decimals = 18) {
        return ethers.parseUnits(amount, decimals);
    }

    /**
     * Convert wei to ETH/HELIOS
     * @param {string|bigint} wei - Amount in wei
     * @returns {string} Amount in ETH/HELIOS
     */
    static weiToEth(wei) {
        return ethers.formatEther(wei);
    }

    /**
     * Convert ETH/HELIOS to wei
     * @param {string|number} eth - Amount in ETH/HELIOS
     * @returns {bigint} Amount in wei
     */
    static ethToWei(eth) {
        return ethers.parseEther(eth);
    }

    /**
     * Format address with checksum
     * @param {string} address - Address to format
     * @returns {string} Checksummed address
     */
    static formatAddress(address) {
        return ethers.getAddress(address);
    }

    /**
     * Format transaction hash
     * @param {string} hash - Transaction hash
     * @returns {string} Formatted hash
     */
    static formatTxHash(hash) {
        if (!hash) return '';
        return hash.startsWith('0x') ? hash : `0x${hash}`;
    }

    /**
     * Format gas price
     * @param {string|bigint} gasPrice - Gas price in wei
     * @returns {string} Formatted gas price
     */
    static formatGasPrice(gasPrice) {
        return ethers.formatUnits(gasPrice, 'gwei');
    }

    /**
     * Format percentage
     * @param {number} value - Value to format as percentage
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} Formatted percentage
     */
    static formatPercentage(value, decimals = 2) {
        return `${(value * 100).toFixed(decimals)}%`;
    }

    /**
     * Format time duration
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    static formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

module.exports = { FormattingUtils }; 