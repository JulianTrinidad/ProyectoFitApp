import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, BookOpen, ArrowLeft, CheckCircle2, XCircle, Dumbbell, Plus, Search, X, ListOrdered, Loader2 } from 'lucide-react';
import type { RoutineView } from './mobileTypes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

// ─── DEFINICIONES DE TIPOS LOCALES ─────────────────────────────────────

/**
 * Representa una variante técnica de un ejercicio base.
 */
interface VariantItem {
    name: string;
    image: string;
    biomechanics: string;
    tips: string[];
    commonErrors: string[];
    executionSteps?: string[];
}

/**
 * Estructura completa de un ejercicio en la enciclopedia.
 */
interface ExerciseItem {
    id: string;
    name: string;
    subtitle: string;
    image: string;
    muscleGroup: string;
    biomechanics: string;
    tips: string[];
    commonErrors: string[];
    executionSteps?: string[];
    variants: VariantItem[];
}

/**
 * Agrupación de ejercicios por categorías (ej: Tren Superior).
 */
interface ExerciseCategory {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    exercises: ExerciseItem[];
}

/**
 * Estructura de una rutina personalizada creada por el usuario.
 */
interface AvailableRoutine {
    id: string;
    name: string;
    shortName: string;
    emoji: string;
    exercises: any[];
}

