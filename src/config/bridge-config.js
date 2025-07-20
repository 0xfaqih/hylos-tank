const BRIDGE_CONFIGS = {
    'helios-testnet': {
        bridgeContract: '0x0000000000000000000000000000000000000900',
        rpcUrl: 'https://testnet1.helioschainlabs.org',
        chainId: 42000,
        name: 'Helios Testnet',
        supportedChains: {
            11155111: {
                name: 'Sepolia',
                rpc: 'https://sepolia.infura.io/v3/your-api-key',
                explorer: 'https://sepolia.etherscan.io'
            },
            137: {
                name: 'Polygon',
                rpc: 'https://polygon-rpc.com',
                explorer: 'https://polygonscan.com'
            },
            56: {
                name: 'BSC',
                rpc: 'https://bsc-dataseed.binance.org',
                explorer: 'https://bscscan.com'
            }
        },
        gasLimits: {
            default: 1500000,
            high: 2000000,
            low: 1000000
        },
        functionSelectors: {
            bridge: '0x7ae4a8ff'
        }
    }
};

module.exports = { BRIDGE_CONFIGS }; 