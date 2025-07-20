const { UserInfoService } = require('./userinfo-service');
const { Helpers } = require('../../utils/helpers');
const { RETRY_CONFIG } = require('../../config/config');
const { AsyncUtils } = require('../../utils/async');

class UserInfoAutomation {
    constructor(telegramNotifier) {
        this.userInfo = new UserInfoService();
        this.telegramNotifier = telegramNotifier;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.userInfo.initialize();
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize User Info Automation', error, 'ERROR');
            throw error;
        }
    }

    // Set auth token from faucet service
    setAuthToken(token) {
        this.userInfo.setAuthToken(token);
    }

    // Get user leaderboard info with notification
    async getUserLeaderboardInfo(address) {
        if (!this.isInitialized) {
            throw new Error('User Info Automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    const result = await this.userInfo.getUserLeaderboardInfo();
                    
                    if (result.success) {
                        // Send success notification to Telegram
                        await this.telegramNotifier.sendFeatureNotification('USER LEADERBOARD INFO', true, {
                            walletAddress: address,
                            globalRank: result.globalRank,
                            userXP: result.userXP,
                            discordUsername: result.discordUsername,
                            contributorRank: result.contributorRank
                        });
                    } else {
                        // Send failure notification to Telegram
                        await this.telegramNotifier.sendFeatureNotification('USER LEADERBOARD INFO', false, {
                            walletAddress: address,
                            error: result.error
                        });
                    }
                    
                    return result;
                },
                RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
                RETRY_CONFIG.DEFAULT_DELAY
            );
        } catch (error) {
            Helpers.log('Get user leaderboard info failed after retries', error, 'ERROR');
            
            // Send error notification to Telegram
            await this.telegramNotifier.sendFeatureNotification('USER LEADERBOARD INFO', false, {
                walletAddress: address,
                error: error.message
            });
            
            return { success: false, error: error.message };
        }
    }

    // Get user info summary
    async getUserInfoSummary(address) {
        if (!this.isInitialized) {
            throw new Error('User Info Automation not initialized');
        }

        try {
            const result = await this.userInfo.getUserInfoSummary();
            
            if (result.success) {
                // Send success notification to Telegram
                await this.telegramNotifier.sendFeatureNotification('USER INFO SUMMARY', true, {
                    walletAddress: address,
                    globalRank: result.globalRank,
                    userXP: result.userXP,
                    discordUsername: result.discordUsername
                });
            } else {
                // Send failure notification to Telegram
                await this.telegramNotifier.sendFeatureNotification('USER INFO SUMMARY', false, {
                    walletAddress: address,
                    error: result.error
                });
            }
            
            return result;
        } catch (error) {
            Helpers.log('Get user info summary failed', error, 'ERROR');
            
            // Send error notification to Telegram
            await this.telegramNotifier.sendFeatureNotification('USER INFO SUMMARY', false, {
                walletAddress: address,
                error: error.message
            });
            
            return { success: false, error: error.message };
        }
    }

    // Check and get user info (main method for automation)
    async checkAndGetUserInfo(address) {
        if (!this.isInitialized) {
            throw new Error('User Info Automation not initialized');
        }

        try {
            Helpers.log('👤 Checking user leaderboard info...', 'INFO');
            
            const result = await this.getUserLeaderboardInfo(address);
            
            if (result.success) {
                Helpers.log('✅ User info retrieved successfully', 'SUCCESS');
                return { success: true, result };
            } else {
                Helpers.log(`⚠️ Failed to get user info: ${result.error}`, 'WARNING');
                return { success: false, reason: result.error };
            }
            
        } catch (error) {
            Helpers.log('Check and get user info failed', error, 'ERROR');
            return { success: false, error: error.message };
        }
    }
}

module.exports = { UserInfoAutomation }; 