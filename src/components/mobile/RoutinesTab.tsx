import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, ArrowLeft, CheckCircle2, XCircle, Dumbbell, Plus, Search, X, ListOrdered } from 'lucide-react';
import type { RoutineView } from './mobileTypes';
import type { AvailableRoutine, AvailableRoutineExercise } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ─── TIPOS ────────────────────────────────────────────────────────────
interface VariantItem {
    name: string;
    image: string;
    biomechanics: string;
    tips: string[];
    commonErrors: string[];
    executionSteps?: string[];
}

interface ExerciseItem {
    id: string;
    name: string;
    subtitle: string;
    image: string;
    muscleGroup: string;
    biomechanics: string;
    tips: string[];
    commonErrors: string[];
    executionSteps?: string[];
    variants: VariantItem[];
}

interface ExerciseCategory {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    exercises: ExerciseItem[];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────
const mockExerciseLibrary: ExerciseCategory[] = [
    {
        id: 'upper',
        title: 'TREN SUPERIOR',
        subtitle: 'Torso y Brazos completos',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop',
        exercises: [
            {
                id: 'ex-bp',
                name: 'Press de Banca',
                subtitle: 'Empuje horizontal principal',
                image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop',
                muscleGroup: 'Pecho',
                biomechanics: 'Movimiento compuesto de empuje horizontal. El pectoral mayor actúa como motor primario, asistido por deltoides anterior y tríceps. La retracción escapular estabiliza el hombro y maximiza la activación pectoral. La inclinación del banco desplaza el énfasis a la porción clavicular.',
                tips: [
                    'Retrae las escápulas antes de levantar',
                    'Mantén los pies firmes en el suelo',
                    'Baja la barra hasta el esternón con control',
                    'Empuja explosivamente sin perder el arco'
                ],
                commonErrors: [
                    'Rebotar la barra en el pecho',
                    'Levantar los glúteos del banco',
                    'Abrir los codos a 90° (riesgo de hombro)',
                    'No usar agarre completo (pulgar por debajo)'
                ],
                executionSteps: [
                    'Posición inicial: Acostate en el banco con los ojos debajo de la barra. Retraé las escápulas y plantá los pies firmes en el suelo.',
                    'Agarre: Tomá la barra con un agarre ligeramente más ancho que los hombros. Levantá la barra del rack y bloqueala arriba.',
                    'Descenso: Inhalá profundo y bajá la barra de forma controlada hasta tocar el esternón (3 segundos).',
                    'Empuje: Exhalá y empujá la barra hacia arriba de manera explosiva hasta la extensión completa de los codos.',
                    'Re-rack: Al finalizar las repeticiones, guiá la barra hacia los soportes con control.'
                ],
                variants: [
                    { name: 'Press Inclinado con Mancuernas', image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop', biomechanics: 'El ángulo inclinado (30-45°) desplaza el énfasis hacia la porción clavicular del pectoral y el deltoides anterior. Las mancuernas permiten mayor rango de movimiento y activan más estabilizadores.', tips: ['Inclina el banco a 30-45 grados', 'Baja las mancuernas hasta sentir estiramiento', 'Empuja convergiendo arriba sin chocar'], commonErrors: ['Inclinar demasiado el banco (se convierte en press de hombro)', 'No bajar lo suficiente', 'Perder la retracción escapular'], executionSteps: ['Posición inicial: Sentate en el banco inclinado (30-45°), tomá una mancuerna en cada mano a la altura de los hombros.', 'Descenso: Inhalá y bajá las mancuernas abriendo los codos hasta sentir un estiramiento profundo en el pecho.', 'Empuje: Exhalá y empujá las mancuernas hacia arriba convergiendo ligeramente sin chocarlas.', 'Retorno: Bajá de forma controlada y repetí manteniendo la retracción escapular.'] },
                    { name: 'Press Declinado', image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop', biomechanics: 'El ángulo declinado (-15 a -30°) enfatiza la porción esternal inferior del pectoral. Reduce la participación del deltoides anterior. Permite mover cargas mayores.', tips: ['Usa un ángulo suave de decline', 'Controla la barra hasta el pecho bajo', 'Bloquea bien los pies'], commonErrors: ['Excesivo decline (sangre a la cabeza)', 'Rebotar la barra', 'No tener spotter en cargas pesadas'], executionSteps: ['Posición inicial: Acostate en el banco declinado y bloqueá los pies. Tomá la barra con agarre al ancho de hombros.', 'Descenso: Inhalá y bajá la barra controladamente hasta la parte baja del pecho.', 'Empuje: Exhalá y empujá la barra hacia arriba hasta la extensión completa.', 'Re-rack: Guiá la barra hacia los soportes con ayuda de un spotter si usás cargas pesadas.'] },
                    { name: 'Press con Mancuernas Plano', image: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=400&h=300&fit=crop', biomechanics: 'Similar al press de banca pero con mancuernas, permitiendo mayor rango de movimiento y activación unilateral. Corrige desequilibrios de fuerza entre lados.', tips: ['Baja profundo sintiendo el estiramiento', 'Gira levemente las muñecas al subir', 'Mantén los codos a 45° del torso'], commonErrors: ['Chocar las mancuernas arriba con impulso', 'Abrir demasiado los codos', 'Usar pesos diferentes sin razón'], executionSteps: ['Posición inicial: Sentate en el banco plano con una mancuerna en cada mano sobre los muslos. Acostate llevándolas al pecho.', 'Descenso: Inhalá y bajá las mancuernas con los codos a 45° hasta un estiramiento profundo.', 'Empuje: Exhalá y empujá hacia arriba girando levemente las muñecas. No choques las mancuernas arriba.', 'Final: Al terminar, bajá las mancuernas a los muslos sentándote para evitar lesiones.'] }
                ]
            },
            {
                id: 'ex-ohp',
                name: 'Press Militar',
                subtitle: 'Empuje vertical pesado',
                image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop',
                muscleGroup: 'Hombros',
                biomechanics: 'Empuje vertical que involucra los tres haces del deltoides, con énfasis en el anterior. El core debe trabajar isométricamente para estabilizar la columna. La barra debe trazar una línea recta desde los hombros hasta la extensión completa por encima de la cabeza.',
                tips: [
                    'Aprieta glúteos y abdomen durante todo el movimiento',
                    'La barra debe pasar cerca de la nariz',
                    'Bloquea los codos completamente arriba',
                    'Inhala abajo, exhala al empujar'
                ],
                commonErrors: [
                    'Arquear excesivamente la espalda baja',
                    'Empujar la barra hacia adelante en vez de recto',
                    'No bloquear los codos arriba',
                    'Usar demasiado impulso de piernas'
                ],
                executionSteps: [
                    'Posición inicial: De pie, tomá la barra a la altura de los hombros con agarre prono ligeramente más ancho que los hombros. Pies al ancho de caderas.',
                    'Activación: Apretá glúteos y abdomen para estabilizar la columna. Inhalá profundo.',
                    'Empuje: Empujá la barra verticalmente pasando cerca de la nariz, exhalá al subir hasta la extensión completa de codos.',
                    'Descenso: Bajá la barra de forma controlada hasta la posición inicial sobre los deltoides. Repetí.'
                ],
                variants: [
                    { name: 'Press Arnold', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop', biomechanics: 'Variante que incorpora rotación durante el press, activando los tres haces del deltoides en un solo movimiento fluido. Parte con agarre supino y termina en pronación arriba.', tips: ['Inicia con las palmas mirándote', 'Rota mientras subes de forma fluida', 'Bloquea arriba con palmas al frente'], commonErrors: ['Rotar demasiado rápido', 'No completar el rango de movimiento', 'Usar demasiado peso y perder el control'], executionSteps: ['Posición inicial: Sentado con respaldo, sostené las mancuernas frente a tu cara con palmas hacia vos (agarre supino).', 'Rotación y empuje: Abrí los codos hacia los lados mientras rotás las muñecas y empujás hacia arriba en un movimiento fluido.', 'Arriba: Bloqueá los codos con las palmas mirando al frente. Apretá los deltoides 1 segundo.', 'Descenso: Revertí el movimiento bajando y rotando hasta la posición inicial de forma controlada.'] },
                    { name: 'Push Press', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop', biomechanics: 'Press militar con asistencia de piernas. Un leve dip de rodillas genera impulso para superar el punto de estancamiento. Permite mover cargas supramáximas respecto al press estricto.', tips: ['Dip controlado de 10-15cm', 'Transferencia explosiva de piernas a brazos', 'Bloqueo completo arriba'], commonErrors: ['Dip excesivo (se convierte en jerk)', 'Empujar la barra hacia adelante', 'No bloquear los codos arriba'], executionSteps: ['Posición inicial: De pie con la barra sobre los deltoides, pies al ancho de caderas. Core apretado.', 'Dip: Flexioná levemente las rodillas (10-15cm) manteniendo el torso vertical.', 'Drive: Extendé las piernas explosivamente transfiriendo la fuerza a los brazos para empujar la barra arriba.', 'Bloqueo: Bloqueá los codos completamente arriba y bajá la barra controladamente a los hombros.'] },
                    { name: 'Press Sentado con Mancuernas', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop', biomechanics: 'La posición sentada elimina la asistencia de piernas y aísla mejor los deltoides. Las mancuernas permiten un rango de movimiento más natural y corrigen asimetrías.', tips: ['Espalda apoyada en el respaldo', 'Baja hasta que los codos estén a 90°', 'Empuja verticalmente sin chocar arriba'], commonErrors: ['Arquear la espalda baja', 'No controlar la fase excéntrica', 'Usar impulso del tronco'], executionSteps: ['Posición inicial: Sentate en un banco con respaldo a 90°. Llevá las mancuernas a la altura de los hombros.', 'Empuje: Exhalá y empujá las mancuernas verticalmente hasta la extensión completa sin chocarlas.', 'Descenso: Inhalá y bajá las mancuernas controladamente hasta que los codos formen 90°.', 'Repetición: Mantené la espalda contra el respaldo durante todo el movimiento.'] }
                ]
            },
            {
                id: 'ex-pull',
                name: 'Dominadas',
                subtitle: 'Tracción vertical con peso corporal',
                image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop',
                muscleGroup: 'Espalda',
                biomechanics: 'Movimiento de tracción vertical que trabaja principalmente el dorsal ancho, responsable de la forma en "V". El bíceps braquial asiste como flexor del codo. Un agarre más ancho enfatiza la amplitud dorsal, mientras que uno supino activa más el bíceps.',
                tips: [
                    'Inicia el tirón deprimiendo los hombros',
                    'Lleva el pecho hacia la barra',
                    'Controla el descenso (excéntrica de 2-3 seg)',
                    'Si no puedes, usa banda elástica para asistencia'
                ],
                commonErrors: [
                    'Balancear el cuerpo para subir (kipping involuntario)',
                    'No bajar completamente en cada repetición',
                    'Tirar solo con los brazos sin activar dorsales',
                    'Encoger los hombros al inicio del movimiento'
                ],
                executionSteps: [
                    'Posición inicial: Colgáte de la barra con agarre prono (palmas al frente), manos ligeramente más anchas que los hombros. Brazos completamente extendidos.',
                    'Inicio del tirón: Deprimí las escápulas (bajá los hombros) activando los dorsales antes de flexionar los codos.',
                    'Ascenso: Tirá llevando el pecho hacia la barra. Controlá el movimiento hasta que la barbilla supere la barra.',
                    'Descenso: Bajá de forma controlada (2-3 segundos) hasta la extensión completa de brazos sin soltar la activación.'
                ],
                variants: [
                    { name: 'Jalón al Pecho en Polea', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop', biomechanics: 'Simula el patrón de tracción vertical de las dominadas con carga ajustable. Ideal para principiantes que no pueden con su peso corporal o para hacer volumen con control.', tips: ['Tira los codos hacia las costillas', 'Retrae las escápulas al final del tirón', 'Controla la subida (excéntrica)'], commonErrors: ['Tirar con los brazos sin activar espalda', 'Inclinarse demasiado hacia atrás', 'Soltar el peso de golpe'], executionSteps: ['Posición inicial: Sentate en la máquina con los muslos bajo las almohadillas. Tomá la barra ancha con agarre prono.', 'Tirón: Incliná levemente el torso hacia atrás y tirá la barra hacia la parte superior del pecho llevando los codos hacia las costillas.', 'Contracción: Apretá las escápulas juntas 1 segundo en la posición baja.', 'Retorno: Dejá subir la barra de forma controlada estirando completamente los brazos.'] },
                    { name: 'Dominadas Supinas (Chin-ups)', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop', biomechanics: 'Agarre supino (palmas hacia ti) que enfatiza más el bíceps braquial y la porción inferior del dorsal. Generalmente más fáciles que las pronadas por la ventaja mecánica del bíceps.', tips: ['Agarre a la anchura de hombros', 'Lleva la barbilla sobre la barra', 'Controla el descenso completo'], commonErrors: ['No completar el rango (media rep)', 'Balancear el cuerpo', 'Soltar la activación abajo'], executionSteps: ['Posición inicial: Colgáte de la barra con agarre supino (palmas hacia vos) al ancho de hombros.', 'Tirón: Tirá llevando la barbilla por encima de la barra, enfocándote en apretar los bíceps y dorsales.', 'Descenso: Bajá controladamente (2-3 seg) hasta la extensión completa de brazos.', 'Repetición: Evitá el balanceo y mantené la activación muscular en todo el recorrido.'] },
                    { name: 'Dominadas Neutras', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop', biomechanics: 'Agarre neutro (palmas enfrentadas) que es más amigable con los hombros. Distribuye la carga entre dorsales, braquial anterior y bíceps de forma equilibrada.', tips: ['Usa barras paralelas o agarres en V', 'Aprieta dorsales al subir', 'Desciende de forma controlada'], commonErrors: ['Encoger los hombros', 'No extender completamente abajo', 'Usar kipping innecesario'], executionSteps: ['Posición inicial: Colgáte de las barras paralelas con agarre neutro (palmas enfrentadas). Brazos extendidos.', 'Tirón: Tirá deprimiendo las escápulas y flexionando los codos hasta que la barbilla supere los agarres.', 'Contracción: Apretá los dorsales arriba 1 segundo.', 'Descenso: Bajá de forma controlada hasta la extensión completa sin perder la postura.'] }
                ]
            },
            {
                id: 'ex-curl',
                name: 'Curl de Bíceps',
                subtitle: 'Aislamiento para flexores del codo',
                image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop',
                muscleGroup: 'Brazos',
                biomechanics: 'Ejercicio de aislamiento monoarticular. El bíceps braquial flexiona el codo y supina el antebrazo. La cabeza larga se estira más con el codo detrás del cuerpo (curl inclinado), mientras que la cabeza corta se enfatiza con el codo adelante (curl predicador).',
                tips: [
                    'Mantén los codos pegados al cuerpo',
                    'Supina (gira) las muñecas en la parte alta',
                    'Aprieta el bíceps 1 segundo arriba',
                    'Baja lento y controlado (3 seg)'
                ],
                commonErrors: [
                    'Usar impulso de la espalda para subir el peso',
                    'Mover los codos adelante durante el curl',
                    'Bajar demasiado rápido (perder la excéntrica)',
                    'Usar un peso excesivo sacrificando la forma'
                ],
                executionSteps: [
                    'Posición inicial: De pie con los pies al ancho de hombros, tomá las mancuernas con agarre supino (palmas hacia arriba) y brazos extendidos.',
                    'Flexión: Mantené los codos pegados al cuerpo e inhalá. Flexá los codos llevando las mancuernas hacia los hombros de forma controlada.',
                    'Contracción: En la parte alta, supina ligeramente las muñecas y apretá el bíceps durante 1 segundo.',
                    'Descenso: Exhalá y bajá lentamente (3 segundos) hasta la extensión completa sin perder tensión.'
                ],
                variants: [
                    { name: 'Curl Martillo', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop', biomechanics: 'Agarre neutro que enfatiza el braquial anterior y el braquiorradial. Desarrolla el grosor del brazo y la fuerza de antebrazo. El bíceps trabaja como sinergista secundario.', tips: ['Mantén las muñecas rectas todo el tiempo', 'Codos pegados al cuerpo', 'Aprieta arriba 1 segundo'], commonErrors: ['Rotar las muñecas durante el movimiento', 'Balancear el cuerpo', 'Subir demasiado rápido'], executionSteps: ['Posición inicial: De pie con mancuernas a los lados, agarre neutro (palmas enfrentadas). Codos pegados al cuerpo.', 'Flexión: Flexioná los codos llevando las mancuernas hacia los hombros sin rotar las muñecas.', 'Contracción: Apretá en la posición superior 1 segundo manteniendo las muñecas rectas.', 'Descenso: Bajá controladamente hasta la extensión completa.'] },
                    { name: 'Curl Inclinado con Mancuernas', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop', biomechanics: 'La inclinación del banco estira la cabeza larga del bíceps, proporcionando un mayor rango de movimiento y estímulo en la posición de estiramiento.', tips: ['Banco a 45-60 grados de inclinación', 'Deja los brazos colgar completamente', 'Controla la excéntrica 3 segundos'], commonErrors: ['Mover los codos hacia adelante', 'No usar rango completo', 'Banco demasiado inclinado (estrés hombro)'], executionSteps: ['Posición inicial: Sentate en un banco inclinado a 45-60° con mancuernas colgando a los lados, brazos completamente extendidos.', 'Flexión: Flexioná los codos llevando las mancuernas hacia los hombros sin mover los codos de su posición.', 'Contracción: Apretá el bíceps arriba 1 segundo sintiendo la tensión máxima.', 'Excéntrica: Bajá lentamente (3 seg) hasta la extensión completa manteniendo la tensión.'] },
                    { name: 'Curl con Barra Z', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=300&fit=crop', biomechanics: 'La barra EZ reduce el estrés en las muñecas comparada con la barra recta. Permite cargas más pesadas que las mancuernas y trabaja ambos bíceps simultáneamente.', tips: ['Agarra en la curva interior de la barra', 'Mantén los codos fijos', 'No uses impulso de espalda'], commonErrors: ['Usar la espalda para subir el peso', 'Flexionar las muñecas', 'No completar la extensión abajo'], executionSteps: ['Posición inicial: De pie con la barra EZ tomada en las curvas interiores, brazos extendidos. Codos pegados al torso.', 'Flexión: Flexioná los codos llevando la barra hacia los hombros manteniendo los codos fijos.', 'Contracción: Apretá los bíceps arriba 1 segundo.', 'Descenso: Bajá de forma controlada hasta la extensión completa sin usar impulso de espalda.'] }
                ]
            }
        ]
    },
    {
        id: 'lower',
        title: 'TREN INFERIOR',
        subtitle: 'Piernas, Glúteos y Pantorrillas',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=600&fit=crop',
        exercises: [
            {
                id: 'ex-squat',
                name: 'Sentadilla',
                subtitle: 'El rey del tren inferior',
                image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
                muscleGroup: 'Piernas',
                biomechanics: 'Movimiento multiarticular que involucra cadera, rodilla y tobillo. Los cuádriceps extienden la rodilla, los glúteos e isquios extienden la cadera. La profundidad determina la activación glútea: a mayor profundidad, mayor reclutamiento del glúteo mayor.',
                tips: [
                    'Pecho erguido y mirada al frente',
                    'Las rodillas deben seguir la línea de los pies',
                    'Inhala profundo antes de bajar (Valsalva)',
                    'Rompe la paralela para máxima activación glútea'
                ],
                commonErrors: [
                    'Dejar que las rodillas colapsen hacia adentro',
                    'Redondear la espalda baja al subir',
                    'Elevar los talones del suelo',
                    'No alcanzar suficiente profundidad'
                ],
                executionSteps: [
                    'Posición inicial: Colocate debajo de la barra con los pies al ancho de hombros y puntas ligeramente hacia afuera. La barra sobre los trapecios.',
                    'Desrackeo: Extendé las piernas para sacar la barra del rack y dá 1-2 pasos hacia atrás.',
                    'Descenso: Inhalá profundo (Valsalva), empujá la cadera hacia atrás y flexioná rodillas bajando controladamente hasta romper la paralela.',
                    'Ascenso: Empujá el suelo con los pies, mantené el pecho erguido y exhalá al subir hasta la extensión completa.',
                    'Re-rack: Caminá hacia adelante y depositá la barra en los soportes con control.'
                ],
                variants: [
                    { name: 'Sentadilla Frontal', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop', biomechanics: 'La barra sobre los deltoides anteriores desplaza el centro de gravedad hacia adelante, aumentando la activación de cuádriceps y exigiendo mayor movilidad torácica y de muñeca.', tips: ['Codos altos para sostener la barra', 'Torso lo más vertical posible', 'Baja profundo manteniendo la postura'], commonErrors: ['Dejar caer los codos', 'Redondear la espalda torácica', 'No tener movilidad de muñeca suficiente'], executionSteps: ['Posición inicial: Colocá la barra sobre los deltoides anteriores con los codos altos. Pies al ancho de hombros.', 'Descenso: Inhalá y bajá manteniendo el torso lo más vertical posible. Los codos deben apuntar al frente.', 'Profundidad: Bajá hasta romper la paralela manteniendo los codos altos en todo momento.', 'Ascenso: Empujá el suelo y subí manteniendo el pecho erguido. Exhalá al completar la repetición.'] },
                    { name: 'Sentadilla Búlgara', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop', biomechanics: 'Variante unilateral con pie trasero elevado. Trabaja cuádriceps, glúteo y estabilizadores de cadera de forma asimétrica. Excelente para corregir desequilibrios.', tips: ['Pie delantero a ~60cm del banco', 'Rodilla delantera sigue la línea del pie', 'Baja hasta que el muslo esté paralelo'], commonErrors: ['Zancada demasiado corta o larga', 'Inclinar el torso excesivamente', 'Perder el equilibrio por falta de práctica'], executionSteps: ['Posición inicial: De pie frente a un banco, colocá el empeine del pie trasero sobre el banco. Pie delantero a ~60cm.', 'Descenso: Bajá flexionando la rodilla delantera hasta que el muslo quede paralelo al suelo. Mantené el torso erguido.', 'Ascenso: Empujá con el pie delantero para subir a la posición inicial.', 'Repetir: Completá todas las repeticiones de un lado antes de cambiar de pierna.'] },
                    { name: 'Sentadilla Goblet', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop', biomechanics: 'Sentadilla con mancuerna o kettlebell sostenida a la altura del pecho. La carga frontal promueve un torso erguido y es ideal para aprender la mecánica de la sentadilla.', tips: ['Sostén el peso pegado al pecho', 'Abre las rodillas al bajar', 'Usa esta variante como calentamiento o corrección'], commonErrors: ['Separar el peso del pecho', 'No bajar lo suficiente', 'Redondear la espalda baja'], executionSteps: ['Posición inicial: Sostené una mancuerna o kettlebell contra el pecho con ambas manos. Pies al ancho de hombros.', 'Descenso: Bajá empujando la cadera atrás y abriendo las rodillas. Mantené el peso pegado al cuerpo.', 'Profundidad: Bajá lo más que puedas manteniendo la espalda recta y los talones en el suelo.', 'Ascenso: Empujá el suelo y subí a la posición inicial. Exhalá al subir.'] }
                ]
            },
            {
                id: 'ex-rdl',
                name: 'Peso Muerto Rumano',
                subtitle: 'Cadena posterior completa',
                image: 'https://images.unsplash.com/photo-1598268030450-7a476f602982?w=400&h=300&fit=crop',
                muscleGroup: 'Piernas',
                biomechanics: 'Variante del peso muerto enfocada en la bisagra de cadera con rodillas semiflexionadas. Trabaja principalmente isquiosurales y glúteo mayor a través de la extensión de cadera. Es excelente para desarrollar la cadena posterior y mejorar la flexibilidad de los isquios.',
                tips: [
                    'Mantén la espalda neutra en todo momento',
                    'La barra viaja pegada a las piernas',
                    'Empuja la cadera hacia atrás (hip hinge)',
                    'Siente el estiramiento en los isquios'
                ],
                commonErrors: [
                    'Redondear la espalda baja',
                    'Flexionar demasiado las rodillas (se convierte en sentadilla)',
                    'Alejar la barra del cuerpo',
                    'No completar la extensión de cadera arriba'
                ],
                executionSteps: [
                    'Posición inicial: De pie con la barra en las manos, agarre prono al ancho de hombros. Rodillas levemente flexionadas, espalda neutra.',
                    'Bisagra de cadera: Empujá la cadera hacia atrás manteniendo la barra pegada a los muslos. Inhalá durante el descenso.',
                    'Estiramiento: Bajá hasta sentir un estiramiento intenso en los isquiosurales (generalmente a media espinilla).',
                    'Extensión: Apretá glúteos y empujá la cadera hacia adelante para volver a la posición erguida. Exhalá al subir.'
                ],
                variants: [
                    { name: 'Peso Muerto Convencional', image: 'https://images.unsplash.com/photo-1598268030450-7a476f602982?w=400&h=300&fit=crop', biomechanics: 'La variante clásica desde el suelo. Involucra toda la cadena posterior, erectores espinales, glúteos e isquios. Mayor rango de movimiento y reclutamiento muscular general que el rumano.', tips: ['La barra empieza sobre el mediopié', 'Empuja el suelo con los pies', 'Mantén la barra pegada al cuerpo'], commonErrors: ['Redondear la espalda al iniciar el tirón', 'Dejar la barra alejarse del cuerpo', 'Hiperextender arriba agresivamente'], executionSteps: ['Posición inicial: De pie frente a la barra con los pies bajo la barra (mediopié). Agarre prono al ancho de hombros.', 'Setup: Bajá las caderas, pecho arriba, espalda neutra. La barra toca las espinillas.', 'Tirón: Empujá el suelo con los pies levantando la barra pegada al cuerpo. Caderas y hombros suben juntos.', 'Bloqueo: Extendé caderas y rodillas completamente arriba. Bajá la barra controladamente.'] },
                    { name: 'Peso Muerto Sumo', image: 'https://images.unsplash.com/photo-1598268030450-7a476f602982?w=400&h=300&fit=crop', biomechanics: 'Stance amplio con manos entre las piernas. Reduce el rango de movimiento y el estrés lumbar. Mayor activación de aductores y cuádriceps comparado con el convencional.', tips: ['Pies abiertos a 45 grados', 'Empuja las rodillas hacia afuera', 'Torso más vertical que en convencional'], commonErrors: ['Rodillas colapsando hacia adentro', 'Caderas subiendo antes que los hombros', 'No abrir suficiente los pies'], executionSteps: ['Posición inicial: Pies muy abiertos con puntas a 45°. Tomá la barra con agarre estrecho entre las piernas.', 'Setup: Bajá las caderas, pecho arriba, empujá las rodillas hacia afuera. Torso más vertical que en convencional.', 'Tirón: Extendé las piernas empujando el suelo hacia afuera mientras mantenés la barra pegada al cuerpo.', 'Bloqueo: Extendé completamente caderas y rodillas. Bajá de forma controlada.'] },
                    { name: 'Peso Muerto a Una Pierna', image: 'https://images.unsplash.com/photo-1598268030450-7a476f602982?w=400&h=300&fit=crop', biomechanics: 'Variante unilateral que desafía el equilibrio y la estabilidad de cadera. Trabaja glúteo medio como estabilizador y corrige asimetrías de fuerza entre piernas.', tips: ['Pierna de apoyo con rodilla levemente flexionada', 'Cadera cuadrada al suelo', 'Usa mancuerna contralateral para balance'], commonErrors: ['Rotar la cadera al bajar', 'Redondear la espalda', 'No tener suficiente estabilidad de tobillo'], executionSteps: ['Posición inicial: De pie sobre una pierna con rodilla levemente flexionada. Mancuerna en la mano contralateral.', 'Bisagra: Incliná el torso hacia adelante mientras la pierna libre se extiende hacia atrás. La cadera se mantiene cuadrada.', 'Estiramiento: Bajá hasta sentir el estiramiento en los isquios de la pierna de apoyo.', 'Retorno: Apretá el glúteo y volvé a la posición erguida de forma controlada.'] }
                ]
            },
            {
                id: 'ex-hip',
                name: 'Hip Thrust',
                subtitle: 'Aislamiento de glúteo mayor',
                image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
                muscleGroup: 'Glúteos',
                biomechanics: 'Extensión de cadera con soporte en un banco. Permite cargas pesadas con mínimo estrés espinal. El glúteo mayor alcanza su pico de activación en la extensión completa de cadera, lo que convierte este ejercicio en el rey del desarrollo glúteo.',
                tips: [
                    'Apoya la parte alta de la espalda en el banco',
                    'Empuje explosivo de cadera arriba',
                    'Mantén la mirada al frente (barbilla al pecho)',
                    'Pausa de 2 seg en la contracción máxima'
                ],
                commonErrors: [
                    'Hiperextender la columna lumbar arriba',
                    'No alcanzar la extensión completa de cadera',
                    'Colocar los pies demasiado lejos o cerca',
                    'Dejar que las rodillas colapsen hacia adentro'
                ],
                executionSteps: [
                    'Posición inicial: Sentá la parte alta de la espalda (escápulas) contra el borde de un banco. Pies apoyados al ancho de caderas, rodillas a 90°.',
                    'Carga: Colocá la barra o disco sobre el pliegue de la cadera, usá un pad para comodidad.',
                    'Empuje: Apretá los glúteos y empujá la cadera hacia el techo de forma explosiva hasta la extensión completa.',
                    'Contracción: Mantené la posición superior 2 segundos apretando fuerte los glúteos. Mirá al frente (barba al pecho).',
                    'Descenso: Bajá la cadera lenta y controladamente sin tocar completamente el suelo entre repeticiones.'
                ],
                variants: [
                    { name: 'Hip Thrust a Una Pierna', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop', biomechanics: 'Versión unilateral que duplica la carga relativa sobre cada glúteo. Excelente para corregir asimetrías y aumentar la activación neuromuscular por la inestabilidad.', tips: ['Extiende una pierna al frente', 'Empuja con el talón del pie apoyado', 'Aprieta el glúteo 2 seg arriba'], commonErrors: ['Rotar la pelvis al extender', 'No alcanzar la extensión completa', 'Usar demasiado peso demasiado pronto'], executionSteps: ['Posición inicial: Espalda contra el banco, extendé una pierna al frente. Pie de apoyo firme en el suelo.', 'Empuje: Empujá con el talón del pie apoyado elevando la cadera hasta la extensión completa.', 'Contracción: Apretá el glúteo 2 segundos arriba sin rotar la pelvis.', 'Descenso: Bajá controladamente y repetí todas las reps antes de cambiar de pierna.'] },
                    { name: 'Puente de Glúteos en Suelo', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop', biomechanics: 'Versión básica del hip thrust sin banco. La espalda permanece en el suelo, reduciendo el rango de movimiento pero siendo más accesible para principiantes.', tips: ['Pies a la anchura de caderas', 'Empuja los talones contra el suelo', 'Aprieta arriba sin hiperextender'], commonErrors: ['Empujar con los dedos del pie', 'No apretar los glúteos arriba', 'Extensión lumbar excesiva'], executionSteps: ['Posición inicial: Boca arriba con rodillas flexionadas, pies al ancho de caderas. Brazos a los lados.', 'Empuje: Empujá los talones contra el suelo y elevá la cadera apretando los glúteos.', 'Contracción: Mantené la posición superior 2 segundos sin hiperextender la lumbar.', 'Descenso: Bajá la cadera controladamente sin tocar el suelo entre repeticiones.'] },
                    { name: 'Hip Thrust con Banda', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop', biomechanics: 'La banda elástica alrededor de las rodillas activa el glúteo medio como estabilizador, aumentando la activación glútea total. Excelente como activación pre-entrenamiento.', tips: ['Banda justo encima de las rodillas', 'Empuja las rodillas hacia afuera', 'Mantén tensión constante en la banda'], commonErrors: ['Dejar que las rodillas colapsen', 'Banda demasiado floja', 'No completar el rango de movimiento'], executionSteps: ['Posición inicial: Colocá una banda elástica justo encima de las rodillas. Espalda contra el banco, pies al ancho de caderas.', 'Empuje: Empujá la cadera hacia arriba manteniendo las rodillas empujando la banda hacia afuera.', 'Contracción: Apretá glúteos arriba 2 segundos manteniendo la tensión en la banda.', 'Descenso: Bajá controladamente sin dejar que las rodillas colapsen hacia adentro.'] }
                ]
            },
            {
                id: 'ex-calves',
                name: 'Elevación de Talones',
                subtitle: 'Desarrollo de pantorrillas',
                image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop',
                muscleGroup: 'Pantorrillas',
                biomechanics: 'Flexión plantar del tobillo que trabaja predominantemente el gastrocnemio (de pie) o el sóleo (sentado). El gastrocnemio es biarticular y se estira con la rodilla extendida, por lo que las elevaciones de pie son más efectivas para este músculo.',
                tips: [
                    'Rango de movimiento completo (estira abajo)',
                    'Pausa de 1 seg en la contracción arriba',
                    'Excéntrica lenta de 3 segundos',
                    'Usa carga progresiva pesada'
                ],
                commonErrors: [
                    'Rango de movimiento parcial (rebotes)',
                    'Velocidad excesiva sin control',
                    'Doblar las rodillas para meter impulso',
                    'Usar peso demasiado ligero'
                ],
                executionSteps: [
                    'Posición inicial: De pie sobre un escalón o plataforma con la punta de los pies en el borde. Talones colgando al vacío.',
                    'Estiramiento: Bajá los talones lo máximo posible sintiendo el estiramiento completo en las pantorrillas (2 segundos).',
                    'Elevación: Empujá con la punta de los pies hacia arriba hasta la máxima contracción. Apretá 1 segundo arriba.',
                    'Descenso: Bajá de forma controlada (3 segundos) hasta la posición de estiramiento. Repetí sin rebotes.'
                ],
                variants: [
                    { name: 'Elevación Sentado (Sóleo)', image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop', biomechanics: 'Con la rodilla flexionada a 90°, el gastrocnemio queda acortado y el sóleo se convierte en el motor primario. Fundamental para el desarrollo completo de la pantorrilla.', tips: ['Rodillas a 90 grados', 'Rango completo: estira abajo, aprieta arriba', 'Pausa de 2 seg en la contracción'], commonErrors: ['Rango de movimiento parcial', 'Rebotes sin control', 'No cargar suficiente peso'], executionSteps: ['Posición inicial: Sentate en la máquina de pantorrillas con las rodillas a 90° y las puntas de los pies en el borde de la plataforma.', 'Estiramiento: Bajá los talones completamente sintiendo el estiramiento del sóleo.', 'Elevación: Empujá hacia arriba con las puntas de los pies hasta la máxima contracción. Pausa de 2 seg.', 'Descenso: Bajá de forma controlada y repetí sin rebotes.'] },
                    { name: 'Elevación en Prensa', image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop', biomechanics: 'Realizar flexión plantar en la plataforma de prensa de piernas. Permite cargas muy pesadas en un entorno seguro controlado por la máquina.', tips: ['Solo usar la punta del pie en la plataforma', 'Extensión completa del tobillo', 'Control total en todo momento'], commonErrors: ['Flexionar las rodillas durante el movimiento', 'Peso excesivo sin control', 'Rango parcial'], executionSteps: ['Posición inicial: Colocá solo las puntas de los pies en la plataforma de la prensa. Piernas casi extendidas.', 'Descenso: Bajá los talones lentamente dejando que los tobillos se flexionen al máximo.', 'Empuje: Empujá la plataforma con las puntas de los pies hasta la extensión completa del tobillo.', 'Control: No flexiones las rodillas durante el movimiento. Mantené el control total.'] },
                    { name: 'Elevación a Una Pierna', image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop', biomechanics: 'Versión unilateral que duplica la carga relativa y permite corregir asimetrías entre piernas. Mejora el equilibrio y la propiocepción del tobillo.', tips: ['Usa una mancuerna del mismo lado', 'Sostente de algo para equilibrio', 'Controla cada repetición'], commonErrors: ['Ir demasiado rápido', 'No usar rango completo', 'Perder el equilibrio comprometiendo la técnica'], executionSteps: ['Posición inicial: De pie sobre un escalón con un solo pie, talón colgando. Mancuerna en la mano del mismo lado.', 'Estiramiento: Bajá el talón lo máximo posible sintiendo el estiramiento en la pantorrilla.', 'Elevación: Empujá hacia arriba con la punta del pie hasta la contracción máxima. Apretá 1 segundo.', 'Control: Bajá de forma controlada. Completá todas las reps antes de cambiar de pierna.'] }
                ]
            }
        ]
    },
    {
        id: 'core',
        title: 'CORE Y ABDOMEN',
        subtitle: 'Estabilidad y fuerza del centro',
        image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&h=600&fit=crop',
        exercises: [
            {
                id: 'ex-plank',
                name: 'Plancha Isométrica',
                subtitle: 'Estabilización anti-extensión',
                image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=300&fit=crop',
                muscleGroup: 'Core Anterior',
                biomechanics: 'Ejercicio isométrico anti-extensión que trabaja el recto abdominal, transverso y oblicuos de forma estática. El objetivo es mantener la columna en posición neutra resistiendo la fuerza de la gravedad. Es fundamental para desarrollar la estabilidad del tronco.',
                tips: [
                    'Cuerpo en línea recta de cabeza a talones',
                    'Aprieta abdomen y glúteos simultáneamente',
                    'Empuja el suelo con los antebrazos',
                    'Respira de forma controlada (no contener)'
                ],
                commonErrors: [
                    'Dejar caer la cadera hacia el suelo',
                    'Subir demasiado la cadera (forma de tienda)',
                    'Contener la respiración',
                    'Mirar hacia arriba (tensión cervical)'
                ],
                executionSteps: [
                    'Posición inicial: Boca abajo, apoyá los antebrazos en el suelo con los codos directamente debajo de los hombros.',
                    'Elevación: Levantá el cuerpo del suelo formando una línea recta desde la cabeza hasta los talones.',
                    'Activación: Apretá abdomen, glúteos y cuádriceps simultáneamente. Empujá el suelo con los antebrazos.',
                    'Respiración: Respirá de forma controlada y rítmica. No contengas la respiración.',
                    'Duración: Mantené la posición el tiempo indicado sin perder la alineación. Descansá y repetí.'
                ],
                variants: [
                    { name: 'Plancha Lateral', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=300&fit=crop', biomechanics: 'Ejercicio anti-flexión lateral que trabaja principalmente los oblicuos y el cuadrado lumbar. Fundamental para la estabilidad frontal del core.', tips: ['Cuerpo en línea recta lateral', 'Codo directamente bajo el hombro', 'Aprieta glúteos y abdomen'], commonErrors: ['Cadera cayendo hacia el suelo', 'Rotar el torso', 'Contener la respiración'], executionSteps: ['Posición inicial: Acostate de lado con el codo directamente bajo el hombro. Piernas extendidas y apiladas.', 'Elevación: Levantá la cadera formando una línea recta desde la cabeza hasta los pies.', 'Activación: Apretá oblicuos, glúteos y abdomen. Mantené la posición sin rotar el torso.', 'Duración: Mantené el tiempo indicado y cambiá de lado. Respirá de forma controlada.'] },
                    { name: 'Plancha RKC', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=300&fit=crop', biomechanics: 'Versión de máxima intensidad donde se contraen todos los músculos al máximo. Los antebrazos intentan ir hacia los pies creando tensión extrema en el recto abdominal.', tips: ['Contrae todos los músculos al máximo', 'Intenta juntar codos y pies', 'Mantén solo 10-15 segundos'], commonErrors: ['No generar suficiente tensión', 'Mantener demasiado tiempo y perder intensidad', 'Olvidar apretar los glúteos'], executionSteps: ['Posición inicial: En posición de plancha estándar sobre los antebrazos. Pies juntos.', 'Tensión: Contraé todos los músculos al máximo: abdomen, glúteos, cuádriceps, dorsales.', 'Fuerza: Intentá llevar los codos hacia los pies y los pies hacia los codos creando tensión extrema.', 'Duración: Mantené solo 10-15 segundos a máxima intensidad. Descansá y repetí.'] },
                    { name: 'Plancha con Extensión de Brazo', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=300&fit=crop', biomechanics: 'Añade un componente anti-rotación al extender un brazo al frente. El core debe resistir la rotación mientras se mantiene la posición de plancha estable.', tips: ['Extiende el brazo lento y controlado', 'No permitas que la cadera rote', 'Alterna brazos de forma simétrica'], commonErrors: ['Rotar el torso al extender', 'Perder la posición neutra de la columna', 'Moverse demasiado rápido'], executionSteps: ['Posición inicial: En posición de plancha sobre los antebrazos con el core apretado.', 'Extensión: Extendé un brazo al frente lentamente sin permitir que la cadera rote.', 'Retorno: Volvé el brazo a la posición de plancha de forma controlada.', 'Alternancia: Alterná brazos manteniendo la estabilidad del core en todo momento.'] }
                ]
            },
            {
                id: 'ex-crunch',
                name: 'Crunch en Polea',
                subtitle: 'Flexión vertebral con carga',
                image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
                muscleGroup: 'Core Anterior',
                biomechanics: 'Flexión espinal contra resistencia que permite progresión de carga. El recto abdominal se acorta acercando el esternón a la pelvis. Permite un estímulo mecánico superior al crunch tradicional al poder incrementar peso progresivamente.',
                tips: [
                    'Flexiona la columna, no la cadera',
                    'Lleva las costillas hacia la pelvis',
                    'Mantén la cadera fija en su posición',
                    'Exhala durante la contracción'
                ],
                commonErrors: [
                    'Tirar con los brazos en lugar del abdomen',
                    'Sentarse sobre los talones (flexión de cadera)',
                    'No controlar la fase excéntrica',
                    'Usar demasiado peso y perder la técnica'
                ],
                executionSteps: [
                    'Posición inicial: Arrodillate frente a la polea alta. Tomá la cuerda o barra por detrás de la cabeza con ambas manos.',
                    'Flexión: Exhalá y flexioná la columna acercando las costillas hacia la pelvis. Mantené la cadera fija.',
                    'Contracción: Apretá el abdomen 1 segundo en la posición más baja, sintiendo la máxima contracción.',
                    'Retorno: Inhalá y volvé de forma controlada a la posición inicial sin dejar que el peso tire de golpe.'
                ],
                variants: [
                    { name: 'Crunch en Suelo', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', biomechanics: 'La versión clásica sin carga. El recto abdominal flexiona la columna acercando las costillas a la pelvis. Útil para principiantes o como finisher de alto volumen.', tips: ['Manos detrás de las orejas, no del cuello', 'Levanta solo los omóplatos del suelo', 'Exhala arriba, inhala al bajar'], commonErrors: ['Tirar del cuello con las manos', 'Usar impulso para subir', 'Rango de movimiento excesivo (flexión de cadera)'], executionSteps: ['Posición inicial: Boca arriba con rodillas flexionadas, pies apoyados. Manos detrás de las orejas.', 'Flexión: Exhalá y levantá los omóplatos del suelo acercando las costillas a la pelvis.', 'Contracción: Apretá el abdomen 1 segundo en la posición más alta.', 'Descenso: Inhalá y bajá de forma controlada sin apoyar completamente la cabeza.'] },
                    { name: 'Crunch Invertido', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', biomechanics: 'En lugar de acercar las costillas a la pelvis, se acerca la pelvis a las costillas. Enfatiza la porción inferior del recto abdominal y reduce el estrés cervical.', tips: ['Levanta la pelvis del suelo, no solo las piernas', 'Controla la fase excéntrica', 'Mantén manos al costado para estabilidad'], commonErrors: ['Solo subir las piernas sin flexionar la pelvis', 'Usar impulso de balanceo', 'No controlar el descenso'], executionSteps: ['Posición inicial: Boca arriba con piernas elevadas y rodillas flexionadas a 90°. Manos a los lados.', 'Flexión: Exhalá y levantá la pelvis del suelo acercando las rodillas hacia el pecho.', 'Contracción: Apretá el abdomen inferior en la posición más alta.', 'Descenso: Bajá la pelvis de forma controlada sin dejar caer las piernas.'] },
                    { name: 'Crunch en Máquina', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', biomechanics: 'La máquina guía el movimiento y permite progresión de carga precisa. Reduce la compensación y aísla mejor el recto abdominal que las variantes libres.', tips: ['Ajusta el asiento a tu altura', 'Flexiona la columna, no la cadera', 'Controla la vuelta al inicio'], commonErrors: ['Usar demasiado peso sacrificando forma', 'Flexionar la cadera en vez de la columna', 'Velocidad excesiva'], executionSteps: ['Posición inicial: Sentáte en la máquina y ajustá el asiento a tu altura. Tomá los agarres.', 'Flexión: Exhalá y flexioná la columna acercando las costillas a la pelvis. No flexiones la cadera.', 'Contracción: Apretá el abdomen 1 segundo en la posición más baja.', 'Retorno: Volvé de forma controlada a la posición inicial sin soltar el peso de golpe.'] }
                ]
            },
            {
                id: 'ex-pallof',
                name: 'Pallof Press',
                subtitle: 'Anti-rotación con polea',
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
                muscleGroup: 'Core Rotacional',
                biomechanics: 'Ejercicio anti-rotación que desafía a los oblicuos y al transverso a mantener la columna estable mientras los brazos se extienden. La polea lateral crea un vector de fuerza rotacional que el core debe resistir, desarrollando estabilidad funcional real.',
                tips: [
                    'Extiende los brazos lento y controlado',
                    'No permitas que el torso rote',
                    'Mantén las caderas mirando al frente',
                    'Core apretado en todo momento'
                ],
                commonErrors: [
                    'Permitir la rotación del tronco',
                    'Usar demasiada carga y compensar',
                    'No extender los brazos completamente',
                    'Mantener los codos flexionados'
                ],
                executionSteps: [
                    'Posición inicial: De pie de costado a la polea, pies al ancho de hombros. Tomá el asa con ambas manos a la altura del pecho.',
                    'Extensión: Extendé los brazos lentamente hacia el frente, resistiendo la fuerza de rotación que genera la polea.',
                    'Pausa: Mantené los brazos extendidos 2 segundos con el core apretado y las caderas al frente.',
                    'Retorno: Volvé las manos al pecho de forma controlada. El torso no debe rotar en ningún momento.'
                ],
                variants: [
                    { name: 'Pallof Press con Banda', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop', biomechanics: 'Misma mecánica que la versión con polea pero usando banda elástica. La resistencia aumenta progresivamente al extender los brazos, creando un estímulo diferente.', tips: ['Ancla la banda a la altura del pecho', 'Mantén los pies a la anchura de hombros', 'Extiende completamente los brazos'], commonErrors: ['Banda demasiado floja', 'Permitir rotación del torso', 'No mantener tensión constante'], executionSteps: ['Posición inicial: Anclá la banda a un punto fijo a la altura del pecho. Tomála con ambas manos.', 'Extensión: Extendé los brazos al frente resistiendo la tracción de la banda.', 'Pausa: Mantené los brazos extendidos 2 segundos con el core apretado.', 'Retorno: Volvé las manos al pecho de forma controlada sin rotar el torso.'] },
                    { name: 'Anti-rotación en Rodillas', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop', biomechanics: 'Versión arrodillada que elimina la estabilidad de las piernas y aumenta la demanda sobre el core para resistir la rotación. Mayor activación abdominal.', tips: ['Una o dos rodillas en el suelo', 'Core apretado al máximo', 'Movimiento lento y controlado'], commonErrors: ['Sentarse sobre los talones', 'Inclinarse hacia la polea', 'Perder la postura erguida'], executionSteps: ['Posición inicial: Arrodillate de costado a la polea. Tomá el asa con ambas manos al pecho.', 'Extensión: Extendé los brazos al frente lentamente, resistiendo la rotación.', 'Pausa: Mantené 2 segundos con brazos extendidos y core activado.', 'Retorno: Volvé las manos al pecho sin permitir rotación del torso.'] },
                    { name: 'Pallof Press con Caminar', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop', biomechanics: 'Combina anti-rotación con locomoción. Caminar con los brazos extendidos mientras se resiste la rotación es altamente funcional y transferible al deporte.', tips: ['Extiende los brazos y camina lateral', 'Pasos controlados y pequeños', 'Mantén las caderas al frente'], commonErrors: ['Girar hacia la dirección de caminar', 'Pasos demasiado grandes', 'Dejar que los brazos se acerquen al cuerpo'], executionSteps: ['Posición inicial: De costado a la polea, extendé los brazos al frente con el core apretado.', 'Caminata: Caminá lateralmente con pasos pequeños y controlados manteniendo los brazos extendidos.', 'Resistencia: Resistí la rotación en todo momento, mantené las caderas al frente.', 'Retorno: Volvé al punto inicial y cambiá de lado.'] }
                ]
            }
        ]
    },
    {
        id: 'mobility',
        title: 'MOVILIDAD',
        subtitle: 'Flexibilidad y rango articular',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        exercises: [
            {
                id: 'ex-hip-mob',
                name: 'Movilidad de Cadera',
                subtitle: 'Rango articular completo',
                image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
                muscleGroup: 'Movilidad Articular',
                biomechanics: 'La cadera es una articulación esférica con 6 grados de libertad. La restricción en su rango de movimiento compensa en la zona lumbar y las rodillas, aumentando el riesgo de lesión. Trabajar rotación interna, externa, flexión y extensión es clave para el rendimiento.',
                tips: [
                    'Realiza movimientos amplios y controlados',
                    'Mantén el torso erguido durante los estiramientos',
                    'Respira profundamente en cada posición',
                    'Progresa gradualmente en el rango'
                ],
                commonErrors: [
                    'Forzar el rango más allá del dolor',
                    'Compensar con la zona lumbar',
                    'Moverse demasiado rápido (sin control)',
                    'Saltear el calentamiento previo'
                ],
                executionSteps: [
                    'Posición inicial: Sentáte en el suelo con ambas piernas formando un ángulo de 90° (posición 90/90).',
                    'Rotación: Rotá las caderas lentamente alternando la posición de las piernas. Mantené el torso erguido.',
                    'Respiración: Respirá profundo en cada posición, mantené 5-10 segundos por lado.',
                    'Progresión: Aumentá gradualmente el rango y la velocidad de transición a medida que mejora la movilidad.'
                ],
                variants: [
                    { name: '90/90 Hip Switch', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop', biomechanics: 'Posición de 90 grados en ambas piernas que trabaja rotación interna y externa de cadera simultáneamente. La transición entre lados desarrolla control motor y movilidad funcional.', tips: ['Ambas rodillas a 90 grados', 'Torso erguido durante la transición', 'Mueve desde la cadera, no las rodillas'], commonErrors: ['Compensar inclinando el torso', 'Forzar el rango en frío', 'Movimientos bruscos sin control'], executionSteps: ['Posición inicial: Sentate en el suelo con ambas piernas formando ángulos de 90°.', 'Transición: Rotá desde las caderas alternando la posición de las piernas de un lado al otro.', 'Control: Mantené el torso erguido durante la transición. No te inclines.', 'Respiración: Respirá profundo en cada posición, mantené 5 segundos por lado.'] },
                    { name: 'Estocada del Corredor', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop', biomechanics: 'Estiramiento profundo de los flexores de cadera (psoas, recto femoral) en posición de estocada baja. Contrarresta los efectos negativos de estar sentado largo tiempo.', tips: ['Rodilla trasera en el suelo', 'Empuja la cadera hacia adelante suavemente', 'Mantén 30-60 seg por lado'], commonErrors: ['Arquear la espalda baja', 'No mantener lo suficiente', 'Rodilla delantera pasando la punta del pie'], executionSteps: ['Posición inicial: En posición de estocada con la rodilla trasera apoyada en el suelo.', 'Estiramiento: Empujá la cadera hacia adelante suavemente sintiendo el estiramiento en el flexor de cadera.', 'Respiración: Mantené la posición 30-60 segundos respirando profundamente.', 'Cambio: Cambiá de pierna y repetí del otro lado.'] },
                    { name: 'Rana (Frog Stretch)', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop', biomechanics: 'Estiramiento de aductores e ingle con las rodillas abiertas y apoyadas en el suelo. Mejora la apertura de cadera necesaria para sentadillas sumo y split squats.', tips: ['Rodillas sobre superficie suave', 'Empuja la cadera hacia atrás lentamente', 'Respira profundo en cada repetición'], commonErrors: ['Forzar la apertura demasiado rápido', 'No usar superficie acolchada', 'Contener la respiración'], executionSteps: ['Posición inicial: En cuadrupedia, abrí las rodillas lo más amplio que puedas sobre una superficie acolchada.', 'Estiramiento: Empujá la cadera hacia atrás lentamente sintiendo el estiramiento en los aductores.', 'Respiración: Respirá profundo en cada repetición. Mantené 10-15 segundos por posición.', 'Progresión: Aumentá la apertura gradualmente a medida que aumenta la flexibilidad.'] }
                ]
            },
            {
                id: 'ex-sh-mob',
                name: 'Movilidad de Hombro',
                subtitle: 'Estabilidad escapular y rango',
                image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
                muscleGroup: 'Movilidad Articular',
                biomechanics: 'El complejo del hombro tiene el mayor rango de movimiento del cuerpo, pero también es el más inestable. La movilidad torácica, la salud del manguito rotador y el ritmo escapulohumeral son fundamentales para prevenir impingement y lesiones de hombro.',
                tips: [
                    'Incluye ejercicios de rotación externa',
                    'Trabaja la extensión torácica antes del press',
                    'Usa bandas elásticas para calentamiento',
                    'Mantén posiciones de 15-30 seg'
                ],
                commonErrors: [
                    'Ignorar la movilidad torácica',
                    'Estirar agresivamente en frío',
                    'No incluir trabajo de manguito rotador',
                    'Compensar con movimiento lumbar'
                ],
                executionSteps: [
                    'Posición inicial: De pie o sentáte con la espalda recta. Tomá una banda elástica con ambas manos al ancho de los hombros.',
                    'Elevación: Levantá los brazos por encima de la cabeza manteniendo los codos extendidos.',
                    'Rotación: Realizá rotaciones externas lentas con bandas livianas. Mantené 15-30 segundos en cada posición.',
                    'Repetición: Alterná entre ejercicios de rotación externa, wall slides y hang pasivo para cubrir todos los rangos.'
                ],
                variants: [
                    { name: 'Dislocaciones con Banda', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop', biomechanics: 'Movimiento de circumducción completa del hombro con banda elástica. Mejora la movilidad global del hombro y estira pectoral, deltoides y dorsal.', tips: ['Usa una banda ancha para menor resistencia', 'Agarre amplio al inicio, estrecha gradualmente', 'Movimiento lento y controlado'], commonErrors: ['Banda demasiado corta (forzar el hombro)', 'Movimiento rápido y descontrolado', 'Doblar los codos durante el paso'], executionSteps: ['Posición inicial: De pie, tomá la banda con agarre amplio frente a vos, brazos extendidos.', 'Circumducción: Pasá la banda por encima de la cabeza y detrás de la espalda de forma lenta.', 'Retorno: Volvé la banda al frente de la misma forma controlada.', 'Progresión: A medida que mejora la movilidad, estrechá gradualmente el agarre.'] },
                    { name: 'Wall Slides', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop', biomechanics: 'Deslizamiento de los antebrazos contra la pared trabajando la elevación escapular y la rotación externa del hombro. Excelente para mejorar el ritmo escapulohumeral.', tips: ['Espalda y antebrazos pegados a la pared', 'Desliza arriba manteniendo contacto', 'No arquear la espalda baja'], commonErrors: ['Despegar los antebrazos de la pared', 'Compensar arqueando la lumbar', 'No mantener el rango completo'], executionSteps: ['Posición inicial: De pie contra la pared con la espalda, cabeza y antebrazos pegados.', 'Deslizamiento: Deslizá los antebrazos hacia arriba manteniendo contacto con la pared.', 'Extensión: Llegá lo más arriba posible sin despegar los antebrazos ni arquear la lumbar.', 'Retorno: Bajá controladamente a la posición inicial y repetí.'] },
                    { name: 'Hang Pasivo en Barra', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop', biomechanics: 'Colgarse de una barra con peso muerto descomprime la columna y estira dorsales, pectorales y flexores. La tracción gravitacional mejora la salud articular del hombro.', tips: ['Agarre completo con pulgares', 'Relaja los hombros completamente', 'Empieza con 15 seg y progresa'], commonErrors: ['Tensar los hombros sin relajarlos', 'Caída brusca al soltar', 'Ignorar dolor agudo de hombro'], executionSteps: ['Posición inicial: Colgáte de una barra con agarre completo (pulgares rodeando la barra).', 'Relajación: Relajá completamente los hombros dejando que la gravedad estire tus músculos.', 'Respiración: Respirá profundamente y de forma controlada mientras colgás.', 'Duración: Empezá con 15 segundos y progresá gradualmente. Bajá siempre de forma controlada.'] }
                ]
            },
            {
                id: 'ex-spine-mob',
                name: 'Flexibilidad Espinal',
                subtitle: 'Extensión y rotación torácica',
                image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
                muscleGroup: 'Flexibilidad',
                biomechanics: 'La columna torácica debería tener buena movilidad en rotación y extensión, mientras que la lumbar prioriza la estabilidad. La rigidez torácica es causa frecuente de dolor de hombro, cuello y espalda baja. Cat-cow y rotaciones mejoran significativamente la postura.',
                tips: [
                    'Sincroniza el movimiento con la respiración',
                    'Realiza cada repetición de forma lenta y sentida',
                    'Enfócate en la zona torácica, no la lumbar',
                    'Ideal como rutina de calentamiento diario'
                ],
                commonErrors: [
                    'Forzar la rotación desde la zona lumbar',
                    'Movimientos bruscos y descontrolados',
                    'Sostener la respiración durante el estiramiento',
                    'Ignorar la señal de dolor agudo'
                ],
                executionSteps: [
                    'Posición inicial: En cuadrupedia con manos bajo los hombros y rodillas bajo las caderas.',
                    'Flexión (gato): Exhalá y redondeá la espalda hacia el techo, metiendo la barbilla al pecho.',
                    'Extensión (vaca): Inhalá y arqueá la espalda dejando caer el abdomen, mirando al frente.',
                    'Repetición: Alterná entre gato y vaca de forma fluida, 10-15 ciclos. Luego agregá rotaciones torácicas.'
                ],
                variants: [
                    { name: 'Cat-Cow (Gato-Vaca)', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop', biomechanics: 'Alternancia entre flexión y extensión espinal en cuadrupedia. Moviliza segmento por segmento la columna, lubrica las articulaciones intervertebrales y reduce la rigidez matinal.', tips: ['Inhala en extensión, exhala en flexión', 'Mueve vértebra por vértebra', 'Realiza 10-15 ciclos como rutina matinal'], commonErrors: ['Mover solo la cabeza sin la columna', 'Ir demasiado rápido', 'No sincronizar con la respiración'], executionSteps: ['Posición inicial: En cuadrupedia con manos bajo los hombros y rodillas bajo las caderas.', 'Gato (flexión): Exhalá y redondeá la espalda vértebra por vértebra, metiendo la barbilla al pecho.', 'Vaca (extensión): Inhalá y arqueá la espalda dejando caer el abdomen, levantando la cabeza.', 'Repetición: Alterná de forma fluida entre ambas posiciones, 10-15 ciclos.'] },
                    { name: 'Rotación Torácica en Cuadrupedia', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop', biomechanics: 'Rotación activa de la columna torácica con las caderas estabilizadas. Aísla la rotación torácica de la lumbar, mejorando la movilidad para presses y movimientos deportivos.', tips: ['Mano detrás de la oreja', 'Rota mirando al techo', 'Caderas inmóviles durante la rotación'], commonErrors: ['Rotar desde la cadera', 'Forzar el rango de golpe', 'No mantener la posición cuadrúpeda estable'], executionSteps: ['Posición inicial: En cuadrupedia, colocá una mano detrás de la oreja.', 'Rotación: Rotá la columna torácica llevando el codo hacia el techo. Las caderas no se mueven.', 'Pausa: Mantené la posición máxima 2 segundos sintiendo la rotación torácica.', 'Retorno: Volvé a la posición inicial y repetí. Cambiá de lado.'] },
                    { name: 'Open Book Stretch', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop', biomechanics: 'Estiramiento de rotación torácica en posición lateral. Abre el pecho y estira pectoral, deltoides anterior y oblicuos mientras mejora la rotación torácica.', tips: ['Acuéstate de lado con rodillas flexionadas', 'Abre el brazo superior como un libro', 'Mira la mano que se abre'], commonErrors: ['Mover las rodillas durante la rotación', 'No girar la cabeza con el brazo', 'Forzar el rango sin calentar'], executionSteps: ['Posición inicial: Acostate de lado con rodillas flexionadas y apiladas. Brazos extendidos al frente.', 'Apertura: Abrí el brazo superior como un libro, rotando la columna torácica. Seguí la mano con la mirada.', 'Estiramiento: Mantené la posición abierta 5-10 segundos respirando profundamente.', 'Retorno: Volvé el brazo al frente de forma controlada. Repetí y cambiá de lado.'] }
                ]
            }
        ]
    }
];

// ─── Flat exercise list for search ───────────────────────────────────────────
const allExercisesFlat = mockExerciseLibrary.flatMap(cat =>
    cat.exercises.map(ex => ({ ...ex, category: cat.title }))
);

// ─── COMPONENTE ────────────────────────────────────────────────────────────────

interface RoutinesTabProps {
    currentUser: any;
    customRoutines: AvailableRoutine[];
    setCustomRoutines: React.Dispatch<React.SetStateAction<AvailableRoutine[]>>;
}

export function RoutinesTab({ currentUser, customRoutines, setCustomRoutines }: RoutinesTabProps) {
    const { toast } = useToast();
    const [view, setView] = useState<RoutineView>('categories');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'instructions' | 'variants'>('instructions');
    const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

    // ─── Routine creator state ───
    const [routineName, setRoutineName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<ExerciseItem[]>([]);

    // ─── Add-to-routine modal state ───
    const [addToRoutineTarget, setAddToRoutineTarget] = useState<{ name: string; image: string; tips: string[] } | null>(null);

    const selectedCategory = mockExerciseLibrary.find(c => c.id === selectedCategoryId);
    const selectedExercise = selectedCategory?.exercises.find(e => e.id === selectedExerciseId);

    const handleAddExerciseToRoutine = (routineId: string) => {
        if (!addToRoutineTarget) return;
        const target = addToRoutineTarget;
        setCustomRoutines(prev => prev.map(r => {
            if (r.id !== routineId) return r;
            return {
                ...r,
                exercises: [...r.exercises, {
                    id: `added-${Date.now()}`,
                    name: target.name,
                    image: target.image,
                    tips: target.tips,
                    sets: 4,
                    reps: '8-12',
                    rest: 90,
                }],
            };
        }));
        const routineName = customRoutines.find(r => r.id === routineId)?.name || '';
        toast({ title: '✅ Ejercicio añadido', description: `"${target.name}" añadido a ${routineName}` });
        setAddToRoutineTarget(null);
    };

    // ─── VISTA 3: DETALLE ─────────────────────────────────────────────
    if (view === 'detail' && selectedExercise && selectedCategory) {
        return (
            <div className="animate-fade-in">
                {/* Hero image */}
                <div className="relative h-60 bg-muted">
                    <img
                        src={selectedExercise.image}
                        alt={selectedExercise.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <button
                        onClick={() => { setView('list'); setSelectedExerciseId(null); setActiveDetailTab('instructions'); }}
                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded-full">
                            {selectedExercise.muscleGroup}
                        </span>
                        <h1 className="text-2xl font-bold text-foreground mt-1">{selectedExercise.name}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{selectedExercise.subtitle}</p>
                    </div>
                </div>

                <div className="p-4 space-y-5">
                    {/* Biomecánica */}
                    <div className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-foreground text-sm">Biomecánica</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedExercise.biomechanics}</p>
                    </div>

                    {/* Ejecución — Paso a Paso */}
                    {selectedExercise.executionSteps && selectedExercise.executionSteps.length > 0 && (
                        <div className="bg-card rounded-2xl border border-border p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ListOrdered className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-foreground text-sm">Ejecución</h3>
                            </div>
                            <div className="space-y-3">
                                {selectedExercise.executionSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex rounded-xl bg-muted p-1 gap-1">
                        <button
                            onClick={() => setActiveDetailTab('instructions')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeDetailTab === 'instructions'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Instrucciones
                        </button>
                        <button
                            onClick={() => setActiveDetailTab('variants')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeDetailTab === 'variants'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Variantes
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeDetailTab === 'instructions' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Tips Técnicos */}
                            <div className="bg-card rounded-2xl border border-border p-4">
                                <h4 className="font-semibold text-foreground text-sm mb-3">✅ Tips Técnicos</h4>
                                <div className="space-y-2.5">
                                    {selectedExercise.tips.map((tip, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Errores Comunes */}
                            <div className="bg-card rounded-2xl border border-border p-4">
                                <h4 className="font-semibold text-foreground text-sm mb-3">❌ Errores Comunes</h4>
                                <div className="space-y-2.5">
                                    {selectedExercise.commonErrors.map((err, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-muted-foreground leading-relaxed">{err}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeDetailTab === 'variants' && (
                        <div className="space-y-3 animate-fade-in">
                            {selectedExercise.variants.map((variant, i) => {
                                const isExpanded = expandedVariant === i;
                                return (
                                    <div key={i} className={`bg-card rounded-2xl border transition-all ${isExpanded ? 'border-primary/30 shadow-md' : 'border-border'
                                        }`}>
                                        {/* Accordion Header */}
                                        <button
                                            onClick={() => setExpandedVariant(isExpanded ? null : i)}
                                            className="w-full flex items-center gap-3 p-4 text-left"
                                        >
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                                                <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-foreground">{variant.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{variant.biomechanics.slice(0, 60)}...</p>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                                }`} />
                                        </button>

                                        {/* Accordion Content */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-4 animate-fade-in">
                                                {/* Hero image */}
                                                <div className="rounded-xl overflow-hidden h-40 bg-muted">
                                                    <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                                                </div>

                                                {/* Biomecánica */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                                                        <h5 className="font-semibold text-foreground text-xs">Biomecánica</h5>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{variant.biomechanics}</p>
                                                </div>

                                                {/* Ejecución — Paso a Paso */}
                                                {variant.executionSteps && variant.executionSteps.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <ListOrdered className="w-3.5 h-3.5 text-primary" />
                                                            <h5 className="font-semibold text-foreground text-xs">Ejecución</h5>
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            {variant.executionSteps.map((step, si) => (
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

                                                {/* Tips */}
                                                <div>
                                                    <h5 className="font-semibold text-foreground text-xs mb-2">✅ Tips Técnicos</h5>
                                                    <div className="space-y-2">
                                                        {variant.tips.map((tip, ti) => (
                                                            <div key={ti} className="flex items-start gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Errores */}
                                                <div>
                                                    <h5 className="font-semibold text-foreground text-xs mb-2">❌ Errores Comunes</h5>
                                                    <div className="space-y-2">
                                                        {variant.commonErrors.map((err, ei) => (
                                                            <div key={ei} className="flex items-start gap-2">
                                                                <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                                                <p className="text-sm text-muted-foreground leading-relaxed">{err}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Add to Routine button inside variant */}
                                                <button
                                                    onClick={() => setAddToRoutineTarget({ name: variant.name, image: variant.image, tips: variant.tips })}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-dashed border-primary/30 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors active:scale-[0.98]"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Agregar a Rutina
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Fixed bottom: Add to Routine */}
                <div className="sticky bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 mt-4">
                    <button
                        onClick={() => setAddToRoutineTarget({ name: selectedExercise.name, image: selectedExercise.image, tips: selectedExercise.tips })}
                        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Agregar a Rutina
                    </button>
                </div>

                {/* Add-to-Routine Modal */}
                <Dialog open={!!addToRoutineTarget} onOpenChange={(open) => !open && setAddToRoutineTarget(null)}>
                    <DialogContent className="max-w-[90vw] rounded-2xl p-0 overflow-hidden">
                        <div className="p-5 space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Añadir a...</h2>
                                <p className="text-sm text-muted-foreground truncate">
                                    {addToRoutineTarget?.name}
                                </p>
                            </div>

                            {customRoutines.length > 0 ? (
                                <div className="space-y-2">
                                    {customRoutines.map(routine => (
                                        <button
                                            key={routine.id}
                                            onClick={() => handleAddExerciseToRoutine(routine.id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left active:scale-[0.98]"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                                                {routine.emoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-foreground truncate">{routine.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{routine.exercises.length} ejercicios</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No tenés rutinas creadas aún</p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setAddToRoutineTarget(null);
                                    setView('create_routine');
                                }}
                                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary/10 border border-dashed border-primary/30 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Crear Nueva Rutina
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ─── VISTA 2: LISTADO DE EJERCICIOS ────────────────────────────────
    if (view === 'list' && selectedCategory) {
        // Agrupar por muscleGroup
        const grouped: Record<string, ExerciseItem[]> = {};
        selectedCategory.exercises.forEach(ex => {
            if (!grouped[ex.muscleGroup]) grouped[ex.muscleGroup] = [];
            grouped[ex.muscleGroup].push(ex);
        });

        return (
            <div className="p-4 space-y-5 animate-fade-in">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setView('categories'); setSelectedCategoryId(null); }}
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{selectedCategory.title}</h1>
                        <p className="text-sm text-muted-foreground">{selectedCategory.subtitle}</p>
                    </div>
                </div>

                {Object.entries(grouped).map(([group, exercises]) => (
                    <div key={group}>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {group}
                        </h3>
                        <div className="space-y-2">
                            {exercises.map(exercise => (
                                <button
                                    key={exercise.id}
                                    onClick={() => { setSelectedExerciseId(exercise.id); setView('detail'); }}
                                    className="w-full bg-card rounded-2xl border border-border p-3 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                                        <img
                                            src={exercise.image}
                                            alt={exercise.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-foreground text-sm">{exercise.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{exercise.subtitle}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ─── VISTA: CREAR RUTINA ──────────────────────────────────────────
    if (view === 'create_routine') {
        const filteredExercises = searchQuery.trim()
            ? allExercisesFlat.filter(ex =>
                ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : allExercisesFlat;

        const isAlreadySelected = (id: string) => selectedExercises.some(e => e.id === id);

        const handleSaveRoutine = () => {
            if (!routineName.trim() || selectedExercises.length === 0) return;
            const newRoutine: AvailableRoutine = {
                id: `custom-${Date.now()}`,
                name: routineName.trim(),
                shortName: routineName.trim().length > 12 ? routineName.trim().slice(0, 12) + '…' : routineName.trim(),
                emoji: '📝',
                exercises: selectedExercises.map((ex, idx) => ({
                    id: `cr-${Date.now()}-${idx}`,
                    name: ex.name,
                    image: ex.image,
                    tips: ex.tips,
                    sets: 4,
                    reps: '8-12',
                    rest: 90,
                })),
            };
            setCustomRoutines(prev => [...prev, newRoutine]);
            toast({ title: '✅ Rutina creada', description: `"${routineName.trim()}" con ${selectedExercises.length} ejercicios` });
            // Reset
            setRoutineName('');
            setSearchQuery('');
            setSelectedExercises([]);
            setView('categories');
        };

        const handleCancel = () => {
            setRoutineName('');
            setSearchQuery('');
            setSelectedExercises([]);
            setView('categories');
        };

        return (
            <div className="flex flex-col min-h-screen animate-fade-in">
                {/* Header */}
                <div className="p-4 pb-0">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={handleCancel}
                            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                        >
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Crear Rutina</h1>
                            <p className="text-xs text-muted-foreground">Armá tu rutina personalizada</p>
                        </div>
                    </div>

                    {/* Routine Name */}
                    <input
                        type="text"
                        value={routineName}
                        onChange={e => setRoutineName(e.target.value)}
                        placeholder="Nombre de la rutina..."
                        className="w-full h-12 rounded-xl border border-border bg-card px-4 text-foreground font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                    />

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar ejercicios..."
                            className="w-full h-11 rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Selected exercises badge strip */}
                {selectedExercises.length > 0 && (
                    <div className="px-4 pb-3">
                        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                            Seleccionados ({selectedExercises.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedExercises.map((ex, idx) => (
                                <button
                                    key={ex.id}
                                    onClick={() => setSelectedExercises(prev => prev.filter(e => e.id !== ex.id))}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                                >
                                    <span>{idx + 1}.</span>
                                    <span className="max-w-[120px] truncate">{ex.name}</span>
                                    <X className="w-3 h-3" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Exercise results */}
                <div className="flex-1 overflow-y-auto px-4 pb-32">
                    <div className="space-y-2">
                        {filteredExercises.map(ex => {
                            const selected = isAlreadySelected(ex.id);
                            return (
                                <button
                                    key={ex.id}
                                    onClick={() => {
                                        if (selected) {
                                            setSelectedExercises(prev => prev.filter(e => e.id !== ex.id));
                                        } else {
                                            setSelectedExercises(prev => [...prev, ex]);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selected
                                        ? 'bg-primary/5 border-primary/30 shadow-sm'
                                        : 'bg-card border-border hover:border-primary/20'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                                        <img src={ex.image} alt={ex.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{ex.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{ex.muscleGroup} · {ex.category}</p>
                                    </div>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${selected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border-2 border-muted-foreground/30'
                                        }`}>
                                        {selected && (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                        {filteredExercises.length === 0 && (
                            <div className="text-center py-12">
                                <Dumbbell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No se encontraron ejercicios</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/95 backdrop-blur-lg border-t border-border p-4 z-40 flex gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 h-12 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveRoutine}
                        disabled={!routineName.trim() || selectedExercises.length === 0}
                        className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Completar ({selectedExercises.length})
                    </button>
                </div>
            </div>
        );
    }

    // ─── VISTA 1: CATEGORÍAS (DEFAULT) ──────────────────────────────────────
    return (
        <div className="p-4 space-y-5 animate-fade-in">
            <div className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Ejercicios</h1>
            </div>
            <p className="text-muted-foreground text-sm">Explorá la enciclopedia de ejercicios por categoría</p>

            {/* Create Routine Button */}
            <button
                onClick={() => setView('create_routine')}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/20 hover:border-primary/50 transition-all active:scale-[0.98]"
            >
                <Plus className="w-5 h-5" />
                CREAR RUTINA
            </button>

            {/* Custom Routines */}
            {customRoutines.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mis Rutinas</h3>
                    <div className="space-y-2">
                        {customRoutines.map(routine => (
                            <div
                                key={routine.id}
                                className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                                    {routine.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">{routine.name}</p>
                                    <p className="text-xs text-muted-foreground">{routine.exercises.length} ejercicios</p>
                                </div>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">CUSTOM</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {mockExerciseLibrary.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { setSelectedCategoryId(cat.id); setView('list'); }}
                        className="flex flex-col h-[320px] w-full rounded-3xl overflow-hidden group border border-border shadow-soft bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {/* Image Section - 70% */}
                        <div className="relative h-[70%] w-full bg-gradient-to-b from-muted to-background overflow-hidden">
                            <img
                                src={cat.image}
                                alt={cat.title}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Text Section - 30% */}
                        <div className="h-[30%] w-full flex flex-col items-center justify-center gap-1 p-3 bg-gradient-to-t from-primary/10 to-card">
                            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide leading-tight text-center">
                                {cat.title}
                            </h2>
                            <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
