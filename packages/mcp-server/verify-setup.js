#!/usr/bin/env node

/**
 * Simple verification script for MCP server setup
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying MCP Server Setup\n');

// Check required files
const requiredFiles = [
  'server.js',
  'package.json',
  'node_modules/@modelcontextprotocol/sdk/package.json',
  'tools/searchParking.js',
  'tools/bookParking.js',
  'tools/getMyBookings.js',
  'tools/cancelBooking.js',
  'tools/modifyBooking.js',
  'tools/getParkingDetails.js',
  'resources/userPreferences.js',
  'resources/bookingHistory.js',
  'resources/favoriteSpots.js',
];

console.log('📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = join(__dirname, file);
  const exists = existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n📦 Package Information:');
try {
  const pkg = await import('./package.json', { assert: { type: 'json' } });
  console.log(`   Name: ${pkg.default.name}`);
  console.log(`   Version: ${pkg.default.version}`);
  console.log(`   Main: ${pkg.default.main}`);
} catch (error) {
  console.log('   ❌ Could not read package.json');
}

console.log('\n🔧 Environment Configuration:');
console.log(`   BACKEND_URL: ${process.env.BACKEND_URL || 'http://localhost:3000 (default)'}`);
console.log(`   LLM_SERVICE_URL: ${process.env.LLM_SERVICE_URL || 'http://localhost:8001 (default)'}`);

console.log('\n📋 Summary:');
if (allFilesExist) {
  console.log('   ✅ All required files are present');
  console.log('   ✅ MCP server is ready to use');
  console.log('\n📌 Next Steps:');
  console.log('   1. Copy the configuration from claude-config-example.json');
  console.log('   2. Update the path to match your project location');
  console.log('   3. Add it to Claude Desktop configuration at:');
  console.log('      ~/Library/Application Support/Claude/claude_desktop_config.json');
  console.log('   4. Restart Claude Desktop');
  console.log('\n   The parking tools will then be available in your Claude conversations!');
} else {
  console.log('   ❌ Some files are missing');
  console.log('   Run: npm install');
}

process.exit(allFilesExist ? 0 : 1);
