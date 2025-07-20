/**
 * Feature Executor - Handles execution of individual features with notifications
 */

const { Helpers } = require('../utils/helpers');
const { FEATURE_FLAGS } = require('../config/config');

class FeatureExecutor {
    constructor(telegramNotifier, cycleManager) {
        this.telegramNotifier = telegramNotifier;
        this.cycleManager = cycleManager;
    }

    /**
     * Execute faucet claim feature
     * @param {Function} claimFunction - Faucet claim function
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Execution result
     */
    async executeFaucetClaim(claimFunction, privateKey, address) {
        if (!FEATURE_FLAGS.ENABLE_FAUCET) {
            Helpers.log('⏭️ Faucet claim disabled', 'INFO');
            return { enabled: false };
        }

        try {
            const claimResult = await claimFunction(privateKey);
            
            if (claimResult.success) {
                Helpers.log('✅ Faucet claim successful', 'SUCCESS');
                await this.telegramNotifier.sendFeatureNotification('FAUCET CLAIM', true, {
                    walletAddress: address,
                    txHash: claimResult.txHash,
                    amount: claimResult.amount
                });
            } else {
                Helpers.log(`⚠️ Faucet claim skipped: ${claimResult.reason}`, 'WARNING');
                await this.telegramNotifier.sendFeatureNotification('FAUCET CLAIM', false, {
                    walletAddress: address,
                    reason: claimResult.reason
                });
            }

            await this.cycleManager.waitBetweenProcesses();
            
            return { enabled: true, result: claimResult };
            
        } catch (error) {
            Helpers.log('❌ Faucet claim failed', error, 'ERROR');
            await this.telegramNotifier.sendFeatureNotification('FAUCET CLAIM', false, {
                walletAddress: address,
                error: error.message
            });
            return { enabled: true, error: error.message };
        }
    }

    /**
     * Execute bridge feature
     * @param {Function} bridgeFunction - Bridge function
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Execution result
     */
    async executeBridge(bridgeFunction, privateKey, address) {
        if (!FEATURE_FLAGS.ENABLE_BRIDGE) {
            Helpers.log('⏭️ Bridge disabled', 'INFO');
            return { enabled: false };
        }

        try {
            const bridgeAmount = Helpers.getRandomBridgeAmount();
            const bridgeResult = await bridgeFunction(privateKey, 11155111, bridgeAmount, address);
            
            if (bridgeResult) {
                Helpers.log('✅ Bridge transaction successful', 'SUCCESS');
                await this.telegramNotifier.sendFeatureNotification('BRIDGE', true, {
                    walletAddress: address,
                    txHash: bridgeResult.txHash,
                    amount: bridgeAmount
                });
            } else {
                Helpers.log('⚠️ Bridge transaction failed', 'WARNING');
                await this.telegramNotifier.sendFeatureNotification('BRIDGE', false, {
                    walletAddress: address,
                    error: 'Transaction failed'
                });
            }

            await this.cycleManager.waitBetweenProcesses();
            
            return { enabled: true, result: bridgeResult };
            
        } catch (error) {
            Helpers.log('❌ Bridge failed', error, 'ERROR');
            await this.telegramNotifier.sendFeatureNotification('BRIDGE', false, {
                walletAddress: address,
                error: error.message
            });
            return { enabled: true, error: error.message };
        }
    }

    /**
     * Execute delegation feature
     * @param {Function} delegationFunction - Delegation function
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Execution result
     */
    async executeDelegation(delegationFunction, privateKey, address) {
        if (!FEATURE_FLAGS.ENABLE_DELEGATION) {
            Helpers.log('⏭️ Delegation disabled', 'INFO');
            return { enabled: false };
        }

        try {
            const delegationResult = await delegationFunction(privateKey);
            
            if (delegationResult && delegationResult.success) {
                Helpers.log(`✅ Delegation to ${delegationResult.validator?.moniker} successful`, 'SUCCESS');
                await this.telegramNotifier.sendFeatureNotification('DELEGATION', true, {
                    walletAddress: address,
                    txHash: delegationResult.txHash,
                    validator: delegationResult.validator?.moniker,
                    amount: delegationResult.amount
                });
            } else {
                Helpers.log(`⚠️ Delegation failed: ${delegationResult?.reason || 'Unknown error'}`, 'WARNING');
                await this.telegramNotifier.sendFeatureNotification('DELEGATION', false, {
                    walletAddress: address,
                    reason: delegationResult?.reason || 'Unknown error'
                });
            }

            await this.cycleManager.waitBetweenProcesses();
            
            return { enabled: true, result: delegationResult };
            
        } catch (error) {
            Helpers.log('❌ Delegation failed', error, 'ERROR');
            await this.telegramNotifier.sendFeatureNotification('DELEGATION', false, {
                walletAddress: address,
                error: error.message
            });
            return { enabled: true, error: error.message };
        }
    }

