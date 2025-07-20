const { NetworkConfig } = require('../config/network');
const { WalletManager } = require('../core/wallet');
const { Helpers } = require('../utils/helpers');

class HeliosAutomation {
    constructor() {
        this.networkConfig = new NetworkConfig();
        this.walletManager = new WalletManager();
        this.isInitialized = false;
    }

    // Initialize automation
    async initialize() {
        try {
            const isConnected = await this.networkConfig.validateConnection();
            if (!isConnected) {
                throw new Error('Failed to connect to Helios testnet');
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize automation', error, 'ERROR');
            throw error;
        }
    }

    async connectWallet() {
        if (!this.isInitialized) {
            throw new Error('Automation not initialized. Call initialize() first.');
        }

        try {
            return this.walletManager.connectFromEnvironment();
        } catch (error) {
            Helpers.log('Failed to connect wallet', error, 'ERROR');
            throw error;
        }
    }

    // Connect wallet with private key
    async connectWithPrivateKey(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Automation not initialized. Call initialize() first.');
        }

        if (!privateKey) {
            throw new Error('Private key is required');
        }

        if (!Helpers.isValidPrivateKey(privateKey)) {
            throw new Error('Invalid private key');
        }

        try {
            const wallet = this.walletManager.connectWithPrivateKey(privateKey);
            return wallet;
        } catch (error) {
            Helpers.log('Failed to connect wallet', error, 'ERROR');
            throw error;
        }
    }

    // Connect wallet with mnemonic
    async connectWithMnemonic(mnemonic) {
        if (!this.isInitialized) {
            throw new Error('Automation not initialized. Call initialize() first.');
        }

        if (!mnemonic) {
            throw new Error('Mnemonic is required');
        }

        if (!Helpers.isValidMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic');
        }

        try {
            return this.walletManager.connectWithMnemonic(mnemonic);
        } catch (error) {
            Helpers.log('Failed to connect wallet', error, 'ERROR');
            throw error;
        }
    }

    // Check wallet balance
    async checkBalance(address = null) {
        if (!this.isInitialized) {
            throw new Error('Automation not initialized');
        }

        if (!this.walletManager.isConnected() && !address) {
            throw new Error('Wallet not connected and no address provided');
        }

        try {
            return await this.walletManager.getBalance(address);
        } catch (error) {
            Helpers.log('Failed to check balance', error, 'ERROR');
            throw error;
        }
    }

    // Get wallet info
    getWalletInfo() {
        if (!this.isInitialized) {
            throw new Error('Automation not initialized');
        }

        if (!this.walletManager.isConnected()) {
            throw new Error('Wallet not connected');
        }

        try {
            return this.walletManager.getWalletInfo();
        } catch (error) {
            Helpers.log('Failed to get wallet info', error, 'ERROR');
            throw error;
        }
    }

    // Get network info
    getNetworkInfo() {
        return this.networkConfig.getNetworkInfo();
    }

    // Check status automation
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isWalletConnected: this.walletManager.isConnected(),
            networkInfo: this.getNetworkInfo(),
            walletAddress: this.walletManager.isConnected() ? this.walletManager.getAddress() : null
        };
    }

    // Batch check balance for multiple addresses
    async batchCheckBalance(addresses) {
        if (!this.isInitialized) {
            throw new Error('Automation not initialized');
        }

        if (!Array.isArray(addresses) || addresses.length === 0) {
            throw new Error('Invalid address list');
        }

        const results = [];
        
        for (const address of addresses) {
            try {
                if (!Helpers.isValidAddress(address)) {
                    Helpers.log(`⚠️ Invalid address: ${address}`, 'WARNING');
                    continue;
                }

                const balance = await this.checkBalance(address);
                results.push(balance);
                
                // Delay to avoid rate limiting
                await Helpers.sleep(500);
            } catch (error) {
                Helpers.log(`❌ Failed to check balance for ${address}: ${error.message}`, 'ERROR');
                results.push({
                    address: address,
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = { HeliosAutomation }; 