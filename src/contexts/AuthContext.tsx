import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  signOut, 
  onAuthStateChanged,
  type User,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ⚠️ SECURITY: Backend API endpoint for secure auth operations
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set persistence to LOCAL so sessions survive page refresh
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('Persistence error:', err);
    });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        console.log('✅ User authenticated:', currentUser.email);
      }
    });

    return unsubscribe;
  }, []);

  // ✅ SECURE: Signup via backend - passwords never leave your server directly
  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('📝 Creating account via secure backend...');

      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({
          action: 'signup',
          email,
          password,
        }),
      });

      if (!response.ok) {
        // Better error handling for failed responses
        let errorData;
        try {
          errorData = await response.json() as any;
        } catch {
          throw new Error(`Backend error: ${response.status} ${response.statusText}. Start backend with: node local-backend.cjs on port 3000`);
        }
        throw new Error(errorData.error || `Signup failed: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json() as any;
      } catch {
        throw new Error('Backend returned invalid JSON. Start backend with: node local-backend.cjs');
      }

      // Sign in with the token returned by backend
      await signInWithCustomToken(auth, data.idToken);
      console.log('✅ Account created and logged in successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      console.error('❌ Signup Error:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ SECURE: Login via backend - passwords verified on server
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Authenticating via secure backend...');

      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      if (!response.ok) {
        // Better error handling for failed responses
        let errorData;
        try {
          errorData = await response.json() as any;
        } catch {
          throw new Error(`Backend error: ${response.status} ${response.statusText}. Start backend with: node local-backend.cjs on port 3000`);
        }
        throw new Error(errorData.error || `Login failed: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json() as any;
      } catch {
        throw new Error('Backend returned invalid JSON. Start backend with: node local-backend.cjs');
      }

      // Sign in with the token returned by backend
      await signInWithCustomToken(auth, data.idToken);
      console.log('✅ Login successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('❌ Login Error:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Google OAuth - Safe because it's handled by Google directly
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('🌐 Authenticating with Google...');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log('✅ Google login successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed';
      console.error('❌ Google Login Error:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      console.log('✅ Logged out successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    }
  };

  // Password reset - secure backend endpoint recommended for production
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, loginWithGoogle, logout, resetPassword, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
