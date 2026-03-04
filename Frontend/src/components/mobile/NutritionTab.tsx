import { useState, useEffect, useCallback } from 'react';
import {
    ChevronRight, ChevronLeft, Camera, Plus, Trash2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HydrationTracker } from '@/components/HydrationTracker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format, isToday, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { NutritionTab as NutritionTabType } from './mobileTypes';

// ─── TIPOS DE DATOS ──────────────────────────────────────────────────
interface NutritionLogItem {
    name: string;
    quantity: string;
    calories: number;
}

interface NutritionLog {
    id: string;
    user_id: string;
    meal_name: string;
    total_calories: number;
    items: NutritionLogItem[];
    log_date: string;
}

// ─── EMOJIS POR COMIDA ──────────────────────────────────────────────
const MEAL_EMOJI: Record<string, string> = {
    desayuno: '🌅',
    almuerzo: '☀️',
    merienda: '🍵',
    cena: '🌙',
    snack: '🍎',
};

function getMealEmoji(mealName: string): string {
    const key = mealName.toLowerCase().trim();
    return MEAL_EMOJI[key] || '🍽️';
}

// ─── PROPS ───────────────────────────────────────────────────────────
interface NutritionTabProps {
    currentUser: any;
    updateUser: (id: string, data: any) => void;
    initialTab?: NutritionTabType;
    waterIntake: number;
    setWaterIntake: React.Dispatch<React.SetStateAction<number>>;
}

