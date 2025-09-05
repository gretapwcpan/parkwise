const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // For production, use service account credentials
    if (process.env.NODE_ENV === 'production') {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    } else {
      // For development, you can use default credentials or a service account file
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'parking-space-demo',
      });
    }
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // For prototype, continue without Firebase if not configured
    console.log('Running without Firebase - using in-memory storage');
  }
};

// Initialize on module load
initializeFirebase();

// Get Firestore instance
const db = admin.firestore ? admin.firestore() : null;

// Get FCM instance
const messaging = admin.messaging ? admin.messaging() : null;

// Firestore operations
const firestore = {
  // Create a document
  async create(collection, data) {
    if (!db) {
      console.log('Firestore not available - using mock response');
      return { id: Date.now().toString(), ...data };
    }
    
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  // Get a document by ID
  async getById(collection, id) {
    if (!db) {
      console.log('Firestore not available - returning mock data');
      return null;
    }
    
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  },

  // Query documents
  async query(collection, conditions = []) {
    if (!db) {
      console.log('Firestore not available - returning empty array');
      return [];
    }
    
    let query = db.collection(collection);
    
    // Apply conditions
    conditions.forEach(({ field, operator, value }) => {
      query = query.where(field, operator, value);
    });
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Update a document
  async update(collection, id, data) {
    if (!db) {
      console.log('Firestore not available - returning mock update');
      return { id, ...data };
    }
    
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id, ...data };
  },

  // Delete a document
  async delete(collection, id) {
    if (!db) {
      console.log('Firestore not available - mock delete');
      return true;
    }
    
    await db.collection(collection).doc(id).delete();
    return true;
  },

  // Check for booking conflicts
  async checkBookingConflict(spotId, startTime, endTime) {
    if (!db) {
      console.log('Firestore not available - no conflicts');
      return false;
    }
    
    const conflicts = await db.collection('bookings')
      .where('spotId', '==', spotId)
      .where('status', '==', 'active')
      .where('endTime', '>', startTime)
      .where('startTime', '<', endTime)
      .get();
    
    return !conflicts.empty;
  }
};

// FCM operations
const fcm = {
  // Send notification to a single device
  async sendToDevice(token, title, body, data = {}) {
    if (!messaging) {
      console.log('FCM not available - mock notification:', { token, title, body });
      return { success: true, mock: true };
    }
    
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };
    
    try {
      const response = await messaging.send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('FCM send error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification to multiple devices
  async sendToMultiple(tokens, title, body, data = {}) {
    if (!messaging) {
      console.log('FCM not available - mock multicast:', { tokens, title, body });
      return { success: true, mock: true };
    }
    
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };
    
    try {
      const response = await messaging.sendMulticast(message);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('FCM multicast error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send to topic
  async sendToTopic(topic, title, body, data = {}) {
    if (!messaging) {
      console.log('FCM not available - mock topic send:', { topic, title, body });
      return { success: true, mock: true };
    }
    
    const message = {
      topic,
      notification: {
        title,
        body,
      },
      data,
    };
    
    try {
      const response = await messaging.send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('FCM topic send error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  firestore,
  fcm,
  admin,
};
