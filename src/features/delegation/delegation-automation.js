const { ethers } = require('ethers');
const { DelegationService } = require('./delegation-service');
const { ValidatorService } = require('../../services/validator-service');
const { DELEGATION_CONFIG, RETRY_CONFIG } = require('../../config/config');
const { Helpers } = require('../../utils/helpers');
const { AsyncUtils } = require('../../utils/async');

class DelegationAutomation {
    constructor() {
        this.delegationService = new DelegationService();
        this.validatorService = new ValidatorService();
        this.isInitialized = false;
    }

    /**
     * Initialize automation
     */
    async initialize() {
        try {
            await this.delegationService.initialize();
            await this.validatorService.initialize();
            this.isInitialized = true;
        } catch (error) {
            Helpers.log('❌ Failed to initialize delegation automation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet with private key
     * @param {string} privateKey - Wallet private key
     * @returns {string} - Wallet address
     */
    async connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Delegation automation not initialized');
        }

        try {
            const address = this.delegationService.connectWallet(privateKey);
            return address;
        } catch (error) {
            Helpers.log('❌ Failed to connect wallet in delegation automation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Delegate tokens to validator
     * @param {string} privateKey - Wallet private key
     * @param {string} validator - Validator address (optional, uses default if not provided)
     * @param {string} amount - Amount to delegate (optional, uses default if not provided)
     * @returns {Promise<object>} Delegation result
     */
    async delegate(privateKey, validator = null, amount = null) {
        if (!this.isInitialized) {
            throw new Error('Delegation automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    
                    // Set default validator if not provided
                    const defaultValidator = validator || DELEGATION_CONFIG.DEFAULT_VALIDATOR;
                    
                    // Set default amount if not provided (1.2 HELIOS)
                    const defaultAmount = amount || DELEGATION_CONFIG.DEFAULT_AMOUNT;
                    
                    // Convert amount to wei if it's in ETH format
                    let amountWei;
                    let amountEth;
                    
                    if (typeof defaultAmount === 'number' || (typeof defaultAmount === 'string' && defaultAmount.includes('.'))) {
                        // Amount is in ETH format, convert to wei
                        amountWei = Helpers.ethToWei(defaultAmount.toString());
                        amountEth = parseFloat(defaultAmount);
                    } else {
                        // Amount is already in wei format
                        amountWei = defaultAmount;
                        amountEth = parseFloat(Helpers.weiToEth(defaultAmount));
                    }
                    
                    // Check balance first
                    const balance = await this.delegationService.getBalance();
                    const balanceEth = parseFloat(Helpers.weiToEth(balance));
                    
                    if (balanceEth < amountEth) {
                        Helpers.log(`⚠️ Insufficient balance: ${balanceEth} HELIOS, need: ${amountEth} HELIOS`, 'WARNING');
                        return {
                            success: false,
                            reason: 'Insufficient balance',
                            balance: balanceEth,
                            required: amountEth
                        };
                    }

                    Helpers.log(`🎯 Starting delegation: ${amountEth} HELIOS to validator ${defaultValidator}`, 'SUCCESS');

                    // Execute delegation
                    const result = await this.delegationService.delegate(defaultValidator, amountWei);
                    
                    if (result.success) {
                        Helpers.log(`✅ Delegation successful! Tx: ${result.txHash}`, 'SUCCESS');
                    } else {
                        Helpers.log(`❌ Delegation failed: ${result.error}`, 'ERROR');
                    }

                    return result;
                },
                RETRY_CONFIG.DELEGATION_MAX_ATTEMPTS,
                RETRY_CONFIG.DELEGATION_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Delegation failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Delegate with custom parameters
     * @param {string} privateKey - Wallet private key
     * @param {string} validator - Validator address
     * @param {string} amount - Amount in wei
     * @param {string} denom - Token denomination
     * @returns {object} - Delegation result
     */
    async customDelegate(privateKey, validator, amount, denom = "ahelios") {
        if (!this.isInitialized) {
            throw new Error('Delegation automation not initialized');
        }

        try {
            // Connect wallet
            const address = await this.connectWallet(privateKey);
            
            // Check balance
            const balance = await this.delegationService.getBalance();
            const balanceEth = parseFloat(Helpers.weiToEth(balance));
            const amountEth = parseFloat(Helpers.weiToEth(amount));
            
            if (balanceEth < amountEth) {
                Helpers.log(`⚠️ Insufficient balance: ${balanceEth} HELIOS, need: ${amountEth} HELIOS`, 'WARNING');
                return {
                    success: false,
                    reason: 'Insufficient balance',
                    balance: balanceEth,
                    required: amountEth
                };
            }
            // Execute delegation
            const result = await this.delegationService.delegate(validator, amount, denom);
            
            if (result.success) {
                Helpers.log(`✅ Custom delegation successful! Tx: ${result.txHash}`, 'SUCCESS');
            } else {
                Helpers.log(`❌ Custom delegation failed: ${result.error}`, 'ERROR');
            }

            return result;

        } catch (error) {
            Helpers.log('❌ Custom delegation failed', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Delegate to random validator
     * @param {string} privateKey - Wallet private key
     * @param {string|number} amount - Amount to delegate (optional, uses random if not provided)
     * @returns {Promise<object>} Delegation result
     */
    async delegateToRandomValidator(privateKey, amount = null) {
        if (!this.isInitialized) {
            throw new Error('Delegation automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    
                    // Get random validator
                    const randomValidator = await this.validatorService.getRandomValidator();
                    
                    // Use random amount if not provided
                    if (amount === null) {
                        amount = Helpers.getRandomDelegationAmount();
                        Helpers.log(`🎲 Using random delegation amount: ${amount} HELIOS`, 'INFO');
                    }
                    
                    // Convert amount to wei if it's in ETH format
                    let amountWei;
                    let amountEth;
                    
                    if (typeof amount === 'number' || (typeof amount === 'string' && amount.includes('.'))) {
                        // Amount is in ETH format, convert to wei
                        amountWei = Helpers.ethToWei(amount.toString());
                        amountEth = parseFloat(amount);
                    } else {
                        // Amount is already in wei format
                        amountWei = amount;
                        amountEth = parseFloat(Helpers.weiToEth(amount));
                    }
                    
                    // Check balance first
                    const balance = await this.delegationService.getBalance();
                    const balanceEth = parseFloat(Helpers.weiToEth(balance));
                    
                    if (balanceEth < amountEth) {
                        Helpers.log(`⚠️ Insufficient balance: ${balanceEth} HELIOS, need: ${amountEth} HELIOS`, 'WARNING');
                        return {
                            success: false,
                            reason: 'Insufficient balance',
                            balance: balanceEth,
                            required: amountEth
                        };
                    }

                    Helpers.log(`🎯 Starting delegation to ${randomValidator.moniker} (${randomValidator.validatorAddress}): ${amountEth} HELIOS`, 'SUCCESS');

                    // Execute delegation
                    const result = await this.delegationService.delegate(randomValidator.validatorAddress, amountWei);
                    
                    if (result.success) {
                        Helpers.log(`✅ Delegation to ${randomValidator.moniker} successful! Tx: ${result.txHash}`, 'SUCCESS');
                        result.validator = randomValidator;
                    } else {
                        Helpers.log(`❌ Delegation to ${randomValidator.moniker} failed: ${result.error}`, 'ERROR');
                    }

                    return result;
                },
                RETRY_CONFIG.DELEGATION_MAX_ATTEMPTS,
                RETRY_CONFIG.DELEGATION_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Delegate to random validator failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Claim delegation rewards
     * @param {string} privateKey - Wallet private key
     * @param {string|number} claimAmountOrId - Amount or ID to claim
     * @returns {Promise<object>} Claim result
     */
    async claimReward(privateKey, claimAmountOrId) {
        if (!this.isInitialized) {
            throw new Error('Delegation automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    // Execute claim
                    const result = await this.delegationService.claimReward(claimAmountOrId);
                    
                    if (result.success) {
                        Helpers.log(`✅ Claim reward successful! Tx: ${result.txHash}`, 'SUCCESS');
                    } else {
                        Helpers.log(`❌ Claim reward failed: ${result.error}`, 'ERROR');
                    }

                    return result;
                },
                RETRY_CONFIG.DELEGATION_MAX_ATTEMPTS,
                RETRY_CONFIG.DELEGATION_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Claim reward failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Get delegation service instance
     * @returns {DelegationService} - Delegation service instance
     */
    getDelegationService() {
        return this.delegationService;
    }
}

module.exports = { DelegationAutomation }; 