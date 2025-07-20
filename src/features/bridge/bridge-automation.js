/**
 * Bridge Automation
 * Wrapper class for bridge service integration
 */

const { BridgeService } = require('./bridge-service');
const { Helpers } = require('../../utils/helpers');
const { TOKEN_ADDRESS, RETRY_CONFIG } = require('../../config/config');
const { AsyncUtils } = require('../../utils/async');

class BridgeAutomation {
    constructor() {
        this.bridgeService = new BridgeService();
        this.isInitialized = false;
    }

    /**
     * Initialize bridge automation
     * @returns {Promise<boolean>} Initialization result
     */
    async initialize() {
        try {
            await this.bridgeService.initialize();
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Bridge Automation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet to bridge automation
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<string>} Wallet address
     */
    async connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Bridge Automation not initialized');
        }

        try {
            return await this.bridgeService.connectWallet(privateKey);
        } catch (error) {
            Helpers.log('Failed to connect bridge wallet', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Execute bridge transaction
     * @param {object} params - Bridge parameters
     * @returns {Promise<object>} Transaction result
     */
    async bridgeTokens(params) {
        if (!this.isInitialized) {
            throw new Error('Bridge Automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    return await this.bridgeService.bridgeTokens(params);
                },
                RETRY_CONFIG.BRIDGE_MAX_ATTEMPTS,
                RETRY_CONFIG.BRIDGE_DELAY
            );
        } catch (error) {
            Helpers.log('Bridge automation failed after retries', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get supported chains
     * @returns {Promise<object>} Supported chains configuration
     */
    async getSupportedChains() {
        if (!this.isInitialized) {
            throw new Error('Bridge Automation not initialized');
        }

        try {
            return await this.bridgeService.getSupportedChains();
        } catch (error) {
            Helpers.log('Failed to get supported chains', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Estimate gas for bridge transaction
     * @param {object} params - Bridge parameters
     * @returns {Promise<object>} Gas estimation result
     */
    async estimateBridgeGas(params) {
        if (!this.isInitialized) {
            throw new Error('Bridge Automation not initialized');
        }

        try {
            return await this.bridgeService.estimateBridgeGas(params);
        } catch (error) {
            Helpers.log('Failed to estimate bridge gas', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Bridge tokens to destination chain
     * @param {string} privateKey - Wallet private key
     * @param {number} destChainId - Destination chain ID
     * @param {number} amountEth - Amount in ETH
     * @param {string} recipientAddress - Recipient address
     * @returns {Promise<object>} Bridge result
     */
    async bridge(privateKey, destChainId, amountEth, recipientAddress) {
        if (!this.isInitialized) {
            throw new Error('Bridge Automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet if not connected
                    if (!this.bridgeService.wallet) {
                        await this.connectWallet(privateKey);
                    }

                    // Convert ETH to Wei
                    const amountWei = Helpers.ethToWei(amountEth.toString());
                    
                    // Default parameters
                    const params = {
                        destChainId: destChainId,
                        tokenAddress: TOKEN_ADDRESS.HLS, 
                        amountWei: amountWei.toString(),
                        feeOrGas: "500000000000000000", // 0.5 ETH default fee
                        extraString: recipientAddress
                    };

                    return await this.bridgeTokens(params);
                },
                RETRY_CONFIG.BRIDGE_MAX_ATTEMPTS,
                RETRY_CONFIG.BRIDGE_DELAY
            );
        } catch (error) {
            Helpers.log('Bridge failed after retries', error, 'ERROR');
            throw error;
        }
    }
}

module.exports = { BridgeAutomation }; 