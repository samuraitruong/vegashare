import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { load } from 'cheerio';
import crypto from 'crypto';

// Import the reference module for senior player detection
import { IsSeniorPlayer } from '../ref.mjs';

/**
 * Gets the absolute path to the input folder
 * @param {string} inputPath - Input folder path
 * @returns {string} The absolute path to the input folder
 */
function getInputPath(inputPath) {
  // If inputPath is absolute, use it as is
  if (inputPath.startsWith('/')) {
    return inputPath;
  }
  
  // If running from CLI directory, go up to project root then to input path
  if (process.cwd().endsWith('/cli/vega-cli')) {
    return join(process.cwd(), '..', '..', inputPath);
  } else {
    // Running from repository root
    return join(process.cwd(), inputPath);
  }
}

/**
 * Function to calculate MD5 hash of data object excluding generatedAt and md5Hash fields
 */
function calculateDataHash(data) {
  // Create a deep copy and remove the fields we want to exclude
  const dataCopy = JSON.parse(JSON.stringify(data));
  delete dataCopy.generatedAt;
  delete dataCopy.md5Hash;
  
  // Convert to string and calculate hash
  const dataString = JSON.stringify(dataCopy);
  return crypto.createHash('md5').update(dataString).digest('hex');
}

/**
 * Function to read existing file and get its hash
 */
async function getExistingHash(filePath) {
  try {
    const existingData = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(existingData);
    return parsed.md5Hash || null;
  } catch (error) {
    return null; // File doesn't exist or can't be parsed
  }
}

/**
 * Get all HTML files in a directory
 */
async function getHtmlFiles(dir) {
  const files = await readdir(dir);
  return files.filter(f => f.endsWith('.html'));
}

/**
 * Parse caption to extract player information
 */
function parseCaptionToPlayerInfo($caption) {
  // Check if caption has HTML content or is just text
  const hasHTML = $caption.find('*').length > 0;
  
  if (!hasHTML) {
    // Caption contains only text
    return $caption.text().trim();
  }
  
  // Caption contains HTML, try to extract player information
  const captionText = $caption.text();
  const captionHtml = $caption.html();
  
  let playerName = '';
  let playerId = '';
  let moreInfo = {};
  
  // Pattern 1: Extract player name from <strong> tag (original format)
  playerName = $caption.find('strong').text().trim();
  
  // Pattern 2: Extract player name from FIDE rating link (new format)
  if (!playerName) {
    const fideLink = $caption.find('a[href*="ratings.fide.com"]');
    if (fideLink.length > 0) {
      playerName = fideLink.text().trim();
      // Extract FIDE ID from href
      const fideIdMatch = fideLink.attr('href').match(/event=(\d+)/);
      if (fideIdMatch) {
        moreInfo.FIDE_ID = fideIdMatch[1];
      }
    }
  }
  
  // Extract ID using regex from the full text
  const idMatch = captionText.match(/ID\s*=\s*(\d+)/i);
  playerId = idMatch ? idMatch[1] : '';
  
  // Extract N value (player number) - new format
  const nMatch = captionText.match(/N\s*=\s*(\d+)/i);
  if (nMatch) moreInfo.N = nMatch[1].trim();
  
  // Extract K value
  const kMatch = captionText.match(/K\s*=\s*([^,]+)/i);
  if (kMatch) moreInfo.K = kMatch[1].trim();
  
  // Extract Elo value  
  const eloMatch = captionText.match(/Elo\s*=\s*([^,]+)/i);
  if (eloMatch) moreInfo.Elo = eloMatch[1].trim();
  
  // Extract anchor name if present
  const anchorName = $caption.find('a.anchor').attr('name');
  if (anchorName) moreInfo.anchor = anchorName;
  
  return {
    playerName,
    id: playerId,
    moreInfo,
    rawText: captionText.trim(),
    rawHtml: captionHtml
  };
}

/**
 * Function to parse White Player and Black Player columns (pairing tables)
 */
