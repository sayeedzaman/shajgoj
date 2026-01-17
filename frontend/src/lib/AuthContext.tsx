'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authAPI } from '@/src/lib/api';
import type { User, LoginRequest, SignupRequest } from '@/src/types/index';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileFetchInProgress = useRef(false);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('No token found on mount');
        setLoading(false);
        return;
      }

      if (profileFetchInProgress.current) {
        return; // Prevent duplicate fetch
      }

      console.log('Token found, validating session...');
      profileFetchInProgress.current = true;
      try {
        const user = await authAPI.getProfile();
        console.log('Session validated successfully:', user);
        setUser(user);
      } catch (err) {
        console.error('Session validation failed:', err);
        // Only remove token if it's truly invalid (401/403), not network errors
        if (err instanceof Error && err.message.includes('401')) {
          console.log('Token is invalid, removing...');
          localStorage.removeItem('token');
        } else {
          console.log('Network or other error, keeping token');
        }
        setUser(null);
      } finally {
        setLoading(false);
        profileFetchInProgress.current = false;
      }
    };

    checkAuth();
  }, []);

  // Listen for storage events to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue === null) {
          // Token was removed (logout in another tab)
          setUser(null);
        } else if (e.newValue !== e.oldValue && !profileFetchInProgress.current) {
          // Token was added or changed (login in another tab)
          profileFetchInProgress.current = true;
          authAPI.getProfile()
            .then(user => setUser(user))
            .catch(() => {
              localStorage.removeItem('token');
              setUser(null);
            })
            .finally(() => {
              profileFetchInProgress.current = false;
            });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Login attempt starting...');
      const response = await authAPI.login(credentials);

      console.log('Login successful, saving token and user:', response.user);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      console.log('User state updated, token saved to localStorage');
    } catch (err) {
      console.error('Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupRequest) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.signup(data);

      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};