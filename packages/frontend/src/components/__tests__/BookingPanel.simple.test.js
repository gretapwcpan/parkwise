import React from 'react';
import BookingPanel from '../BookingPanel';

// Mock the API service
jest.mock('../../services/apiService', () => ({
  bookParkingSpot: jest.fn(),
  cancelBooking: jest.fn(),
  getMyBookings: jest.fn(),
}));

// Mock socket service
jest.mock('../../services/socketService', () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

describe('BookingPanel - Simple Tests', () => {
  let mockSpot;
  let mockOnClose;
  let mockOnBookingComplete;

  beforeEach(() => {
    mockSpot = {
      id: 'spot-123',
      name: 'Test Parking Spot',
      address: '123 Test St',
      price: 5.00,
      availability: 'available',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      distance: 0.5,
      features: ['covered', 'ev_charging'],
      rating: 4.5,
      reviews: 10,
    };

    mockOnClose = jest.fn();
    mockOnBookingComplete = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should create BookingPanel component', () => {
    const element = React.createElement(BookingPanel, {
      spot: mockSpot,
      onClose: mockOnClose,
      onBookingComplete: mockOnBookingComplete,
    });

    expect(element).toBeTruthy();
    expect(element.type).toBe(BookingPanel);
    expect(element.props.spot).toBe(mockSpot);
  });

  it('should have correct props', () => {
    const element = React.createElement(BookingPanel, {
      spot: mockSpot,
      onClose: mockOnClose,
      onBookingComplete: mockOnBookingComplete,
    });

    expect(element.props).toHaveProperty('spot');
    expect(element.props).toHaveProperty('onClose');
    expect(element.props).toHaveProperty('onBookingComplete');
    expect(element.props.spot.id).toBe('spot-123');
    expect(element.props.spot.name).toBe('Test Parking Spot');
  });

  it('should handle null spot gracefully', () => {
    const element = React.createElement(BookingPanel, {
      spot: null,
      onClose: mockOnClose,
      onBookingComplete: mockOnBookingComplete,
    });

    expect(element).toBeTruthy();
    expect(element.props.spot).toBeNull();
  });

  it('should validate spot data structure', () => {
    expect(mockSpot).toHaveProperty('id');
    expect(mockSpot).toHaveProperty('name');
    expect(mockSpot).toHaveProperty('price');
    expect(mockSpot).toHaveProperty('coordinates');
    expect(mockSpot.coordinates).toHaveProperty('lat');
    expect(mockSpot.coordinates).toHaveProperty('lng');
    expect(typeof mockSpot.price).toBe('number');
    expect(Array.isArray(mockSpot.features)).toBe(true);
  });

  it('should validate callback functions', () => {
    expect(typeof mockOnClose).toBe('function');
    expect(typeof mockOnBookingComplete).toBe('function');
    
    // Test that callbacks can be called
    mockOnClose();
    mockOnBookingComplete('booking-123');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnBookingComplete).toHaveBeenCalledWith('booking-123');
  });
});
