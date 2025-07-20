/**
 * Time utility functions for delays, cooldowns, and formatting
 */

class TimeUtils {
    /**
     * Get random delay in milliseconds
     * @param {number} minSeconds - Minimum seconds
     * @param {number} maxSeconds - Maximum seconds
     * @returns {number} Random delay in milliseconds
     */
    static getRandomDelay(minSeconds, maxSeconds) {
        const minMs = minSeconds * 1000;
        const maxMs = maxSeconds * 1000;
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    }

    /**
     * Get random cooldown in milliseconds (1-2 hours)
     * @returns {number} Random cooldown in milliseconds
     */
    static getRandomCooldown() {
        const minHours = 1;
        const maxHours = 2;
        const minMinutes = 0;
        const maxMinutes = 59;
        
        const hours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
        const minutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
        
        const totalMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
        return totalMs;
    }

    /**
     * Format milliseconds to human readable time
     * @param {number} ms - Milliseconds
     * @returns {string} Formatted time string
     */
    static formatTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current timestamp in ISO format
     * @returns {string} ISO timestamp
     */
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Get current time in local format
     * @returns {string} Local time string
     */
    static getCurrentLocalTime() {
        return new Date().toLocaleString();
    }
}

module.exports = { TimeUtils }; 