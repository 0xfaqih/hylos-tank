const axios = require('axios');
const { Helpers } = require('./helpers');

class TelegramNotifier {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.threadId = process.env.TELEGRAM_THREAD_ID || null;
        this.isEnabled = !!(this.botToken && this.chatId);
        
        if (this.isEnabled) {
            Helpers.log('✅ Telegram notifier initialized', 'SUCCESS');
        } else {
            Helpers.log('⚠️ Telegram notifier disabled - missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID', 'WARNING');
        }
    }

    /**
     * Send message to Telegram
     * @param {string} message - Message to send
     * @param {string} parseMode - Parse mode (HTML, Markdown, MarkdownV2)
     * @returns {Promise<boolean>} Success status
     */
    async sendMessage(message, parseMode = 'HTML') {
        if (!this.isEnabled) {
            return false;
        }

        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            const data = {
                chat_id: this.chatId,
                text: message,
                parse_mode: parseMode,
                disable_web_page_preview: true
            };

            // Add thread_id if provided (for nested groups)
            if (this.threadId) {
                data.message_thread_id = this.threadId;
            }

            const response = await axios.post(url, data, {
                timeout: 10000
            });

            if (response.data.ok) {
                Helpers.log('📱 Telegram notification sent successfully', 'SUCCESS');
                return true;
            } else {
                Helpers.log(`❌ Telegram notification failed: ${response.data.description}`, 'ERROR');
                return false;
            }
        } catch (error) {
            Helpers.log('❌ Failed to send Telegram notification', error, 'ERROR');
            return false;
        }
    }

    /**
     * Send feature completion notification
     * @param {string} featureName - Name of the feature
     * @param {boolean} success - Success status
     * @param {object} details - Additional details
     * @param {number} cycleNumber - Current cycle number
     * @returns {Promise<boolean>} Success status
     */
    async sendFeatureNotification(featureName, success, details = {}, cycleNumber = null) {
        const emoji = success ? '✅' : '❌';
        const status = success ? 'SUCCESS' : 'FAILED';
        
        let message = `${emoji} <b>${featureName.toUpperCase()}</b> ${status}\n`;
        
        if (cycleNumber) {
            message += `🔄 <b>Cycle:</b> #${cycleNumber}\n`;
        }
        
        message += `⏰ <b>Time:</b> ${new Date().toLocaleString()}\n`;
        
        // Add wallet address if provided
        if (details.walletAddress) {
            message += `👛 <b>Wallet:</b> <code>${details.walletAddress}</code>\n`;
        }
        
        // Add details if provided
        if (details.txHash) {
            message += `🔗 <b>Tx Hash:</b> <code>${details.txHash}</code>\n`;
        }
        
        if (details.validator) {
            message += `👤 <b>Validator:</b> ${details.validator}\n`;
        }
        
        if (details.amount) {
            message += `💰 <b>Amount:</b> ${details.amount}\n`;
        }
        
        if (details.reason) {
            message += `📝 <b>Reason:</b> ${details.reason}\n`;
        }
        
        if (details.error) {
            message += `⚠️ <b>Error:</b> ${details.error}\n`;
        }

        return await this.sendMessage(message);
    }

    /**
     * Send cycle start notification
     * @param {number} cycleNumber - Cycle number
     * @param {string} walletAddress - Wallet address
     * @returns {Promise<boolean>} Success status
     */
    async sendCycleStartNotification(cycleNumber, walletAddress = null) {
        let message = `🚀 <b>HELIOS BOT - CYCLE #${cycleNumber}</b>\n` +
                     `⏰ <b>Started:</b> ${new Date().toLocaleString()}\n`;
        
        if (walletAddress) {
            message += `👛 <b>Wallet:</b> <code>${walletAddress}</code>\n`;
        }
        
        message += `🔄 <b>Status:</b> Starting process...`;
        
        return await this.sendMessage(message);
    }

    /**
     * Send cycle completion notification
     * @param {number} cycleNumber - Cycle number
     * @param {object} results - Cycle results
     * @param {string} cooldownTime - Cooldown time string
     * @param {string} walletAddress - Wallet address
     * @returns {Promise<boolean>} Success status
     */
    async sendCycleCompletionNotification(cycleNumber, results = {}, cooldownTime = '', walletAddress = null) {
        let message = `🎉 <b>HELIOS BOT - CYCLE #${cycleNumber} COMPLETED</b>\n` +
                     `⏰ <b>Completed:</b> ${new Date().toLocaleString()}\n`;
        
        if (walletAddress) {
            message += `👛 <b>Wallet:</b> <code>${walletAddress}</code>\n`;
        }
        
        message += `💰 <b>Balance:</b> ${results.balance || 'N/A'}\n` +
                  `⏸️ <b>Cooldown:</b> ${cooldownTime}\n` +
                  `🔄 <b>Status:</b> Waiting for next cycle...`;
        
        return await this.sendMessage(message);
    }

    /**
     * Send error notification
     * @param {string} error - Error message
     * @param {number} cycleNumber - Cycle number
     * @param {string} walletAddress - Wallet address
     * @returns {Promise<boolean>} Success status
     */
    async sendErrorNotification(error, cycleNumber = null, walletAddress = null) {
        let message = `❌ <b>HELIOS BOT ERROR</b>\n`;
        
        if (cycleNumber) {
            message += `🔄 <b>Cycle:</b> #${cycleNumber}\n`;
        }
        
        message += `⏰ <b>Time:</b> ${new Date().toLocaleString()}\n`;
        
        if (walletAddress) {
            message += `👛 <b>Wallet:</b> <code>${walletAddress}</code>\n`;
        }
        
        message += `⚠️ <b>Error:</b> ${error}`;
        
        return await this.sendMessage(message);
    }
}

module.exports = { TelegramNotifier }; 