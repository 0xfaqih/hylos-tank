/**
 * Encoding Utilities
 * Centralized encoding functions for calldata construction
 */

const { ethers } = require('ethers');

class EncodingUtils {
    /**
     * Encode address to 32-byte hex string
     * @param {string} addr - Address to encode
     * @returns {string} Encoded address
     */
    static encodeAddress(addr) {
        return ethers.hexlify(ethers.zeroPadValue(addr, 32)).slice(2);
    }

    /**
     * Encode uint value to 32-byte hex string
     * @param {string|number} value - Value to encode
     * @returns {string} Encoded uint
     */
    static encodeUint(value) {
        return ethers.hexlify(ethers.zeroPadValue(ethers.toBeHex(value), 32)).slice(2);
    }

    /**
     * Encode string to dynamic bytes
     * @param {string} str - String to encode
     * @returns {object} Encoded string with length and data
     */
    static encodeString(str) {
        const bytes = ethers.toUtf8Bytes(str);
        const padded = ethers.zeroPadBytes(bytes, Math.ceil(bytes.length / 32) * 32);
        const lengthHex = this.encodeUint(bytes.length);
        const paddedData = ethers.hexlify(padded).slice(2);
        return { lengthHex, paddedData };
    }

    /**
     * Encode bytes to hex string
     * @param {Uint8Array} bytes - Bytes to encode
     * @returns {string} Encoded bytes
     */
    static encodeBytes(bytes) {
        return ethers.hexlify(bytes).slice(2);
    }

    /**
     * Encode boolean to 32-byte hex string
     * @param {boolean} value - Boolean value to encode
     * @returns {string} Encoded boolean
     */
    static encodeBool(value) {
        return this.encodeUint(value ? 1 : 0);
    }
}

module.exports = { EncodingUtils }; 