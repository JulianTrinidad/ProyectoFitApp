import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dumbbell, Users, ShoppingBag, CreditCard,
  LayoutDashboard, LogOut, Sun, Moon
} from 'lucide-react';
import { isUserAtRisk } from '@/data/mockData';
import { DashboardSection } from '@/components/dashboard/types';
import { OverviewSection } from '@/components/dashboard/OverviewSection';
import { RoutinesSection } from '@/components/dashboard/RoutinesSection';
import { ExercisesSection } from '@/components/dashboard/ExercisesSection';
import { ClientsSection } from '@/components/dashboard/ClientsSection';
import { ShopSection } from '@/components/dashboard/ShopSection';
import { PaymentsSection } from '@/components/dashboard/PaymentsSection';
import { NutritionSection } from '@/components/dashboard/NutritionSection';

export function TrainerDashboard() {
  const { logout, toggleTheme, theme, users, payments } = useApp();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  const clients = users.filter(u => u.role === 'client');
  const atRiskClients = clients.filter(isUserAtRisk);
  const pendingPayments = payments.filter(p => p.status === 'pending');

  const sidebarItems = [
    { id: 'overview' as DashboardSection, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'routines' as DashboardSection, icon: Dumbbell, label: 'Rutinas' },
    { id: 'exercises' as DashboardSection, icon: Dumbbell, label: 'Ejercicios' },
    { id: 'clients' as DashboardSection, icon: Users, label: 'Clientes' },
    { id: 'shop' as DashboardSection, icon: ShoppingBag, label: 'Tienda' },
    { id: 'payments' as DashboardSection, icon: CreditCard, label: 'Pagos' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection setActiveSection={setActiveSection} />;
      case 'routines': return <RoutinesSection />;
      case 'exercises': return <ExercisesSection />;
      case 'clients': return <ClientsSection />;
      case 'shop': return <ShopSection />;
      case 'payments': return <PaymentsSection />;
      case 'nutrition': return <NutritionSection />;
      default: return <OverviewSection setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FitPro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === item.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.id === 'payments' && pendingPayments.length > 0 && (
                <span className="ml-auto bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full">
                  {pendingPayments.length}
                </span>
              )}
              {item.id === 'clients' && atRiskClients.length > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {atRiskClients.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
            {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
}
