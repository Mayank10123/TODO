import { type User } from 'firebase/auth';

// Both local dev and Vercel use /api - no hardcoded domain needed
const API_BASE_URL = '/api';

export async function fetchWithAuth(endpoint: string, user: User | null, options: RequestInit = {}) {
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserDataFromServer(user: User | null) {
  try {
    if (!user) return null;
    return await fetchWithAuth('/user-data', user);
  } catch (error) {
    console.error('Failed to fetch user data from server:', error);
    return null;
  }
}

export async function saveUserDataToServer(user: User | null, data: any) {
  try {
    if (!user) throw new Error('User not authenticated');
    return await fetchWithAuth('/user-data', user, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to save user data to server:', error);
    throw error;
  }
}

export async function verifyTokenOnServer(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return response.json();
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
