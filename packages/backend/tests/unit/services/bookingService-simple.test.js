// Simplified BookingService tests without external dependencies
const bookingService = require('../../../src/services/bookingService');

// Mock dependencies
jest.mock('../../../src/services/firebaseService', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
      add: jest.fn(),
    })),
  })),
}));

describe('BookingService - Simplified Tests', () => {
  let mockBookingData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockBookingData = {
      userId: 'user-123',
      spotId: 'spot-456',
      startTime: new Date('2025-01-10T10:00:00'),
      duration: 2,
      vehicleType: 'car',
      licensePlate: 'ABC123',
    };
  });

  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
      const result = await bookingService.createBooking(mockBookingData);

      expect(result).toMatchObject({
        userId: mockBookingData.userId,
        spotId: mockBookingData.spotId,
        status: 'confirmed',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('totalPrice');
    });

    it('should throw error when required fields are missing', async () => {
      const invalidData = {
        userId: 'user-123',
        // Missing spotId and other required fields
      };

      await expect(bookingService.createBooking(invalidData))
        .rejects
        .toThrow('Missing required booking information');
    });

    it('should calculate correct price based on duration', async () => {
      const testCases = [
        { duration: 1, expectedPrice: 5.00 },
        { duration: 2, expectedPrice: 10.00 },
        { duration: 24, expectedPrice: 100.00 }, // Daily max
      ];

      for (const testCase of testCases) {
        const booking = {
          ...mockBookingData,
          duration: testCase.duration,
        };

        const result = await bookingService.createBooking(booking);
        expect(result.totalPrice).toBe(testCase.expectedPrice);
      }
    });
  });

  describe('cancelBooking', () => {
    it('should cancel an existing booking', async () => {
      const bookingId = 'booking-789';
      const userId = 'user-123';

      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result).toMatchObject({
        id: bookingId,
        status: 'cancelled',
        cancelledAt: expect.any(Date),
      });
    });

    it('should throw error when booking not found', async () => {
      const nonExistentId = 'non-existent';
      const userId = 'user-123';

      await expect(bookingService.cancelBooking(nonExistentId, userId))
        .rejects
        .toThrow('Booking not found');
    });
  });

  describe('checkAvailability', () => {
    it('should return true for available time slot', async () => {
      const spotId = 'spot-123';
      const startTime = new Date('2025-01-15T14:00:00');
      const duration = 2;

      const isAvailable = await bookingService.checkAvailability(spotId, startTime, duration);

      expect(isAvailable).toBe(true);
    });
  });
});
