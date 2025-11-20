
import { GoogleGenAI } from "@google/genai";
import type { AnimalType, Pet, PotentialMatch } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Función simplificada: Ya no realiza reconocimiento de imágenes.
// Devuelve un array vacío para que el flujo de la app continúe directamente a publicar.
export async function findMatchingPets(
    targetPet: Omit<Pet, 'id' | 'userEmail'>,
    candidatePets: Pet[]
): Promise<PotentialMatch[]> {
    return [];
}

export async function generatePetDescription(
    animalType: AnimalType,
    breed: string,
    color: string
): Promise<string> {
    const prompt = `Genera una descripción breve y amigable para un anuncio de mascota perdida o encontrada. La descripción debe ser en español.
    
    Detalles de la mascota:
    - Tipo: ${animalType}
    - Raza: ${breed}
    - Color: ${color}
    
    Incluye estas características de forma clara en la descripción. No incluyas información de contacto ni ubicación. Mantén la descripción por debajo de 50 palabras.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating description with Gemini:", error);
        // Fallback description if AI fails
        return `${animalType} de raza ${breed} y color ${color}.`;
    }
}
