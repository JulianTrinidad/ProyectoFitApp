// Mock Data for Fitness SaaS Platform

export interface UserService {
  name: string;
  type: 'Personalizado' | 'General';
}

export interface WorkoutDay {
  date: string; // YYYY-MM-DD
  completed: boolean;
  isRestDay: boolean;
}

export interface UserRanked {
  league: 'Hierro' | 'Bronce' | 'Plata' | 'Oro' | 'Esmeralda' | 'Diamante';
  division: 1 | 2 | 3 | 4 | 5;
  currentPoints: number;
  maxPoints: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  gender: 'male' | 'female';
  role: 'trainer' | 'client';
  lastActive: Date;
  lastPaymentDate: Date;
  streak: number;
  membershipStatus: 'active' | 'pending' | 'expired';
  assignedPlan: string | null;
  progressPhotos: { before: string; after: string; date: string }[];
  notes: string;
  history: ExerciseHistory[];
  services: UserService[];
  workoutCalendar: WorkoutDay[];
  ranked: UserRanked;
  waterIntake: number; // in ml, max 4000
  isRestDayTaken: boolean;
}

export interface ExerciseHistory {
  exerciseId: string;
  date: Date;
  weight: number;
  reps: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  image: string;
  video?: string;
  instructions: string;
  description?: string;
  tips?: string[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
  assignedTo: string[];
  createdAt: Date;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  receiptImage: string;
  date: Date;
  concept: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: { name: string; portion: string; calories: number }[];
}

// Helper to generate workout calendar for the current month
const generateWorkoutCalendar = (completedDays: number[], restDays: number[]): WorkoutDay[] => {
  const calendar: WorkoutDay[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendar.push({
      date: dateStr,
      completed: completedDays.includes(day),
      isRestDay: restDays.includes(day),
    });
  }
  return calendar;
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Trainer',
    email: 'carlos@fitpro.com',
    phone: '+54 9 11 5555-0001',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face',
    gender: 'male',
    role: 'trainer',
    lastActive: new Date(),
    lastPaymentDate: new Date(),
    streak: 0,
    membershipStatus: 'active',
    assignedPlan: null,
    progressPhotos: [],
    notes: '',
    history: [],
    services: [],
    workoutCalendar: [],
    ranked: { league: 'Bronce', division: 4, currentPoints: 50, maxPoints: 100 },
    waterIntake: 0,
    isRestDayTaken: false,
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@gmail.com',
    phone: '+54 9 11 2345-6789',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    gender: 'female',
    role: 'client',
    lastActive: new Date(),
    lastPaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    streak: 5,
    membershipStatus: 'active',
    assignedPlan: 'plan-1',
    progressPhotos: [
      { before: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop', date: '2024-01-15' }
    ],
    notes: 'Lesión leve en rodilla derecha. Evitar sentadillas profundas.',
    history: [
      { exerciseId: 'ex-1', date: new Date(Date.now() - 86400000), weight: 20, reps: 12 },
      { exerciseId: 'ex-2', date: new Date(Date.now() - 86400000), weight: 60, reps: 10 },
    ],
    services: [
      { name: 'Musculación', type: 'Personalizado' },
      { name: 'Yoga', type: 'General' },
    ],
    workoutCalendar: generateWorkoutCalendar([1, 2, 4, 5, 8, 9, 11, 12, 15, 16, 18, 19, 22, 23, 25, 26, 29, 30], [3, 7, 10, 14, 17, 21, 24, 28]),
    ranked: { league: 'Bronce', division: 4, currentPoints: 50, maxPoints: 100 },
    waterIntake: 1500,
    isRestDayTaken: false,
  },
  {
    id: '3',
    name: 'Pedro Martínez',
    email: 'pedro@gmail.com',
    phone: '+54 9 11 3456-7890',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    gender: 'male',
    role: 'client',
    lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    lastPaymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago - expired
    streak: 0,
    membershipStatus: 'active',
    assignedPlan: 'plan-1',
    progressPhotos: [],
    notes: 'Principiante. Enfocarse en técnica.',
    history: [
      { exerciseId: 'ex-1', date: new Date(Date.now() - 5 * 86400000), weight: 15, reps: 10 },
    ],
    services: [
      { name: 'CrossFit', type: 'General' },
    ],
    workoutCalendar: generateWorkoutCalendar([1, 3, 5, 8, 10], [2, 7, 9, 14]),
    ranked: { league: 'Hierro', division: 3, currentPoints: 25, maxPoints: 100 },
    waterIntake: 500,
    isRestDayTaken: false,
  },
  {
    id: '4',
    name: 'Ana López',
    email: 'ana@gmail.com',
    phone: '+54 9 11 4567-8901',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    gender: 'female',
    role: 'client',
    lastActive: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    lastPaymentDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    streak: 0,
    membershipStatus: 'pending',
    assignedPlan: null,
    progressPhotos: [],
    notes: '',
    history: [],
    services: [
      { name: 'Natación', type: 'General' },
      { name: 'Movilidad', type: 'Personalizado' },
    ],
    workoutCalendar: generateWorkoutCalendar([], []),
    ranked: { league: 'Hierro', division: 5, currentPoints: 10, maxPoints: 100 },
    waterIntake: 0,
    isRestDayTaken: false,
  },
  {
    id: '5',
    name: 'Luis Rodríguez',
    email: 'luis@gmail.com',
    phone: '+54 9 11 5678-9012',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    gender: 'male',
    role: 'client',
    lastActive: new Date(),
    lastPaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    streak: 12,
    membershipStatus: 'active',
    assignedPlan: 'plan-2',
    progressPhotos: [],
    notes: 'Atleta avanzado. Preparación para competencia.',
    history: [
      { exerciseId: 'ex-1', date: new Date(Date.now() - 86400000), weight: 40, reps: 15 },
      { exerciseId: 'ex-3', date: new Date(Date.now() - 86400000), weight: 100, reps: 8 },
    ],
    services: [
      { name: 'Musculación', type: 'Personalizado' },
      { name: 'Boxeo', type: 'Personalizado' },
      { name: 'Elongación', type: 'General' },
    ],
    workoutCalendar: generateWorkoutCalendar([1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 22, 23, 24, 26, 27, 29, 30], [4, 7, 11, 14, 18, 21, 25, 28]),
    ranked: { league: 'Plata', division: 2, currentPoints: 75, maxPoints: 100 },
    waterIntake: 3000,
    isRestDayTaken: false,
  },
];

// Mock Exercises
export const mockExercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Press de Banca',
    muscleGroup: 'Pecho',
    equipment: 'Barra',
    image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop',
    instructions: 'Acuéstate en el banco, agarra la barra con un agarre medio. Baja la barra hasta el pecho y empuja hacia arriba.',
    description: 'El rey de los ejercicios de torso. Trabaja principalmente el pectoral mayor, tríceps y deltoides anterior.',
    tips: ['Mantén los pies firmes en el suelo', 'Retrae las escápulas', 'No rebotes la barra en el pecho']
  },
  {
    id: 'ex-2',
    name: 'Sentadilla',
    muscleGroup: 'Piernas',
    equipment: 'Barra',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
    instructions: 'Con la barra en la espalda, baja flexionando rodillas y cadera hasta que los muslos estén paralelos al suelo.',
    description: 'Ejercicio fundamental para el desarrollo del tren inferior. Involucra cuádriceps, glúteos, isquios y core.',
    tips: ['Mantén el pecho erguido', 'Las rodillas deben seguir la línea de los pies', 'Inhala antes de bajar']
  },
  {
    id: 'ex-3',
    name: 'Peso Muerto',
    muscleGroup: 'Espalda',
    equipment: 'Barra',
    image: 'https://images.unsplash.com/photo-1598268030450-7a476f602982?w=400&h=300&fit=crop',
    instructions: 'Agarra la barra del suelo con espalda recta, empuja con las piernas y extiende la cadera.',
    description: 'Uno de los ejercicios más completos. Desarrolla la fuerza bruta de toda la cadena posterior (isquios, glúteos, espalda baja y alta).',
    tips: ['La barra debe viajar pegada a las piernas', 'No redondees la espalda baja', 'Empuja el suelo con los pies']
  },
  {
    id: 'ex-4',
    name: 'Dominadas',
    muscleGroup: 'Espalda',
    equipment: 'Barra fija',
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop',
    instructions: 'Cuelga de la barra con agarre prono, eleva el cuerpo hasta que la barbilla supere la barra.',
    description: 'El mejor ejercicio de peso corporal para la espalda. Construye la amplitud dorsal (forma en V) y fuerza de agarre.',
    tips: ['Inicia el movimiento deprimiendo los hombros', 'Evita el balanceo excesivo', 'Controla el descenso']
  },
  {
    id: 'ex-5',
    name: 'Press Militar',
    muscleGroup: 'Hombros',
    equipment: 'Barra',
    image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop',
    instructions: 'De pie, empuja la barra desde los hombros hacia arriba hasta extender los brazos.',
    description: 'Constructor de hombros por excelencia. Requiere gran estabilidad del core y fuerza de todo el cuerpo.',
    tips: ['Aprieta glúteos y abdomen', 'La barra debe pasar cerca de la nariz', 'Bloquea los codos arriba']
  },
  {
    id: 'ex-6',
    name: 'Curl de Bíceps',
    muscleGroup: 'Brazos',
    equipment: 'Mancuernas',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop',
    instructions: 'Con mancuernas a los lados, flexiona los codos elevando el peso hacia los hombros.',
    description: 'Ejercicio de aislamiento para los flexores del codo. Clásico para desarrollar el tamaño de los brazos.',
    tips: ['Mantén los codos pegados al cuerpo', 'No uses impulso de la espalda', 'Aprieta el bíceps arriba']
  },
  {
    id: 'ex-7',
    name: 'Extensión de Tríceps',
    muscleGroup: 'Brazos',
    equipment: 'Polea',
    image: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400&h=300&fit=crop',
    instructions: 'En polea alta, extiende los codos empujando la cuerda hacia abajo.',
    description: 'Excelente para aislar la cabeza lateral y medial del tríceps. Da el aspecto de "herradura" al brazo.',
    tips: ['Hombros fijos, solo mueves los antebrazos', 'Separa la cuerda al final', 'Controla la subida']
  },
  {
    id: 'ex-8',
    name: 'Plancha',
    muscleGroup: 'Core',
    equipment: 'Ninguno',
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=300&fit=crop',
    instructions: 'Apoya antebrazos y puntas de pies, mantén el cuerpo recto activando el core.',
    description: 'Ejercicio isométrico fundamental para la estabilidad del núcleo (core). Mejora la postura y protege la espalda baja.',
    tips: ['No dejes caer la cadera', 'Empuja el suelo con los antebrazos', 'Respira de forma controlada']
  },
  {
    id: 'ex-9',
    name: 'Zancadas',
    muscleGroup: 'Piernas',
    equipment: 'Mancuernas',
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
    instructions: 'Da un paso adelante, baja la rodilla trasera hacia el suelo y vuelve a la posición inicial.',
    description: 'Ejercicio unilateral que trabaja el equilibrio y corrige asimetrías. Enfoca cuádriceps y glúteos.',
    tips: ['Paso largo para más glúteo, corto para cuádriceps', 'Torso erguido', 'Rodilla delantera no debe colapsar hacia adentro']
  },
  {
    id: 'ex-10',
    name: 'Remo con Barra',
    muscleGroup: 'Espalda',
    equipment: 'Barra',
    image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
    instructions: 'Inclínate hacia adelante, tira de la barra hacia el abdomen manteniendo los codos cerca del cuerpo.',
    description: 'Constructor de densidad de espalda. Trabaja dorsal ancho, trapecios, romboides y erectores espinales.',
    tips: ['Espalda neutra en todo momento', 'Tira con los codos, no con las manos', 'Pausa un segundo al tocar el abdomen']
  },
];

