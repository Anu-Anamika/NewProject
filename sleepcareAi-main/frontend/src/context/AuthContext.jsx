import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginApi, registerApi, logoutApi, getCsrfToken } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and prefetch CSRF cookie
  const checkAuth = useCallback(async () => {
    try {
      // Ensure CSRF token is available
      await getCsrfToken();
      const data = await getCurrentUser();
      if (data && data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username, password) => {
    const data = await loginApi(username, password);
    if (data && data.authenticated && data.user) {
      setUser(data.user);
      return data.user;
    }
    throw new Error('Authentication failed.');
  };

  const register = async (userData) => {
    const data = await registerApi(userData);
    if (data && data.authenticated && data.user) {
      setUser(data.user);
      return data.user;
    }
    throw new Error('Registration failed.');
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