export function NutritionTab({ currentUser, updateUser, initialTab = 'diet', waterIntake, setWaterIntake }: NutritionTabProps) {
    const { toast } = useToast();

    // ─── ESTADOS DE NAVEGACIÓN ───────────────────────────────────────
    const [nutritionTab, setNutritionTab] = useState<NutritionTabType>(initialTab);
    const [nutritionDate, setNutritionDate] = useState(new Date());
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    // ─── SCANNER ─────────────────────────────────────────────────────
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ name: string; portion: string; calories: number } | null>(null);

    // ─── SUPABASE LOGS ───────────────────────────────────────────────
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // ─── MODAL STATE ─────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMealName, setModalMealName] = useState('');
    const [modalItems, setModalItems] = useState<NutritionLogItem[]>([
        { name: '', quantity: '', calories: 0 }
    ]);
    const [addToExistingLogId, setAddToExistingLogId] = useState<string | null>(null);

    // ─── CELEBRACIÓN AGUA ────────────────────────────────────────────
    const [showWaterCelebration, setShowWaterCelebration] = useState(false);

    // ─── RANKED POINTS (SIN TOCAR) ───────────────────────────────────
    const LEAGUES = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Esmeralda', 'Diamante'] as const;

    const addRankedPoints = async (points: number, message: string) => {
        const ranked = currentUser?.ranked;
        if (!ranked) return;
        let newPoints = ranked.currentPoints + points;
        let newDivision = ranked.division;
        let newLeague = ranked.league;
        while (newPoints >= 100) {
            newPoints -= 100;
            if (newDivision > 1) {
                newDivision = (newDivision - 1) as 1 | 2 | 3 | 4 | 5;
            } else {
                const li = LEAGUES.indexOf(newLeague as typeof LEAGUES[number]);
                if (li < LEAGUES.length - 1) { newLeague = LEAGUES[li + 1]; newDivision = 5; }
                else { newPoints = 100; break; }
            }
        }
        updateUser(currentUser.id, {
            ranked: { league: newLeague as any, division: newDivision, currentPoints: newPoints, maxPoints: 100 }
        });

        await supabase
            .from('profiles')
            .update({ ranked: { league: newLeague, division: newDivision, currentPoints: newPoints, maxPoints: 100 } })
            .eq('id', currentUser.id);

        toast({ title: `+${points} pts`, description: message });
    };

    // ─── AGUA (SIN TOCAR) ────────────────────────────────────────────
    const handleAddWater = (amount: number) => {
        setWaterIntake(prev => {
            const newAmount = prev + amount;
            const prevBottle = Math.floor(prev / 4000);
            const newBottle = Math.floor(newAmount / 4000);
            if (newBottle > prevBottle) {
                setShowWaterCelebration(true);
                addRankedPoints(10, `¡Meta alcanzada! 💧`);
                setTimeout(() => setShowWaterCelebration(false), 3000);
            }
            return newAmount;
        });
    };

    // ─── SCANNER (SIN TOCAR) ─────────────────────────────────────────
    const handleScan = () => {
        setIsScanning(true);
        setScanResult(null);
        setTimeout(() => {
            setIsScanning(false);
            setScanResult({ name: 'Alimento Detectado', portion: '1 porción', calories: 250 });
        }, 2000);
    };

    // ─── SUPABASE: FETCH LOGS ────────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        if (!currentUser?.id) return;
        setIsLoading(true);
        try {
            const dateStr = format(nutritionDate, 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('log_date', dateStr)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching nutrition logs:', error);
                setLogs([]);
            } else {
                setLogs((data as NutritionLog[]) || []);
            }
        } catch (err) {
            console.error('Error fetching nutrition logs:', err);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id, nutritionDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // ─── SUPABASE: INSERT LOG ────────────────────────────────────────
    const insertLog = async (mealName: string, items: NutritionLogItem[]) => {
        if (!currentUser?.id) return;
        const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
        const dateStr = format(nutritionDate, 'yyyy-MM-dd');

        const { error } = await supabase
            .from('nutrition_logs')
            .insert({
                user_id: currentUser.id,
                meal_name: mealName,
                total_calories: totalCalories,
                items: items,
                log_date: dateStr,
            });

        if (error) {
            console.error('Error inserting nutrition log:', error);
            toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Comida registrada ✅' });
            addRankedPoints(5, '¡Comida registrada! 🍽️');
            await fetchLogs();
        }
    };

    // ─── SUPABASE: ADD ITEMS TO EXISTING LOG ─────────────────────────
    const addItemsToLog = async (logId: string, newItems: NutritionLogItem[]) => {
        const existingLog = logs.find(l => l.id === logId);
        if (!existingLog) return;

        const updatedItems = [...existingLog.items, ...newItems];
        const updatedCalories = updatedItems.reduce((sum, item) => sum + item.calories, 0);

        const { error } = await supabase
            .from('nutrition_logs')
            .update({
                items: updatedItems,
                total_calories: updatedCalories,
            })
            .eq('id', logId);

        if (error) {
            console.error('Error updating nutrition log:', error);
            toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Alimento añadido ✅' });
            await fetchLogs();
        }
    };

    // ─── SUPABASE: DELETE LOG ────────────────────────────────────────
    const deleteLog = async (id: string) => {
        const { error } = await supabase
            .from('nutrition_logs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting nutrition log:', error);
            toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Comida eliminada' });
            await fetchLogs();
        }
    };

    // ─── MODAL HELPERS ───────────────────────────────────────────────
    const openModalNewMeal = () => {
        setAddToExistingLogId(null);
        setModalMealName('');
        setModalItems([{ name: '', quantity: '', calories: 0 }]);
        setModalOpen(true);
    };

    const openModalAddToMeal = (log: NutritionLog) => {
        setAddToExistingLogId(log.id);
        setModalMealName(log.meal_name);
        setModalItems([{ name: '', quantity: '', calories: 0 }]);
        setModalOpen(true);
    };

    const addItemRow = () => {
        setModalItems(prev => [...prev, { name: '', quantity: '', calories: 0 }]);
    };

    const removeItemRow = (index: number) => {
        setModalItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItemField = (index: number, field: keyof NutritionLogItem, value: string | number) => {
        setModalItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            if (field === 'calories') {
                return { ...item, [field]: typeof value === 'string' ? (parseInt(value) || 0) : value };
            }
            return { ...item, [field]: value };
        }));
    };

    const modalTotalCalories = modalItems.reduce((sum, item) => sum + item.calories, 0);

    const handleModalSubmit = async () => {
        const validItems = modalItems.filter(item => item.name.trim() !== '');
        if (validItems.length === 0) {
            toast({ title: 'Agrega al menos un alimento', variant: 'destructive' });
            return;
        }

        if (addToExistingLogId) {
            await addItemsToLog(addToExistingLogId, validItems);
        } else {
            if (!modalMealName.trim()) {
                toast({ title: 'Ingresa un nombre de comida', variant: 'destructive' });
                return;
            }
            await insertLog(modalMealName.trim(), validItems);
        }

        setModalOpen(false);
        setModalMealName('');
        setModalItems([{ name: '', quantity: '', calories: 0 }]);
        setAddToExistingLogId(null);
    };

    // ─── TOTAL DEL DÍA ──────────────────────────────────────────────
    const dailyTotalCalories = logs.reduce((sum, log) => sum + log.total_calories, 0);

    // ─── RENDER ──────────────────────────────────────────────────────
    return (
        <div className="p-4 space-y-6 animate-fade-in">
            {/* Celebración de agua */}
            {showWaterCelebration && (
                <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center animate-fade-in">
                    <div className="text-center p-8">
                        <div className="text-8xl mb-6 animate-bounce">💧</div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">¡Meta Cumplida!</h2>
                        <p className="text-muted-foreground">Has completado tu hidratación</p>
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold text-foreground">Nutrición</h1>

            {/* Hidratación */}
            <HydrationTracker
                waterIntake={waterIntake}
                onAddWater={handleAddWater}
                onReset={() => setWaterIntake(0)}
            />

            {/* Toggle Dieta / Escáner */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                    onClick={() => setNutritionTab('diet')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${nutritionTab === 'diet' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                    Mi Dieta
                </button>
                <button
                    onClick={() => setNutritionTab('scanner')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${nutritionTab === 'scanner' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                    Escáner IA
                </button>
            </div>

            {nutritionTab === 'diet' ? (
                <div className="space-y-4">
                    {/* ── Navegador de Fecha ──────────────────────────────── */}
                    <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-3">
                        <button onClick={() => setNutritionDate(prev => subDays(prev, 1))} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted">
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <button className="text-center hover:bg-muted rounded-xl px-4 py-2">
                                    <p className="font-semibold text-foreground capitalize">
                                        {isToday(nutritionDate) ? 'Hoy' : format(nutritionDate, 'EEEE', { locale: es })}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                        {format(nutritionDate, "d 'de' MMMM", { locale: es })}
                                    </p>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                                <Calendar
                                    mode="single"
                                    selected={nutritionDate}
                                    onSelect={(date) => { if (date) { setNutritionDate(date); setDatePickerOpen(false); } }}
                                    disabled={(date) => date > new Date()}
                                />
                            </PopoverContent>
                        </Popover>

                        <button onClick={() => setNutritionDate(prev => addDays(prev, 1))} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted" disabled={isToday(nutritionDate)}>
                            <ChevronRight className={`w-5 h-5 ${isToday(nutritionDate) ? 'text-muted' : 'text-muted-foreground'}`} />
                        </button>
                    </div>

                    {/* ── Resumen del día ─────────────────────────────────── */}
                    {logs.length > 0 && (
                        <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl border border-orange-200/50 dark:border-orange-800/30 px-5 py-3">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total del día</p>
                                <p className="text-2xl font-bold text-orange-500">{dailyTotalCalories} <span className="text-sm font-medium">kcal</span></p>
                            </div>
                            <div className="text-3xl">🔥</div>
                        </div>
                    )}

                    {/* ── Loading State ───────────────────────────────────── */}
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        </div>
                    )}

                    {/* ── Tarjetas de Comidas ─────────────────────────────── */}
                    {!isLoading && (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                                    {/* Header de la tarjeta */}
                                    <div className="flex items-center justify-between p-5 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-xl">
                                                {getMealEmoji(log.meal_name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground text-base">{log.meal_name}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(log.log_date + 'T00:00:00'), "d 'de' MMMM", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-500 font-semibold text-sm">
                                                {log.total_calories} kcal
                                            </span>
                                            <button
                                                onClick={() => openModalAddToMeal(log)}
                                                className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                                            >
                                                <Plus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lista de ítems */}
                                    {log.items && log.items.length > 0 && (
                                        <div className="px-5 pb-4 space-y-3">
                                            <div className="border-t border-border/50 pt-3 space-y-3">
                                                {log.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm text-foreground font-medium">{item.name}</span>
                                                            {item.quantity && (
                                                                <span className="text-sm text-muted-foreground ml-1.5">({item.quantity})</span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground ml-3 whitespace-nowrap">
                                                            {item.calories} kcal
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer: Eliminar */}
                                    <div className="px-5 pb-4 flex justify-end">
                                        <button
                                            onClick={() => deleteLog(log.id)}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-1 px-2 rounded-lg hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Estado vacío */}
                            {logs.length === 0 && !isLoading && (
                                <div className="p-10 text-center border-2 border-dashed border-border rounded-3xl bg-card/50">
                                    <div className="text-5xl mb-3">🍽️</div>
                                    <p className="text-sm text-muted-foreground font-medium">Tu diario de comidas está vacío</p>
                                    <p className="text-xs text-muted-foreground mt-1">Registra tu primera comida del día</p>
                                </div>
                            )}

                            {/* Botón principal AGREGAR COMIDA */}
                            <Button
                                variant="gradient"
                                size="xl"
                                className="w-full"
                                onClick={openModalNewMeal}
                            >
                                <Plus className="w-5 h-5" />
                                AGREGAR COMIDA
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                /* ── TAB: ESCÁNER IA ─────────────────────────────────────── */
                <div className="space-y-4">
                    <div className="aspect-square bg-muted rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden">
                        {isScanning ? (
                            <div className="text-center animate-pulse">
                                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                                <p className="text-muted-foreground">Analizando...</p>
                            </div>
                        ) : scanResult ? (
                            <div className="text-center p-6">
                                <div className="text-5xl mb-4">✅</div>
                                <h3 className="font-bold text-foreground text-lg mb-1">{scanResult.name}</h3>
                                <p className="text-muted-foreground text-sm">{scanResult.portion}</p>
                                <p className="text-orange-500 font-semibold text-lg mt-2">{scanResult.calories} kcal</p>
                            </div>
                        ) : (
                            <>
                                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center px-8 text-sm">
                                    Usa la cámara para analizar calorías con IA
                                </p>
                            </>
                        )}
                    </div>

                    <Button variant="gradient" size="xl" className="w-full" onClick={handleScan} disabled={isScanning}>
                        <Camera className="w-5 h-5" />
                        {isScanning ? 'Procesando...' : 'Escanear Plato'}
                    </Button>
                </div>
            )}

            {/* ── MODAL: AGREGAR / EDITAR COMIDA ─────────────────────────── */}
            <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) setModalOpen(false); }}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {addToExistingLogId ? `Añadir a ${modalMealName}` : 'Nueva Comida'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Nombre de la comida (solo si es nueva) */}
                        {!addToExistingLogId && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Nombre de la comida</Label>
                                <Input
                                    placeholder="Ej: Desayuno, Almuerzo, Cena…"
                                    value={modalMealName}
                                    onChange={(e) => setModalMealName(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        )}

                        {/* Lista dinámica de alimentos */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Alimentos</Label>

                            {modalItems.map((item, index) => (
                                <div key={index} className="bg-muted/50 rounded-xl p-3 space-y-2 relative">
                                    {modalItems.length > 1 && (
                                        <button
                                            onClick={() => removeItemRow(index)}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </button>
                                    )}
                                    <Input
                                        placeholder="Nombre del alimento"
                                        value={item.name}
                                        onChange={(e) => updateItemField(index, 'name', e.target.value)}
                                        className="rounded-lg bg-background text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Cantidad (ej: 60g)"
                                            value={item.quantity}
                                            onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                                            className="rounded-lg bg-background text-sm flex-1"
                                        />
                                        <Input
                                            placeholder="Kcal"
                                            type="number"
                                            value={item.calories || ''}
                                            onChange={(e) => updateItemField(index, 'calories', e.target.value)}
                                            className="rounded-lg bg-background text-sm w-24"
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addItemRow}
                                className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground font-medium hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir alimento
                            </button>
                        </div>

                        {/* Total de calorías (auto-calculado) */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl px-4 py-3 border border-orange-200/50 dark:border-orange-800/30">
                            <span className="text-sm font-semibold text-foreground">Total calorías</span>
                            <span className="text-lg font-bold text-orange-500">{modalTotalCalories} kcal</span>
                        </div>

                        {/* Botón placeholder – Escanear con IA */}
                        <button
                            className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-sm font-medium text-primary/70 hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                            onClick={() => toast({ title: 'Próximamente', description: 'El escaneo con IA estará disponible pronto.' })}
                        >
                            <Sparkles className="w-4 h-4" />
                            Escanear plato con IA
                        </button>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl">
                            Cancelar
                        </Button>
                        <Button variant="gradient" onClick={handleModalSubmit} className="flex-1 rounded-xl">
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}