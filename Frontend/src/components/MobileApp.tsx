import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  Home, Dumbbell, Apple, User, BookOpen
} from 'lucide-react';

// Imports de los nuevos componentes modulares
import type { MobileTab, NutritionTab as NutritionTabType } from './mobile/mobileTypes';
import type { AvailableRoutine } from '@/data/mockData';
import { HomeTab } from './mobile/HomeTab';
import { WorkoutTab } from './mobile/WorkoutTab';
import { NutritionTab } from './mobile/NutritionTab';
import { RoutinesTab } from './mobile/RoutinesTab';
import { ShopTab } from './mobile/ShopTab';
import { ProfileTab } from './mobile/ProfileTab';
import { OnboardingFlow } from './mobile/OnboardingFlow';

export function MobileApp() {
  const { currentUser, updateUser, logout, toggleTheme, theme } = useApp();

  // ESTADOS GLOBALES DE NAVEGACIÓN
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  // Necesario para que el botón "Escanear" del Home lleve directo al scanner
  const [nutritionTab, setNutritionTab] = useState<NutritionTabType>('diet');
  // Custom routines created by the user
  const [customRoutines, setCustomRoutines] = useState<AvailableRoutine[]>([]);
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);
  // Daily missions state
  const [waterIntake, setWaterIntake] = useState(0);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  const [hasRestedToday, setHasRestedToday] = useState(false);

  const handleOnboardingComplete = (generatedRoutine: AvailableRoutine) => {
    setShowOnboarding(false);
    setCustomRoutines(prev => [...prev, generatedRoutine]);
  };

  // RENDERIZADO DE CONTENIDO
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            setNutritionTab={setNutritionTab}
            waterIntake={waterIntake}
            hasTrainedToday={hasTrainedToday}
            hasRestedToday={hasRestedToday}
          />
        );
      case 'workout':
        return (
          <WorkoutTab
            currentUser={currentUser}
            updateUser={updateUser}
            customRoutines={customRoutines}
            setHasTrainedToday={setHasTrainedToday}
            setHasRestedToday={setHasRestedToday}
          />
        );
      case 'nutrition':
        return (
          <NutritionTab
            currentUser={currentUser}
            updateUser={updateUser}
            initialTab={nutritionTab}
            waterIntake={waterIntake}
            setWaterIntake={setWaterIntake}
          />
        );
      case 'routines':
        return <RoutinesTab currentUser={currentUser} customRoutines={customRoutines} setCustomRoutines={setCustomRoutines} />;
      case 'shop':
        return <ShopTab />;
      case 'profile':
        return (
          <ProfileTab
            currentUser={currentUser}
            updateUser={updateUser}
            toggleTheme={toggleTheme}
            theme={theme}
            logout={logout}
          />
        );
      default:
        return (
          <HomeTab
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            setNutritionTab={setNutritionTab}
            waterIntake={waterIntake}
            hasTrainedToday={hasTrainedToday}
            hasRestedToday={hasRestedToday}
          />
        );
    }
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-background">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/95 backdrop-blur-lg border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around">
          {[
            { id: 'home' as MobileTab, icon: Home, label: 'Inicio' },
            { id: 'nutrition' as MobileTab, icon: Apple, label: 'Nutrición' },
            { id: 'workout' as MobileTab, icon: Dumbbell, label: 'Entrenar' },
            { id: 'routines' as MobileTab, icon: Dumbbell, label: 'Ejercicios' },
            { id: 'profile' as MobileTab, icon: User, label: 'Perfil' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'nav-item-active' : 'text-muted-foreground'}`}
            >
              {item.id === 'workout' ? (
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center -mt-4 shadow-lg glow-primary">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}