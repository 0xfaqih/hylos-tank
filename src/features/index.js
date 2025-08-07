const { BridgeAutomation } = require('./bridge/bridge-automation');
const { StakingService } = require('./staking/staking');
const { FaucetService } = require('./faucet/faucet');
const { DelegationAutomation } = require('./delegation/delegation-automation');
const { GovernanceAutomation } = require('./governance/governance-automation');
const { UserInfoAutomation } = require('./userinfo/userinfo-automation');
const { SwapAutomation } = require('./swap/swap-automation');
const { Helpers } = require('../utils/helpers');

class FeatureManager {
    constructor(telegramNotifier) {
        this.bridge = new BridgeAutomation();
        this.staking = new StakingService();
        this.faucet = new FaucetService();
        this.delegation = new DelegationAutomation();
        this.governance = new GovernanceAutomation();
        this.userInfo = new UserInfoAutomation(telegramNotifier);
        this.swap = new SwapAutomation();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            Helpers.log('🚀 Initializing Feature Manager...', 'INFO');
            
            // Initialize all services
            await this.bridge.initialize();
            await this.staking.initialize();
            await this.faucet.initialize();
            await this.delegation.initialize();
            await this.governance.initialize();
            await this.userInfo.initialize();
            await this.swap.initialize();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Feature Manager', error, 'ERROR');
            throw error;
        }
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            bridge: this.bridge.isInitialized,
            staking: this.staking.isInitialized,
            faucet: this.faucet.isInitialized,
            delegation: this.delegation.isInitialized,
            governance: this.governance.isInitialized,
            userInfo: this.userInfo.isInitialized,
            swap: this.swap.isInitialized
        };
    }
}

module.exports = { FeatureManager }; 