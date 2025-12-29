'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api';
import { storage } from '@/lib/storage';

interface Player2AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const Player2AuthContext = createContext<Player2AuthContextType | undefined>(undefined);

export function Player2AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored player2 credentials on mount
    const storedAuth = storage.getPlayer2Auth();
    if (storedAuth) {
      setToken(storedAuth.token);
      setUser(storedAuth.user);
      // Verify token is still valid
      apiClient
        .getMe(storedAuth.token)
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token invalid, clear it
          storage.clearPlayer2Auth();
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.login(username, password);
      setToken(response.token);
      setUser(response.user);
      storage.savePlayer2Auth(response.token, response.user);
      return { success: true };
    } catch (error: any) {
      // Handle authentication errors gracefully without throwing
      const errorMessage = error.message || '';
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid') || errorMessage.includes('credentials')) {
        return { success: false, error: 'Invalid credentials' };
      } else if (errorMessage.includes('409') || errorMessage.includes('already exists') || errorMessage.includes('taken')) {
        return { success: false, error: 'Username already taken' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    }
  };

  const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.register(username, password);
      setToken(response.token);
      setUser(response.user);
      storage.savePlayer2Auth(response.token, response.user);
      return { success: true };
    } catch (error: any) {
      // Handle registration errors gracefully without throwing
      const errorMessage = error.message || '';
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid') || errorMessage.includes('credentials')) {
        return { success: false, error: 'Invalid credentials' };
      } else if (errorMessage.includes('409') || errorMessage.includes('already exists') || errorMessage.includes('taken')) {
        return { success: false, error: 'Username already taken' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    storage.clearPlayer2Auth();
  };

  return (
    <Player2AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </Player2AuthContext.Provider>
  );
}

export function usePlayer2Auth() {
  const context = useContext(Player2AuthContext);
  if (context === undefined) {
    throw new Error('usePlayer2Auth must be used within a Player2AuthProvider');
  }
  return context;
}

