const { HeliosAutomation } = require('./src/service/automation');
const { FaucetAutomation } = require('./src/features/faucet/faucet-automation');
const { BridgeAutomation } = require('./src/features/bridge/bridge-automation');
const { DelegationAutomation } = require('./src/features/delegation/delegation-automation');
const { GovernanceAutomation } = require('./src/features/governance/governance-automation');
const { UserInfoAutomation } = require('./src/features/userinfo/userinfo-automation');
const { SwapAutomation } = require('./src/features/swap/swap-automation');
const { Helpers } = require('./src/utils/helpers');
const { FEATURE_FLAGS, RETRY_CONFIG } = require('./src/config/config');
const { AsyncUtils } = require('./src/utils/async');
const { TelegramNotifier } = require('./src/utils/telegram-notifier');
const { CycleManager } = require('./src/utils/cycle-manager');
const { FeatureExecutor } = require('./src/features/feature-executor');
require('dotenv').config();

/**
 * HeliosMain - Main orchestrator class for Helios automation
 */
class HeliosMain {
    constructor() {
        this.services = {
            automation: new HeliosAutomation(),
            faucet: new FaucetAutomation(),
            bridge: new BridgeAutomation(),
            delegation: new DelegationAutomation(),
            governance: new GovernanceAutomation(),
            userInfo: new UserInfoAutomation(new TelegramNotifier()),
            swap: new SwapAutomation()
        };
        
        this.telegramNotifier = new TelegramNotifier();
        this.cycleManager = new CycleManager(this.telegramNotifier);
        this.featureExecutor = new FeatureExecutor(this.telegramNotifier, this.cycleManager);
        this.isInitialized = false;
    }

    /**
     * Initialize all services
     * @returns {Promise<boolean>} Initialization result
     */
    async initialize() {
        try {
            const initPromises = Object.entries(this.services).map(async ([name, service]) => {
                await service.initialize();
                Helpers.log(`✅ ${name} service initialized`, 'SUCCESS');
            });

            await Promise.all(initPromises);
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Helios Main', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet and get address
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<string>} Wallet address
     */
    async connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Helios Main not initialized');
        }

        try {
            await this.services.automation.connectWithPrivateKey(privateKey);
            const address = this.services.automation.walletManager.getAddress();
            return address;
        } catch (error) {
            Helpers.log('Failed to connect wallet', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Check wallet balance
     * @param {string} address - Wallet address (optional)
     * @returns {Promise<string>} Balance
     */
    async checkBalance(address = null) {
        if (!this.isInitialized) {
            throw new Error('Helios Main not initialized');
        }

        try {
            const balance = await this.services.automation.checkBalance(address);
            return balance;
        } catch (error) {
            Helpers.log('Failed to check balance', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Execute full automation cycle
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<object>} Cycle results
     */
    async executeFullCycle(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Helios Main not initialized');
        }

        try {
            // Connect wallet and get address
            const address = await this.connectWallet(privateKey);
            
            // Check balance
            const balance = await this.checkBalance();
            
            // Get faucet info
            const faucetInfo = await this.getFaucetInfo();
            
            // Execute features
            const results = await this.executeAllFeatures(privateKey, address);
            
            return {
                address,
                balance,
                faucetInfo,
                ...results
            };
            
        } catch (error) {
            Helpers.log('Full cycle execution failed', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Execute all enabled features
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Feature results
     */
    async executeAllFeatures(privateKey, address) {
        const results = {};

        // Execute faucet claim
        results.faucetResult = await this.featureExecutor.executeFaucetClaim(
            (pk) => this.claimFaucet(pk),
            privateKey,
            address
        );

        // Execute bridge
        results.bridgeResult = await this.featureExecutor.executeBridge(
            (pk, destChainId, amount, recipient) => this.bridge(pk, destChainId, amount, recipient),
            privateKey,
            address
        );

        // Execute delegation
        results.delegationResult = await this.featureExecutor.executeDelegation(
            (pk) => this.delegateToRandomValidator(pk),
            privateKey,
            address
        );

        // Execute claim reward
        results.claimRewardResult = await this.featureExecutor.executeClaimReward(
            (pk, claimId) => this.claimReward(pk, claimId),
            privateKey,
            address
        );

        // Execute governance vote
        results.governanceResult = await this.featureExecutor.executeGovernanceVote(
            (pk, support, reason, timeout) => this.waitAndVote(pk, support, reason, timeout),
            privateKey,
            address
        );

        // Execute create proposal
        results.createProposalResult = await this.featureExecutor.executeCreateProposal(
            (pk, deposit) => this.createRandomProposal(pk, deposit),
            privateKey,
            address
        );

        // Execute user info (after authentication)
        results.userInfoResult = await this.featureExecutor.executeUserInfo(
            (pk, addr) => this.getUserInfo(pk, addr),
            privateKey,
            address
        );

        // Execute swap
        results.swapResult = await this.featureExecutor.executeSwap(
            (pk, amount) => this.executeSwap(pk, amount),
            privateKey,
            address
        );

        return results;
    }

    // Individual feature methods with retry logic
    async claimFaucet(privateKey, tokenType = 'HLS') {
        return await AsyncUtils.retry(
            async () => {
                const address = Helpers.getAddressFromPrivateKey(privateKey);
                return await this.services.faucet.checkAndClaim(address, privateKey, tokenType);
            },
            RETRY_CONFIG.FAUCET_MAX_ATTEMPTS,
            RETRY_CONFIG.FAUCET_DELAY
        );
    }

    async getFaucetInfo() {
        return await this.services.faucet.getFaucetInfo();
    }

    async bridge(privateKey, destChainId, amountEth, recipientAddress) {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.bridge.bridge(privateKey, destChainId, amountEth, recipientAddress);
            },
            RETRY_CONFIG.BRIDGE_MAX_ATTEMPTS,
            RETRY_CONFIG.BRIDGE_DELAY
        );
    }

    async delegateToRandomValidator(privateKey, amount = null) {
        return await AsyncUtils.retry(
            async () => {
                if (amount === null) {
                    amount = Helpers.getRandomDelegationAmount();
                    Helpers.log(`🎲 Using random delegation amount: ${amount} HELIOS`, 'INFO');
                }
                return await this.services.delegation.delegateToRandomValidator(privateKey, amount);
            },
            RETRY_CONFIG.DELEGATION_MAX_ATTEMPTS,
            RETRY_CONFIG.DELEGATION_DELAY
        );
    }

    async claimReward(privateKey, claimAmountOrId) {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.delegation.claimReward(privateKey, claimAmountOrId);
            },
            RETRY_CONFIG.DELEGATION_MAX_ATTEMPTS,
            RETRY_CONFIG.DELEGATION_DELAY
        );
    }

    async waitAndVote(privateKey, support = true, reason = "", timeout = 120000) {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.governance.waitAndVote(privateKey, support, reason, timeout);
            },
            RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
            RETRY_CONFIG.GOVERNANCE_DELAY
        );
    }

