import { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from './firebase-admin.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Verify auth token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let uid: string;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // GET - Fetch all notifications for user
    if (req.method === 'GET') {
      try {
        const snapshot = await db
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .orderBy('createdAt', 'desc')
          .limit(100)
          .get();

        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate(),
          nextTrigger: doc.data().nextTrigger?.toDate(),
        }));

        return res.status(200).json(notifications);
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }
    }

    // POST - Create notification
    if (req.method === 'POST') {
      const {
        title,
        message,
        type, // 'task-reminder', 'suggestion', 'achievement', 'custom'
        taskId,
        duration, // in minutes, how long to show notification
        frequency, // 'once', 'daily', 'weekly', 'custom'
        customDays, // [0,1,2...6] for weekly
        deliveryTime, // "09:00" format for scheduled delivery
        deliveryMethod, // 'in-app', 'email', 'push', 'all'
        enabled,
      } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message required' });
      }

      try {
        const now = new Date();
        
        // Calculate next trigger time
        let nextTrigger = new Date();
        if (deliveryTime) {
          const [hours, minutes] = deliveryTime.split(':').map(Number);
          nextTrigger.setHours(hours, minutes, 0, 0);
          
          // If the time has already passed today, schedule for tomorrow
          if (nextTrigger < now) {
            nextTrigger.setDate(nextTrigger.getDate() + 1);
          }
        }

        const notification = {
          title,
          message,
          type: type || 'custom',
          taskId: taskId || null,
          duration: duration || 5000, // 5 seconds default
          frequency: frequency || 'once',
          customDays: customDays || [],
          deliveryTime: deliveryTime || null,
          deliveryMethod: deliveryMethod || 'in-app',
          enabled: enabled !== false,
          sent: false,
          nextTrigger,
          createdAt: now,
          updatedAt: now,
          readAt: null,
        };

        const docRef = await db
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .add(notification);

        return res.status(201).json({
          id: docRef.id,
          ...notification,
        });
      } catch (error: any) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ error: 'Failed to create notification' });
      }
    }

    // PUT - Update notification
    if (req.method === 'PUT') {
      const { notificationId, ...updates } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Missing notificationId' });
      }

      try {
        updates.updatedAt = new Date();

        await db
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc(notificationId)
          .update(updates);

        const updated = await db
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc(notificationId)
          .get();

        return res.status(200).json({
          id: updated.id,
          ...updated.data(),
        });
      } catch (error: any) {
        console.error('Error updating notification:', error);
        return res.status(500).json({ error: 'Failed to update notification' });
      }
    }

    // DELETE - Remove notification
    if (req.method === 'DELETE') {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Missing notificationId' });
      }

      try {
        await db
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc(notificationId)
          .delete();

        return res.status(200).json({ success: true });
      } catch (error: any) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
