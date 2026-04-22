import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!API_KEY) {
    console.warn('⚠️ VITE_GEMINI_API_KEY no está configurada en .env.local');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiNutritionResult {
    items: {
        name: string;
        quantity: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    }[];
    totalCalories: number;
    mealName: string;
}

/**
 * Analiza una imagen de comida usando Gemini Vision y devuelve
 * los datos nutricionales estimados. La imagen NO se almacena,
 * solo se envía a la API para análisis en tiempo real.
 */
export async function analyzeFood(imageBase64: string, mimeType: string): Promise<GeminiNutritionResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analiza esta imagen de comida y devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin backticks, sin texto adicional) con la siguiente estructura exacta:

{
  "mealName": "nombre descriptivo de la comida (ej: Almuerzo, Desayuno, etc.)",
  "items": [
    {
      "name": "nombre del alimento",
      "quantity": "cantidad estimada (ej: 150g, 1 unidad, 1 taza)",
      "calories": número_entero,
      "protein": número_entero_en_gramos,
      "carbs": número_entero_en_gramos,
      "fats": número_entero_en_gramos
    }
  ],
  "totalCalories": suma_total_de_calorías
}

Reglas:
- Identifica TODOS los alimentos visibles en la imagen
- Estima las porciones basándote en el tamaño visual
- Si no puedes identificar la comida, devuelve un JSON con items vacío y totalCalories en 0
- Los valores nutricionales deben ser números enteros
- El mealName debe ser en español
- Todos los nombres de alimentos deben ser en español`;

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Limpiar posible markdown wrapping
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    try {
        const parsed = JSON.parse(cleanText) as GeminiNutritionResult;

        // Validar estructura mínima
        if (!parsed.items || !Array.isArray(parsed.items)) {
            return { items: [], totalCalories: 0, mealName: 'Comida' };
        }

        // Asegurar que todos los campos numéricos sean números
        parsed.items = parsed.items.map(item => ({
            name: item.name || 'Alimento',
            quantity: item.quantity || '1 porción',
            calories: Math.round(Number(item.calories) || 0),
            protein: Math.round(Number(item.protein) || 0),
            carbs: Math.round(Number(item.carbs) || 0),
            fats: Math.round(Number(item.fats) || 0),
        }));

        parsed.totalCalories = parsed.items.reduce((sum, item) => sum + item.calories, 0);
        parsed.mealName = parsed.mealName || 'Comida';

        return parsed;
    } catch (e) {
        console.error('Error parsing Gemini response:', text, e);
        throw new Error('No se pudo interpretar la respuesta de la IA. Intenta nuevamente.');
    }
}
