/**
 * Bridge Service
 * Core bridge functionality for token bridging operations
 */

const { ethers } = require('ethers');
const { BRIDGE_CONFIGS } = require('../../config/bridge-config');
const { BridgeCalldataBuilder } = require('./calldata-builder');
const { Helpers } = require('../../utils/helpers');
const { NetworkUtils } = require('../../utils/network');

class BridgeService {
    constructor() {
        this.config = BRIDGE_CONFIGS['helios-testnet'];
        this.isInitialized = false;
        this.provider = null;
        this.wallet = null;
    }

    /**
     * Initialize bridge service
     * @returns {Promise<boolean>} Initialization result
     */
    async initialize() {
        try {
            this.provider = NetworkUtils.createProvider(this.config.rpcUrl, this.config.chainId, this.config.name);
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Bridge Service', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet to bridge service
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<string>} Wallet address
     */
    async connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Bridge Service not initialized');
        }

        try {
            this.wallet = Helpers.createWallet(privateKey, this.provider);
            return this.wallet.address;
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
            throw new Error('Bridge Service not initialized');
        }

        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const {
                destChainId,
                tokenAddress,
                amountWei,
                feeOrGas,
                extraString,
                gasLimit = this.config.gasLimits.default
            } = params;

            // Validate parameters
            BridgeCalldataBuilder.validateBridgeParams(destChainId, tokenAddress, amountWei, feeOrGas, extraString);

            // Check if destination chain is supported
            if (!this.config.supportedChains[destChainId]) {
                throw new Error(`Unsupported destination chain: ${destChainId}`);
            }

            // Build calldata
            const calldata = BridgeCalldataBuilder.buildBridgeCalldata(
                destChainId,
                tokenAddress,
                amountWei,
                feeOrGas,
                extraString
            );

            // Estimate gas if not provided
            let estimatedGas = gasLimit;
            try {
                estimatedGas = await this.provider.estimateGas({
                    from: this.wallet.address,
                    to: this.config.bridgeContract,
                    data: calldata
                });
                estimatedGas = estimatedGas * 120n / 100n; // Add 20% buffer
            } catch (error) {
                Helpers.log('Gas estimation failed, using default', 'WARNING');
            }

            // Send transaction
            Helpers.log(`🌉 Bridging ${Helpers.weiToEth(amountWei)} tokens to chain ${destChainId}`, 'INFO');
            
            const tx = await this.wallet.sendTransaction({
                to: this.config.bridgeContract,
                data: calldata,
                gasLimit: estimatedGas
            });

            Helpers.log(`📨 Bridge transaction sent: ${tx.hash}`, 'SUCCESS');
            
            // Wait for confirmation
            const receipt = await tx.wait();
            Helpers.log(`✅ Bridge confirmed at block: ${receipt.blockNumber}`, 'SUCCESS');

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                destChainId,
                amount: amountWei
            };

        } catch (error) {
            Helpers.log('Bridge transaction failed', error, 'ERROR');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get bridge transaction status
     * @param {string} txHash - Transaction hash
     * @returns {Promise<object>} Transaction status
     */
    async getBridgeStatus(txHash) {
        if (!this.isInitialized) {
            throw new Error('Bridge Service not initialized');
        }

        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            
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
            Helpers.log('Failed to get bridge status', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get supported chains
     * @returns {Promise<object>} Supported chains configuration
     */
    async getSupportedChains() {
        return this.config.supportedChains;
    }

    /**
     * Estimate gas for bridge transaction
     * @param {object} params - Bridge parameters
     * @returns {Promise<object>} Gas estimation result
     */
    async estimateBridgeGas(params) {
        if (!this.isInitialized) {
            throw new Error('Bridge Service not initialized');
        }

        try {
            const calldata = BridgeCalldataBuilder.buildBridgeCalldata(
                params.destChainId,
                params.tokenAddress,
                params.amountWei,
                params.feeOrGas,
                params.extraString
            );

            const estimatedGas = await this.provider.estimateGas({
                from: this.wallet?.address || '0x0000000000000000000000000000000000000000',
                to: this.config.bridgeContract,
                data: calldata
            });

            return {
                estimatedGas: estimatedGas.toString(),
                recommendedGas: (estimatedGas * 120n / 100n).toString(), // 20% buffer
                gasPrice: (await this.provider.getFeeData()).gasPrice?.toString() || '0'
            };

        } catch (error) {
            Helpers.log('Failed to estimate bridge gas', error, 'ERROR');
            throw error;
        }
    }
}

module.exports = { BridgeService }; 