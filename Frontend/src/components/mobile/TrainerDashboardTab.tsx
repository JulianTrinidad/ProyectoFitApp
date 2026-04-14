import { useState, useEffect } from 'react';
import { Loader2, MessageCircle, Plus, Flame, Users, X, Dumbbell, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ─── TIPOS ─────────────────────────────────────────────────────────────

interface TrainerClient {
    id: string;
    name: string;
    email: string;
    avatar: string;
    streak: number;
    phone: string;
}

interface TrainerRoutine {
    id: string;
    name: string;
}

interface TrainerDashboardTabProps {
    currentUser: any;
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────

export function TrainerDashboardTab({ currentUser }: TrainerDashboardTabProps) {
    const { toast } = useToast();

    const [clients, setClients] = useState<TrainerClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Routine assignment
    const [trainerRoutines, setTrainerRoutines] = useState<TrainerRoutine[]>([]);
    const [clientRoutines, setClientRoutines] = useState<TrainerRoutine[]>([]);
    const [assignTarget, setAssignTarget] = useState<TrainerClient | null>(null);
    const [assigningRoutineId, setAssigningRoutineId] = useState<string | null>(null);
    const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
    const [isLoadingClientRoutines, setIsLoadingClientRoutines] = useState(false);
    const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);

    // ── Fetch clients del entrenador ──
    useEffect(() => {
        const fetchClients = async () => {
            try {
                setIsLoading(true);

                // 1. Obtener IDs de clientes desde trainer_clients
                const { data: relations, error: relError } = await supabase
                    .from('trainer_clients')
                    .select('client_id')
                    .eq('trainer_id', currentUser.id);

                if (relError) throw relError;
                if (!relations || relations.length === 0) {
                    setClients([]);
                    return;
                }

                const clientIds = relations.map(r => r.client_id);

                // 2. Obtener perfiles de esos clientes
                const { data: profiles, error: profError } = await supabase
                    .from('profiles')
                    .select('id, name, email, avatar, streak, medical_record')
                    .in('id', clientIds);

                if (profError) throw profError;

                const mapped: TrainerClient[] = (profiles || []).map(p => {
                    let phone = '';
                    if (p.medical_record && typeof p.medical_record === 'object') {
                        phone = (p.medical_record as any).personalPhone || '';
                    }
                    return {
                        id: p.id,
                        name: p.name || 'Sin nombre',
                        email: p.email || '',
                        avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&size=64&background=FF6B35&color=fff`,
                        streak: p.streak || 0,
                        phone,
                    };
                });

                setClients(mapped);
            } catch (err: any) {
                console.error('Error fetching trainer clients:', err);
                toast({ title: '❌ Error', description: 'No se pudieron cargar los clientes.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUser?.id) fetchClients();
    }, [currentUser?.id]);

    // ── Abrir dialog de gestión de rutinas ──
    const openAssignDialog = async (client: TrainerClient) => {
        setAssignTarget(client);
        setIsLoadingRoutines(true);
        setIsLoadingClientRoutines(true);
        try {
            // Rutinas del entrenador
            const { data: tData, error: tError } = await supabase
                .from('routines')
                .select('id, name')
                .eq('user_id', currentUser.id);
            if (tError) throw tError;
            setTrainerRoutines(tData || []);

            // Rutinas activas del cliente
            const { data: cData, error: cError } = await supabase
                .from('routines')
                .select('id, name')
                .eq('user_id', client.id);
            if (cError) throw cError;
            setClientRoutines(cData || []);
        } catch (err: any) {
            console.error('Error fetching routines:', err);
            toast({ title: '❌ Error', description: 'No se pudieron cargar las rutinas.', variant: 'destructive' });
        } finally {
            setIsLoadingRoutines(false);
            setIsLoadingClientRoutines(false);
        }
    };

    // ── Exportar rutina al cliente ──
    const handleAssignRoutine = async (routineId: string) => {
        if (!assignTarget) return;

        try {
            setAssigningRoutineId(routineId);

            // 1. Obtener ejercicios de la rutina original
            const { data: exercises, error: exError } = await supabase
                .from('routine_exercises')
                .select('exercise_id, sets, reps, order_index')
                .eq('routine_id', routineId);
            if (exError) throw exError;

            // 2. Obtener nombre de la rutina
            const routine = trainerRoutines.find(r => r.id === routineId);
            const routineName = routine?.name || 'Rutina asignada';

            // 3. Crear nueva rutina para el cliente
            const newId = crypto.randomUUID();
            const { error: insertError } = await supabase
                .from('routines')
                .insert({
                    id: newId,
                    name: `${routineName}`,
                    user_id: assignTarget.id,
                });
            if (insertError) throw insertError;

            // 4. Copiar ejercicios
            if (exercises && exercises.length > 0) {
                const rows = exercises.map(ex => ({
                    routine_id: newId,
                    exercise_id: ex.exercise_id,
                    sets: ex.sets,
                    reps: ex.reps,
                    order_index: ex.order_index,
                }));
                const { error: exInsertError } = await supabase
                    .from('routine_exercises')
                    .insert(rows);
                if (exInsertError) throw exInsertError;
            }

            toast({ title: '✅ Rutina exportada', description: `"${routineName}" asignada a ${assignTarget.name}` });
            setClientRoutines(prev => [...prev, { id: newId, name: routineName }]);
        } catch (err: any) {
            console.error('Error assigning routine:', err);
            toast({ title: '❌ Error', description: err.message || 'No se pudo asignar la rutina.', variant: 'destructive' });
        } finally {
            setAssigningRoutineId(null);
        }
    };

    // ── Eliminar rutina del cliente ──
    const handleDeleteClientRoutine = async (routineId: string) => {
        try {
            setDeletingRoutineId(routineId);

            // Borrar ejercicios de la rutina (si no hay cascade)
            const { error: exError } = await supabase
                .from('routine_exercises')
                .delete()
                .eq('routine_id', routineId);
            if (exError) throw exError;

            // Borrar rutina
            const { error } = await supabase
                .from('routines')
                .delete()
                .eq('id', routineId);
            if (error) throw error;

            setClientRoutines(prev => prev.filter(r => r.id !== routineId));
            toast({ title: '🗑️ Rutina eliminada', description: 'Se ha eliminado la rutina del cliente.' });
        } catch (err: any) {
            console.error('Error deleting routine:', err);
            toast({ title: '❌ Error', description: 'No se pudo eliminar la rutina.', variant: 'destructive' });
        } finally {
            setDeletingRoutineId(null);
        }
    };

    // ── Abrir WhatsApp ──
    const openWhatsApp = async (clientId: string, clientName: string) => {
        try {
            // Petición a la base de datos para obtener el medical_record actualizado
            const { data, error } = await supabase
                .from('profiles')
                .select('medical_record')
                .eq('id', clientId)
                .single();

            if (error) throw error;

            let phone = '';
            if (data?.medical_record) {
                let mr = data.medical_record;
                // Si la base de datos devuelve un string, lo parseamos
                if (typeof mr === 'string') {
                    try { mr = JSON.parse(mr); } catch (e) { console.error('Error parsing JSON'); }
                }
                phone = mr.personalPhone || '';
            }

            if (!phone) {
                toast({ title: '📱 Sin teléfono', description: `${clientName} no tiene número registrado en la ficha médica.` });
                return;
            }

            // Limpiar el número (solo dígitos)
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');

        } catch (err: any) {
            console.error('Error al obtener el teléfono:', err);
            toast({ title: '❌ Error', description: 'No se pudo obtener el teléfono del cliente.', variant: 'destructive' });
        }
    };

    // ─── RENDERIZADO ───────────────────────────────────────────────────

    return (
        <div className="p-4 space-y-6 animate-fade-in pb-24">
            {/* ── CABECERA ── */}
            <div>
                <div className="flex items-center gap-2.5 mb-1">
                    <Users className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>
                <p className="text-sm text-muted-foreground">Gestión de tus clientes</p>
            </div>

            {/* ── STATS RÁPIDOS ── */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <p className="text-2xl font-black text-primary">{clients.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Clientes activos</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <p className="text-2xl font-black text-orange-500">
                        {clients.reduce((max, c) => Math.max(max, c.streak), 0)}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">Mayor racha 🔥</p>
                </div>
            </div>

            {/* ── LISTA DE CLIENTES ── */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Mis Clientes</h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                ) : clients.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-2xl">
                        <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No tenés clientes asignados aún</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {clients.map(client => (
                            <div
                                key={client.id}
                                className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm hover:border-primary/30 transition-colors"
                            >
                                {/* 1. Foto de perfil */}
                                <img
                                    src={client.avatar}
                                    alt={client.name}
                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-primary/20"
                                />

                                {/* Nombre */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground leading-tight truncate">{client.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{client.email}</p>
                                </div>

                                {/* 2. WhatsApp */}
                                <button
                                    onClick={() => openWhatsApp(client.id, client.name)}
                                    className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                                    title="WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                                </button>

                                {/* 3. Racha */}
                                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 flex-shrink-0" title="Racha de días">
                                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tabular-nums">{client.streak}</span>
                                </div>

                                {/* 4. Exportar rutina */}
                                <button
                                    onClick={() => openAssignDialog(client)}
                                    className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
                                    title="Asignar rutina"
                                >
                                    <Plus className="w-4 h-4 text-primary" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── DIALOG: GESTIÓN DE RUTINAS ── */}
            <Dialog open={!!assignTarget} onOpenChange={(open) => { if (!open) { setAssignTarget(null); setAssigningRoutineId(null); setDeletingRoutineId(null); } }}>
                <DialogContent className="max-w-[90vw] rounded-3xl p-5 max-h-[85vh] flex flex-col">
                    <h2 className="text-lg font-bold">Gestión de Rutinas</h2>
                    {assignTarget && (
                        <p className="text-sm text-muted-foreground -mt-1">
                            Cliente: <span className="font-semibold text-foreground">{assignTarget.name}</span>
                        </p>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-6 mt-3 pr-1">

                        {/* ── RUTINAS ACTIVAS DEL CLIENTE ── */}
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Rutinas Activas del Cliente</h3>
                            {isLoadingClientRoutines ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : clientRoutines.length === 0 ? (
                                <div className="p-4 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                                    <p className="text-sm text-muted-foreground">El cliente no tiene rutinas asignadas</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {clientRoutines.map(routine => (
                                        <div key={routine.id} className="w-full p-3 rounded-2xl border border-border flex items-center gap-3 bg-card shadow-sm">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <Dumbbell className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <p className="font-semibold text-sm flex-1">{routine.name}</p>
                                            <button
                                                onClick={() => handleDeleteClientRoutine(routine.id)}
                                                disabled={deletingRoutineId === routine.id}
                                                className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                                                title="Eliminar rutina"
                                            >
                                                {deletingRoutineId === routine.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── ASIGNAR NUEVA RUTINA ── */}
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Asignar Nueva Rutina</h3>
                            {isLoadingRoutines ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : trainerRoutines.length === 0 ? (
                                <div className="p-4 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                                    <p className="text-sm text-muted-foreground">No tenés rutinas creadas para exportar</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {trainerRoutines.map(routine => (
                                        <button
                                            key={routine.id}
                                            onClick={() => handleAssignRoutine(routine.id)}
                                            disabled={assigningRoutineId === routine.id}
                                            className="w-full p-3.5 rounded-2xl border border-border text-left hover:bg-primary/5 transition-colors flex items-center gap-3 disabled:opacity-50"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Plus className="w-4 h-4 text-primary" />
                                            </div>
                                            <p className="font-semibold text-sm flex-1">{routine.name}</p>
                                            {assigningRoutineId === routine.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
