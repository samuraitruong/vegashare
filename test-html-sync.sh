#!/bin/bash

# Test script to verify HTML sync functionality
# This simulates what the GitHub workflow will do

set -e

echo "🧪 Testing HTML sync functionality..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not running"
    echo "💡 Please install Docker and start the Docker daemon"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    echo "💡 Please install docker-compose"
    exit 1
fi

# Install dependencies and link CLI
echo "📦 Installing dependencies and linking CLI..."
pnpm install
pnpm run link-all

# Check if vega directory exists and has PHP files
if [ ! -d "vega" ]; then
    echo "❌ Error: vega directory not found"
    echo "💡 Please run the check-update command first to populate the vega directory"
    exit 1
fi

# Count PHP files in vega directory
php_count=$(find vega -name "*.php" | wc -l)
if [ "$php_count" -eq 0 ]; then
    echo "❌ Error: No PHP files found in vega directory"
    echo "💡 Please run: vega-cli check-update --extract --url 'https://vegaftp.free.nf/?i=1&seconds=10000'"
    exit 1
fi

echo "✅ Found $php_count PHP files in vega directory"

# Start PHP server
echo "🐳 Starting PHP server..."
pnpm run php:up

# Wait for server to be ready
echo "⏳ Waiting for PHP server to be ready..."
sleep 10

# Check if server is responding
for i in {1..30}; do
    if curl -f http://localhost:8080/server/index.php > /dev/null 2>&1; then
        echo "✅ PHP server is ready!"
        break
    fi
    echo "Waiting for PHP server... ($i/30)"
    sleep 2
done

# Test the sync-html command
echo "🔄 Testing HTML sync..."
vega-cli sync-html --verbose

# Check if www directory was created and has HTML files
if [ -d "www" ]; then
    html_count=$(find www -name "*.html" | wc -l)
    echo "✅ Generated $html_count HTML files in www directory"
    
    # Show some example files
    echo "📄 Example generated files:"
    find www -name "*.html" | head -5 | while read file; do
        echo "  - $file"
    done
else
    echo "❌ www directory was not created"
fi

# Stop PHP server
echo "🛑 Stopping PHP server..."
pnpm run php:down

echo ""
echo "🎉 HTML sync test completed!"
echo "💡 The GitHub workflow will:"
echo "   1. Trigger when PHP files change in vega/"
echo "   2. Start PHP server with Docker"
echo "   3. Convert PHP files to HTML"
echo "   4. Commit HTML files to www/"
