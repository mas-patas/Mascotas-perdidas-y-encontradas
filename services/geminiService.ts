import { GoogleGenAI, Type } from "@google/genai";
import type { AnimalType, LocationDetails, Pet, PotentialMatch } from "../types";
import { PET_STATUS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid data URL for Gemini');
    }
    const mimeType = match[1];
    const data = match[2];
    return {
        inlineData: { data, mimeType },
    };
};

export async function findMatchingPets(
    targetPet: Omit<Pet, 'id' | 'userEmail'>,
    candidatePets: Pet[]
): Promise<PotentialMatch[]> {
    if (candidatePets.length === 0 || targetPet.imageUrls.length === 0) {
        return [];
    }

    const targetPetImagePart = fileToGenerativePart(targetPet.imageUrls[0]);

    const candidatePetsString = JSON.stringify(candidatePets.map(p => ({
        id: p.id,
        animalType: p.animalType,
        breed: p.breed,
        color: p.color,
        size: p.size,
        location: p.location,
        description: p.description,
    })));

    const prompt = `
        Eres un experto en encontrar mascotas perdidas. Tu tarea es comparar una mascota perdida (la "mascota objetivo") con una lista de mascotas encontradas o avistadas (las "mascotas candidatas"). Debes identificar las mejores coincidencias.

        Mascota Objetivo:
        - Tipo: ${targetPet.animalType}
        - Raza: ${targetPet.breed}
        - Color: ${targetPet.color}
        - Tamaño: ${targetPet.size}
        - Descripción: ${targetPet.description}
        - Ubicación donde se perdió: ${targetPet.location}
        - Imagen de la mascota objetivo está adjunta.

        Mascotas Candidatas (en formato JSON):
        ${candidatePetsString}

        Instrucciones:
        1. Analiza la imagen y los detalles de la mascota objetivo.
        2. Compara la mascota objetivo con cada una de las mascotas candidatas.
        3. Considera similitudes en tipo, raza, color, tamaño, descripción y la proximidad de la ubicación. Las similitudes visuales en la imagen son muy importantes.
        4. Calcula un "score" de coincidencia de 0 a 100 para cada candidata, donde 100 es una coincidencia perfecta.
        5. Proporciona una "explanation" breve (máximo 20 palabras en español) de por qué crees que es una coincidencia.
        6. Devuelve un array JSON con las 3 mejores coincidencias (las de mayor score). Si no hay coincidencias razonables (score > 60), devuelve un array vacío.
        7. El formato de salida debe ser un array de objetos JSON, cada uno con "id", "score", y "explanation". No incluyas nada más en tu respuesta.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    targetPetImagePart,
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            score: { type: Type.NUMBER },
                            explanation: { type: Type.STRING }
                        },
                        required: ['id', 'score', 'explanation']
                    }
                }
            }
        });
        
        const results: { id: string; score: number; explanation: string }[] = JSON.parse(response.text);
        
        const matches: PotentialMatch[] = results
            .map(result => {
                const pet = candidatePets.find(p => p.id === result.id);
                if (pet) {
                    return {
                        pet,
                        score: result.score,
                        explanation: result.explanation
                    };
                }
                return null;
            })
            .filter((match): match is PotentialMatch => match !== null)
            .sort((a, b) => b.score - a.score);

        return matches;

    } catch (error) {
        console.error("Error finding matching pets with Gemini:", error);
        return [];
    }
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
        throw new Error("Failed to generate pet description.");
    }
}
