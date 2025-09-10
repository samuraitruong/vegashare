# GitHub Workflows

This directory contains GitHub Actions workflows for automated file synchronization.

## Workflows

### 1. Auto Sync (`auto-sync.yml`)

**Purpose**: Automatically sync files from the remote server every minute.

**Schedule**: Runs every minute (`* * * * *`)

**Functionality**:
- Checks for files changed in the last 5 minutes (300 seconds)
- Downloads and extracts changed files to the `vega/` folder
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
- Useful for testing with different time ranges
- Can be used to sync files from longer time periods

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
- Synced files are placed in the `vega/` folder at the repository root
- Files maintain their original directory structure from the remote server
- Only PHP files from `www*` folders are synced (excluding `index.php`)

### CLI Installation
The workflows use `npm link` to make the `vega-cli` command globally available:
```bash
cd cli/vega-cli
npm link
```
This allows the workflows to use `vega-cli` directly instead of `./index.js`.

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