function readPairPlayer($td) {
  let id = '';
  let gender = '';
  let playerName = '';
  let href = '';
  let title = '';
  
  // Look for ID in various locations
  const idSpan = $td.find('span.idwhite, span.idblack');
  if (idSpan.length > 0) {
    id = idSpan.text().trim();
  } else {
    // Look for ID in sort-num div (newer format)
    const sortNumDiv = $td.find('.sort-num');
    if (sortNumDiv.length > 0) {
      id = sortNumDiv.text().trim();
    }
  }
  
  // Look for title in span with title class
  const titleSpan = $td.find('span.title');
  if (titleSpan.length > 0) {
    title = titleSpan.text().trim();
  }
  
  // Look for gender in various locations
  const genderSpan = $td.find('span.male, span.female, span.notitle');
  if (genderSpan.hasClass('male')) {
    gender = 'male';
  } else if (genderSpan.hasClass('female')) {
    gender = 'female';
  } else if (genderSpan.hasClass('notitle')) {
    gender = 'notitle';
  } else {
    // Look for gender in div classes (newer format)
    const genderDiv = $td.find('.male, .female, .notitle2');
    if (genderDiv.hasClass('male')) {
      gender = 'male';
    } else if (genderDiv.hasClass('female')) {
      gender = 'female';
    } else if (genderDiv.hasClass('notitle2')) {
      gender = 'notitle';
    } else {
      gender = 'notitle'; // default
    }
  }
  
  // Look for player name
  const anchor = $td.find('a');
  if (anchor.length > 0) {
    href = anchor.attr('href') || '';
    // Try to get player name from anchor text first
    playerName = anchor.text().trim();
    
    // If anchor text is empty, look for player name in player-name-box2 span
    if (!playerName) {
      const nameSpan = $td.find('.player-name-box2 span');
      if (nameSpan.length > 0) {
        playerName = nameSpan.text().trim();
      }
    }
  }
  
  return {
    id,
    playerName,
    gender,
    href,
    title
  };
}

/**
 * Function to parse Player column (standings tables)
 */
function readPlayer($td) {
  let id = '';
  let gender = '';
  let playerName = '';
  let href = '';
  let title = '';
  
  // Pattern 1: <span class="idn"> 3 </span> <span class="notitle male"> </span> <a href="playercard.html#3"> Name</a>
  let idSpan = $td.find('span.idn');
  if (idSpan.length > 0) {
    id = idSpan.text().trim();
  } else {
    // Pattern 2: Complex div structure - look for .sort-num
    const sortNumDiv = $td.find('.sort-num');
    if (sortNumDiv.length > 0) {
      id = sortNumDiv.text().trim();
    } else {
      // Pattern 3: Badge with ID - <span class="badge text-bg-primary"> &nbsp;&nbsp;8 </span>
      const badgeSpan = $td.find('span.badge');
      if (badgeSpan.length > 0) {
        id = badgeSpan.text().replace(/\s+/g, ' ').trim();
      }
    }
  }
  
  // Look for title in span with title class
  const titleSpan = $td.find('span.title');
  if (titleSpan.length > 0) {
    title = titleSpan.text().trim();
  }
  
  // Look for gender in span classes
  const genderSpan = $td.find('span.male, span.female, span.notitle, .male, .female, .notitle2');
  if (genderSpan.hasClass('male') || (genderSpan.hasClass('notitle') && genderSpan.hasClass('male'))) {
    gender = 'male';
  } else if (genderSpan.hasClass('female') || (genderSpan.hasClass('notitle') && genderSpan.hasClass('female'))) {
    gender = 'female';
  } else if (genderSpan.hasClass('notitle') || genderSpan.hasClass('notitle2')) {
    gender = 'notitle';
  } else {
    gender = 'notitle'; // default
  }
  
  // Look for player name in anchor tag or span within player-name-box2
  let anchor = $td.find('a');
  if (anchor.length > 0) {
    playerName = anchor.text().trim();
    href = anchor.attr('href') || '';
  }
  
  // If no player name from anchor, check for player name in nested span (Pattern 2)
  if (!playerName || playerName === '') {
    const nameSpan = $td.find('.player-name-box2 span');
    if (nameSpan.length > 0) {
      playerName = nameSpan.text().trim();
    }
  }
  
  // Pattern 4: Unrated players - <td> <span class="notitle male"> </span> Balaji,Sai Sivesh </td>
  if (!playerName || playerName === '') {
    // Get all text content and remove the gender span text
    const allText = $td.text().trim();
    const genderSpanText = $td.find('span.male, span.female, span.notitle, .male, .female, .notitle2').text().trim();
    
    // Remove the gender span text from the total text to get just the player name
    if (genderSpanText && allText !== genderSpanText) {
      playerName = allText.replace(genderSpanText, '').trim();
    } else if (allText) {
      // If no gender span found or they're the same, use all text
      playerName = allText;
    }
  }
  
  return {
    id,
    playerName,
    gender,
    href,
    title
  };
}

/**
 * Parse table to JSON
 */
