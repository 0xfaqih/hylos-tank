const chalk = require('chalk');
const { ValidationUtils } = require('./validation');
const { FormattingUtils } = require('./formatting');
const { WalletUtils } = require('./wallet');
const { AsyncUtils } = require('./async');

class Helpers {
    // Validation methods (delegated to ValidationUtils)
    static isValidAddress(address) {
        return ValidationUtils.isValidAddress(address);
    }

    static isValidPrivateKey(privateKey) {
        return ValidationUtils.isValidPrivateKey(privateKey);
    }

    static isValidMnemonic(mnemonic) {
        return ValidationUtils.isValidMnemonic(mnemonic);
    }

    // Formatting methods (delegated to FormattingUtils)
    static formatBalance(balance, decimals = 18) {
        return FormattingUtils.formatBalance(balance, decimals);
    }

    static parseBalance(amount, decimals = 18) {
        return FormattingUtils.parseBalance(amount, decimals);
    }

    static weiToEth(wei) {
        return FormattingUtils.weiToEth(wei);
    }

    static ethToWei(eth) {
        return FormattingUtils.ethToWei(eth);
    }

    // Wallet methods (delegated to WalletUtils)
    static createWallet(privateKey, provider = null) {
        return WalletUtils.createWallet(privateKey, provider);
    }

    static getAddressFromPrivateKey(privateKey) {
        return WalletUtils.getAddressFromPrivateKey(privateKey);
    }

    static generateRandomAddress() {
        return WalletUtils.generateRandomAddress();
    }

    // Async methods (delegated to AsyncUtils)
    static sleep(ms) {
        return AsyncUtils.sleep(ms);
    }

    static async retry(fn, maxAttempts = 3, delay = 1000) {
        return AsyncUtils.retry(fn, maxAttempts, delay);
    }

    // Log dengan timestamp
    static log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const typeColor = type === 'INFO' ? chalk.blue : 
                         type === 'SUCCESS' ? chalk.green :
                         type === 'WARNING' ? chalk.yellow :
                         type === 'ERROR' ? chalk.red : chalk.white;
        
