import { supabase } from '../services/supabaseClient';
import { STORAGE_BUCKET } from '../config';

// Helper to convert Base64 to Blob directly (skipping fetch/network)
const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
    // Strip the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mimeType });
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

/**
 * Ensures an image URL is a valid public URL.
 * If the URL is already a full URL (starts with http/https), returns it as-is.
 * If it's a path, converts it to a public URL using Supabase storage.
 * @param url - The image URL or path from the database
 * @returns A valid public URL
 */
export const ensurePublicImageUrl = (url: string): string => {
    if (!url || typeof url !== 'string') {
        return '';
    }

    // If it's already a full URL (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it's a path, convert it to a public URL
    // Remove leading slash if present
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(cleanPath);

    return data.publicUrl;
};

/**
 * Ensures an array of image URLs are all valid public URLs.
 * @param urls - Array of image URLs or paths
 * @returns Array of valid public URLs
 */
export const ensurePublicImageUrls = (urls: string[]): string[] => {
    if (!Array.isArray(urls)) {
        return [];
    }
    return urls.map(url => ensurePublicImageUrl(url)).filter(url => url !== '');
};

/**
 * Converts a ClipboardItem to a File object.
 * Validates that the clipboard item contains an image (JPEG, PNG, WEBP).
 * @param item - The ClipboardItem from the clipboard API
 * @returns A File object or null if the item is not a valid image
 */
export const clipboardItemToFile = async (item: ClipboardItem): Promise<File | null> => {
    try {
        // Get available types from the clipboard item
        const types = item.types;
        
        // Look for image types
        const imageTypes = types.filter(type => type.startsWith('image/'));
        if (imageTypes.length === 0) {
            return null;
        }
        
        // Get the first image type (prefer PNG, then JPEG, then others)
        const preferredTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        let selectedType = imageTypes.find(type => preferredTypes.includes(type));
        if (!selectedType) {
            selectedType = imageTypes[0];
        }
        
        // Get the blob from the clipboard item
        const blob = await item.getType(selectedType);
        if (!blob) {
            return null;
        }
        
        // Validate that it's a supported image type
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!supportedTypes.includes(blob.type)) {
            return null;
        }
        
        // Convert blob to File
        // Generate a filename with timestamp
        const timestamp = Date.now();
        const extension = blob.type === 'image/png' ? 'png' : 
                         blob.type === 'image/webp' ? 'webp' : 'jpg';
        const fileName = `pasted-image-${timestamp}.${extension}`;
        
        const file = new File([blob], fileName, { type: blob.type });
        return file;
    } catch (error) {
        console.error('Error converting clipboard item to file:', error);
        return null;
    }
};

// --- MAIN UPLOAD FUNCTION (Simplified) ---
export const uploadImage = async (file: File): Promise<string> => {
    try {
        // 1. Always compress first (Standardize size and format to JPEG)
        const base64 = await compressImage(file);
        
        // 2. Convert Base64 to Blob using direct binary conversion
        const blob = base64ToBlob(base64, 'image/jpeg');

        const fileExt = 'jpg';
        // Create a clean file path: year/month/timestamp-random.jpg
        const date = new Date();
        const path = `${date.getFullYear()}/${date.getMonth() + 1}`;
        const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        // 3. Upload to Supabase Bucket (Direct Await)
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false,
                cacheControl: '31536000'
            });

        if (error) {
            console.error("Supabase Storage Upload Error:", error);
            throw new Error("No se pudo subir la imagen a la nube.");
        }

        // 4. Get Public URL
        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;

    } catch (error: any) {
        console.error('Error uploading image:', error);
        throw error;
    }
};