/**
 * Process Folder Command
 * Processes all subfolders in a directory using html-to-json
 */

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

/**
 * Processes all subfolders in the specified directory
 * @param {string} inputPath - Path to the directory containing subfolders
 * @param {boolean} verbose - Whether to show verbose output
 */
export async function processAllFolders(inputPath, verbose = false) {
  try {
    console.log(`🔄 Processing all folders in: ${inputPath}`);
    
    // Read the directory to find all subfolders
    const items = await fs.readdir(inputPath, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => name.startsWith('www')) // Only process www* folders
      .sort();

    if (folders.length === 0) {
      console.log(`ℹ️ No www* folders found in ${inputPath}`);
      return;
    }

    console.log(`📂 Found ${folders.length} folders to process:`);
    folders.forEach(folder => console.log(`   - ${folder}`));
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    // Process each folder
    for (const folder of folders) {
      const folderPath = path.join(inputPath, folder);
      console.log(`🔄 Processing folder: ${folder}`);
      
      try {
        // Run html-to-json command for this folder
        const command = `vega-cli html-to-json --input "${folderPath}" ${verbose ? '--verbose' : ''}`;
        
        if (verbose) {
          console.log(`   Running: ${command}`);
        }
        
        execSync(command, { 
          stdio: verbose ? 'inherit' : 'pipe',
          cwd: process.cwd()
        });
        
        console.log(`✅ Successfully processed: ${folder}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${folder}:`, error.message);
        errorCount++;
      }
      
      console.log(''); // Add spacing between folders
    }

    // Summary
    console.log(`📊 Processing Summary:`);
    console.log(`   ✅ Successfully processed: ${successCount} folders`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} folders`);
    }
    console.log(`   📁 Total folders: ${folders.length}`);

  } catch (error) {
    console.error(`❌ Error reading directory '${inputPath}':`, error.message);
  }
}

/**
 * Command configuration for yargs
 */
export const commandConfig = {
  command: "process-folder",
  describe: "Process all www* subfolders in a directory using html-to-json",
  builder: (yargs) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string",
        description: "Path to the directory containing www* subfolders",
        demandOption: true,
      })
      .option("verbose", {
        alias: "v",
        type: "boolean",
        description: "Show verbose output",
        default: false,
      });
  },
  handler: (argv) => {
    processAllFolders(path.resolve(argv.input), argv.verbose);
  }
};
