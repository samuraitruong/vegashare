#!/bin/bash

# Auto Sync Script for GitHub Actions
# This script runs the check-update command with extract functionality

set -e  # Exit on any error

echo "🚀 Starting auto sync process..."

# Run the check-update command with extract for last 5 minutes (300 seconds)
echo "📥 Checking for files changed in the last 5 minutes..."
vega-cli check-update --extract --url "https://vegaftp.free.nf/?i=1&seconds=300"

echo "✅ Auto sync completed successfully"
