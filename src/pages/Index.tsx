import { useApp } from '@/contexts/AppContext';
import { LoginScreen } from '@/components/LoginScreen';
import { MobileApp } from '@/components/MobileApp';
import { TrainerDashboard } from '@/components/TrainerDashboard';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isLoggedIn, viewMode, setViewMode, currentUser, setCurrentUser } = useApp();
  const { users } = useApp();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      {viewMode === 'trainer' ? <TrainerDashboard /> : <MobileApp />}
    </div>
  );
};

export default Index;
