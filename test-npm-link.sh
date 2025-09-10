#!/bin/bash

# Test script to verify npm link approach works
# This simulates what the GitHub workflow will do

set -e

echo "🧪 Testing npm link approach..."

# Check if we're in the right directory
if [ ! -f "cli/vega-cli/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies and link CLI (simulate workflow)
echo "📦 Installing dependencies and linking CLI..."
cd cli/vega-cli
pnpm install
npm link

# Go back to root
cd ../..

# Test that vega-cli is available globally
echo "🔍 Testing global vega-cli command..."
if command -v vega-cli &> /dev/null; then
    echo "✅ vega-cli is available globally"
    vega-cli --version
else
    echo "❌ vega-cli is not available globally"
    exit 1
fi

# Test the check-update command
echo "🔄 Testing check-update command..."
vega-cli check-update --help

echo ""
echo "🎉 npm link approach test completed successfully!"
echo "💡 The GitHub workflow will now use 'vega-cli' directly instead of './index.js'"
