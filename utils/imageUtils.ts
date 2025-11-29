
import { supabase } from '../services/supabaseClient';
import { STORAGE_PROVIDER, AWS_CONFIG } from '../config';

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
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } catch (e) {
                    console.error("Compression logic error", e);
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

    return Promise.race([
        compressionLogic,
        timeoutPromise(10000, "Tiempo de espera agotado al procesar la imagen.")
    ]);
};

// --- AWS S3 UPLOAD LOGIC ---
const uploadToS3 = async (file: File, base64: string): Promise<string> => {
    if (!AWS_CONFIG.SIGNING_ENDPOINT) {
        throw new Error("AWS Signing Endpoint no configurado en config.ts");
    }

    // 1. Convert Base64 back to Blob for upload
    const res = await fetch(base64);
    const blob = await res.blob();
    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // 2. Request Pre-signed URL from Backend
    // Your backend should return: { uploadUrl: "https://s3...", publicUrl: "https://s3.../file.jpg" }
    const signResponse = await fetch(AWS_CONFIG.SIGNING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType: 'image/jpeg' })
    });

    if (!signResponse.ok) {
        throw new Error("Error obteniendo permiso de subida a S3");
    }

    const { uploadUrl, publicUrl } = await signResponse.json();

    // 3. Upload directly to S3 using the signed URL
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
            'Content-Type': 'image/jpeg'
        }
    });

    if (!uploadResponse.ok) {
        throw new Error("Error subiendo imagen a AWS S3");
    }

    return publicUrl;
};

// --- SUPABASE STORAGE UPLOAD LOGIC ---
const uploadToSupabase = async (file: File, base64: string, bucket: string): Promise<string> => {
    // Convert Base64 to Blob
    const res = await fetch(base64);
    const blob = await res.blob();

    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
        });

    if (error) {
        console.warn("Supabase Storage Error:", error.message);
        // Fallback to base64 if storage fails (temporary fix for development)
        return base64; 
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return data.publicUrl;
};

// --- MAIN UPLOAD FUNCTION ---
export const uploadImage = async (file: File, bucket: string = 'pet-images'): Promise<string> => {
    let base64 = '';
    
    try {
        // 1. Always compress first (Standard for performance)
        base64 = await compressImage(file);
        
        // 2. Route to configured provider
        if ((STORAGE_PROVIDER as string) === 'aws') {
            return await uploadToS3(file, base64);
        } else {
            // Default to Supabase
            return await Promise.race([
                uploadToSupabase(file, base64, bucket),
                timeoutPromise(20000, "La subida a la nube tardó demasiado.") as any 
            ]);
        }

    } catch (error: any) {
        console.error('Error uploading image wrapper:', error);
        // Critical Fallback: If cloud upload fails, return the compressed Base64 
        // so the user can still submit the form (image will be stored in DB text field, not ideal but works)
        if (base64) return base64;
        throw error;
    }
};
