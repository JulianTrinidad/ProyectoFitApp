import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ─── DEFINICIONES DE TIPOS ───────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'trainer' | 'client';
  avatar?: string;
  streak?: number;
  membershipStatus?: 'active' | 'pending';
  lastActive: Date;
  notes?: string;
  progressPhotos?: any[];
  assignedPlan?: string;
  workoutCalendar?: any[];
  ranked?: {
    league: 'Hierro' | 'Bronce' | 'Plata' | 'Oro' | 'Esmeralda' | 'Diamante';
    division: 1 | 2 | 3 | 4 | 5;
    currentPoints: number;
    maxPoints: number;
  };
  onboardingCompleted?: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected';
  method: string;
}

type ViewMode = 'trainer' | 'client';
type Theme = 'light' | 'dark';

interface AppContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  updateUser: (userId: string, updates: Partial<User>) => void;
  payments: Payment[];
  updatePayment: (paymentId: string, status: Payment['status']) => void;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const updatePayment = (paymentId: string, status: Payment['status']) => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const safeUser: User = {
          id: profile.id,
          name: profile.name || 'Usuario',
          email: profile.email || email,
          role: profile.role || 'client',
          membershipStatus: profile.membership_status || 'active',
          avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name || 'U'}`,
          streak: profile.streak || 0,
          lastActive: profile.last_active ? new Date(profile.last_active) : new Date(),
          notes: profile.notes || '',
          progressPhotos: profile.progress_photos || [],
          assignedPlan: profile.assigned_plan || '',
          workoutCalendar: profile.workout_calendar || [],
          ranked: profile.ranked || {
            league: 'Hierro',
            division: 5,
            currentPoints: 0,
            maxPoints: 100
          },
          onboardingCompleted: profile.onboarding_completed || false,
        };
        setCurrentUser(safeUser);
        setViewMode(safeUser.role);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email || '');
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Error: " + error.message);
      return false;
    }
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email || '');
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setViewMode('client');
  };

  return (
    <AppContext.Provider value={{
      viewMode, setViewMode, theme, toggleTheme,
      currentUser, setCurrentUser, users, updateUser,
      payments, updatePayment, isLoggedIn, login, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}