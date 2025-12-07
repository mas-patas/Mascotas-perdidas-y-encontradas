
import React, { useState } from 'react';
import type { Pet } from '@/types';
import { LocationMarkerIcon, CalendarIcon, PrinterIcon, PhoneIcon, DogIcon, SparklesIcon } from './icons';

interface FlyerModalProps {
    pet: Pet;
    onClose: () => void;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({ pet, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = async () => {
        setIsGenerating(true);
        try {
            // We target the hidden export template which has fixed dimensions and high-res styling
            const element = document.getElementById('flyer-export');
            const html2canvas = (window as any).html2canvas;
            
            if (!element || !html2canvas) {
                alert('Error: No se pudo iniciar el generador de imágenes.');
                return;
            }

            // Small delay to ensure images in the hidden div are painted
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(element, {
                scale: 2, // High resolution
                useCORS: true, 
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 800, // Force fixed width
                height: 1067, // Force fixed height (3:4 ratio)
                windowWidth: 800,
                windowHeight: 1067,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                // Critical: Move the element into view within the cloned document context
                onclone: (clonedDoc: Document) => {
                    const el = clonedDoc.getElementById('flyer-export');
                    if (el) {
                        el.style.left = '0px';
                        el.style.top = '0px';
                        el.style.visibility = 'visible';
                        el.style.display = 'flex';
                    }
                }
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `SE_BUSCA_${pet.name.toUpperCase()}.jpg`;
            link.click();

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
                
                {/* Controls Header */}
                <div className="bg-white p-3 rounded-xl flex flex-wrap justify-between items-center no-print shadow-lg mb-4 w-full gap-2">
                    <h3 className="text-md font-bold text-brand-dark pl-2">Vista Previa del Afiche</h3>
                    <div className="flex flex-wrap items-center gap-2">
                         <button 
                            onClick={handleDownloadImage} 
                            disabled={isGenerating}
                            className="flex items-center gap-2 py-2 px-4 bg-brand-secondary text-brand-dark font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-sm text-sm disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <span className="animate-pulse">Generando...</span>
                            ) : (
                                <>
                                    <SparklesIcon />
                                    <span>Descargar Imagen</span>
                                </>
                            )}
                        </button>
                         <button 
                            onClick={handlePrint} 
                            className="flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-sm text-sm"
                        >
                            <PrinterIcon />
                            <span className="hidden sm:inline">Imprimir PDF</span>
                        </button>
                        <button 
                            onClick={onClose} 
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 font-bold text-xl transition-colors"
                        >
                            &times;
                        </button>
                    </div>
                </div>
                
                {/* --- VISIBLE PREVIEW (Responsive) --- */}
                {/* This one adapts to the screen size for the user to see */}
                <div 
                    id="flyer-preview" 
                    className="bg-white w-full mx-auto border-[8px] sm:border-[12px] border-[#EF4444] shadow-2xl overflow-hidden relative flex flex-col"
                    style={{ aspectRatio: '3 / 4' }} 
                >
                    {/* Responsive Header */}
                    <div className="bg-[#EF4444] pt-3 sm:pt-6 pb-2 sm:pb-4 text-center px-2 sm:px-4 shrink-0">
                        <h1 className="text-3xl sm:text-6xl font-black text-white tracking-wider leading-none uppercase mb-1 drop-shadow-md">
                            SE BUSCA
                        </h1>
                        <p className="text-[10px] sm:text-xl font-bold text-white uppercase tracking-[0.15em]">
                            AYÚDAME A REGRESAR A CASA
                        </p>
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

                        <div className="w-full flex-1 min-h-[120px] sm:min-h-[200px] mx-auto mb-2 sm:mb-6 overflow-hidden border-4 border-gray-900 rounded-sm shadow-lg bg-gray-100 relative shrink">
                            <img 
                                src={pet.imageUrls[0]} 
                                alt={pet.name} 
                                className="w-full h-full object-cover absolute inset-0"
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
                            <div className="flex justify-between items-end mt-1 sm:mt-4 pt-1 sm:pt-2 border-t border-dashed border-gray-300">
                                <div className="text-left">
                                    <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase">¡Ayúdanos a encontrarlo!</p>
                                    <p className="text-[8px] sm:text-[10px] text-gray-400">Comparte esta imagen.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase text-right leading-tight">Escanear<br/>para ver más</p>
                                    <img src={qrCodeUrl} alt="QR" className="w-10 h-10 sm:w-12 sm:h-12 mix-blend-multiply" crossOrigin="anonymous" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- HIDDEN EXPORT TEMPLATE (Fixed Size & Optimized Layout) --- */}
                {/* Positioned off-screen but close enough to be safe from aggressive browser culling */}
                <div 
                    id="flyer-export" 
                    className="fixed top-0 bg-white border-[16px] border-[#EF4444] flex flex-col z-[-50]"
                    style={{ width: '800px', height: '1067px', left: '-1000px' }}
                >
                    {/* Header */}
                    <div className="bg-[#EF4444] pt-6 pb-4 text-center px-6 shrink-0">
                        <h1 className="text-6xl font-black text-white tracking-wider leading-none uppercase mb-2 drop-shadow-lg">
                            SE BUSCA
                        </h1>
                        <p className="text-xl font-bold text-white uppercase tracking-[0.2em]">
                            AYÚDAME A REGRESAR A CASA
                        </p>
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
                        <div className="w-full flex-1 min-h-[200px] mx-auto mb-2 overflow-hidden border-4 border-gray-900 rounded-sm shadow-lg bg-gray-100 relative shrink">
                            <img 
                                src={pet.imageUrls[0]} 
                                alt={pet.name} 
                                className="w-full h-full object-cover absolute inset-0"
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
                            
                            <div className="flex justify-between items-end mt-2 pt-2 border-t-2 border-dashed border-gray-300">
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-400 uppercase">¡Ayúdanos a encontrarlo!</p>
                                    <p className="text-xs text-gray-400">Comparte esta imagen en tus redes.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase text-right leading-tight">Escanear<br/>para ver más</p>
                                    <img src={qrCodeUrl} alt="QR" className="w-14 h-14 mix-blend-multiply" crossOrigin="anonymous" />
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
