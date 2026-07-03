import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../utils/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('owwa_token');
    const storedUser = localStorage.getItem('owwa_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('owwa_token');
        localStorage.removeItem('owwa_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password);
    localStorage.setItem('owwa_token', data.token);
    localStorage.setItem('owwa_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('owwa_token');
    localStorage.removeItem('owwa_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data);
      localStorage.setItem('owwa_user', JSON.stringify(data));
    } catch {
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