function parseTableToJson($table, $) {
  // Parse caption if it exists
  let caption = null;
  const $caption = $table.find('caption');
  if ($caption.length > 0) {
    caption = parseCaptionToPlayerInfo($caption);
  } else {
    // If no caption, look for h5 element before the table
    let $prevH5 = $table.prev('h5');
    
    // If not found, try looking for h5 in the same container
    if ($prevH5.length === 0) {
      const $parent = $table.parent();
      if ($parent.length > 0) {
        // Look for h5 elements that come before this table in the same parent
        const tableIndex = $parent.children().index($table);
                $parent.children().each((i, el) => {
                  if (i < tableIndex && $(el).is('h5')) {
                    $prevH5 = $(el);
                    return false; // break the loop
                  }
                });
      }
    }
    
    // If still not found, try looking for h5 in the parent's parent
    if ($prevH5.length === 0) {
      const $grandParent = $table.parent().parent();
      if ($grandParent.length > 0) {
        const tableParentIndex = $grandParent.children().index($table.parent());
        $grandParent.children().each((i, el) => {
          if (i < tableParentIndex && $(el).is('h5')) {
            $prevH5 = $(el);
            return false; // break the loop
          }
        });
      }
    }
    
    if ($prevH5.length > 0) {
      const h5Text = $prevH5.text().trim();
      if (h5Text) {
        // Create a caption object from the h5 text
        caption = {
          playerName: h5Text,
          id: '',
          moreInfo: {},
          rawText: h5Text,
          rawHtml: $prevH5.html().trim()
        };
      }
    }
  }
  
  // Parse footer if it exists
  let footer = null;
  const $tfoot = $table.find('tfoot');
  if ($tfoot.length > 0) {
    const $footerRow = $tfoot.find('tr').first();
    const $footerCell = $footerRow.find('td').first();
    if ($footerCell.length > 0) {
      footer = {
        text: $footerCell.text().trim(),
        html: $footerCell.html().trim()
      };
    }
  }
  
  // Build headers with unique keys to avoid overwriting duplicate column names
  const headers = [];
  const headerNameCount = new Map();
  $table.find('thead tr th, thead tr td').each((i, el) => {
    const nameRaw = $(el).text().trim().replace("↕ ", "");
    const baseName = nameRaw || `col${i + 1}`;
    const count = headerNameCount.get(baseName) || 0;
    const key = count === 0 ? baseName : `${baseName}_${count}`;
    headerNameCount.set(baseName, count + 1);
    headers.push({ name: baseName, key });
  });
  
  const rows = [];
  $table.find('tbody tr').each((i, tr) => {
    const rowObj = {};
    $(tr).find('td').each((j, td) => {
      // Improved column mapping - ensure we don't exceed header count
      const headerObj = j < headers.length ? headers[j] : { name: `col${j + 1}`, key: `col${j + 1}` };
      const headerName = typeof headerObj === 'string' ? headerObj : headerObj.name;
      const headerKey = typeof headerObj === 'string' ? headerObj : headerObj.key;
      const $td = $(td);
      
      if (headerName === 'White Player' || headerName === 'Black Player' || headerName === 'Player') {
        // Check if the cell has structured content (child elements)
        const hasChildElements = $td.find('span').length > 0 || $td.find('a').length > 0;
        
        if (hasChildElements) {
          // Use specialized parsing functions
          if (headerName === 'Player') {
            // Standings tables - use readPlayer function
            rowObj[headerKey] = readPlayer($td);
          } else {
            // Pairing tables (White Player/Black Player) - use readPairPlayer function
            rowObj[headerKey] = readPairPlayer($td);
          }
        } else {
          // Fallback: cell only contains text (e.g., "( half point bye )")
          rowObj[headerKey] = $td.text().trim();
        }
      } else {
        // Special handling for crosstable cells with result and opponent info
        const resDiv = $td.find('div.res');
        const cwDiv = $td.find('div.cw');
        const cbDiv = $td.find('div.cb');
        
        if (resDiv.length > 0) {
          // This is a crosstable cell with result and opponent info
          const result = resDiv.text().trim();
          const whiteOpponent = cwDiv.length > 0 ? cwDiv.text().trim() : null;
          const blackOpponent = cbDiv.length > 0 ? cbDiv.text().trim() : null;
          
          rowObj[headerKey] = {
            result,
            whiteOpponent,
            blackOpponent
          };
        } else {
          // Check if this is a hole cell (self-pairing)
          if ($td.hasClass('hole')) {
            rowObj[headerKey] = "×";
          } else {
            // Check if this cell contains an image (flag)
            const $img = $td.find('img');
            if ($img.length > 0) {
              // Extract flag information from image
              const alt = $img.attr('alt');
              const src = $img.attr('src');
              
              let federationCode = '';
              if (alt && alt.trim() !== '') {
                // Use alt attribute if available
                federationCode = alt.toUpperCase();
              } else if (src && src.trim() !== '') {
                // Extract federation code from src path (e.g., "FLAG/VIC.PNG" -> "VIC")
                if (src.includes('/')) {
                  const parts = src.split('/');
                  if (parts.length > 1) {
                    const fileName = parts[parts.length - 1]; // Get the last part (VIC.PNG)
                    federationCode = fileName.split('.')[0].toUpperCase(); // Remove extension and convert to uppercase (VIC)
                  } else {
                    federationCode = src.toUpperCase();
                  }
                } else {
                  federationCode = src.toUpperCase();
                }
              }
              
              rowObj[headerKey] = federationCode.toUpperCase();
            } else {
              // Regular cell content
              const cellText = $td.text().trim();
              
              // Check if this looks like a federation code (2-3 letters) and convert to uppercase
              if (/^[A-Za-z]{2,3}$/.test(cellText)) {
                rowObj[headerKey] = cellText.toUpperCase();
              } else {
                rowObj[headerKey] = cellText;
              }
            }
          }
        }
      }
    });
    
    // Post-process the row to fix common mapping issues
    // Only apply this fix to standings tables (tables with Player column)
    const headerNames = headers.map(h => typeof h === 'string' ? h : h.name);
    const hasPlayerColumn = headerNames.includes('Player') || headerNames.includes('NAME');
    const colKeys = Object.keys(rowObj).filter(key => key.startsWith('col'));
    
    if (colKeys.length > 0 && hasPlayerColumn) {
      // Log when we detect potential column misalignment in standings tables
      if (colKeys.length === 1 && colKeys[0] === 'col13' && (!rowObj['Pts'] || rowObj['Pts'] === '')) {
        console.log(`[DEBUG] Detected col13 with value "${rowObj['col13']}" - mapping to Pts`);
        rowObj['Pts'] = rowObj['col13'];
        delete rowObj['col13'];
      }
      
      // More general fix: if we have any col* keys and missing Pts, map the first one
      if (!rowObj['Pts'] || rowObj['Pts'] === '') {
        const firstColKey = colKeys.sort()[0];
        if (firstColKey && rowObj[firstColKey]) {
          console.log(`[DEBUG] Mapping ${firstColKey}="${rowObj[firstColKey]}" to Pts`);
          rowObj['Pts'] = rowObj[firstColKey];
          delete rowObj[firstColKey];
        }
      }
    }
    
    rows.push(rowObj);
  });
  
  // Return table data with caption and footer if they exist
  const result = { headers, rows };
  if (caption) {
    result.caption = caption;
  }
  if (footer) {
    result.footer = footer;
  }
  return result;
}

