import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('SW registered: ', registration))
      .catch(registrationError => console.log('SW registration failed: ', registrationError));
  });
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
