/**
 * Cookie Cache Utility
 * Manages cookie storage and retrieval for the vega-cli
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cookie cache file path
const CACHE_DIR = join(__dirname, '.cache');
const COOKIE_FILE = join(CACHE_DIR, 'cookies.json');

/**
 * Ensures the cache directory exists
 */
async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

/**
 * Loads cookies from cache file
 * @returns {Object|null} Cookie data or null if not found/expired
 */
export async function loadCookies() {
  try {
    await ensureCacheDir();
    const data = await readFile(COOKIE_FILE, 'utf8');
    const cookieData = JSON.parse(data);
    
    // Check if cookie is expired
    if (cookieData.expires && Date.now() > cookieData.expires) {
      return null; // Cookie expired
    }
    
    return cookieData;
  } catch (error) {
    return null; // No cache file or invalid data
  }
}

/**
 * Saves cookies to cache file
 * @param {string} cookieName - Name of the cookie
 * @param {string} cookieValue - Value of the cookie
 * @param {number} maxAgeSeconds - Cookie max age in seconds (default: 21600 = 6 hours)
 */
export async function saveCookies(cookieName, cookieValue, maxAgeSeconds = 21600) {
  try {
    await ensureCacheDir();
    
    const cookieData = {
      name: cookieName,
      value: cookieValue,
      expires: Date.now() + (maxAgeSeconds * 1000), // Convert to milliseconds
      createdAt: Date.now()
    };
    
    await writeFile(COOKIE_FILE, JSON.stringify(cookieData, null, 2));
  } catch (error) {
    console.error('Failed to save cookies to cache:', error.message);
  }
}

/**
 * Clears the cookie cache
 */
export async function clearCookies() {
  try {
    await writeFile(COOKIE_FILE, '{}');
  } catch (error) {
    // Ignore error if file doesn't exist
  }
}
