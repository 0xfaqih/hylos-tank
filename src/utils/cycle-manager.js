/**
 * Cycle Manager - Handles cycle execution, delays, and notifications
 */

const { TimeUtils } = require('./time-utils');
const { Helpers } = require('./helpers');

class CycleManager {
    constructor(telegramNotifier) {
        this.telegramNotifier = telegramNotifier;
        this.cycleCount = 0;
    }

    /**
     * Execute a single cycle
     * @param {Function} cycleFunction - Function to execute in cycle
     * @param {string} privateKey - Wallet private key
     * @returns {Promise<object>} Cycle result
     */
    async executeCycle(cycleFunction, privateKey) {
        this.cycleCount++;
        const startTime = new Date();
        
        Helpers.log(`🚀 Starting cycle #${this.cycleCount} at ${startTime.toLocaleString()}`, 'INFO');
        
        let address = null;
        
        try {
            // Execute cycle function
            const result = await cycleFunction(privateKey);
            
            Helpers.log(`✅ Cycle #${this.cycleCount} completed successfully`, 'SUCCESS');
            
            return {
                success: true,
                cycleNumber: this.cycleCount,
                result,
                address: result.address
            };
            
        } catch (error) {
            Helpers.log(`❌ Cycle #${this.cycleCount} failed`, error, 'ERROR');
            
            return {
                success: false,
                cycleNumber: this.cycleCount,
                error: error.message || error,
                address
            };
        }
    }

    /**
     * Wait for random cooldown between cycles
     * @returns {Promise<string>} Formatted cooldown time
     */
    async waitForCooldown() {
        const cooldownMs = TimeUtils.getRandomCooldown();
        const cooldownFormatted = TimeUtils.formatTime(cooldownMs);
        
        Helpers.log(`⏸️ Waiting ${cooldownFormatted} before next cycle...`, 'INFO');
        
        await TimeUtils.sleep(cooldownMs);
        
        Helpers.log('🔄 Starting next cycle...', 'INFO');
        
        return cooldownFormatted;
    }

    /**
     * Wait for random delay between processes
     * @param {number} minSeconds - Minimum seconds (default: 30)
     * @param {number} maxSeconds - Maximum seconds (default: 60)
     */
    async waitBetweenProcesses(minSeconds = 70, maxSeconds = 120) {
        const delayMs = TimeUtils.getRandomDelay(minSeconds, maxSeconds);
        const delayFormatted = TimeUtils.formatTime(delayMs);
        
        Helpers.log(`⏳ Waiting ${delayFormatted} before next process...`, 'INFO');
        
        await TimeUtils.sleep(delayMs);
    }

    /**
     * Send cycle start notification
     * @param {string} address - Wallet address
     */
    async sendCycleStartNotification(address) {
        await this.telegramNotifier.sendCycleStartNotification(this.cycleCount, address);
    }

    /**
     * Send cycle completion notification
     * @param {object} result - Cycle result
     * @param {string} cooldownTime - Cooldown time string
     * @param {string} address - Wallet address
     */
    async sendCycleCompletionNotification(result, cooldownTime, address) {
        await this.telegramNotifier.sendCycleCompletionNotification(
            this.cycleCount, 
            result, 
            cooldownTime, 
            address
        );
    }

    /**
     * Send error notification
     * @param {string} error - Error message
     * @param {string} address - Wallet address
     */
    async sendErrorNotification(error, address) {
        await this.telegramNotifier.sendErrorNotification(error, this.cycleCount, address);
    }

    /**
     * Get current cycle count
     * @returns {number} Current cycle number
     */
    getCycleCount() {
        return this.cycleCount;
    }

    /**
     * Reset cycle count
     */
    resetCycleCount() {
        this.cycleCount = 0;
    }
}

module.exports = { CycleManager }; 