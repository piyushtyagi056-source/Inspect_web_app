import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  username: string | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

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

  const login = async (user: string, _pass?: string) => {
    // Mock authentication: accepting any non-empty username/password
    if (!user.trim()) return false;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setUsername(user);
    localStorage.setItem('gov_inspect_auth_user', user);
    return true;
  };

  const logout = () => {
    setUsername(null);
    localStorage.removeItem('gov_inspect_auth_user');
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
