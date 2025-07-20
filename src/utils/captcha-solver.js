const axios = require('axios');
const { Helpers } = require('./helpers');

/**
 * CaptchaSolver - Utility untuk menyelesaikan captcha menggunakan 2captcha API v2
 */
class CaptchaSolver {
    constructor() {
        this.apiKey = process.env.TWO_CAPTCHA_KEY;
        this.baseUrl = 'https://api.2captcha.com';
        this.isInitialized = false;
    }

    /**
     * Initialize captcha solver
     * @returns {Promise<boolean>} Initialization result
     */
    async initialize() {
        try {
            if (!this.apiKey) {
                throw new Error('TWO_CAPTCHA_KEY not found in environment variables');
            }
            
            this.isInitialized = true;
            Helpers.log('✅ Captcha Solver initialized', 'SUCCESS');
            return true;
        } catch (error) {
            Helpers.log('Failed to initialize Captcha Solver', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Solve Turnstile captcha using 2captcha API v2
     * @param {string} siteKey - Turnstile site key
     * @param {string} pageUrl - URL of the page with captcha
     * @param {number} timeout - Timeout in seconds (default: 120)
     * @returns {Promise<string>} Captcha token
     */
    async solveTurnstile(siteKey, pageUrl, timeout = 120) {
        if (!this.isInitialized) {
            throw new Error('Captcha Solver not initialized');
        }

        if (!siteKey || !pageUrl) {
            throw new Error('Site key and page URL are required');
        }

        try {
            Helpers.log('🔍 Solving Turnstile captcha...', 'INFO');

            // Create task using API v2
            const createTaskUrl = `${this.baseUrl}/createTask`;
            const taskData = {
                clientKey: this.apiKey,
                task: {
                    type: 'TurnstileTaskProxyless',
                    websiteURL: pageUrl,
                    websiteKey: siteKey
                }
            };

            const createResponse = await axios.post(createTaskUrl, taskData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (createResponse.data.errorId !== 0) {
                throw new Error(`Failed to create task: ${createResponse.data.errorDescription}`);
            }

            const taskId = createResponse.data.taskId;
            Helpers.log(`📝 Captcha task created with ID: ${taskId}`, 'INFO');

            // Poll for result
            const result = await this.pollForResult(taskId, timeout);
            Helpers.log('✅ Captcha solved successfully', 'SUCCESS');
            
            return result;

        } catch (error) {
            Helpers.log('Failed to solve Turnstile captcha', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Poll for captcha solving result using API v2
     * @param {string} taskId - Task ID
     * @param {number} timeout - Timeout in seconds
     * @returns {Promise<string>} Captcha token
     */
    async pollForResult(taskId, timeout) {
        const startTime = Date.now();
        const pollInterval = 5000; // 5 seconds
        const maxTime = timeout * 1000;

        while (Date.now() - startTime < maxTime) {
            try {
                const resultUrl = `${this.baseUrl}/getTaskResult`;
                const resultData = {
                    clientKey: this.apiKey,
                    taskId: taskId
                };

                const resultResponse = await axios.post(resultUrl, resultData, {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (resultResponse.data.errorId !== 0) {
                    throw new Error(`Failed to get result: ${resultResponse.data.errorDescription}`);
                }

                if (resultResponse.data.status === 'ready') {
                    return resultResponse.data.solution.token;
                } else if (resultResponse.data.status === 'processing') {
                    Helpers.log('⏳ Captcha not ready yet, waiting...', 'INFO');
                    await this.sleep(pollInterval);
                } else {
                    throw new Error(`Captcha solving failed: ${resultResponse.data.status}`);
                }

            } catch (error) {
                Helpers.log('Error polling for captcha result', error, 'ERROR');
                await this.sleep(pollInterval);
            }
        }

        throw new Error(`Captcha solving timeout after ${timeout} seconds`);
    }

    /**
     * Sleep utility function
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get account balance using API v2
     * @returns {Promise<number>} Account balance
     */
    async getBalance() {
        if (!this.isInitialized) {
            throw new Error('Captcha Solver not initialized');
        }

        try {
            const balanceUrl = `${this.baseUrl}/getBalance`;
            const balanceData = {
                clientKey: this.apiKey
            };

            const response = await axios.post(balanceUrl, balanceData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.errorId === 0) {
                return parseFloat(response.data.balance);
            } else {
                throw new Error(`Failed to get balance: ${response.data.errorDescription}`);
            }

        } catch (error) {
            Helpers.log('Failed to get captcha balance', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Report bad captcha using API v2
     * @param {string} taskId - Task ID
     * @returns {Promise<boolean>} Report result
     */
    async reportBad(taskId) {
        if (!this.isInitialized) {
            throw new Error('Captcha Solver not initialized');
        }

        try {
            const reportUrl = `${this.baseUrl}/reportIncorrectImageCaptcha`;
            const reportData = {
                clientKey: this.apiKey,
                taskId: taskId
            };

            const response = await axios.post(reportUrl, reportData, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.errorId === 0) {
                Helpers.log('✅ Bad captcha reported successfully', 'SUCCESS');
                return true;
            } else {
                Helpers.log(`⚠️ Failed to report bad captcha: ${response.data.errorDescription}`, 'WARNING');
                return false;
            }

        } catch (error) {
            Helpers.log('Failed to report bad captcha', error, 'ERROR');
            return false;
        }
    }
}

module.exports = { CaptchaSolver };