import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../interfaces/user';
import { useNotification } from './NotificationContext';

interface LoginData {
  user_email: string;
  user_password: string;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  user_email: string;
  user_password: string;
  role: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = 'http://localhost:8000/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const refreshPromise = useRef<Promise<string | null> | null>(null);
  const navigate = useNavigate();
  const { show } = useNotification();

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromise.current) {
      console.log('Refresh already in progress, waiting...');
      return refreshPromise.current;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }
    
    const promise = (async () => {
      try {
        console.log('Refreshing access token...');
        const response = await fetch(`${API_URL}/authentication/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh token: ${response.status}`);
        }

        const data: TokenResponse = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        console.log('Token refreshed successfully');
        return data.access_token;
      } catch (error) {
        console.error('Error refreshing token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        return null;
      } finally {
        refreshPromise.current = null;
      }
    })();
    
    refreshPromise.current = promise;
    return promise;
  }, []);

  const fetchUserProfile = useCallback(async (token: string): Promise<User | null> => {
    const response = await fetch(`${API_URL}/authentication/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      mode: 'cors',
    });
    if (!response.ok) {
        if (response.status === 401) {
            console.log('Access token expired, refreshing...');
            const newToken = await refreshAccessToken();
            if (newToken) {
                return fetchUserProfile(newToken);
            }
        }
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  }, [refreshAccessToken]);
  
  useEffect(() => {
    const initializeAuth = async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      
      try {
        const userData = await fetchUserProfile(localStorage.getItem('token') || '');
        setUser(userData);
      } catch (error) {
        console.error("Could not initialize auth:", error);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchUserProfile]);

  const login = async (data: LoginData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/authentication/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 403) {
          throw new Error(errorData.detail || 'Email not verified. Please check your email for verification link.');
        }
        if (response.status === 423) {
          throw new Error(errorData.detail || 'Account temporarily locked. Please try again later.');
        }

        throw new Error(errorData.detail || 'Login failed');
      }

      const tokenData: TokenResponse = await response.json();
      localStorage.setItem('token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);

      const userData = await fetchUserProfile(tokenData.access_token);
      setUser(userData);

      localStorage.setItem('justLoggedIn', 'true');
      show(`Welcome back, ${userData?.first_name}! You're now logged into Reservelt.`, 'success');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid email or password';
      show(message, 'error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/authentication/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role: 0 }),
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.detail;
        const message = Array.isArray(detail) ? detail[0].msg : detail;
        throw new Error(message || 'Registration failed');
      }

      await response.json();
      // Registration no longer returns tokens, only a message and email
      // Email verification is disabled for testing
      show('Registration successful! You can now log in immediately.', 'success');
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      show(message, 'error');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    refreshPromise.current = null;
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 