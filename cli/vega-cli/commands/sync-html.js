import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { createWriteStream } from 'fs';

/**
 * Gets the absolute path to the 'vega' folder at the project root.
 * @returns {string} The absolute path to the vega folder.
 */
function getVegaPath() {
  // In GitHub Actions: process.cwd() is /home/runner/work/vegashare (repository root)
  // In local dev: process.cwd() is /Users/truongnguyen/source/vegashare/cli/vega-cli
  // We want the vega folder at the repository root
  
  let vegaPath;
  if (process.cwd().endsWith('/cli/vega-cli')) {
    // Running from CLI directory
    vegaPath = join(process.cwd(), '..', '..', 'vega');
  } else {
    // Running from repository root
    vegaPath = join(process.cwd(), 'vega');
  }
  
  console.log(`🔍 Current working directory: ${process.cwd()}`);
  console.log(`🔍 Calculated vega path: ${vegaPath}`);
  return vegaPath;
}

// HTML output is generated in-place under the source (vega) folders

/**
 * Recursively finds all PHP files in a directory
 * @param {string} dir - Directory to search
 * @param {string} basePath - Base path for relative paths
 * @returns {Promise<Array>} Array of PHP file paths
 */
async function findPhpFiles(dir, basePath = '') {
  const files = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findPhpFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.php') {
        files.push({
          fullPath,
          relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
          fileName: entry.name
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Recursively finds all HTML files in a directory
 * @param {string} dir - Directory to search
 * @param {string} basePath - Base path for relative paths
 * @returns {Promise<Array>} Array of HTML file paths
 */
async function findHtmlFiles(dir, basePath = '') {
  const files = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findHtmlFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
        files.push({
          fullPath,
          relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
          fileName: entry.name
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Makes an HTTP request to convert PHP to HTML
 * @param {string} url - The URL to request
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<string>} The HTML response
 */
async function requestHtml(url, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VegaShare-HTML-Sync/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to ensure exists
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Syncs PHP files to HTML by requesting them from the local PHP server
 * @param {string} serverUrl - Base URL of the PHP server (default: http://localhost:8080)
 * @param {boolean} verbose - Whether to show verbose output
 * @returns {Promise<Array<string>>} Array of folder names that were processed
 */
export async function syncHtml(serverUrl = 'http://localhost:8080', verbose = false) {
  try {
    console.log('🔄 Starting HTML sync process...');
    
    const vegaPath = getVegaPath();
    
    if (verbose) {
      console.log(`📁 Reading PHP files from: ${vegaPath}`);
      console.log(`📁 Output HTML files to: (in-place under vega)`);
      console.log(`🌐 PHP server URL: ${serverUrl}`);
    }
    
    // Check if vega directory exists
    try {
      await stat(vegaPath);
      console.log(`✅ Vega directory found: ${vegaPath}`);
    } catch (error) {
      console.log(`⚠️  Vega directory not found: ${vegaPath}`);
      console.log(`🔍 Current working directory: ${process.cwd()}`);
      console.log(`🔍 Directory contents: ${process.cwd()}/..`);
      
      // List contents of parent directories for debugging
      try {
        const parentDir = join(process.cwd(), '..');
        const parentContents = await readdir(parentDir);
        console.log(`📁 Parent directory contents: ${parentContents.join(', ')}`);
        
        const grandParentDir = join(process.cwd(), '..', '..');
        const grandParentContents = await readdir(grandParentDir);
        console.log(`📁 Grandparent directory contents: ${grandParentContents.join(', ')}`);
      } catch (listError) {
        console.log(`❌ Could not list directory contents: ${listError.message}`);
      }
      
      throw new Error(`Vega directory not found: ${vegaPath}. Please ensure the auto-sync workflow has run first to create the vega directory.`);
    }
    
    // Step 1: Find all PHP files and generate HTML files in the same source folder
    console.log('🔍 Step 1: Scanning for PHP files...');
    const phpFiles = await findPhpFiles(vegaPath);
    
    let phpSuccessCount = 0;
    let phpErrorCount = 0;
    const phpErrors = [];
    
    if (phpFiles.length > 0) {
      console.log(`📄 Found ${phpFiles.length} PHP files to convert to HTML`);
      
      // Process each PHP file and generate HTML in the same source folder
      for (const file of phpFiles) {
        try {
          if (verbose) {
            console.log(`🔄 Converting PHP to HTML: ${file.relativePath}`);
          }
          
          // Construct the URL for this PHP file
          const url = `${serverUrl}/${file.relativePath}`;
          
          // Request the HTML from the PHP server
          const html = await requestHtml(url);
          
          // Write HTML file in the same source folder (overwrites existing HTML if any)
          const htmlFileName = file.fileName.replace(/\.php$/i, '.html');
          const htmlOutputPath = join(dirname(file.fullPath), htmlFileName);
          await writeFile(htmlOutputPath, html, 'utf8');
          
          if (verbose) {
            console.log(`✅ Generated HTML in source: ${htmlOutputPath}`);
          }
          
          phpSuccessCount++;
        } catch (error) {
          phpErrorCount++;
          const errorMsg = `Failed to convert PHP ${file.relativePath}: ${error.message}`;
          phpErrors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    } else {
      console.log('ℹ️  No PHP files found in vega directory');
    }
    
    // Step 2 is no longer needed (we don't copy HTML to www). Build summary based on Step 1 only
    const processedFolders = new Set();
    const successCount = phpSuccessCount;
    const errorCount = phpErrorCount;
    const errors = [...phpErrors];
    
    // Summary
    console.log(`\n📊 HTML Sync Summary:`);
    console.log(`🔄 Step 1 - PHP to HTML conversion: ${phpSuccessCount} files converted`);
    if (phpErrorCount > 0) {
      console.log(`❌ Step 1 - PHP conversion errors: ${phpErrorCount} files failed`);
    }
    // No Step 2 summary (no HTML copying)
    
    if (errorCount > 0) {
      console.log(`\n❌ Total errors: ${errorCount} files`);
      if (verbose) {
        console.log('\nError details:');
        errors.forEach(error => console.log(`  - ${error}`));
      }
    }
    
    console.log(`📁 HTML files written in-place under: ${vegaPath}`);
    
    // Convert Set to Array and log processed folders
    const folderList = Array.from(processedFolders);
    if (folderList.length > 0) {
      console.log(`📂 Processed folders: ${folderList.join(', ')}`);
    }
    
    if (errorCount > 0) {
      process.exit(1);
    }
    
    return folderList;
    
  } catch (error) {
    console.error('❌ HTML sync failed:', error.message);
    process.exit(1);
  }
}

/**
 * Command configuration for yargs
 */
export const commandConfig = {
  command: "sync-html",
  describe: "Convert PHP files to HTML by requesting them from local PHP server",
  builder: (yargs) => {
    return yargs
      .option("server", {
        alias: "s",
        type: "string",
        description: "Base URL of the PHP server",
        default: "http://localhost:8080",
      })
      .option("verbose", {
        alias: "v",
        type: "boolean",
        description: "Show verbose output",
        default: false,
      });
  },
  handler: async (argv) => {
    const folders = await syncHtml(argv.server, argv.verbose);
    // Output folders as JSON for workflow consumption
    if (folders && folders.length > 0) {
      console.log(`\n📋 FOLDERS_PROCESSED: ${JSON.stringify(folders)}`);
    }
  }
};
