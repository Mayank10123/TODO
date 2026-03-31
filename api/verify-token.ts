import { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from './firebase-admin.js';

// Verify Firebase ID token
export async function verifyAuth(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return res.status(200).json({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error) {
    return res.status(401).json({ valid: false, error: 'Invalid token' });
  }
}

export default verifyAuth;
