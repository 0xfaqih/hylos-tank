/**
 * Transaction Service
 * Handles transaction-related operations
 */

const { NetworkUtils } = require('../utils/network');
const { FormattingUtils } = require('../utils/formatting');
const { ValidationUtils } = require('../utils/validation');
const { Helpers } = require('../utils/helpers');
const { RETRY_CONFIG } = require('../config/config');
const { AsyncUtils } = require('../utils/async');

class TransactionService {
    constructor(provider) {
        this.provider = provider;
    }

    /**
     * Send transaction
     * @param {object} wallet - Wallet instance
     * @param {object} transaction - Transaction object
     * @returns {Promise<object>} Transaction result
     */
    async sendTransaction(wallet, transaction) {
        try {
            return await AsyncUtils.retry(
                async () => {
                    const tx = await wallet.sendTransaction(transaction);
                    Helpers.log(`📨 Transaction sent: ${tx.hash}`, 'SUCCESS');
                    return tx;
                },
                RETRY_CONFIG.TRANSACTION_MAX_ATTEMPTS,
                RETRY_CONFIG.TRANSACTION_DELAY
            );
        } catch (error) {
            Helpers.log('Failed to send transaction after retries', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Wait for transaction confirmation
     * @param {string} txHash - Transaction hash
     * @param {number} confirmations - Number of confirmations (default: 1)
     * @returns {Promise<object>} Transaction receipt
     */
    async waitForConfirmation(txHash, confirmations = 1) {
        try {
            const receipt = await NetworkUtils.waitForTransaction(this.provider, txHash, confirmations);
            Helpers.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`, 'SUCCESS');
            return receipt;
        } catch (error) {
            Helpers.log('Failed to wait for transaction confirmation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get transaction status
     * @param {string} txHash - Transaction hash
     * @returns {Promise<object>} Transaction status
     */
    async getTransactionStatus(txHash) {
        try {
            const receipt = await NetworkUtils.getTransactionReceipt(this.provider, txHash);
            
            if (!receipt) {
                return { status: 'pending', message: 'Transaction not found' };
            }

            if (receipt.status === 1) {
                return {
                    status: 'confirmed',
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    confirmations: receipt.confirmations
                };
            } else {
                return { status: 'failed', message: 'Transaction failed' };
            }
        } catch (error) {
            Helpers.log('Failed to get transaction status', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Estimate gas for transaction
     * @param {object} transaction - Transaction object
     * @returns {Promise<bigint>} Estimated gas
     */
    async estimateGas(transaction) {
        try {
            return await NetworkUtils.estimateGas(this.provider, transaction);
        } catch (error) {
            Helpers.log('Failed to estimate gas', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get gas price
     * @returns {Promise<bigint>} Gas price in wei
     */
    async getGasPrice() {
        try {
            return await NetworkUtils.getGasPrice(this.provider);
        } catch (error) {
            Helpers.log('Failed to get gas price', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Build transaction object
     * @param {object} params - Transaction parameters
     * @returns {object} Transaction object
     */
    buildTransaction(params) {
        const { to, data, value = '0x0', gasLimit, gasPrice } = params;
        
        const transaction = {
            to,
            data,
            value
        };

        if (gasLimit) transaction.gasLimit = gasLimit;
        if (gasPrice) transaction.gasPrice = gasPrice;

        return transaction;
    }

    /**
     * Validate transaction parameters
     * @param {object} params - Transaction parameters
     * @returns {object} Validation result
     */
    validateTransactionParams(params) {
        const errors = [];

        if (!params.to || !ValidationUtils.isValidAddress(params.to)) {
            errors.push('Invalid recipient address');
        }

        if (params.value && !ValidationUtils.isValidAmount(params.value)) {
            errors.push('Invalid transaction value');
        }

        if (params.gasLimit && !ValidationUtils.isValidAmount(params.gasLimit)) {
            errors.push('Invalid gas limit');
        }

        if (params.gasPrice && !ValidationUtils.isValidAmount(params.gasPrice)) {
            errors.push('Invalid gas price');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = { TransactionService }; 