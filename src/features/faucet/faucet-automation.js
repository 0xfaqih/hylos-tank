const { FaucetService } = require('./faucet');
const { Helpers } = require('../../utils/helpers');
const { RETRY_CONFIG } = require('../../config/config');
const { AsyncUtils } = require('../../utils/async');

class FaucetAutomation {
    constructor() {
        this.faucet = new FaucetService();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.faucet.initialize();
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Faucet Automation', error, 'ERROR');
            throw error;
        }
    }

    async authenticate(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Faucet Automation not initialized');
        }

        try {
            await this.faucet.authenticate(privateKey);
            return true;
        } catch (error) {
            Helpers.log('Faucet authentication failed', error, 'ERROR');
            throw error;
        }
    }

    async checkAndClaim(address, privateKey, tokenType = 'HLS') {
        if (!this.isInitialized) {
            throw new Error('Faucet Automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Authenticate if not already authenticated
                    if (!this.faucet.authToken) {
                        await this.authenticate(privateKey);
                    }

                    // Check if can claim
                    const canClaim = await this.faucet.canClaim(address);
                    
                    if (!canClaim) {
                        Helpers.log('⏰ Address in cooldown - skipping claim', 'WARNING');
                        return { success: false, reason: 'cooldown' };
                    }

                    // Check captcha solver balance
                    const balance = await this.faucet.captchaSolver.getBalance();
                    Helpers.log(`💰 Captcha solver balance: $${balance}`, 'INFO');
                    
                    if (balance < 0.1) {
                        Helpers.log('⚠️ Low captcha solver balance - consider adding funds', 'WARNING');
                    }

                    // Proceed with claim
                    const result = await this.faucet.claimTokens(address, tokenType);
                    return { success: true, result };
                },
                RETRY_CONFIG.FAUCET_MAX_ATTEMPTS,
                RETRY_CONFIG.FAUCET_DELAY
            );
        } catch (error) {
            Helpers.log('Check and claim failed after retries', error, 'ERROR');
            return { success: false, error: error.message };
        }
    }

    async getFaucetInfo() {
        if (!this.isInitialized) {
            throw new Error('Faucet Automation not initialized');
        }

        try {
            return await this.faucet.getFaucetInfo();
        } catch (error) {
            Helpers.log('Failed to get faucet info', error, 'ERROR');
            throw error;
        }
    }

    async getClaimHistory(page = 1, limit = 10) {
        if (!this.isInitialized) {
            throw new Error('Faucet Automation not initialized');
        }

        try {
            // For new API, we don't have direct access to claim history
            // Return a message indicating this limitation
            return {
                message: 'Claim history not available with current API',
                suggestion: 'Check transaction hash from claim response for details',
                page: page,
                limit: limit
            };
        } catch (error) {
            Helpers.log('Failed to get claim history', error, 'ERROR');
            throw error;
        }
    }
}

module.exports = { FaucetAutomation }; 