        console.log(chalk.gray(`[${timestamp}]`) + ' ' + typeColor(`[${type}]`) + ' ' + chalk.white(message));
    }
    
    static getRandomBridgeAmount(minAmount = 0.010, maxAmount = 0.1) {
        const randomAmount = Math.random() * (maxAmount - minAmount) + minAmount;
        return Math.round(randomAmount * 1000) / 1000;
    }

    static getRandomDelegationAmount(minAmount = 0.01, maxAmount = 0.1) {
        const randomAmount = Math.random() * (maxAmount - minAmount) + minAmount;
        return Math.round(randomAmount * 1000) / 1000;
    }

    static getRandomBridgeAmount(minAmount = 0.05, maxAmount = 0.15) {
        const randomAmount = Math.random() * (maxAmount - minAmount) + minAmount;
        return Math.round(randomAmount * 1000) / 1000;
    }

    static getRandomProposalTitle() {
        const emojis = ['🚀', '⚡', '🔧', '🎯', '💎', '🔥', '🌟', '⚙️', '🔨', '🎪'];
        const actions = ['Upgrade', 'Fix', 'Modify', 'Optimize', 'Enhance', 'Update', 'Change', 'Improve', 'Adjust', 'Refine', 'Boost', 'Tune', 'Revamp', 'Overhaul', 'Streamline'];
        const objects = ['Timeout', 'Gas', 'Fee', 'Limit', 'Parameter', 'Setting', 'Config', 'Batch', 'Transaction', 'Network', 'Chain', 'System', 'Performance', 'Speed', 'Efficiency', 'Throughput', 'Capacity', 'Latency', 'Bandwidth', 'Protocol'];
        const numbers = Math.floor(Math.random() * 900) + 100;
        
        const formats = [
            // Format 1: Emoji + Action + Object + Number
            () => `${emojis[Math.floor(Math.random() * emojis.length)]} ${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]} #${numbers}`,
            
            // Format 2: Professional
            () => `Governance Proposal: ${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]}`,
            
            // Format 3: System Enhancement
            () => `System Enhancement: ${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]}`,
            
            // Format 4: Parameter Update
            () => `Parameter Update: ${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]}`,
            
            // Format 5: Casual
            () => `Let's ${actions[Math.floor(Math.random() * actions.length)].toLowerCase()} ${objects[Math.floor(Math.random() * objects.length)]} #${numbers}`,
            
            // Format 6: Technical
            () => `${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]} for ${['Sepolia', 'Ethereum', 'Helios', 'Testnet'][Math.floor(Math.random() * 4)]}`,
            
            // Format 7: Creative
            () => `${['Speed Up', 'Make Faster', 'Improve', 'Better', 'Optimize'][Math.floor(Math.random() * 5)]} ${objects[Math.floor(Math.random() * objects.length)]} #${numbers}`,
            
            // Format 8: Network Focus
            () => `Network ${actions[Math.floor(Math.random() * actions.length)]}: ${objects[Math.floor(Math.random() * objects.length)]}`,
            
            // Format 9: Simple
            () => `${actions[Math.floor(Math.random() * actions.length)]} ${objects[Math.floor(Math.random() * objects.length)]} #${numbers}`,
            
            // Format 10: Descriptive
            () => `${['Better', 'Faster', 'Stronger', 'Smarter', 'Efficient'][Math.floor(Math.random() * 5)]} ${objects[Math.floor(Math.random() * objects.length)]} #${numbers}`
        ];
        
        const selectedFormat = formats[Math.floor(Math.random() * formats.length)];
        return selectedFormat();
    }

    static getRandomProposalDescription() {
        const currentValues = [3000000, 500000, 0.001, 1000000, 2000000, 0.002, 400000, 600000];
        const newValues = [3600000, 600000, 0.002, 1200000, 2400000, 0.003, 500000, 700000];
        const benefits = ['performance', 'efficiency', 'security', 'stability', 'scalability', 'reliability', 'speed', 'throughput'];
        const components = ['timeout', 'gas limit', 'fee', 'batch size', 'parameter', 'setting'];
        
        const currentValue = currentValues[Math.floor(Math.random() * currentValues.length)];
        const newValue = newValues[Math.floor(Math.random() * newValues.length)];
        const benefit = benefits[Math.floor(Math.random() * benefits.length)];
        const component = components[Math.floor(Math.random() * components.length)];
        
        const formats = [
            // Format 1: Technical Detailed
            () => `This proposal seeks to update the ${component} parameter from ${currentValue} to ${newValue} to improve network ${benefit} and reduce transaction failures`,
            
            // Format 2: Simple & Direct
            () => `Update ${component} settings for better ${benefit}`,
            
            // Format 3: Professional
            () => `This governance proposal aims to enhance the network's transaction processing capabilities by updating critical ${component} parameters`,
            
            // Format 4: Casual
            () => `Let's make things work better by changing ${component} settings`,
            
            // Format 5: Technical Brief
            () => `${component}: ${currentValue} → ${newValue}`,
            
            // Format 6: System Focus
            () => `System optimization through ${component} adjustment to improve overall network ${benefit}`,
            
            // Format 7: Performance Focus
            () => `Improving ${benefit} by updating ${component} from ${currentValue} to ${newValue}`,
            
            // Format 8: Network Focus
            () => `Network ${component} update for enhanced ${benefit}`,
            
            // Format 9: Parameter Focus
            () => `Parameter modification: ${component} increased from ${currentValue} to ${newValue} for enhanced transaction processing`,
            
            // Format 10: Simple Update
            () => `Updating ${component} for better ${benefit}`
        ];
        
        const selectedFormat = formats[Math.floor(Math.random() * formats.length)];
        return selectedFormat();
    }
}

module.exports = { Helpers }; 