/**
 * Process HTML file
 */
async function processHtmlFile(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const $ = load(html);
  const tablesJson = [];
  $('table').each((i, table) => {
    const parsedTable = parseTableToJson($(table), $);
    tablesJson.push(parsedTable);
  });
  
  // Extract h1 title
  const pageHeading = $('h3').first().text().trim();
  const pairingScheduleText = $('.btn-toolbar h5').first().text().trim();
  return { pageHeading, tables: tablesJson, pairingScheduleText: pairingScheduleText || undefined };
}

/**
 * Extract menu structure from index.html
 */
async function extractMenuStructure(indexHtmlPath) {
  const html = await readFile(indexHtmlPath, 'utf-8');
  const $ = load(html);
  const menu = [];
  $('ul.navbar-nav.me-auto.mb-2.mb-lg-0 > li').each((i, li) => {
    const $li = $(li);
    const link = $li.find('> a.nav-link, > a.nav-link.dropdown-toggle').first();
    const text = link.text().trim();
    const href = link.attr('href') || null;
    const isDropdown = $li.hasClass('dropdown') || link.hasClass('dropdown-toggle');
    let children = [];
    if (isDropdown) {
      $li.find('ul.dropdown-menu > li > a').each((j, a) => {
        children.push({
          text: $(a).text().trim(),
          href: $(a).attr('href') || null
        });
      });
    }
    menu.push({ text, href, isDropdown, children });
  });
  return menu;
}

/**
 * Extract metadata from tourstat.html
 */
async function extractMetadataFromTourstat(tourstatPath) {
  const html = await readFile(tourstatPath, 'utf-8');
  const $ = load(html);
  const metadata = {};
  $('table.table-striped tbody tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (tds.length === 2) {
      const key = $(tds[0]).text().replace(/\s+/g, ' ').trim();
      const value = $(tds[1]).text().replace(/\s+/g, ' ').trim();
      metadata[key] = value;
    }
  });
  return metadata;
}

/**
 * Extract minimal metadata from index.html
 */
