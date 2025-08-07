/**
 * Swap Service
 * Core swap functionality for token swapping operations
 */

const { ethers, parseUnits } = require('ethers');
const axios = require('axios');
const { Helpers } = require('../../utils/helpers');
const { NetworkUtils } = require('../../utils/network');
const { HELIOS_TESTNET_CONFIG} = require('../../config/network');

class SwapService {
    constructor() {
        this.isInitialized = false;
        this.provider = null;
        this.wallet = null;
        this.routerAddress = "0xe80Ee0F963E9F636035B36bb1a40d0609f437C45";
        this.routerAbi = [
            "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
        ];
        this.erc20Abi = [
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)"
        ];
        this.router = null;
    }

    /**
     * Initialize swap service
     * @returns {Promise<boolean>} Initialization result
     */
    async initialize() {
        try {
            this.provider = NetworkUtils.createProvider(HELIOS_TESTNET_CONFIG.rpcUrl, HELIOS_TESTNET_CONFIG.chainId, HELIOS_TESTNET_CONFIG.name);
            this.router = new ethers.Contract(this.routerAddress, this.routerAbi, this.provider);
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Swap Service', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet to swap service
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<string>} Wallet address
     */
    async connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Swap Service not initialized');
        }

        try {
            this.wallet = Helpers.createWallet(privateKey, this.provider);
            this.router = this.router.connect(this.wallet);
            return this.wallet.address;
        } catch (error) {
            Helpers.log('Failed to connect swap wallet', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get quote from Solariswap API
     * @param {string} tokenIn - Token in address
     * @param {string} tokenOut - Token out address
     * @param {string} amountIn - Amount in wei
     * @returns {Promise<object>} Quote data
     */
    async getQuote(tokenIn, tokenOut, amountIn) {
        try {
            const url = `https://api.solariswap.finance/v1/quote?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}&mode=exactInput`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            Helpers.log('Failed to get quote from Solariswap', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Check and approve token allowance
     * @param {string} tokenAddress - Token address
     * @param {string} amount - Amount to approve
     * @returns {Promise<boolean>} Approval result
     */
    async checkAndApproveToken(tokenAddress, amount) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, this.erc20Abi, this.wallet);
            const allowance = await tokenContract.allowance(this.wallet.address, this.routerAddress);

            if (BigInt(allowance) < BigInt(amount)) {
                Helpers.log('Approving token...', 'INFO');
                const approveTx = await tokenContract.approve(this.routerAddress, amount);
                await approveTx.wait();
                Helpers.log('Token approval successful', 'SUCCESS');
                return true;
            } else {
                Helpers.log('Token allowance sufficient', 'INFO');
                return true;
            }
        } catch (error) {
            Helpers.log('Failed to approve token', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Execute swap transaction
     * @param {object} params - Swap parameters
     * @returns {Promise<object>} Transaction result
     */
    async executeSwap(params) {
        if (!this.isInitialized) {
            throw new Error('Swap Service not initialized');
        }

        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const {
                tokenIn,
                tokenOut,
                amountIn,
                amountOutMinimum = "0",
                deadline = Math.floor(Date.now() / 1000) + 600
            } = params;

            // Get quote from Solariswap
            const quoteData = await this.getQuote(tokenIn, tokenOut, amountIn);

            // Check and approve token
            await this.checkAndApproveToken(tokenIn, amountIn);

            // Prepare swap parameters
            const swapParams = {
                tokenIn: quoteData.tokenIn,
                tokenOut: quoteData.tokenOut,
                fee: quoteData.pool.fee,
                recipient: this.wallet.address,
                deadline: deadline,
                amountIn: quoteData.amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            };

            // Execute swap
            const tx = await this.router.exactInputSingle(swapParams);
            const receipt = await tx.wait();

            // Check if transaction was successful
            if (receipt.status === 0) {
                throw new Error('Transaction reverted on-chain');
            }

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                amountIn: amountIn,
                amountOut: quoteData.amountOut,
                tokenIn: tokenIn,
                tokenOut: tokenOut
            };

        } catch (error) {
            Helpers.log('Swap execution failed', error, 'ERROR');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute swap with default parameters (HLS to WETH)
     * @param {string} privateKey - Wallet private key
     * @param {string} amount - Amount in HLS (e.g., "1.0")
     * @returns {Promise<object>} Swap result
     */
    async swapHlsToWeth(privateKey, amount = "1.0") {
        try {
            await this.connectWallet(privateKey);
            
            const tokenIn = "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517"; // HLS
            const tokenOut = "0x80b5a32e4f032b2a058b4f29ec95eefeeb87adcd"; // WETH
            const amountIn = parseUnits(amount, 18).toString();

            return await this.executeSwap({
                tokenIn,
                tokenOut,
                amountIn
            });

        } catch (error) {
            Helpers.log('HLS to WETH swap failed', error, 'ERROR');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = { SwapService };
