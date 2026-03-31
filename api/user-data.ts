import { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth } from './firebase-admin.js';

// Middleware to verify Firebase token
async function verifyToken(req: VercelRequest): Promise<string | null> {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return null;

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
}

// GET - Retrieve user tasks and notes
export async function getUserData(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(200).json({
        tasks: [],
        completedTasks: [],
        notes: {},
        categories: [],
      });
    }

    return res.status(200).json(userDoc.data());
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

// POST - Save user tasks and notes
export async function saveUserData(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { tasks, completedTasks, notes, categories, settings } = req.body;

    await db.collection('users').doc(userId).set(
      {
        tasks: tasks || [],
        completedTasks: completedTasks || [],
        notes: notes || {},
        categories: categories || [],
        settings: settings || {},
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save user data' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getUserData(req, res);
  } else if (req.method === 'POST') {
    return saveUserData(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
