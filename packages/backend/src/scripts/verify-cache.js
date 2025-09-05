const axios = require('axios');

async function verifyCache() {
  console.log('=================================');
  console.log('Cache Verification Test');
  console.log('=================================\n');
  
  // Step 1: Check cache statistics
  console.log('1. Checking cache statistics...');
  try {
    const statsResponse = await axios.get('http://localhost:3001/api/vibe/cache/stats');
    console.log(`   ✓ Cache contains ${statsResponse.data.stats.totalLocations} locations\n`);
  } catch (error) {
    console.log(`   ✗ Failed to get cache stats: ${error.message}\n`);
  }
  
  // Step 2: Analyze a test location to populate cache
  console.log('2. Analyzing a test location...');
  const testLocation = { lat: 25.0330, lng: 121.5654 }; // Taipei 101
  try {
    const analyzeResponse = await axios.post('http://localhost:3001/api/vibe/analyze', {
      lat: testLocation.lat,
      lng: testLocation.lng,
      radius: 500
    });
    
    if (analyzeResponse.data.success) {
      console.log(`   ✓ Location analyzed successfully`);
      console.log(`   - Vibe Score: ${analyzeResponse.data.vibe?.score}/10`);
      console.log(`   - Hashtags: ${analyzeResponse.data.vibe?.hashtags?.join(', ')}\n`);
    }
  } catch (error) {
    console.log(`   ✗ Failed to analyze location: ${error.message}\n`);
    return;
  }
  
  // Step 3: Search for similar locations
  console.log('3. Testing Similar Locations feature...');
  try {
    const similarResponse = await axios.post('http://localhost:3001/api/vibe/similar', {
      hashtags: ['#BusyArea', '#UrbanHub'],
      currentLocation: testLocation,
      limit: 5
    });
    
    if (similarResponse.data.success) {
      const locations = similarResponse.data.similarLocations || [];
      console.log(`   ✓ Found ${locations.length} similar locations:\n`);
      
      if (locations.length === 0) {
        console.log('   ⚠️  No similar locations found. Cache may be empty.');
        console.log('   → Run "node src/scripts/populateCache.js" to populate cache\n');
      } else {
        locations.forEach((loc, i) => {
          console.log(`   ${i+1}. Location Info:`);
          console.log(`      - Name: ${loc.name || '❌ MISSING'}`);
          console.log(`      - District: ${loc.district || '❌ MISSING'}`);
          console.log(`      - Area: ${loc.area || '❌ MISSING'}`);
          console.log(`      - Score: ${loc.score || 0}/10`);
          console.log(`      - Matches: ${loc.matchCount || 0}`);
          
          // Check if location names are properly populated
          if (!loc.name && !loc.district && !loc.area) {
            console.log(`      ❌ ERROR: No location names found!`);
          } else {
            console.log(`      ✓ Location names properly populated`);
          }
          console.log('');
        });
      }
    }
  } catch (error) {
    console.log(`   ✗ Failed to find similar locations: ${error.message}\n`);
  }
  
  // Step 4: Final verification
  console.log('=================================');
  console.log('Verification Summary:');
  console.log('=================================');
  
  try {
    const finalStats = await axios.get('http://localhost:3001/api/vibe/cache/stats');
    const cacheSize = finalStats.data.stats.totalLocations;
    
    if (cacheSize > 0) {
      console.log(`✓ Cache is working! Contains ${cacheSize} location(s)`);
      console.log('\nTo see real location names in the app:');
      console.log('1. Open http://localhost:3000');
      console.log('2. Click "Analyze Location Vibe"');
      console.log('3. Click on any hashtag');
      console.log('4. You should see real location names!\n');
    } else {
      console.log('⚠️  Cache is empty!');
      console.log('\nTo populate the cache:');
      console.log('1. Run: node src/scripts/populateCache.js');
      console.log('2. Or analyze multiple locations in the app\n');
    }
  } catch (error) {
    console.log('✗ Could not verify cache status\n');
  }
}

// Run the verification
verifyCache().catch(error => {
  console.error('Verification failed:', error.message);
  console.log('\nMake sure the backend is running:');
  console.log('cd backend && npm run dev');
});
