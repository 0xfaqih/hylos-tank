/**
 * Swap Automation
 * Automated swap operations with retry logic and error handling
 */

const { SwapService } = require('./swap-service');
const { Helpers } = require('../../utils/helpers');
const { RETRY_CONFIG } = require('../../config/config');

class SwapAutomation {
    constructor() {
        this.swapService = new SwapService();
        this.isInitialized = false;
    }

    /**
     * Initialize swap automation
     * @returns {Promise<boolean>} Initialization result
     */
    async initialize() {
        try {
            await this.swapService.initialize();
            this.isInitialized = true;
            Helpers.log('Swap automation initialized', 'SUCCESS');
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize swap automation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Execute swap with retry logic
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<object>} Swap result
     */
    async executeSwap(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Swap automation not initialized');
        }

        const maxAttempts = RETRY_CONFIG.TRANSACTION_MAX_ATTEMPTS;
        const delay = RETRY_CONFIG.TRANSACTION_DELAY;
        const amount = Helpers.getRandomSwapAmount();

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                Helpers.log(`🔄 Swap attempt ${attempt}/${maxAttempts}`, 'INFO');
                Helpers.log(`💰 Swapping ${amount} HLS to WETH`, 'INFO');
                
                const result = await this.swapService.swapHlsToWeth(privateKey, amount);
                
                if (result.success) {
                    Helpers.log(`✅ Swap successful on attempt ${attempt}`, 'SUCCESS');
                    return result;
                } else {
                    Helpers.log(`⚠️ Swap failed on attempt ${attempt}: ${result.error}`, 'WARNING');
                    
                    if (attempt === maxAttempts) {
                        Helpers.log(`❌ All ${maxAttempts} swap attempts failed`, 'ERROR');
                        return result;
                    }
                    
                    Helpers.log(`⏳ Waiting ${delay}ms before retry...`, 'INFO');
                    await Helpers.sleep(delay);
                }
                
            } catch (error) {
                Helpers.log(`❌ Swap error on attempt ${attempt}: ${error.message}`, 'ERROR');
                
                if (attempt === maxAttempts) {
                    Helpers.log(`❌ All ${maxAttempts} swap attempts failed due to errors`, 'ERROR');
                    return {
                        success: false,
                        error: error.message
                    };
                }
                
                Helpers.log(`⏳ Waiting ${delay}ms before retry...`, 'INFO');
                await Helpers.sleep(delay);
            }
        }
    }

    /**
     * Execute swap with custom parameters
     * @param {string} privateKey - Wallet private key
     * @param {object} params - Swap parameters
     * @returns {Promise<object>} Swap result
     */
    async executeCustomSwap(privateKey, params) {
        if (!this.isInitialized) {
            throw new Error('Swap automation not initialized');
        }

        try {
            await this.swapService.connectWallet(privateKey);
            return await this.swapService.executeSwap(params);
        } catch (error) {
            Helpers.log('Custom swap failed', error, 'ERROR');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get random swap amount between 0.5 and 7.0 HLS
     * @returns {string} Random amount
     */
    getRandomSwapAmount() {
        return Helpers.getRandomSwapAmount();
    }
}

module.exports = { SwapAutomation };
