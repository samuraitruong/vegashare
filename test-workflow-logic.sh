#!/bin/bash

echo "🧪 Testing workflow logic for sync-html with JSON generation..."

# Simulate the sync-html output with folder list
echo "🔄 Converting PHP files to HTML..."
OUTPUT="🔄 Starting HTML sync process...
📁 Reading PHP files from: /path/to/vega
📁 Output HTML files to: /path/to/www
🌐 PHP server URL: http://localhost:8080
✅ Vega directory found: /path/to/vega
🔍 Scanning for PHP files...
📄 Found 25 PHP files to process
✅ Generated: /path/to/www/www2025BestintheWest/crosstable.html
✅ Generated: /path/to/www/www2025BestintheWest/standings.html
📁 HTML files written to: /path/to/www
📂 Processed folders: www2025BestintheWest

📋 FOLDERS_PROCESSED: [\"www2025BestintheWest\"]"

echo "$OUTPUT"

# Extract folder list from output (same logic as workflow)
FOLDERS=$(echo "$OUTPUT" | grep "📋 FOLDERS_PROCESSED:" | sed 's/.*📋 FOLDERS_PROCESSED: //' || echo "[]")
echo "📂 Extracted folders: $FOLDERS"

# Test JSON processing logic
echo "🔄 Generating JSON data from HTML files..."
echo "📂 Processing folders: $FOLDERS"

# Parse JSON array and process each folder
echo "$FOLDERS" | jq -r '.[]' | while read folder; do
  if [ -n "$folder" ] && [ "$folder" != "null" ]; then
    echo "🔄 Processing folder: $folder"
    if [ -d "www/$folder" ]; then
      echo "✅ Would run: vega-cli html-to-json --input www/$folder --verbose"
      echo "✅ Generated JSON for folder: $folder"
    else
      echo "⚠️  Folder not found: www/$folder"
    fi
  fi
done

echo "✅ JSON generation completed"
