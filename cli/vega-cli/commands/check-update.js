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
async function makeRequest(url, additionalHeaders = {}, debug = false) {
  if (debug) {
    console.log("🌐 Making request to:", url);
    console.log("📋 Headers:", { ...BROWSER_HEADERS, ...additionalHeaders });
  }
  
  const response = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      ...additionalHeaders
    }
  });
  
  if (debug) {
    console.log("📥 Response status:", response.status, response.statusText);
    console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));
  }
  
  return response;
}

/**
 * Handles cookie challenges and returns the final response
 * @param {string} url - The URL to fetch data from
 * @param {Object} cookieData - Cached cookie data (optional)
 * @param {boolean} isDownload - Whether this is a download request
 * @returns {Promise<Object|Buffer>} The JSON response data or binary data for downloads
 */
async function handleCookieChallenge(url, cookieData = null, isDownload = false, debug = false) {
  // Try with cached cookie first if available
  if (cookieData) {
    try {
      const response = await makeRequest(url, {
        'Cookie': `${cookieData.name}=${cookieData.value}`
      }, debug);
      
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
  const response = await makeRequest(url, {}, debug);
  
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
    }, debug);
    
    if (!followUpResponse.ok) {
      if (followUpResponse.status === 404) {
        console.log("ℹ️  No files changed in the specified time window (404)");
        return null; // Return null to indicate no changes
      }
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
        if (thirdResponse.status === 404) {
          console.log("ℹ️  No files changed in the specified time window (404)");
          return null; // Return null to indicate no changes
        }
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
          if (finalResponse.status === 404) {
            console.log("ℹ️  No files changed in the specified time window (404)");
            return null; // Return null to indicate no changes
          }
          throw new Error(`Final HTTP error! status: ${finalResponse.status}`);
        }
        
        if (isDownload) {
          // For download requests, return binary content directly
          return await finalResponse.arrayBuffer();
        }
        
        const finalData = await finalResponse.text();
        
        try {
          return JSON.parse(finalData);
        } catch (jsonError) {
          console.error("❌ Final response is not valid JSON");
          console.error("Response content (first 500 chars):", finalData.substring(0, 500));
          console.error("Status:", finalResponse.status, finalResponse.statusText);
          
          if (finalResponse.status === 404) {
            console.log("ℹ️  No files changed in the specified time window (404)");
            return null;
          }
          
          throw new Error(`Final response is not valid JSON. Status: ${finalResponse.status}`);
        }
      } else {
        try {
          return JSON.parse(thirdData);
        } catch (jsonError) {
          console.error("❌ Third response is not valid JSON");
          console.error("Response content (first 500 chars):", thirdData.substring(0, 500));
          console.error("Status:", thirdResponse.status, thirdResponse.statusText);
          
          if (thirdResponse.status === 404) {
            console.log("ℹ️  No files changed in the specified time window (404)");
            return null;
          }
          
          throw new Error(`Third response is not valid JSON. Status: ${thirdResponse.status}`);
        }
      }
    } else {
      try {
        return JSON.parse(followUpData);
      } catch (jsonError) {
        console.error("❌ Follow-up response is not valid JSON");
        console.error("Response content (first 500 chars):", followUpData.substring(0, 500));
        console.error("Status:", followUpResponse.status, followUpResponse.statusText);
        
        if (followUpResponse.status === 404) {
          console.log("ℹ️  No files changed in the specified time window (404)");
          return null;
        }
        
        throw new Error(`Follow-up response is not valid JSON. Status: ${followUpResponse.status}`);
      }
    }
  } else {
    // Not a cookie protection response
    if (isDownload) {
      // For download requests, return binary content directly
      return await response.arrayBuffer();
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(data);
    } catch (jsonError) {
      // Log the response for debugging
      console.error("❌ Response is not valid JSON");
      console.error("Response content (first 500 chars):", data.substring(0, 500));
      console.error("Content-Type:", response.headers.get('content-type'));
      console.error("Status:", response.status, response.statusText);
      
      // If it's a 404, handle it gracefully
      if (response.status === 404) {
        console.log("ℹ️  No files changed in the specified time window (404)");
        return null;
      }
      
      throw new Error(`Response is not valid JSON. Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
    }
  }
}

/**
 * Fetches data from the specified URL and handles cookie-based protection
 * @param {string} url - The URL to fetch data from
 * @param {boolean} download - Whether to download ZIP file instead of showing JSON
 * @param {boolean} extract - Whether to download and extract ZIP file to vega folder
 * @param {boolean} debug - Whether to show debug information
 * @param {string} outputPath - Custom output path for extraction (default: vega folder)
 */
export async function checkUpdate(url, download = false, extract = false, debug = false, outputPath = null) {
  try {
    const needsDownload = download || extract;
    
    // Try to load cached cookies first
    const cachedCookies = await loadCookies();
    
    if (cachedCookies) {
      console.log("Using cached cookies...");
    } else {
      console.log("No cached cookies found, going through challenge...");
    }
    
    if (debug) {
      console.log("🔍 Debug mode enabled");
      console.log("Needs download:", needsDownload);
    }
    
    // Step 1: Get JSON response to check for changes
    console.log("📋 Checking for changes...");
    const jsonResult = await handleCookieChallenge(url, cachedCookies, false, debug);
    
    // If result is null, it means no changes were found (404)
    if (jsonResult === null) {
      console.log("✅ No changes detected - process completed successfully");
      return;
    }
    
    if (debug) {
      console.log("📊 JSON response:", JSON.stringify(jsonResult, null, 2));
    }
    
    // If we need to download and there are changes, make a second call
    if (needsDownload) {
      // Check if there are actually files to download
      if (jsonResult.count === 0 || !jsonResult.files || jsonResult.files.length === 0) {
        console.log("✅ No files to download - process completed successfully");
        return;
      }
      
      console.log(`📥 Changes detected (${jsonResult.count} files), downloading ZIP file...`);
      
      // Step 2: Make download call to get ZIP file
      // Use fresh cookies from the successful JSON call
      const freshCookies = await loadCookies();
      const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=true`;
      if (debug) {
        console.log("🔍 Download URL:", downloadUrl);
        console.log("🔍 Using fresh cookies for download:", freshCookies ? "Yes" : "No");
      }
      
      const zipResult = await handleCookieChallenge(downloadUrl, freshCookies, true, debug);
      
      if (extract) {
        // Extract mode: download and extract to specified folder
        const targetPath = outputPath || getVegaPath();
        console.log(`📦 Extracting ZIP file to ${targetPath}...`);
        
        if (debug) {
          console.log("🔍 Target extraction path:", targetPath);
        }
        
        try {
          const extractedCount = await extractZip(Buffer.from(zipResult), targetPath);
          console.log(`✅ Successfully extracted ${extractedCount} files to ${targetPath}`);
        } catch (extractError) {
          console.error("❌ Failed to extract ZIP file:", extractError.message);
          process.exit(1);
        }
      } else {
        // Download mode: output ZIP file to stdout
        console.log("📤 Outputting ZIP file...");
        process.stdout.write(Buffer.from(zipResult));
      }
    } else {
      // Display the JSON result
      console.log(JSON.stringify(jsonResult, null, 2));
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
      })
      .option("debug", {
        type: "boolean",
        description: "Show debug information",
        default: false,
      })
      .option("output", {
        alias: "o",
        type: "string",
        description: "Output directory for extracted files (default: vega folder)",
        default: null,
      });
  },
  handler: (argv) => {
    checkUpdate(argv.url, argv.download, argv.extract, argv.debug, argv.output);
  }
};