import { useMemo } from 'react';
import {
    Flame, Play, Moon, Lightbulb, ChevronRight, Utensils
} from 'lucide-react';
import {
    format, startOfWeek, endOfWeek, eachDayOfInterval,
    isToday, isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { mockRoutines } from '@/data/mockData';
import type { MobileTab, NutritionTab } from './mobileTypes';

interface HomeTabProps {
    currentUser: any;
    setActiveTab: (tab: MobileTab) => void;
    setNutritionTab: (tab: NutritionTab) => void;
    waterIntake: number;
    hasTrainedToday: boolean;
    hasRestedToday: boolean;
}

// ─── Tips del día ───────────────────────────────────────────────────
const DAILY_TIPS = [
    "💧 Beber agua antes de cada comida puede ayudarte a controlar las porciones.",
    "🧠 El sueño es el suplemento más subestimado. Apunta a 7-9 horas.",
    "🦵 No saltes el día de piernas. Es la base de tu fuerza general.",
    "🍳 La proteína en el desayuno reduce los antojos durante el día.",
    "🧘 5 minutos de estiramientos al despertar mejoran tu movilidad a largo plazo.",
    "📈 La consistencia supera a la perfección. Un mal día no arruina tu progreso.",
    "🥦 Intenta añadir una verdura más a cada comida. Tu cuerpo lo agradecerá.",
    "⏱️ Los descansos entre series son tan importantes como las series mismas.",
    "🔥 La progresiva sobrecarga es la clave: un poco más cada semana.",
    "😤 Respirar correctamente durante el ejercicio multiplica tu rendimiento.",
    "🏋️ La técnica siempre va antes que el peso. Domina la forma primero.",
    "🌙 Evita pantallas 30 min antes de dormir para una mejor recuperación.",
];

export function HomeTab({ currentUser, setActiveTab, setNutritionTab, waterIntake, hasTrainedToday, hasRestedToday }: HomeTabProps) {
    const today = new Date();

    // ─── Weekly data ────────────────────────────────────────────────
    const weekDays = useMemo(() => {
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, []);

    const getDayStatus = (date: Date): 'completed' | 'rest' | 'pending' | 'future' => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayInfo = currentUser.workoutCalendar?.find((d: any) => d.date === dateStr);
        if (dayInfo?.completed) return 'completed';
        if (dayInfo?.isRestDay) return 'rest';
        if (date <= today) return 'pending';
        return 'future';
    };

    // ─── Today's workout info ───────────────────────────────────────
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayCalendar = currentUser.workoutCalendar?.find((d: any) => d.date === todayStr);
    const isRestDay = todayCalendar?.isRestDay ?? false;

    const assignedRoutine = useMemo(() => {
        if (!currentUser.assignedPlan) return null;
        return mockRoutines.find(r => r.id === currentUser.assignedPlan) ?? null;
    }, [currentUser.assignedPlan]);

    const estimatedDuration = useMemo(() => {
        if (!assignedRoutine) return 0;
        return assignedRoutine.exercises.reduce((total, ex) => {
            // ~45 sec per set of work + rest time
            return total + (ex.sets * (45 + ex.rest));
        }, 0);
    }, [assignedRoutine]);

    const durationMinutes = Math.round(estimatedDuration / 60);

    // ─── Nutrition mock data ────────────────────────────────────────
    const nutrition = {
        kcal: { current: 1480, target: 2500 },
        protein: { current: 95, target: 160 },
        carbs: { current: 140, target: 280 },
        fat: { current: 48, target: 70 },
    };

    // ─── Tip del día (basado en día del año) ─────────────────────────
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const dailyTip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];

    // ─── Day label helpers ──────────────────────────────────────────
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return (
        <div className="p-4 space-y-5 animate-fade-in">
            {/* ══════════ A. Header ══════════ */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-sm">Buenos días,</p>
                    <h1 className="text-2xl font-bold text-foreground">{currentUser.name.split(' ')[0]} 👋</h1>
                </div>
                <div className="streak-badge">
                    <Flame className="w-4 h-4" />
                    {currentUser.streak} días
                </div>
            </div>

            {/* ══════════ B. Weekly Overview ══════════ */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Esta Semana
                </p>
                <div className="flex justify-between items-center">
                    {weekDays.map((day, i) => {
                        const status = getDayStatus(day);
                        const isCurrent = isToday(day);
                        return (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {dayLabels[i]}
                                </span>
                                <div
                                    className={`weekly-dot ${status === 'completed'
                                        ? 'weekly-dot-completed'
                                        : status === 'rest'
                                            ? 'weekly-dot-rest'
                                            : 'weekly-dot-empty'
                                        } ${isCurrent ? 'weekly-dot-today' : ''}`}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══════════ C. Objetivo de Hoy ══════════ */}
            {isRestDay ? (
                /* ── Rest Day Card ── */
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-10 translate-x-10" />
                    <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                            <Moon className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-foreground">Recuperación Activa</h2>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                Hoy tu cuerpo se reconstruye. Descansa, hidrátate y estira suavemente. Volvés más fuerte mañana. 💪
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Workout Card ── */
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                            🎯 Objetivo de Hoy
                        </p>
                        <h2 className="text-xl font-bold text-foreground">
                            {assignedRoutine?.name ?? 'Sin rutina asignada'}
                        </h2>
                        {assignedRoutine && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {assignedRoutine.exercises.length} ejercicios · ~{durationMinutes} min
                            </p>
                        )}
                        <button
                            onClick={() => setActiveTab('workout')}
                            className="mt-4 w-full btn-gradient rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-semibold text-sm"
                        >
                            <Play className="w-4 h-4" fill="currentColor" />
                            Comenzar Ahora
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════ C2. Misiones de Hoy ══════════ */}
            {(() => {
                // Mission states driven by parent
                const waterDone = waterIntake >= 4000;

                type MissionStatus = 'done' | 'cancelled' | 'pending' | 'progress';

                const getWorkoutStatus = (): MissionStatus => {
                    if (hasTrainedToday) return 'done';
                    if (hasRestedToday) return 'cancelled';
                    return 'pending';
                };
                const getRestStatus = (): MissionStatus => {
                    if (hasRestedToday) return 'done';
                    if (hasTrainedToday) return 'cancelled';
                    return 'pending';
                };
                const getWaterStatus = (): MissionStatus => {
                    if (waterDone) return 'done';
                    if (waterIntake > 0) return 'progress';
                    return 'pending';
                };

                const workoutStatus = getWorkoutStatus();
                const restStatus = getRestStatus();
                const waterStatus = getWaterStatus();

                const missions = [
                    { icon: '💧', label: 'Beber Agua', desc: waterDone ? 'Completado ✅' : `${waterIntake}/4000 ml ⭕`, status: waterStatus, color: 'text-cyan-400' },
                    { icon: '🏋️', label: 'Entrenar', desc: workoutStatus === 'done' ? 'Completado ✅' : workoutStatus === 'cancelled' ? 'Cancelado ❌' : 'Pendiente ⭕', status: workoutStatus, color: 'text-orange-400' },
                    { icon: '🛏️', label: 'Descanso Activo', desc: restStatus === 'done' ? 'Completado ✅' : restStatus === 'cancelled' ? 'Cancelado ❌' : 'Pendiente ⭕', status: restStatus, color: 'text-violet-400' },
                ];
                const completedCount = missions.filter(m => m.status === 'done').length;

                return (
                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Misiones de Hoy
                                </p>
                            </div>
                            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                {completedCount}/{missions.length}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                                style={{ width: `${(completedCount / missions.length) * 100}%` }}
                            />
                        </div>

                        {/* Mission list */}
                        <div className="space-y-2.5">
                            {missions.map((mission, idx) => {
                                const isDone = mission.status === 'done';
                                const isCancelled = mission.status === 'cancelled';
                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isDone
                                                ? 'bg-success/10 border border-success/20'
                                                : isCancelled
                                                    ? 'bg-destructive/5 border border-destructive/15'
                                                    : 'bg-muted/40 border border-transparent'
                                            }`}
                                    >
                                        {/* Check / X / Empty circle */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDone
                                                ? 'bg-success text-white'
                                                : isCancelled
                                                    ? 'bg-destructive/20 text-destructive'
                                                    : 'border-2 border-muted-foreground/30'
                                            }`}>
                                            {isDone && (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {isCancelled && (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <span className={`text-xl flex-shrink-0 ${isCancelled ? 'opacity-40' : ''}`}>{mission.icon}</span>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${isDone ? 'text-success line-through'
                                                    : isCancelled ? 'text-destructive/60 line-through'
                                                        : 'text-foreground'
                                                }`}>
                                                {mission.label}
                                            </p>
                                            <p className={`text-[11px] ${isCancelled ? 'text-destructive/50' : 'text-muted-foreground'
                                                }`}>{mission.desc}</p>
                                        </div>

                                        {/* Status badge */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isDone
                                                ? 'bg-success/20 text-success'
                                                : isCancelled
                                                    ? 'bg-destructive/10 text-destructive/70'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {isDone ? '1/1' : isCancelled ? '—' : '0/1'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {completedCount === missions.length && (
                            <div className="mt-3 pt-3 border-t border-border text-center">
                                <p className="text-sm font-bold text-success">✨ ¡Todas las misiones completadas! ✨</p>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ══════════ D. Resumen de Nutrición ══════════ */}
            <button
                onClick={() => {
                    setNutritionTab('diet');
                    setActiveTab('nutrition');
                }}
                className="w-full text-left bg-card rounded-2xl border border-border p-4 shadow-sm hover:border-primary/30 transition-colors"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-primary" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Nutrición Hoy
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Kcal bar */}
                <div className="mb-3">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-foreground">
                            {nutrition.kcal.current} kcal
                        </span>
                        <span className="text-xs text-muted-foreground">
                            / {nutrition.kcal.target}
                        </span>
                    </div>
                    <div className="nutrition-bar-track">
                        <div
                            className="nutrition-bar-fill nutrition-bar-kcal"
                            style={{ width: `${Math.min((nutrition.kcal.current / nutrition.kcal.target) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Macros row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Prot', ...nutrition.protein, color: 'nutrition-bar-protein' },
                        { label: 'Carbs', ...nutrition.carbs, color: 'nutrition-bar-carbs' },
                        { label: 'Grasa', ...nutrition.fat, color: 'nutrition-bar-fat' },
                    ].map((macro) => (
                        <div key={macro.label}>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-medium text-muted-foreground">{macro.label}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {macro.current}g
                                </span>
                            </div>
                            <div className="nutrition-bar-track nutrition-bar-track-sm">
                                <div
                                    className={`nutrition-bar-fill ${macro.color}`}
                                    style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </button>

            {/* ══════════ E. Tip del Día ══════════ */}
            <div className="tip-card">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Tip del Día
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{dailyTip}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
