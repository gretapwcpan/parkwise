import axios from 'axios';

/**
 * Get user's booking history
 * @param {Object} config - Server configuration
 * @returns {Object} MCP resource response
 */
export async function getBookingHistory(config) {
  const { BACKEND_URL } = config;
  
  try {
    // Note: In a real implementation, userId would come from authentication
    const userId = 'mcp-user-default';
    
    // Fetch booking history from backend
    const response = await axios.get(
      `${BACKEND_URL}/api/bookings/user/${userId}/history`,
      {
        params: {
          limit: 50,
          includeStats: true,
        },
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const history = response.data || {};
    const bookings = history.bookings || [];

    // Calculate statistics
    const stats = calculateBookingStats(bookings);

    // Format booking history data
    const formattedHistory = {
      userId: userId,
      summary: {
        totalBookings: bookings.length,
        totalSpent: stats.totalSpent,
        averageBookingDuration: stats.averageDuration,
        favoriteSpot: stats.favoriteSpot,
        mostFrequentTime: stats.mostFrequentTime,
        lastBookingDate: stats.lastBookingDate,
      },
      bookings: bookings.map(booking => ({
        bookingId: booking.id || booking.bookingId,
        spotName: booking.spotName,
        spotId: booking.spotId || booking.locationId,
        address: booking.address,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: calculateDuration(booking.startTime, booking.endTime),
        totalCost: booking.totalCost,
        status: booking.status || determineStatus(booking),
        vehicleInfo: booking.vehicleInfo || {},
        features: booking.features || [],
        rating: booking.rating,
        feedback: booking.feedback,
        createdAt: booking.createdAt,
        modifiedAt: booking.modifiedAt,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
      })),
      patterns: {
        preferredDaysOfWeek: stats.preferredDays,
        preferredTimeSlots: stats.preferredTimeSlots,
        averageMonthlyBookings: stats.monthlyAverage,
        averageMonthlyCost: stats.monthlyCostAverage,
      },
      frequentLocations: stats.frequentLocations,
      lastUpdated: new Date().toISOString(),
    };

    return {
      contents: [
        {
          uri: 'parking://user/booking-history',
          mimeType: 'application/json',
          text: JSON.stringify(formattedHistory, null, 2),
        },
      ],
    };

  } catch (error) {
    console.error('Get booking history error:', error);

    // Return sample history if backend call fails
    const sampleHistory = {
      userId: 'mcp-user-default',
      summary: {
        totalBookings: 5,
        totalSpent: 125.50,
        averageBookingDuration: 3.5,
        favoriteSpot: 'Downtown Parking Garage A',
        mostFrequentTime: '09:00-12:00',
        lastBookingDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
      bookings: [
        {
          bookingId: 'sample-001',
          spotName: 'Downtown Parking Garage A',
          spotId: 'spot-001',
          address: '123 Main St, Downtown',
          startTime: new Date(Date.now() - 86400000).toISOString(),
          endTime: new Date(Date.now() - 75600000).toISOString(),
          duration: 3,
          totalCost: 15.00,
          status: 'completed',
          vehicleInfo: { licensePlate: 'ABC-123', vehicleType: 'sedan' },
          features: ['covered', 'security cameras'],
          rating: 5,
          feedback: 'Great spot, easy access',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          bookingId: 'sample-002',
          spotName: 'Mall Parking Lot B',
          spotId: 'spot-045',
          address: '456 Shopping Ave',
          startTime: new Date(Date.now() - 259200000).toISOString(),
          endTime: new Date(Date.now() - 248400000).toISOString(),
          duration: 3,
          totalCost: 9.00,
          status: 'completed',
          vehicleInfo: { licensePlate: 'ABC-123', vehicleType: 'sedan' },
          features: ['outdoor', 'well-lit'],
          rating: 4,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
        },
      ],
      patterns: {
        preferredDaysOfWeek: ['Monday', 'Wednesday', 'Friday'],
        preferredTimeSlots: ['09:00-12:00', '14:00-17:00'],
        averageMonthlyBookings: 12,
        averageMonthlyCost: 150.00,
      },
      frequentLocations: [
        {
          spotId: 'spot-001',
          spotName: 'Downtown Parking Garage A',
          bookingCount: 8,
          lastUsed: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          spotId: 'spot-045',
          spotName: 'Mall Parking Lot B',
          bookingCount: 5,
          lastUsed: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
      lastUpdated: new Date().toISOString(),
      error: 'Using sample history - backend unavailable',
    };

    return {
      contents: [
        {
          uri: 'parking://user/booking-history',
          mimeType: 'application/json',
          text: JSON.stringify(sampleHistory, null, 2),
        },
      ],
    };
  }
}

/**
 * Calculate booking statistics
 * @param {Array} bookings - Array of booking objects
 * @returns {Object} Statistics
 */
function calculateBookingStats(bookings) {
  if (!bookings || bookings.length === 0) {
    return {
      totalSpent: 0,
      averageDuration: 0,
      favoriteSpot: null,
      mostFrequentTime: null,
      lastBookingDate: null,
      preferredDays: [],
      preferredTimeSlots: [],
      monthlyAverage: 0,
      monthlyCostAverage: 0,
      frequentLocations: [],
    };
  }

  // Calculate total spent
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

  // Calculate average duration
  const totalDuration = bookings.reduce((sum, b) => {
    return sum + calculateDuration(b.startTime, b.endTime);
  }, 0);
  const averageDuration = totalDuration / bookings.length;

  // Find favorite spot
  const spotCounts = {};
  bookings.forEach(b => {
    const spotName = b.spotName || b.locationId;
    spotCounts[spotName] = (spotCounts[spotName] || 0) + 1;
  });
  const favoriteSpot = Object.keys(spotCounts).reduce((a, b) => 
    spotCounts[a] > spotCounts[b] ? a : b
  );

  // Find most frequent time slot
  const timeSlots = {};
  bookings.forEach(b => {
    const hour = new Date(b.startTime).getHours();
    const slot = `${hour}:00-${hour + 3}:00`;
    timeSlots[slot] = (timeSlots[slot] || 0) + 1;
  });
  const mostFrequentTime = Object.keys(timeSlots).length > 0 
    ? Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b)
    : null;

  // Get last booking date
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.startTime) - new Date(a.startTime)
  );
  const lastBookingDate = sortedBookings[0]?.startTime || null;

  // Calculate preferred days
  const dayCounts = {};
  bookings.forEach(b => {
    const day = new Date(b.startTime).toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const preferredDays = Object.keys(dayCounts)
    .sort((a, b) => dayCounts[b] - dayCounts[a])
    .slice(0, 3);

  // Calculate monthly averages
  const monthlyData = {};
  bookings.forEach(b => {
    const month = new Date(b.startTime).toISOString().slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, cost: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].cost += b.totalCost || 0;
  });
  const months = Object.keys(monthlyData).length || 1;
  const monthlyAverage = bookings.length / months;
  const monthlyCostAverage = totalSpent / months;

  // Get frequent locations
  const locationData = {};
  bookings.forEach(b => {
    const spotId = b.spotId || b.locationId;
    if (!locationData[spotId]) {
      locationData[spotId] = {
        spotId: spotId,
        spotName: b.spotName,
        bookingCount: 0,
        lastUsed: b.startTime,
      };
    }
    locationData[spotId].bookingCount++;
    if (new Date(b.startTime) > new Date(locationData[spotId].lastUsed)) {
      locationData[spotId].lastUsed = b.startTime;
    }
  });
  const frequentLocations = Object.values(locationData)
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  return {
    totalSpent,
    averageDuration,
    favoriteSpot,
    mostFrequentTime,
    lastBookingDate,
    preferredDays,
    preferredTimeSlots: Object.keys(timeSlots).slice(0, 3),
    monthlyAverage,
    monthlyCostAverage,
    frequentLocations,
  };
}

/**
 * Calculate duration in hours
 * @param {string} startTime - Start time ISO string
 * @param {string} endTime - End time ISO string
 * @returns {number} Duration in hours
 */
function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end - start) / (1000 * 60 * 60);
}

/**
 * Determine booking status based on times
 * @param {Object} booking - Booking object
 * @returns {string} Status
 */
function determineStatus(booking) {
  const now = new Date();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  
  if (booking.cancelledAt) return 'cancelled';
  if (end < now) return 'completed';
  if (start <= now && end >= now) return 'active';
  if (start > now) return 'upcoming';
  return 'unknown';
}
