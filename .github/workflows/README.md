# GitHub Workflows

This directory contains GitHub Actions workflows for automated file synchronization and HTML generation.

## Workflows

### 1. Auto Sync (`auto-sync.yml`)

**Purpose**: Automatically sync files from the remote server every minute.

**Schedule**: Runs every minute (`* * * * *`)

**Functionality**:
- Checks for files changed in the last 5 minutes (300 seconds)
- Downloads and extracts changed files to the `vega/` folder (using `--output ./vega`)
- Automatically commits and pushes changes to the repository
- Only commits if there are actual changes

**Manual Trigger**: Can be triggered manually from the GitHub Actions tab

### 2. Test Sync (`test-sync.yml`)

**Purpose**: Test the sync functionality with custom parameters.

**Trigger**: Manual only (workflow_dispatch)

**Parameters**:
- `seconds`: Time window in seconds to check for changes (default: 300)

**Functionality**:
- Same as Auto Sync but with customizable time window
- Uses `--output ./vega` to extract files to the vega folder
- Includes `--debug` flag for detailed logging
- Useful for testing with different time ranges
- Can be used to sync files from longer time periods

### 3. Sync HTML (`sync-html.yml`)

**Purpose**: Convert PHP files to HTML using a local PHP server.

**Trigger**: 
- Automatic: When PHP files change in the `vega/` folder
- Manual: Can be triggered manually with custom server URL

**Parameters**:
- `server_url`: PHP server URL (default: http://localhost:8080)

**Functionality**:
- Starts a Docker container with PHP 8.2 Apache server
- Mounts the `vega/` folder to the server
- Scans for all PHP files in the `vega/` directory
- Makes HTTP requests to convert PHP files to HTML
- Outputs HTML files to the `www/` folder
- Automatically commits and pushes HTML changes

## Usage

### Automatic Sync
The auto sync runs automatically every minute. No manual intervention required.

### Manual Testing
1. Go to the GitHub Actions tab in your repository
2. Select "Test Sync (Manual)" workflow
3. Click "Run workflow"
4. Optionally specify a custom time window in seconds
5. Click "Run workflow" to execute

### Monitoring
- Check the Actions tab to see workflow runs
- View logs to see what files were synced
- Check commit history to see automated commits

## Configuration

### Git Configuration
The workflows automatically configure git with:
- User: "VegaShare Bot"
- Email: "vegashare-bot@noreply.github.com"

### File Structure
- **vega/**: Synced PHP files from the remote server
  - Files maintain their original directory structure from the remote server
  - Only PHP files from `www*` folders are synced (excluding `index.php`)
- **www/**: Generated HTML files from PHP conversion
  - HTML files maintain the same directory structure as PHP files
  - `.php` extensions are replaced with `.html`

### CLI Installation
The workflows use pnpm workspace management and `npm link` to make the `vega-cli` command globally available:
```bash
# Install all workspace dependencies
pnpm install

# Link the CLI globally
pnpm run link-all
```
This allows the workflows to use `vega-cli` directly instead of `./index.js`.

### CLI Options
The `vega-cli check-update` command supports several options:
- `--extract` (`-e`): Download and extract ZIP file
- `--output` (`-o`): Specify output directory for extracted files
- `--debug`: Show debug information for troubleshooting
- `--url` (`-u`): Custom URL to fetch data from

Example usage:
```bash
# Extract to default vega folder
vega-cli check-update --extract

# Extract to custom directory
vega-cli check-update --extract --output ./custom-folder

# Extract with debug logging
vega-cli check-update --extract --output ./vega --debug
```

### Node.js and pnpm Versions
- **Node.js**: v22 (latest LTS)
- **pnpm**: v10 (latest)
- **pnpm action**: v4 (latest)

## Troubleshooting

### No Changes Detected
- This is normal when no files have changed in the specified time window
- The workflow will log "No changes detected, skipping commit"

### Authentication Issues
- Ensure the repository has proper permissions for the GitHub token
- Check that the remote server is accessible

### File Extraction Issues
- Verify that the `adm-zip` dependency is properly installed
- Check that the `vega/` folder has write permissions

### HTML Generation Issues
- Ensure Docker is available and running
- Check that the PHP server is responding on the correct port
- Verify that PHP files in `vega/` are accessible via HTTP
- Check that the `www/` folder has write permissions

### Docker Issues
- Ensure Docker daemon is running
- Check that port 8080 is not already in use
- Verify that the `docker-compose.html.yml` file is present
