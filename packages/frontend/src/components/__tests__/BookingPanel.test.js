import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingPanel from '../BookingPanel';
import * as apiService from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService');

describe('BookingPanel Component', () => {
  const mockSpot = {
    id: 'spot-123',
    name: 'Downtown Parking Garage',
    address: '123 Main St, City',
    price: 5.00,
    available: true,
    features: ['covered', 'security', 'ev_charging'],
    lat: 40.7128,
    lng: -74.0060,
    totalSpaces: 100,
    availableSpaces: 45,
  };

  const mockOnClose = jest.fn();
  const mockOnBookingComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    apiService.bookings = {
      create: jest.fn(),
      checkAvailability: jest.fn(),
    };
  });

  describe('Rendering', () => {
    it('should render parking spot details correctly', () => {
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      expect(screen.getByText('Downtown Parking Garage')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, City')).toBeInTheDocument();
      expect(screen.getByText('$5.00/hour')).toBeInTheDocument();
      expect(screen.getByText('45 / 100 spaces available')).toBeInTheDocument();
    });

    it('should display parking features', () => {
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      expect(screen.getByText(/covered/i)).toBeInTheDocument();
      expect(screen.getByText(/security/i)).toBeInTheDocument();
      expect(screen.getByText(/ev charging/i)).toBeInTheDocument();
    });

    it('should show unavailable message when spot is not available', () => {
      const unavailableSpot = { ...mockSpot, available: false, availableSpaces: 0 };
      
      render(
        <BookingPanel 
          spot={unavailableSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      expect(screen.getByText(/not available/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /book now/i })).toBeDisabled();
    });
  });

  describe('Form Interactions', () => {
    it('should handle date selection', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const dateInput = screen.getByLabelText(/date/i);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      await user.clear(dateInput);
      await user.type(dateInput, dateString);

      expect(dateInput).toHaveValue(dateString);
    });

    it('should handle time selection', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const timeInput = screen.getByLabelText(/start time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '14:30');

      expect(timeInput).toHaveValue('14:30');
    });

    it('should handle duration selection', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const durationSelect = screen.getByLabelText(/duration/i);
      await user.selectOptions(durationSelect, '3');

      expect(durationSelect).toHaveValue('3');
    });

    it('should calculate and display total price', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const durationSelect = screen.getByLabelText(/duration/i);
      await user.selectOptions(durationSelect, '4');

      await waitFor(() => {
        expect(screen.getByText(/total.*\$20\.00/i)).toBeInTheDocument();
      });
    });

    it('should handle vehicle information input', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const vehicleTypeSelect = screen.getByLabelText(/vehicle type/i);
      const licensePlateInput = screen.getByLabelText(/license plate/i);

      await user.selectOptions(vehicleTypeSelect, 'suv');
      await user.type(licensePlateInput, 'ABC123');

      expect(vehicleTypeSelect).toHaveValue('suv');
      expect(licensePlateInput).toHaveValue('ABC123');
    });
  });

  describe('Form Validation', () => {
    it('should show error for past date selection', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const dateInput = screen.getByLabelText(/date/i);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      await user.clear(dateInput);
      await user.type(dateInput, dateString);
      
      const bookButton = screen.getByRole('button', { name: /book now/i });
      await user.click(bookButton);

      expect(screen.getByText(/cannot book for past dates/i)).toBeInTheDocument();
    });

    it('should require license plate for booking', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const bookButton = screen.getByRole('button', { name: /book now/i });
      await user.click(bookButton);

      expect(screen.getByText(/license plate is required/i)).toBeInTheDocument();
    });

    it('should validate minimum booking duration', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const durationSelect = screen.getByLabelText(/duration/i);
      
      // Try to select 0 hours (if option exists)
      const options = within(durationSelect).getAllByRole('option');
      const zeroOption = options.find(opt => opt.value === '0');
      
      if (zeroOption) {
        await user.selectOptions(durationSelect, '0');
        const bookButton = screen.getByRole('button', { name: /book now/i });
        await user.click(bookButton);
        expect(screen.getByText(/minimum booking duration/i)).toBeInTheDocument();
      }
    });
  });

  describe('Booking Submission', () => {
    it('should successfully submit booking with valid data', async () => {
      const user = userEvent.setup();
      apiService.bookings.create.mockResolvedValue({
        id: 'booking-456',
        status: 'confirmed',
        confirmationCode: 'PARK123',
      });

      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      // Fill in the form
      const licensePlateInput = screen.getByLabelText(/license plate/i);
      await user.type(licensePlateInput, 'XYZ789');

      const bookButton = screen.getByRole('button', { name: /book now/i });
      await user.click(bookButton);

      await waitFor(() => {
        expect(apiService.bookings.create).toHaveBeenCalledWith(
          expect.objectContaining({
            spotId: 'spot-123',
            licensePlate: 'XYZ789',
          })
        );
      });

      expect(mockOnBookingComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'booking-456',
          confirmationCode: 'PARK123',
        })
      );
    });

    it('should handle booking submission errors', async () => {
      const user = userEvent.setup();
      apiService.bookings.create.mockRejectedValue(
        new Error('Spot no longer available')
      );

      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const licensePlateInput = screen.getByLabelText(/license plate/i);
      await user.type(licensePlateInput, 'ABC123');

      const bookButton = screen.getByRole('button', { name: /book now/i });
      await user.click(bookButton);

      await waitFor(() => {
        expect(screen.getByText(/spot no longer available/i)).toBeInTheDocument();
      });

      expect(mockOnBookingComplete).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolveBooking;
      const bookingPromise = new Promise(resolve => {
        resolveBooking = resolve;
      });
      apiService.bookings.create.mockReturnValue(bookingPromise);

      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const licensePlateInput = screen.getByLabelText(/license plate/i);
      await user.type(licensePlateInput, 'ABC123');

      const bookButton = screen.getByRole('button', { name: /book now/i });
      await user.click(bookButton);

      // Check for loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(bookButton).toBeDisabled();

      // Resolve the booking
      resolveBooking({ id: 'booking-123', status: 'confirmed' });

      await waitFor(() => {
        expect(screen.queryByText(/processing/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Availability Check', () => {
    it('should check availability when date/time changes', async () => {
      const user = userEvent.setup();
      apiService.bookings.checkAvailability.mockResolvedValue({
        available: true,
        message: 'Spot available',
      });

      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const timeInput = screen.getByLabelText(/start time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '15:00');

      await waitFor(() => {
        expect(apiService.bookings.checkAvailability).toHaveBeenCalledWith(
          expect.objectContaining({
            spotId: 'spot-123',
          })
        );
      });
    });

    it('should disable booking when spot becomes unavailable', async () => {
      const user = userEvent.setup();
      apiService.bookings.checkAvailability.mockResolvedValue({
        available: false,
        message: 'Spot already booked for this time',
      });

      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      const timeInput = screen.getByLabelText(/start time/i);
      await user.clear(timeInput);
      await user.type(timeInput, '16:00');

      await waitFor(() => {
        expect(screen.getByText(/already booked for this time/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /book now/i })).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /book now/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/date/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/start time/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/duration/i)).toHaveFocus();
    });

    it('should handle escape key to close panel', async () => {
      const user = userEvent.setup();
      
      render(
        <BookingPanel 
          spot={mockSpot} 
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