async function extractMinimalMetadataFromIndex(indexHtmlPath) {
  const html = await readFile(indexHtmlPath, 'utf-8');
  const $ = load(html);
  const meta = {};
  const div = $('div.flex.flex-column.justify-content-center.text-center.text-white');
  if (div.length) {
    const h1 = div.find('h1').first().text().trim();
    const h5s = div.find('h5');
    meta['Tournament Name'] = h1;
    if (h5s.length >= 1) meta['Federation'] = h5s.eq(0).text().trim();
    if (h5s.length >= 2) meta['Date'] = h5s.eq(1).text().trim();
  } else {
    // fallback: try to get h1 and h5 anywhere
    const h1 = $('h1').first().text().trim();
    const h5s = $('h5');
    if (h1) meta['Tournament Name'] = h1;
    if (h5s.length >= 1) meta['Federation'] = h5s.eq(0).text().trim();
    if (h5s.length >= 2) meta['Date'] = h5s.eq(1).text().trim();
  }
  if (!meta['Tournament Name']) {
    meta['Tournament Name'] = $("title").text().trim();
  }
  return meta;
}

/**
 * Build comprehensive player lookup from all sources
 */
function buildPlayerLookup(pageData, folderName) {
  const playerMap = new Map(); // Key: player number (#), Value: enriched player data
  
  // Step 1: Collect basic player data from index.html or standings.html
  const indexData = pageData['index.html'] || pageData['standings.html'];
  if (indexData?.tables && indexData.tables.length > 0) {
    const playerTable = indexData.tables[0];
    if (playerTable.rows) {
      playerTable.rows.forEach(row => {
        const playerNumber = row['#'];
        const playerObj = row['Player'];
        const title = row['Title'];
        const federation = row['Fed'];
        const rating = row['Rtg'];
        
        // Handle both string and object Player data
        let playerName = '';
        let playerId = '';
        let gender = '';
        let href = '';
        
        if (typeof playerObj === 'string') {
          playerName = playerObj;
          playerId = String(playerNumber);
        } else if (typeof playerObj === 'object' && playerObj !== null) {
          playerName = playerObj.playerName || '';
          playerId = playerObj.id || String(playerNumber);
          gender = playerObj.gender || '';
          href = playerObj.href || `playercard.html#${playerNumber}`;
        }
        
        if (playerNumber && playerName) {
          const playerData = {
            id: playerId,
            playerName: playerName,
            title: title ? String(title) : '',
            federation: federation ? String(federation) : '',
            rating: rating ? String(rating) : '',
            gender: gender,
            fideId: '',
            href: href,
            moreInfo: {}
          };
          playerMap.set(String(playerNumber), playerData);
        }
      });
    }
  }
  
  // Step 2: Enrich with FIDE data from felovar.html
  const felovarData = pageData['felovar.html'];
  if (felovarData?.tables && felovarData.tables.length > 0) {
    const felovarTable = felovarData.tables[0];
    if (felovarTable.rows) {
      felovarTable.rows.forEach(row => {
        const playerNumber = row['#'];
        const playerData = row['Player'];
        const fideId = row['FIDE ID'];
        const fideRating = row['Rtg'];
        const federation = row['Fed'];
        
        if (playerNumber && playerData && fideId) {
          const existingPlayer = playerMap.get(String(playerNumber));
          if (existingPlayer) {
            // Enrich existing player with FIDE data
            existingPlayer.fideId = String(fideId);
            existingPlayer.gender = playerData.gender || existingPlayer.gender;
            existingPlayer.title = playerData.title || existingPlayer.title;
            existingPlayer.federation = federation || existingPlayer.federation;
            existingPlayer.rating = fideRating || existingPlayer.rating;
            existingPlayer.moreInfo = {
              ...existingPlayer.moreInfo,
              fideId: String(fideId),
              fideRating: fideRating ? String(fideRating) : '',
              fideFederation: federation ? String(federation) : ''
            };
          } else {
            // Create new player entry if not found in index
            const newPlayer = {
              id: String(playerNumber),
              playerName: playerData.playerName || '',
              title: playerData.title || '',
              federation: federation || '',
              rating: fideRating || '',
              gender: playerData.gender || '',
              fideId: String(fideId),
              href: `playercard.html#${playerNumber}`,
              moreInfo: {
                fideId: String(fideId),
                fideRating: fideRating ? String(fideRating) : '',
                fideFederation: federation ? String(federation) : ''
              }
            };
            playerMap.set(String(playerNumber), newPlayer);
          }
        }
      });
    }
  }
  
  // Step 3: Collect additional player data from pairing tables
  Object.keys(pageData).forEach(fileName => {
    if (fileName !== 'index.html' && fileName !== 'felovar.html') {
      const pageTables = pageData[fileName]?.tables;
      if (pageTables) {
        pageTables.forEach(table => {
          if (table.rows) {
            table.rows.forEach(row => {
              // Check all columns for player objects
              Object.keys(row).forEach(columnKey => {
                const value = row[columnKey];
                
                // Check if this is a player object
                if (typeof value === 'object' && value !== null && value.playerName && value.id) {
                  const playerId = String(value.id);
                  const existingPlayer = playerMap.get(playerId);
                  
                  if (existingPlayer) {
                    // Merge additional data from pairing table
                    existingPlayer.gender = value.gender || existingPlayer.gender;
                    existingPlayer.title = value.title || existingPlayer.title;
                    existingPlayer.href = value.href || existingPlayer.href;
                    
                    // Merge moreInfo
                    existingPlayer.moreInfo = {
                      ...existingPlayer.moreInfo,
                      ...(value.moreInfo || {})
                    };
                  } else {
                    // Create new player entry from pairing data
                    const newPlayer = {
                      id: playerId,
                      playerName: value.playerName || '',
                      title: value.title || '',
                      federation: '',
                      rating: '',
                      gender: value.gender || '',
                      fideId: '',
                      href: value.href || `playercard.html#${playerId}`,
                      moreInfo: value.moreInfo || {}
                    };
                    playerMap.set(playerId, newPlayer);
                  }
                }
              });
            });
          }
        });
      }
    }
  });
  
  console.log(`[${folderName}] Built player lookup with ${playerMap.size} players`);
  return playerMap;
}

