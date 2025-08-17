import React, { useEffect, useState } from 'react';
import { useApi } from '../services/apiService';

const NotificationHandler = ({ userId }) => {
  const api = useApi();
  const [permission, setPermission] = useState(Notification.permission);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Request permission if not granted
    if (permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }

    if (permission === 'granted' || Notification.permission === 'granted') {
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

      // Set up message listener for web notifications
      setupMessageListener();
    }
  };

  const setupMessageListener = () => {
    // In a real app, this would listen to Firebase Cloud Messaging
    // For demo, we'll create a simple notification handler
    
    // Listen for custom events from the app
    window.addEventListener('app-notification', (event) => {
      const { title, body, data } = event.detail;
      showNotification(title, body, data);
    });

    // Simulate receiving notifications
    // This would normally come from FCM
    setTimeout(() => {
      if (permission === 'granted') {
        showNotification(
          'Welcome to Parking Space',
          'Start booking your parking spots!',
          { type: 'welcome' }
        );
      }
    }, 3000);
  };

  const showNotification = (title, body, data = {}) => {
    if (permission !== 'granted') return;

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fcmToken) {
        api.notifications.unregisterToken(userId).catch(console.error);
      }
    };
  }, [fcmToken, userId]);

  // This component doesn't render anything visible
  // In a real app, you might show a notification permission prompt UI
  return null;
};

export default NotificationHandler;
