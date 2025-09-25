import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import { api } from '../lib/api';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  handleLogin: (username: string, password: string) => Promise<User>;
  handleLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedRefresh = localStorage.getItem('refreshToken');
      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedRefresh) setRefreshToken(savedRefresh);
    } catch {}
  }, []);

  const handleLogin = async (username: string, password: string): Promise<User> => {
    const loginUser = await api.login(username, password);
    const u: User = { id: loginUser.id, username: loginUser.username, role: loginUser.role, region: loginUser.region } as any;
    setUser({ ...u, token: loginUser.token } as any);
    setToken(loginUser.token);
    if (loginUser.refreshToken) { setRefreshToken(loginUser.refreshToken); localStorage.setItem('refreshToken', loginUser.refreshToken); }
    localStorage.setItem('token', loginUser.token);
    localStorage.setItem('user', JSON.stringify(u));
    return u;
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  };

  const value = useMemo(() => ({ user, token, handleLogin, handleLogout }), [user, token]);

  // Silent refresh (customer priority), admin strict short
  useEffect(() => {
    if (!refreshToken) return;
    let interval: any;
    const tick = async () => {
      try {
        // For admin refresh often; for staff moderate; for customer hourly
        const newAccess = await api.refreshToken(refreshToken);
        setToken(newAccess);
        localStorage.setItem('token', newAccess);
      } catch {
        // ignore; will retry later
      }
    };
    // Check cadence
    const role = (user as any)?.role || 'customer';
    const ms = role === 'admin' ? 5*60*1000 : role === 'staff' ? 15*60*1000 : 60*60*1000;
    interval = setInterval(tick, ms);
    return () => clearInterval(interval);
  }, [refreshToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


