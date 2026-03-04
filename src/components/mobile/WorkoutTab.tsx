import { useState } from 'react';
import {
    Dumbbell, Play, Timer, ChevronRight, ChevronDown, Moon, Check, X, Trophy, ListOrdered, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { availableRoutines, AvailableRoutine, AvailableRoutineExercise } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

interface WorkoutTabProps {
    currentUser: any;
    updateUser: (id: string, data: any) => void;
    customRoutines: AvailableRoutine[];
    setHasTrainedToday: React.Dispatch<React.SetStateAction<boolean>>;
    setHasRestedToday: React.Dispatch<React.SetStateAction<boolean>>;
}

export function WorkoutTab({ currentUser, updateUser, customRoutines, setHasTrainedToday, setHasRestedToday }: WorkoutTabProps) {
    const { toast } = useToast();

    // Workout state
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [weight, setWeight] = useState('20');
    const [reps, setReps] = useState('');
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(90);
    const [selectedRoutine, setSelectedRoutine] = useState<AvailableRoutine>(availableRoutines[0]);
    const [exercisePreview, setExercisePreview] = useState<AvailableRoutineExercise | null>(null);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
    const [restType, setRestType] = useState<'series' | 'exercise'>('series');
    const [setWeights, setSetWeights] = useState<Record<string, string[]>>({});
    const [isRestModeActive, setIsRestModeActive] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Rank-up modal state
    const [showRankUpModal, setShowRankUpModal] = useState(false);
    const [rankUpInfo, setRankUpInfo] = useState<{ league: string; division: number; newLeague?: boolean } | null>(null);

    const activeExercises = selectedRoutine.exercises;

    // ─── Local gamification logic ───
    const LEAGUES = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Esmeralda', 'Diamante'] as const;

    const getLeagueIcon = (league: string) => {
        const icons: Record<string, string> = {
            'Hierro': '⚙️', 'Bronce': '🥉', 'Plata': '🥈',
            'Oro': '🥇', 'Esmeralda': '💎', 'Diamante': '👑',
        };
        return icons[league] || '🏅';
    };

    const getLeagueColor = (league: string) => {
        const colors: Record<string, string> = {
            'Hierro': 'from-gray-400 to-gray-600', 'Bronce': 'from-amber-600 to-amber-800',
            'Plata': 'from-gray-300 to-gray-500', 'Oro': 'from-yellow-400 to-yellow-600',
            'Esmeralda': 'from-emerald-400 to-emerald-600', 'Diamante': 'from-cyan-300 to-blue-500',
        };
        return colors[league] || 'from-gray-400 to-gray-600';
    };

    const addRankedPoints = (points: number, message: string) => {
        const ranked = currentUser.ranked;
        if (!ranked) return;

        let newPoints = ranked.currentPoints + points;
        let newDivision = ranked.division;
        let newLeague = ranked.league;
        let promoted = false;
        let leagueUp = false;

        while (newPoints >= 100) {
            newPoints -= 100;
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
                    newPoints = 100;
                    break;
                }
            }
        }

        updateUser(currentUser.id, {
            ranked: {
                league: newLeague as any,
                division: newDivision,
                currentPoints: newPoints,
                maxPoints: 100,
            }
        });

        toast({ title: `+${points} pts`, description: message });

        if (promoted) {
            setRankUpInfo({ league: newLeague, division: newDivision, newLeague: leagueUp });
            setTimeout(() => setShowRankUpModal(true), 500);
        }
    };

    // ─── Workout helpers ───
    const initWorkout = () => {
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
        setWeight('20');
        setReps('');
        setShowInstructions(false);
        setIsWorkoutActive(true);
    };

    const adjustWeight = (amount: number) => {
        setWeight(prev => {
            const val = Math.max(0, parseFloat(prev || '0') + amount);
            return val % 1 === 0 ? val.toString() : val.toFixed(1);
        });
    };

    const handleFinishSet = () => {
        if (!reps) {
            toast({
                title: "Completa las repeticiones",
                description: "Ingresa las repeticiones realizadas",
                variant: "destructive"
            });
            return;
        }

        const currentEx = activeExercises[currentExerciseIndex];

        setCompletedSets(prev => {
            const updated = { ...prev };
            updated[currentEx.id] = [...(updated[currentEx.id] || [])];
            updated[currentEx.id][currentSet - 1] = true;
            return updated;
        });

        setSetWeights(prev => {
            const updated = { ...prev };
            updated[currentEx.id] = [...(updated[currentEx.id] || [])];
            updated[currentEx.id][currentSet - 1] = weight;
            return updated;
        });

        const isLastSet = currentSet >= currentEx.sets;
        const isLastExercise = currentExerciseIndex >= activeExercises.length - 1;

        if (isLastSet && isLastExercise) {
            setIsWorkoutActive(false);
            setCurrentExerciseIndex(0);
            setCurrentSet(1);
            updateUser(currentUser.id, { streak: currentUser.streak + 1, lastActive: new Date() });
            setHasTrainedToday(true);
            toast({
                title: "🎉 ¡Entrenamiento Completado!",
                description: `Racha actual: ${currentUser.streak + 1} días`
            });
            return;
        }

        if (isLastSet) {
            setRestType('exercise');
            setRestTime(180);
            setIsResting(true);
            const timer = setInterval(() => {
                setRestTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsResting(false);
                        setCurrentExerciseIndex(i => i + 1);
                        setCurrentSet(1);
                        setReps('');
                        return 90;
                    }
                    return prev - 1;
                });
            }, 1000);
            toast({
                title: "¡Ejercicio completado! 💪",
                description: "Descansa y prepara el siguiente"
            });
        } else {
            setRestType('series');
            setRestTime(currentEx.rest || 90);
            setIsResting(true);
            const restDuration = currentEx.rest || 90;
            setRestTime(restDuration);
            const timer = setInterval(() => {
                setRestTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsResting(false);
                        setCurrentSet(s => s + 1);
                        return restDuration;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const handleRestDay = () => {
        setIsRestModeActive(true);
        setHasRestedToday(true);
        addRankedPoints(10, "Recuperación 🛌");
        setTimeout(() => setIsRestModeActive(false), 3000);
    };

    // ─── Workout Player ───
    if (isWorkoutActive && activeExercises.length > 0) {
        const currentEx = activeExercises[currentExerciseIndex];
        const setsStatus = completedSets[currentEx.id] || new Array(currentEx.sets).fill(false);

        return (
            <div className="min-h-screen flex flex-col animate-fade-in">
                {/* Rest Timer Overlay */}
                {isResting && (
                    <div className="timer-overlay animate-fade-in">
                        <div className="text-center px-6">
                            {restType === 'exercise' ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-accent/20 mx-auto mb-4 flex items-center justify-center">
                                        <Dumbbell className="w-10 h-10 text-accent" />
                                    </div>
                                    <p className="text-accent font-semibold text-lg mb-2">Cambio de Ejercicio</p>
                                    <p className="text-muted-foreground text-sm mb-4">Prepara el siguiente ejercicio</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-muted-foreground mb-2">Descanso entre series</p>
                                </>
                            )}
                            <div className="text-7xl font-bold text-primary mb-2">
                                {Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}
                            </div>
                            <p className="text-muted-foreground text-sm mb-6">
                                {restType === 'exercise'
                                    ? `Siguiente: ${activeExercises[currentExerciseIndex + 1]?.name || ''}`
                                    : `Serie ${currentSet + 1} en...`}
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsResting(false);
                                    if (restType === 'exercise') {
                                        setCurrentExerciseIndex(i => i + 1);
                                        setCurrentSet(1);
                                        setReps('');
                                    } else {
                                        setCurrentSet(s => s + 1);
                                    }
                                }}
                            >
                                Saltar descanso →
                            </Button>
                        </div>
                    </div>
                )}

                {/* Exercise Header */}
                <div className="relative h-48 bg-muted">
                    <img
                        src={currentEx.image}
                        alt={currentEx.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <button
                        onClick={() => setIsWorkoutActive(false)}
                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-sm text-muted-foreground">
                            Ejercicio {currentExerciseIndex + 1} de {activeExercises.length}
                        </p>
                        <h2 className="text-2xl font-bold text-foreground">{currentEx.name}</h2>
                    </div>
                </div>

                {/* Content - Waterfall */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {/* Progress bar */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso del ejercicio</span>
                        <span className="font-medium text-primary">{setsStatus.filter(Boolean).length}/{currentEx.sets}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${(setsStatus.filter(Boolean).length / currentEx.sets) * 100}%` }}
                        />
                    </div>

                    {/* ─── Instructions Accordion ─── */}
                    {(currentEx.executionSteps || currentEx.tips) && (
                        <div className="bg-card rounded-2xl border border-border overflow-hidden">
                            <button
                                onClick={() => setShowInstructions(prev => !prev)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <ListOrdered className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="flex-1 text-sm font-semibold text-foreground">Ver instrucciones del ejercicio</span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''}`} />
                            </button>

                            {showInstructions && (
                                <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-border pt-3">
                                    {/* Paso a Paso */}
                                    {currentEx.executionSteps && currentEx.executionSteps.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-foreground text-xs mb-2.5 flex items-center gap-1.5">
                                                <ListOrdered className="w-3.5 h-3.5 text-primary" />
                                                Paso a Paso
                                            </h5>
                                            <div className="space-y-2.5">
                                                {currentEx.executionSteps.map((step, si) => (
                                                    <div key={si} className="flex items-start gap-2.5">
                                                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            {si + 1}
                                                        </span>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tips Técnicos */}
                                    {currentEx.tips && currentEx.tips.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-foreground text-xs mb-2.5">✅ Tips Técnicos</h5>
                                            <div className="space-y-2">
                                                {currentEx.tips.map((tip, ti) => (
                                                    <div key={ti} className="flex items-start gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom Weight Input */}
                    <div className="bg-card rounded-2xl border border-border p-4">
                        <label className="text-xs text-muted-foreground mb-3 block text-center uppercase tracking-wider font-semibold">Peso (kg)</label>
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex flex-col gap-1">
                                <button onClick={() => adjustWeight(-5)} className="w-10 h-8 rounded-lg bg-muted hover:bg-destructive/10 text-foreground text-xs font-bold transition-colors active:scale-95">-5</button>
                                <button onClick={() => adjustWeight(-1)} className="w-10 h-8 rounded-lg bg-muted hover:bg-destructive/10 text-foreground text-xs font-bold transition-colors active:scale-95">-1</button>
                                <button onClick={() => adjustWeight(-0.5)} className="w-10 h-8 rounded-lg bg-muted hover:bg-destructive/10 text-foreground text-xs font-bold transition-colors active:scale-95">-0.5</button>
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-28 h-20 rounded-2xl border-2 border-primary bg-primary/5 text-center text-3xl font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                            />
                            <div className="flex flex-col gap-1">
                                <button onClick={() => adjustWeight(5)} className="w-10 h-8 rounded-lg bg-muted hover:bg-accent/10 text-foreground text-xs font-bold transition-colors active:scale-95">+5</button>
                                <button onClick={() => adjustWeight(1)} className="w-10 h-8 rounded-lg bg-muted hover:bg-accent/10 text-foreground text-xs font-bold transition-colors active:scale-95">+1</button>
                                <button onClick={() => adjustWeight(0.5)} className="w-10 h-8 rounded-lg bg-muted hover:bg-accent/10 text-foreground text-xs font-bold transition-colors active:scale-95">+0.5</button>
                            </div>
                        </div>
                    </div>

                    {/* Reps Input */}
                    <div className="bg-card rounded-2xl border border-border p-4">
                        <label className="text-xs text-muted-foreground mb-2 block text-center uppercase tracking-wider font-semibold">Repeticiones</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            placeholder={currentEx.reps}
                            className="w-full h-14 rounded-xl border border-border bg-background text-center text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* Waterfall Series List */}
                    <div>
                        <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Series</h4>
                        <div className="space-y-2">
                            {setsStatus.map((done, idx) => {
                                const isCurrentSeries = idx + 1 === currentSet && !done;
                                const setW = setWeights[currentEx.id]?.[idx];
                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done
                                            ? 'bg-success/10 border-success/30'
                                            : isCurrentSeries
                                                ? 'bg-primary/5 border-primary/40 shadow-sm'
                                                : 'bg-card border-border opacity-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-success text-success-foreground' : isCurrentSeries ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {done ? <Check className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`text-sm font-medium ${done ? 'text-success' : 'text-foreground'}`}>
                                                Serie {idx + 1}
                                            </span>
                                            {done && setW && (
                                                <span className="text-xs text-muted-foreground ml-2">{setW} kg</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {currentEx.reps} reps
                                        </span>
                                        {isCurrentSeries && (
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ACTUAL</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Next Exercise Preview */}
                    {currentExerciseIndex < activeExercises.length - 1 && (
                        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img src={activeExercises[currentExerciseIndex + 1].image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-xs">
                                <p className="text-muted-foreground">Siguiente:</p>
                                <p className="font-medium text-foreground">{activeExercises[currentExerciseIndex + 1].name}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 pb-6 space-y-2">
                    <Button variant="gradient" size="xl" className="w-full" onClick={handleFinishSet}>
                        <Check className="w-5 h-5" />
                        {currentSet >= currentEx.sets && currentExerciseIndex >= activeExercises.length - 1
                            ? '🎉 Finalizar Entrenamiento'
                            : currentSet >= currentEx.sets
                                ? 'Siguiente Ejercicio →'
                                : `Completar Serie ${currentSet}`}
                    </Button>
                </div>

                {/* Rank Up Modal */}
                <Dialog open={showRankUpModal} onOpenChange={setShowRankUpModal}>
                    <DialogContent className="max-w-sm mx-auto text-center">
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${getLeagueColor(rankUpInfo?.league || 'Bronce')} flex items-center justify-center text-5xl shadow-xl animate-bounce`}>
                                {getLeagueIcon(rankUpInfo?.league || 'Bronce')}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {rankUpInfo?.newLeague ? '🎉 ¡Nueva Liga!' : '🏆 ¡Subiste de Rango!'}
                                </h2>
                                <p className="text-lg font-semibold text-primary">
                                    {rankUpInfo?.league} {rankUpInfo?.division ? ['V', 'IV', 'III', 'II', 'I'][5 - rankUpInfo.division] : ''}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {rankUpInfo?.newLeague
                                        ? '¡Felicitaciones! Has alcanzado una nueva liga. ¡Sigue así! 💪'
                                        : '¡Felicitaciones! Estás un paso más cerca de la cima. ¡No pares!'}
                                </p>
                            </div>
                            <Button variant="gradient" className="w-full mt-2" onClick={() => setShowRankUpModal(false)}>
                                <Trophy className="w-5 h-5" />
                                ¡Genial!
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ─── Workout Tab (default view) ───
    return (
        <div className="p-4 space-y-6 animate-fade-in relative">
            {/* Rest Mode Overlay */}
            {isRestModeActive && (
                <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center animate-fade-in">
                    <div className="text-center p-8">
                        <div className="w-32 h-32 rounded-full bg-warning/20 mx-auto mb-6 flex items-center justify-center animate-pulse">
                            <Moon className="w-16 h-16 text-warning" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">Modo Descanso</h2>
                        <p className="text-muted-foreground text-lg mb-4">Tu cuerpo se está recuperando 💪</p>
                        <p className="text-success text-xl font-semibold">+10 pts Recuperación</p>
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold text-foreground">Entrenar</h1>

            {/* Routine Carousel */}
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rutina del día</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {availableRoutines.map((routine) => (
                        <button
                            key={routine.id}
                            onClick={() => setSelectedRoutine(routine)}
                            className={`flex-shrink-0 w-36 p-3 rounded-2xl border-2 transition-all duration-200 ${selectedRoutine.id === routine.id
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border bg-card hover:border-primary/30'
                                }`}
                        >
                            <div className="text-2xl mb-2">{routine.emoji}</div>
                            <p className={`text-sm font-bold ${selectedRoutine.id === routine.id ? 'text-primary' : 'text-foreground'}`}>
                                {routine.shortName}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{routine.exercises.length} ejercicios</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Routine Card */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Rutina Seleccionada</p>
                        <h2 className="text-xl font-bold text-foreground">{selectedRoutine.name}</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                        {selectedRoutine.emoji}
                    </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">~45 min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{selectedRoutine.exercises.length} ejercicios</span>
                    </div>
                </div>
                <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={initWorkout}
                >
                    <Play className="w-5 h-5" />
                    COMENZAR
                </Button>
            </div>

            {/* Exercise List Preview - Interactive */}
            <div>
                <h3 className="font-semibold text-foreground mb-3">Ejercicios de hoy</h3>
                <div className="space-y-2">
                    {selectedRoutine.exercises.map((ex, idx) => (
                        <button
                            key={ex.id}
                            onClick={() => setExercisePreview(ex)}
                            className="w-full bg-card rounded-xl border border-border p-3 flex items-center gap-3 hover:border-primary/40 transition-all active:scale-[0.98] text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                <img src={ex.image} alt={ex.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">{ex.name}</p>
                                <p className="text-xs text-muted-foreground">{ex.sets} series × {ex.reps}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Rest Day Button */}
            <Button
                variant="warning"
                size="lg"
                className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={handleRestDay}
            >
                <Moon className="w-5 h-5" />
                DÍA DE DESCANSO
            </Button>

            {/* Custom Routines Section */}
            {customRoutines.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mis Rutinas Personalizadas</h3>
                    <div className="space-y-2">
                        {customRoutines.map(routine => (
                            <button
                                key={routine.id}
                                onClick={() => setSelectedRoutine(routine)}
                                className={`w-full bg-card rounded-2xl border-2 p-4 flex items-center gap-3 transition-all text-left ${selectedRoutine.id === routine.id
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-primary/30'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                                    {routine.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">{routine.name}</p>
                                    <p className="text-xs text-muted-foreground">{routine.exercises.length} ejercicios</p>
                                </div>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">CUSTOM</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Exercise Preview Modal */}
            <Dialog open={!!exercisePreview} onOpenChange={(open) => !open && setExercisePreview(null)}>
                <DialogContent className="max-w-[90vw] rounded-2xl p-0 overflow-hidden">
                    {exercisePreview && (
                        <>
                            <div className="relative h-48 bg-muted">
                                <img src={exercisePreview.image} alt={exercisePreview.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h2 className="text-lg font-bold text-foreground">{exercisePreview.name}</h2>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="text-xs">
                                        {exercisePreview.sets} series
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                        {exercisePreview.reps} reps
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                        {exercisePreview.rest}s descanso
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground text-sm mb-2">💡 Tips Técnicos</h4>
                                    <div className="space-y-2">
                                        {exercisePreview.tips.map((tip, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                                                </div>
                                                <p className="text-muted-foreground">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setExercisePreview(null)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rank Up Modal (for rest day points) */}
            <Dialog open={showRankUpModal} onOpenChange={setShowRankUpModal}>
                <DialogContent className="max-w-sm mx-auto text-center">
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${getLeagueColor(rankUpInfo?.league || 'Bronce')} flex items-center justify-center text-5xl shadow-xl animate-bounce`}>
                            {getLeagueIcon(rankUpInfo?.league || 'Bronce')}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                {rankUpInfo?.newLeague ? '🎉 ¡Nueva Liga!' : '🏆 ¡Subiste de Rango!'}
                            </h2>
                            <p className="text-lg font-semibold text-primary">
                                {rankUpInfo?.league} {rankUpInfo?.division ? ['V', 'IV', 'III', 'II', 'I'][5 - rankUpInfo.division] : ''}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {rankUpInfo?.newLeague
                                    ? '¡Felicitaciones! Has alcanzado una nueva liga. ¡Sigue así! 💪'
                                    : '¡Felicitaciones! Estás un paso más cerca de la cima. ¡No pares!'}
                            </p>
                        </div>
                        <Button variant="gradient" className="w-full mt-2" onClick={() => setShowRankUpModal(false)}>
                            <Trophy className="w-5 h-5" />
                            ¡Genial!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
