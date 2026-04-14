import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ─── DEFINICIONES DE TIPOS ───────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'trainer';
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

type Theme = 'light' | 'dark';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        let currentStreak = profile.streak || 0;
        const lastActivityStr = profile.last_activity_date || profile.last_active;

        if (lastActivityStr) {
          const today = new Date();
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          let lastDateObj = new Date(lastActivityStr);
          if (typeof lastActivityStr === 'string' && lastActivityStr.includes('-')) {
             const parts = lastActivityStr.split('T')[0].split('-');
             if (parts.length === 3) {
                 lastDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
             }
          } else {
             lastDateObj.setHours(0,0,0,0);
          }
          
          const diffTime = todayDate.getTime() - lastDateObj.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // Si pasaron 2 o más días sin entrenar/descansar, se rompe la racha
          if (diffDays > 1 && currentStreak > 0) {
            currentStreak = 0;
            // Actualizamos en background la BD
            supabase.from('profiles').update({ streak: 0 }).eq('id', profile.id).then();
          }
        }

        const safeUser: User = {
          id: profile.id,
          name: profile.name || 'Usuario',
          email: profile.email || email,
          role: profile.role || 'client',
          membershipStatus: profile.membership_status || 'active',
          avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name || 'U'}`,
          streak: currentStreak,
          lastActive: lastActivityStr ? new Date(lastActivityStr) : new Date(),
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

  const updateUser = (userId: string, updates: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev || prev.id !== userId) return prev;
      return { ...prev, ...updates };
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      currentUser, setCurrentUser, updateUser,
      isLoggedIn, login, logout,
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