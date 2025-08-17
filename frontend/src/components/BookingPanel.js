import React, { useState, useEffect } from 'react';
import { useApi } from '../services/apiService';
import './BookingPanel.css';

const BookingPanel = ({ spot, userId, onClose, onBookingComplete }) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [availability, setAvailability] = useState([]);
  const [alternativeSlot, setAlternativeSlot] = useState(null);

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    // Check availability when date changes
    if (selectedDate && spot) {
      checkAvailability();
    }
  }, [selectedDate, spot]);

  const checkAvailability = async () => {
    try {
      const response = await api.bookings.checkAvailability(spot.id, selectedDate);
      setAvailability(response.slots);
    } catch (err) {
      console.error('Error checking availability:', err);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select date and time');
      return;
    }

    setLoading(true);
    setError(null);
    setAlternativeSlot(null);

    try {
      // Create start and end times
      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

      const bookingData = {
        spotId: spot.id,
        userId: userId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const response = await api.bookings.create(bookingData);

      if (response.success) {
        onBookingComplete(response.booking);
      } else {
        setError(response.error);
        if (response.alternative) {
          setAlternativeSlot(response.alternative);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativeBooking = async () => {
    if (!alternativeSlot) return;

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        spotId: spot.id,
        userId: userId,
        startTime: alternativeSlot.startTime,
        endTime: alternativeSlot.endTime,
      };

      const response = await api.bookings.create(bookingData);

      if (response.success) {
        onBookingComplete(response.booking);
      } else {
        setError('Alternative booking failed');
      }
    } catch (err) {
      setError('Alternative booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!availability.length) return [];
    
    return availability
      .filter(slot => slot.available)
      .map(slot => {
        const time = new Date(slot.startTime);
        return {
          value: time.toTimeString().slice(0, 5),
          label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });
  };

  return (
    <div className="booking-panel-overlay">
      <div className="booking-panel">
        <div className="booking-header">
          <h2>Book Parking Spot</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="booking-content">
          <div className="spot-info">
            <h3>{spot.name}</h3>
            <p className="spot-status">Status: Available</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleBooking(); }}>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <select
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                <option value="">Select time</option>
                {getAvailableTimeSlots().map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (hours)</label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
                <option value={4}>4 hours</option>
              </select>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {alternativeSlot && (
              <div className="alternative-slot">
                <p>Alternative slot available:</p>
                <p className="alternative-time">
                  {new Date(alternativeSlot.startTime).toLocaleString()} - 
                  {new Date(alternativeSlot.endTime).toLocaleTimeString()}
                </p>
                <button
                  type="button"
                  className="btn-alternative"
                  onClick={handleAlternativeBooking}
                  disabled={loading}
                >
                  Book Alternative Slot
                </button>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedTime}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPanel;
