
import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { AnimalType, Pet, PotentialMatch } from "../types";
import { petColors, dogBreeds, catBreeds } from "../data/breeds";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert URL to Base64 for Gemini
async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64Content = base64data.split(',')[1];
            resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function analyzePetImage(imageUrl: string): Promise<{
    animalType: AnimalType;
    breed: string;
    colors: string[];
    description?: string;
}> {
    try {
        const base64Image = await urlToBase64(imageUrl);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg', // Assuming JPEG/PNG, Gemini handles standard image types
                        data: base64Image
                    }
                },
                {
                    text: `Analyze this image of a pet and extract the following details in JSON format:
                    1. animalType: Must be one of "Perro", "Gato", or "Otro".
                    2. breed: The most likely breed.
                    3. colors: An array of up to 3 colors that best match the pet from this specific list: ${petColors.join(', ')}.
                    4. description: A very short visual description (max 20 words) in Spanish.`
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        animalType: { type: Type.STRING, enum: ["Perro", "Gato", "Otro"] },
                        breed: { type: Type.STRING },
                        colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        description: { type: Type.STRING }
                    },
                    required: ["animalType", "breed", "colors"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        
        return {
            animalType: result.animalType as AnimalType,
            breed: result.breed || "Mestizo",
            colors: result.colors || [],
            description: result.description
        };

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        throw new Error("No se pudo analizar la imagen. Por favor, completa los datos manualmente.");
    }
}

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

        return response.text?.trim() || `${animalType} de raza ${breed} y color ${color}.`;
    } catch (error) {
        console.error("Error generating description with Gemini:", error);
        // Fallback description if AI fails
        return `${animalType} de raza ${breed} y color ${color}.`;
    }
}