/**
 * Enrich all tables with standardized player data
 */
function enrichTablesWithPlayerData(pageData, playerLookup) {
  const enrichedPageData = {};
  
  Object.keys(pageData).forEach(fileName => {
    const page = pageData[fileName];
    enrichedPageData[fileName] = {
      ...page,
      tables: page.tables?.map(table => {
        if (!table.rows) return table;
        
        const enrichedRows = table.rows.map(row => {
          const enrichedRow = { ...row };
          
          // Enrich all player fields in the row
          Object.keys(row).forEach(key => {
            const value = row[key];
            
            // Check if this is a player object
            if (typeof value === 'object' && value !== null && value.playerName && value.id) {
              const playerId = String(value.id);
              const fullPlayerData = playerLookup.get(playerId);
              
              if (fullPlayerData) {
                // Merge the original player data with the enriched data
                enrichedRow[key] = { ...value, ...fullPlayerData };
              }
            }
          });
          
          return enrichedRow;
        });
        
        return { ...table, rows: enrichedRows };
      })
    };
  });
  
  return enrichedPageData;
}

/**
 * Transform data to normalized structure
 */
function transformToNormalizedData(pageData, playerLookup, metadata, menu, category) {
  // Create normalized player array
  const players = Array.from(playerLookup.values()).map(player => ({
    id: player.id,
    name: player.playerName,
    title: player.title || '',
    federation: player.federation || '',
    fideId: player.fideId || '',
    fideRating: player.moreInfo?.fideRating ? parseInt(player.moreInfo.fideRating) : null,
    fideFederation: player.moreInfo?.fideFederation || '',
    gender: player.gender || 'notitle',
    href: player.href || `playercard.html#${player.id}`,
    origin: player.moreInfo?.origin || ''
  }));

  // Create player lookup map for quick access
  const playerMap = new Map();
  players.forEach(player => {
    playerMap.set(player.id, player);
  });

  // Transform tables
  const transformedPages = {};
  
  Object.keys(pageData).forEach(fileName => {
    const page = pageData[fileName];
    const transformedTables = page.tables?.map(table => {
      if (!table.rows) return table;

      // Determine table type
      const tableType = determineTableType(table, fileName);
      
      const transformedRows = table.rows.map(row => {
        const transformedRow = { ...row };
        
        // Transform player references to IDs
        Object.keys(row).forEach(key => {
          const value = row[key];
          
          // Check if this is a player object
          if (typeof value === 'object' && value !== null && value.playerName && value.id) {
            // Replace player object with just the ID reference
            transformedRow[key] = value.id;
          }
        });
        
        return transformedRow;
      });

      return {
        ...table,
        type: tableType,
        rows: transformedRows
      };
    });

    transformedPages[fileName] = {
      ...page,
      tables: transformedTables
    };
  });

  // Create normalized tournament structure
  const normalizedData = {
    generatedAt: new Date().toISOString(),
    tournament: {
      id: metadata['Tournament Name']?.replace(/\s+/g, '-').toLowerCase() || 'unknown',
      name: metadata['Tournament Name'] || 'Unknown Tournament',
      category: category,
      metadata: {
        ...metadata,
        // Normalize metadata keys to camelCase
        tournamentName: metadata['Tournament Name'],
        federation: metadata['Federation'],
        dateBegin: metadata['Date Begin'],
        dateEnd: metadata['Date End'],
        arbiters: metadata['Arbiter(s)'],
        playSystem: metadata['Play System'],
        rounds: metadata['Rounds'] ? parseInt(metadata['Rounds']) : 0,
        scoreGame: metadata['Score game'],
        tieBreak: metadata['Tie break'],
        registeredPlayers: metadata['Registered Players'] ? parseInt(metadata['Registered Players']) : 0,
        averageRating: metadata['Average Rating (all)'] ? parseInt(metadata['Average Rating (all)']) : 0,
        averageRatingFide: metadata['Average Rating (only FIDE rated)'] ? parseInt(metadata['Average Rating (only FIDE rated)']) : 0,
        fideRatedPlayers: metadata['FIDE rated players'] ? parseInt(metadata['FIDE rated players']) : 0,
        unratedPlayers: metadata['unrated players'] ? parseInt(metadata['unrated players']) : 0,
        fideTitledPlayers: metadata['FIDE titled players'] ? parseInt(metadata['FIDE titled players']) : 0
      }
    },
    players: players,
    pages: transformedPages,
    menu: menu
  };

  return normalizedData;
}

