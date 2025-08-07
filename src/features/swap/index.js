/**
 * Swap Feature Index
 * Exports all swap-related modules
 */

const { SwapService } = require('./swap-service');
const { SwapAutomation } = require('./swap-automation');

module.exports = {
    SwapService,
    SwapAutomation
};
