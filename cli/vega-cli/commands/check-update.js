/**
 * Check Update Command
 * Fetches data from a remote URL and displays the response
 * Handles cookie-based protection with caching for efficiency
 */

import { decryptAES, hexToArray } from '../aes-decryptor.js';
import { loadCookies, saveCookies } from '../cookie-cache.js';
import { extractZip, getVegaPath } from '../libs/zip-utils.js';

/**
 * Browser headers for requests
 */
const BROWSER_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-AU,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
};


/**
 * Parses the JavaScript cookie setup code to extract cookie values
 * @param {string} htmlContent - The HTML content containing JavaScript
 * @returns {Object} Object containing cookie name and value
 */
function parseCookieScript(htmlContent) {
  try {
    // Extract the script content (get the second script tag which contains the actual code)
    const scriptMatches = htmlContent.match(/<script[^>]*>(.*?)<\/script>/gs);
    if (!scriptMatches || scriptMatches.length < 2) {
      throw new Error("No script found in response");
    }
    
    // Get the second script (index 1) which contains the actual cookie logic
    const scriptContent = scriptMatches[1].replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    
    // Extract the AES values using regex
    const aesMatch = scriptContent.match(/var a=toNumbers\("([^"]+)"\),b=toNumbers\("([^"]+)"\),c=toNumbers\("([^"]+)"\)/);
    if (!aesMatch) {
      throw new Error("Could not extract AES values from script");
    }
    
    const [, aHex, bHex, cHex] = aesMatch;
    
    // Decrypt the AES encrypted data
    const decryptedValue = decryptAES(aHex, bHex, cHex);
    
    // Extract the cookie name
    const cookieNameMatch = scriptContent.match(/document\.cookie="([^=]+)=/);
    if (!cookieNameMatch) {
      throw new Error("Could not extract cookie name");
    }
    
    const cookieName = cookieNameMatch[1];
    
    // Extract redirect URL
    const redirectMatch = scriptContent.match(/location\.href="([^"]+)"/);
    const redirectUrl = redirectMatch ? redirectMatch[1] : null;
    
    return { 
      name: cookieName, 
      value: decryptedValue,
      redirectUrl: redirectUrl
    };
  } catch (error) {
    return null;
  }
}

/**
 * Makes a request with the given URL and headers
 * @param {string} url - The URL to request
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Promise<Response>} The fetch response
 */
async function makeRequest(url, additionalHeaders = {}) {
  return await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      ...additionalHeaders
    }
  });
}

/**
 * Handles cookie challenges and returns the final response
 * @param {string} url - The URL to fetch data from
 * @param {Object} cookieData - Cached cookie data (optional)
 * @param {boolean} isDownload - Whether this is a download request
 * @returns {Promise<Object|Buffer>} The JSON response data or binary data for downloads
 */
