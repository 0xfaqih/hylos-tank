/**
 * Validation Utilities
 * Centralized validation functions for various data types
 */

const { ethers } = require('ethers');

class ValidationUtils {
    /**
     * Validate Ethereum address format
     * @param {string} address - Address to validate
     * @returns {boolean} Validation result
     */
    static isValidAddress(address) {
        try {
            ethers.getAddress(address);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate private key format
     * @param {string} privateKey - Private key to validate
     * @returns {boolean} Validation result
     */
    static isValidPrivateKey(privateKey) {
        try {
            new ethers.Wallet(privateKey);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate mnemonic phrase
     * @param {string} mnemonic - Mnemonic to validate
     * @returns {boolean} Validation result
     */
    static isValidMnemonic(mnemonic) {
        try {
            ethers.Wallet.fromPhrase(mnemonic);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate chain ID
     * @param {number} chainId - Chain ID to validate
     * @returns {boolean} Validation result
     */
    static isValidChainId(chainId) {
        return chainId && chainId > 0 && Number.isInteger(chainId);
    }

    /**
     * Validate amount (positive number)
     * @param {string|number} amount - Amount to validate
     * @returns {boolean} Validation result
     */
    static isValidAmount(amount) {
        try {
            const bigIntAmount = BigInt(amount);
            return bigIntAmount > 0;
        } catch {
            return false;
        }
    }

    /**
     * Validate hex string format
     * @param {string} hexString - Hex string to validate
     * @returns {boolean} Validation result
     */
    static isValidHexString(hexString) {
        return hexString && hexString.startsWith('0x') && /^0x[0-9a-fA-F]+$/.test(hexString);
    }

    /**
     * Validate required parameters
     * @param {object} params - Parameters to validate
     * @param {string[]} requiredFields - Required field names
     * @returns {object} Validation result with errors array
     */
    static validateRequiredParams(params, requiredFields) {
        const errors = [];
        
        for (const field of requiredFields) {
            if (!params[field]) {
                errors.push(`Missing required parameter: ${field}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = { ValidationUtils }; 