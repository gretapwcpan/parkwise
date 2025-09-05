const { fcm } = require('./firebaseService');

// In-memory storage for user FCM tokens
const userTokens = new Map();

const notificationService = {
  // Register user's FCM token
  registerToken(userId, token) {
    if (!userId || !token) {
      throw new Error('User ID and token are required');
    }
    
    userTokens.set(userId, token);
    console.log(`Registered FCM token for user ${userId}`);
    return { success: true };
  },
  
  // Unregister user's FCM token
  unregisterToken(userId) {
    userTokens.delete(userId);
    console.log(`Unregistered FCM token for user ${userId}`);
    return { success: true };
  },
  
  // Get user's FCM token
  getUserToken(userId) {
    return userTokens.get(userId);
  },
  
  // Send booking confirmation notification
  async sendBookingConfirmation(userId, booking) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Booking Confirmed';
    const body = `Your parking spot booking from ${new Date(booking.startTime).toLocaleString()} to ${new Date(booking.endTime).toLocaleString()} has been confirmed.`;
    
    const data = {
      type: 'booking_confirmation',
      bookingId: booking.id,
      spotId: booking.spotId,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  },
  
  // Send spot unavailable notification with alternative
  async sendSpotUnavailable(userId, requestedSlot, alternativeSlot) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Spot Unavailable';
    const body = `The requested time slot is taken. Alternative slot available at ${new Date(alternativeSlot.startTime).toLocaleString()}.`;
    
    const data = {
      type: 'spot_unavailable',
      requestedStart: requestedSlot.startTime,
      requestedEnd: requestedSlot.endTime,
      alternativeStart: alternativeSlot.startTime,
      alternativeEnd: alternativeSlot.endTime,
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  },
  
  // Send booking approval notification
  async sendBookingApproval(userId, booking) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Booking Approved';
    const body = `Your parking spot booking has been approved by the administrator.`;
    
    const data = {
      type: 'booking_approved',
      bookingId: booking.id,
      spotId: booking.spotId,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  },
  
  // Send booking rejection notification
  async sendBookingRejection(userId, booking, reason) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Booking Rejected';
    const body = reason || 'Your parking spot booking has been rejected by the administrator.';
    
    const data = {
      type: 'booking_rejected',
      bookingId: booking.id,
      reason: reason || 'No reason provided',
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  },
  
  // Send reminder notification
  async sendBookingReminder(userId, booking) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Booking Reminder';
    const body = `Your parking spot booking starts in 30 minutes at ${new Date(booking.startTime).toLocaleString()}.`;
    
    const data = {
      type: 'booking_reminder',
      bookingId: booking.id,
      spotId: booking.spotId,
      startTime: booking.startTime,
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  },
  
  // Send notification when user arrives at parking spot
  async sendArrivalNotification(userId, spotId) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Arrived at Parking Spot';
    const body = 'You have arrived at your booked parking spot. Enjoy your parking!';
    
    const data = {
      type: 'arrival_notification',
      spotId: spotId,
      timestamp: new Date().toISOString(),
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  },
  
  // Send broadcast notification to all users in an area
  async sendAreaBroadcast(areaId, title, body, data = {}) {
    // In a real app, you would query users in the area
    // For prototype, we'll send to all registered users
    const tokens = Array.from(userTokens.values());
    
    if (tokens.length === 0) {
      console.log('No registered tokens for broadcast');
      return { success: false, reason: 'No tokens registered' };
    }
    
    return await fcm.sendToMultiple(tokens, title, body, {
      ...data,
      type: 'area_broadcast',
      areaId,
    });
  },
  
  // Schedule a notification (for reminders)
  scheduleNotification(userId, booking, minutesBefore = 30) {
    const bookingStart = new Date(booking.startTime);
    const reminderTime = new Date(bookingStart.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();
    
    if (reminderTime <= now) {
      console.log('Reminder time has already passed');
      return;
    }
    
    const delay = reminderTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendBookingReminder(userId, booking);
    }, delay);
    
    console.log(`Scheduled reminder for user ${userId} in ${Math.round(delay / 1000 / 60)} minutes`);
  },
  
  // Test notification
  async sendTestNotification(userId) {
    const token = this.getUserToken(userId);
    if (!token) {
      console.log(`No FCM token found for user ${userId}`);
      return { success: false, reason: 'No token registered' };
    }
    
    const title = 'Test Notification';
    const body = 'This is a test notification from the Parking Space app.';
    
    const data = {
      type: 'test',
      timestamp: new Date().toISOString(),
    };
    
    return await fcm.sendToDevice(token, title, body, data);
  }
};

module.exports = notificationService;
