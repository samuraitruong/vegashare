#!/usr/bin/env node

// Test script to verify vega path calculation
import { join } from 'path';

function getVegaPath() {
  // In GitHub Actions: process.cwd() is /home/runner/work/vegashare/cli/vega-cli
  // In local dev: process.cwd() is /Users/truongnguyen/source/vegashare/cli/vega-cli
  // We want the vega folder at the repository root
  const vegaPath = join(process.cwd(), '..', '..', 'vega');
  console.log(`🔍 Current working directory: ${process.cwd()}`);
  console.log(`🔍 Calculated vega path: ${vegaPath}`);
  return vegaPath;
}

console.log('🧪 Testing vega path calculation...');
const vegaPath = getVegaPath();

// Test if the path exists
import { stat } from 'fs/promises';
stat(vegaPath).then(() => {
  console.log(`✅ Vega directory exists: ${vegaPath}`);
}).catch((error) => {
  console.log(`❌ Vega directory does not exist: ${vegaPath}`);
  console.log(`   Error: ${error.message}`);
});
