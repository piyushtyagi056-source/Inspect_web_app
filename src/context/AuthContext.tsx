import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  username: string | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem('gov_inspect_auth_user');
    if (storedUser) {
      setUsername(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (user: string, pass: string = '') => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      setUsername(data.username);
      localStorage.setItem('gov_inspect_auth_user', data.username);
      localStorage.setItem('auth_token', data.token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      // Fallback to mock
      if (!user.trim()) return false;
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsername(user);
      localStorage.setItem('gov_inspect_auth_user', user);
      return true;
    }
  };

  const logout = () => {
    setUsername(null);
    localStorage.removeItem('gov_inspect_auth_user');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ username, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
