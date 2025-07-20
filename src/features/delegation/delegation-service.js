const { ethers } = require('ethers');
const { DelegationCalldataBuilder } = require('./calldata-builder');
const { NetworkConfig } = require('../../config/network');
const { DELEGATION_CONFIG } = require('../../config/config');
const { Helpers } = require('../../utils/helpers');

class DelegationService {
    constructor() {
        this.calldataBuilder = new DelegationCalldataBuilder();
        this.networkConfig = new NetworkConfig();
        this.provider = null;
        this.wallet = null;
        this.isInitialized = false;
    }

    /**
     * Initialize service
     */
    async initialize() {
        try {
            this.provider = this.networkConfig.getProvider();
            await this.networkConfig.validateConnection();
            this.isInitialized = true;
        } catch (error) {
            Helpers.log('❌ Failed to initialize delegation service', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet with private key
     * @param {string} privateKey - Wallet private key
     */
    connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Delegation service not initialized');
        }

        try {
            this.wallet = Helpers.createWallet(privateKey, this.provider);
            const address = this.wallet.address;
            Helpers.log(`✅ Wallet connected: ${address}`, 'SUCCESS');
            return address;
        } catch (error) {
            Helpers.log('❌ Failed to connect wallet', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Delegate tokens to validator
     * @param {string} validator - Validator address
     * @param {string} amount - Amount to delegate (in wei)
     * @param {string} denom - Token denomination (default: ahelios)
     * @returns {object} - Delegation result
     */
    async delegate(validator, amount, denom = "ahelios") {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const delegator = this.wallet.address;
            const targetContract = this.calldataBuilder.getTargetContract();
            
            // Build calldata
            const calldata = this.calldataBuilder.buildDelegationCalldata(
                delegator,
                validator,
                amount,
                denom
            );

            Helpers.log(`📦 Building delegation calldata for ${Helpers.weiToEth(amount)} HELIOS`, 'SUCCESS');

            const nonce = await this.provider.getTransactionCount(this.wallet.address);
            // Send transaction
            const tx = await this.wallet.sendTransaction({
                to: targetContract,
                data: calldata,
                gasLimit: DELEGATION_CONFIG.GAS_LIMIT,
                nonce: nonce
            });

            Helpers.log(`📨 Delegation transaction sent: ${tx.hash}`, 'SUCCESS');

            // Wait for confirmation
            const receipt = await tx.wait();
            Helpers.log(`✅ Delegation confirmed in block: ${receipt.blockNumber}`, 'SUCCESS');

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                delegator,
                validator,
                amount,
                denom
            };

        } catch (error) {
            Helpers.log('❌ Delegation failed', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Get wallet address
     * @returns {string} - Wallet address
     */
    getWalletAddress() {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }
        return this.wallet.address;
    }

    /**
     * Check wallet balance
     * @returns {string} - Balance in wei
     */
    async getBalance() {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return balance.toString();
        } catch (error) {
            Helpers.log('❌ Failed to get balance', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Claim delegation rewards
     * @param {string} claimAmountOrId - Amount or ID to claim
     * @returns {object} - Claim result
     */
    async claimReward(claimAmountOrId) {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const delegator = this.wallet.address;
            const targetContract = "0x0000000000000000000000000000000000000801"; // Claim contract address
            
            // Build calldata for claim
            const calldata = this.calldataBuilder.buildClaimCalldata(
                delegator,
                claimAmountOrId
            );

            Helpers.log(`🎁 Building reward delegation calldata`, 'SUCCESS');

            const nonce = await this.provider.getTransactionCount(this.wallet.address);
            // Send transaction
            const tx = await this.wallet.sendTransaction({
                to: targetContract,
                data: calldata,
                gasLimit: DELEGATION_CONFIG.GAS_LIMIT,
                nonce: nonce
            });

            Helpers.log(`📨 Claim transaction sent: ${tx.hash}`, 'SUCCESS');

            // Wait for confirmation
            const receipt = await tx.wait();
            Helpers.log(`✅ Claim confirmed in block: ${receipt.blockNumber}`, 'SUCCESS');

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                delegator,
                claimAmountOrId
            };

        } catch (error) {
            Helpers.log('❌ Claim reward failed', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }
}

module.exports = { DelegationService }; 