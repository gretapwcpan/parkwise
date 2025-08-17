const { firestore } = require('./firebaseService');

// In-memory storage for prototype (fallback if Firebase not available)
const mockBookings = new Map();
let mockBookingId = 1;

const bookingService = {
  // Create a new booking with conflict prevention
  async createBooking(bookingData) {
    const { spotId, userId, startTime, endTime } = bookingData;
    
    // Validate booking data
    if (!spotId || !userId || !startTime || !endTime) {
      throw new Error('Missing required booking information');
    }
    
    // Ensure endTime is after startTime
    if (new Date(endTime) <= new Date(startTime)) {
      throw new Error('End time must be after start time');
    }
    
    // Check for conflicts
    const hasConflict = await this.checkConflict(spotId, startTime, endTime);
    
    if (hasConflict) {
      // Find alternative slot
      const alternative = await this.findAlternativeSlot(spotId, startTime, endTime);
      return {
        success: false,
        error: 'Time slot unavailable',
        alternative,
      };
    }
    
    // Create booking
    const booking = {
      spotId,
      userId,
      startTime,
      endTime,
      status: 'pending', // pending, active, completed, cancelled
      createdAt: new Date().toISOString(),
    };
    
    // Try to save to Firebase, fallback to mock storage
    try {
      const savedBooking = await firestore.create('bookings', booking);
      return {
        success: true,
        booking: savedBooking,
      };
    } catch (error) {
      // Fallback to mock storage
      const id = `mock-${mockBookingId++}`;
      mockBookings.set(id, { id, ...booking });
      return {
        success: true,
        booking: { id, ...booking },
      };
    }
  },
  
  // Check for booking conflicts
  async checkConflict(spotId, startTime, endTime) {
    try {
      // Try Firebase first
      return await firestore.checkBookingConflict(spotId, startTime, endTime);
    } catch (error) {
      // Fallback to mock storage
      for (const booking of mockBookings.values()) {
        if (
          booking.spotId === spotId &&
          booking.status === 'active' &&
          new Date(booking.endTime) > new Date(startTime) &&
          new Date(booking.startTime) < new Date(endTime)
        ) {
          return true;
        }
      }
      return false;
    }
  },
  
  // Find next available time slot
  async findAlternativeSlot(spotId, requestedStart, requestedEnd) {
    const duration = new Date(requestedEnd) - new Date(requestedStart);
    const bookings = await this.getSpotBookings(spotId);
    
    // Sort bookings by start time
    bookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Try to find slot after requested time
    let suggestedStart = new Date(requestedStart);
    
    for (const booking of bookings) {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      // If suggested start conflicts with this booking
      if (suggestedStart < bookingEnd && suggestedStart >= bookingStart) {
        // Move suggested start to after this booking
        suggestedStart = new Date(bookingEnd);
      }
    }
    
    // Add 15 minutes buffer
    suggestedStart = new Date(suggestedStart.getTime() + 15 * 60 * 1000);
    const suggestedEnd = new Date(suggestedStart.getTime() + duration);
    
    return {
      startTime: suggestedStart.toISOString(),
      endTime: suggestedEnd.toISOString(),
      available: true,
    };
  },
  
  // Get all bookings for a spot
  async getSpotBookings(spotId) {
    try {
      return await firestore.query('bookings', [
        { field: 'spotId', operator: '==', value: spotId },
        { field: 'status', operator: 'in', value: ['pending', 'active'] },
      ]);
    } catch (error) {
      // Fallback to mock storage
      return Array.from(mockBookings.values()).filter(
        booking => booking.spotId === spotId && 
        ['pending', 'active'].includes(booking.status)
      );
    }
  },
  
  // Get user's bookings
  async getUserBookings(userId) {
    try {
      return await firestore.query('bookings', [
        { field: 'userId', operator: '==', value: userId },
      ]);
    } catch (error) {
      // Fallback to mock storage
      return Array.from(mockBookings.values()).filter(
        booking => booking.userId === userId
      );
    }
  },
  
  // Update booking status
  async updateBookingStatus(bookingId, status) {
    const validStatuses = ['pending', 'active', 'completed', 'cancelled', 'approved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid booking status');
    }
    
    try {
      return await firestore.update('bookings', bookingId, { status });
    } catch (error) {
      // Fallback to mock storage
      const booking = mockBookings.get(bookingId);
      if (booking) {
        booking.status = status;
        booking.updatedAt = new Date().toISOString();
        return booking;
      }
      throw new Error('Booking not found');
    }
  },
  
  // Cancel booking
  async cancelBooking(bookingId, userId) {
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.userId !== userId && userId !== 'admin') {
      throw new Error('Unauthorized to cancel this booking');
    }
    
    return await this.updateBookingStatus(bookingId, 'cancelled');
  },
  
  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      return await firestore.getById('bookings', bookingId);
    } catch (error) {
      // Fallback to mock storage
      return mockBookings.get(bookingId) || null;
    }
  },
  
  // Check availability for a time range
  async checkAvailability(spotId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await this.getSpotBookings(spotId);
    const dayBookings = bookings.filter(booking => {
      const bookingStart = new Date(booking.startTime);
      return bookingStart >= startOfDay && bookingStart <= endOfDay;
    });
    
    // Create availability slots (hourly for simplicity)
    const slots = [];
    for (let hour = 8; hour < 20; hour++) { // 8 AM to 8 PM
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      const isAvailable = !dayBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return bookingStart < slotEnd && bookingEnd > slotStart;
      });
      
      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: isAvailable,
      });
    }
    
    return slots;
  },
  
  // Get pending bookings for admin
  async getPendingBookings() {
    try {
      return await firestore.query('bookings', [
        { field: 'status', operator: '==', value: 'pending' },
      ]);
    } catch (error) {
      // Fallback to mock storage
      return Array.from(mockBookings.values()).filter(
        booking => booking.status === 'pending'
      );
    }
  },
  
  // Approve booking (admin)
  async approveBooking(bookingId) {
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be approved');
    }
    
    // Check if still no conflicts
    const hasConflict = await this.checkConflict(
      booking.spotId,
      booking.startTime,
      booking.endTime
    );
    
    if (hasConflict) {
      throw new Error('Booking conflicts with existing approved booking');
    }
    
    return await this.updateBookingStatus(bookingId, 'active');
  },
  
  // Reject booking (admin)
  async rejectBooking(bookingId, reason) {
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be rejected');
    }
    
    const updated = await this.updateBookingStatus(bookingId, 'rejected');
    
    // Store rejection reason
    try {
      await firestore.update('bookings', bookingId, { rejectionReason: reason });
    } catch (error) {
      // For mock storage
      if (mockBookings.has(bookingId)) {
        mockBookings.get(bookingId).rejectionReason = reason;
      }
    }
    
    return updated;
  }
};

module.exports = bookingService;
