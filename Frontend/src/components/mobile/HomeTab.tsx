import { useState, useEffect, useCallback } from 'react';
import {
    Flame, Lightbulb, ChevronRight, ChevronLeft, Utensils, Dumbbell, X, Droplets
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { MobileTab, NutritionTab } from './mobileTypes';

interface HomeTabProps {
    currentUser: any;
    setActiveTab: (tab: MobileTab) => void;
    setNutritionTab: (tab: NutritionTab) => void;
    waterIntake: number;
    hasTrainedToday: boolean;
    hasRestedToday: boolean;
}

interface RoutineRow {
    id: string;
    name: string;
    assigned_day: string | null;
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

const WEEKDAYS = [
    { key: 'monday', label: 'L' },
    { key: 'tuesday', label: 'M' },
    { key: 'wednesday', label: 'MI' },
    { key: 'thursday', label: 'J' },
    { key: 'friday', label: 'V' },
] as const;

function getStreakColor(streak: number): string {
    if (streak <= 10) return 'text-slate-500 border-slate-500';
    if (streak <= 20) return 'text-amber-500 border-amber-500';
    if (streak <= 30) return 'text-gray-400 border-gray-400';
    if (streak <= 40) return 'text-yellow-500 border-yellow-500';
    if (streak <= 50) return 'text-emerald-500 border-emerald-500';
    if (streak <= 60) return 'text-cyan-400 border-cyan-400';
    return 'text-purple-500 border-purple-500';
}

export function HomeTab({ currentUser, setActiveTab, setNutritionTab, waterIntake, hasTrainedToday, hasRestedToday }: HomeTabProps) {
    const today = new Date();

    // ── State: rutinas del usuario ──
    const [routines, setRoutines] = useState<RoutineRow[]>([]);
    const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);

    // ── State: selector de día ──
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
    const [showDaySelector, setShowDaySelector] = useState(false);

    // ── Fetch routines from Supabase ──
    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchRoutines = async () => {
            try {
                setIsLoadingRoutines(true);
                const { data, error } = await supabase
                    .from('routines')
                    .select('id, name, assigned_day')
                    .eq('user_id', currentUser.id);

                if (error) throw error;
                setRoutines(data || []);
            } catch (err) {
                console.error('Error fetching routines:', err);
            } finally {
                setIsLoadingRoutines(false);
            }
        };
        fetchRoutines();
    }, [currentUser?.id]);

    // ── Derived: mapa día → rutina ──
    const dayRoutineMap: Record<string, RoutineRow | null> = {};
    WEEKDAYS.forEach(wd => {
        dayRoutineMap[wd.key] = routines.find(r => r.assigned_day === wd.key) || null;
    });

    const hasAnyAssigned = WEEKDAYS.some(wd => dayRoutineMap[wd.key] !== null);

    // ── Handler: abrir selector ──
    const handleDayTap = (dayKey: string) => {
        setSelectedDayKey(dayKey);
        setShowDaySelector(true);
    };

    // ── Handler: asignar rutina a un día ──
    const handleAssignRoutine = async (routineId: string) => {
        if (!selectedDayKey) return;

        // Si otra rutina ya tenía este día, limpiarla primero
        const oldRoutine = routines.find(r => r.assigned_day === selectedDayKey);
        if (oldRoutine && oldRoutine.id !== routineId) {
            await supabase.from('routines').update({ assigned_day: null }).eq('id', oldRoutine.id);
        }

        // Asignar el nuevo día
        const { error } = await supabase
            .from('routines')
            .update({ assigned_day: selectedDayKey })
            .eq('id', routineId);

        if (!error) {
            // Actualizar estado local
            setRoutines(prev => prev.map(r => {
                if (r.id === routineId) return { ...r, assigned_day: selectedDayKey };
                if (r.assigned_day === selectedDayKey && r.id !== routineId) return { ...r, assigned_day: null };
                return r;
            }));
        }
        setShowDaySelector(false);
    };

    // ── Handler: quitar rutina de un día ──
    const handleClearDay = async () => {
        if (!selectedDayKey) return;
        const routine = routines.find(r => r.assigned_day === selectedDayKey);
        if (routine) {
            const { error } = await supabase
                .from('routines')
                .update({ assigned_day: null })
                .eq('id', routine.id);

            if (!error) {
                setRoutines(prev => prev.map(r =>
                    r.id === routine.id ? { ...r, assigned_day: null } : r
                ));
            }
        }
        setShowDaySelector(false);
    };

    // ── Nutrición sincronizada desde Supabase ──
    const MEALS = [
        { key: 'desayuno', label: 'Desayuno', emoji: '🌅' },
        { key: 'almuerzo', label: 'Almuerzo', emoji: '☀️' },
        { key: 'merienda', label: 'Merienda', emoji: '🍵' },
        { key: 'cena', label: 'Cena', emoji: '🌙' },
    ];

    interface MealMacros { kcal: number; protein: number; carbs: number; fat: number; }
    const emptyMacros = (): MealMacros => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

    const [totalKcal, setTotalKcal] = useState(0);
    const [mealData, setMealData] = useState<Record<string, MealMacros>>({
        desayuno: emptyMacros(), almuerzo: emptyMacros(), merienda: emptyMacros(), cena: emptyMacros()
    });
    const [activeMealIndex, setActiveMealIndex] = useState(0);

    const KCAL_TARGET = 2000;
    const WATER_TARGET = 4000;
    const PROTEIN_TARGET = 150;
    const CARBS_TARGET = 250;
    const FAT_TARGET = 70;

    const fetchNutritionToday = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('meal_name, total_calories, items')
                .eq('user_id', currentUser.id)
                .eq('log_date', todayStr);

            if (error) throw error;

            let total = 0;
            const breakdown: Record<string, MealMacros> = {
                desayuno: emptyMacros(), almuerzo: emptyMacros(), merienda: emptyMacros(), cena: emptyMacros()
            };

            (data || []).forEach((log: any) => {
                total += log.total_calories || 0;
                const key = log.meal_name?.toLowerCase().trim();
                if (key && key in breakdown) {
                    breakdown[key].kcal += log.total_calories || 0;
                    // Sum per-item macros if available
                    if (Array.isArray(log.items)) {
                        log.items.forEach((item: any) => {
                            breakdown[key].protein += item.protein || 0;
                            breakdown[key].carbs += item.carbs || 0;
                            breakdown[key].fat += item.fats || item.fat || 0;
                        });
                    }
                }
            });

            setTotalKcal(total);
            setMealData(breakdown);
        } catch (err) {
            console.error('Error fetching nutrition logs:', err);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        fetchNutritionToday();
    }, [fetchNutritionToday]);

    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const dailyTip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];

    const streak = currentUser?.streak || 0;

    const activeMeal = MEALS[activeMealIndex];
    const activeMealMacros = mealData[activeMeal.key];

    return (
        <div className="p-4 space-y-5 animate-fade-in">
            {/* ── Saludo ── */}
            <div>
                <p className="text-muted-foreground text-sm">Buenos días,</p>
                <h1 className="text-2xl font-bold text-foreground">
                    {currentUser?.name ? currentUser.name.split(' ')[0] : 'Usuario'} 👋
                </h1>
            </div>

            {/* ── STREAK PILL ── */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 bg-orange-500 rounded-full px-6 py-3 shadow-lg shadow-orange-500/30">
                    <Flame className="w-6 h-6 text-white" fill="white" />
                    <span className="text-white font-black text-xl tabular-nums">{streak} días</span>
                </div>
            </div>

            {/* ── CARD: RUTINA SEMANAL (5 DÍAS) ── */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm relative overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Rutina Semanal
                </p>
                <div className="grid grid-cols-5 gap-2">
                    {WEEKDAYS.map(wd => {
                        const routine = dayRoutineMap[wd.key];
                        return (
                            <button
                                key={wd.key}
                                onClick={() => handleDayTap(wd.key)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/40 border border-border/50 hover:border-primary/40 transition-all active:scale-95"
                            >
                                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                                    {wd.label}
                                </span>
                                {routine ? (
                                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                                        <span className="text-sm font-black text-primary leading-none">
                                            {routine.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-muted/60 border-2 border-dashed border-border flex items-center justify-center">
                                        <span className="text-lg text-muted-foreground/40">+</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {!hasAnyAssigned && !isLoadingRoutines && (
                    <p className="text-center text-xs text-muted-foreground/60 mt-3 italic">
                        Tocá un día para asignar tu rutina semanal
                    </p>
                )}
            </div>

            {/* ── CARD: AGUA ── */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hidratación</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{waterIntake}/{WATER_TARGET} ml</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((waterIntake / WATER_TARGET) * 100, 100)}%` }}
                    />
                </div>
            </div>

            {/* ── CARD: NUTRICIÓN (Carrusel) ── */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
                {/* Cabecera + barra total */}
                <button
                    onClick={() => { setNutritionTab('diet'); setActiveTab('nutrition'); }}
                    className="w-full text-left"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nutrición Hoy</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground tabular-nums">{totalKcal}/{KCAL_TARGET} kcal</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((totalKcal / KCAL_TARGET) * 100, 100)}%` }}
                        />
                    </div>
                </button>

                {/* Selector de comida (carrusel) */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setActiveMealIndex(prev => prev > 0 ? prev - 1 : MEALS.length - 1)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <div className="text-center">
                        <span className="text-lg">{activeMeal.emoji}</span>
                        <p className="text-sm font-bold text-foreground">{activeMeal.label}</p>
                    </div>
                    <button
                        onClick={() => setActiveMealIndex(prev => prev < MEALS.length - 1 ? prev + 1 : 0)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-1.5">
                    {MEALS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeMealIndex ? 'bg-amber-500' : 'bg-muted-foreground/20'}`}
                        />
                    ))}
                </div>

                {/* Barras de macros para comida activa */}
                <div className="space-y-2.5">
                    {[
                        { label: 'Kcal', value: activeMealMacros.kcal, target: KCAL_TARGET / 4, color: 'bg-amber-500', unit: 'kcal' },
                        { label: 'Proteína', value: activeMealMacros.protein, target: PROTEIN_TARGET / 4, color: 'bg-blue-500', unit: 'g' },
                        { label: 'Carbos', value: activeMealMacros.carbs, target: CARBS_TARGET / 4, color: 'bg-yellow-500', unit: 'g' },
                        { label: 'Grasas', value: activeMealMacros.fat, target: FAT_TARGET / 4, color: 'bg-rose-500', unit: 'g' },
                    ].map(macro => (
                        <div key={macro.label}>
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-semibold text-muted-foreground">{macro.label}</span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {Math.round(macro.value)}/{Math.round(macro.target)} {'unit' in macro ? macro.unit : 'g'}
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${macro.color}`}
                                    style={{ width: `${macro.target > 0 ? Math.min((macro.value / macro.target) * 100, 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tip del Día */}
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

            {/* ── DIALOG: Selector de Rutina para un día ── */}
            <Dialog open={showDaySelector} onOpenChange={setShowDaySelector}>
                <DialogContent className="max-w-[92vw] sm:max-w-sm rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5 text-primary" />
                            Asignar rutina —{' '}
                            {WEEKDAYS.find(w => w.key === selectedDayKey)?.label || ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 py-3 max-h-[50vh] overflow-y-auto">
                        {routines.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-6">
                                No tenés rutinas creadas aún.<br />
                                Creá una desde la pestaña de Ejercicios.
                            </p>
                        ) : (
                            routines.map(r => {
                                const isCurrentlyAssigned = r.assigned_day === selectedDayKey;
                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => handleAssignRoutine(r.id)}
                                        className={`w-full text-left flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${isCurrentlyAssigned
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-card hover:border-primary/30'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCurrentlyAssigned ? 'bg-primary/20' : 'bg-muted'
                                            }`}>
                                            <span className={`text-sm font-black ${isCurrentlyAssigned ? 'text-primary' : 'text-muted-foreground'
                                                }`}>
                                                {r.name.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground">{r.name}</p>
                                            {r.assigned_day && r.assigned_day !== selectedDayKey && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Asignada a: {WEEKDAYS.find(w => w.key === r.assigned_day)?.label}
                                                </p>
                                            )}
                                        </div>
                                        {isCurrentlyAssigned && (
                                            <span className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">
                                                Actual
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Botón para quitar la rutina del día */}
                    {selectedDayKey && dayRoutineMap[selectedDayKey] && (
                        <button
                            onClick={handleClearDay}
                            className="w-full flex items-center justify-center gap-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl py-2.5 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Quitar rutina de este día
                        </button>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}