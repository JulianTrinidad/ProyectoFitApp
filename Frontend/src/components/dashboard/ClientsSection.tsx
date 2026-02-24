import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, Eye, MessageCircle, TrendingUp, Check
} from 'lucide-react';
import { mockRoutines, isUserAtRisk, User } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function ClientsSection() {
    const { users, updateUser } = useApp();
    const { toast } = useToast();

    const clients = users.filter(u => u.role === 'client');

    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [clientNotes, setClientNotes] = useState('');

    const handleOpenChat = (client: User) => {
        setSelectedClient(client);
        setIsChatOpen(true);
    };

    const handleSaveNotes = () => {
        if (selectedClient) {
            updateUser(selectedClient.id, { notes: clientNotes });
            toast({ title: "Notas guardadas ✅" });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
                    <p className="text-muted-foreground">Gestiona y supervisa a tus alumnos</p>
                </div>
                <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Cliente
                </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Última Actividad</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => {
                                const atRisk = isUserAtRisk(client);
                                const assignedRoutine = mockRoutines.find(r => r.assignedTo.includes(client.id));
                                const daysSince = Math.floor((Date.now() - client.lastActive.getTime()) / (1000 * 60 * 60 * 24));

                                return (
                                    <tr key={client.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-xl object-cover" />
                                                    {atRisk && <div className="absolute -top-1 -right-1 risk-indicator" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{client.name}</p>
                                                    <p className="text-sm text-muted-foreground">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-foreground">{assignedRoutine?.name || '—'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${client.membershipStatus === 'active'
                                                ? 'bg-success/10 text-success'
                                                : 'bg-warning/10 text-warning'
                                                }`}>
                                                {client.membershipStatus === 'active' ? 'Activo' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-sm ${atRisk ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {daysSince === 0 ? 'Hoy' : `Hace ${daysSince} días`}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {atRisk && (
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(client)}>
                                                        <MessageCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedClient(client);
                                                        setClientNotes(client.notes);
                                                        setIsClientModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="secondary">
                                                    Asignar Plan
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Client Detail Modal */}
            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ficha del Cliente</DialogTitle>
                    </DialogHeader>
                    {selectedClient && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <img src={selectedClient.avatar} alt={selectedClient.name} className="w-16 h-16 rounded-2xl object-cover" />
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">{selectedClient.name}</h3>
                                    <p className="text-muted-foreground">{selectedClient.email}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">Notas Privadas</label>
                                <Textarea
                                    value={clientNotes}
                                    onChange={(e) => setClientNotes(e.target.value)}
                                    placeholder="Escribe notas sobre lesiones, objetivos, preferencias..."
                                    rows={4}
                                />
                                <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
                                    Guardar Notas
                                </Button>
                            </div>

                            {/* Progress Chart Placeholder */}
                            <div>
                                <h4 className="text-sm font-medium text-foreground mb-3">Progreso</h4>
                                <div className="h-48 bg-muted rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">Gráfico de progreso próximamente</span>
                                </div>
                            </div>

                            {/* Before/After */}
                            {selectedClient.progressPhotos.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-foreground mb-3">Antes vs Después</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground text-center">Antes</p>
                                            <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden">
                                                <img src={selectedClient.progressPhotos[0].before} alt="Antes" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground text-center">Después</p>
                                            <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden">
                                                <img src={selectedClient.progressPhotos[0].after} alt="Después" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Chat Drawer */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedClient && (
                                <>
                                    <img src={selectedClient.avatar} alt={selectedClient.name} className="w-8 h-8 rounded-full" />
                                    Chat con {selectedClient.name}
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="h-64 bg-muted/50 rounded-xl p-4 flex items-center justify-center">
                            <p className="text-muted-foreground text-center">
                                Los mensajes aparecerán aquí<br />
                                <span className="text-xs">(Simulación)</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Escribe un mensaje..." className="flex-1" />
                            <Button variant="gradient">Enviar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
