/**
 * Validator Service
 * Handles validator-related operations and API calls
 */

const { Helpers } = require('../utils/helpers');
const { AsyncUtils } = require('../utils/async');
const { RETRY_CONFIG } = require('../config/config');

class ValidatorService {
    constructor() {
        this.apiUrl = 'https://testnet1.helioschainlabs.org/';
        this.isInitialized = false;
    }

    /**
     * Initialize service
     */
    async initialize() {
        try {
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('❌ Failed to initialize validator service', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get validators from API
     * @param {number} page - Page number (default: 1)
     * @param {number} size - Page size (default: 100)
     * @returns {Promise<Array>} Array of validators
     */
    async getValidators(page = 1, size = 100) {
        if (!this.isInitialized) {
            throw new Error('Validator service not initialized');
        }

        try {
            const payload = {
                jsonrpc: "2.0",
                method: "eth_getValidatorsByPageAndSize",
                params: [`0x${page.toString(16)}`, `0x${size.toString(16)}`],
                id: 1
            };

            const response = await AsyncUtils.retry(
                async () => {
                    const res = await fetch(this.apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }

                    const data = await res.json();
                    
                    if (data.error) {
                        throw new Error(`API error: ${data.error.message}`);
                    }

                    return data.result;
                },
                RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
                RETRY_CONFIG.DEFAULT_DELAY
            );

            return response;
        } catch (error) {
            Helpers.log('❌ Failed to get validators', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get active validators only
     * @param {number} page - Page number (default: 1)
     * @param {number} size - Page size (default: 100)
     * @returns {Promise<Array>} Array of active validators
     */
    async getActiveValidators(page = 1, size = 100) {
        try {
            const validators = await this.getValidators(page, size);
            
            // Filter active validators (status: 3 = active, not jailed)
            const activeValidators = validators.filter(validator => 
                validator.status === 3 && !validator.jailed
            );

            return activeValidators;
        } catch (error) {
            Helpers.log('❌ Failed to get active validators', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get random active validator
     * @returns {Promise<object>} Random active validator
     */
    async getRandomValidator() {
        try {
            const activeValidators = await this.getActiveValidators();
            
            if (activeValidators.length === 0) {
                throw new Error('No active validators found');
            }

            // Get random validator
            const randomIndex = Math.floor(Math.random() * activeValidators.length);
            const randomValidator = activeValidators[randomIndex];

            Helpers.log(`🎲 Selected random validator: ${randomValidator.moniker} (${randomValidator.validatorAddress})`, 'INFO');
            
            return randomValidator;
        } catch (error) {
            Helpers.log('❌ Failed to get random validator', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get validator by address
     * @param {string} address - Validator address
     * @returns {Promise<object|null>} Validator object or null
     */
    async getValidatorByAddress(address) {
        try {
            const validators = await this.getValidators();
            const validator = validators.find(v => 
                v.validatorAddress.toLowerCase() === address.toLowerCase()
            );
            
            return validator || null;
        } catch (error) {
            Helpers.log('❌ Failed to get validator by address', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get validator info for display
     * @param {object} validator - Validator object
     * @returns {object} Formatted validator info
     */
    formatValidatorInfo(validator) {
        return {
            address: validator.validatorAddress,
            moniker: validator.moniker,
            status: validator.status,
            jailed: validator.jailed,
            apr: validator.apr,
            commission: validator.commission?.commission_rates?.rate,
            shares: validator.shares,
            description: validator.description
        };
    }
}

module.exports = { ValidatorService }; 