/**
 * Balance Service
 * Handles balance-related operations
 */

const { NetworkUtils } = require('../utils/network');
const { FormattingUtils } = require('../utils/formatting');
const { ValidationUtils } = require('../utils/validation');
const { Helpers } = require('../utils/helpers');

class BalanceService {
    constructor(provider) {
        this.provider = provider;
    }

    /**
     * Get balance for address
     * @param {string} address - Address to check balance for
     * @returns {Promise<object>} Balance information
     */
    async getBalance(address) {
        try {
            if (!ValidationUtils.isValidAddress(address)) {
                throw new Error('Invalid address provided');
            }

            const balance = await this.provider.getBalance(address);
            const balanceInEth = FormattingUtils.weiToEth(balance);
            
            Helpers.log(`💰 Balance: ${balanceInEth} HELIOS`, 'INFO');
            
            return {
                address,
                balance: balance.toString(),
                balanceInEth,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            Helpers.log('Failed to get balance', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get balances for multiple addresses
     * @param {string[]} addresses - Array of addresses
     * @returns {Promise<object[]>} Array of balance information
     */
    async getBalances(addresses) {
        try {
            const balancePromises = addresses.map(address => this.getBalance(address));
            return await Promise.all(balancePromises);
        } catch (error) {
            Helpers.log('Failed to get balances', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Check if address has sufficient balance
     * @param {string} address - Address to check
     * @param {string} requiredAmount - Required amount in wei
     * @returns {Promise<object>} Balance check result
     */
    async hasSufficientBalance(address, requiredAmount) {
        try {
            const balanceInfo = await this.getBalance(address);
            const currentBalance = BigInt(balanceInfo.balance);
            const required = BigInt(requiredAmount);
            
            const hasSufficient = currentBalance >= required;
            const difference = currentBalance - required;
            
            return {
                hasSufficient,
                currentBalance: balanceInfo.balanceInEth,
                requiredAmount: FormattingUtils.weiToEth(requiredAmount),
                difference: FormattingUtils.weiToEth(difference.toString()),
                address
            };
        } catch (error) {
            Helpers.log('Failed to check sufficient balance', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get balance with gas estimation
     * @param {string} address - Address to check
     * @param {object} transaction - Transaction for gas estimation
     * @returns {Promise<object>} Balance with gas estimation
     */
    async getBalanceWithGasEstimation(address, transaction) {
        try {
            const balanceInfo = await this.getBalance(address);
            
            // Estimate gas for the transaction
            const estimatedGas = await NetworkUtils.estimateGas(this.provider, {
                ...transaction,
                from: address
            });
            
            // Get gas price
            const gasPrice = await NetworkUtils.getGasPrice(this.provider);
            
            // Calculate total gas cost
            const gasCost = estimatedGas * gasPrice;
            const gasCostInEth = FormattingUtils.weiToEth(gasCost);
            
            // Check if balance is sufficient for transaction + gas
            const totalCost = BigInt(transaction.value || '0') + gasCost;
            const hasSufficient = BigInt(balanceInfo.balance) >= totalCost;
            
            return {
                ...balanceInfo,
                estimatedGas: estimatedGas.toString(),
                gasPrice: gasPrice.toString(),
                gasCost: gasCost.toString(),
                gasCostInEth,
                totalCost: totalCost.toString(),
                totalCostInEth: FormattingUtils.weiToEth(totalCost.toString()),
                hasSufficient,
                canExecute: hasSufficient
            };
        } catch (error) {
            Helpers.log('Failed to get balance with gas estimation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Format balance for display
     * @param {string|bigint} balance - Balance in wei
     * @param {string} symbol - Token symbol (default: 'HELIOS')
     * @returns {string} Formatted balance string
     */
    static formatBalanceForDisplay(balance, symbol = 'HELIOS') {
        const balanceInEth = FormattingUtils.weiToEth(balance);
        return `${balanceInEth} ${symbol}`;
    }

    /**
     * Calculate percentage of balance
     * @param {string|bigint} amount - Amount in wei
     * @param {string|bigint} totalBalance - Total balance in wei
     * @returns {string} Percentage string
     */
    static calculateBalancePercentage(amount, totalBalance) {
        const amountBigInt = BigInt(amount);
        const totalBigInt = BigInt(totalBalance);
        const percentage = (Number(amountBigInt) / Number(totalBigInt)) * 100;
        return FormattingUtils.formatPercentage(percentage / 100);
    }
}

module.exports = { BalanceService }; 