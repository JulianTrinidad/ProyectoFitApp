import { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Camera, Check, Calendar as CalendarIcon,
    Plus, Pencil, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HydrationTracker } from '@/components/HydrationTracker';
import { mockMeals } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { NutritionTab as NutritionTabType } from './mobileTypes';

interface NutritionTabProps {
    currentUser: any;
    updateUser: (id: string, data: any) => void;
    initialTab?: NutritionTabType;
    waterIntake: number;
    setWaterIntake: React.Dispatch<React.SetStateAction<number>>;
}

export function NutritionTab({ currentUser, updateUser, initialTab = 'diet', waterIntake, setWaterIntake }: NutritionTabProps) {
    const { toast } = useToast();

    // Local state
    const [nutritionTab, setNutritionTab] = useState<NutritionTabType>(initialTab);
    const [nutritionDate, setNutritionDate] = useState(new Date());
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ name: string; portion: string; calories: number } | null>(null);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    // Meal editing state
    const [meals, setMeals] = useState(mockMeals);
    const [editingMeal, setEditingMeal] = useState<{ mealId: string; foodIndex: number | null } | null>(null);
    const [foodForm, setFoodForm] = useState({ name: '', portion: '', calories: '' });

    // Hydration celebration state (waterIntake now comes from parent)
    const [showWaterCelebration, setShowWaterCelebration] = useState(false);

    // Local gamification
    const LEAGUES = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Esmeralda', 'Diamante'] as const;

    const addRankedPoints = (points: number, message: string) => {
        const ranked = currentUser.ranked;
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
        toast({ title: `+${points} pts`, description: message });
    };

    const handleAddWater = (amount: number) => {
        setWaterIntake(prev => {
            const newAmount = prev + amount;
            // Celebrate every 4000ml bottle completed
            const prevBottle = Math.floor(prev / 4000);
            const newBottle = Math.floor(newAmount / 4000);
            if (newBottle > prevBottle) {
                setShowWaterCelebration(true);
                addRankedPoints(10, `¡Botella ${newBottle} completada! 💧`);
                setTimeout(() => setShowWaterCelebration(false), 3000);
            }
            return newAmount;
        });
    };

    const handleScan = () => {
        setIsScanning(true);
        setScanResult(null);
        setTimeout(() => {
            setIsScanning(false);
            setScanResult({ name: 'Pechuga de Pollo', portion: '200g', calories: 330 });
        }, 2000);
    };

    const handleOpenFoodEditor = (mealId: string, foodIndex: number | null = null) => {
        if (foodIndex !== null) {
            const meal = meals.find(m => m.id === mealId);
            if (meal && meal.foods[foodIndex]) {
                const food = meal.foods[foodIndex];
                setFoodForm({ name: food.name, portion: food.portion, calories: food.calories.toString() });
            }
        } else {
            setFoodForm({ name: '', portion: '', calories: '' });
        }
        setEditingMeal({ mealId, foodIndex });
    };

    const handleSaveFood = () => {
        if (!editingMeal || !foodForm.name || !foodForm.portion || !foodForm.calories) {
            toast({ title: "Completa todos los campos", variant: "destructive" });
            return;
        }

        const newFood = {
            name: foodForm.name,
            portion: foodForm.portion,
            calories: parseInt(foodForm.calories) || 0
        };

        setMeals(prev => prev.map(meal => {
            if (meal.id !== editingMeal.mealId) return meal;
            const updatedFoods = [...meal.foods];
            if (editingMeal.foodIndex !== null) {
                updatedFoods[editingMeal.foodIndex] = newFood;
            } else {
                updatedFoods.push(newFood);
            }
            return { ...meal, foods: updatedFoods };
        }));

        toast({
            title: editingMeal.foodIndex !== null ? "Alimento actualizado ✅" : "Alimento agregado ✅"
        });
        setEditingMeal(null);
        setFoodForm({ name: '', portion: '', calories: '' });
    };

    const handleDeleteFood = (mealId: string, foodIndex: number) => {
        setMeals(prev => prev.map(meal => {
            if (meal.id !== mealId) return meal;
            return { ...meal, foods: meal.foods.filter((_, idx) => idx !== foodIndex) };
        }));
        toast({ title: "Alimento eliminado" });
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            {/* Water Celebration Overlay */}
            {showWaterCelebration && (
                <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center animate-fade-in">
                    <div className="text-center p-8">
                        <div className="text-8xl mb-6 animate-bounce">💧</div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">¡Meta Cumplida!</h2>
                        <p className="text-muted-foreground text-lg mb-4">Has completado tu hidratación diaria</p>
                        <p className="text-success text-xl font-semibold">+10 pts Hidratación</p>
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold text-foreground">Nutrición</h1>

            {/* Water Tracker */}
            <HydrationTracker
                waterIntake={waterIntake}
                onAddWater={handleAddWater}
                onReset={() => setWaterIntake(0)}
            />

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                    onClick={() => setNutritionTab('diet')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${nutritionTab === 'diet' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                >
                    Mi Dieta
                </button>
                <button
                    onClick={() => setNutritionTab('scanner')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${nutritionTab === 'scanner' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                >
                    Escáner IA
                </button>
            </div>

            {nutritionTab === 'diet' ? (
                <div className="space-y-4">
                    {/* Date Navigation with Popover */}
                    <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-3">
                        <button
                            onClick={() => setNutritionDate(prev => subDays(prev, 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <button className="text-center hover:bg-muted rounded-xl px-4 py-2 transition-colors">
                                    <p className="font-semibold text-foreground capitalize">
                                        {isToday(nutritionDate) ? 'Hoy' : format(nutritionDate, 'EEEE', { locale: es })}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                        <CalendarIcon className="w-3 h-3" />
                                        {format(nutritionDate, "d 'de' MMMM yyyy", { locale: es })}
                                    </p>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                                <Calendar
                                    mode="single"
                                    selected={nutritionDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            setNutritionDate(date);
                                            setDatePickerOpen(false);
                                        }
                                    }}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>

                        <button
                            onClick={() => setNutritionDate(prev => addDays(prev, 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                            disabled={isToday(nutritionDate)}
                        >
                            <ChevronRight className={`w-5 h-5 ${isToday(nutritionDate) ? 'text-muted' : 'text-muted-foreground'}`} />
                        </button>
                    </div>

                    {/* Meals List */}
                    <div className="space-y-3">
                        {meals.map((meal) => (
                            <div key={meal.id} className="bg-card rounded-2xl border border-border p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">
                                            {meal.name === 'Desayuno' && '🌅'}
                                            {meal.name === 'Media Mañana' && '🍎'}
                                            {meal.name === 'Almuerzo' && '🍽️'}
                                            {meal.name === 'Merienda' && '🥤'}
                                            {meal.name === 'Cena' && '🌙'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{meal.name}</h3>
                                            <p className="text-xs text-muted-foreground">{meal.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-primary">
                                            {meal.foods.reduce((acc, f) => acc + f.calories, 0)} kcal
                                        </span>
                                        <button
                                            onClick={() => handleOpenFoodEditor(meal.id)}
                                            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 text-primary" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {meal.foods.map((food, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm group">
                                            <div className="flex-1">
                                                <span className="text-muted-foreground">{food.name}</span>
                                                <span className="text-foreground ml-2">({food.portion})</span>
                                                <span className="text-xs text-muted-foreground ml-2">{food.calories} kcal</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenFoodEditor(meal.id, idx)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFood(meal.id, idx)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {meal.foods.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">Sin alimentos registrados</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Food Editor Dialog */}
                    <Dialog open={!!editingMeal} onOpenChange={(open) => !open && setEditingMeal(null)}>
                        <DialogContent className="max-w-[90vw] rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingMeal?.foodIndex !== null ? 'Editar Alimento' : 'Agregar Alimento'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="food-name">Nombre</Label>
                                    <Input
                                        id="food-name"
                                        placeholder="Ej: Pechuga de pollo"
                                        value={foodForm.name}
                                        onChange={(e) => setFoodForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="food-portion">Porción</Label>
                                    <Input
                                        id="food-portion"
                                        placeholder="Ej: 200g"
                                        value={foodForm.portion}
                                        onChange={(e) => setFoodForm(prev => ({ ...prev, portion: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="food-calories">Calorías</Label>
                                    <Input
                                        id="food-calories"
                                        type="number"
                                        placeholder="Ej: 330"
                                        value={foodForm.calories}
                                        onChange={(e) => setFoodForm(prev => ({ ...prev, calories: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="flex gap-2">
                                <Button variant="secondary" onClick={() => setEditingMeal(null)}>
                                    Cancelar
                                </Button>
                                <Button variant="gradient" onClick={handleSaveFood}>
                                    {editingMeal?.foodIndex !== null ? 'Guardar' : 'Agregar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Scanner Area */}
                    <div className="aspect-square bg-muted rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden">
                        {isScanning ? (
                            <div className="text-center animate-pulse">
                                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                                <p className="text-muted-foreground">Analizando comida...</p>
                            </div>
                        ) : (
                            <>
                                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center px-8">
                                    Toma una foto de tu comida para analizar las calorías con IA
                                </p>
                            </>
                        )}
                    </div>

                    <Button variant="gradient" size="xl" className="w-full" onClick={handleScan} disabled={isScanning}>
                        <Camera className="w-5 h-5" />
                        {isScanning ? 'Analizando...' : 'Capturar'}
                    </Button>

                    {/* Scan Result */}
                    {scanResult && (
                        <div className="bg-card rounded-2xl border border-border p-4 animate-slide-up">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                        <span className="text-2xl">🍗</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{scanResult.name}</h3>
                                        <p className="text-sm text-muted-foreground">{scanResult.portion}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">{scanResult.calories}</p>
                                    <p className="text-xs text-muted-foreground">kcal</p>
                                </div>
                            </div>
                            <Button
                                variant="success"
                                className="w-full"
                                onClick={() => {
                                    toast({ title: "Comida registrada ✅", description: `${scanResult.name} agregado a tu diario` });
                                    setScanResult(null);
                                }}
                            >
                                <Check className="w-5 h-5" />
                                Registrar
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
