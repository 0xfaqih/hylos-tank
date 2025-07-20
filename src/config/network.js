const { ethers } = require('ethers');
const { Helpers } = require('../utils/helpers');
const { NetworkUtils } = require('../utils/network');
require('dotenv').config();

const HELIOS_TESTNET_CONFIG = {
    name: 'Helios Testnet',
    chainId: 42000,
    rpcUrl: process.env.RPC_URL || 'https://testnet1.helioschainlabs.org',
    blockExplorer: 'https://testnet1.helioschainlabs.org',
    nativeCurrency: {
        name: 'HELIOS',
        symbol: 'HLS',
        decimals: 18
    }
};

class NetworkConfig {
    constructor() {
        this.config = HELIOS_TESTNET_CONFIG;
    }

    getProvider() {
        return NetworkUtils.createProvider(
            this.config.rpcUrl, 
            this.config.chainId, 
            this.config.name
        );
    }

    getNetworkInfo() {
        return this.config;
    }

    async validateConnection() {
        try {
            const provider = this.getProvider();
            const network = await provider.getNetwork();
            Helpers.log(`✅ Connected to ${this.config.name}`, 'SUCCESS');
            return true;
        } catch (error) {
            Helpers.log(`❌ Failed to connect to ${this.config.name}: ${error.message}`, 'ERROR');
            return false;
        }
    }
}

module.exports = { NetworkConfig, HELIOS_TESTNET_CONFIG }; 