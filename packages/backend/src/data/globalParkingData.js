/**
 * Global parking data for demonstration purposes
 * Includes major cities worldwide with recognizable landmarks
 */

const globalParkingData = {
  'new-york': {
    city: 'New York',
    country: 'USA',
    currency: 'USD',
    locale: 'en-US',
    center: { lat: 40.7128, lng: -74.0060 },
    spots: [
      // Times Square area
      { id: 'nyc-001', name: 'Times Square Garage', lat: 40.7580, lng: -73.9855, available: true, price: 45, type: 'garage', features: ['covered', 'security'] },
      { id: 'nyc-002', name: 'Broadway Theater Parking', lat: 40.7590, lng: -73.9845, available: true, price: 50, type: 'garage', features: ['covered', 'valet'] },
      { id: 'nyc-003', name: '42nd Street Parking', lat: 40.7565, lng: -73.9865, available: false, price: 35, type: 'street', features: [] },
      
      // Central Park area
      { id: 'nyc-004', name: 'Central Park West Parking', lat: 40.7829, lng: -73.9654, available: true, price: 40, type: 'garage', features: ['covered'] },
      { id: 'nyc-005', name: 'Columbus Circle Parking', lat: 40.7680, lng: -73.9819, available: true, price: 42, type: 'garage', features: ['covered', 'ev_charging'] },
      
      // Wall Street area
      { id: 'nyc-006', name: 'Wall Street Garage', lat: 40.7074, lng: -74.0113, available: true, price: 55, type: 'garage', features: ['covered', 'security'] },
      { id: 'nyc-007', name: 'Battery Park Parking', lat: 40.7033, lng: -74.0170, available: false, price: 38, type: 'lot', features: [] },
      
      // Brooklyn Bridge area
      { id: 'nyc-008', name: 'Brooklyn Bridge Parking', lat: 40.7061, lng: -73.9969, available: true, price: 35, type: 'lot', features: [] },
      { id: 'nyc-009', name: 'DUMBO Parking', lat: 40.7033, lng: -73.9881, available: true, price: 30, type: 'street', features: [] },
      
      // Empire State Building area
      { id: 'nyc-010', name: 'Empire State Building Garage', lat: 40.7484, lng: -73.9857, available: true, price: 48, type: 'garage', features: ['covered', 'security', 'ev_charging'] }
    ]
  },
  
  'london': {
    city: 'London',
    country: 'UK',
    currency: 'GBP',
    locale: 'en-GB',
    center: { lat: 51.5074, lng: -0.1278 },
    spots: [
      // Westminster area
      { id: 'lon-001', name: 'Westminster Car Park', lat: 51.5007, lng: -0.1246, available: true, price: 35, type: 'garage', features: ['covered'] },
      { id: 'lon-002', name: 'Big Ben Street Parking', lat: 51.5007, lng: -0.1246, available: false, price: 25, type: 'street', features: [] },
      { id: 'lon-003', name: 'Parliament Square Parking', lat: 51.5005, lng: -0.1254, available: true, price: 40, type: 'garage', features: ['covered', 'security'] },
      
      // Tower Bridge area
      { id: 'lon-004', name: 'Tower Bridge Car Park', lat: 51.5055, lng: -0.0754, available: true, price: 30, type: 'garage', features: ['covered'] },
      { id: 'lon-005', name: 'Tower of London Parking', lat: 51.5081, lng: -0.0759, available: true, price: 32, type: 'lot', features: ['security'] },
      
      // Covent Garden area
      { id: 'lon-006', name: 'Covent Garden Car Park', lat: 51.5117, lng: -0.1230, available: true, price: 38, type: 'garage', features: ['covered', 'ev_charging'] },
      { id: 'lon-007', name: 'Leicester Square Parking', lat: 51.5103, lng: -0.1307, available: false, price: 36, type: 'garage', features: ['covered'] },
      
      // Hyde Park area
      { id: 'lon-008', name: 'Hyde Park Corner Parking', lat: 51.5028, lng: -0.1519, available: true, price: 42, type: 'garage', features: ['covered', 'valet'] },
      { id: 'lon-009', name: 'Marble Arch Car Park', lat: 51.5133, lng: -0.1588, available: true, price: 40, type: 'garage', features: ['covered'] },
      
      // London Eye area
      { id: 'lon-010', name: 'London Eye Car Park', lat: 51.5033, lng: -0.1195, available: true, price: 35, type: 'lot', features: [] }
    ]
  },
  
  'tokyo': {
    city: 'Tokyo',
    country: 'Japan',
    currency: 'JPY',
    locale: 'ja-JP',
    center: { lat: 35.6762, lng: 139.6503 },
    spots: [
      // Shibuya area
      { id: 'tky-001', name: 'Shibuya Crossing Parking', lat: 35.6595, lng: 139.7004, available: true, price: 3000, type: 'garage', features: ['covered', 'security'] },
      { id: 'tky-002', name: 'Shibuya Station Parking', lat: 35.6580, lng: 139.7016, available: false, price: 2800, type: 'garage', features: ['covered'] },
      
      // Tokyo Tower area
      { id: 'tky-003', name: 'Tokyo Tower Parking', lat: 35.6586, lng: 139.7454, available: true, price: 2500, type: 'lot', features: [] },
      { id: 'tky-004', name: 'Roppongi Hills Parking', lat: 35.6605, lng: 139.7292, available: true, price: 3500, type: 'garage', features: ['covered', 'valet', 'ev_charging'] },
      
      // Ginza area
      { id: 'tky-005', name: 'Ginza Six Parking', lat: 35.6695, lng: 139.7637, available: true, price: 4000, type: 'garage', features: ['covered', 'security'] },
      { id: 'tky-006', name: 'Ginza Station Parking', lat: 35.6719, lng: 139.7650, available: true, price: 3800, type: 'garage', features: ['covered'] },
      
      // Asakusa area
      { id: 'tky-007', name: 'Sensoji Temple Parking', lat: 35.7148, lng: 139.7967, available: false, price: 2000, type: 'lot', features: [] },
      { id: 'tky-008', name: 'Asakusa Station Parking', lat: 35.7101, lng: 139.7981, available: true, price: 2200, type: 'garage', features: ['covered'] },
      
      // Shinjuku area
      { id: 'tky-009', name: 'Shinjuku Station South Parking', lat: 35.6896, lng: 139.7006, available: true, price: 3200, type: 'garage', features: ['covered', 'ev_charging'] },
      { id: 'tky-010', name: 'Kabukicho Parking', lat: 35.6938, lng: 139.7034, available: true, price: 2800, type: 'garage', features: ['covered'] }
    ]
  },
  
  'paris': {
    city: 'Paris',
    country: 'France',
    currency: 'EUR',
    locale: 'fr-FR',
    center: { lat: 48.8566, lng: 2.3522 },
    spots: [
      // Eiffel Tower area
      { id: 'par-001', name: 'Tour Eiffel Parking', lat: 48.8584, lng: 2.2945, available: true, price: 40, type: 'garage', features: ['covered'] },
      { id: 'par-002', name: 'Trocadéro Parking', lat: 48.8620, lng: 2.2873, available: true, price: 38, type: 'garage', features: ['covered', 'security'] },
      
      // Champs-Élysées area
      { id: 'par-003', name: 'Champs-Élysées Parking', lat: 48.8698, lng: 2.3078, available: false, price: 45, type: 'garage', features: ['covered', 'valet'] },
      { id: 'par-004', name: 'Arc de Triomphe Parking', lat: 48.8738, lng: 2.2950, available: true, price: 42, type: 'garage', features: ['covered'] },
      
      // Louvre area
      { id: 'par-005', name: 'Louvre Museum Parking', lat: 48.8606, lng: 2.3376, available: true, price: 35, type: 'garage', features: ['covered', 'security'] },
      { id: 'par-006', name: 'Palais Royal Parking', lat: 48.8634, lng: 2.3375, available: true, price: 33, type: 'garage', features: ['covered'] },
      
      // Notre-Dame area
      { id: 'par-007', name: 'Notre-Dame Parking', lat: 48.8530, lng: 2.3499, available: true, price: 30, type: 'lot', features: [] },
      { id: 'par-008', name: 'Île de la Cité Parking', lat: 48.8556, lng: 2.3472, available: false, price: 32, type: 'garage', features: ['covered'] },
      
      // Montmartre area
      { id: 'par-009', name: 'Sacré-Cœur Parking', lat: 48.8867, lng: 2.3431, available: true, price: 28, type: 'lot', features: [] },
      { id: 'par-010', name: 'Place du Tertre Parking', lat: 48.8865, lng: 2.3406, available: true, price: 30, type: 'street', features: [] }
    ]
  },
  
  'san-francisco': {
    city: 'San Francisco',
    country: 'USA',
    currency: 'USD',
    locale: 'en-US',
    center: { lat: 37.7749, lng: -122.4194 },
    spots: [
      // Golden Gate area
      { id: 'sf-001', name: 'Golden Gate Bridge Vista Parking', lat: 37.8324, lng: -122.4795, available: true, price: 25, type: 'lot', features: [] },
      { id: 'sf-002', name: 'Crissy Field Parking', lat: 37.8036, lng: -122.4550, available: true, price: 20, type: 'lot', features: [] },
      
      // Fisherman's Wharf area
      { id: 'sf-003', name: "Fisherman's Wharf Garage", lat: 37.8080, lng: -122.4177, available: false, price: 35, type: 'garage', features: ['covered'] },
      { id: 'sf-004', name: 'Pier 39 Parking', lat: 37.8087, lng: -122.4098, available: true, price: 40, type: 'garage', features: ['covered', 'security'] },
      
      // Union Square area
      { id: 'sf-005', name: 'Union Square Garage', lat: 37.7879, lng: -122.4074, available: true, price: 45, type: 'garage', features: ['covered', 'valet'] },
      { id: 'sf-006', name: 'Sutter-Stockton Garage', lat: 37.7896, lng: -122.4067, available: true, price: 42, type: 'garage', features: ['covered', 'ev_charging'] },
      
      // Financial District
      { id: 'sf-007', name: 'Embarcadero Center Parking', lat: 37.7951, lng: -122.3985, available: true, price: 48, type: 'garage', features: ['covered', 'security'] },
      { id: 'sf-008', name: 'Ferry Building Parking', lat: 37.7955, lng: -122.3937, available: false, price: 38, type: 'lot', features: [] },
      
      // Mission District
      { id: 'sf-009', name: 'Mission Dolores Parking', lat: 37.7642, lng: -122.4266, available: true, price: 25, type: 'street', features: [] },
      { id: 'sf-010', name: '16th Street BART Parking', lat: 37.7648, lng: -122.4198, available: true, price: 30, type: 'garage', features: ['covered'] }
    ]
  },
  
  'taipei': {
    city: 'Taipei',
    country: 'Taiwan',
    currency: 'TWD',
    locale: 'zh-TW',
    center: { lat: 25.0330, lng: 121.5654 },
    spots: [
      // Taipei 101 area
      { id: 'tpe-001', name: 'Taipei 101 B1 Parking', lat: 25.0339, lng: 121.5645, available: true, price: 60, type: 'garage', features: ['covered', 'ev_charging'] },
      { id: 'tpe-002', name: 'Taipei 101 B2 Parking', lat: 25.0341, lng: 121.5643, available: true, price: 60, type: 'garage', features: ['covered'] },
      { id: 'tpe-003', name: 'Xinyi Road Street Parking', lat: 25.0335, lng: 121.5650, available: false, price: 30, type: 'street', features: [] },
      
      // Taipei City Hall
      { id: 'tpe-004', name: 'City Hall Underground Parking', lat: 25.0375, lng: 121.5637, available: true, price: 50, type: 'garage', features: ['covered', 'security'] },
      { id: 'tpe-005', name: 'Keelung Road Parking Lot', lat: 25.0380, lng: 121.5640, available: true, price: 35, type: 'lot', features: [] },
      
      // Xinyi District
      { id: 'tpe-006', name: 'Breeze Center Parking', lat: 25.0395, lng: 121.5625, available: true, price: 55, type: 'garage', features: ['covered', 'ev_charging'] },
      { id: 'tpe-007', name: 'Songshan Cultural Park Parking', lat: 25.0435, lng: 121.5605, available: true, price: 45, type: 'lot', features: ['security'] },
      
      // World Trade Center area
      { id: 'tpe-008', name: 'World Trade Center Parking', lat: 25.0330, lng: 121.5610, available: true, price: 60, type: 'garage', features: ['covered', 'security', 'ev_charging'] },
      { id: 'tpe-009', name: 'Taipei Medical University Parking', lat: 25.0265, lng: 121.5615, available: true, price: 40, type: 'garage', features: ['covered'] },
      { id: 'tpe-010', name: 'Taipei Nanshan Plaza Parking', lat: 25.0338, lng: 121.5668, available: true, price: 70, type: 'garage', features: ['covered', 'security', 'ev_charging', 'valet'] }
    ]
  }
};

/**
 * Get parking data for a specific city
 * @param {string} cityKey - The city key (e.g., 'new-york', 'london')
 * @returns {Object|null} City parking data or null if not found
 */
function getCityData(cityKey) {
  return globalParkingData[cityKey] || null;
}

/**
 * Get all available cities
 * @returns {Array} Array of city objects with key and display name
 */
function getAvailableCities() {
  return Object.keys(globalParkingData).map(key => ({
    key,
    name: globalParkingData[key].city,
    country: globalParkingData[key].country,
    center: globalParkingData[key].center
  }));
}

/**
 * Find nearest city based on coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Key of the nearest city
 */
function getNearestCity(lat, lng) {
  let nearestCity = 'new-york'; // Default fallback
  let minDistance = Infinity;
  
  for (const [key, cityData] of Object.entries(globalParkingData)) {
    const distance = calculateDistance(
      lat, lng,
      cityData.center.lat, cityData.center.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = key;
    }
  }
  
  return nearestCity;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  globalParkingData,
  getCityData,
  getAvailableCities,
  getNearestCity
};
