import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function App() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingBookings();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/admin/pending`);
      setPendingBookings(response.data.bookings);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pending bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      await axios.put(`${API_BASE_URL}/api/bookings/admin/${bookingId}/approve`);
      // Remove from pending list
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      alert('Booking approved successfully!');
    } catch (err) {
      alert('Failed to approve booking: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessingId(bookingId);
    try {
      await axios.put(`${API_BASE_URL}/api/bookings/admin/${bookingId}/reject`, { reason });
      // Remove from pending list
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      alert('Booking rejected successfully!');
    } catch (err) {
      alert('Failed to reject booking: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading pending bookings...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Parking Space Admin Dashboard</h1>
        <button onClick={fetchPendingBookings} className="refresh-btn">
          🔄 Refresh
        </button>
      </header>

      <main className="admin-main">
        {error && (
          <div className="error-message">{error}</div>
        )}

        <section className="bookings-section">
          <h2>Pending Bookings ({pendingBookings.length})</h2>
          
          {pendingBookings.length === 0 ? (
            <div className="no-bookings">No pending bookings at the moment.</div>
          ) : (
            <div className="bookings-grid">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>Booking #{booking.id}</h3>
                    <span className="status-badge pending">Pending</span>
                  </div>
                  
                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="label">User ID:</span>
                      <span className="value">{booking.userId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Spot ID:</span>
                      <span className="value">{booking.spotId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Start Time:</span>
                      <span className="value">{formatDateTime(booking.startTime)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">End Time:</span>
                      <span className="value">{formatDateTime(booking.endTime)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Created:</span>
                      <span className="value">{formatDateTime(booking.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="booking-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(booking.id)}
                      disabled={processingId === booking.id}
                    >
                      {processingId === booking.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(booking.id)}
                      disabled={processingId === booking.id}
                    >
                      {processingId === booking.id ? 'Processing...' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="stats-section">
          <h2>Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Pending Bookings</h3>
              <div className="stat-value">{pendingBookings.length}</div>
            </div>
            <div className="stat-card">
              <h3>Last Updated</h3>
              <div className="stat-value">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
