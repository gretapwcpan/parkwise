import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../services/apiService';
import './NotificationHandler.css';

const NotificationHandler = ({ userId }) => {
  const api = useApi();
  const [permission, setPermission] = useState('default');
  const [fcmToken, setFcmToken] = useState(null);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [isNotificationSupported, setIsNotificationSupported] = useState(false);

  useEffect(() => {
    // Check if Notification API is supported
    const supported = 'Notification' in window;
    setIsNotificationSupported(supported);
    
    // Initialize notifications and store cleanup function
    let cleanup;
    const init = async () => {
      cleanup = await initializeNotifications();
    };
    init();
    
    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const initializeNotifications = async () => {
    // Check if browser supports notifications
    if (!isNotificationSupported && !('Notification' in window)) {
      console.log('This browser does not support native notifications - using fallback toast system');
      // Still set up the message listener for fallback notifications
      return setupMessageListener();
    }

    // Get current permission status
    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Request permission if not granted
    if (currentPermission === 'default') {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
      } catch (error) {
        console.log('Failed to request notification permission:', error);
        // Fall back to toast notifications
        return setupMessageListener();
      }
    }

    if (currentPermission === 'granted' || permission === 'granted') {
      // For demo purposes, we'll use a mock FCM token
      // In production, you would get this from Firebase
      const mockToken = `fcm-token-${userId}-${Date.now()}`;
      setFcmToken(mockToken);
      
      // Register token with backend
      try {
        await api.notifications.registerToken(userId, mockToken);
        console.log('FCM token registered');
      } catch (error) {
        console.error('Failed to register FCM token:', error);
      }
    }

    // Set up message listener for both native and fallback notifications
    return setupMessageListener();
  };

  const setupMessageListener = () => {
    // In a real app, this would listen to Firebase Cloud Messaging
    // For demo, we'll create a simple notification handler
    
    // Define the event handler
    const handleAppNotification = (event) => {
      const { title, body, data } = event.detail;
      showNotification(title, body, data);
    };
    
    // Listen for custom events from the app
    window.addEventListener('app-notification', handleAppNotification);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('app-notification', handleAppNotification);
    };
  };

  // Fallback toast notification system for mobile
  const showToastNotification = useCallback((title, body, data = {}) => {
    const id = Date.now();
    const newToast = { id, title, body, data };
    
    setToastNotifications(prev => [...prev, newToast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
    
    // Handle notification click logic
    return {
      onclick: () => {
        handleNotificationClick(data);
      }
    };
  }, []);

  const handleNotificationClick = (data) => {
    window.focus();
    
    // Handle different notification types
    switch (data.type) {
      case 'booking_confirmation':
        console.log('Opening booking details...');
        break;
      case 'spot_unavailable':
        console.log('Showing alternative slots...');
        break;
      case 'arrival_notification':
        console.log('User arrived at spot');
        break;
      default:
        console.log('Notification clicked');
    }
  };

  const showNotification = (title, body, data = {}) => {
    // Check if native notifications are supported and permitted
    if ('Notification' in window && permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: data.type || 'general',
          data,
          requireInteraction: false,
          vibrate: [200, 100, 200],
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          handleNotificationClick(data);
        };
        
        // Successfully showed native notification, return early
        return;
      } catch (error) {
        console.log('Failed to show native notification, using fallback:', error);
        // Fall through to show toast notification below
      }
    }
    
    // Use fallback toast notification for mobile, permission denied, or when native fails
    console.log('Using toast notification fallback');
    showToastNotification(title, body, data);
  };

  // Test notification function
  const sendTestNotification = async () => {
    try {
      await api.notifications.sendTest(userId);
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  // Remove a toast notification manually
  const removeToast = (id) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== id));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fcmToken) {
        api.notifications.unregisterToken(userId).catch(console.error);
      }
    };
  }, [fcmToken, userId]);

  // Render toast notifications for mobile fallback
  return (
    <div className="toast-container">
      {toastNotifications.map(toast => (
        <div 
          key={toast.id} 
          className="toast-notification"
          onClick={() => {
            handleNotificationClick(toast.data);
            removeToast(toast.id);
          }}
        >
          <div className="toast-header">
            <strong className="toast-title">{toast.title}</strong>
            <button 
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="toast-body">{toast.body}</div>
        </div>
      ))}
    </div>
  );
};

export default NotificationHandler;
