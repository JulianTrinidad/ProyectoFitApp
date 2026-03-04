import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import {
    Target, Flame, Dumbbell, Zap,
    Calendar, CalendarDays, CalendarRange,
    GraduationCap, TrendingUp, Award,
    ArrowRight, Loader2, Sparkles
} from 'lucide-react';

/**
 * Estructura de datos para las rutinas generadas.
 * Se define localmente para evitar dependencias de archivos de datos externos.
 */
interface AvailableRoutine {
    id: string;
    name: string;
    shortName: string;
    emoji: string;
    exercises: any[];
}

interface OnboardingFlowProps {
    onComplete: (routine: AvailableRoutine) => void;
}

type Objective = 'Perder Grasa' | 'Ganar Masa Muscular' | 'Estar en Forma';
type Days = '2-3 días' | '4-5 días' | '6 días';
type Level = 'Principiante' | 'Intermedio' | 'Avanzado';

/**
 * Configuración de opciones visuales y descriptivas para el flujo de selección.
 */
const objectiveOptions: { label: Objective; icon: typeof Flame; description: string }[] = [
    { label: 'Perder Grasa', icon: Flame, description: 'Quema calorías y define tu cuerpo' },
    { label: 'Ganar Masa Muscular', icon: Dumbbell, description: 'Construye músculo y fuerza' },
    { label: 'Estar en Forma', icon: Zap, description: 'Mejora tu salud y energía general' },
];

const daysOptions: { label: Days; icon: typeof Calendar; description: string }[] = [
    { label: '2-3 días', icon: Calendar, description: 'Ideal para empezar' },
    { label: '4-5 días', icon: CalendarDays, description: 'Balance perfecto' },
    { label: '6 días', icon: CalendarRange, description: 'Máximo compromiso' },
];

const levelOptions: { label: Level; icon: typeof GraduationCap; description: string }[] = [
    { label: 'Principiante', icon: GraduationCap, description: 'Menos de 6 meses entrenando' },
    { label: 'Intermedio', icon: TrendingUp, description: '6 meses a 2 años de experiencia' },
    { label: 'Avanzado', icon: Award, description: 'Más de 2 años entrenando' },
];

/**
 * Mensajes dinámicos que se muestran durante la fase de procesamiento simulado.
 */
const loadingMessages = [
    'Analizando tu perfil...',
    'Seleccionando los mejores ejercicios...',
    'Optimizando volumen y frecuencia...',
    'Armando tu plan personalizado...',
    '¡Casi listo! 🎉',
];

/**
 * Lógica interna de generación de planes. 
 * Crea una estructura de rutina basada en los parámetros seleccionados por el usuario.
 */
