/**
 * Wallet Utilities
 * Centralized wallet-related functions
 */

const { ethers } = require('ethers');
const { ValidationUtils } = require('./validation');

class WalletUtils {
    /**
     * Create wallet instance with optional provider
     * @param {string} privateKey - Wallet private key
     * @param {object} provider - Optional provider instance
     * @returns {object} Wallet instance
     */
    static createWallet(privateKey, provider = null) {
        try {
            if (provider) {
                return new ethers.Wallet(privateKey, provider);
            } else {
                return new ethers.Wallet(privateKey);
            }
        } catch (error) {
            throw new Error(`Failed to create wallet: ${error.message}`);
        }
    }

    /**
     * Get wallet address from private key
     * @param {string} privateKey - Wallet private key
     * @returns {string} Wallet address
     */
    static getAddressFromPrivateKey(privateKey) {
        try {
            const wallet = new ethers.Wallet(privateKey);
            return wallet.address;
        } catch (error) {
            throw new Error(`Failed to get address from private key: ${error.message}`);
        }
    }

    /**
     * Generate random wallet
     * @returns {object} Random wallet instance
     */
    static generateRandomWallet() {
        return ethers.Wallet.createRandom();
    }

    /**
     * Generate random address
     * @returns {string} Random wallet address
     */
    static generateRandomAddress() {
        return ethers.Wallet.createRandom().address;
    }

    /**
     * Create wallet from mnemonic
     * @param {string} mnemonic - Mnemonic phrase
     * @param {string} path - Derivation path (default: "m/44'/60'/0'/0/0")
     * @returns {object} Wallet instance
     */
    static createWalletFromMnemonic(mnemonic, path = "m/44'/60'/0'/0/0") {
        try {
            return ethers.Wallet.fromPhrase(mnemonic, path);
        } catch (error) {
            throw new Error(`Failed to create wallet from mnemonic: ${error.message}`);
        }
    }

    /**
     * Sign message with wallet
     * @param {object} wallet - Wallet instance
     * @param {string} message - Message to sign
     * @returns {Promise<string>} Signature
     */
    static async signMessage(wallet, message) {
        try {
            return await wallet.signMessage(message);
        } catch (error) {
            throw new Error(`Failed to sign message: ${error.message}`);
        }
    }

    /**
     * Validate wallet connection
     * @param {object} wallet - Wallet instance to validate
     * @returns {boolean} Connection status
     */
    static isWalletConnected(wallet) {
        return wallet !== null && wallet !== undefined;
    }

    /**
     * Get wallet balance
     * @param {object} wallet - Wallet instance
     * @returns {Promise<bigint>} Balance in wei
     */
    static async getWalletBalance(wallet) {
        try {
            return await wallet.provider.getBalance(wallet.address);
        } catch (error) {
            throw new Error(`Failed to get wallet balance: ${error.message}`);
        }
    }
}

module.exports = { WalletUtils }; 