    async createRandomProposal(privateKey, deposit = "1000000000000000000") {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.governance.createRandomProposal(privateKey, deposit);
            },
            RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
            RETRY_CONFIG.GOVERNANCE_DELAY
        );
    }

    async getUserInfo(privateKey, address) {
        return await AsyncUtils.retry(
            async () => {
                // Set auth token from faucet service to user info service
                if (this.services.faucet.faucet.authToken) {
                    this.services.userInfo.setAuthToken(this.services.faucet.faucet.authToken);
                }
                return await this.services.userInfo.checkAndGetUserInfo(address);
            },
            RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
            RETRY_CONFIG.DEFAULT_DELAY
        );
    }

    async executeSwap(privateKey, amount = "1.0") {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.swap.executeSwap(privateKey, amount);
            },
            RETRY_CONFIG.TRANSACTION_MAX_ATTEMPTS,
            RETRY_CONFIG.TRANSACTION_DELAY
        );
    }

    // Additional utility methods
    async getDelegationInfo(privateKey) {
        const address = await this.connectWallet(privateKey);
        const balance = await this.checkBalance();
        const delegationService = this.services.delegation.getDelegationService();
        
        return {
            address,
            balance,
            targetContract: delegationService.calldataBuilder.getTargetContract(),
            defaultValidator: require('./src/config/config').DELEGATION_CONFIG.DEFAULT_VALIDATOR,
            defaultAmount: require('./src/config/config').DELEGATION_CONFIG.DEFAULT_AMOUNT
        };
    }

    async getClaimHistory(page = 1, limit = 10) {
        return await this.services.faucet.getClaimHistory(page, limit);
    }

    async getVotingProposal() {
        return await this.services.governance.getVotingProposal();
    }

    async voteProposal(privateKey, proposalId, support, reason = "") {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.governance.vote(privateKey, proposalId, support, reason);
            },
            RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
            RETRY_CONFIG.GOVERNANCE_DELAY
        );
    }

    async createProposal(privateKey, title, description, messages, deposit) {
        return await AsyncUtils.retry(
            async () => {
                return await this.services.governance.createProposal(privateKey, title, description, messages, deposit);
            },
            RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
            RETRY_CONFIG.GOVERNANCE_DELAY
        );
    }

    async delegate(privateKey, validator = null, amount = null) {
        return await AsyncUtils.retry(
            async () => {
                if (amount === null) {
                    amount = Helpers.getRandomDelegationAmount();
                    Helpers.log(`🎲 Using random delegation amount: ${amount} HELIOS`, 'INFO');
                }
                return await this.services.delegation.delegate(privateKey, validator, amount);
            },
            RETRY_CONFIG.DELEGATION_MAX_ATTEMPTS,
            RETRY_CONFIG.DELEGATION_DELAY
        );
    }
}

/**
 * Main execution function with infinite loop
 */
async function main() {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        
        if (!privateKey) {
            Helpers.log('❌ PRIVATE_KEY not found in environment variables', 'ERROR');
            process.exit(1);
        }

        // Initialize main system
        const heliosMain = new HeliosMain();
        await heliosMain.initialize();
        
        // Infinite loop
        while (true) {
            try {
                // Execute cycle
                const cycleResult = await heliosMain.cycleManager.executeCycle(
                    (pk) => heliosMain.executeFullCycle(pk),
                    privateKey
                );

                // Send notifications
                if (cycleResult.success) {
                    const cooldownTime = await heliosMain.cycleManager.waitForCooldown();
                    await heliosMain.cycleManager.sendCycleCompletionNotification(
                        cycleResult.result,
                        cooldownTime,
                        cycleResult.address
                    );
                } else {
                    await heliosMain.cycleManager.sendErrorNotification(
                        cycleResult.error,
                        cycleResult.address
                    );
                    await heliosMain.cycleManager.waitForCooldown();
                }
                
            } catch (error) {
                Helpers.log(`❌ Cycle execution failed`, error, 'ERROR');
                await heliosMain.cycleManager.sendErrorNotification(error.message || error);
                await heliosMain.cycleManager.waitForCooldown();
            }
        }
        
    } catch (error) {
        Helpers.log('❌ Helios Main execution failed', error, 'ERROR');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { HeliosMain }; 