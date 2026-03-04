import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dumbbell, Users, Search, Plus, Edit, Trash2,
    GripVertical, ChevronDown, ChevronUp
} from 'lucide-react';
import { mockExercises, mockRoutines, mockUsers, Routine } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface ModalExercise {
    id: string;
    name: string;
    sets: number;
    reps: string;
}

export function RoutinesSection() {
    const { toast } = useToast();
    const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
    const [routineName, setRoutineName] = useState('');
    const [modalExercises, setModalExercises] = useState<ModalExercise[]>([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState('');

    const clients = mockUsers.filter(u => u.role === 'client');

    const handleOpenCreate = () => {
        setSelectedRoutine(null);
        setRoutineName('');
        setModalExercises([]);
        setSelectedExerciseId('');
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (routine: Routine) => {
        setSelectedRoutine(routine);
        setRoutineName(routine.name);
        setModalExercises(
            routine.exercises.map(re => {
                const ex = mockExercises.find(e => e.id === re.exerciseId);
                return {
                    id: re.exerciseId,
                    name: ex?.name ?? 'Ejercicio desconocido',
                    sets: re.sets,
                    reps: re.reps,
                };
            })
        );
        setSelectedExerciseId('');
        setIsCreateModalOpen(true);
    };

    const handleOpenAssign = (routine: Routine) => {
        setSelectedRoutine(routine);
        setIsAssignModalOpen(true);
    };

    const handleAddExercise = () => {
        if (!selectedExerciseId) return;
        const exercise = mockExercises.find(e => e.id === selectedExerciseId);
        if (!exercise) return;

        setModalExercises(prev => [...prev, {
            id: exercise.id,
            name: exercise.name,
            sets: 4,
            reps: '10',
        }]);
        setSelectedExerciseId('');
    };

    const handleUpdateExercise = (index: number, field: 'sets' | 'reps', value: string) => {
        setModalExercises(prev => prev.map((ex, i) => {
            if (i !== index) return ex;
            if (field === 'sets') return { ...ex, sets: Math.max(1, parseInt(value) || 1) };
            return { ...ex, reps: value };
        }));
    };

    const handleRemoveExercise = (index: number) => {
        setModalExercises(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        console.log('Rutina guardada:', { name: routineName, exercises: modalExercises });
        toast({
            title: selectedRoutine ? "Rutina actualizada ✅" : "Rutina creada ✅",
            description: selectedRoutine
                ? `"${routineName}" se ha guardado correctamente`
                : `"${routineName}" se ha creado correctamente`,
        });
        setIsCreateModalOpen(false);
        setSelectedRoutine(null);
        setRoutineName('');
        setModalExercises([]);
    };

    const handleAssignToClient = (clientName: string) => {
        toast({
            title: "Rutina asignada ✅",
            description: `"${selectedRoutine?.name}" asignada a ${clientName}`,
        });
        setIsAssignModalOpen(false);
        setSelectedRoutine(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Constructor de Rutinas</h1>
                    <p className="text-muted-foreground">Crea y gestiona planes de entrenamiento</p>
                </div>
                <Button variant="gradient" onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Rutina
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exercises Library */}
                <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-4">
                    <h3 className="font-semibold text-foreground mb-4">Biblioteca de Ejercicios</h3>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar ejercicio..." className="pl-10" />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {mockExercises.slice(0, 6).map((exercise) => (
                            <div key={exercise.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-grab hover:bg-muted transition-colors">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <img src={exercise.image} alt={exercise.name} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate">{exercise.name}</p>
                                    <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Routines List */}
                <div className="lg:col-span-2 space-y-4">
                    {mockRoutines.map((routine) => (
                        <div key={routine.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                            <button
                                onClick={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Dumbbell className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-foreground">{routine.name}</h3>
                                        <p className="text-sm text-muted-foreground">{routine.exercises.length} ejercicios • {routine.assignedTo.length} asignados</p>
                                    </div>
                                </div>
                                {expandedRoutine === routine.id ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </button>
                            {expandedRoutine === routine.id && (
                                <div className="px-4 pb-4 border-t border-border pt-4 animate-fade-in">
                                    <div className="space-y-2">
                                        {routine.exercises.map((re, idx) => {
                                            const exercise = mockExercises.find(e => e.id === re.exerciseId);
                                            return exercise ? (
                                                <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">{idx + 1}</span>
                                                    <span className="flex-1 text-sm text-foreground">{exercise.name}</span>
                                                    <span className="text-xs text-muted-foreground">{re.sets} x {re.reps}</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenEdit(routine)}>
                                            <Edit className="w-4 h-4 mr-1" />
                                            Editar
                                        </Button>
                                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleOpenAssign(routine)}>
                                            <Users className="w-4 h-4 mr-1" />
                                            Asignar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Create / Edit Routine Modal — Exercise Builder */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedRoutine ? 'Editar Rutina' : 'Crear Nueva Rutina'}</DialogTitle>
                        <DialogDescription>
                            {selectedRoutine
                                ? 'Modifica los datos y ejercicios de la rutina'
                                : 'Nombra tu rutina y agrega ejercicios'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5">
                        {/* Routine Name */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Nombre de la Rutina
                            </label>
                            <Input
                                placeholder="Ej: Fuerza Full Body"
                                value={routineName}
                                onChange={(e) => setRoutineName(e.target.value)}
                            />
                        </div>

                        {/* Exercise Selector */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Agregar Ejercicio
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedExerciseId}
                                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                                    className="flex-1 h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Seleccionar ejercicio...</option>
                                    {mockExercises.map(ex => (
                                        <option key={ex.id} value={ex.id}>
                                            {ex.name} — {ex.muscleGroup}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleAddExercise}
                                    disabled={!selectedExerciseId}
                                    className="h-10 px-4"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Agregar
                                </Button>
                            </div>
                        </div>

                        {/* Exercise Builder List */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Ejercicios en la Rutina
                                {modalExercises.length > 0 && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                        ({modalExercises.length} {modalExercises.length === 1 ? 'ejercicio' : 'ejercicios'})
                                    </span>
                                )}
                            </label>
                            {modalExercises.length === 0 ? (
                                <div className="flex items-center justify-center p-6 bg-muted/30 rounded-xl border border-dashed border-border">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Aún no hay ejercicios.<br />
                                        <span className="text-xs">Usa el selector de arriba para agregar.</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {modalExercises.map((ex, idx) => (
                                        <div
                                            key={`${ex.id}-${idx}`}
                                            className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/50"
                                        >
                                            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="flex-1 text-sm font-medium text-foreground truncate">
                                                {ex.name}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={ex.sets}
                                                    onChange={(e) => handleUpdateExercise(idx, 'sets', e.target.value)}
                                                    className="w-14 h-8 text-center text-xs px-1"
                                                    title="Series"
                                                />
                                                <span className="text-xs text-muted-foreground">×</span>
                                                <Input
                                                    value={ex.reps}
                                                    onChange={(e) => handleUpdateExercise(idx, 'reps', e.target.value)}
                                                    className="w-16 h-8 text-center text-xs px-1"
                                                    placeholder="Reps"
                                                    title="Repeticiones"
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                                                onClick={() => handleRemoveExercise(idx)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setSelectedRoutine(null);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="gradient"
                                className="flex-1"
                                onClick={handleSave}
                                disabled={!routineName.trim() || modalExercises.length === 0}
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Routine Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar "{selectedRoutine?.name}" a Cliente</DialogTitle>
                        <DialogDescription>
                            Selecciona el cliente al que deseas asignar esta rutina
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {clients.map((client) => (
                            <div
                                key={client.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={client.avatar}
                                        alt={client.name}
                                        className="w-10 h-10 rounded-xl object-cover"
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">{client.name}</p>
                                        <p className="text-xs text-muted-foreground">{client.email}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleAssignToClient(client.name)}
                                >
                                    Asignar
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
