
import { supabase } from '../services/supabaseClient';

export const compressImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
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
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const uploadImage = async (file: File, bucket: string = 'pet-images'): Promise<string> => {
    try {
        // 1. Compress image first
        const base64 = await compressImage(file);
        
        // 2. Convert Base64 to Blob
        const res = await fetch(base64);
        const blob = await res.blob();

        // 3. Generate unique filename (sanitize to safe chars)
        const fileExt = 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Ensure user is authenticated before upload (though RLS handles the check)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error("Debes iniciar sesión para subir imágenes.");
        }

        // 4. Upload to Supabase
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) {
            if (uploadError.message.includes('row-level security policy')) {
                console.error("ERROR DE PERMISOS: Debes configurar las Policies en Supabase Storage para el bucket 'pet-images'. Revisa la consola para ver el script SQL necesario.");
            }
            throw uploadError;
        }

        // 5. Get Public URL
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
