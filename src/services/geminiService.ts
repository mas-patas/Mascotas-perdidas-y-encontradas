import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import type { AnimalType, Pet, PotentialMatch } from "../types";
import { petColors, dogBreeds, catBreeds } from "../data/breeds";
import { supabase } from "./supabaseClient";
import { PET_STATUS } from "../constants";

// Lazy initialization helper
// This prevents the app from crashing on startup if the API_KEY is missing.
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("Gemini API Key is missing. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

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
        const ai = getAiClient();
        if (!ai) throw new Error("API Key no configurada.");

        const base64Image = await urlToBase64(imageUrl);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: "user",
                    parts: [
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
                    ]
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

export async function generatePetEmbedding(text: string): Promise<number[]> {
    try {
        const ai = getAiClient();
        if (!ai) return [];

        // Use 'contents' array to satisfy API requirements for this model/SDK version
        const result: any = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: [{ parts: [{ text }] }]
        });
        
        let values: number[] | undefined;

        // Handle response: Check for plural 'embeddings' first (batch/list response), then singular 'embedding'
        if (result.embeddings && result.embeddings.length > 0 && result.embeddings[0].values) {
            values = result.embeddings[0].values;
        } else if (result.embedding && result.embedding.values) {
            values = result.embedding.values;
        }
        
        if (values) {
            // CRITICAL FIX: Explicitly convert to plain array to ensure compatibility with Supabase RPC
            // Some SDK versions return Float32Array which fails in JSON serialization for Postgres vector
            return Array.from(values);
        }
        
        console.error("Unexpected embedding response:", JSON.stringify(result));
        throw new Error("Failed to generate embedding");
    } catch (error) {
        console.error("Error generating embedding:", error);
        return [];
    }
}

// Performs Vector Search using Supabase RPC
export async function findMatchingPets(
    targetPet: Omit<Pet, 'id' | 'userEmail'>
): Promise<PotentialMatch[]> {
    
    // 1. Construct a rich description for the embedding
    const contentToEmbed = `${targetPet.animalType} ${targetPet.breed} ${targetPet.color} ${targetPet.description}`;
    
    // 2. Generate Vector
    const embedding = await generatePetEmbedding(contentToEmbed);
    
    if (embedding.length === 0) return [];

    // 3. Determine target status to match against
    // If I lost a pet, I look for 'Found' or 'Sighted' pets.
    // If I found a pet, I look for 'Lost' pets.
    let targetStatus: string[] = [];
    if (targetPet.status === PET_STATUS.PERDIDO) {
        targetStatus = [PET_STATUS.ENCONTRADO, PET_STATUS.AVISTADO];
    } else if (targetPet.status === PET_STATUS.ENCONTRADO || targetPet.status === PET_STATUS.AVISTADO) {
        targetStatus = [PET_STATUS.PERDIDO];
    } else {
        return []; // No matching logic for Adoptions/Reunited here
    }

    const matches: PotentialMatch[] = [];

    // 4. Call Supabase RPC for each status target
    for (const status of targetStatus) {
        const { data: rpcData, error } = await supabase.rpc('match_pets', {
            query_embedding: embedding,
            match_threshold: 0.70, // Similarity threshold (0-1)
            match_count: 5,
            filter_status: status,
            filter_type: targetPet.animalType
        });

        if (error) {
            // Improved error logging to see the real message
            console.error("Vector search RPC error:", JSON.stringify(error, null, 2));
            continue;
        }

        if (rpcData) {
            rpcData.forEach((p: any) => {
                // Convert RPC result to basic Pet structure for the modal
                const matchedPet: Pet = {
                    id: p.id,
                    userEmail: 'hidden', // We don't need this for the preview
                    status: p.status as any,
                    name: p.name,
                    animalType: targetPet.animalType,
                    breed: 'Ver detalles', // Simplified for preview list
                    color: '',
                    location: '',
                    date: new Date().toISOString(),
                    contact: '',
                    description: p.description,
                    imageUrls: p.image_urls || [],
                    comments: []
                };

                matches.push({
                    pet: matchedPet,
                    score: Math.round(p.similarity * 100),
                    explanation: `Esta mascota tiene un ${Math.round(p.similarity * 100)}% de similitud visual y descriptiva.`
                });
            });
        }
    }

    // Sort by highest score
    return matches.sort((a, b) => b.score - a.score);
}

export async function generatePetDescription(
    animalType: AnimalType,
    breed: string,
    color: string
): Promise<string> {
    try {
        const ai = getAiClient();
        if (!ai) return `${animalType} de raza ${breed} y color ${color}.`;

        const prompt = `Genera una descripción breve y amigable para un anuncio de mascota perdida o encontrada. La descripción debe ser en español.
        
        Detalles de la mascota:
        - Tipo: ${animalType}
        - Raza: ${breed}
        - Color: ${color}
        
        Incluye estas características de forma clara en la descripción. No incluyas información de contacto ni ubicación. Mantén la descripción por debajo de 50 palabras.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
        });

        return response.text?.trim() || `${animalType} de raza ${breed} y color ${color}.`;
    } catch (error) {
        console.error("Error generating description with Gemini:", error);
        // Fallback description if AI fails
        return `${animalType} de raza ${breed} y color ${color}.`;
    }
}
