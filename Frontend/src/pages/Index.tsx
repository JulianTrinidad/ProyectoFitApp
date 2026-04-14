import { useApp } from '@/contexts/AppContext';
import { LoginScreen } from '@/components/LoginScreen';
import { MobileApp } from '@/components/MobileApp';

const Index = () => {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileApp />
    </div>
  );
};

export default Index;
