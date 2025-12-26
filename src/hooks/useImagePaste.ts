import { useEffect, useRef } from 'react';

interface UseImagePasteOptions {
    enabled: boolean;
    onImagePaste: (file: File) => Promise<void> | void;
    maxImages?: number;
    currentImageCount?: number;
    onError?: (error: string) => void;
}

/**
 * Custom hook that handles pasting images from clipboard.
 * Listens for paste events and converts clipboard images to File objects.
 * 
 * @param options - Configuration options for the hook
 * @param options.enabled - Whether the paste listener should be active
 * @param options.onImagePaste - Callback function called when an image is pasted
 * @param options.maxImages - Maximum number of images allowed (optional)
 * @param options.currentImageCount - Current number of images (optional)
 * @param options.onError - Callback function for error handling (optional)
 */
export const useImagePaste = (options: UseImagePasteOptions): void => {
    const { enabled, onImagePaste, maxImages, currentImageCount = 0, onError } = options;
    const callbackRef = useRef(onImagePaste);
    const errorCallbackRef = useRef(onError);

    // Keep callbacks up to date
    useEffect(() => {
        callbackRef.current = onImagePaste;
        errorCallbackRef.current = onError;
    }, [onImagePaste, onError]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handlePaste = async (e: ClipboardEvent): Promise<void> => {
            // Don't interfere with paste in input/textarea elements
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                // Only intercept if it's not a text input (check type)
                const inputElement = target as HTMLInputElement;
                if (inputElement.type === 'text' || inputElement.type === 'email' || inputElement.type === 'password' || !inputElement.type) {
                    return;
                }
            }

            try {
                const clipboardData = e.clipboardData;
                if (!clipboardData) {
                    return;
                }

                const items = Array.from(clipboardData.items);
                const imageItems = items.filter(item => item.type.startsWith('image/'));

                if (imageItems.length === 0) {
                    return;
                }

                // Check max images limit if specified
                if (maxImages !== undefined && currentImageCount >= maxImages) {
                    const errorMsg = `Puedes subir un máximo de ${maxImages} fotos.`;
                    if (errorCallbackRef.current) {
                        errorCallbackRef.current(errorMsg);
                    }
                    e.preventDefault();
                    return;
                }

                // Process the first image item
                const imageItem = imageItems[0];
                const file = imageItem.getAsFile();
                
                if (!file) {
                    return;
                }

                // Validate file type
                const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!supportedTypes.includes(file.type)) {
                    const errorMsg = 'Formato de archivo no soportado. Por favor, usa JPEG, PNG, o WEBP.';
                    if (errorCallbackRef.current) {
                        errorCallbackRef.current(errorMsg);
                    }
                    e.preventDefault();
                    return;
                }

                // Ensure it's a File object (getAsFile might return a Blob)
                let fileObj: File;
                if (file instanceof File) {
                    fileObj = file;
                } else {
                    // Convert Blob to File
                    const timestamp = Date.now();
                    const extension = file.type === 'image/png' ? 'png' : 
                                     file.type === 'image/webp' ? 'webp' : 'jpg';
                    const fileName = `pasted-image-${timestamp}.${extension}`;
                    fileObj = new File([file], fileName, { type: file.type });
                }

                // Check max images limit again after validation
                if (maxImages !== undefined && currentImageCount >= maxImages) {
                    const errorMsg = `Puedes subir un máximo de ${maxImages} fotos.`;
                    if (errorCallbackRef.current) {
                        errorCallbackRef.current(errorMsg);
                    }
                    e.preventDefault();
                    return;
                }

                // Prevent default paste behavior since we're handling the image
                e.preventDefault();

                // Call the callback
                await callbackRef.current(fileObj);
            } catch (error) {
                console.error('Error handling paste event:', error);
                if (errorCallbackRef.current) {
                    errorCallbackRef.current('Error al procesar la imagen del portapapeles.');
                }
            }
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [enabled, maxImages, currentImageCount]);
};