    /**
     * Execute claim reward feature
     * @param {Function} claimRewardFunction - Claim reward function
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Execution result
     */
    async executeClaimReward(claimRewardFunction, privateKey, address) {
        if (!FEATURE_FLAGS.ENABLE_CLAIM_REWARD) {
            Helpers.log('⏭️ Claim reward disabled', 'INFO');
            return { enabled: false };
        }

        try {
            const claimResult = await claimRewardFunction(privateKey, 10);
            
            if (claimResult && claimResult.success) {
                Helpers.log('✅ Claim reward successful', 'SUCCESS');
                await this.telegramNotifier.sendFeatureNotification('CLAIM REWARD', true, {
                    walletAddress: address,
                    txHash: claimResult.txHash,
                    amount: claimResult.amount
                });
            } else {
                Helpers.log(`⚠️ Claim reward failed: ${claimResult?.error || 'Unknown error'}`, 'WARNING');
                await this.telegramNotifier.sendFeatureNotification('CLAIM REWARD', false, {
                    walletAddress: address,
                    error: claimResult?.error || 'Unknown error'
                });
            }

            await this.cycleManager.waitBetweenProcesses();
            
            return { enabled: true, result: claimResult };
            
        } catch (error) {
            Helpers.log('⚠️ Claim reward skipped (not available)', 'WARNING');
            await this.telegramNotifier.sendFeatureNotification('CLAIM REWARD', false, {
                walletAddress: address,
                reason: 'Not available'
            });
            return { enabled: true, error: 'Not available' };
        }
    }

    /**
     * Execute governance vote feature
     * @param {Function} governanceFunction - Governance vote function
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Execution result
     */
    async executeGovernanceVote(governanceFunction, privateKey, address) {
        if (!FEATURE_FLAGS.ENABLE_GOVERNANCE_VOTE) {
            Helpers.log('⏭️ Governance voting disabled', 'INFO');
            return { enabled: false };
        }

        try {
            const governanceResult = await governanceFunction(privateKey, true, "Supporting the proposal", 60000);
            
            if (governanceResult.success) {
                Helpers.log('✅ Governance vote successful', 'SUCCESS');
                await this.telegramNotifier.sendFeatureNotification('GOVERNANCE VOTE', true, {
                    walletAddress: address,
                    txHash: governanceResult.txHash,
                    proposalId: governanceResult.proposalId
                });
            } else {
                Helpers.log(`⚠️ Governance vote result: ${governanceResult?.reason || 'No active proposal'}`, 'WARNING');
                await this.telegramNotifier.sendFeatureNotification('GOVERNANCE VOTE', false, {
                    walletAddress: address,
                    reason: governanceResult?.reason || 'No active proposal'
                });
            }

            await this.cycleManager.waitBetweenProcesses();
            
            return { enabled: true, result: governanceResult };
            
        } catch (error) {
            Helpers.log('⚠️ Governance vote skipped (not available)', 'WARNING');
            await this.telegramNotifier.sendFeatureNotification('GOVERNANCE VOTE', false, {
                walletAddress: address,
                reason: 'Not available'
            });
            return { enabled: true, error: 'Not available' };
        }
    }

    /**
     * Execute create proposal feature
     * @param {Function} createProposalFunction - Create proposal function
     * @param {string} privateKey - Wallet private key
     * @param {string} address - Wallet address
     * @returns {Promise<object>} Execution result
     */
    async executeCreateProposal(createProposalFunction, privateKey, address) {
        if (!FEATURE_FLAGS.ENABLE_CREATE_PROPOSAL) {
            Helpers.log('⏭️ Create proposal disabled', 'INFO');
            return { enabled: false };
        }

        try {
            const createProposalResult = await createProposalFunction(privateKey, "1000000000000000000");
            
            if (createProposalResult.success) {
                Helpers.log('✅ Create random proposal successful', 'SUCCESS');
                await this.telegramNotifier.sendFeatureNotification('CREATE PROPOSAL', true, {
                    walletAddress: address,
                    txHash: createProposalResult.txHash,
                    title: createProposalResult.title
                });
            } else {
                Helpers.log(`⚠️ Create proposal failed: ${createProposalResult?.error || 'Unknown error'}`, 'WARNING');
                await this.telegramNotifier.sendFeatureNotification('CREATE PROPOSAL', false, {
                    walletAddress: address,
                    error: createProposalResult?.error || 'Unknown error'
                });
            }

            return { enabled: true, result: createProposalResult };
            
        } catch (error) {
            Helpers.log('⚠️ Create proposal skipped (not available)', 'WARNING');
            await this.telegramNotifier.sendFeatureNotification('CREATE PROPOSAL', false, {
                walletAddress: address,
                reason: 'Not available'
            });
            return { enabled: true, error: 'Not available' };
        }
    }
}

module.exports = { FeatureExecutor }; 