/**
 * Determine table type
 */
function determineTableType(table, fileName) {
  const headers = table.headers?.map(h => typeof h === 'string' ? h : h.name) || [];
  const headerKeys = headers.map(h => h.toLowerCase());
  
  // Check for pairing table indicators
  const hasWhite = headerKeys.some(key => 
    key.includes('white') || key === 'white' || key === 'w'
  );
  const hasBlack = headerKeys.some(key => 
    key.includes('black') || key === 'black' || key === 'b'
  );
  
  if (hasWhite && hasBlack) {
    return 'pairing';
  }
  
  // Check for standings table indicators
  if (headerKeys.includes('player') && headerKeys.includes('pts')) {
    return 'standings';
  }
  
  // Check for crosstable indicators
  if (fileName.includes('crosstable') || headerKeys.some(key => key.match(/^\d+$/))) {
    return 'crosstable';
  }
  
  // Check for statistics indicators
  if (headerKeys.includes('statistics') || fileName.includes('stat')) {
    return 'statistics';
  }
  
  return 'other';
}

/**
 * Placeholder function for syncing tournament metadata to database
 * This will be implemented later when database is added
 */
async function syncTournamentToDatabase(tournamentData) {
  console.log('🔄 [PLACEHOLDER] Syncing tournament to database...');
  console.log(`   Tournament: ${tournamentData.tournament.name}`);
  console.log(`   Category: ${tournamentData.tournament.category}`);
  console.log(`   Players: ${tournamentData.players.length}`);
  console.log('   ⚠️  Database sync not implemented yet - this is a placeholder');
  
  // TODO: Implement database sync when database is added
  // This could include:
  // - Insert/update tournament metadata
  // - Insert/update player data
  // - Insert/update game results
  // - Handle relationships between tournaments and players
}

/**
 * Process a single folder
 */
