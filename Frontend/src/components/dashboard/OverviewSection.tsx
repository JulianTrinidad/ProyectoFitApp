import { Button } from '@/components/ui/button';
import {
    Dumbbell, Users, CreditCard,
    Plus, ChevronRight, MessageCircle, AlertCircle
} from 'lucide-react';
import { mockRoutines, isUserAtRisk, User } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { DashboardSection } from './dashboardTypes';

interface OverviewSectionProps {
    setActiveSection: (section: DashboardSection) => void;
}

export function OverviewSection({ setActiveSection }: OverviewSectionProps) {
    const { users, payments } = useApp();

    const clients = users.filter(u => u.role === 'client');
    const atRiskClients = clients.filter(isUserAtRisk);
    const pendingPayments = payments.filter(p => p.status === 'pending');

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Bienvenido, Carlos 👋</h1>
                <p className="text-muted-foreground">Aquí está el resumen de tu gimnasio</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">Clientes Activos</p>
                            <p className="text-3xl font-bold text-foreground">{clients.filter(c => c.membershipStatus === 'active').length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">Rutinas Creadas</p>
                            <p className="text-3xl font-bold text-foreground">{mockRoutines.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-accent" />
                        </div>
                    </div>
                </div>
                <div className="stat-card border-l-4 border-l-warning">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">Pagos Pendientes</p>
                            <p className="text-3xl font-bold text-warning">{pendingPayments.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-warning" />
                        </div>
                    </div>
                </div>
                <div className="stat-card border-l-4 border-l-destructive">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">En Riesgo</p>
                            <p className="text-3xl font-bold text-destructive">{atRiskClients.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-destructive" />
                        </div>
                    </div>
                </div>
            </div>

            {/* At Risk Clients */}
            {atRiskClients.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <h2 className="text-lg font-semibold text-foreground">Clientes en Riesgo de Abandono</h2>
                    </div>
                    <div className="space-y-3">
                        {atRiskClients.map((client) => {
                            const daysSince = Math.floor((Date.now() - client.lastActive.getTime()) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-xl object-cover" />
                                            <div className="absolute -top-1 -right-1 risk-indicator" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{client.name}</p>
                                            <p className="text-sm text-muted-foreground">{daysSince} días sin entrenar</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <MessageCircle className="w-4 h-4 mr-1" />
                                        Mensaje
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setActiveSection('routines')}
                    className="p-6 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all text-left group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Crear Nueva Rutina</p>
                                <p className="text-sm text-muted-foreground">Diseña un plan personalizado</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </button>
                <button
                    onClick={() => setActiveSection('payments')}
                    className="p-6 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all text-left group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                                <CreditCard className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Validar Pagos</p>
                                <p className="text-sm text-muted-foreground">{pendingPayments.length} pendientes de revisión</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </button>
            </div>
        </div>
    );
}
