import { useMemo } from 'react';
import {
    Flame, Play, Moon, Lightbulb, ChevronRight, Utensils
} from 'lucide-react';
import {
    format, startOfWeek, endOfWeek, eachDayOfInterval,
    isToday
} from 'date-fns';
import type { MobileTab, NutritionTab } from './mobileTypes';

interface HomeTabProps {
    currentUser: any;
    setActiveTab: (tab: MobileTab) => void;
    setNutritionTab: (tab: NutritionTab) => void;
    waterIntake: number;
    hasTrainedToday: boolean;
    hasRestedToday: boolean;
}

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

    // DEFINICIÓN LOCAL: Reemplaza la importación de datos falsos
    const routines: any[] = [];

    const weekDays = useMemo(() => {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, []);

    const getDayStatus = (date: Date): 'completed' | 'rest' | 'pending' | 'future' => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayInfo = (currentUser?.workoutCalendar as Record<string, any> | undefined)?.[dateStr];
        if (dayInfo?.completed) return 'completed';
        if (dayInfo?.isRestDay) return 'rest';
        if (date <= today) return 'pending';
        return 'future';
    };

    const todayStr = format(today, 'yyyy-MM-dd');
    const todayCalendar = (currentUser?.workoutCalendar as Record<string, any> | undefined)?.[todayStr];
    const isRestDay = todayCalendar?.isRestDay ?? false;

    const assignedRoutine = useMemo(() => {
        if (!currentUser?.assignedPlan) return null;
        return routines.find(r => r.id === currentUser.assignedPlan) ?? null;
    }, [currentUser?.assignedPlan]);

    const estimatedDuration = useMemo(() => {
        if (!assignedRoutine) return 0;
        return (assignedRoutine.exercises || []).reduce((total: number, ex: any) => {
            return total + (ex.sets * (45 + (ex.rest || 60)));
        }, 0);
    }, [assignedRoutine]);

    const durationMinutes = Math.round(estimatedDuration / 60);

    // LIMPIEZA: Los valores de nutrición inician en 0
    const nutrition = {
        kcal: { current: 0, target: 2000 },
        protein: { current: 0, target: 150 },
        carbs: { current: 0, target: 200 },
        fat: { current: 0, target: 70 },
    };

    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const dailyTip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return (
        <div className="p-4 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-sm">Buenos días,</p>
                    <h1 className="text-2xl font-bold text-foreground">
                        {currentUser?.name ? currentUser.name.split(' ')[0] : 'Usuario'} 👋
                    </h1>
                </div>
                <div className="streak-badge">
                    <Flame className="w-4 h-4" />
                    {currentUser?.streak || 0} días
                </div>
            </div>

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

            {isRestDay ? (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-10 translate-x-10" />
                    <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                            <Moon className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-foreground">Recuperación Activa</h2>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                Hoy tu cuerpo se reconstruye. Descansa, hidrátate y estira suavemente.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
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

            {/* Misiones de Hoy */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Misiones de Hoy
                        </p>
                    </div>
                </div>
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">💧</span>
                            <div>
                                <p className="text-sm font-semibold">Agua</p>
                                <p className="text-[11px] text-muted-foreground">{waterIntake}/4000 ml</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                <div className="mb-3">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold">{nutrition.kcal.current} kcal</span>
                        <span className="text-xs text-muted-foreground">/ {nutrition.kcal.target}</span>
                    </div>
                    <div className="nutrition-bar-track">
                        <div
                            className="nutrition-bar-fill nutrition-bar-kcal"
                            style={{ width: `${Math.min((nutrition.kcal.current / nutrition.kcal.target) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </button>

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