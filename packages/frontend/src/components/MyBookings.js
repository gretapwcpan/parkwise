import React, { useState, useEffect } from 'react';
import { useApi } from '../services/apiService';
import './MyBookings.css';

const MyBookings = ({ userId, onClose }) => {
  const api = useApi();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
    
    // Add ESC key listener
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [userId, onClose]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.bookings.getUserBookings(userId);
      setBookings(response.bookings || []);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await api.bookings.cancel(bookingId, userId);
      
      // Update the bookings list
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );
      
      // Show success message
      alert('Booking cancelled successfully');
    } catch (err) {
      alert('Failed to cancel booking. Please try again.');
      console.error('Error cancelling booking:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      case 'completed':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancelBooking = (booking) => {
    // Can only cancel if booking is not already cancelled or completed
    // and if the start time hasn't passed
    const now = new Date();
    const startTime = new Date(booking.startTime);
    return (
      booking.status !== 'cancelled' && 
      booking.status !== 'completed' &&
      startTime > now
    );
  };

  if (loading) {
    return (
      <div className="my-bookings-overlay">
        <div className="my-bookings-panel">
          <div className="bookings-header">
            <h2>My Bookings</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-overlay" onClick={onClose}>
      <div className="my-bookings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bookings-header">
          <h2>My Bookings</h2>
          <button className="close-btn" onClick={onClose} title="Close (ESC)">×</button>
        </div>

        <div className="bookings-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchBookings} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="no-bookings">
              <p>You have no bookings yet.</p>
              <p className="hint">Book a parking spot to see it here!</p>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-status" style={{ backgroundColor: getStatusColor(booking.status) }}>
                    {booking.status}
                  </div>
                  
                  <div className="booking-details">
                    <h3>{booking.spotName || `Spot ${booking.spotId}`}</h3>
                    
                    <div className="booking-time">
                      <div className="time-slot">
                        <span className="label">Start:</span>
                        <span className="value">{formatDateTime(booking.startTime)}</span>
                      </div>
                      <div className="time-slot">
                        <span className="label">End:</span>
                        <span className="value">{formatDateTime(booking.endTime)}</span>
                      </div>
                    </div>

                    {booking.price && (
                      <div className="booking-price">
                        <span className="label">Total:</span>
                        <span className="value">${booking.price}</span>
                      </div>
                    )}

                    <div className="booking-id">
                      Booking ID: {booking.id}
                    </div>
                  </div>

                  {canCancelBooking(booking) && (
                    <div className="booking-actions">
                      <button
                        className="cancel-booking-btn"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bookings-footer">
          <button className="refresh-btn" onClick={fetchBookings}>
            Refresh
          </button>
          <button className="close-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
