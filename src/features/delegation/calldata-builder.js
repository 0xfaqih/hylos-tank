const { ethers } = require('ethers');
const { DELEGATION_CONFIG } = require('../../config/config');
const { EncodingUtils } = require('../../utils/encoding');

class DelegationCalldataBuilder {
    constructor() {
        this.TARGET_CONTRACT = DELEGATION_CONFIG.TARGET_CONTRACT;
        this.DELEGATE_SELECTOR = "f5e56040";
        this.CLAIM_SELECTOR = "2efe8a5f"; // function selector untuk claimDelegation(address,uint256)
    }

    /**
     * Build delegation calldata
     * @param {string} delegator - Delegator address
     * @param {string} validator - Validator address
     * @param {string} amount - Amount to delegate (in wei)
     * @param {string} denom - Token denomination (default: ahelios)
     * @returns {string} - Built calldata
     */
    buildDelegationCalldata(delegator, validator, amount, denom = "ahelios") {
        const encodedDelegator = EncodingUtils.encodeAddress(delegator);
        const encodedValidator = EncodingUtils.encodeAddress(validator);
        const encodedAmount = EncodingUtils.encodeUint(amount);
        const encodedOffset = EncodingUtils.encodeUint(128); // offset ke data dynamic (4 * 32 bytes)
        const encodedString = EncodingUtils.encodeString(denom);

        const calldata = "0x" +
            this.DELEGATE_SELECTOR +
            encodedDelegator +
            encodedValidator +
            encodedAmount +
            encodedOffset +
            encodedString.lengthHex +
            encodedString.paddedData;

        return calldata;
    }

    /**
     * Build claim calldata
     * @param {string} delegator - Delegator address
     * @param {string|number} claimAmountOrId - Amount or ID to claim
     * @returns {string} - Built calldata
     */
    buildClaimCalldata(delegator, claimAmountOrId) {
        const encodedDelegator = EncodingUtils.encodeAddress(delegator);
        const encodedAmount = EncodingUtils.encodeUint(claimAmountOrId.toString());

        const calldata = "0x" +
            this.CLAIM_SELECTOR +
            encodedDelegator +
            encodedAmount;

        return calldata;
    }

    /**
     * Get target contract address
     * @returns {string} - Target contract address
     */
    getTargetContract() {
        return this.TARGET_CONTRACT;
    }
}

module.exports = { DelegationCalldataBuilder };
