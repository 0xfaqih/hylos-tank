/**
 * Bridge Calldata Builder
 * Handles manual calldata construction for bridge transactions without ABI
 */

const { ethers } = require('ethers');
const { Helpers } = require('../../utils/helpers');
const { EncodingUtils } = require('../../utils/encoding');

class BridgeCalldataBuilder {

    /**
     * Build bridge calldata for transaction
     * @param {number} destChainId - Destination chain ID
     * @param {string} tokenAddress - Token contract address
     * @param {string} amountWei - Amount in wei
     * @param {string} feeOrGas - Fee or gas amount
     * @param {string} extraString - Extra string parameter
     * @returns {string} Complete calldata
     */
    static buildBridgeCalldata(destChainId, tokenAddress, amountWei, feeOrGas, extraString) {
        try {
            const selector = "0x7ae4a8ff";

            // Static parts (6 params before dynamic data)
            const encodedDest = EncodingUtils.encodeUint(destChainId);
            const encodedOffset = EncodingUtils.encodeUint(0xa0);
            const encodedToken = EncodingUtils.encodeAddress(tokenAddress);
            const encodedAmount = EncodingUtils.encodeUint(amountWei);
            const encodedFee = EncodingUtils.encodeUint(feeOrGas);

            // Dynamic part: string (hex of address in format: "0x....")
            const encodedExtra = EncodingUtils.encodeString(extraString);
            const encodedLength = encodedExtra.lengthHex;
            const encodedData = encodedExtra.paddedData;

            const calldata = selector +
                encodedDest +
                encodedOffset +
                encodedToken +
                encodedAmount +
                encodedFee +
                encodedLength +
                encodedData;

            Helpers.log(`🔧 Built bridge calldata for chain ${destChainId}`, 'INFO');
            return calldata;

        } catch (error) {
            Helpers.log('Failed to build bridge calldata', error, 'ERROR');
            throw error;
        }
    }

    /**
     * Validate bridge parameters
     * @param {number} destChainId - Destination chain ID
     * @param {string} tokenAddress - Token contract address
     * @param {string} amountWei - Amount in wei
     * @param {string} feeOrGas - Fee or gas amount
     * @param {string} extraString - Extra string parameter
     * @returns {boolean} Validation result
     */
    static validateBridgeParams(destChainId, tokenAddress, amountWei, feeOrGas, extraString) {
        const errors = [];

        if (!destChainId || destChainId <= 0) {
            errors.push('Invalid destination chain ID');
        }

        if (!Helpers.isValidAddress(tokenAddress)) {
            errors.push('Invalid token address');
        }

        if (!amountWei || BigInt(amountWei) <= 0) {
            errors.push('Invalid amount');
        }

        if (!feeOrGas || BigInt(feeOrGas) < 0) {
            errors.push('Invalid fee/gas amount');
        }

        if (!extraString || !extraString.startsWith('0x')) {
            errors.push('Invalid extra string (must be hex address)');
        }

        if (errors.length > 0) {
            throw new Error(`Bridge validation failed: ${errors.join(', ')}`);
        }

        return true;
    }
}

module.exports = { BridgeCalldataBuilder }; 