import React, { createContext, useContext, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';

import { storage } from '../services/storage';
import { setSessionExpiredHandler } from '../services/api';
import {
  AuthUser,
  clearAuth,
  getProfile,
  loginUser,
  logoutUser,
} from '../services/authService';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setSessionExpiredHandler(() => {
      void clearAuth();
      if (active) setUser(null);
    });

    const restoreSession = async () => {
      try {
        const token = await storage.getItem('access_token');
        if (!token) return;

        const { data: profile } = await getProfile();
        if (!active) return;

        await storage.setItem('user', JSON.stringify(profile));
        setUser(profile);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          await clearAuth();
        }
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {}
    await clearAuth();
    setUser(null);
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await storage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
