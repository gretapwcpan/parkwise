#!/usr/bin/env node

/**
 * Script to populate the location cache with sample locations
 * This helps demonstrate the Similar Locations feature with real data
 */

const axios = require('axios');

// Backend API URL
const API_BASE_URL = 'http://localhost:3001/api';

// Sample locations to analyze - includes both US and Taiwan locations
const sampleLocations = [
  // Taiwan locations (Taipei)
  { lat: 25.0330, lng: 121.5654, name: 'Taipei 101' },
  { lat: 25.0478, lng: 121.5170, name: 'Ximending' },
  { lat: 25.0521, lng: 121.5198, name: 'Taipei Main Station' },
  { lat: 25.0375, lng: 121.5637, name: 'Xinyi District' },
  { lat: 25.0418, lng: 121.5359, name: "Da'an District" },
  { lat: 25.0621, lng: 121.5198, name: 'Zhongshan District' },
  { lat: 25.0856, lng: 121.5615, name: 'Neihu District' },
  { lat: 25.1276, lng: 121.5025, name: 'Shilin Night Market' },
  { lat: 25.0261, lng: 121.5228, name: 'National Taiwan University' },
  { lat: 25.0408, lng: 121.5078, name: 'Longshan Temple' },
  
  // San Francisco locations (US)
  { lat: 37.7749, lng: -122.4194, name: 'Downtown SF' },
  { lat: 37.7955, lng: -122.3937, name: 'Financial District SF' },
  { lat: 37.7599, lng: -122.4148, name: 'Mission District SF' },
  { lat: 37.8044, lng: -122.2712, name: 'Oakland Downtown' },
  { lat: 37.7858, lng: -122.4065, name: 'Union Square SF' },
];

async function analyzeLocation(location) {
  try {
    console.log(`Analyzing ${location.name} at ${location.lat}, ${location.lng}...`);
    
    const response = await axios.post(`${API_BASE_URL}/vibe/analyze`, {
      lat: location.lat,
      lng: location.lng,
      radius: 500
    });
    
    if (response.data.success) {
      console.log(`✓ ${location.name} analyzed successfully`);
      console.log(`  Vibe Score: ${response.data.vibe?.score}/10`);
      console.log(`  Hashtags: ${response.data.vibe?.hashtags?.join(', ')}`);
      return true;
    } else {
      console.log(`✗ Failed to analyze ${location.name}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error analyzing ${location.name}:`, error.message);
    return false;
  }
}

async function populateCache() {
  console.log('=================================');
  console.log('Location Cache Population Script');
  console.log('=================================\n');
  
  console.log(`Will analyze ${sampleLocations.length} locations\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Analyze each location sequentially to avoid overwhelming the API
  for (const location of sampleLocations) {
    const success = await analyzeLocation(location);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=================================');
  console.log('Population Complete!');
  console.log(`✓ Success: ${successCount} locations`);
  console.log(`✗ Failed: ${failCount} locations`);
  console.log('=================================\n');
  
  if (successCount > 0) {
    console.log('The cache now contains analyzed locations.');
    console.log('When users click on hashtags in the app, they will see:');
    console.log('- Real neighborhood names from OpenStreetMap');
    console.log('- Descriptive location names like "Shopping District"');
    console.log('- Actual vibe scores and characteristics\n');
  }
}

// Main execution
async function main() {
  console.log('Starting cache population...\n');
  await populateCache();
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
