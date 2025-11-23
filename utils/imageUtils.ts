
import { supabase } from '../services/supabaseClient';

// Helper to prevent indefinite hanging
const timeoutPromise = (ms: number, errorMessage: string) => {
    return new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), ms);
    });
};

export const compressImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.6): Promise<string> => {
    const compressionLogic = new Promise<string>((resolve, reject) => {
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

                    // Draw white background for transparent PNGs to avoid black backgrounds in JPEG
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);

                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 string with compression (image/jpeg)
                    // Some browsers might throw if canvas is tainted, though unlikely with local file
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } catch (e) {
                    console.error("Compression logic error", e);
                    // Fallback: resolve with original if canvas fails, or reject if severe
                    reject(new Error("Error procesando la imagen. Intente con otra."));
                }
            };
            
            img.onerror = () => reject(new Error("Error al cargar la imagen para compresión."));
        };
        
        reader.onerror = () => reject(new Error("Error al leer el archivo."));
        
        try {
            reader.readAsDataURL(file);
        } catch (e) {
            reject(e);
        }
    });

    // Race between compression and a 10-second timeout
    return Promise.race([
        compressionLogic,
        timeoutPromise(10000, "Tiempo de espera agotado al procesar la imagen.")
    ]);
};

export const uploadImage = async (file: File, bucket: string = 'pet-images'): Promise<string> => {
    let base64 = '';
    
    try {
        // 1. Compress image first
        base64 = await compressImage(file);
        
        // 2. Convert Base64 to Blob for upload
        const res = await fetch(base64);
        const blob = await res.blob();

        // 3. Generate unique filename (sanitize to safe chars)
        const fileExt = 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // 4. Attempt Upload to Supabase with a timeout race
        const uploadPromise = supabase.storage
            .from(bucket)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        const result = await Promise.race([
            uploadPromise,
            // Allow 20 seconds for network upload, else timeout
            timeoutPromise(20000, "La subida a la nube tardó demasiado.") as any 
        ]);

        // Check if result is valid and contains error (it might be undefined if timeout wins/throws)
        if (result && result.error) {
            console.warn("Supabase Storage Error (falling back to Base64):", result.error.message);
            // FALLBACK: If bucket doesn't exist or fails, return the Base64 string directly.
            return base64; 
        }

        // 5. Get Public URL
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return data.publicUrl;

    } catch (error) {
        console.error('Error uploading image wrapper:', error);
        // Final Fallback: If anything critical fails but we have the base64, return it so user isn't blocked.
        if (base64) return base64;
        throw error;
    }
};
