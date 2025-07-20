const axios = require('axios');
const UserAgent = require('user-agents');
const { ethers } = require('ethers');
const { Helpers } = require('../../utils/helpers');
const { CaptchaSolver } = require('../../utils/captcha-solver');

class FaucetService {
    constructor() {
        this.baseUrl = 'https://testnet-api.helioschain.network/api';
        this.isInitialized = false;
        this.userAgent = new UserAgent();
        this.authToken = null;
        this.wallet = null;
        this.captchaSolver = new CaptchaSolver();
    }

    async initialize() {
        try {
            // Initialize captcha solver
            await this.captchaSolver.initialize();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Faucet Service', error, 'ERROR');
            throw error;
        }
    }

    // Generate custom headers with random user agent
    generateHeaders(includeAuth = false) {
        const userAgent = this.userAgent.toString();
        
        const headers = {
            'User-Agent': userAgent,
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://testnet.helioschain.network',
            'Referer': 'https://testnet.helioschain.network/',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'DNT': '1',
            'Sec-GPC': '1'
        };

        if (includeAuth && this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    // Authenticate with wallet signature
    async authenticate(privateKey) {
        if (!privateKey) {
            throw new Error('Private key required for authentication');
        }

        try {
            // Create wallet from private key
            this.wallet = Helpers.createWallet(privateKey);
            const address = this.wallet.address;
            
            // Create message to sign
            const message = `Welcome to Helios! Please sign this message to verify your wallet ownership.\n\nWallet: ${address}`;
            
            // Sign message
            const signature = await this.wallet.signMessage(message);
            
            // Login with signature
            const loginPayload = {
                wallet: address,
                signature: signature
            };

            const headers = this.generateHeaders();
            const url = `${this.baseUrl}/users/login`;

            const response = await axios.post(url, loginPayload, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.status === 200 && response.data.success) {
                this.authToken = response.data.token;
                Helpers.log('✅ Authentication successful', 'SUCCESS');
                return response.data;
            } else {
                throw new Error('Authentication failed');
            }

        } catch (error) {
            Helpers.log('Authentication failed', error, 'ERROR');
            throw error;
        }
    }

    // Check available tokens from faucet
    async getAvailableTokens() {
        if (!this.isInitialized) {
            throw new Error('Faucet Service not initialized');
        }

        try {
            Helpers.log('🔍 Checking available tokens...', 'INFO');
            
            const headers = this.generateHeaders();
            const url = `${this.baseUrl}/faucet/available-tokens`;

            const response = await axios.get(url, {
                headers: headers,
                timeout: 10000,
                validateStatus: function (status) {
                    return status >= 200 && status < 500;
                }
            });

            if (response.status === 200) {
                return response.data;
            } else {
                Helpers.log(`⚠️ Unexpected response status: ${response.status}`, 'WARNING');
                return response.data;
            }

        } catch (error) {
            if (error.response) {
                Helpers.log(`❌ Server error: ${error.response.status} - ${error.response.statusText}`, 'ERROR');
            } else if (error.request) {
                Helpers.log('❌ No response received from server', 'ERROR');
            } else {
                Helpers.log(`❌ Request error: ${error.message}`, 'ERROR');
            }
            throw error;
        }
    }

    // Get faucet status for an address
    async getFaucetStatus(address) {
        if (!this.isInitialized) {
            throw new Error('Faucet Service not initialized');
        }

        if (!Helpers.isValidAddress(address)) {
            throw new Error('Invalid address provided');
        }

        try {
            Helpers.log(`🔍 Checking faucet status for ${address}`, 'INFO');
            
            const headers = this.generateHeaders();
            const url = `${this.baseUrl}/faucet/status/${address}`;
            
            const response = await axios.get(url, {
                headers: headers,
                timeout: 10000
            });

            Helpers.log('✅ Faucet status retrieved', 'SUCCESS');
            return response.data;

        } catch (error) {
            Helpers.log('Failed to get faucet status', error, 'ERROR');
            throw error;
        }
    }

    // Claim tokens from faucet with captcha solving
    async claimTokens(address, tokenType = 'HLS') {
        if (!this.isInitialized) {
            throw new Error('Faucet Service not initialized');
        }

        // Check if authenticated and token is valid
        if (!this.authToken) {
            throw new Error('Authentication required - call authenticate() first');
        }

        try {
            Helpers.log(`🚰 Claiming ${tokenType} tokens for ${address}`, 'INFO');

            const siteKey = "0x4AAAAAABhz7Yc1no53_eWA";
            
            // Solve captcha using 2captcha API v2
            const turnstileToken = await this.captchaSolver.solveTurnstile(
                siteKey,
                'https://testnet.helioschain.network/faucet',
                120
            );
            
            const headers = this.generateHeaders(true);
            const url = `${this.baseUrl}/faucet/request`;
            
            const payload = {
                token: tokenType,
                chain: "helios-testnet",
                amount: 1,
                turnstileToken: turnstileToken
            };

            const response = await axios.post(url, payload, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.status === 200 && response.data.success) {
                Helpers.log(`✅ Successfully claimed ${tokenType} tokens`, 'SUCCESS');
                Helpers.log(`📝 Transaction Hash: ${response.data.transactionHash}`, 'SUCCESS');
                Helpers.log(`🎯 XP Reward: ${response.data.xpReward}`, 'SUCCESS');
                return response.data;
            } else {
                Helpers.log(`⚠️ Claim response: ${response.status}`, 'WARNING');
                return response.data;
            }

        } catch (error) {
            if (error.response) {
                if (error.response.status === 429) {
                    Helpers.log('⏰ Faucet cooldown active - please wait before next claim', 'WARNING');
                } else {
                    Helpers.log(`❌ Claim failed: ${error.response.status} - ${error.response.statusText}`, 'ERROR');
                    if (error.response.data) {
                        Helpers.log(`📄 Error details: ${JSON.stringify(error.response.data)}`, 'ERROR');
                    }
                }
            } else {
                Helpers.log(`❌ Claim error: ${error.message}`, 'ERROR');
            }
            throw error;
        }
    }

    // Get faucet info
    async getFaucetInfo() {
        if (!this.isInitialized) {
            throw new Error('Faucet Service not initialized');
        }

        try {
            const availableTokens = await this.getAvailableTokens();
            const captchaBalance = await this.captchaSolver.getBalance();
            
            return {
                availableTokens: availableTokens.tokens || [],
                captchaBalance: captchaBalance,
                apiEndpoint: 'https://testnet-api.helioschain.network/api/faucet/request',
                supportedTokens: ['HLS'],
                chain: 'helios-testnet',
                claimAmount: 1,
                requiresCaptcha: true,
                captchaType: 'Turnstile',
                captchaSolver: '2captcha API v2'
            };
        } catch (error) {
            Helpers.log('Failed to get faucet info', error, 'ERROR');
            throw error;
        }
    }

    // Get faucet history
    async getFaucetHistory(page = 1, limit = 10) {
        if (!this.isInitialized) {
            throw new Error('Faucet Service not initialized');
        }

        if (!this.authToken) {
            throw new Error('Authentication required - call authenticate() first');
        }

        try {
            Helpers.log('📋 Getting faucet history...', 'INFO');
            
            const headers = this.generateHeaders(true); // Include auth
            const url = `${this.baseUrl}/faucet/history?page=${page}&limit=${limit}`;

            const response = await axios.get(url, {
                headers: headers,
                timeout: 10000
            });

            if (response.status === 200) {
                return response.data;
            } else {
                Helpers.log(`⚠️ History response: ${response.status}`, 'WARNING');
                return response.data;
            }

        } catch (error) {
            if (error.response) {
                Helpers.log(`❌ History error: ${error.response.status} - ${error.response.statusText}`, 'ERROR');
            } else {
                Helpers.log(`❌ History error: ${error.message}`, 'ERROR');
            }
            throw error;
        }
    }

    // Check if address can claim (not in cooldown)
    async canClaim(address) {
        try {
            if (!this.authToken) {
                Helpers.log('⚠️ No authentication - cannot check cooldown', 'WARNING');
                return false; // Cannot claim without authentication
            }

            const history = await this.getFaucetHistory(1, 10);
            
            if (history && history.faucetClaims) {
                // Find the most recent claim for this address
                const userClaims = history.faucetClaims.filter(claim => 
                    claim.wallet.toLowerCase() === address.toLowerCase()
                );
                
                if (userClaims.length > 0) {
                    const latestClaim = userClaims[0]; // Most recent first
                    const cooldownUntil = new Date(latestClaim.cooldownUntil);
                    const now = new Date();
                    
                    if (cooldownUntil > now) {
                        const timeLeft = Math.ceil((cooldownUntil - now) / (1000 * 60 * 60)); // hours
                        Helpers.log(`⏰ Cooldown active: ${timeLeft}h remaining`, 'WARNING');
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            // If history endpoint fails, assume can claim
            Helpers.log('⚠️ Could not check cooldown - assuming can claim', 'WARNING');
            return true;
        }
    }

    // Auto claim with cooldown check
    async autoClaim(address, tokenType = 'HLS') {
        if (!this.isInitialized) {
            throw new Error('Faucet Service not initialized');
        }

        if (!Helpers.isValidAddress(address)) {
            throw new Error('Invalid address provided');
        }

        try {
            // Check if can claim
            const canClaim = await this.canClaim(address);
            
            if (!canClaim) {
                Helpers.log('⏰ Skipping claim - cooldown active', 'WARNING');
                return { success: false, reason: 'cooldown' };
            }

            // Proceed with claim
            const result = await this.claimTokens(address, tokenType);
            return { success: true, result };

        } catch (error) {
            Helpers.log('Auto claim failed', error, 'ERROR');
            return { success: false, error: error.message };
        }
    }
}

module.exports = { FaucetService }; 