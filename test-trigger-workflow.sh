#!/bin/bash

# Test script for the trigger workflow
# This script demonstrates how to manually trigger workflows

echo "🚀 Testing Trigger Workflow System"
echo "=================================="

echo ""
echo "📋 Available workflows:"
echo "1. Auto Sync (auto-sync.yml) - Syncs files from remote source"
echo "2. HTML Sync (sync-html.yml) - Converts PHP to HTML"
echo "3. Trigger Sync (trigger-sync.yml) - Smart trigger system"
echo "4. Test Sync (test-sync.yml) - Test with custom parameters"

echo ""
echo "🔧 How to use:"
echo "1. Go to GitHub Actions tab in your repository"
echo "2. Select 'Trigger Sync Workflows'"
echo "3. Click 'Run workflow'"
echo "4. Choose options:"
echo "   - trigger_type: auto, html, or both"
echo "   - force_trigger: true/false"

echo ""
echo "💡 Workflow Chain:"
echo "Auto Sync → (if changes) → HTML Sync → (if changes) → Commit"
echo ""
echo "🎯 Manual Triggers:"
echo "- Use 'Trigger Sync' to check for changes and trigger appropriate workflows"
echo "- Use 'Test Sync' to test with custom time windows"
echo "- Use 'Auto Sync' to force a sync regardless of schedule"

echo ""
echo "✅ All workflows now use 'docker compose' (not 'docker-compose')"
echo "✅ Auto-sync automatically triggers HTML-sync when changes are detected"
echo "✅ Trigger workflow provides intelligent workflow management"