function generateRoutine(objective: Objective, days: Days, level: Level): AvailableRoutine {
    const emojiMap: Record<Objective, string> = {
        'Perder Grasa': '🔥',
        'Ganar Masa Muscular': '💪',
        'Estar en Forma': '⚡',
    };

    const exercisePools: Record<Objective, any[]> = {
        'Perder Grasa': [
            { id: 'og-1', name: 'Sentadilla con Barra', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop', tips: ['Pecho arriba', 'Rodillas hacia afuera'], sets: 4, reps: '12-15', rest: 60 },
            { id: 'og-2', name: 'Press Banca Plano', image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop', tips: ['Retrae escápulas'], sets: 3, reps: '12-15', rest: 60 },
            { id: 'og-4', name: 'Burpees', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop', tips: ['Prioriza técnica'], sets: 3, reps: '10', rest: 45 },
        ],
        'Ganar Masa Muscular': [
            { id: 'og-5', name: 'Press Banca con Barra', image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop', tips: ['Empuje explosivo'], sets: 4, reps: '6-8', rest: 120 },
            { id: 'og-6', name: 'Sentadilla con Barra', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop', tips: ['Core apretado'], sets: 4, reps: '6-8', rest: 150 },
            { id: 'og-7', name: 'Peso Muerto', image: 'https://images.unsplash.com/photo-1598268030450-7a476f602982?w=400&h=300&fit=crop', tips: ['Espalda neutra'], sets: 4, reps: '5-6', rest: 180 },
        ],
        'Estar en Forma': [
            { id: 'og-9', name: 'Dominadas', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop', tips: ['Controla el descenso'], sets: 3, reps: '8-12', rest: 90 },
            { id: 'og-11', name: 'Press Mancuernas', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop', tips: ['Pecho abierto'], sets: 3, reps: '10-12', rest: 75 },
            { id: 'og-12', name: 'Plancha', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=300&fit=crop', tips: ['Respiración controlada'], sets: 3, reps: '45 seg', rest: 60 },
        ],
    };

    return {
        id: `onboarding-${Date.now()}`,
        name: `Plan ${objective} - ${level}`,
        shortName: objective === 'Ganar Masa Muscular' ? 'Masa' : objective === 'Perder Grasa' ? 'Quema' : 'Fitness',
        emoji: emojiMap[objective],
        exercises: exercisePools[objective],
    };
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState(1);
    const [objective, setObjective] = useState<Objective | null>(null);
    const [days, setDays] = useState<Days | null>(null);
    const [level, setLevel] = useState<Level | null>(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * Efecto que controla la fase final del flujo.
     * Gestiona la transición de los mensajes de carga y dispara la finalización del proceso.
     */
    useEffect(() => {
        if (step !== 4) return;
        setIsGenerating(true);

        const messageInterval = setInterval(() => {
            setLoadingMessageIndex(prev => {
                if (prev < loadingMessages.length - 1) return prev + 1;
                return prev;
            });
        }, 500);

        const timeout = setTimeout(() => {
            clearInterval(messageInterval);
            if (objective && level) {
                const routine = generateRoutine(objective, days || '4-5 días', level);
                onComplete(routine);
            }
        }, 2500);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(timeout);
        };
    }, [step, objective, days, level, onComplete]);

    const progressValue = step * 25;

    /**
     * Valida si el usuario ha seleccionado una opción en el paso actual para habilitar la navegación.
     */
    const canProceed =
        (step === 1 && objective !== null) ||
        (step === 2 && days !== null) ||
        (step === 3 && level !== null);

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const stepTitles = [
        '¿Cuál es tu objetivo principal?',
        '¿Cuántos días podés entrenar?',
        '¿Cuál es tu nivel actual?',
        '',
    ];

    const stepSubtitles = [
        'Elegí el que más se acerque a lo que buscás.',
        'Te armaremos la frecuencia ideal.',
        'Así personalizamos la intensidad.',
        '',
    ];

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Cabecera de progreso visual */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">Paso {step} de 4</span>
                    <span className="text-xs text-muted-foreground font-medium">{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
            </div>

            {/* Contenedor dinámico de pasos */}
            <div className="flex-1 overflow-y-auto px-6 pb-32">
                {step < 4 ? (
                    <div className="animate-fade-in" key={step}>
                        <div className="mb-8 mt-4">
                            <h1 className="text-2xl font-bold text-foreground leading-tight">
                                {stepTitles[step - 1]}
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {stepSubtitles[step - 1]}
                            </p>
                        </div>

                        {/* Mapeo de opciones basado en el estado actual del flujo */}
                        <div className="space-y-4">
                            {step === 1 && objectiveOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setObjective(opt.label)}
                                    className={`onboarding-card w-full text-left ${objective === opt.label ? 'onboarding-card-selected' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200 ${objective === opt.label ? 'bg-primary/20' : 'bg-muted'}`}>
                                            <opt.icon className={`w-7 h-7 transition-colors duration-200 ${objective === opt.label ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-foreground text-lg block">{opt.label}</span>
                                            <span className="text-sm text-muted-foreground">{opt.description}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {step === 2 && daysOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setDays(opt.label)}
                                    className={`onboarding-card w-full text-left ${days === opt.label ? 'onboarding-card-selected' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200 ${days === opt.label ? 'bg-primary/20' : 'bg-muted'}`}>
                                            <opt.icon className={`w-7 h-7 transition-colors duration-200 ${days === opt.label ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-foreground text-lg block">{opt.label}</span>
                                            <span className="text-sm text-muted-foreground">{opt.description}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {step === 3 && levelOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setLevel(opt.label)}
                                    className={`onboarding-card w-full text-left ${level === opt.label ? 'onboarding-card-selected' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200 ${level === opt.label ? 'bg-primary/20' : 'bg-muted'}`}>
                                            <opt.icon className={`w-7 h-7 transition-colors duration-200 ${level === opt.label ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <span className="font-semibold text-foreground text-lg block">{opt.label}</span>
                                            <span className="text-sm text-muted-foreground">{opt.description}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Vista de procesamiento con retroalimentación visual */
                    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 text-primary onboarding-spinner" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center animate-bounce-in">
                                <Sparkles className="w-5 h-5 text-accent" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-foreground mb-2">Creando tu plan</h2>
                        <p className="text-muted-foreground text-sm text-center mb-8 max-w-[250px]">
                            Nuestro sistema está configurando los ejercicios para vos
                        </p>

                        <div className="space-y-3 w-full max-w-xs">
                            {loadingMessages.map((msg, i) => (
                                <div
                                    key={msg}
                                    className={`flex items-center gap-3 transition-all duration-500 ${i <= loadingMessageIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${i < loadingMessageIndex ? 'bg-accent text-white' : i === loadingMessageIndex ? 'bg-primary text-white' : 'bg-muted'}`}>
                                        {i < loadingMessageIndex ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="text-[10px] font-bold">{i + 1}</span>
                                        )}
                                    </div>
                                    <span className={`text-sm ${i <= loadingMessageIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {msg}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones del flujo de navegación */}
            {step < 4 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${canProceed
                                ? 'btn-gradient cursor-pointer'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                        >
                            {step === 3 ? 'Generar mi plan' : 'Siguiente'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}