// Mock Routines
export const mockRoutines: Routine[] = [
  {
    id: 'plan-1',
    name: 'Fuerza Full Body',
    description: 'Rutina de cuerpo completo para ganar fuerza',
    exercises: [
      { exerciseId: 'ex-1', sets: 4, reps: '8-10', rest: 90 },
      { exerciseId: 'ex-2', sets: 4, reps: '8-10', rest: 120 },
      { exerciseId: 'ex-4', sets: 3, reps: '8-12', rest: 90 },
      { exerciseId: 'ex-5', sets: 3, reps: '10-12', rest: 60 },
    ],
    assignedTo: ['2', '3'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'plan-2',
    name: 'Hipertrofia Avanzada',
    description: 'Rutina avanzada para crecimiento muscular',
    exercises: [
      { exerciseId: 'ex-1', sets: 5, reps: '6-8', rest: 120 },
      { exerciseId: 'ex-3', sets: 5, reps: '5-6', rest: 180 },
      { exerciseId: 'ex-10', sets: 4, reps: '8-10', rest: 90 },
      { exerciseId: 'ex-6', sets: 4, reps: '10-12', rest: 60 },
      { exerciseId: 'ex-7', sets: 4, reps: '10-12', rest: 60 },
    ],
    assignedTo: ['5'],
    createdAt: new Date('2024-01-15'),
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Proteína Whey Premium',
    description: '1kg de proteína de suero de alta calidad',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&h=300&fit=crop',
    stock: 25,
    category: 'Suplementos',
  },
  {
    id: 'prod-2',
    name: 'Creatina Monohidrato',
    description: '300g de creatina pura',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&h=300&fit=crop',
    stock: 40,
    category: 'Suplementos',
  },
  {
    id: 'prod-3',
    name: 'Bandas Elásticas Set',
    description: 'Set de 5 bandas con diferentes resistencias',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=300&h=300&fit=crop',
    stock: 15,
    category: 'Accesorios',
  },
  {
    id: 'prod-4',
    name: 'Shaker Premium',
    description: 'Botella mezcladora de 700ml',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=300&h=300&fit=crop',
    stock: 50,
    category: 'Accesorios',
  },
  {
    id: 'prod-5',
    name: 'Guantes de Entrenamiento',
    description: 'Guantes con muñequera integrada',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=300&fit=crop',
    stock: 20,
    category: 'Accesorios',
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    userId: '2',
    amount: 50.00,
    status: 'approved',
    receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop',
    date: new Date('2024-01-20'),
    concept: 'Membresía Mensual',
  },
  {
    id: 'pay-2',
    userId: '3',
    amount: 50.00,
    status: 'pending',
    receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop',
    date: new Date('2024-01-25'),
    concept: 'Membresía Mensual',
  },
  {
    id: 'pay-3',
    userId: '4',
    amount: 50.00,
    status: 'pending',
    receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop',
    date: new Date('2024-01-26'),
    concept: 'Membresía Mensual',
  },
  {
    id: 'pay-4',
    userId: '5',
    amount: 100.00,
    status: 'approved',
    receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop',
    date: new Date('2024-01-15'),
    concept: 'Plan Premium Trimestral',
  },
];

// Mock Meals for diet plan
export const mockMeals: Meal[] = [
  {
    id: 'meal-1',
    name: 'Desayuno',
    time: '07:30',
    foods: [
      { name: 'Avena con leche', portion: '60g + 200ml', calories: 280 },
      { name: 'Huevos revueltos', portion: '3 unidades', calories: 210 },
      { name: 'Banana', portion: '1 mediana', calories: 105 },
    ],
  },
  {
    id: 'meal-2',
    name: 'Media Mañana',
    time: '10:30',
    foods: [
      { name: 'Yogur griego', portion: '150g', calories: 130 },
      { name: 'Almendras', portion: '20g', calories: 120 },
    ],
  },
  {
    id: 'meal-3',
    name: 'Almuerzo',
    time: '13:00',
    foods: [
      { name: 'Pechuga de pollo', portion: '200g', calories: 330 },
      { name: 'Arroz integral', portion: '150g cocido', calories: 165 },
      { name: 'Ensalada mixta', portion: '1 plato', calories: 50 },
    ],
  },
  {
    id: 'meal-4',
    name: 'Merienda',
    time: '17:00',
    foods: [
      { name: 'Batido de proteína', portion: '1 scoop + agua', calories: 120 },
      { name: 'Manzana', portion: '1 mediana', calories: 95 },
    ],
  },
  {
    id: 'meal-5',
    name: 'Cena',
    time: '20:30',
    foods: [
      { name: 'Salmón a la plancha', portion: '180g', calories: 350 },
      { name: 'Vegetales al vapor', portion: '200g', calories: 80 },
      { name: 'Quinoa', portion: '100g cocida', calories: 120 },
    ],
  },
];

// Routine Library (Encyclopedia)
export interface RoutineLibraryExercise {
  exercise: string;
  sets: number;
  reps: string;
  note: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  category: string;
  theory: string;
  media: string;
  routine: RoutineLibraryExercise[];
}

export interface BodyCategory {
  id: string;
  title: string;
  image: string;
  description: string;
  groups: MuscleGroup[];
}

export const routineLibrary: BodyCategory[] = [
  {
    id: 'upper_body',
    title: 'Tren Superior',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
    description: 'Torso y Brazos completos',
    groups: [
      {
        id: 'chest_major',
        name: 'Pectoral Mayor',
        category: 'Pecho',
        theory: 'El pectoral mayor es el principal motor en los empujes horizontales. Para un desarrollo completo, se debe trabajar tanto la porción clavicular (superior) como la esternocostal (media/baja). La clave es la retracción escapular para proteger el hombro.',
        media: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Press Banca Plano con Barra', sets: 4, reps: '6-8', note: 'Carga pesada, foco en fuerza.' },
          { exercise: 'Press Inclinado con Mancuernas', sets: 3, reps: '10-12', note: 'Enfocado en la parte superior.' },
          { exercise: 'Cruces en Polea (Crossover)', sets: 3, reps: '15', note: 'Bombeo final y estiramiento.' }
        ]
      },
      {
        id: 'back_lats',
        name: 'Dorsal Ancho',
        category: 'Espalda',
        theory: 'El músculo más grande de la espalda, responsable de la forma en "V". Su función principal es la aducción y extensión del hombro. Los tirones verticales (dominadas) dan amplitud, y los horizontales (remos) dan densidad.',
        media: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Dominadas (Pull-ups)', sets: 4, reps: 'Al fallo', note: 'Si no puedes, usa banda elástica.' },
          { exercise: 'Remo con Barra (Pendlay)', sets: 4, reps: '8-10', note: 'Torso paralelo al suelo.' },
          { exercise: 'Jalón al Pecho Unilateral', sets: 3, reps: '12-15', note: 'Contracción máxima de 2 seg.' }
        ]
      },
      {
        id: 'shoulder_side',
        name: 'Deltoides Lateral',
        category: 'Hombros',
        theory: 'Es la cabeza del hombro que da la apariencia de "amplitud" o redondez (efecto 3D). Este músculo responde mejor a altas repeticiones y estrés metabólico que a cargas máximas, debido a su biomecánica de palanca desventajosa.',
        media: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Vuelos Laterales con Mancuernas', sets: 4, reps: '15-20', note: 'Controla la bajada.' },
          { exercise: 'Remo al Mentón (Agarre ancho)', sets: 3, reps: '12', note: 'Codos siempre arriba de las muñecas.' },
          { exercise: 'Vuelos en Polea a una mano', sets: 3, reps: '15', note: 'Tensión constante.' }
        ]
      },
      {
        id: 'shoulder_front',
        name: 'Deltoides Anterior',
        category: 'Hombros',
        theory: 'Responsable de la flexión del hombro. Suele recibir mucho estímulo indirecto en los días de pecho, por lo que un ejercicio pesado de press vertical suele ser suficiente para su desarrollo.',
        media: 'https://images.unsplash.com/photo-1532029837066-6e5cac75b638?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Press Militar con Barra (De pie)', sets: 4, reps: '6-8', note: 'Core apretado, barra pasa cerca de la cara.' },
          { exercise: 'Elevaciones Frontales con Disco', sets: 3, reps: '12', note: 'No balancear el cuerpo.' }
        ]
      },
      {
        id: 'arm_biceps',
        name: 'Bíceps Braquial',
        category: 'Brazos',
        theory: 'Compuesto por cabeza larga y corta. Su función es flexionar el codo y supinar el antebrazo (girar la palma hacia arriba). Para un pico alto, enfócate en la supinación durante el ejercicio.',
        media: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Curl con Barra Z', sets: 4, reps: '10', note: 'Codos pegados al cuerpo.' },
          { exercise: 'Curl Martillo', sets: 3, reps: '12', note: 'Enfocado en braquial y antebrazo.' },
          { exercise: 'Curl Inclinado con Mancuernas', sets: 3, reps: '12-15', note: 'Estiramiento máximo de la cabeza larga.' }
        ]
      },
      {
        id: 'arm_triceps',
        name: 'Tríceps',
        category: 'Brazos',
        theory: 'Ocupa 2/3 del brazo. La cabeza larga es la que da mas volumen y solo se estira completamente cuando el brazo está por encima de la cabeza. La extensión de codo es su función principal.',
        media: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Press Francés', sets: 4, reps: '10-12', note: 'Cuidado con los codos.' },
          { exercise: 'Extensiones en Polea con Cuerda', sets: 3, reps: '15', note: 'Abre la cuerda al final.' },
          { exercise: 'Fondos en Paralelas', sets: 3, reps: 'Fallo', note: 'Cuerpo vertical para enfocar tríceps.' }
        ]
      }
    ]
  },
  {
    id: 'lower_body',
    title: 'Tren Inferior',
    image: 'https://images.unsplash.com/photo-1574680096141-1c57c6f457a7?q=80&w=1000&auto=format&fit=crop',
    description: 'Piernas completas, Glúteos y Pantorrillas',
    groups: [
      {
        id: 'legs_quads',
        name: 'Cuádriceps',
        category: 'Piernas',
        theory: 'Grupo muscular grande y potente en la parte frontal del muslo. Su función es extender la rodilla. Para máxima hipertrofia, se requiere un rango de movimiento completo y control excéntrico.',
        media: 'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Sentadilla con Barra (High Bar)', sets: 4, reps: '6-8', note: 'Profundidad es clave.' },
          { exercise: 'Prensa de Piernas', sets: 4, reps: '10-12', note: 'Pies posición media, rodillas al pecho.' },
          { exercise: 'Sillón de Cuádriceps', sets: 3, reps: '15-20', note: 'Aguanta 1 seg arriba.' }
        ]
      },
      {
        id: 'legs_hamstrings',
        name: 'Isquiosurales',
        category: 'Piernas',
        theory: 'Músculos de la cadena posterior. Tienen doble función: flexionar la rodilla y extender la cadera. Una rutina completa debe incluir ambos movimientos (un peso muerto y un curl).',
        media: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Peso Muerto Rumano', sets: 4, reps: '8-10', note: 'Mantén la espalda neutra.' },
          { exercise: 'Curl Femoral Tumbado', sets: 4, reps: '12-15', note: 'No levantes la cadera del banco.' }
        ]
      },
      {
        id: 'glutes_max',
        name: 'Glúteo Mayor',
        category: 'Glúteos',
        theory: 'El músculo más fuerte del cuerpo. Es el principal extensor de cadera. Aunque trabaja en sentadillas, para aislarlo y desarrollarlo al máximo se necesitan ejercicios de empuje de cadera directo.',
        media: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Hip Thrust con Barra', sets: 4, reps: '8-12', note: 'Mirada al frente, empuje explosivo.' },
          { exercise: 'Patada de Glúteo en Polea', sets: 3, reps: '15', note: 'Pierna estirada al final.' },
          { exercise: 'Zancadas (Bulgaras)', sets: 3, reps: '10/pierna', note: 'Torso inclinado adelante para más glúteo.' }
        ]
      },
      {
        id: 'glutes_med',
        name: 'Glúteo Medio',
        category: 'Glúteos',
        theory: 'Situado en la parte lateral de la cadera. Es vital para la estabilidad y la estética "redonda" de la cadera. Su función principal es la abducción (abrir la pierna).',
        media: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Abducción en Máquina', sets: 4, reps: '15-20', note: 'Pausa cuando las piernas están abiertas.' },
          { exercise: 'Caminata Lateral con Banda', sets: 3, reps: '1 min', note: 'Rodillas siempre flexionadas.' }
        ]
      },
      {
        id: 'calves',
        name: 'Gemelos (Gastrocnemio)',
        category: 'Pantorrillas',
        theory: 'Músculo visible de la pantorrilla. Trabaja principalmente cuando la rodilla está estirada. Es un músculo muy resistente que necesita cargas pesadas y rango de movimiento completo.',
        media: 'https://images.unsplash.com/photo-1517963879466-e9b5ce382569?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Elevación de Talones de Pie (Máquina)', sets: 5, reps: '10-12', note: '3 seg bajando, 1 seg explosivo arriba.' },
          { exercise: 'Prensa de Piernas (Solo puntas)', sets: 4, reps: '15', note: 'Cuidado de no resbalar.' }
        ]
      },
      {
        id: 'soleus',
        name: 'Sóleo',
        category: 'Pantorrillas',
        theory: 'Se encuentra debajo de los gemelos. A diferencia de estos, el sóleo se activa principalmente cuando la rodilla está flexionada (sentado). Da anchura a la parte baja de la pierna.',
        media: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Elevación de Talones Sentado (Costurera)', sets: 4, reps: '15-20', note: 'Rango completo, aguanta abajo.' },
          { exercise: 'Sóleo en Multipower', sets: 3, reps: '15', note: 'Coloca steps para aumentar rango.' }
        ]
      }
    ]
  },
  {
    id: 'mobilization',
    title: 'MOVILIZACIÓN',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
    description: 'Movilidad articular y flexibilidad',
    groups: [
      {
        id: 'hip_mobility',
        name: 'Movilidad de Cadera',
        category: 'Movilidad Articular',
        theory: 'La cadera es una articulación esférica que permite un amplio rango de movimiento. Mantener su movilidad es clave para prevenir lesiones en la zona lumbar y las rodillas, además de mejorar el rendimiento en sentadillas y peso muerto.',
        media: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Círculos de Cadera (De pie)', sets: 2, reps: '10/lado', note: 'Círculos amplios y controlados.' },
          { exercise: '90/90 Hip Switch', sets: 3, reps: '8/lado', note: 'Mantén el torso erguido.' },
          { exercise: 'Estocada del Corredor con Rotación', sets: 2, reps: '8/lado', note: 'Abre bien el pecho al rotar.' }
        ]
      },
      {
        id: 'shoulder_mobility',
        name: 'Movilidad de Hombro',
        category: 'Movilidad Articular',
        theory: 'El complejo del hombro es la articulación con mayor rango de movimiento del cuerpo, pero también la más inestable. Trabajar su movilidad mejora la postura y previene lesiones en press y movimientos overhead.',
        media: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Dislocaciones con Banda', sets: 3, reps: '12', note: 'Agarre ancho, movimiento lento.' },
          { exercise: 'Wall Slides', sets: 3, reps: '10', note: 'Espalda y brazos pegados a la pared.' },
          { exercise: 'Rotaciones Externas con Banda', sets: 2, reps: '15/lado', note: 'Codo pegado al cuerpo.' }
        ]
      },
      {
        id: 'spine_flexibility',
        name: 'Flexibilidad Espinal',
        category: 'Flexibilidad',
        theory: 'La columna vertebral necesita movilidad en todos sus segmentos. La rigidez torácica es una causa común de dolor de hombro y cuello. Trabajar la extensión y rotación torácica mejora la postura y el rendimiento.',
        media: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Cat-Cow (Gato-Vaca)', sets: 3, reps: '10', note: 'Sincroniza con la respiración.' },
          { exercise: 'Rotación Torácica en Cuadrupedia', sets: 2, reps: '8/lado', note: 'Mano detrás de la cabeza.' },
          { exercise: 'Cobra (Extensión Torácica)', sets: 2, reps: '10', note: 'No fuerces la zona lumbar.' }
        ]
      }
    ]
  },
  {
    id: 'aerobics',
    title: 'EJERCICIOS AERÓBICOS',
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1000&auto=format&fit=crop',
    description: 'Cardio de moderada intensidad',
    groups: [
      {
        id: 'steady_state',
        name: 'Cardio Continuo',
        category: 'Resistencia',
        theory: 'El ejercicio aeróbico continuo a intensidad moderada (60-70% FCmáx) mejora la capacidad cardiovascular, facilita la oxidación de grasas y acelera la recuperación entre sesiones de fuerza.',
        media: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Caminata Rápida en Cinta (Inclinada)', sets: 1, reps: '20 min', note: 'Inclinación al 8-12%, velocidad 5-6 km/h.' },
          { exercise: 'Bicicleta Estática', sets: 1, reps: '15 min', note: 'RPM entre 70-90, resistencia moderada.' }
        ]
      },
      {
        id: 'hiit_light',
        name: 'Intervalos Moderados',
        category: 'Intervalos',
        theory: 'Los intervalos de intensidad moderada combinan períodos de trabajo con descanso activo. Son más eficientes que el cardio continuo para mejorar el VO2máx sin generar excesiva fatiga que interfiera con el entrenamiento de fuerza.',
        media: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Remo Ergómetro (Intervalos)', sets: 5, reps: '1 min trabajo / 1 min descanso', note: 'Ritmo fuerte pero sostenible.' },
          { exercise: 'Elíptica (Intervalos)', sets: 4, reps: '2 min rápido / 1 min suave', note: 'Usa los brazos activamente.' }
        ]
      },
      {
        id: 'functional_cardio',
        name: 'Cardio Funcional',
        category: 'Funcional',
        theory: 'Combina movimientos multiarticulares con demanda cardiovascular. Mejora la coordinación, la resistencia muscular y la capacidad aeróbica simultáneamente, ideal para deportistas y personas activas.',
        media: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop',
        routine: [
          { exercise: 'Saltos a la Soga', sets: 4, reps: '1 min', note: 'Mantén los codos cerca del cuerpo.' },
          { exercise: 'Battle Ropes', sets: 3, reps: '30 seg', note: 'Ondas alternas, core activado.' },
          { exercise: 'Burpees (Tempo Moderado)', sets: 3, reps: '10', note: 'Prioriza la técnica sobre la velocidad.' }
        ]
      }
    ]
  }
];

