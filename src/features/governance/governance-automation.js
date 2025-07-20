/**
 * Governance Automation
 * Wrapper class for governance service integration
 */

const { GovernanceService } = require('./governance-service');
const { RETRY_CONFIG } = require('../../config/config');
const { Helpers } = require('../../utils/helpers');
const { AsyncUtils } = require('../../utils/async');

class GovernanceAutomation {
    constructor() {
        this.governanceService = new GovernanceService();
        this.isInitialized = false;
    }

    /**
     * Initialize governance automation
     */
    async initialize() {
        try {
            await this.governanceService.initialize();
            this.isInitialized = true;
        } catch (error) {
            Helpers.log('❌ Failed to initialize governance automation', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet with private key
     * @param {string} privateKey - Wallet private key
     * @returns {string} - Wallet address
     */
    async connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            const address = this.governanceService.connectWallet(privateKey);
            return address;
        } catch (error) {
            Helpers.log('❌ Failed to connect governance wallet', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get active voting proposal
     * @returns {Promise<object|null>} Active proposal or null
     */
    async getVotingProposal() {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            return await this.governanceService.getVotingProposal();
        } catch (error) {
            Helpers.log('❌ Failed to get voting proposal', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get all proposals
     * @param {number} page - Page number (default: 1)
     * @param {number} size - Page size (default: 10)
     * @returns {Promise<Array>} Array of proposals
     */
    async getProposals(page = 1, size = 10) {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            return await this.governanceService.getProposals(page, size);
        } catch (error) {
            Helpers.log('❌ Failed to get proposals', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Vote on specific proposal
     * @param {string} privateKey - Wallet private key
     * @param {number} proposalId - Proposal ID
     * @param {boolean} support - Vote support (true = yes, false = no)
     * @param {string} reason - Vote reason
     * @returns {Promise<object>} Vote result
     */
    async vote(privateKey, proposalId, support, reason = "") {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    
                    Helpers.log(`🗳️ Starting vote on proposal ${proposalId} (${support ? 'YES' : 'NO'})`, 'SUCCESS');

                    // Execute vote
                    const result = await this.governanceService.vote(proposalId, support, reason);
                    
                    if (result.success) {
                        Helpers.log(`✅ Vote on proposal ${proposalId} successful! Tx: ${result.txHash}`, 'SUCCESS');
                    } else {
                        Helpers.log(`❌ Vote on proposal ${proposalId} failed: ${result.error}`, 'ERROR');
                    }

                    return result;
                },
                RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
                RETRY_CONFIG.GOVERNANCE_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Vote failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Wait for voting proposal and vote
     * @param {string} privateKey - Wallet private key
     * @param {boolean} support - Vote support (true = yes, false = no)
     * @param {string} reason - Vote reason
     * @param {number} timeout - Timeout in milliseconds (default: 2 minutes)
     * @returns {Promise<object>} Vote result
     */
    async waitAndVote(privateKey, support = true, reason = "", timeout = 120000) {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    
                    Helpers.log(`⏳ Waiting for active voting proposal... (timeout: ${timeout/1000}s)`, 'INFO');

                    // Wait and vote
                    const result = await this.governanceService.waitAndVote(support, reason, timeout);
                    
                    if (result.success) {
                        Helpers.log(`✅ Wait and vote successful! Tx: ${result.txHash}`, 'SUCCESS');
                    } else {
                        Helpers.log(`⚠️ Wait and vote result: ${result.reason || result.error}`, 'WARNING');
                    }

                    return result;
                },
                RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
                RETRY_CONFIG.GOVERNANCE_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Wait and vote failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Create proposal
     * @param {string} privateKey - Wallet private key
     * @param {string} title - Proposal title
     * @param {string} description - Proposal description
     * @param {Array} messages - Array of message objects
     * @param {string} deposit - Deposit amount in wei
     * @returns {Promise<object>} Create proposal result
     */
    async createProposal(privateKey, title, description, messages, deposit) {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    
                    Helpers.log(`📝 Starting create proposal: "${title}"`, 'SUCCESS');

                    // Execute create proposal
                    const result = await this.governanceService.createProposal(title, description, messages, deposit);
                    
                    if (result.success) {
                        Helpers.log(`✅ Create proposal successful! Tx: ${result.txHash}`, 'SUCCESS');
                    } else {
                        Helpers.log(`❌ Create proposal failed: ${result.error}`, 'ERROR');
                    }

                    return result;
                },
                RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
                RETRY_CONFIG.GOVERNANCE_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Create proposal failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Create random proposal
     * @param {string} privateKey - Wallet private key
     * @param {string} deposit - Deposit amount in wei (default: 1 ETH)
     * @returns {Promise<object>} Create proposal result
     */
    async createRandomProposal(privateKey, deposit = "1000000000000000000") {
        if (!this.isInitialized) {
            throw new Error('Governance automation not initialized');
        }

        try {
            return await AsyncUtils.retry(
                async () => {
                    // Connect wallet
                    const address = await this.connectWallet(privateKey);
                    
                    Helpers.log(`🎲 Creating random proposal with deposit: ${Helpers.weiToEth(deposit)} ETH`, 'SUCCESS');

                    // Execute create random proposal
                    const result = await this.governanceService.createRandomProposal(deposit);
                    
                    if (result.success) {
                        Helpers.log(`✅ Random proposal created! Tx: ${result.txHash}`, 'SUCCESS');
                        Helpers.log(`📋 Title: "${result.title}"`, 'INFO');
                        Helpers.log(`📝 Description: "${result.description}"`, 'INFO');
                    } else {
                        Helpers.log(`❌ Random proposal failed: ${result.error}`, 'ERROR');
                    }

                    return result;
                },
                RETRY_CONFIG.GOVERNANCE_MAX_ATTEMPTS,
                RETRY_CONFIG.GOVERNANCE_DELAY
            );
        } catch (error) {
            Helpers.log('❌ Create random proposal failed after retries', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Get governance service instance
     * @returns {GovernanceService} - Governance service instance
     */
    getGovernanceService() {
        return this.governanceService;
    }
}

module.exports = { GovernanceAutomation }; 