async function handleCookieChallenge(url, cookieData = null, isDownload = false) {
  // Try with cached cookie first if available
  if (cookieData) {
    try {
      const response = await makeRequest(url, {
        'Cookie': `${cookieData.name}=${cookieData.value}`
      });
      
      if (response.ok) {
        if (isDownload) {
          // For download requests, check content type first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/zip')) {
            return await response.arrayBuffer();
          }
        }
        
        const data = await response.text();
        
        // If we get JSON, we're done
        try {
          return JSON.parse(data);
        } catch (e) {
          // Not JSON, continue with challenge
        }
      }
    } catch (error) {
      // Cookie might be expired, continue with challenge
    }
  }
  
  // No cached cookie or it didn't work, go through the challenge
  const response = await makeRequest(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.text();
  
  // Check if this is a cookie protection response
  if (data.includes("document.cookie") && data.includes("toNumbers")) {
    const cookieInfo = parseCookieScript(data);
    if (!cookieInfo) {
      throw new Error("Could not parse cookie information");
    }
    
    // Save the cookie for future use
    await saveCookies(cookieInfo.name, cookieInfo.value);
    
    // Use the redirect URL if available, otherwise construct it
    const followUpUrl = cookieInfo.redirectUrl || url.replace('?i=1', '?i=2');
    
    // Make the follow-up request with the decrypted cookie value
    const followUpResponse = await makeRequest(followUpUrl, {
      'Cookie': `${cookieInfo.name}=${cookieInfo.value}`
    });
    
    if (!followUpResponse.ok) {
      throw new Error(`Follow-up HTTP error! status: ${followUpResponse.status}`);
    }
    
    const followUpData = await followUpResponse.text();
    
    // Check if this is another cookie challenge
    if (followUpData.includes("document.cookie") && followUpData.includes("toNumbers")) {
      const secondCookieInfo = parseCookieScript(followUpData);
      if (!secondCookieInfo) {
        throw new Error("Could not parse second cookie information");
      }
      
      // Make a third request
      const thirdUrl = secondCookieInfo.redirectUrl || followUpUrl.replace('?i=2', '?i=3');
      
      const thirdResponse = await makeRequest(thirdUrl, {
        'Cookie': `${cookieInfo.name}=${cookieInfo.value}; ${secondCookieInfo.name}=${secondCookieInfo.value}`
      });
      
      if (!thirdResponse.ok) {
        throw new Error(`Third HTTP error! status: ${thirdResponse.status}`);
      }
      
      const thirdData = await thirdResponse.text();
      
      // Check if this is another cookie challenge with a different redirect
      if (thirdData.includes("location.href=") && thirdData.includes("cookies.html")) {
        // Make the final request to the PHP endpoint
        const baseUrl = url.split('?')[0];
        const finalUrl = baseUrl + 'index.php?i=1';
        
        const finalResponse = await makeRequest(finalUrl, {
          'Cookie': `${secondCookieInfo.name}=${secondCookieInfo.value}`
        });
        
        if (!finalResponse.ok) {
          throw new Error(`Final HTTP error! status: ${finalResponse.status}`);
        }
        
        if (isDownload) {
          // For download requests, check content type first
          const contentType = finalResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/zip')) {
            return await finalResponse.arrayBuffer();
          }
        }
        
        const finalData = await finalResponse.text();
        
        try {
          return JSON.parse(finalData);
        } catch (jsonError) {
          throw new Error("Final response is not valid JSON");
        }
      } else {
        try {
          return JSON.parse(thirdData);
        } catch (jsonError) {
          throw new Error("Third response is not valid JSON");
        }
      }
    } else {
      try {
        return JSON.parse(followUpData);
      } catch (jsonError) {
        throw new Error("Follow-up response is not valid JSON");
      }
    }
  } else {
    // Not a cookie protection response
    if (isDownload) {
      // For download requests, check content type first
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/zip')) {
        return await response.arrayBuffer();
      }
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(data);
    } catch (jsonError) {
      throw new Error("Response is not valid JSON");
    }
  }
}

/**
 * Fetches data from the specified URL and handles cookie-based protection
 * @param {string} url - The URL to fetch data from
 * @param {boolean} download - Whether to download ZIP file instead of showing JSON
 * @param {boolean} extract - Whether to download and extract ZIP file to vega folder
 */
export async function checkUpdate(url, download = false, extract = false) {
  try {
    // Determine if we need to download (either download or extract mode)
    const needsDownload = download || extract;
    const finalUrl = needsDownload ? `${url}${url.includes('?') ? '&' : '?'}download=true` : url;
    
    // Try to load cached cookies first
    const cachedCookies = await loadCookies();
    
    if (cachedCookies) {
      console.log("Using cached cookies...");
    } else {
      console.log("No cached cookies found, going through challenge...");
    }
    
    const result = await handleCookieChallenge(finalUrl, cachedCookies, needsDownload);
    
    if (needsDownload) {
      if (extract) {
        // Extract mode: download and extract to vega folder
        console.log("Downloading and extracting ZIP file to vega folder...");
        
        // Get the vega folder path
        const vegaPath = getVegaPath();
        
        try {
          const extractedCount = await extractZip(Buffer.from(result), vegaPath);
          console.log(`✅ Successfully extracted ${extractedCount} files to vega folder`);
        } catch (extractError) {
          console.error("❌ Failed to extract ZIP file:", extractError.message);
          process.exit(1);
        }
      } else {
        // Download mode: output ZIP file to stdout
        console.log("Downloading ZIP file...");
        process.stdout.write(Buffer.from(result));
      }
    } else {
      // Display the JSON result
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

/**
 * Command configuration for yargs
 */
export const commandConfig = {
  command: "check-update",
  describe: "Check for updates by fetching data from remote URL",
  builder: (yargs) => {
    return yargs
      .option("url", {
        alias: "u",
        type: "string",
        description: "URL to fetch data from",
        default: "https://vegaftp.free.nf/?i=1",
      })
      .option("download", {
        alias: "d",
        type: "boolean",
        description: "Download ZIP file instead of showing JSON",
        default: false,
      })
      .option("extract", {
        alias: "e",
        type: "boolean",
        description: "Download and extract ZIP file to vega folder",
        default: false,
      });
  },
  handler: (argv) => {
    checkUpdate(argv.url, argv.download, argv.extract);
  }
};