
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
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
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
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (err) => reject(new Error("Error al cargar la imagen para compresión."));
        };
        reader.onerror = (err) => reject(new Error("Error al leer el archivo."));
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
        
        // Check session (optional depending on RLS, but good practice)
        const { data: { session } } = await supabase.auth.getSession();
        
        // 4. Attempt Upload to Supabase with a timeout race
        const uploadPromise = supabase.storage
            .from(bucket)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        const { error: uploadError } = await Promise.race([
            uploadPromise,
            // Allow 15 seconds for network upload, else timeout
            timeoutPromise(15000, "La subida a la nube tardó demasiado.") as any 
        ]);

        if (uploadError) {
            console.warn("Supabase Storage Error (falling back to Base64):", uploadError.message);
            // FALLBACK: If bucket doesn't exist or fails, return the Base64 string directly.
            // This allows the app to function even without Storage setup (storing image in DB text field).
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
