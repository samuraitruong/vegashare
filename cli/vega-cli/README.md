# Vega CLI

Vega CLI is a comprehensive command-line tool for managing and processing chess tournament data in the VegaShare system. It provides tools for syncing data, converting HTML to JSON, managing databases, and processing tournament files.

## Features

- **Data Synchronization**: Sync files from remote servers and check for updates
- **HTML Processing**: Convert PHP files to HTML and generate JSON data
- **Database Management**: Upsert tournament data to Turso database
- **Batch Processing**: Process multiple tournament folders at once
- **Tournament Analysis**: Extract player data, standings, and tournament metadata

## Installation

1. Navigate to the `vega-cli` directory:

   ```bash
   cd cli/vega-cli
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Link the CLI globally for easier usage:
   ```bash
   npm link
   ```

## Commands

### 1. `check-update` - Sync Files from Remote Server

Downloads and extracts changed files from a remote server.

```bash
vega-cli check-update [options]
```

**Options:**
- `--extract` - Extract downloaded files
- `--output <path>` - Output directory (default: `./vega`)
- `--url <url>` - Server URL with parameters

**Example:**
```bash
vega-cli check-update --extract --output ./vega --url "https://vegaftp.free.nf/?i=1&seconds=300"
```

### 2. `sync-html` - Convert PHP to HTML

Converts PHP files to HTML using a local PHP server.

```bash
vega-cli sync-html [options]
```

**Options:**
- `--server <url>` - PHP server URL (default: `http://localhost:8080`)
- `--folder <name>` - Specific folder to process
- `--output <path>` - Output directory for HTML files
- `--verbose` - Show detailed output

**Example:**
```bash
vega-cli sync-html --server http://localhost:8080 --folder www2025BestintheWest --verbose
```

### 3. `html-to-json` - Convert HTML to JSON

Converts HTML tournament files to structured JSON data.

```bash
vega-cli html-to-json --input <folder> [options]
```

**Options:**
- `--input <path>` - Input folder containing HTML files (required)
- `--verbose` - Show detailed processing information

**Example:**
```bash
vega-cli html-to-json --input www/www2025BestintheWest --verbose
```

**Output:**
- Generates `data_clean.json` with clean page keys (e.g., `standings` instead of `standings.html`)
- Extracts player data, tournament metadata, and menu structure
- Creates comprehensive player lookup tables

### 4. `process-folder` - Batch Process Multiple Folders

Processes all `www*` subfolders in a directory using html-to-json.

```bash
vega-cli process-folder --input <directory> [options]
```

**Options:**
- `--input <path>` - Directory containing www* subfolders (required)
- `--verbose` - Show detailed output for each folder

**Example:**
```bash
vega-cli process-folder --input www --verbose
```

**Features:**
- Automatically finds all `www*` folders
- Processes each folder sequentially
- Shows progress and summary statistics
- Continues processing even if some folders fail

### 5. `upsert-db` - Update Database

Upserts tournament data from JSON files to the Turso database.

```bash
vega-cli upsert-db --file <json-file> [options]
```

**Options:**
- `--file <path>` - JSON file to upsert (required)
- `--verbose` - Show detailed database operations

**Example:**
```bash
vega-cli upsert-db --file www/www2025BestintheWest/data_clean.json --verbose
```

**Environment Variables:**
- `TURSO_DATABASE_URL` - Database connection URL
- `TURSO_AUTH_TOKEN` - Database authentication token

### 6. `process` - Legacy PHP Processing

Legacy command for processing PHP files (deprecated in favor of html-to-json).

```bash
vega-cli process --inputPath <folder>
```

## Common Workflows

### 1. Complete Tournament Processing

Process all tournaments in the www folder:

```bash
# Process all folders
vega-cli process-folder --input www --verbose

# Upsert all generated JSON files to database
find www -name "data_clean.json" -exec vega-cli upsert-db --file {} --verbose \;
```

### 2. Single Tournament Processing

Process a single tournament:

```bash
# Convert HTML to JSON
vega-cli html-to-json --input www/www2025BestintheWest --verbose

# Upsert to database
vega-cli upsert-db --file www/www2025BestintheWest/data_clean.json --verbose
```

### 3. Data Synchronization

Sync new data from remote server:

```bash
# Download and extract changed files
vega-cli check-update --extract --output ./vega --url "https://vegaftp.free.nf/?i=1&seconds=300"

# Convert PHP to HTML (requires PHP server running)
vega-cli sync-html --server http://localhost:8080 --verbose

# Process the new HTML files
vega-cli process-folder --input html --verbose
```

## Environment Setup

### Required Environment Variables

For database operations, set these environment variables:

```bash
export TURSO_DATABASE_URL="your-database-url"
export TURSO_AUTH_TOKEN="your-auth-token"
```

### PHP Server Setup

For HTML conversion, start the PHP server:

```bash
# From project root
docker-compose -f docker-compose.html.yml up -d
```

## Output Structure

### JSON Data Structure

The `html-to-json` command generates clean, structured data:

```json
{
  "generatedAt": "2025-09-11T04:47:07.802Z",
  "tournament": {
    "id": "tournament-id",
    "name": "Tournament Name",
    "category": "Junior|Senior",
    "metadata": { ... }
  },
  "page": {
    "standings": { ... },
    "playercard": { ... },
    "felovar": { ... }
  },
  "menu": [
    {
      "text": "Standings",
      "href": "standings",
      "isDropdown": false
    }
  ],
  "playerLookup": { ... }
}
```

### Key Features

- **Clean Page Keys**: Uses `standings` instead of `standings.html`
- **Menu Structure**: Extracted navigation with clean hrefs
- **Player Data**: Comprehensive player lookup with FIDE information
- **Tournament Metadata**: Complete tournament information and statistics

## Troubleshooting

### Common Issues

1. **PHP Server Not Running**: Ensure Docker PHP server is running for HTML conversion
2. **Database Connection**: Verify TURSO environment variables are set
3. **File Permissions**: Ensure write permissions for output directories
4. **Missing Files**: Some tournaments may not have complete data (index.html, standings.html)

### Debug Mode

Use `--verbose` flag for detailed output:

```bash
vega-cli html-to-json --input www/www2025BestintheWest --verbose
```

## Development

### Project Structure

```
cli/vega-cli/
├── index.js                 # Main CLI entry point
├── commands/               # Command implementations
│   ├── check-update.js     # File synchronization
│   ├── sync-html.js        # PHP to HTML conversion
│   ├── html-to-json.js     # HTML to JSON conversion
│   ├── process-folder.js   # Batch processing
│   ├── upsert-db.js        # Database operations
│   └── process.js          # Legacy PHP processing
└── libs/                   # Utility libraries
```

### Adding New Commands

1. Create a new command file in `commands/`
2. Export `commandConfig` object with yargs configuration
3. Import and register in `index.js`

## License

This project is licensed under the ISC License. See the LICENSE file for details.
