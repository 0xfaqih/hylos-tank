const axios = require('axios');
const UserAgent = require('user-agents');
const { Helpers } = require('../../utils/helpers');

class UserInfoService {
    constructor() {
        this.baseUrl = 'https://testnet-api.helioschain.network/api';
        this.isInitialized = false;
        this.userAgent = new UserAgent();
        this.authToken = null;
    }

    async initialize() {
        try {
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize User Info Service', error, 'ERROR');
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

    // Set auth token (called after authentication from faucet service)
    setAuthToken(token) {
        this.authToken = token;
        Helpers.log('🔑 Auth token set for User Info Service', 'INFO');
    }

    // Get user leaderboard info
    async getUserLeaderboardInfo() {
        if (!this.isInitialized) {
            throw new Error('User Info Service not initialized');
        }

        if (!this.authToken) {
            throw new Error('Authentication required - set auth token first');
        }

        try {
            Helpers.log('🏆 Getting user leaderboard info...', 'INFO');
            
            const headers = this.generateHeaders(true); // Include auth token
            const url = `${this.baseUrl}/leaderboard/user-rank`;

            const response = await axios.get(url, {
                headers: headers,
                timeout: 10000
            });

            if (response.status === 200 && response.data.success) {
                const data = response.data;
                
                Helpers.log('✅ User leaderboard info retrieved successfully', 'SUCCESS');
                Helpers.log(`🏆 Global Rank: #${data.globalRank}`, 'SUCCESS');
                Helpers.log(`⭐ User XP: ${data.userXP}`, 'SUCCESS');
                Helpers.log(`🎮 Discord: ${data.discordUsername || 'N/A'}`, 'SUCCESS');
                
                if (data.contributorRank) {
                    Helpers.log(`👑 Contributor Rank: #${data.contributorRank}`, 'SUCCESS');
                }
                
                return {
                    success: true,
                    globalRank: data.globalRank,
                    contributorRank: data.contributorRank,
                    userXP: data.userXP,
                    userContributionXP: data.userContributionXP,
                    discordUsername: data.discordUsername
                };
            } else {
                Helpers.log(`⚠️ Unexpected response: ${response.status}`, 'WARNING');
                return {
                    success: false,
                    error: 'Unexpected response',
                    status: response.status,
                    data: response.data
                };
            }

        } catch (error) {
            if (error.response) {
                if (error.response.status === 401) {
                    Helpers.log('❌ Authentication failed - token may be expired', 'ERROR');
                } else {
                    Helpers.log(`❌ Server error: ${error.response.status} - ${error.response.statusText}`, 'ERROR');
                }
                if (error.response.data) {
                    Helpers.log(`📄 Error details: ${JSON.stringify(error.response.data)}`, 'ERROR');
                }
            } else if (error.request) {
                Helpers.log('❌ No response received from server', 'ERROR');
            } else {
                Helpers.log(`❌ Request error: ${error.message}`, 'ERROR');
            }
            
            return {
                success: false,
                error: error.message,
                status: error.response?.status
            };
        }
    }

    // Get user info summary
    async getUserInfoSummary() {
        try {
            const leaderboardInfo = await this.getUserLeaderboardInfo();
            
            if (leaderboardInfo.success) {
                return {
                    success: true,
                    globalRank: leaderboardInfo.globalRank,
                    userXP: leaderboardInfo.userXP,
                    discordUsername: leaderboardInfo.discordUsername,
                    contributorRank: leaderboardInfo.contributorRank,
                    userContributionXP: leaderboardInfo.userContributionXP
                };
            } else {
                return {
                    success: false,
                    error: leaderboardInfo.error
                };
            }
        } catch (error) {
            Helpers.log('Failed to get user info summary', error, 'ERROR');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = { UserInfoService }; 