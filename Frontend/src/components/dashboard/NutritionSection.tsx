import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function NutritionSection() {
    const { users } = useApp();
    const clients = users.filter(u => u.role === 'client');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Dietas</h1>
                    <p className="text-muted-foreground">Crea y asigna planes nutricionales</p>
                </div>
                <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Dieta
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">Editor de Dieta</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Nombre del Plan</label>
                            <Input placeholder="Ej: Plan de Definición" />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Descripción</label>
                            <Textarea placeholder="Describe el objetivo y características del plan..." rows={3} />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Contenido de la Dieta</label>
                            <Textarea
                                placeholder={`Desayuno:\n- 3 huevos revueltos\n- 60g avena con leche\n- 1 banana\n\nAlmuerzo:\n- 200g pechuga de pollo\n- 150g arroz integral\n- Ensalada verde...`}
                                rows={10}
                            />
                        </div>
                        <Button variant="gradient" className="w-full">
                            Guardar Dieta
                        </Button>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">Clientes sin Dieta Asignada</h3>
                    <div className="space-y-3">
                        {clients.slice(0, 3).map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-xl object-cover" />
                                    <span className="font-medium text-foreground">{client.name}</span>
                                </div>
                                <Button size="sm" variant="secondary">Asignar</Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
