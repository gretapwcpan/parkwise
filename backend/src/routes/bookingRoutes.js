const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const notificationService = require('../services/notificationService');

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { spotId, userId, startTime, endTime } = req.body;
    
    const result = await bookingService.createBooking({
      spotId,
      userId,
      startTime,
      endTime,
    });
    
    if (result.success) {
      // Send confirmation notification
      await notificationService.sendBookingConfirmation(userId, result.booking);
      
      // Schedule reminder notification
      notificationService.scheduleNotification(userId, result.booking);
      
      res.status(201).json(result);
    } else {
      // Send unavailable notification with alternative
      await notificationService.sendSpotUnavailable(
        userId,
        { startTime, endTime },
        result.alternative
      );
      
      res.status(409).json(result); // 409 Conflict
    }
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await bookingService.getUserBookings(userId);
    res.json({ bookings });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check availability for a spot
router.get('/availability/:spotId', async (req, res) => {
  try {
    const { spotId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    const slots = await bookingService.checkAvailability(spotId, date);
    res.json({ slots });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.put('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.body;
    
    const booking = await bookingService.cancelBooking(bookingId, userId);
    res.json({ booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Admin routes
// Get pending bookings
router.get('/admin/pending', async (req, res) => {
  try {
    const bookings = await bookingService.getPendingBookings();
    res.json({ bookings });
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve booking
router.put('/admin/:bookingId/approve', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await bookingService.approveBooking(bookingId);
    
    // Send approval notification
    await notificationService.sendBookingApproval(booking.userId, booking);
    
    res.json({ booking });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reject booking
router.put('/admin/:bookingId/reject', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    
    const booking = await bookingService.rejectBooking(bookingId, reason);
    
    // Send rejection notification
    await notificationService.sendBookingRejection(booking.userId, booking, reason);
    
    res.json({ booking });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