async function processFolder(folderPath, verbose = false) {
  const folderName = basename(folderPath);
  const OUTPUT_FILE = join(folderPath, 'data_clean.json');
  
  if (verbose) {
    console.log(`📁 Processing folder: ${folderPath}`);
  }
  
  // Check if folder exists
  try {
    await stat(folderPath);
  } catch (error) {
    throw new Error(`Folder not found: ${folderPath}`);
  }
  
  const htmlFiles = await getHtmlFiles(folderPath);
  
  if (htmlFiles.length === 0) {
    console.log(`⚠️  No HTML files found in ${folderPath}`);
    return null;
  }
  
  if (verbose) {
    console.log(`📄 Found ${htmlFiles.length} HTML files: ${htmlFiles.join(', ')}`);
  }
  
  const result = {
    generatedAt: new Date().toISOString(),
  };
  
  // First pass: collect all page data
  result.page = {};
  for (const file of htmlFiles) {
    const filePath = join(folderPath, file);
    try {
      const pageData = await processHtmlFile(filePath);
      result.page[file] = pageData;
      if (verbose) {
        console.log(`   ✅ Processed: ${file}`);
      }
    } catch (err) {
      console.error(`   ❌ Error processing ${file}:`, err.message);
    }
  }
  
  // Second pass: build comprehensive player lookup and enrich all data
  const playerLookup = buildPlayerLookup(result.page, folderName);
  result.page = enrichTablesWithPlayerData(result.page, playerLookup);
  
  // Store the player lookup for reference
  result.playerLookup = Object.fromEntries(playerLookup);
  
  // Extract menu structure from index.html, fallback to standings.html
  let menu = [];
  const indexHtmlPath = join(folderPath, 'index.html');
  const standingsHtmlPath = join(folderPath, 'standings.html');
  
  try {
    menu = await extractMenuStructure(indexHtmlPath);
    result['menu'] = menu;
    if (verbose) {
      console.log(`   📋 Menu structure extracted from index.html`);
    }
  } catch (err) {
    if (verbose) {
      console.log(`   ⚠️  index.html not found, trying standings.html`);
    }
    try {
      menu = await extractMenuStructure(standingsHtmlPath);
      result['menu'] = menu;
      if (verbose) {
        console.log(`   📋 Menu structure extracted from standings.html`);
      }
    } catch (err2) {
      console.error(`   ❌ Error extracting menu from both index.html and standings.html:`, err2.message);
    }
  }
  
  // Extract metadata from tourstat.html, fallback to standings.html if not exist
  const tourstatPath = join(folderPath, 'tourstat.html');
  let metadata = {};
  try {
    metadata = await extractMetadataFromTourstat(tourstatPath);
    if (verbose) {
      console.log(`   📊 Metadata extracted from tourstat.html`);
    }
  } catch (err) {
    if (verbose) {
      console.log(`   ⚠️  tourstat.html not found, extracting minimal metadata from standings.html`);
    }
    try {
      metadata = await extractMinimalMetadataFromIndex(standingsHtmlPath);
      if (verbose) {
        console.log(`   📊 Minimal metadata extracted from standings.html`);
      }
    } catch (err2) {
      console.error(`   ❌ Error extracting minimal metadata from standings.html:`, err2.message);
    }
  }
  
  // Categorize tournament as Senior or Junior
  let category = 'Junior';
  const players = result.page['index.html']?.tables?.[0]?.rows || result.page['standings.html']?.tables?.[0]?.rows;
  if (players) {
    for (const player of players) {
      if (IsSeniorPlayer(player.Player) || IsSeniorPlayer(player.Player?.playerName)) {
        category = 'Senior';
        break;
      }
    }
  }
  
  // If any player is senior, set category to Senior
  result['players'] = players;
  result['category'] = category;
  if (metadata) metadata['category'] = category;
  result['metadata'] = metadata;
  
  if (players) {
    // Generate and write clean data
    const cleanData = transformToNormalizedData(result.page, playerLookup, metadata, menu, category);
    
    // Calculate MD5 hash for clean data
    const cleanHash = calculateDataHash(cleanData);
    const existingCleanHash = await getExistingHash(OUTPUT_FILE);
    
    // Only write if clean data has changed
    if (cleanHash !== existingCleanHash) {
      cleanData.md5Hash = cleanHash;
      await writeFile(OUTPUT_FILE, JSON.stringify(cleanData, null, 2), 'utf-8');
      console.log(`✅ [${folderName}] Clean data written to ${OUTPUT_FILE} (hash: ${cleanHash})`);
      
      // Sync to database (placeholder)
      await syncTournamentToDatabase(cleanData);
    } else {
      console.log(`ℹ️  [${folderName}] Clean data unchanged, skipping write to ${OUTPUT_FILE}`);
    }
    
    return result;
  }
  return null;
}

/**
 * Main function to convert HTML to JSON
 */
export async function htmlToJson(inputPath, verbose = false) {
  try {
    console.log('🔄 Starting HTML to JSON conversion...');
    
    const folderPath = getInputPath(inputPath);
    
    if (verbose) {
      console.log(`📁 Input folder: ${folderPath}`);
    }
    
    // Check if input path exists
    try {
      const statResult = await stat(folderPath);
      if (!statResult.isDirectory()) {
        throw new Error(`Input path is not a directory: ${folderPath}`);
      }
    } catch (error) {
      throw new Error(`Input folder not found: ${folderPath}`);
    }
    
    // Process the folder
    const result = await processFolder(folderPath, verbose);
    
    if (result) {
      console.log(`✅ Successfully processed ${inputPath}`);
      console.log(`📄 Output: ${join(folderPath, 'data_clean.json')}`);
    } else {
      console.log(`⚠️  No valid tournament data found in ${inputPath}`);
    }
    
  } catch (error) {
    console.error('❌ HTML to JSON conversion failed:', error.message);
    process.exit(1);
  }
}

/**
 * Command configuration for yargs
 */
export const commandConfig = {
  command: "html-to-json",
  describe: "Convert HTML tournament files to clean JSON format",
  builder: (yargs) => {
    return yargs
      .option("input", {
        alias: "i",
        type: "string",
        description: "Input folder containing HTML files",
        demandOption: true
      })
      .option("verbose", {
        alias: "v",
        type: "boolean",
        description: "Show verbose output",
        default: false
      });
  },
  handler: (argv) => {
    htmlToJson(argv.input, argv.verbose);
  }
};
