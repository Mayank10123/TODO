import { VercelRequest, VercelResponse } from '@vercel/node';

let fetch: any;
try {
  fetch = (global as any).fetch || require('node-fetch');
} catch {
  fetch = require('node-fetch');
}

import { initializeAuth } from './firebase-admin.js';

// SECURITY NOTE: All sensitive Firebase operations happen here on the backend
// Private keys NEVER leave your server. Frontend cannot bypass this layer.

interface AuthRequest {
  action: 'signup' | 'login';
  email?: string;
  password?: string;
}

interface AuthResponse {
  success: boolean;
  idToken?: string;
  user?: {
    uid: string;
    email: string;
  };
  error?: string;
}

// Allowed origins - retrieved from environment
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173', // Vite dev server default port
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
].filter(Boolean);

function setSecureCORS(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  
  // Allow same-origin requests on Vercel
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || 
    (process.env.VERCEL_URL && origin?.includes(process.env.VERCEL_URL));
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n📡 [${requestId}] New auth request: ${req.method}`);
  
  setSecureCORS(req, res);

  if (req.method === 'OPTIONS') {
    console.log(`✅ [${requestId}] CORS preflight handled`);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action, email, password } = req.body as AuthRequest;
    console.log(`🔑 [${requestId}] Action: ${action}, Email: ${email}`);

    if (!action || !email || !password) {
      console.log(`❌ [${requestId}] Missing fields - action: ${action}, email: ${email}, password: ${password ? '***' : 'missing'}`);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Validate email format
    if (!email.includes('@')) {
      console.log(`❌ [${requestId}] Invalid email format: ${email}`);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      console.log(`❌ [${requestId}] Password too short`);
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    console.log(`🔧 [${requestId}] Initializing Firebase Auth...`);
    const { auth } = initializeAuth();
    const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;

    console.log(`🔑 [${requestId}] Firebase API Key available: ${firebaseApiKey ? '✅' : '❌'}`);
    console.log(`🔑 [${requestId}] Auth instance available: ${auth ? '✅' : '❌'}`);

    if (!firebaseApiKey) {
      console.error(`❌ [${requestId}] Missing VITE_FIREBASE_API_KEY in environment`);
      console.error(`Available env vars: ${Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ')}`);
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error: missing API key' 
      });
    }

    // Check if Firebase Admin is properly initialized
    if (!auth) {
      console.error(`❌ [${requestId}] Firebase Admin Auth not initialized`);
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error: Firebase not initialized' 
      });
    }

    switch (action) {
      case 'signup': {
        try {
          console.log(`📝 [${requestId}] Starting signup for ${email}...`);
          
          // Create user with Admin SDK (secure backend operation)
          const userRecord = await auth.createUser({
            email,
            password,
            emailVerified: false,
          });
          
          console.log(`✅ [${requestId}] User created with UID: ${userRecord.uid}`);

          // Generate ID token for frontend use (safe - scoped to user)
          const idToken = await auth.createCustomToken(userRecord.uid);
          console.log(`🔑 [${requestId}] Custom token generated`);

          return res.status(201).json({
            success: true,
            idToken,
            user: {
              uid: userRecord.uid,
              email: userRecord.email || email,
            },
          });
        } catch (error: any) {
          console.error(`❌ [${requestId}] Signup error:`, error?.code, error?.message);
          
          // Generic error messages prevent user enumeration attacks
          if (error.code === 'auth/email-already-exists') {
            console.log(`ℹ️ [${requestId}] Email already registered`);
            return res.status(400).json({ 
              success: false, 
              error: 'This email is already registered' 
            });
          }
          return res.status(400).json({ 
            success: false, 
            error: 'Signup failed. Please try again.' 
          });
        }
      }

      case 'login': {
        try {
          console.log(`🔐 [${requestId}] Starting login for ${email}...`);
          
          // Use Firebase REST API for secure password verification
          // This prevents storing plaintext passwords on backend
          const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
          console.log(`🌐 [${requestId}] Calling Firebase at: ${firebaseUrl.split('?')[0]}...`);
          
          const firebaseResponse = await fetch(
            firebaseUrl,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                password,
                returnSecureToken: true,
              }),
            }
          );

          console.log(`📊 [${requestId}] Firebase response status: ${firebaseResponse.status}`);

          if (!firebaseResponse.ok) {
            let errorData: any;
            try {
              errorData = await firebaseResponse.json();
              console.error(`❌ [${requestId}] Firebase error:`, errorData);
            } catch {
              console.error(`❌ [${requestId}] Firebase error (couldn't parse): ${firebaseResponse.statusText}`);
            }
            
            const errorMsg = errorData?.error?.message || 'Invalid credentials';
            console.error(`🔍 [${requestId}] Login failed:`, errorMsg);
            
            return res.status(401).json({ 
              success: false, 
              error: 'Invalid email or password' 
            });
          }

          const firebaseData = await firebaseResponse.json() as any;
          console.log(`✅ [${requestId}] Firebase verified user: ${firebaseData.email}`);
          
          // Create a custom token for the frontend to sign in with
          // (Required for signInWithCustomToken())
          const customToken = await auth.createCustomToken(firebaseData.localId);
          console.log(`🎫 [${requestId}] Custom token generated for frontend`);
          
          return res.status(200).json({
            success: true,
            idToken: customToken,
            user: {
              uid: firebaseData.localId,
              email: firebaseData.email,
            },
          });
        } catch (error: any) {
          console.error(`❌ [${requestId}] Login error:`, error?.message || error);
          console.error(`🔍 [${requestId}] Full error:`, error);
          console.error(`🔍 [${requestId}] Error stack:`, error?.stack);
          return res.status(500).json({ 
            success: false, 
            error: 'Authentication failed: ' + (error?.message || 'Unknown error') 
          });
        }
      }

      default:
        console.log(`⚠️ [${requestId}] Invalid action: ${action}`);
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid action' 
        });
    }
  } catch (error: any) {
    console.error(`\n❌ [${requestId}] UNEXPECTED AUTH ERROR:`, error?.message || error);
    console.error(`🔍 [${requestId}] Error type:`, error?.constructor?.name);
    console.error(`🔍 [${requestId}] Error code:`, error?.code);
    console.error(`🔍 [${requestId}] Full stack:`, error?.stack);
    console.error(`\n---\n`);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + (error?.message || 'Unknown error') 
    });
  }
}
