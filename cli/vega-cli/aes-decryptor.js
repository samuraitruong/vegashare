/**
 * AES Decryptor Module
 * Provides AES decryption functionality using the slowAES library
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Load the slowAES library
const slowAES = require(join(__dirname, 'slowAES.cjs'));

/**
 * Converts hex string to array of numbers
 * @param {string} hex - Hex string
 * @returns {Array} Array of numbers
 */
function hexToArray(hex) {
  const result = [];
  hex.replace(/(..)/g, function(match) {
    result.push(parseInt(match, 16));
  });
  return result;
}

/**
 * Converts array of numbers to hex string
 * @param {Array} arr - Array of numbers
 * @returns {string} Hex string
 */
function arrayToHex(arr) {
  return arr.map(byte => (byte < 16 ? "0" : "") + byte.toString(16)).join('');
}

/**
 * Decrypts AES encrypted data using the slowAES library
 * @param {string} keyHex - Key as hex string
 * @param {string} ivHex - IV as hex string  
 * @param {string} dataHex - Encrypted data as hex string
 * @returns {string} Decrypted string
 */
export function decryptAES(keyHex, ivHex, dataHex) {
  try {
    // Convert hex strings to arrays
    const key = hexToArray(keyHex);
    const iv = hexToArray(ivHex);
    const encryptedData = hexToArray(dataHex);
    
    // Decrypt using CBC mode (mode 2)
    const decrypted = slowAES.decrypt(encryptedData, slowAES.modeOfOperation.CBC, key, iv);
    
    // Convert decrypted bytes to hex string (this is what the cookie value should be)
    const result = arrayToHex(decrypted);
    console.log("Successfully decrypted cookie value:", result);
    
    return result;
  } catch (error) {
    console.error("AES decryption failed:", error.message);
    throw error;
  }
}

export { hexToArray, arrayToHex };