// ── Categorías de ejercicios con imágenes de alta calidad ──
const CATEGORIES = [
    { id: 'upper', title: 'TREN SUPERIOR', subtitle: 'Torso y brazos completos', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80&fit=crop' },
    { id: 'lower', title: 'TREN INFERIOR', subtitle: 'Piernas y glúteos', image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&q=80&fit=crop' },
    { id: 'core', title: 'CORE Y ABDOMEN', subtitle: 'Estabilidad y centro', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80&fit=crop' },
    { id: 'mob-upper', title: 'MOVILIDAD SUPERIOR', subtitle: 'Flexibilidad de torso', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop' },
    { id: 'mob-lower', title: 'MOVILIDAD INFERIOR', subtitle: 'Flexibilidad de piernas', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&fit=crop' },
];

interface SupabaseUserRoutine {
    id: string;
    name: string;
    duration_minutes?: number;
}

interface SupabaseExercise {
    id: string;
    name: string;
    category: string;
    muscle_subgroup: string | null;
    image_url: string | null;
    biomechanics: string | null;
    instructions: string[] | null;
    tips: string[] | null;
    common_errors: string[] | null;
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────

interface RoutinesTabProps {
    currentUser: any;
    customRoutines: AvailableRoutine[];
    setCustomRoutines: React.Dispatch<React.SetStateAction<AvailableRoutine[]>>;
}

export function RoutinesTab({ currentUser, customRoutines, setCustomRoutines }: RoutinesTabProps) {
    const { toast } = useToast();

    // ── Supabase-driven states ──
    const [userRoutines, setUserRoutines] = useState<SupabaseUserRoutine[]>([]);
    const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
    const [categoryExercises, setCategoryExercises] = useState<SupabaseExercise[]>([]);
    const [selectedSupabaseExercise, setSelectedSupabaseExercise] = useState<SupabaseExercise | null>(null);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [allExercises, setAllExercises] = useState<SupabaseExercise[]>([]);
    const [isLoadingAllExercises, setIsLoadingAllExercises] = useState(false);
    const [isSavingRoutine, setIsSavingRoutine] = useState(false);

    /**
     * Estados para controlar la navegación interna y el drill-down 
     * de información (Categoría -> Ejercicio -> Detalle).
     */
    const [view, setView] = useState<RoutineView>('categories');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'instructions' | 'tips'>('instructions');
    const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

    /**
     * Estados destinados a la persistencia temporal de datos durante 
     * la creación de una nueva rutina.
     */
    const [routineName, setRoutineName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<SupabaseExercise[]>([]);
    const [addToRoutineTarget, setAddToRoutineTarget] = useState<{ name: string; image: string; tips: string[] } | null>(null);

    /**
     * Estados para UI de la lista de crear rutina
     */
    const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('Todos');
    const [visibleCount, setVisibleCount] = useState<number>(5);

    /**
     * Estados para Edición de Rutinas
     */
    const [editingRoutine, setEditingRoutine] = useState<SupabaseUserRoutine | null>(null);
    const [editRoutineName, setEditRoutineName] = useState('');
    const [editingExercises, setEditingExercises] = useState<SupabaseExercise[]>([]);
    const [isFetchingEdit, setIsFetchingEdit] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Almacena el ID cuando venimos de "+ Sumar Ejercicios" para pisar la rutina original 
    const [ongoingEditRoutineId, setOngoingEditRoutineId] = useState<string | null>(null);

    // ── Derive the category name from the CATEGORIES constant ──
    const selectedCategoryName = CATEGORIES.find(c => c.id === selectedCategoryId)?.title || '';

    // ── Fetch user routines from Supabase ──
    useEffect(() => {
        const fetchUserRoutines = async () => {
            try {
                setIsLoadingRoutines(true);
                const { data, error } = await supabase
                    .from('routines')
                    .select('id, name, duration_minutes');
                if (error) throw error;
                setUserRoutines(data || []);
            } catch (err: any) {
                console.error('Error fetching user routines:', err);
            } finally {
                setIsLoadingRoutines(false);
            }
        };
        fetchUserRoutines();
    }, [currentUser?.id]);

    // ── Fetch exercises by category from Supabase ──
    useEffect(() => {
        if (!selectedCategoryId || view !== 'list') return;
        const categoryName = CATEGORIES.find(c => c.id === selectedCategoryId)?.title;
        if (!categoryName) return;

        const fetchExercises = async () => {
            try {
                setIsLoadingExercises(true);
                const { data, error } = await supabase
                    .from('exercises')
                    .select('id, name, category, muscle_subgroup, image_url, biomechanics, instructions, tips, common_errors')
                    .ilike('category', categoryName);
                if (error) throw error;
                setCategoryExercises(data || []);
            } catch (err: any) {
                console.error('Error fetching exercises:', err);
                setCategoryExercises([]);
            } finally {
                setIsLoadingExercises(false);
            }
        };
        fetchExercises();
    }, [selectedCategoryId, view]);

    // ── Fetch all exercises for routine creator ──
    useEffect(() => {
        if (view !== 'create_routine') return;
        if (allExercises.length > 0) return;

        const fetchAllExercises = async () => {
            try {
                setIsLoadingAllExercises(true);
                const { data, error } = await supabase
                    .from('exercises')
                    .select('id, name, category, muscle_subgroup, image_url, biomechanics, instructions, tips, common_errors');
                if (error) throw error;
                setAllExercises(data || []);
            } catch (err: any) {
                console.error('Error fetching all exercises:', err);
                setAllExercises([]);
            } finally {
                setIsLoadingAllExercises(false);
            }
        };
        fetchAllExercises();
    }, [view, allExercises.length]);

    // ── Group exercises by muscle_subgroup ──
    const groupedExercises = categoryExercises.reduce<Record<string, SupabaseExercise[]>>((acc, ex) => {
        const group = ex.muscle_subgroup || 'General';
        if (!acc[group]) acc[group] = [];
        acc[group].push(ex);
        return acc;
    }, {});

    /**
     * Inserta un ejercicio específico dentro de una rutina personalizada existente.
     */
    const handleAddExerciseToRoutine = (routineId: string) => {
        if (!addToRoutineTarget) return;
        const target = addToRoutineTarget;
        setCustomRoutines(prev => prev.map(r => {
            if (r.id !== routineId) return r;
            return {
                ...r,
                exercises: [...r.exercises, {
                    id: `added-${Date.now()}`,
                    name: target.name,
                    image: target.image,
                    tips: target.tips,
                    sets: 4,
                    reps: '8-12',
                    rest: 90,
                }],
            };
        }));
        const routine = customRoutines.find(r => r.id === routineId);
        toast({ title: '✅ Añadido', description: `Ejercicio agregado a ${routine?.name}` });
        setAddToRoutineTarget(null);
    };

    /**
     * Abre el modal de edición de una rutina cargando sus ejercicios desde Supabase.
     */
    const handleOpenEdit = async (routine: SupabaseUserRoutine) => {
        setEditingRoutine(routine);
        setEditRoutineName(routine.name);
        setIsFetchingEdit(true);
        try {
            const { data, error } = await supabase
                .from('routine_exercises')
                .select('*, exercises(*)')
                .eq('routine_id', routine.id)
                .order('order_index', { ascending: true });

            if (error) throw error;

            const exercises = data?.map(row => row.exercises) || [];
            setEditingExercises(exercises);
        } catch (err: any) {
            console.error('Error fetching routine details:', err);
            toast({ title: 'Error al cargar rutina', variant: 'destructive' });
        } finally {
            setIsFetchingEdit(false);
        }
    };

    /**
     * Guarda los cambios de edición al servidor.
     */
    const handleSaveEditChanges = async () => {
        if (!editingRoutine || !editRoutineName.trim()) return;

        try {
            setIsSavingEdit(true);

            // 1. Update routine name
            const { error: updateError } = await supabase
                .from('routines')
                .update({ name: editRoutineName.trim() })
                .eq('id', editingRoutine.id);
            if (updateError) throw updateError;

            // 2. Delete existing exercises
            const { error: delError } = await supabase
                .from('routine_exercises')
                .delete()
                .eq('routine_id', editingRoutine.id);
            if (delError) throw delError;

            // 3. Insert updated exercises
            if (editingExercises.length > 0) {
                const exerciseRows = editingExercises.map((ex, i) => ({
                    routine_id: editingRoutine.id,
                    exercise_id: ex.id,
                    sets: 4,
                    reps: '8-12',
                    order_index: i,
                }));
                const { error: insertError } = await supabase
                    .from('routine_exercises')
                    .insert(exerciseRows);
                if (insertError) throw insertError;
            }

            // 4. Refresh list
            const { data: refreshed } = await supabase
                .from('routines')
                .select('id, name, duration_minutes');
            setUserRoutines(refreshed || []);

            toast({ title: '✅ Cambios guardados' });
            setEditingRoutine(null);
        } catch (err: any) {
            console.error('Error saving edited routine:', err);
            toast({ title: '❌ Error guardando', description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingEdit(false);
        }
    };

    /**
     * Navega a la vista de enciclopedia pasando el array actual para seguir sumando.
     */
    const handleSumarEjercicios = () => {
        if (!editingRoutine) return;
        setOngoingEditRoutineId(editingRoutine.id);
        setRoutineName(editRoutineName);
        setSelectedExercises([...editingExercises]);
        setEditingRoutine(null);
        setView('create_routine');
    };

    // ─── RENDERIZADO: VISTA DE DETALLE DEL EJERCICIO ──────────────────
    if (view === 'detail' && selectedSupabaseExercise) {
        const ex = selectedSupabaseExercise;
        const hasInstructions = ex.instructions && ex.instructions.length > 0;
        const hasTips = ex.tips && ex.tips.length > 0;
        const hasErrors = ex.common_errors && ex.common_errors.length > 0;

        return (
            <div className="animate-fade-in pb-24">
                {/* ── HERO IMAGE ── */}
                <div className="relative h-60 bg-muted">
                    {ex.image_url ? (
                        <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Dumbbell className="w-16 h-16 text-primary/30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <button
                        onClick={() => { setView('list'); setSelectedSupabaseExercise(null); setActiveDetailTab('instructions'); }}
                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                        {ex.muscle_subgroup && (
                            <span className="text-[10px] font-bold text-primary bg-primary/20 px-2.5 py-1 rounded-full uppercase">{ex.muscle_subgroup}</span>
                        )}
                        <h1 className="text-2xl font-black text-white drop-shadow-lg mt-1.5 leading-tight">{ex.name}</h1>
                    </div>
                </div>

                <div className="p-4 space-y-5">
                    {/* ── BIOMECÁNICA ── */}
                    {ex.biomechanics && (
                        <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-foreground text-sm">Biomecánica</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{ex.biomechanics}</p>
                        </div>
                    )}

                    {/* ── TABS ── */}
                    {(hasInstructions || hasTips || hasErrors) && (
                        <>
                            <div className="flex rounded-xl bg-muted p-1 gap-1">
                                <button onClick={() => setActiveDetailTab('instructions')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeDetailTab === 'instructions' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Instrucciones</button>
                                <button onClick={() => setActiveDetailTab('tips')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeDetailTab === 'tips' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Tips y Errores</button>
                            </div>

                            {activeDetailTab === 'instructions' && hasInstructions && (
                                <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Paso a Paso</h4>
                                    <div className="space-y-3">
                                        {ex.instructions!.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeDetailTab === 'tips' && (
                                <div className="space-y-4">
                                    {hasTips && (
                                        <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tips Técnicos</h4>
                                            <div className="space-y-2.5">
                                                {ex.tips!.map((tip, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {hasErrors && (
                                        <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Errores Comunes</h4>
                                            <div className="space-y-2.5">
                                                {ex.common_errors!.map((err, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-foreground/80 leading-relaxed">{err}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── BOTTOM ACTION ── */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 z-50">
                    <button
                        onClick={() => setAddToRoutineTarget({ name: ex.name, image: ex.image_url || '', tips: ex.tips || [] })}
                        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
                    >
                        Agregar a Rutina
                    </button>
                </div>

                {/* ── ROUTINE PICKER DIALOG ── */}
                <Dialog open={!!addToRoutineTarget} onOpenChange={(open) => !open && setAddToRoutineTarget(null)}>
                    <DialogContent className="max-w-[90vw] rounded-3xl p-5">
                        <h2 className="text-lg font-bold mb-4">Seleccionar Rutina</h2>
                        {userRoutines.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No tenés rutinas creadas aún</p>
                        ) : (
                            <div className="space-y-2">
                                {userRoutines.map(r => (
                                    <button key={r.id} onClick={() => handleAddExerciseToRoutine(r.id)} className="w-full p-3.5 rounded-2xl border border-border text-left hover:bg-primary/5 transition-colors flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Dumbbell className="w-4 h-4 text-primary" />
                                        </div>
                                        <p className="font-semibold text-sm">{r.name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ─── RENDERIZADO: LISTADO POR CATEGORÍA (Agrupado por subgrupo) ──
    if (view === 'list' && selectedCategoryId) {
        return (
            <div className="p-4 animate-fade-in pb-24">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setView('categories'); setSelectedCategoryId(null); setCategoryExercises([]); }} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">{selectedCategoryName}</h1>
                        <p className="text-xs text-muted-foreground">{categoryExercises.length} ejercicios</p>
                    </div>
                </div>

                {isLoadingExercises ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    </div>
                ) : categoryExercises.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-border rounded-3xl">
                        <Dumbbell className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No hay ejercicios en esta categoría aún</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedExercises).map(([subgroup, exercises]) => (
                            <div key={subgroup}>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{subgroup}</h3>
                                <div className="space-y-2">
                                    {exercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => { setSelectedSupabaseExercise(ex); setView('detail'); }}
                                            className="w-full bg-card rounded-2xl border border-border p-3 flex items-center gap-3 shadow-soft hover:shadow-md transition-all"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                                                {ex.image_url ? (
                                                    <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Dumbbell className="w-5 h-5 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-semibold text-sm text-foreground leading-tight">{ex.name}</p>
                                                {ex.muscle_subgroup && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{ex.muscle_subgroup}</p>
                                                )}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ─── RENDERIZADO: CREADOR DE RUTINAS ──────────────────────────────
    if (view === 'create_routine') {
        const filtered = allExercises.filter(ex => {
            const matchesSearch = searchQuery.trim() === '' || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedFilterCategory === 'Todos' || ex.category.toLowerCase().includes(selectedFilterCategory.toLowerCase());
            return matchesSearch && matchesCategory;
        });

        const visibleExercises = filtered.slice(0, visibleCount);

        /**
         * Persiste la nueva rutina en Supabase (routines + routine_exercises)
         * y refresca la lista local al finalizar.
         */
        const handleSaveRoutine = async () => {
            if (!routineName.trim() || selectedExercises.length === 0) return;

            try {
                setIsSavingRoutine(true);
                toast({ title: '⏳ Guardando rutina...' });

                // Evalúa si es un UPDATE (venimos de + Sumar Ejercicios) o un INSERT (creación nativa)
                let routineIdToUse;

                if (ongoingEditRoutineId) {
                    // MODO EDICIÓN
                    routineIdToUse = ongoingEditRoutineId;
                    const { error: updateError } = await supabase
                        .from('routines')
                        .update({ name: routineName.trim() })
                        .eq('id', routineIdToUse);
                    if (updateError) throw updateError;

                    // Asegurarse de vaciar los viejos para reemplazarlos
                    await supabase.from('routine_exercises').delete().eq('routine_id', routineIdToUse);
                } else {
                    // MODO CREACIÓN
                    const { data: routineData, error: routineError } = await supabase
                        .from('routines')
                        .insert({
                            id: crypto.randomUUID(),
                            name: routineName.trim(),
                            user_id: currentUser?.id,
                        })
                        .select('id')
                        .single();

                    if (routineError) throw routineError;
                    routineIdToUse = routineData.id;
                }

                // PASO 2: Insertar los ejercicios seleccionados en `routine_exercises`
                const exerciseRows = selectedExercises.map((ex, i) => ({
                    routine_id: routineIdToUse,
                    exercise_id: ex.id,
                    sets: 4,
                    reps: '8-12',
                    order_index: i,
                }));

                const { error: exercisesError } = await supabase
                    .from('routine_exercises')
                    .insert(exerciseRows);

                if (exercisesError) throw exercisesError;

                // PASO 3: Refrescar la lista de rutinas desde Supabase
                const { data: refreshed } = await supabase
                    .from('routines')
                    .select('id, name, duration_minutes');
                setUserRoutines(refreshed || []);

                // Limpiar estados y volver a la vista principal
                setRoutineName('');
                setSelectedExercises([]);
                setSearchQuery('');
                setOngoingEditRoutineId(null);
                toast({ title: '✅ Rutina guardada' });
                setView('categories');
            } catch (err: any) {
                console.error('Error saving routine:', err);
                toast({ title: '❌ Error al guardar', description: err.message || 'Intenta de nuevo más tarde', variant: 'destructive' });
            } finally {
                setIsSavingRoutine(false);
            }
        };

        const handleCancel = () => {
            setRoutineName('');
            setSearchQuery('');
            setSelectedExercises([]);
            setSelectedFilterCategory('Todos');
            setOngoingEditRoutineId(null);
            setView('categories');
        };

        return (
            <div className="flex flex-col min-h-screen bg-background animate-fade-in relative">
                {/* ── STICKY HEADER ── */}
                <div className="sticky top-0 bg-background z-20 pt-4 px-4 pb-4 border-b border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={handleCancel} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-colors hover:bg-muted/80">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold">Nueva Rutina</h1>
                    </div>

                    <input
                        type="text" value={routineName} onChange={e => setRoutineName(e.target.value)}
                        placeholder="Nombre de la rutina..." className="w-full h-12 rounded-xl border border-border bg-card px-4 mb-3 focus:ring-2 focus:ring-primary outline-none transition-shadow"
                    />

                    {/* Chips de Categorías */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                        {['Todos', 'Tren Superior', 'Tren Inferior', 'Core', 'Movilidad'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setSelectedFilterCategory(cat); setVisibleCount(5); }}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedFilterCategory === cat ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card text-muted-foreground border-border hover:bg-muted/50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar ejercicios..." className="w-full h-11 rounded-xl border border-border pl-10 pr-4 text-sm bg-card outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                        />
                    </div>
                </div>

                {/* ── SCROLLABLE LIST ── */}
                <div className="flex-1 p-4 pb-28">
                    {isLoadingAllExercises ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {visibleExercises.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => setSelectedExercises(prev => prev.some(e => e.id === ex.id) ? prev.filter(e => e.id !== ex.id) : [...prev, ex])}
                                    className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedExercises.some(e => e.id === ex.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/30'}`}
                                >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                        {ex.image_url ? (
                                            <img src={ex.image_url} className="w-full h-full object-cover" alt={ex.name} />
                                        ) : (
                                            <Dumbbell className="w-4 h-4 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-semibold text-foreground leading-tight">{ex.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{ex.category}</p>
                                    </div>
                                    {selectedExercises.some(e => e.id === ex.id) && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </button>
                            ))}

                            {visibleCount < filtered.length ? (
                                <button
                                    onClick={() => setVisibleCount(filtered.length)}
                                    className="w-full mt-4 py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    Ver más ejercicios ({filtered.length - visibleCount})
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            ) : visibleCount >= filtered.length && filtered.length > 5 ? (
                                <button
                                    onClick={() => setVisibleCount(5)}
                                    className="w-full mt-4 py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    Ver menos ejercicios
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            ) : null}

                            {filtered.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">No hay ejercicios que coincidan</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── STICKY FOOTER ── */}
                <div className="sticky bottom-0 bg-background p-4 border-t border-border z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex gap-3">
                    <button onClick={handleCancel} className="flex-1 h-12 rounded-xl border border-border bg-card font-semibold hover:bg-muted transition-colors">Cancelar</button>
                    <button onClick={handleSaveRoutine} disabled={isSavingRoutine || !routineName.trim() || selectedExercises.length === 0} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                        {isSavingRoutine ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── RENDERIZADO: VISTA PRINCIPAL (CATEGORÍAS) ────────────────────
    return (
        <div className="p-4 space-y-6 animate-fade-in pb-24">
            {/* ── CABECERA ── */}
            <div>
                <div className="flex items-center gap-2.5 mb-1">
                    <Dumbbell className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold">Ejercicios</h1>
                </div>
                <p className="text-sm text-muted-foreground">Explorá la enciclopedia de ejercicios por categoría</p>
            </div>

            {/* ── BOTÓN CREAR RUTINA ── */}
            <button
                onClick={() => setView('create_routine')}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 text-primary font-bold text-sm transition-colors hover:bg-primary/15 active:scale-[0.98]"
            >
                <Plus className="w-5 h-5" /> CREAR RUTINA
            </button>

            {/* ── SECCIÓN: MIS RUTINAS ── */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Mis Rutinas</h3>
                {isLoadingRoutines ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : userRoutines.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-border rounded-2xl">
                        <p className="text-sm text-muted-foreground">Aún no tenés rutinas creadas</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {userRoutines.map(r => (
                            <button key={r.id} onClick={() => handleOpenEdit(r)} className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm hover:border-primary/30 transition-colors text-left">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Dumbbell className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground leading-tight truncate">{r.name}</p>
                                    {r.duration_minutes && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">~{r.duration_minutes} min</p>
                                    )}
                                </div>
                                <Badge className="bg-primary/15 text-primary border-0 text-[9px] font-bold uppercase px-2 py-0.5 hover:bg-primary/15">Custom</Badge>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL DE EDICIÓN DE RUTINAS ── */}
            <Dialog open={!!editingRoutine} onOpenChange={(open) => !open && setEditingRoutine(null)}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-5 max-h-[85vh] flex flex-col">
                    <h2 className="text-lg font-bold">Editar Rutina</h2>

                    {isFetchingEdit ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden space-y-4 py-2">
                            <input
                                type="text"
                                value={editRoutineName}
                                onChange={e => setEditRoutineName(e.target.value)}
                                placeholder="Nombre de la rutina..."
                                className="w-full h-12 rounded-xl border border-border bg-card px-4 focus:ring-2 focus:ring-primary outline-none transition-shadow flex-shrink-0 font-medium"
                            />

                            <div className="flex items-center justify-between mt-2 flex-shrink-0">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ejercicios ({editingExercises.length})</h3>
                                <button onClick={handleSumarEjercicios} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Sumar
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                                {editingExercises.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">No hay ejercicios en esta rutina</p>
                                ) : (
                                    editingExercises.map(ex => (
                                        <div key={ex.id} className="w-full p-2.5 rounded-xl border border-border bg-card flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                                {ex.image_url ? (
                                                    <img src={ex.image_url} className="w-full h-full object-cover" alt={ex.name} />
                                                ) : (
                                                    <Dumbbell className="w-4 h-4 text-muted-foreground/40" />
                                                )}
                                            </div>
                                            <p className="flex-1 text-left text-sm font-medium line-clamp-2 leading-tight">{ex.name}</p>
                                            <button
                                                onClick={() => setEditingExercises(prev => prev.filter(e => e.id !== ex.id))}
                                                className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-2 flex gap-3 flex-shrink-0">
                                <button onClick={() => setEditingRoutine(null)} className="flex-1 h-12 rounded-xl border border-border font-semibold hover:bg-muted transition-colors">Cancelar</button>
                                <button onClick={handleSaveEditChanges} disabled={isSavingEdit || !editRoutineName.trim()} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 flex items-center justify-center gap-2">
                                    {isSavingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── SECCIÓN: CATEGORÍAS (Grilla) ── */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Categorías</h3>
                <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategoryId(cat.id); setView('list'); }}
                            className="relative h-56 rounded-3xl overflow-hidden group"
                        >
                            <img
                                src={cat.image}
                                alt={cat.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                                <h2 className="text-white font-black text-xs uppercase tracking-wider leading-tight">{cat.title}</h2>
                                <p className="text-white/60 text-[10px] mt-0.5">{cat.subtitle}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}