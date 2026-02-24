import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUsers, mockPayments, Payment } from '@/data/mockData';

type ViewMode = 'trainer' | 'client';
type Theme = 'light' | 'dark';

interface AppContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  updateUser: (userId: string, updates: Partial<User>) => void;
  payments: Payment[];
  updatePayment: (paymentId: string, status: Payment['status']) => void;
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [theme, setTheme] = useState<Theme>('light');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[1]); // Default to client
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const updatePayment = (paymentId: string, status: Payment['status']) => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
  };

  const login = (email: string, password: string): boolean => {
    // Simulated login
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setViewMode(user.role);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(mockUsers[1]);
    setViewMode('client');
  };

  return (
    <AppContext.Provider value={{
      viewMode,
      setViewMode,
      theme,
      toggleTheme,
      currentUser,
      setCurrentUser,
      users,
      updateUser,
      payments,
      updatePayment,
      isLoggedIn,
      login,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
