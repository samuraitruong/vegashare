/**
 * Process Command
 * Processes PHP files and generates HTML/JSON files
 */

import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import { parseStandings } from "../libs/standings.js";
import { parsePairs } from "../libs/pairs.js";
import { parseFelovar } from "../libs/felovar.js";
import { parsePlayersName } from "../libs/playersname.js";

/**
 * Parses crosstablescore HTML content
 * @param {string} htmlContent - The HTML content to parse
 * @returns {Array} Parsed data array
 */
async function parseCrosstablescore(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const rows = $("table.table-striped tbody tr");
  const data = [];

  rows.each((_, row) => {
    const cells = $(row).find("td");
    const playerData = {
      rank: $(cells[0]).text().trim(),
      name: $(cells[1]).find(".player-name-box2 span").text().trim(),
      rating: $(cells[1]).find(".rating").text().trim(),
      federation: $(cells[1]).find(".fed img").attr("alt") || null,
      score: $(cells[2]).text().trim(),
      results: [
        $(cells[3]).text().trim(),
        $(cells[4]).text().trim(),
        $(cells[5]).text().trim(),
        $(cells[6]).text().trim(),
        $(cells[7]).text().trim(),
      ],
      bh: $(cells[8]).text().trim(),
      bhC1: $(cells[9]).text().trim(),
      sb: $(cells[10]).text().trim(),
    };
    data.push(playerData);
  });

  return data;
}

/**
 * Parses summary HTML content
 * @param {string} htmlContent - The HTML content to parse
 * @returns {Array} Parsed data array
 */
async function parseSummary(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const rows = $("table.table-striped tbody tr");
  const data = [];

  rows.each((_, row) => {
    const cells = $(row).find("td");
    const summaryData = {
      federation: $(cells[0]).text().trim(),
      players: $(cells[1]).text().trim(),
      points: $(cells[2]).text().trim(),
    };
    data.push(summaryData);
  });

  return data;
}

/**
 * Processes PHP files in the specified directory
 * @param {string} inputPath - Path to the directory containing PHP files
 */
export async function processPhpFiles(inputPath) {
  try {
    const files = await fs.readdir(inputPath);
    const phpFiles = files.filter((file) => file.endsWith(".php"));

    for (const phpFile of phpFiles) {
      const phpFilePath = path.join(inputPath, phpFile);
      const htmlFilePath = phpFilePath.replace(/\.php$/, ".html");
      const jsonFilePath = phpFilePath.replace(/\.php$/, ".json");

      try {
        const phpContent = await fs.readFile(phpFilePath, "utf-8");

        // Replace .php references with .html in the content
        const htmlContent = phpContent
          .replace(/<\?php[\s\S]*?\?>/g, "") // Remove PHP code blocks
          .replace(/\.php/g, ".html"); // Replace .php references with .html

        await fs.writeFile(htmlFilePath, htmlContent, "utf-8");
        console.log(`Generated HTML for: ${phpFile}`);

        // Parse the HTML content and generate JSON data
        let jsonData;
        if (phpFile === "crosstablescore.php") {
          jsonData = await parseCrosstablescore(htmlContent);
        } else if (phpFile.startsWith("pairs")) {
          jsonData = await parsePairs(htmlContent);
        } else if (phpFile === "standings.php") {
          jsonData = await parseStandings(htmlContent);
        } else if (phpFile === "felovar.php") {
          jsonData = await parseFelovar(htmlContent);
        } else if (phpFile === "playersname.php") {
          jsonData = await parsePlayersName(htmlContent);
        } else if (phpFile.startsWith("summary")) {
          jsonData = await parseSummary(htmlContent);
        } else {
          console.log(`Skipping custom parsing for: ${phpFile}`);
          continue;
        }

        await fs.writeFile(
          jsonFilePath,
          JSON.stringify(jsonData, null, 2),
          "utf-8"
        );
        console.log(`Generated JSON for: ${phpFile}`);
      } catch (err) {
        console.error(`Error processing file '${phpFile}':`, err);
      }
    }
  } catch (err) {
    console.error(`Error reading folder '${inputPath}':`, err);
  }
}

/**
 * Command configuration for yargs
 */
export const commandConfig = {
  command: "process",
  describe: "Process PHP files and generate HTML/JSON",
  builder: (yargs) => {
    return yargs.option("inputPath", {
      alias: "i",
      type: "string",
      description: "Path to the folder to process PHP files",
      demandOption: true,
    });
  },
  handler: (argv) => {
    processPhpFiles(path.resolve(argv.inputPath));
  }
};
