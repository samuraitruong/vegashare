#!/bin/bash

# Test script to verify the new workflow approach
# This simulates what the GitHub workflow will do with Node.js v22 and pnpm v10

set -e

echo "🧪 Testing new workflow approach (Node.js v22 + pnpm v10)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
node --version

# Check pnpm version
echo "🔍 Checking pnpm version..."
pnpm --version

# Install dependencies at root level (simulate workflow)
echo "📦 Installing dependencies at root level..."
pnpm install

# Link CLI using the new script
echo "🔗 Linking CLI using pnpm run link-all..."
pnpm run link-all

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
echo "🎉 New workflow approach test completed successfully!"
echo "💡 The GitHub workflow now uses:"
echo "   - Node.js v22"
echo "   - pnpm v10 with action v4"
echo "   - Root-level pnpm install"
echo "   - pnpm run link-all command"
