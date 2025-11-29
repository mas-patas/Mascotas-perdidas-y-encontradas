
import { supabase } from '../services/supabaseClient';
import { STORAGE_BUCKET } from '../config';

// Helper to prevent indefinite hanging
const timeoutPromise = (ms: number, errorMessage: string) => {
    return new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), ms);
    });
};

export const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            if (!event.target?.result) {
                reject(new Error("Failed to read file data"));
                return;
            }
            const img = new Image();
            img.src = event.target.result as string;
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions while maintaining aspect ratio
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    // Draw white background for transparent PNGs
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);

                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 string with compression (image/jpeg)
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } catch (e) {
                    console.error("Compression logic error", e);
                    reject(new Error("Error procesando la imagen."));
                }
            };
            
            img.onerror = () => reject(new Error("Error al cargar la imagen."));
        };
        
        reader.onerror = () => reject(new Error("Error al leer el archivo."));
        
        try {
            reader.readAsDataURL(file);
        } catch (e) {
            reject(e);
        }
    });
};

// --- SUPABASE STORAGE UPLOAD LOGIC ---
const uploadToSupabase = async (base64: string, bucket: string): Promise<string> => {
    // 1. Convert Base64 back to Blob for upload
    const res = await fetch(base64);
    const blob = await res.blob();

    const fileExt = 'jpg';
    // Create a clean file path: year/month/timestamp-random.jpg
    const date = new Date();
    const path = `${date.getFullYear()}/${date.getMonth() + 1}`;
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    
    // 2. Upload to Supabase Bucket
    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false,
            cacheControl: '31536000' // 1 year cache
        });

    if (error) {
        console.error("Supabase Storage Upload Error:", error);
        throw new Error("No se pudo subir la imagen a la nube. Verifica tu conexión.");
    }

    // 3. Get Public URL
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return data.publicUrl;
};

// --- MAIN UPLOAD FUNCTION ---
export const uploadImage = async (file: File): Promise<string> => {
    try {
        // 1. Always compress first (Standardize size and format to JPEG)
        const base64 = await compressImage(file);
        
        // 2. Upload to Supabase with timeout
        // Removed fallback: We want to force cloud storage to keep DB clean.
        return await Promise.race([
            uploadToSupabase(base64, STORAGE_BUCKET),
            timeoutPromise(25000, "La subida a la nube tardó demasiado.") as any 
        ]);

    } catch (error: any) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
