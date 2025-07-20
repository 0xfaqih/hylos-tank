
/**
 * Async Utilities
 * Centralized async operation functions
 */

class AsyncUtils {
    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with delay
     * @param {Function} fn - Function to retry
     * @param {number} maxAttempts - Maximum number of attempts (default: 3)
     * @param {number} delay - Delay between attempts in milliseconds (default: 1000)
     * @returns {Promise<any>} Function result
     */
    static async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await this.sleep(delay);
            }
        }
    }

    /**
     * Execute function with timeout
     * @param {Function} fn - Function to execute
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<any>} Function result
     */
    static async withTimeout(fn, timeout) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Operation timed out')), timeout)
            )
        ]);
    }

    /**
     * Execute functions in parallel with concurrency limit
     * @param {Function[]} functions - Array of functions to execute
     * @param {number} concurrency - Maximum concurrent executions (default: 5)
     * @returns {Promise<any[]>} Results array
     */
    static async parallelWithLimit(functions, concurrency = 5) {
        const results = [];
        const executing = [];

        for (const fn of functions) {
            const promise = fn().then(result => {
                results.push(result);
                executing.splice(executing.indexOf(promise), 1);
            });

            executing.push(promise);

            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }

        await Promise.all(executing);
        return results;
    }

    /**
     * Execute functions sequentially
     * @param {Function[]} functions - Array of functions to execute
     * @returns {Promise<any[]>} Results array
     */
    static async sequential(functions) {
        const results = [];
        for (const fn of functions) {
            results.push(await fn());
        }
        return results;
    }

    /**
     * Debounce function execution
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Throttle function execution
     * @param {Function} fn - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(fn, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

module.exports = { AsyncUtils }; 