// Available Routines for workout carousel
export interface AvailableRoutineExercise {
  id: string;
  name: string;
  image: string;
  tips: string[];
  sets: number;
  reps: string;
  rest: number;
  executionSteps?: string[];
}

export interface AvailableRoutine {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  exercises: AvailableRoutineExercise[];
}

export const availableRoutines: AvailableRoutine[] = [
  {
    id: 'push_day',
    name: 'Empuje (Pecho/Hombro/Tríceps)',
    shortName: 'Empuje',
    emoji: '💪',
    exercises: [
      {
        id: 'ar-1',
        name: 'Press Banca Plano con Barra',
        image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop',
        tips: ['Retrae escápulas antes de levantar', 'Pies firmes en el suelo', 'Baja la barra hasta el esternón'],
        executionSteps: ['Acostate en el banco con los ojos debajo de la barra. Retraé las escápulas y plantá los pies firmes.', 'Desrackeá la barra con los brazos extendidos. Inhalá y bajá la barra controladamente hasta el esternón.', 'Empujá la barra de forma explosiva hasta la extensión completa. Exhalá al subir.', 'Re-rack: guiá la barra hacia los soportes con control al finalizar.'],
        sets: 4,
        reps: '6-8',
        rest: 120
      },
      {
        id: 'ar-2',
        name: 'Press Inclinado con Mancuernas',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop',
        tips: ['Banco a 30-45 grados', 'No choques las mancuernas arriba', 'Baja controlando 2-3 segundos'],
        executionSteps: ['Sentate en el banco inclinado (30-45°) con una mancuerna en cada mano a la altura de los hombros.', 'Inhalá y bajá las mancuernas abriendo los codos hasta sentir un estiramiento profundo en el pecho.', 'Exhalá y empujá las mancuernas hacia arriba convergiendo ligeramente sin chocarlas.', 'Bajá de forma controlada (2-3 seg) y repetí manteniendo la retracción escapular.'],
        sets: 3,
        reps: '10-12',
        rest: 90
      },
      {
        id: 'ar-3',
        name: 'Press Militar con Barra',
        image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop',
        tips: ['Core apretado todo el movimiento', 'La barra pasa cerca de la cara', 'No arquees la espalda baja'],
        executionSteps: ['De pie, tomá la barra a la altura de los hombros con agarre prono, ligeramente más ancho que los hombros.', 'Apretá el core, inhalá y empujá la barra verticalmente. Mové la cabeza hacia atrás para que la barra pase.', 'Bloqueá los codos arriba con la barra sobre la cabeza. Exhalá al completar.', 'Bajá la barra de forma controlada hasta los deltoides y repetí.'],
        sets: 3,
        reps: '8-10',
        rest: 90
      },
      {
        id: 'ar-4',
        name: 'Extensiones en Polea con Cuerda',
        image: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400&h=300&fit=crop',
        tips: ['Codos pegados al cuerpo', 'Abre la cuerda al final del movimiento', 'Pausa de 1 seg en contracción'],
        executionSteps: ['De pie frente a la polea alta, tomá la cuerda con ambas manos. Codos pegados al cuerpo.', 'Extendé los codos empujando la cuerda hacia abajo. Abrí las puntas de la cuerda al final del movimiento.', 'Apretá los tríceps 1 segundo en la contracción máxima.', 'Volvé a la posición inicial de forma controlada sin mover los codos.'],
        sets: 3,
        reps: '12-15',
        rest: 60
      }
    ]
  },
  {
    id: 'pull_day',
    name: 'Tracción (Espalda/Bíceps)',
    shortName: 'Tracción',
    emoji: '🏋️',
    exercises: [
      {
        id: 'ar-5',
        name: 'Dominadas (Pull-ups)',
        image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop',
        tips: ['Agarre prono, ancho de hombros', 'Inicia el tirón desde los dorsales', 'Barbilla por encima de la barra'],
        executionSteps: ['Colgáte de la barra con agarre prono, manos al ancho de hombros. Brazos completamente extendidos.', 'Activá los dorsales deprimiendo las escápulas. Tirá llevando los codos hacia abajo y atrás.', 'Subí hasta que la barbilla supere la barra. Apretá la espalda arriba.', 'Bajá de forma controlada (2-3 seg) hasta la extensión completa sin soltar la activación.'],
        sets: 4,
        reps: 'Al fallo',
        rest: 120
      },
      {
        id: 'ar-6',
        name: 'Remo con Barra',
        image: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
        tips: ['Torso a 45 grados', 'Tira hacia el ombligo', 'Aprieta escápulas arriba'],
        executionSteps: ['Incliná el torso a 45° con la barra en las manos, agarre prono al ancho de hombros. Rodillas levemente flexionadas.', 'Tirá la barra hacia el ombligo llevando los codos hacia atrás. Apretá las escápulas arriba.', 'Mantené 1 segundo la contracción máxima sintiendo los dorsales.', 'Bajá la barra de forma controlada hasta los brazos extendidos y repetí.'],
        sets: 4,
        reps: '8-10',
        rest: 90
      },
      {
        id: 'ar-7',
        name: 'Curl con Barra Z',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop',
        tips: ['Codos pegados al cuerpo', 'No balancees el torso', 'Baja controlando 3 segundos'],
        executionSteps: ['De pie con la barra Z en las manos, agarre supino al ancho de hombros. Codos pegados al cuerpo.', 'Flexioná los codos llevando la barra hacia los hombros. No muevas los codos.', 'Apretá los bíceps 1 segundo en la contracción máxima.', 'Bajá la barra de forma controlada (3 seg) hasta la extensión completa sin balancear.'],
        sets: 3,
        reps: '10-12',
        rest: 60
      },
      {
        id: 'ar-8',
        name: 'Curl Martillo',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop',
        tips: ['Agarre neutro (palmas enfrentadas)', 'Trabaja el braquial y antebrazo', 'Alterna brazos para mejor control'],
        executionSteps: ['De pie con una mancuerna en cada mano, agarre neutro (palmas enfrentadas). Brazos extendidos a los lados.', 'Flexioná un codo llevando la mancuerna hacia el hombro sin rotar la muñeca.', 'Apretá el bíceps/braquial 1 segundo arriba.', 'Bajá de forma controlada y alterná con el otro brazo.'],
        sets: 3,
        reps: '12',
        rest: 60
      }
    ]
  },
  {
    id: 'leg_day',
    name: 'Piernas Énfasis Cuádriceps',
    shortName: 'Piernas',
    emoji: '🦵',
    exercises: [
      {
        id: 'ar-9',
        name: 'Sentadilla con Barra',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
        tips: ['Rodillas hacia afuera', 'Pecho arriba siempre', 'Rompe la paralela'],
        executionSteps: ['Colocáte debajo de la barra con los pies al ancho de hombros. La barra sobre los trapecios.', 'Desrackeá la barra y dá 1-2 pasos atrás. Inhalá profundo (Valsalva).', 'Bajá empujando la cadera atrás y flexionando rodillas hasta romper la paralela.', 'Empujá el suelo con los pies, mantené el pecho arriba y exhalá al subir.'],
        sets: 4,
        reps: '6-8',
        rest: 180
      },
      {
        id: 'ar-10',
        name: 'Prensa de Piernas',
        image: 'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=400&auto=format&fit=crop',
        tips: ['Pies a la altura de los hombros', 'No bloquees las rodillas arriba', 'Baja hasta 90 grados'],
        executionSteps: ['Sentate en la prensa con los pies a la altura de los hombros en la plataforma.', 'Soltá los seguros y bajá la plataforma flexionando las rodillas hasta 90°.', 'Empujá la plataforma de forma explosiva sin bloquear las rodillas arriba.', 'Bajá nuevamente de forma controlada y repetí.'],
        sets: 4,
        reps: '10-12',
        rest: 120
      },
      {
        id: 'ar-11',
        name: 'Sillón de Cuádriceps',
        image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
        tips: ['Aguanta 1 segundo arriba', 'Baja lento y controlado', 'No uses impulso'],
        executionSteps: ['Sentate en la máquina y ajustá la almohadilla a la altura de los tobillos.', 'Extendé las piernas controladamente hasta la extensión completa. No uses impulso.', 'Aguantá 1 segundo arriba apretando los cuádriceps al máximo.', 'Bajá lento (3 seg) hasta 90° de flexión y repetí.'],
        sets: 3,
        reps: '15-20',
        rest: 60
      },
      {
        id: 'ar-12',
        name: 'Zancadas Búlgaras',
        image: 'https://images.unsplash.com/photo-1574680096141-1c57c6f457a7?q=80&w=400&auto=format&fit=crop',
        tips: ['Pie trasero en banco', 'Torso ligeramente inclinado', 'Rodilla delantera no pasa la punta del pie'],
        executionSteps: ['De pie frente a un banco, colocá el empeine del pie trasero sobre el banco. Pie delantero a ~60cm.', 'Bajá flexionando la rodilla delantera hasta que el muslo quede paralelo al suelo. Torso levemente inclinado.', 'Empujá con el pie delantero para subir a la posición inicial.', 'Completá todas las repeticiones de un lado antes de cambiar de pierna.'],
        sets: 3,
        reps: '10/pierna',
        rest: 90
      }
    ]
  }
];

// Helper function to check if user is at risk (hasn't trained in 3+ days)
export const isUserAtRisk = (user: User): boolean => {
  const daysSinceActive = Math.floor((Date.now() - user.lastActive.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceActive >= 3;
};

// Helper function to get last exercise stats
export const getLastExerciseStats = (user: User, exerciseId: string): { weight: number; reps: number } | null => {
  const history = user.history.filter(h => h.exerciseId === exerciseId);
  if (history.length === 0) return null;
  const lastEntry = history[history.length - 1];
  return { weight: lastEntry.weight, reps: lastEntry.reps };
};
