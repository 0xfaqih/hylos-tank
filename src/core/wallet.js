const { ethers } = require('ethers');
const { NetworkConfig } = require('../config/network');
const { WalletUtils } = require('../utils/wallet');
const { FormattingUtils } = require('../utils/formatting');
const { Helpers } = require('../utils/helpers');
require('dotenv').config();

class WalletManager {
    constructor() {
        this.networkConfig = new NetworkConfig();
        this.provider = this.networkConfig.getProvider();
        this.wallet = null;
    }

    connectWithPrivateKey(privateKey) {
        try {
            this.wallet = WalletUtils.createWallet(privateKey, this.provider);
            return this.wallet;
        } catch (error) {
            Helpers.log('❌ Failed to connect wallet', error, 'ERROR');
            throw error;
        }
    }

    getAddress() {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }
        return this.wallet.address;
    }

    async getBalance(address = null) {
        try {
            const targetAddress = address || this.getAddress();
            const balance = await this.provider.getBalance(targetAddress);
            const balanceInEth = FormattingUtils.weiToEth(balance);
            
            Helpers.log(`💰 Balance: ${balanceInEth} HELIOS`, 'INFO');
            
            return {
                address: targetAddress,
                balance: balance,
                balanceInEth: balanceInEth
            };
        } catch (error) {
            Helpers.log('❌ Failed to get balance', error, 'ERROR');
            throw error;
        }
    }

    isConnected() {
        return this.wallet !== null;
    }
}

module.exports = { WalletManager }; 