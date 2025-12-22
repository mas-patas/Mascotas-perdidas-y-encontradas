
import React, { useState } from 'react';
import type { Pet } from '@/types';
import { LocationMarkerIcon, CalendarIcon, PrinterIcon, PhoneIcon, DogIcon, DownloadIcon } from './icons';
import { toJpeg } from 'html-to-image';

interface FlyerModalProps {
    pet: Pet;
    onClose: () => void;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({ pet, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const exportRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = async () => {
        const element = exportRef.current;
        if (!element) {
            alert('Error: No se pudo encontrar el elemento para exportar.');
            return;
        }

        setIsGenerating(true);
        try {
            // Guardar estilos originales
            const originalStyles = {
                position: element.style.position,
                left: element.style.left,
                top: element.style.top,
                visibility: element.style.visibility,
                opacity: element.style.opacity,
                zIndex: element.style.zIndex,
                display: element.style.display
            };

            // Mover el elemento a una posición visible para html-to-image
            // Usar z-index muy bajo para que quede detrás de todo
            element.style.position = 'fixed';
            element.style.left = '0px';
            element.style.top = '0px';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.zIndex = '-9999';
            element.style.display = 'flex';
            element.style.pointerEvents = 'none';
            element.style.width = '800px';
            element.style.height = '1067px';

            // Forzar un reflow para asegurar que el navegador renderice el elemento
            void element.offsetHeight;

            // Esperar a que todas las imágenes se carguen completamente
            const images = element.querySelectorAll('img');
            const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
                if (img.complete && img.naturalHeight !== 0) {
                    return Promise.resolve();
                }
                return new Promise<void>((resolve) => {
                    const timeout = setTimeout(() => resolve(), 3000); // Timeout de 3 segundos
                    img.onload = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                    img.onerror = () => {
                        clearTimeout(timeout);
                        resolve(); // Continuar incluso si hay error
                    };
                });
            });

            await Promise.all(imagePromises);
            
            // Delay adicional para asegurar que el DOM se actualice completamente
            await new Promise(resolve => setTimeout(resolve, 500));

            // Silenciar temporalmente los errores de consola relacionados con CSS cross-origin
            // Estos errores son normales cuando html-to-image intenta leer estilos de CDNs externos
            // (Google Fonts, Tailwind CDN, Leaflet, etc.) y el navegador bloquea el acceso por CORS
            const originalError = console.error;
            const originalWarn = console.warn;
            const errorFilter = (...args: any[]) => {
                const message = args[0]?.toString() || '';
                // Filtrar errores de CSS cross-origin que son normales y no afectan la funcionalidad
                if (message.includes('cssRules') || 
                    message.includes('CSSStyleSheet') || 
                    message.includes('SecurityError') ||
                    message.includes('Error inlining remote css') ||
                    message.includes('Error while reading CSS rules') ||
                    message.includes('Manifest:')) {
                    return; // No mostrar estos errores - son esperados y no afectan la generación
                }
                originalError.apply(console, args);
            };
            console.error = errorFilter;
            console.warn = errorFilter;

            try {
                // Crear un overlay temporal para ocultar el elemento durante la captura
                const overlay = document.createElement('div');
                overlay.id = 'image-generation-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 9998;
                    pointer-events: none;
                `;
                document.body.appendChild(overlay);

                try {
                    // Convertir a JPEG con alta calidad
                    const dataUrl = await toJpeg(element, {
                        quality: 0.95,
                        backgroundColor: '#ffffff',
                        pixelRatio: 2,
                        useCORS: true,
                        allowTaint: false,
                        cacheBust: true,
                        imagePlaceholder: undefined,
                        filter: (node) => {
                            // Ignorar el overlay y otros elementos no deseados
                            if (node instanceof HTMLElement) {
                                return node.id !== 'image-generation-overlay';
                            }
                            return true;
                        }
                    });

                    // Crear y descargar el archivo
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `SE_BUSCA_${pet.name.toUpperCase()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } finally {
                    // Remover el overlay
                    const overlayElement = document.getElementById('image-generation-overlay');
                    if (overlayElement && overlayElement.parentNode) {
                        document.body.removeChild(overlayElement);
                    }
                }
            } finally {
                // Restaurar console.error y console.warn
                console.error = originalError;
                console.warn = originalWarn;
                
                // Restaurar estilos originales - siempre ejecutar, incluso si hay errores
                element.style.position = originalStyles.position || '';
                element.style.left = originalStyles.left || '';
                element.style.top = originalStyles.top || '';
                element.style.visibility = originalStyles.visibility || '';
                element.style.opacity = originalStyles.opacity || '';
                element.style.zIndex = originalStyles.zIndex || '';
                element.style.display = originalStyles.display || '';
                element.style.pointerEvents = '';
            }

        } catch (error) {
            console.error("Error generating image:", error);
            alert("Hubo un problema al generar la imagen. Por favor intenta de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl my-4 flex flex-col items-center">
                
                {/* --- VISIBLE PREVIEW (Responsive) --- */}
                {/* This one adapts to the screen size for the user to see */}
                <div 
                    id="flyer-preview" 
                    className="bg-white w-full mx-auto border-[8px] sm:border-[12px] border-[#EF4444] shadow-2xl overflow-hidden relative flex flex-col"
                    style={{ aspectRatio: '3 / 4' }} 
                >
                    {/* Download Button - Top Right Corner */}
                    <button 
                        onClick={handleDownloadImage} 
                        disabled={isGenerating}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 bg-brand-secondary text-brand-dark font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-lg text-xs sm:text-sm disabled:opacity-50 no-print"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse text-[10px] sm:text-xs">Generando...</span>
                        ) : (
                            <>
                                <DownloadIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Descargar</span>
                            </>
                        )}
                    </button>

                    {/* Close Button - Top Left Corner */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold text-lg sm:text-xl transition-colors shadow-lg no-print"
                    >
                        &times;
                    </button>
                    {/* Responsive Header */}
                    <div className="bg-[#EF4444] pt-3 sm:pt-6 pb-2 sm:pb-4 px-2 sm:px-4 shrink-0 relative">
                        {/* Logo en la parte superior izquierda */}
                        <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                            <img 
                                src="/assets/images/logo.png" 
                                alt="Más Patas Logo" 
                                className="h-16 w-16 sm:h-24 sm:w-24 object-contain"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        {/* Contenido centrado */}
                        <div className="text-center">
                            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-wider leading-none uppercase mb-1 drop-shadow-md">
                                SE BUSCA
                            </h1>
                            <p className="text-[10px] sm:text-xl font-bold text-white uppercase tracking-[0.15em]">
                                AYÚDAME A REGRESAR A CASA
                            </p>
                        </div>
                    </div>

                    {/* Responsive Body */}
                    <div className="p-3 sm:p-6 flex-grow flex flex-col justify-between h-full min-h-0 bg-white">
                        
                        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 shrink-0">
                            <DogIcon className="h-5 w-5 sm:h-8 sm:w-8 text-[#EF4444]" />
                            <h2 className="text-2xl sm:text-5xl font-black text-gray-900 uppercase tracking-tight text-center line-clamp-1">
                                {pet.name}
                            </h2>
                            <DogIcon className="h-5 w-5 sm:h-8 sm:w-8 text-[#EF4444] transform -scale-x-100" />
                        </div>

                        <div className="w-full flex-1 min-h-[120px] sm:min-h-[200px] mx-auto mb-2 sm:mb-6 overflow-hidden border-4 border-gray-900 rounded-sm shadow-lg bg-gray-100 relative shrink flex items-center justify-center">
                            <img 
                                src={pet.imageUrls[0]} 
                                alt={pet.name} 
                                className="w-full h-full object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4 border-t-2 border-b-2 border-gray-200 py-2 sm:py-4 shrink-0">
                            <div className="space-y-1 sm:space-y-3 border-r-2 border-gray-200 pr-2">
                                <div>
                                    <h3 className="flex items-center gap-1 text-[10px] sm:text-sm font-black text-gray-900 uppercase mb-0.5">
                                        <LocationMarkerIcon />
                                        Lugar de Extravío
                                    </h3>
                                    <p className="text-xs sm:text-lg text-gray-800 font-bold leading-tight line-clamp-2 sm:line-clamp-3">
                                        {pet.location}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-1 text-[10px] sm:text-sm font-black text-gray-900 uppercase mb-0.5">
                                        <CalendarIcon />
                                        Fecha
                                    </h3>
                                    <p className="text-xs sm:text-lg text-gray-800 font-bold">
                                        {new Date(pet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>

                            <div className="pl-1 sm:pl-2">
                                <h3 className="text-[10px] sm:text-sm font-black text-gray-900 uppercase mb-0.5 sm:mb-2">
                                    Señas Particulares
                                </h3>
                                <ul className="space-y-0.5 sm:space-y-1 text-xs sm:text-base text-gray-800">
                                    <li><span className="font-bold text-gray-900">Raza:</span> {pet.breed}</li>
                                    <li><span className="font-bold text-gray-900">Color:</span> {pet.color}</li>
                                    <li className="mt-1 italic text-[10px] sm:text-sm leading-snug text-gray-600 line-clamp-3 sm:line-clamp-4">"{pet.description}"</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-auto text-center pt-1 shrink-0">
                            <p className="text-xs sm:text-xl font-bold text-gray-600 uppercase mb-0.5 sm:mb-1">Si tienes información llama al:</p>
                            <div className="bg-white inline-block px-2 sm:px-4 rounded-lg border-2 border-gray-100 sm:border-none">
                                <div className="flex items-center justify-center gap-2 sm:gap-3 text-[#EF4444]">
                                    <PhoneIcon className="h-5 w-5 sm:h-10 sm:w-10" />
                                    <p className="text-2xl sm:text-5xl font-black tracking-tighter">
                                        {pet.contact}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 sm:gap-2 mt-1 sm:mt-4 pt-1 sm:pt-2 border-t border-dashed border-gray-300">
                                <p className="text-[8px] sm:text-xs font-bold text-gray-600">www.maspatas.com</p>
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <img src={qrCodeUrl} alt="QR" className="w-16 h-16 sm:w-20 sm:h-20 mix-blend-multiply" crossOrigin="anonymous" />
                                    <p className="text-[7px] sm:text-[9px] font-bold text-gray-400 uppercase text-center leading-tight">ESCANEA EL CODIGO QR PARA MAS INFORMACIÓN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- HIDDEN EXPORT TEMPLATE (Fixed Size & Optimized Layout) --- */}
                {/* Positioned off-screen but close enough to be safe from aggressive browser culling */}
                <div 
                    id="flyer-export" 
                    ref={exportRef}
                    className="fixed top-0 bg-white border-[16px] border-[#EF4444] flex flex-col z-[-50]"
                    style={{ width: '800px', height: '1067px', left: '-1000px' }}
                >
                    {/* Header */}
                    <div className="bg-[#EF4444] pt-6 pb-4 px-6 shrink-0 relative">
                        {/* Logo en la parte superior izquierda */}
                        <div className="absolute top-4 left-6">
                            <img 
                                src="/assets/images/logo.png" 
                                alt="Más Patas Logo" 
                                style={{ height: '120px', width: 'auto', objectFit: 'contain' }}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        {/* Contenido centrado */}
                        <div className="text-center">
                            <h1 className="text-6xl font-black text-white tracking-wider leading-none uppercase mb-2 drop-shadow-lg">
                                SE BUSCA
                            </h1>
                            <p className="text-xl font-bold text-white uppercase tracking-[0.2em]">
                                AYÚDAME A REGRESAR A CASA
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-grow flex flex-col justify-between h-full min-h-0 bg-white overflow-hidden">
                        
                        {/* Name */}
                        <div className="flex items-center justify-center gap-6 mb-2 shrink-0">
                            <DogIcon className="h-10 w-10 text-[#EF4444]" />
                            <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tight text-center line-clamp-1">
                                {pet.name}
                            </h2>
                            <DogIcon className="h-10 w-10 text-[#EF4444] transform -scale-x-100" />
                        </div>

                        {/* Photo - Reduced min-height (200px) to allow it to shrink if text is huge, preventing footer push-off */}
                        <div className="w-full flex-1 min-h-[200px] mx-auto mb-2 overflow-hidden border-4 border-gray-900 rounded-sm shadow-lg bg-gray-100 relative shrink flex items-center justify-center">
                            <img 
                                src={pet.imageUrls[0]} 
                                alt={pet.name} 
                                className="w-full h-full object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>

                        {/* Details - Reduced padding */}
                        <div className="grid grid-cols-2 gap-4 mb-2 border-t-4 border-b-4 border-gray-200 py-2 shrink-0">
                            <div className="space-y-2 border-r-4 border-gray-200 pr-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 uppercase mb-1">
                                        <LocationMarkerIcon />
                                        Lugar de Extravío
                                    </h3>
                                    <p className="text-xl text-gray-800 font-bold leading-tight line-clamp-2">
                                        {pet.location}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 uppercase mb-1">
                                        <CalendarIcon />
                                        Fecha
                                    </h3>
                                    <p className="text-xl text-gray-800 font-bold">
                                        {new Date(pet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>

                            <div className="pl-4">
                                <h3 className="text-lg font-black text-gray-900 uppercase mb-1">
                                    Señas Particulares
                                </h3>
                                <ul className="space-y-1 text-lg text-gray-800">
                                    <li><span className="font-bold text-gray-900">Raza:</span> {pet.breed}</li>
                                    <li><span className="font-bold text-gray-900">Color:</span> {pet.color}</li>
                                    {/* Strict line clamping to 3 lines to ensure footer fit */}
                                    <li className="mt-2 italic text-lg leading-snug text-gray-600 line-clamp-3">"{pet.description}"</li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer - Phone Number Simplified for Robust Export */}
                        <div className="mt-auto text-center pt-2 shrink-0 pb-2">
                            <p className="text-2xl font-bold text-gray-800 uppercase mb-2">Si tienes información llama al:</p>
                            
                            {/* Phone Number Display - Black text, no borders, simple text node for html2canvas safety */}
                            <div className="mb-4">
                                <p className="text-7xl font-black tracking-tight text-gray-900">
                                    {pet.contact}
                                </p>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 mt-2 pt-2 border-t-2 border-dashed border-gray-300">
                                <p className="text-sm font-bold text-gray-600">www.maspatas.com</p>
                                <div className="flex flex-col items-center gap-2">
                                    <img src={qrCodeUrl} alt="QR" className="w-20 h-20 mix-blend-multiply" crossOrigin="anonymous" />
                                    <p className="text-xs font-bold text-gray-400 uppercase text-center leading-tight">ESCANEA EL CODIGO QR PARA MAS INFORMACIÓN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-white text-xs mt-2 opacity-70 no-print text-center">Consejo: Descarga la imagen para subirla a tus Historias de Instagram o Facebook.</p>
            </div>
        </div>
    );
};
