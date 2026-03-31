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

    // GET - Fetch reminders for a task or user
    if (req.method === 'GET') {
      const { taskId } = req.query;

      try {
        let query: any = db.collection('users').doc(uid).collection('reminders');
        
        if (taskId) {
          query = query.where('taskId', '==', taskId);
        }

        const snapshot = await query.orderBy('reminderTime', 'asc').get();
        const reminders = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          reminderTime: doc.data().reminderTime?.toDate(),
          created: doc.data().created?.toDate(),
          updated: doc.data().updated?.toDate(),
        }));

        return res.status(200).json(reminders);
      } catch (error: any) {
        console.error('Error fetching reminders:', error);
        return res.status(500).json({ error: 'Failed to fetch reminders' });
      }
    }

    // POST - Create a new reminder
    if (req.method === 'POST') {
      const { taskId, title, minutesBefore, type, recurring } = req.body;

      if (!taskId || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Calculate reminder time from task due date
        const taskDoc = await db.collection('users').doc(uid).collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const task = taskDoc.data();
        const dueDate = task?.dueDate?.toDate();

        if (!dueDate) {
          return res.status(400).json({ error: 'Task must have a due date' });
        }

        // Calculate reminder time
        const reminderTime = new Date(dueDate.getTime() - (minutesBefore || 60) * 60000);

        const reminder = {
          taskId,
          title,
          reminderTime,
          type: type || 'in-app',
          recurring: recurring || 'once',
          minutesBefore: minutesBefore || 60,
          enabled: true,
          sent: false,
          created: new Date(),
          updated: new Date(),
        };

        const docRef = await db
          .collection('users')
          .doc(uid)
          .collection('reminders')
          .add(reminder);

        return res.status(201).json({
          id: docRef.id,
          ...reminder,
        });
      } catch (error: any) {
        console.error('Error creating reminder:', error);
        return res.status(500).json({ error: 'Failed to create reminder' });
      }
    }

    // PUT - Update a reminder
    if (req.method === 'PUT') {
      const { reminderId, ...updates } = req.body;

      if (!reminderId) {
        return res.status(400).json({ error: 'Missing reminderId' });
      }

      try {
        updates.updated = new Date();

        await db
          .collection('users')
          .doc(uid)
          .collection('reminders')
          .doc(reminderId)
          .update(updates);

        const updated = await db
          .collection('users')
          .doc(uid)
          .collection('reminders')
          .doc(reminderId)
          .get();

        return res.status(200).json({
          id: updated.id,
          ...updated.data(),
        });
      } catch (error: any) {
        console.error('Error updating reminder:', error);
        return res.status(500).json({ error: 'Failed to update reminder' });
      }
    }

    // DELETE - Remove a reminder
    if (req.method === 'DELETE') {
      const { reminderId } = req.body;

      if (!reminderId) {
        return res.status(400).json({ error: 'Missing reminderId' });
      }

      try {
        await db
          .collection('users')
          .doc(uid)
          .collection('reminders')
          .doc(reminderId)
          .delete();

        return res.status(200).json({ success: true });
      } catch (error: any) {
        console.error('Error deleting reminder:', error);
        return res.status(500).json({ error: 'Failed to delete reminder' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Reminders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
