/**
 * ZIP Utilities
 * Handles ZIP file extraction functionality
 */

import AdmZip from 'adm-zip';
import { mkdir } from 'fs';
import { join } from 'path';

/**
 * Extracts a ZIP file to the specified directory
 * @param {Buffer} zipBuffer - The ZIP file as a buffer
 * @param {string} extractPath - The directory to extract to
 * @returns {Promise<number>} Number of files extracted
 */
export async function extractZip(zipBuffer, extractPath) {
  try {
    // Ensure extract directory exists
    mkdir(extractPath, { recursive: true }, (err) => {
      if (err && err.code !== 'EEXIST') {
        throw err;
      }
    });
    
    // Create AdmZip instance from buffer
    const zip = new AdmZip(zipBuffer);
    
    // Extract all files to the specified path
    zip.extractAllTo(extractPath, true);
    
    // Return the number of entries in the zip
    return zip.getEntries().length;
  } catch (error) {
    throw new Error(`Failed to extract ZIP file: ${error.message}`);
  }
}

/**
 * Gets the vega folder path relative to the project root
 * @returns {string} The path to the vega folder
 */
export function getVegaPath() {
  return join(process.cwd(), '..', 'vega');
}
