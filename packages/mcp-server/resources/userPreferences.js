import axios from 'axios';

/**
 * Get user parking preferences
 * @param {Object} config - Server configuration
 * @returns {Object} MCP resource response
 */
export async function getUserPreferences(config) {
  const { BACKEND_URL } = config;
  
  try {
    // Note: In a real implementation, userId would come from authentication
    const userId = 'mcp-user-default';
    
    // Fetch user preferences from backend
    const response = await axios.get(
      `${BACKEND_URL}/api/users/${userId}/preferences`,
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const preferences = response.data || {};

    // Format preferences data
    const formattedPreferences = {
      userId: userId,
      parkingPreferences: {
        preferredFeatures: preferences.preferredFeatures || [
          'covered',
          'security cameras',
          'well-lit'
        ],
        maxPricePerHour: preferences.maxPricePerHour || 10,
        maxWalkingDistance: preferences.maxWalkingDistance || 500, // meters
        vehicleType: preferences.vehicleType || 'sedan',
        requiresHandicapAccess: preferences.requiresHandicapAccess || false,
        requiresEVCharging: preferences.requiresEVCharging || false,
      },
      favoriteLocations: preferences.favoriteLocations || [
        {
          name: 'Office',
          address: 'Downtown Business District',
          coordinates: { lat: 25.0330, lng: 121.5654 },
        },
        {
          name: 'Home',
          address: 'Residential Area',
          coordinates: { lat: 25.0478, lng: 121.5318 },
        }
      ],
      bookingDefaults: {
        defaultDuration: preferences.defaultDuration || 2, // hours
        preferredStartTime: preferences.preferredStartTime || '09:00',
        autoExtend: preferences.autoExtend || false,
        sendReminders: preferences.sendReminders || true,
        reminderMinutesBefore: preferences.reminderMinutesBefore || 30,
      },
      paymentPreferences: {
        defaultPaymentMethod: preferences.defaultPaymentMethod || 'credit_card',
        autoPayEnabled: preferences.autoPayEnabled || true,
        monthlyBudget: preferences.monthlyBudget || 200,
      },
      notificationSettings: {
        emailNotifications: preferences.emailNotifications || true,
        smsNotifications: preferences.smsNotifications || false,
        pushNotifications: preferences.pushNotifications || true,
        notifyOnAvailability: preferences.notifyOnAvailability || true,
        notifyOnPriceDrops: preferences.notifyOnPriceDrops || true,
      },
      searchHistory: preferences.searchHistory || [
        'Taipei 101',
        'National Taiwan University',
        'Xinyi District',
      ],
      lastUpdated: preferences.lastUpdated || new Date().toISOString(),
    };

    return {
      contents: [
        {
          uri: 'parking://user/preferences',
          mimeType: 'application/json',
          text: JSON.stringify(formattedPreferences, null, 2),
        },
      ],
    };

  } catch (error) {
    console.error('Get user preferences error:', error);

    // Return default preferences if backend call fails
    const defaultPreferences = {
      userId: 'mcp-user-default',
      parkingPreferences: {
        preferredFeatures: ['covered', 'security cameras'],
        maxPricePerHour: 10,
        maxWalkingDistance: 500,
        vehicleType: 'sedan',
        requiresHandicapAccess: false,
        requiresEVCharging: false,
      },
      favoriteLocations: [],
      bookingDefaults: {
        defaultDuration: 2,
        preferredStartTime: '09:00',
        autoExtend: false,
        sendReminders: true,
        reminderMinutesBefore: 30,
      },
      paymentPreferences: {
        defaultPaymentMethod: 'credit_card',
        autoPayEnabled: false,
        monthlyBudget: 200,
      },
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        notifyOnAvailability: true,
        notifyOnPriceDrops: false,
      },
      searchHistory: [],
      lastUpdated: new Date().toISOString(),
      error: 'Using default preferences - backend unavailable',
    };

    return {
      contents: [
        {
          uri: 'parking://user/preferences',
          mimeType: 'application/json',
          text: JSON.stringify(defaultPreferences, null, 2),
        },
      ],
    };
  }
}
