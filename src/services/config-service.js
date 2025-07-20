/**
 * Configuration Service
 * Handles configuration management and validation
 */

const { ValidationUtils } = require('../utils/validation');
const { Helpers } = require('../utils/helpers');

class ConfigService {
    constructor() {
        this.configs = new Map();
        this.defaults = new Map();
    }

    /**
     * Register configuration
     * @param {string} name - Configuration name
     * @param {object} config - Configuration object
     * @param {object} schema - Validation schema (optional)
     */
    registerConfig(name, config, schema = null) {
        try {
            if (schema) {
                this.validateConfig(config, schema);
            }
            
            this.configs.set(name, config);
            Helpers.log(`✅ Configuration '${name}' registered successfully`, 'SUCCESS');
        } catch (error) {
            Helpers.log(`Failed to register configuration '${name}'`, error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get configuration by name
     * @param {string} name - Configuration name
     * @returns {object} Configuration object
     */
    getConfig(name) {
        const config = this.configs.get(name);
        if (!config) {
            throw new Error(`Configuration '${name}' not found`);
        }
        return config;
    }

    /**
     * Set default configuration
     * @param {string} name - Configuration name
     * @param {object} defaultConfig - Default configuration
     */
    setDefault(name, defaultConfig) {
        this.defaults.set(name, defaultConfig);
    }

    /**
     * Get configuration with defaults
     * @param {string} name - Configuration name
     * @param {object} overrides - Configuration overrides
     * @returns {object} Merged configuration
     */
    getConfigWithDefaults(name, overrides = {}) {
        const config = this.getConfig(name);
        const defaultConfig = this.defaults.get(name) || {};
        
        return {
            ...defaultConfig,
            ...config,
            ...overrides
        };
    }

    /**
     * Validate configuration against schema
     * @param {object} config - Configuration to validate
     * @param {object} schema - Validation schema
     * @returns {boolean} Validation result
     */
    validateConfig(config, schema) {
        const errors = [];

        for (const [key, rules] of Object.entries(schema)) {
            const value = config[key];

            // Check if required field exists
            if (rules.required && !value) {
                errors.push(`Missing required field: ${key}`);
                continue;
            }

            // Skip validation if value is not present and not required
            if (!value && !rules.required) {
                continue;
            }

            // Type validation
            if (rules.type && typeof value !== rules.type) {
                errors.push(`Invalid type for ${key}: expected ${rules.type}, got ${typeof value}`);
            }

            // Address validation
            if (rules.isAddress && !ValidationUtils.isValidAddress(value)) {
                errors.push(`Invalid address for ${key}: ${value}`);
            }

            // Chain ID validation
            if (rules.isChainId && !ValidationUtils.isValidChainId(value)) {
                errors.push(`Invalid chain ID for ${key}: ${value}`);
            }

            // Amount validation
            if (rules.isAmount && !ValidationUtils.isValidAmount(value)) {
                errors.push(`Invalid amount for ${key}: ${value}`);
            }

            // URL validation
            if (rules.isUrl && !this.isValidUrl(value)) {
                errors.push(`Invalid URL for ${key}: ${value}`);
            }

            // Custom validation function
            if (rules.validate && typeof rules.validate === 'function') {
                try {
                    const isValid = rules.validate(value);
                    if (!isValid) {
                        errors.push(`Custom validation failed for ${key}: ${value}`);
                    }
                } catch (error) {
                    errors.push(`Validation error for ${key}: ${error.message}`);
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }

        return true;
    }

    /**
     * Check if URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean} Validation result
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all registered configuration names
     * @returns {string[]} Array of configuration names
     */
    getRegisteredConfigs() {
        return Array.from(this.configs.keys());
    }

    /**
     * Clear all configurations
     */
    clear() {
        this.configs.clear();
        this.defaults.clear();
    }

    /**
     * Remove specific configuration
     * @param {string} name - Configuration name to remove
     */
    removeConfig(name) {
        this.configs.delete(name);
        this.defaults.delete(name);
    }
}

module.exports = { ConfigService }; 