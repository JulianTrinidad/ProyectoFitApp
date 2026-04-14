import { useState, useEffect } from 'react';
import {
    Dumbbell, Play, Timer, ChevronRight, ChevronLeft, ChevronDown, Moon, X, Trophy, CheckCircle2, CheckCircle, Loader2, Clock, Check, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// ── Interfaces ────────────────────────────────────────────────

interface SupabaseRoutine {
    id: string;
    name: string;
    duration_minutes?: number;
}

interface SupabaseRoutineExercise {
    id: string;
    routine_id: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    order_index: number;
    exercises: {
        id: string;
        name: string;
        image_url: string;
        instructions: string[] | null;
        tips: string[] | null;
    };
}

/**
 * Representa un ejercicio individual dentro de una sesión activa.
 */
interface AvailableRoutineExercise {
    id: string;
    name: string;
    image: string;
    tips: string[];
    sets: number;
    reps: string;
    rest: number;
    executionSteps?: string[];
}

/**
 * Estructura de la rutina que el usuario elige para entrenar.
 */
interface AvailableRoutine {
    id: string;
    name: string;
    shortName: string;
    emoji: string;
    exercises: AvailableRoutineExercise[];
}

interface WorkoutTabProps {
    currentUser: any;
    updateUser: (id: string, data: any) => void;
    customRoutines: AvailableRoutine[];
    setHasTrainedToday: React.Dispatch<React.SetStateAction<boolean>>;
    setHasRestedToday: React.Dispatch<React.SetStateAction<boolean>>;
}

export function WorkoutTab({ currentUser, updateUser, customRoutines, setHasTrainedToday, setHasRestedToday }: WorkoutTabProps) {
    const { toast } = useToast();

    // ── Supabase-driven states ──
    const [routines, setRoutines] = useState<SupabaseRoutine[]>([]);
    const [selectedRoutine, setSelectedRoutine] = useState<SupabaseRoutine | null>(null);
    const [routineExercises, setRoutineExercises] = useState<SupabaseRoutineExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ── Active workout player states ──
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [weight, setWeight] = useState('20');
    const [reps, setReps] = useState('');
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(90);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
    const [restType, setRestType] = useState<'series' | 'exercise'>('series');
    const [setWeights, setSetWeights] = useState<Record<string, string[]>>({});
    const [isRestModeActive, setIsRestModeActive] = useState(false);
    const [showRankUpModal, setShowRankUpModal] = useState(false);
    const [rankUpInfo, setRankUpInfo] = useState<{ league: string; division: number; newLeague?: boolean } | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);
    const [isCheckingLog, setIsCheckingLog] = useState(true);

    // ── Exercise history states ──
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [personalRecord, setPersonalRecord] = useState<number | null>(null);
    const [prDate, setPrDate] = useState<string | null>(null);

    // ── Fetch exercise PR ──
    const fetchExerciseHistory = async (exerciseId: string) => {
        try {
            setIsLoadingHistory(true);
            setPersonalRecord(null);
            setPrDate(null);

            // Fetch all logs for this exercise and find the max weight
            const { data, error } = await supabase
                .from('exercise_logs')
                .select('date, weight')
                .eq('user_id', currentUser.id)
                .eq('exercise_id', exerciseId);
            if (error) throw error;

            if (data && data.length > 0) {
                let maxWeight = 0;
                let maxDate = '';
                data.forEach(log => {
                    const w = parseFloat(log.weight) || 0;
                    if (w > maxWeight) {
                        maxWeight = w;
                        maxDate = log.date;
                    }
                });
                setPersonalRecord(maxWeight);
                setPrDate(maxDate);
            }
        } catch (err) {
            console.error('Error fetching exercise PR:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // ── Fetch user's daily log to prevent farming ──
    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchTodayLog = async () => {
            const today = new Date().toLocaleDateString('en-CA');
            try {
                setIsCheckingLog(true);
                const { data, error } = await supabase
                    .from('daily_logs')
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .eq('date', today)
                    .limit(1);

                if (error) throw error;
                if (data && data.length > 0) {
                    setHasLoggedToday(true);
                }
            } catch (err) {
                console.error('Error fetching today daily log:', err);
            } finally {
                setIsCheckingLog(false);
            }
        };
        fetchTodayLog();
    }, [currentUser?.id]);

    // ── Fetch routines on mount (filtered by current user) ──
    useEffect(() => {
        if (!currentUser?.id) return;
        const fetchRoutines = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('routines')
                    .select('*')
                    .eq('user_id', currentUser.id);
                if (error) throw error;
                if (data && data.length > 0) {
                    setRoutines(data);
                    setSelectedRoutine(data[0]);
                } else {
                    setRoutines([]);
                }
            } catch (err: any) {
                console.error('Error fetching routines:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoutines();
    }, [currentUser?.id]);

    // ── Fetch exercises when selectedRoutine changes ──
    useEffect(() => {
        if (!selectedRoutine) {
            setRoutineExercises([]);
            return;
        }
        const fetchExercises = async () => {
            try {
                const { data, error } = await supabase
                    .from('routine_exercises')
                    .select('*, exercises(id, name, image_url, instructions, tips)')
                    .eq('routine_id', selectedRoutine.id)
                    .order('order_index', { ascending: true });
                if (error) throw error;
                setRoutineExercises(data || []);
            } catch (err: any) {
                console.error('Error fetching routine exercises:', err);
                setRoutineExercises([]);
            }
        };
        fetchExercises();
    }, [selectedRoutine]);

    // ── Derived data for active workout ──
    const activeExercises: AvailableRoutineExercise[] = routineExercises.map(re => ({
        id: re.exercises.id,
        name: re.exercises.name,
        image: re.exercises.image_url || '',
        tips: re.exercises.tips || [],
        sets: re.sets,
        reps: re.reps,
        rest: re.rest_seconds || 90,
        executionSteps: re.exercises.instructions || [],
    }));
    const currentEx = activeExercises[currentExerciseIndex];
    const isLastExercise = currentExerciseIndex >= activeExercises.length - 1;

    // ── Recovery: restore mid-workout state from today's exercise_logs ──
    useEffect(() => {
        if (!currentUser?.id || !selectedRoutine || routineExercises.length === 0 || hasLoggedToday || isWorkoutActive) return;

        const recoverWorkout = async () => {
            const today = new Date().toLocaleDateString('en-CA');
            try {
                const { data, error } = await supabase
                    .from('exercise_logs')
                    .select('exercise_id, set_index, weight')
                    .eq('user_id', currentUser.id)
                    .eq('date', today)
                    .eq('workout_id', selectedRoutine.id);

                if (error) throw error;
                if (!data || data.length === 0) return;

                // Rebuild completedSets from recovered logs
                const recovered: Record<string, boolean[]> = {};
                const recoveredWeights: Record<string, string[]> = {};
                activeExercises.forEach(ex => {
                    recovered[ex.id] = new Array(ex.sets).fill(false);
                    recoveredWeights[ex.id] = new Array(ex.sets).fill('20');
                });

                let lastWeight = '20';
                data.forEach((log: any) => {
                    const exId = log.exercise_id;
                    const setIdx = (log.set_index || 1) - 1; // convert to 0-based
                    if (recovered[exId] && setIdx >= 0 && setIdx < recovered[exId].length) {
                        recovered[exId][setIdx] = true;
                        recoveredWeights[exId][setIdx] = log.weight?.toString() || '20';
                        lastWeight = log.weight?.toString() || '20';
                    }
                });

                // Find current exercise index: first exercise with incomplete sets, or next after last completed
                let resumeExIndex = 0;
                let resumeSet = 1;
                for (let i = 0; i < activeExercises.length; i++) {
                    const ex = activeExercises[i];
                    const sets = recovered[ex.id] || [];
                    const firstIncomplete = sets.findIndex(s => !s);
                    if (firstIncomplete !== -1) {
                        resumeExIndex = i;
                        resumeSet = firstIncomplete + 1;
                        lastWeight = recoveredWeights[ex.id]?.[firstIncomplete > 0 ? firstIncomplete - 1 : 0] || lastWeight;
                        break;
                    }
                    // All sets complete for this exercise
                    if (i === activeExercises.length - 1) {
                        // All exercises complete — don't recover, workout is done
                        return;
                    }
                    resumeExIndex = i + 1;
                    resumeSet = 1;
                }

                setCompletedSets(recovered);
                setSetWeights(recoveredWeights);
                setCurrentExerciseIndex(resumeExIndex);
                setCurrentSet(resumeSet);
                setWeight(lastWeight);
                setIsWorkoutActive(true);
                toast({ title: 'Sesión recuperada 🔄', description: 'Continuás donde dejaste.' });
            } catch (err) {
                console.error('Error recovering workout:', err);
            }
        };

        recoverWorkout();
    }, [currentUser?.id, selectedRoutine?.id, routineExercises, hasLoggedToday]);

    // ── League helpers ──
    const LEAGUES = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Esmeralda', 'Diamante'] as const;

    const getLeagueColor = (league: string) => {
        const colors: Record<string, string> = {
            'Hierro': 'from-gray-400 to-gray-600', 'Bronce': 'from-amber-600 to-amber-800',
            'Plata': 'from-gray-300 to-gray-500', 'Oro': 'from-yellow-400 to-yellow-600',
            'Esmeralda': 'from-emerald-400 to-emerald-600', 'Diamante': 'from-cyan-300 to-blue-500',
        };
        return colors[league] || 'from-gray-400 to-gray-600';
    };

    /**
     * Procesa la ganancia de puntos y gestiona las transiciones entre divisiones y ligas.
     */
    const addRankedPoints = async (points: number, message: string) => {
        const ranked = currentUser?.ranked;
        if (!ranked) return;

        const LEAGUE_CONFIG: Record<string, number> = {
            'Hierro': 200, 'Bronce': 200,
            'Plata': 400, 'Oro': 400,
            'Esmeralda': 500, 'Diamante': 500,
        };

        let newPoints = ranked.currentPoints + points;
        let newDivision = ranked.division;
        let newLeague = ranked.league;
        let promoted = false;
        let leagueUp = false;

        let requiredPts = LEAGUE_CONFIG[newLeague] || 200;

        while (newPoints >= requiredPts) {
            newPoints -= requiredPts;
            promoted = true;
            if (newDivision > 1) {
                newDivision = (newDivision - 1) as 1 | 2 | 3 | 4 | 5;
            } else {
                const leagueIndex = LEAGUES.indexOf(newLeague as typeof LEAGUES[number]);
                if (leagueIndex < LEAGUES.length - 1) {
                    newLeague = LEAGUES[leagueIndex + 1];
                    newDivision = 5;
                    leagueUp = true;
                } else {
                    newPoints = requiredPts;
                    break;
                }
            }
            // Update required points for the (possibly new) league
            requiredPts = LEAGUE_CONFIG[newLeague] || 200;
        }

        const newRanked = { league: newLeague as any, division: newDivision, currentPoints: newPoints, maxPoints: LEAGUE_CONFIG[newLeague] || 200 };

        updateUser(currentUser.id, { ranked: newRanked });

        // Persistir en Supabase
        try {
            await supabase.from('profiles').update({ ranked: newRanked }).eq('id', currentUser.id);
        } catch (err) {
            console.error('Error persisting ranked points:', err);
        }

        toast({ title: `+${points} pts`, description: message });

        if (promoted) {
            setRankUpInfo({ league: newLeague, division: newDivision, newLeague: leagueUp });
            setTimeout(() => setShowRankUpModal(true), 500);
        }
    };

    /**
     * Prepara el estado para comenzar la sesión de entrenamiento.
     */
    const initWorkout = () => {
        if (isWorkoutActive) {
            toast({ title: 'Sesión en curso', description: 'Ya tenés una sesión activa.' });
            return;
        }
        if (!selectedRoutine || activeExercises.length === 0) {
            toast({ title: 'Sin ejercicios', description: 'Esta rutina no tiene ejercicios asignados.', variant: 'destructive' });
            return;
        }
        const initial: Record<string, boolean[]> = {};
        const initialWeights: Record<string, string[]> = {};
        activeExercises.forEach(ex => {
            initial[ex.id] = new Array(ex.sets).fill(false);
            initialWeights[ex.id] = new Array(ex.sets).fill('20');
        });
        setCompletedSets(initial);
        setSetWeights(initialWeights);
        setCurrentExerciseIndex(0);
        setCurrentSet(1);
        setIsWorkoutActive(true);
        toast({ title: 'Iniciando rutina...', description: `${selectedRoutine.name} — ¡Vamos! 💪` });
    };

    /**
     * Avanza al siguiente estado después de un descanso (o al omitirlo).
     */
    const proceedToNextStep = () => {
        setIsResting(false);
        const currentTotalSets = completedSets[currentEx.id]?.length || currentEx.sets;
        const isLastSet = currentSet >= currentTotalSets;

        if (isLastSet) {
            setCurrentExerciseIndex(i => i + 1);
            setCurrentSet(1);
        } else {
            setCurrentSet(s => s + 1);
        }
        setReps('');
    };

    /**
     * Elimina una serie planificada (no completada, no actual) del ejercicio en curso.
     */
    const removePlannedSet = (indexToRemove: number) => {
        const currentTotalSets = completedSets[currentEx.id]?.length || currentEx.sets;
        if (currentTotalSets <= 1) return;

        setCompletedSets(prev => {
            const updated = [...(prev[currentEx.id] || [])];
            updated.splice(indexToRemove, 1);
            return { ...prev, [currentEx.id]: updated };
        });
    };

    /**
     * Registra la serie actual, verifica si es el final de la rutina y dispara los timers de descanso.
     */
    const handleFinishSet = async () => {
        if (!reps) {
            toast({ title: "Atención", description: "Ingresa las repeticiones", variant: "destructive" });
            return;
        }

        // Marcar la serie actual como completada
        setCompletedSets(prev => {
            const updatedExSets = [...(prev[currentEx.id] || [])];
            updatedExSets[currentSet - 1] = true;
            return { ...prev, [currentEx.id]: updatedExSets };
        });

        const currentTotalSets = completedSets[currentEx.id]?.length || currentEx.sets;
        const isLastSet = currentSet >= currentTotalSets;

        // Check PR bonus BEFORE saving
        const currentWeight = parseFloat(weight) || 0;
        let prBonus = false;
        if (personalRecord !== null && currentWeight > personalRecord) {
            prBonus = true;
        }

        // Guardar cada serie (delete + insert para máxima compatibilidad)
        try {
            const todayDate = new Date().toLocaleDateString('en-CA');

            // 1. Borrar registro previo de esta serie si existe
            await supabase.from('exercise_logs').delete().match({
                user_id: currentUser.id,
                date: todayDate,
                exercise_id: currentEx.id,
                set_index: currentSet
            });

            // 2. Insertar el nuevo registro
            const { error: insertError } = await supabase.from('exercise_logs').insert({
                user_id: currentUser.id,
                date: todayDate,
                workout_id: selectedRoutine?.id,
                exercise_id: currentEx.id,
                set_index: currentSet,
                weight: weight.toString(),
                reps: reps.toString()
            });

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                toast({ title: 'Error al guardar serie', description: insertError.message || 'No se pudo registrar en la base de datos.', variant: 'destructive' });
            }
        } catch (err: any) {
            console.error('Error de red insertando exercise_log:', err);
            toast({ title: 'Error al guardar serie', description: 'No se pudo conectar con la base de datos.', variant: 'destructive' });
        }

        // PR bonus per set
        if (prBonus) {
            addRankedPoints(15, 'NUEVO RÉCORD PERSONAL 🏆');
        }

        // Verificar si se completó todo el entrenamiento
        if (isLastSet && isLastExercise) {
            const todayDate = new Date().toLocaleDateString('en-CA');

            try {
                // 1. Eliminar cualquier registro previo de hoy (evita conflictos)
                await supabase.from('daily_logs').delete().match({ user_id: currentUser.id, date: todayDate });

                // 2. Insertar el entrenamiento limpio
                const { error } = await supabase.from('daily_logs').insert({
                    user_id: currentUser.id,
                    date: todayDate,
                    activity_type: 'workout',
                    workout_id: selectedRoutine?.id
                });

                if (error) throw error; // Si hay error, salta al catch y NO muestra el éxito

                // 3. Bloquear UI al instante
                setHasTrainedToday(true);
                if (typeof setHasLoggedToday === 'function') setHasLoggedToday(true);

                // 4. Puntos + racha
                const newStreak = (currentUser?.streak || 0) + 1;
                updateUser(currentUser.id, { streak: newStreak, lastActive: new Date() });

                // +5 pts base por entrenamiento
                addRankedPoints(5, 'Entrenamiento completado 💪');

                // Bono de racha cada 3 días
                if (newStreak % 3 === 0) {
                    addRankedPoints(10, 'BONO RACHA 3 DÍAS 🔥');
                }

                // Persistir last_activity_date en Supabase
                try {
                    await supabase.from('profiles').update({
                        streak: newStreak,
                        last_activity_date: new Date().toLocaleDateString('en-CA')
                    }).eq('id', currentUser.id);
                } catch (e) {
                    console.error('Error updating streak:', e);
                }

                toast({ title: '¡Entrenamiento completado! 🎉', description: `+5 pts • Racha: ${newStreak} días` });
                setIsWorkoutActive(false);

            } catch (err: any) {
                console.error('Error salvando log:', err);
                toast({ title: 'Error de conexión', description: err.message || 'No se pudo guardar el progreso.', variant: 'destructive' });
            }
            return;
        }

        // Preparar descanso
        setIsResting(true);
        setRestTime(isLastSet ? 180 : (currentEx.rest || 90));
        setRestType(isLastSet ? 'exercise' : 'series');
    };

    // ── Timer Effect ──
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isResting && restTime > 0) {
            timer = setInterval(() => {
                setRestTime(prev => prev - 1);
            }, 1000);
        } else if (isResting && restTime === 0) {
            proceedToNextStep();
        }
        return () => clearInterval(timer);
    }, [isResting, restTime]);

    const handleRestDay = async () => {
        setIsRestModeActive(true);
        setHasRestedToday(true);

        const todayDate = new Date().toLocaleDateString('en-CA');

        try {
            // 1. Eliminar cualquier registro previo de hoy
            await supabase.from('daily_logs').delete().match({ user_id: currentUser.id, date: todayDate });

            // 2. Insertar descanso limpio
            const { error } = await supabase.from('daily_logs').insert({
                user_id: currentUser.id,
                date: todayDate,
                activity_type: 'rest'
            });

            if (error) throw error;

            // 3. Puntos + racha
            const newStreak = (currentUser?.streak || 0) + 1;
            updateUser(currentUser.id, { streak: newStreak, lastActive: new Date() });

            // +10 pts por descanso
            addRankedPoints(10, 'Recuperación registrada 🛋');

            // Bono de racha cada 3 días
            if (newStreak % 3 === 0) {
                addRankedPoints(10, 'BONO RACHA 3 DÍAS 🔥');
            }

            // Persistir streak en Supabase
            try {
                await supabase.from('profiles').update({
                    streak: newStreak,
                    last_activity_date: todayDate
                }).eq('id', currentUser.id);
            } catch (e) {
                console.error('Error updating streak:', e);
            }

            // 4. Actualizar UI
            setHasLoggedToday(true);
            toast({ title: 'Modo Descanso', description: `+10 pts • Racha: ${newStreak} días` });

        } catch (err: any) {
            console.error('Error saving rest log:', err);
            toast({ title: 'Error', description: err.message || 'No se pudo guardar el descanso.', variant: 'destructive' });
        }

        setTimeout(() => setIsRestModeActive(false), 3000);
    };

    // ─── RENDERIZADO: INTERFAZ DE ENTRENAMIENTO EN CURSO ──────────────
    if (isWorkoutActive && activeExercises.length > 0 && currentEx) {
        const setsStatus = completedSets[currentEx.id] || [];
        const currentTotalSets = setsStatus.length || currentEx.sets;
        const totalRestTime = restType === 'exercise' ? 180 : (currentEx.rest || 90);
        const restProgress = totalRestTime > 0 ? ((totalRestTime - restTime) / totalRestTime) : 0;
        const circumference = 2 * Math.PI * 70;

        return (
            <div className="min-h-screen flex flex-col animate-fade-in bg-background">
                {/* ── REST TIMER OVERLAY (Circular) ── */}
                {isResting && (
                    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                        <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
                            {restType === 'exercise' ? 'Próximo ejercicio' : 'Descanso entre series'}
                        </p>
                        <div className="relative w-44 h-44 mb-8">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary transition-all duration-1000 ease-linear" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - restProgress)} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-foreground tabular-nums">
                                    {Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        {restType === 'exercise' && (
                            <p className="text-sm text-muted-foreground mb-4">Siguiente: <span className="font-bold text-foreground">{activeExercises[currentExerciseIndex + 1]?.name || ''}</span></p>
                        )}
                        <Button variant="outline" className="rounded-full px-8 h-11 border-primary/30 text-primary hover:bg-primary/10" onClick={proceedToNextStep}>
                            Saltar descanso →
                        </Button>
                    </div>
                )}

                {/* ── HERO IMAGE ── */}
                <div className="relative h-56 flex-shrink-0">
                    {currentEx.image ? (
                        <img src={currentEx.image} className="w-full h-full object-cover" alt={currentEx.name} />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Dumbbell className="w-16 h-16 text-primary/30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    {/* Close button */}
                    <button
                        onClick={() => setIsWorkoutActive(false)}
                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 transition-colors hover:bg-black/50"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    {/* Exercise counter */}
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-xs font-bold text-white">{currentExerciseIndex + 1}/{activeExercises.length}</span>
                    </div>
                    {/* Exercise name */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-2xl font-black text-white drop-shadow-lg leading-tight">{currentEx.name}</h2>
                        <p className="text-xs text-white/70 mt-1">{currentTotalSets} series × {currentEx.reps} reps</p>
                    </div>
                </div>

                {/* ── SCROLLABLE CONTENT ── */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-28">

                    {/* ── ACCORDION: Instrucciones ── */}
                    {(currentEx.executionSteps?.length || currentEx.tips?.length) ? (
                        <div className="bg-card rounded-3xl border border-border shadow-soft overflow-hidden">
                            <button
                                onClick={() => setShowInstructions(!showInstructions)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <span className="text-sm font-semibold text-foreground">Ver instrucciones del ejercicio</span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''}`} />
                            </button>
                            {showInstructions && (
                                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                                    {/* Paso a Paso */}
                                    {currentEx.executionSteps && currentEx.executionSteps.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Paso a Paso</h4>
                                            <div className="space-y-2">
                                                {currentEx.executionSteps.map((step, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                            {i + 1}
                                                        </span>
                                                        <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Tips Técnicos */}
                                    {currentEx.tips && currentEx.tips.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tips Técnicos</h4>
                                            <div className="space-y-2">
                                                {currentEx.tips.map((tip, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* ── WEIGHT SELECTOR ── */}
                    <div className="bg-card rounded-3xl border border-border p-5 shadow-soft">
                        <div className="flex items-center justify-between mb-3">
                            <div />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Peso</p>
                            <button
                                onClick={() => { fetchExerciseHistory(currentEx.id); setShowHistoryModal(true); }}
                                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                <History className="w-3.5 h-3.5" />
                                Historial
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => setWeight(Math.max(0, parseFloat(weight) - 2.5).toString())}
                                className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-xl font-bold text-foreground transition-colors active:scale-95"
                            >
                                −
                            </button>
                            <div className="text-center">
                                <span className="text-5xl font-black text-foreground tabular-nums">{weight}</span>
                                <span className="text-lg font-bold text-muted-foreground ml-1">kg</span>
                            </div>
                            <button
                                onClick={() => setWeight((parseFloat(weight) + 2.5).toString())}
                                className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-xl font-bold text-foreground transition-colors active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* ── REPS INPUT ── */}
                    <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-2">Repeticiones — Serie {currentSet} de {currentTotalSets}</p>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={reps}
                            onChange={e => setReps(e.target.value)}
                            placeholder="0"
                            className="w-full h-16 rounded-2xl border-2 border-primary/20 focus:border-primary bg-background text-center text-3xl font-black outline-none transition-colors"
                        />
                    </div>

                    {/* ── SERIES LIST ── */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Series</p>
                        <div className="space-y-2">
                            {setsStatus.map((done, idx) => {
                                const isCurrent = idx + 1 === currentSet && !done;
                                return (
                                    <div
                                        key={idx}
                                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all ${done
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : isCurrent
                                                ? 'bg-primary/5 border-primary shadow-md'
                                                : 'bg-muted/20 border-border'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {done ? (
                                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            ) : (
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <span className={`text-sm font-bold ${done ? 'text-emerald-600' : isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                Serie {idx + 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isCurrent && (
                                                <span className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">Actual</span>
                                            )}
                                            {done && (
                                                <span className="text-xs text-emerald-500 font-medium">✓ Hecho</span>
                                            )}
                                            {!done && !isCurrent && currentTotalSets > 1 && (
                                                <button
                                                    onClick={() => removePlannedSet(idx)}
                                                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── HISTORY MODAL ── */}
                <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                    <DialogContent className="max-w-[92vw] sm:max-w-sm rounded-3xl p-6" aria-describedby={undefined}>
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            Récord Personal
                        </h2>
                        <p className="text-xs text-muted-foreground mb-4">{currentEx?.name}</p>

                        {isLoadingHistory ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : personalRecord !== null && personalRecord > 0 ? (
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 text-center">
                                <span className="text-4xl mb-2 block">🏆</span>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="font-black text-4xl tabular-nums text-foreground">{personalRecord}</span>
                                    <span className="text-lg font-bold text-muted-foreground">kg</span>
                                </div>
                                {prDate && (
                                    <p className="text-sm text-muted-foreground mt-3">
                                        Logrado el {new Date(prDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Dumbbell className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">Aún no hay registros para este ejercicio</p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ── BOTTOM ACTION BUTTON ── */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 z-50">
                    <Button
                        variant="gradient"
                        size="xl"
                        className="w-full rounded-2xl text-base font-bold h-14 shadow-lg"
                        onClick={handleFinishSet}
                    >
                        <Check className="w-5 h-5 mr-2" />
                        {currentSet >= currentTotalSets && isLastExercise ? 'Finalizar sesión 🎉' : 'Completar serie'}
                    </Button>
                </div>
            </div>
        );
    }

    // ─── RENDERIZADO: PANTALLA DE SELECCIÓN DE RUTINA (NUEVO DISEÑO) ──
    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Cargando rutinas…</p>
            </div>
        );
    }

    if (routines.length === 0) {
        return (
            <div className="p-4 space-y-6 animate-fade-in pb-24">
                {isRestModeActive && (
                    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center text-center p-8">
                        <Moon className="w-16 h-16 text-warning mb-4 animate-pulse" />
                        <h2 className="text-2xl font-bold">Modo Descanso</h2>
                    </div>
                )}
                <h1 className="text-2xl font-bold">Entrenar</h1>
                <div className="p-12 text-center border-2 border-dashed rounded-3xl">
                    <Dumbbell className="w-14 h-14 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-base font-semibold text-muted-foreground">No hay rutinas asignadas aún</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Tu entrenador las cargará pronto 💪</p>
                </div>
                <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl text-warning border-warning/30 hover:bg-warning/10"
                    onClick={handleRestDay}
                    disabled={hasLoggedToday || isCheckingLog}
                >
                    <Moon className="w-4 h-4 mr-2" /> DÍA DE DESCANSO
                </Button>

                <Dialog open={showRankUpModal} onOpenChange={setShowRankUpModal}>
                    <DialogContent className="max-w-sm text-center">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getLeagueColor(rankUpInfo?.league || 'Bronce')} mx-auto mb-4`} />
                        <h2 className="text-xl font-bold">¡Subiste de Rango!</h2>
                        <Button className="w-full mt-4" onClick={() => setShowRankUpModal(false)}>¡Genial!</Button>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 animate-fade-in pb-24">
            {isRestModeActive && (
                <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center text-center p-8">
                    <Moon className="w-16 h-16 text-warning mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold">Modo Descanso</h2>
                </div>
            )}

            <h1 className="text-2xl font-bold">Entrenar</h1>

            {/* ── SECCIÓN 1: Carrusel Horizontal de Rutinas ── */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Mis Rutinas</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {routines.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setSelectedRoutine(r)}
                            className={`flex-shrink-0 min-w-[140px] p-4 rounded-2xl border-2 transition-all text-left ${selectedRoutine?.id === r.id
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border bg-card hover:border-primary/30'
                                }`}
                        >
                            <Dumbbell className={`w-5 h-5 mb-2 ${selectedRoutine?.id === r.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="font-bold text-sm leading-tight line-clamp-2">{r.name}</p>
                            {r.duration_minutes && (
                                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ~{r.duration_minutes} min
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── SECCIÓN 2: Tarjeta de Rutina Seleccionada ── */}
            {selectedRoutine && (
                <div className="bg-card rounded-3xl border border-border p-5 shadow-soft">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Dumbbell className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-foreground leading-tight">{selectedRoutine.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        {selectedRoutine.duration_minutes && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>~{selectedRoutine.duration_minutes} min</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>{routineExercises.length} ejercicios</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SECCIÓN 3: Lista de Ejercicios ── */}
            {selectedRoutine && (
                <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ejercicios de hoy</h3>
                    {routineExercises.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-border rounded-2xl">
                            <p className="text-sm text-muted-foreground">Sin ejercicios asignados para esta rutina</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {routineExercises.map((re, idx) => (
                                <div
                                    key={re.id}
                                    className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border shadow-soft hover:shadow-md transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                        {re.exercises?.image_url ? (
                                            <img
                                                src={re.exercises.image_url}
                                                alt={re.exercises.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Dumbbell className="w-5 h-5 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground leading-tight">{re.exercises?.name || 'Ejercicio'}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {re.sets} series × {re.reps} reps
                                        </p>
                                    </div>
                                    {/* Arrow */}
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── SECCIÓN 4: Botones de Acción ── */}
            <div className="space-y-3 pt-2">
                {hasLoggedToday && (
                    <p className="text-sm font-bold text-emerald-500 text-center flex items-center justify-center gap-1.5 mb-2 -mt-1">
                        <CheckCircle2 className="w-4 h-4" /> Actividad de hoy completada
                    </p>
                )}
                <Button
                    variant="gradient"
                    size="xl"
                    className="w-full rounded-2xl text-base font-bold"
                    onClick={initWorkout}
                    disabled={!selectedRoutine || routineExercises.length === 0 || hasLoggedToday || isCheckingLog}
                >
                    <Play className="w-5 h-5 mr-2" /> COMENZAR
                </Button>
                <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl text-warning border-warning/30 hover:bg-warning/10"
                    onClick={handleRestDay}
                    disabled={hasLoggedToday || isCheckingLog}
                >
                    <Moon className="w-4 h-4 mr-2" /> DÍA DE DESCANSO
                </Button>
            </div>

            {/* Rank Up Dialog */}
            <Dialog open={showRankUpModal} onOpenChange={setShowRankUpModal}>
                <DialogContent className="max-w-sm text-center">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getLeagueColor(rankUpInfo?.league || 'Bronce')} mx-auto mb-4`} />
                    <h2 className="text-xl font-bold">¡Subiste de Rango!</h2>
                    <Button className="w-full mt-4" onClick={() => setShowRankUpModal(false)}>¡Genial!</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}