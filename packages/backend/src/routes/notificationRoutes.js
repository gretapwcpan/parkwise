const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Register FCM token
router.post('/register', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ 
        error: 'User ID and FCM token are required' 
      });
    }
    
    const result = notificationService.registerToken(userId, token);
    res.json(result);
  } catch (error) {
    console.error('Register token error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Unregister FCM token
router.post('/unregister', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }
    
    const result = notificationService.unregisterToken(userId);
    res.json(result);
  } catch (error) {
    console.error('Unregister token error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }
    
    const result = await notificationService.sendTestNotification(userId);
    res.json(result);
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send area broadcast (admin)
router.post('/broadcast', async (req, res) => {
  try {
    const { areaId, title, body, data } = req.body;
    
    if (!areaId || !title || !body) {
      return res.status(400).json({ 
        error: 'Area ID, title, and body are required' 
      });
    }
    
    const result = await notificationService.sendAreaBroadcast(
      areaId,
      title,
      body,
      data
    );
    
    res.json(result);
  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
