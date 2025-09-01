const axios = require('axios');

async function testAndPopulate() {
  console.log('Testing location analysis and populating cache...\n');
  
  // Test locations (you can change these to your area)
  const locations = [
    { lat: 25.0330, lng: 121.5654, name: 'Taipei 101 Area' },
    { lat: 25.0478, lng: 121.5170, name: 'Ximending' },
    { lat: 25.0375, lng: 121.5637, name: 'Xinyi District' },
  ];
  
  for (const loc of locations) {
    try {
      console.log(`Analyzing ${loc.name}...`);
      const response = await axios.post('http://localhost:3001/api/vibe/analyze', {
        lat: loc.lat,
        lng: loc.lng,
        radius: 500
      });
      
      if (response.data.success) {
        console.log(`✓ Success: Score ${response.data.vibe?.score}/10`);
        console.log(`  Tags: ${response.data.vibe?.hashtags?.join(', ')}\n`);
      }
    } catch (error) {
      console.log(`✗ Failed: ${error.message}\n`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Now test similar locations
  console.log('\nTesting similar locations search...');
  try {
    const response = await axios.post('http://localhost:3001/api/vibe/similar', {
      hashtags: ['#BusyArea', '#UrbanHub'],
      currentLocation: { lat: 25.0330, lng: 121.5654 },
      limit: 5
    });
    
    console.log('Similar locations found:', response.data.similarLocations?.length || 0);
    response.data.similarLocations?.forEach((loc, i) => {
      console.log(`${i+1}. ${loc.name || 'No name'} - ${loc.district || 'No district'}`);
    });
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAndPopulate().catch(console.error);
