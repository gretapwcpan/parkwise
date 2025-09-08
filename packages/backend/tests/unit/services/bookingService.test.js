const bookingService = require('../../../src/services/bookingService');
const { faker } = require('@faker-js/faker');

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

describe('BookingService', () => {
  let mockBookingData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockBookingData = {
      userId: faker.string.uuid(),
      spotId: faker.string.uuid(),
      startTime: faker.date.future(),
      duration: faker.number.int({ min: 1, max: 24 }),
      vehicleType: faker.helpers.arrayElement(['car', 'motorcycle', 'truck']),
      licensePlate: faker.vehicle.vrm(),
    };
  });

  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
      const expectedBooking = {
        ...mockBookingData,
        id: faker.string.uuid(),
        status: 'confirmed',
        totalPrice: mockBookingData.duration * 5.00,
        createdAt: expect.any(Date),
      };

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
        userId: faker.string.uuid(),
        // Missing spotId and other required fields
      };

      await expect(bookingService.createBooking(invalidData))
        .rejects
        .toThrow('Missing required booking information');
    });

    it('should reject booking for unavailable spot', async () => {
      const unavailableSpotData = {
        ...mockBookingData,
        spotId: 'unavailable-spot',
      };

      await expect(bookingService.createBooking(unavailableSpotData))
        .rejects
        .toThrow('Parking spot is not available');
    });

    it('should reject overlapping bookings', async () => {
      // First booking
      await bookingService.createBooking(mockBookingData);

      // Attempt overlapping booking
      const overlappingBooking = {
        ...mockBookingData,
        userId: faker.string.uuid(), // Different user
      };

      await expect(bookingService.createBooking(overlappingBooking))
        .rejects
        .toThrow('Time slot already booked');
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
      const bookingId = faker.string.uuid();
      const userId = faker.string.uuid();

      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result).toMatchObject({
        id: bookingId,
        status: 'cancelled',
        cancelledAt: expect.any(Date),
      });
    });

    it('should throw error when booking not found', async () => {
      const nonExistentId = faker.string.uuid();
      const userId = faker.string.uuid();

      await expect(bookingService.cancelBooking(nonExistentId, userId))
        .rejects
        .toThrow('Booking not found');
    });

    it('should prevent cancellation by non-owner', async () => {
      const bookingId = faker.string.uuid();
      const wrongUserId = faker.string.uuid();

      await expect(bookingService.cancelBooking(bookingId, wrongUserId))
        .rejects
        .toThrow('Unauthorized to cancel this booking');
    });

    it('should prevent cancellation of past bookings', async () => {
      const bookingId = faker.string.uuid();
      const userId = faker.string.uuid();

      // Mock a past booking
      const pastBooking = {
        id: bookingId,
        userId,
        startTime: faker.date.past(),
        status: 'completed',
      };

      await expect(bookingService.cancelBooking(bookingId, userId))
        .rejects
        .toThrow('Cannot cancel past bookings');
    });
  });

  describe('modifyBooking', () => {
    it('should modify booking time successfully', async () => {
      const bookingId = faker.string.uuid();
      const modifications = {
        startTime: faker.date.future(),
        duration: 3,
      };

      const result = await bookingService.modifyBooking(bookingId, modifications);

      expect(result).toMatchObject({
        id: bookingId,
        ...modifications,
        modifiedAt: expect.any(Date),
      });
    });

    it('should recalculate price when duration changes', async () => {
      const bookingId = faker.string.uuid();
      const modifications = {
        duration: 5,
      };

      const result = await bookingService.modifyBooking(bookingId, modifications);

      expect(result.totalPrice).toBe(25.00); // 5 hours * $5
    });

    it('should prevent modification within 30 minutes of start time', async () => {
      const bookingId = faker.string.uuid();
      const modifications = {
        startTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      };

      await expect(bookingService.modifyBooking(bookingId, modifications))
        .rejects
        .toThrow('Cannot modify booking within 30 minutes of start time');
    });
  });

  describe('getUserBookings', () => {
    it('should return all bookings for a user', async () => {
      const userId = faker.string.uuid();

      const result = await bookingService.getUserBookings(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(booking => booking.userId === userId)).toBe(true);
    });

    it('should filter bookings by status', async () => {
      const userId = faker.string.uuid();
      const status = 'confirmed';

      const result = await bookingService.getUserBookings(userId, { status });

      expect(result.every(booking => booking.status === status)).toBe(true);
    });

    it('should paginate results', async () => {
      const userId = faker.string.uuid();
      const limit = 10;
      const offset = 0;

      const result = await bookingService.getUserBookings(userId, { limit, offset });

      expect(result.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('checkAvailability', () => {
    it('should return true for available time slot', async () => {
      const spotId = faker.string.uuid();
      const startTime = faker.date.future();
      const duration = 2;

      const isAvailable = await bookingService.checkAvailability(spotId, startTime, duration);

      expect(isAvailable).toBe(true);
    });

    it('should return false for booked time slot', async () => {
      const spotId = faker.string.uuid();
      const startTime = faker.date.future();
      const duration = 2;

      // Create a booking first
      await bookingService.createBooking({
        userId: faker.string.uuid(),
        spotId,
        startTime,
        duration,
      });

      const isAvailable = await bookingService.checkAvailability(spotId, startTime, duration);

      expect(isAvailable).toBe(false);
    });
  });
});
