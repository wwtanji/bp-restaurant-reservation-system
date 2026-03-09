import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../interfaces/user';
import { useNotification } from './NotificationContext';
import { API_URL } from '../utils/api';

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

interface AuthStateContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
}

interface AuthActionsContextType {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export class FieldValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super('Validation failed');
  }
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined);
const AuthActionsContext = createContext<AuthActionsContextType | undefined>(undefined);

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) throw new Error('useAuthState must be used within an AuthProvider');
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (!context) throw new Error('useAuthActions must be used within an AuthProvider');
  return context;
};

export const useAuth = () => {
  return { ...useAuthState(), ...useAuthActions() };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const refreshPromise = useRef<Promise<string | null> | null>(null);
  const navigate = useNavigate();
  const { show } = useNotification();

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return null;
    }

    const promise = (async () => {
      try {
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

  const login = useCallback(async (data: LoginData) => {
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
  }, [fetchUserProfile, navigate, show]);

  const register = useCallback(async (data: RegisterData) => {
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

        if (response.status === 422) {
          const fieldErrors: Record<string, string> = {};
          if (Array.isArray(detail)) {
            for (const err of detail) {
              const field = err.loc?.[err.loc.length - 1] as string | undefined;
              if (field && field !== 'body') {
                fieldErrors[field] = err.msg;
              } else {
                fieldErrors._general = err.msg;
              }
            }
          } else {
            fieldErrors._general = typeof detail === 'string' ? detail : 'Registration failed';
          }
          throw new FieldValidationError(fieldErrors);
        }

        throw new Error(typeof detail === 'string' ? detail : 'Registration failed');
      }

      await response.json();
      show('Registration successful! You can now log in immediately.', 'success');
      navigate('/login');
    } catch (error) {
      if (error instanceof FieldValidationError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      show(message, 'error');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate, show]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    refreshPromise.current = null;
    navigate('/login');
  }, [navigate]);

  const stateValue = useMemo<AuthStateContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    loading,
  }), [user, isLoading, loading]);

  const actionsValue = useMemo<AuthActionsContextType>(() => ({
    login,
    register,
    logout,
    updateUser,
  }), [login, register, logout, updateUser]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};
