/**
 * Governance Service
 * Handles governance-related operations including proposal voting
 */

const { ethers } = require('ethers');
const { NetworkConfig } = require('../../config/network');
const { GOVERNANCE_CONFIG } = require('../../config/config');
const { Helpers } = require('../../utils/helpers');
const { AsyncUtils } = require('../../utils/async');
const { RETRY_CONFIG } = require('../../config/config');

class GovernanceService {
    constructor() {
        this.networkConfig = new NetworkConfig();
        this.provider = null;
        this.wallet = null;
        this.isInitialized = false;
        this.apiUrl = 'https://testnet1.helioschainlabs.org/';
    }

    /**
     * Initialize service
     */
    async initialize() {
        try {
            this.provider = this.networkConfig.getProvider();
            await this.networkConfig.validateConnection();
            this.isInitialized = true;
        } catch (error) {
            Helpers.log('❌ Failed to initialize governance service', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Connect wallet with private key
     * @param {string} privateKey - Wallet private key
     */
    connectWallet(privateKey) {
        if (!this.isInitialized) {
            throw new Error('Governance service not initialized');
        }

        try {
            this.wallet = Helpers.createWallet(privateKey, this.provider);
            const address = this.wallet.address;
            Helpers.log(`✅ Governance wallet connected: ${address}`, 'SUCCESS');
            return address;
        } catch (error) {
            Helpers.log('❌ Failed to connect governance wallet', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get proposals from API
     * @param {number} page - Page number (default: 1)
     * @param {number} size - Page size (default: 10)
     * @returns {Promise<Array>} Array of proposals
     */
    async getProposals(page = 1, size = 10) {
        if (!this.isInitialized) {
            throw new Error('Governance service not initialized');
        }

        try {
            const payload = {
                jsonrpc: "2.0",
                method: "eth_getProposalsByPageAndSize",
                params: [`0x${page.toString(16)}`, `0x${size.toString(16)}`],
                id: 1
            };

            const response = await AsyncUtils.retry(
                async () => {
                    const res = await fetch(this.apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }

                    const data = await res.json();
                    
                    if (data.error) {
                        throw new Error(`API error: ${data.error.message}`);
                    }

                    return data.result;
                },
                RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
                RETRY_CONFIG.DEFAULT_DELAY
            );

            return response;
        } catch (error) {
            Helpers.log('❌ Failed to get proposals', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Get active voting proposal
     * @returns {Promise<object|null>} Active proposal or null
     */
    async getVotingProposal() {
        try {
            const proposals = await this.getProposals();
            const activeProposal = proposals.find(p => p.status === "VOTING_PERIOD");
            
            if (activeProposal) {
                Helpers.log(`📋 Found active proposal: ID ${activeProposal.id} - ${activeProposal.title}`, 'INFO');
            }
            
            return activeProposal || null;
        } catch (error) {
            Helpers.log('❌ Failed to get voting proposal', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Build vote calldata
     * @param {string} voter - Voter address
     * @param {number} proposalId - Proposal ID
     * @param {boolean} support - Vote support (true = yes, false = no)
     * @param {string} reason - Vote reason
     * @returns {string} Built calldata
     */
    buildVoteCalldata(voter, proposalId, support, reason) {
        const selector = "9ec4d363";
        const encodedVoter = this.encodeAddress(voter);
        const encodedProposalId = this.encodeUint(proposalId);
        const encodedSupport = this.encodeBool(support);
        const offsetToString = this.encodeUint(128);
        const encodedString = this.encodeString(reason);
        
        const calldata = selector + 
                        encodedVoter + 
                        encodedProposalId + 
                        encodedSupport + 
                        offsetToString + 
                        encodedString.lengthHex + 
                        encodedString.paddedData;

        return "0x" + calldata;
    }

    /**
     * Encode address to hex
     * @param {string} addr - Address to encode
     * @returns {string} Encoded address
     */
    encodeAddress(addr) {
        return ethers.hexlify(ethers.zeroPadValue(addr, 32)).slice(2);
    }

    /**
     * Encode uint to hex
     * @param {number} value - Value to encode
     * @returns {string} Encoded uint
     */
    encodeUint(value) {
        return ethers.hexlify(ethers.zeroPadValue(ethers.toBeHex(value), 32)).slice(2);
    }

    /**
     * Encode boolean to hex
     * @param {boolean} value - Boolean to encode
     * @returns {string} Encoded boolean
     */
    encodeBool(value) {
        return this.encodeUint(value ? 1 : 0);
    }

    /**
     * Encode string to hex
     * @param {string} str - String to encode
     * @returns {object} Encoded string with length and data
     */
    encodeString(str) {
        const bytes = ethers.toUtf8Bytes(str);
        const lengthHex = ethers.hexlify(ethers.zeroPadValue(ethers.toBeHex(bytes.length), 32)).slice(2);
        const paddedData = ethers.hexlify(ethers.zeroPadBytes(bytes, Math.ceil(bytes.length / 32) * 32)).slice(2);
        return { lengthHex, paddedData };
    }

    /**
     * Vote on proposal
     * @param {number} proposalId - Proposal ID
     * @param {boolean} support - Vote support (true = yes, false = no)
     * @param {string} reason - Vote reason
     * @returns {Promise<object>} Vote result
     */
    async vote(proposalId, support, reason = "") {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const voter = this.wallet.address;
            const targetContract = GOVERNANCE_CONFIG.TARGET_CONTRACT;
            
            // Build calldata
            const calldata = this.buildVoteCalldata(voter, proposalId, support, reason);

            Helpers.log(`🗳️ Building vote calldata for proposal ${proposalId} (${support ? 'YES' : 'NO'})`, 'SUCCESS');

            const nonce = await this.provider.getTransactionCount(this.wallet.address);
            // Send transaction
            const tx = await this.wallet.sendTransaction({
                to: targetContract,
                data: calldata,
                gasLimit: GOVERNANCE_CONFIG.GAS_LIMIT,
                nonce: nonce
            });

            Helpers.log(`📨 Vote transaction sent: ${tx.hash}`, 'SUCCESS');

            // Wait for confirmation
            const receipt = await tx.wait();
            Helpers.log(`✅ Vote confirmed in block: ${receipt.blockNumber}`, 'SUCCESS');

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                proposalId,
                support,
                reason,
                voter
            };

        } catch (error) {
            Helpers.log('❌ Vote failed', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Wait for voting proposal and vote
     * @param {boolean} support - Vote support (true = yes, false = no)
     * @param {string} reason - Vote reason
     * @param {number} timeout - Timeout in milliseconds (default: 2 minutes)
     * @returns {Promise<object>} Vote result
     */
    async waitAndVote(support = true, reason = "", timeout = 120000) {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const activeProposal = await this.getVotingProposal();
                
                if (activeProposal) {
                    const proposalId = parseInt(activeProposal.id);
                    const voteReason = reason || `Vote on proposal ${proposalId}`;
                    
                    Helpers.log(`📋 Found active proposal: ID ${proposalId} - ${activeProposal.title}`, 'SUCCESS');
                    
                    return await this.vote(proposalId, support, voteReason);
                } else {
                    const remainingTime = Math.ceil((timeout - (Date.now() - startTime)) / 1000);
                    Helpers.log(`⏳ No active voting proposal. Checking again in 30 seconds... (${remainingTime}s remaining)`, 'WARNING');
                    await AsyncUtils.sleep(30000); // Wait 30 seconds
                }
            } catch (error) {
                Helpers.log('❌ Error while waiting for proposal', error, 'ERROR');
                await AsyncUtils.sleep(30000); // Wait 30 seconds before retry
            }
        }

        return {
            success: false,
            error: 'Timeout waiting for voting proposal',
            reason: 'No active proposal found within timeout period'
        };
    }

    /**
     * Build create proposal calldata
     * @param {string} title - Proposal title
     * @param {string} description - Proposal description
     * @param {Array} messages - Array of message objects
     * @param {string} deposit - Deposit amount in wei
     * @returns {string} Built calldata
     */
    buildCreateProposalCalldata(title, description, messages, deposit) {
        const selector = "cb0dddfe";
        
        // Calculate dynamic offsets
        const titleOffset = 160; // 5 * 32 bytes (after selector + deposit + proposer)
        const descriptionOffset = titleOffset + 32 + Math.ceil(title.length / 32) * 32; // after title
        const messagesOffset = descriptionOffset + 32 + Math.ceil(description.length / 32) * 32; // after description
        
        const encodedTitleOffset = this.encodeUint(titleOffset);
        const encodedDescriptionOffset = this.encodeUint(descriptionOffset);
        const encodedMessagesOffset = this.encodeUint(messagesOffset);
        const encodedDeposit = this.encodeUint(deposit);
        const encodedProposer = this.encodeAddress("0x0000000000000000000000000000000000000000"); // zero address
        
        // Encode title
        const encodedTitle = this.encodeString(title);
        
        // Encode description
        const encodedDescription = this.encodeString(description);
        
        // Encode messages array
        const encodedMessages = this.encodeMessagesArray(messages);
        
        const calldata = selector + 
                        encodedTitleOffset + 
                        encodedDescriptionOffset + 
                        encodedMessagesOffset + 
                        encodedDeposit + 
                        encodedProposer +
                        encodedTitle.lengthHex + 
                        encodedTitle.paddedData +
                        encodedDescription.lengthHex + 
                        encodedDescription.paddedData +
                        encodedMessages.lengthHex + 
                        encodedMessages.paddedData;

        return "0x" + calldata;
    }

    /**
     * Encode messages array
     * @param {Array} messages - Array of message objects
     * @returns {object} Encoded messages with length and data
     */
    encodeMessagesArray(messages) {
        // For now, use a simple approach - encode as bytes
        const messagesJson = JSON.stringify(messages);
        const bytes = ethers.toUtf8Bytes(messagesJson);
        const lengthHex = ethers.hexlify(ethers.zeroPadValue(ethers.toBeHex(bytes.length), 32)).slice(2);
        const paddedData = ethers.hexlify(ethers.zeroPadBytes(bytes, Math.ceil(bytes.length / 32) * 32)).slice(2);
        return { lengthHex, paddedData };
    }

    /**
     * Create proposal
     * @param {string} title - Proposal title
     * @param {string} description - Proposal description
     * @param {Array} messages - Array of message objects
     * @param {string} deposit - Deposit amount in wei
     * @returns {Promise<object>} Create proposal result
     */
    async createProposal(title, description, messages, deposit) {
        if (!this.wallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const targetContract = GOVERNANCE_CONFIG.TARGET_CONTRACT;
            
            // Build calldata
            const calldata = this.buildCreateProposalCalldata(title, description, messages, deposit);

            Helpers.log(`📝 Building create proposal calldata: "${title}"`, 'SUCCESS');

            const nonce = await this.provider.getTransactionCount(this.wallet.address);
            // Send transaction
            const tx = await this.wallet.sendTransaction({
                to: targetContract,
                data: calldata,
                gasLimit: GOVERNANCE_CONFIG.GAS_LIMIT,
                value: deposit, // Include deposit value
                nonce: nonce
            });

            Helpers.log(`📨 Create proposal transaction sent: ${tx.hash}`, 'SUCCESS');

            // Wait for confirmation
            const receipt = await tx.wait();
            Helpers.log(`✅ Create proposal confirmed in block: ${receipt.blockNumber}`, 'SUCCESS');

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                title,
                description,
                messages,
                deposit
            };

        } catch (error) {
            Helpers.log('❌ Create proposal failed', error, 'ERROR');
            return {
                success: false,
                error: error?.shortMessage || error.message || error
            };
        }
    }

    /**
     * Create random proposal
     * @param {string} deposit - Deposit amount in wei (default: 1 ETH)
     * @returns {Promise<object>} Create proposal result
     */
    async createRandomProposal(deposit = "1000000000000000000") {
        const title = Helpers.getRandomProposalTitle();
        const description = Helpers.getRandomProposalDescription();
        
        // Random message for timeout update
        const messages = [{
            "@type": "/helios.hyperion.v1.MsgUpdateOutTxTimeout",
            "signer": this.wallet.address,
            "chain_id": 11155111,
            "target_batch_timeout": Math.floor(Math.random() * 2000000) + 3000000, // 3M-5M
            "target_outgoing_tx_timeout": Math.floor(Math.random() * 2000000) + 3000000 // 3M-5M
        }];

        return await this.createProposal(title, description, messages, deposit);
    }
}

module.exports = { GovernanceService }; 