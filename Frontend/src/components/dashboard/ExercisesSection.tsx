import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload, Eye, Check } from 'lucide-react';
import { mockExercises, Exercise } from '@/data/mockData';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

export function ExercisesSection() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<'all' | 'upper' | 'lower'>('all');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Biblioteca de Ejercicios</h1>
                    <p className="text-muted-foreground">Gestiona tu catálogo de ejercicios</p>
                </div>
                <Button variant="gradient">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Nuevo
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ejercicio..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex bg-muted p-1 rounded-xl">
                    <button
                        onClick={() => setSelectedMuscleFilter('all')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMuscleFilter === 'all' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setSelectedMuscleFilter('upper')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMuscleFilter === 'upper' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                        Tren Superior
                    </button>
                    <button
                        onClick={() => setSelectedMuscleFilter('lower')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMuscleFilter === 'lower' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                        Tren Inferior
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mockExercises
                    .filter(e => {
                        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const upperMuscles = ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Core'];
                        const lowerMuscles = ['Piernas', 'Glúteos', 'Pantorrillas'];

                        if (selectedMuscleFilter === 'upper') return matchesSearch && upperMuscles.includes(e.muscleGroup);
                        if (selectedMuscleFilter === 'lower') return matchesSearch && lowerMuscles.includes(e.muscleGroup);
                        return matchesSearch;
                    })
                    .map((exercise) => (
                        <div
                            key={exercise.id}
                            className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => setSelectedExercise(exercise)}
                        >
                            <div className="aspect-video bg-muted relative overflow-hidden">
                                <img
                                    src={exercise.image}
                                    alt={exercise.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <Button size="sm" variant="secondary">
                                        <Eye className="w-4 h-4 mr-1" />
                                        Ver
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">{exercise.muscleGroup}</span>
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">{exercise.equipment}</span>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Exercise Detail Modal */}
            <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    {selectedExercise && (
                        <div className="animate-fade-in">
                            <div className="relative h-64 bg-muted">
                                <img
                                    src={selectedExercise.image}
                                    alt={selectedExercise.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                            {selectedExercise.muscleGroup}
                                        </span>
                                        <span className="bg-muted/50 backdrop-blur-sm text-foreground px-2 py-1 rounded-md text-xs font-medium">
                                            {selectedExercise.equipment}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground">{selectedExercise.name}</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-primary rounded-full" />
                                        Instrucciones
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {selectedExercise.instructions}
                                    </p>
                                    {selectedExercise.description && (
                                        <p className="text-muted-foreground leading-relaxed mt-2 text-sm italic">
                                            {selectedExercise.description}
                                        </p>
                                    )}
                                </div>

                                {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                                    <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                                        <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                                                <span className="text-xs">💡</span>
                                            </div>
                                            Tips Profesionales
                                        </h3>
                                        <ul className="space-y-2">
                                            {selectedExercise.tips.map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
