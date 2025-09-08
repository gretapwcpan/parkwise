// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'mongodb://localhost:27017/parkwise-test';

// Global test utilities
global.testUtils = {
  generateMockUser: () => ({
    id: Math.random().toString(36).substring(7),
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    role: 'user',
  }),
  
  generateMockParkingSpot: () => ({
    id: Math.random().toString(36).substring(7),
    name: 'Test Parking Spot',
    address: '123 Test Street',
    lat: 40.7128,
    lng: -74.0060,
    price: 5.00,
    available: true,
    features: ['covered', 'security'],
  }),
  
  generateMockBooking: () => ({
    id: Math.random().toString(36).substring(7),
    userId: 'user123',
    spotId: 'spot456',
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
    status: 'confirmed',
    totalPrice: 10.00,
  }),
};

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(() => resolve(), 500));
});
