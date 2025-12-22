
import React, { useState } from 'react';
import type { Pet } from '@/types';
import { FacebookIcon, WhatsAppIcon, XCircleIcon, InstagramIcon, DownloadIcon, TikTokIcon } from './icons';
import { PET_STATUS } from '@/constants';
import { formatDate } from '@/utils/date.utils';
import { toJpeg } from 'html-to-image';

// Share Icon Component
const ShareIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

interface ShareModalProps {
    pet: Pet;
    isOpen: boolean;
    onClose: () => void;
}

// Helper function to parse location and extract street and district
const parseLocation = (location: string): { street: string; district: string } => {
    if (!location) return { street: '', district: '' };
    
    const parts = location.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
        // Format: "Calle, Distrito, Provincia, Departamento"
        // We want: Calle and Distrito
        const street = parts.slice(0, parts.length - 3).join(', ') || parts[0] || '';
        const district = parts[parts.length - 3] || parts[parts.length - 2] || parts[0] || '';
        return { street: street || location, district: district || location };
    }
    
    // Fallback: return the full location for both
    return { street: location, district: location };
};

// Helper function to format date for display
const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return 'Fecha no especificada';
    
    try {
        return formatDate(dateString);
    } catch (error) {
        // Fallback formatting
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            return date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch {
            return 'Fecha no disponible';
        }
    }
};

const ShareModal: React.FC<ShareModalProps> = ({ pet, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'visual' | 'link'>('visual');
    const [isGenerating, setIsGenerating] = useState(false);
    const exportRef = React.useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Dynamic URLs - ensure it points to the detail page
    // Use window.location.origin to get the current domain (works in both dev and production)
    // This ensures the QR code will use www.maspatas.com in production and localhost in development
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname; // e.g., /mascota/123
    const pageUrl = `${baseUrl}${currentPath}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}`;

    // Parse location
    const { street, district } = parseLocation(pet.location);
    const locationDisplay = street && district && street !== district 
        ? `${street}, ${district}` 
        : pet.location;

    // Format date
    const formattedDate = formatDisplayDate(pet.date);

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
            element.style.width = '1080px';
            element.style.height = '1920px';

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
                        backgroundColor: '#000000',
                        pixelRatio: 2,
                        cacheBust: true,
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
                    link.download = `MAS_PATAS_STORY_${pet.name ? pet.name.toUpperCase() : 'MASCOTA'}.jpg`;
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
            console.error("Error generating share image:", error);
            alert("Hubo un problema al generar la imagen. Por favor intenta de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLinkShare = (platform: string) => {
        let shareUrl = '';
        const petNameText = pet.name ? `${pet.name} está ` : 'Una mascota está ';
        const text = `🚨 ¡AYUDA! ${petNameText}${pet.status.toLowerCase()} en ${locationDisplay}. ${formattedDate}. Si tienes información, contáctame o ingresa a www.maspatas.com`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(pageUrl);

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'instagram':
                // Instagram doesn't support direct sharing, but we can copy the text
                copyCaption();
                return;
            case 'tiktok':
                // TikTok doesn't have direct sharing API, but we can provide instructions
                alert('Para compartir en TikTok:\n1. Descarga la imagen usando el botón "Descargar Imagen"\n2. Abre TikTok y crea una nueva publicación\n3. Sube la imagen descargada\n4. Agrega el texto copiado como descripción');
                copyCaption();
                return;
        }
        if (shareUrl) window.open(shareUrl, '_blank');
    };

    const copyCaption = () => {
        const petNameText = pet.name ? `${pet.name} está ` : 'Una mascota está ';
        const text = `🚨 ¡AYUDA! ${petNameText}${pet.status.toLowerCase()} 🚨\n\n📍 Ubicación: ${locationDisplay}\n📅 Fecha: ${formattedDate}\n\nAyúdame a volver, si tienes información contáctame o ingresa a www.maspatas.com\n\n#MascotasPerdidas #Ayuda${pet.animalType} #${pet.status.replace(/\s/g, '')} #MásPatas`;
        navigator.clipboard.writeText(text);
        alert('Texto copiado. Listo para pegar en redes sociales.');
    };

    // --- Template Logic ---
    // Colors based on status
    const getStatusColor = () => {
        switch (pet.status) {
            case PET_STATUS.PERDIDO: return '#EF4444'; // Red
            case PET_STATUS.ENCONTRADO: return '#10B981'; // Green
            case PET_STATUS.EN_ADOPCION: return '#8B5CF6'; // Purple
            default: return '#3B82F6'; // Blue
        }
    };
    const statusColor = getStatusColor();
    
    const displayStatus = pet.status === PET_STATUS.PERDIDO ? 'SE BUSCA' : pet.status === PET_STATUS.ENCONTRADO ? 'AVISTADO' : pet.status.toUpperCase();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[3000] flex justify-center items-center p-2 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary to-blue-600 p-3 sm:p-5 border-b border-blue-700 flex justify-between items-center">
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <ShareIcon className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                        Compartir
                    </h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-bold text-center transition-all ${activeTab === 'visual' ? 'border-b-3 border-brand-primary text-brand-primary bg-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        📸 Crear Imagen
                    </button>
                    <button 
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-bold text-center transition-all ${activeTab === 'link' ? 'border-b-3 border-brand-primary text-brand-primary bg-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        🔗 Compartir Enlace
                    </button>
                </div>

                {/* Body */}
                <div className="p-3 sm:p-6 flex-grow overflow-y-auto bg-gray-50">
                    
                    {activeTab === 'visual' && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Live Preview - Exact replica of generation templates */}
                            <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-gray-300 shadow-inner">
                                <div 
                                    className={`relative shadow-2xl transform transition-all duration-300 overflow-hidden border-2 sm:border-4 border-white rounded-lg`}
                                    style={{ 
                                        aspectRatio: '9/16',
                                        width: '100%',
                                        maxWidth: '280px',
                                        height: 'auto',
                                        backgroundColor: '#000',
                                    }}
                                >
                                    {/* STORY PREVIEW - Responsive */}
                                    <div className="w-full h-full relative flex flex-col overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
                                            {/* Background - Full image without cropping, ensures full coverage */}
                                            <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
                                                <img 
                                                    src={pet.imageUrls[0]} 
                                                    alt="bg" 
                                                    style={{ 
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        objectPosition: 'center',
                                                        filter: 'blur(20px) brightness(0.6)'
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85))' }}></div>

                                            {/* Content */}
                                            <div className="relative z-10 h-full flex flex-col text-white text-center" style={{ padding: 'clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 10px)', boxSizing: 'border-box' }}>
                                                {/* Top Header - Logo */}
                                                <div style={{ position: 'absolute', top: 'clamp(4px, 1.5vw, 8px)', left: 'clamp(4px, 1.5vw, 8px)', zIndex: 20 }}>
                                                    {/* Logo */}
                                                    <img 
                                                        src="/assets/images/logo.png" 
                                                        alt="Más Patas Logo" 
                                                        style={{ 
                                                            height: 'clamp(30px, 8vw, 50px)',
                                                            width: 'auto',
                                                            maxWidth: 'clamp(80px, 25vw, 140px)',
                                                            objectFit: 'contain',
                                                            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))'
                                                        }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Top Badge */}
                                                <div className="flex justify-center" style={{ marginTop: 'clamp(40px, 12vw, 60px)', marginBottom: 'clamp(4px, 1.5vw, 8px)', flexShrink: 0 }}>
                                                    <div 
                                                        className="uppercase"
                                                        style={{ 
                                                            color: statusColor, 
                                                            fontSize: 'clamp(12px, 4vw, 18px)',
                                                            fontWeight: '900', 
                                                            letterSpacing: '0.15em',
                                                            textShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.8)'
                                                        }}
                                                    >
                                                        {displayStatus}
                                                    </div>
                                                </div>

                                                {/* Main Image Card */}
                                                <div 
                                                    className="mx-auto sm:max-w-[120px]"
                                                    style={{ 
                                                        width: '100%', 
                                                        maxWidth: 'clamp(140px, 40vw, 200px)',
                                                        aspectRatio: '4/5', 
                                                        backgroundColor: 'white', 
                                                        padding: 'clamp(1px, 0.5vw, 2px)', 
                                                        borderRadius: 'clamp(4px, 1.5vw, 8px)', 
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                                                        marginBottom: 'clamp(4px, 1.5vw, 6px)',
                                                        marginTop: 'clamp(2px, 1vw, 4px)',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img 
                                                        src={pet.imageUrls[0]} 
                                                        className="w-full h-full object-cover rounded-lg" 
                                                        alt="main" 
                                                        style={{ borderRadius: 'clamp(2px, 1vw, 4px)' }}
                                                    />
                                                </div>

                                                {/* Info Section */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'clamp(2px, 1vw, 4px)', minHeight: 0 }}>
                                                    {pet.name && pet.name.trim() && pet.name.trim().toLowerCase() !== 'desconocido' && (
                                                        <h1 className="font-black leading-tight" style={{ fontSize: 'clamp(10px, 3vw, 14px)', fontWeight: '900', marginBottom: 'clamp(2px, 1vw, 4px)', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                                                            {pet.name}
                                                        </h1>
                                                    )}
                                                    
                                                    <div style={{ marginBottom: 'clamp(4px, 1.5vw, 8px)' }}>
                                                        <p className="font-semibold opacity-95" style={{ fontSize: 'clamp(7px, 2vw, 9px)', fontWeight: '600', marginBottom: 'clamp(1px, 0.5vw, 2px)', lineHeight: '1.3' }}>
                                                            📍 {locationDisplay}
                                                        </p>
                                                        <p className="font-medium opacity-90" style={{ fontSize: 'clamp(6px, 1.8vw, 8px)', fontWeight: '500', lineHeight: '1.2' }}>
                                                            📅 {formattedDate}
                                                        </p>
                                                    </div>

                                                    {/* Footer Call to Action */}
                                                    <div 
                                                        className="flex flex-col items-center text-gray-800"
                                                        style={{ 
                                                            backgroundColor: 'white', 
                                                            borderRadius: 'clamp(4px, 1.5vw, 6px)', 
                                                            padding: 'clamp(4px, 1.5vw, 6px) clamp(6px, 2vw, 8px)', 
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                                            flexShrink: 0,
                                                            gap: 'clamp(2px, 1vw, 4px)'
                                                        }}
                                                    >
                                                        <div className="text-center">
                                                            <p 
                                                                className="uppercase font-black"
                                                                style={{ 
                                                                    fontSize: 'clamp(7px, 2vw, 9px)', 
                                                                    fontWeight: '900', 
                                                                    color: statusColor, 
                                                                    marginBottom: 'clamp(1px, 0.5vw, 2px)', 
                                                                    lineHeight: '1.1', 
                                                                    letterSpacing: '0.05em' 
                                                                }}
                                                            >
                                                                Ayúdame a volver
                                                            </p>
                                                            <p className="font-bold" style={{ fontSize: 'clamp(5px, 1.5vw, 7px)', color: '#374151', marginBottom: 'clamp(0.5px, 0.3vw, 1px)', lineHeight: '1.2', fontWeight: '700' }}>
                                                                Si tienes información contáctame
                                                            </p>
                                                        </div>
                                                        <p className="font-bold" style={{ fontSize: 'clamp(5px, 1.5vw, 7px)', color: '#1f2937', fontWeight: '700' }}>
                                                            www.maspatas.com
                                                        </p>
                                                        <div className="text-center flex-shrink-0 flex flex-col items-center w-full">
                                                            <img src={qrCodeUrl} className="rounded-lg bg-white mx-auto" alt="QR" style={{ width: 'clamp(35px, 10vw, 50px)', height: 'clamp(35px, 10vw, 50px)', borderRadius: 'clamp(2px, 1vw, 3px)', padding: 'clamp(1px, 0.5vw, 2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                                                            <p className="font-bold text-center" style={{ fontSize: 'clamp(3px, 1vw, 5px)', fontWeight: 'bold', marginTop: 'clamp(1px, 0.5vw, 2px)', color: '#1f2937', letterSpacing: '0.05em' }}>ESCANEA EL CODIGO QR PARA MAS INFORMACIÓN</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 sm:gap-3">
                                <button 
                                    onClick={handleDownloadImage}
                                    disabled={isGenerating}
                                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-brand-primary via-blue-600 to-blue-700 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                >
                                    {isGenerating ? (
                                        <span className="animate-pulse flex items-center gap-2 text-xs sm:text-sm">
                                            <span className="animate-spin">⏳</span> Generando imagen...
                                        </span>
                                    ) : (
                                        <>
                                            <DownloadIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Descargar Imagen
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={copyCaption}
                                    className="w-full py-2.5 sm:py-3 bg-gray-100 text-gray-700 font-bold rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-sm border border-gray-300"
                                >
                                    📋 Copiar Texto para Redes
                                </button>
                            </div>
                            
                            <p className="text-xs text-center text-gray-500 leading-relaxed px-2">
                                💡 Descarga la imagen y compártela en tus Historias de Instagram, WhatsApp, Facebook o TikTok.
                            </p>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            <p className="text-gray-700 text-sm text-center mb-6 font-medium">
                                Comparte el enlace directo a esta publicación en tus redes sociales.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleLinkShare('whatsapp')} 
                                    className="flex flex-col items-center justify-center gap-2 bg-[#25D366] text-white py-4 px-4 rounded-xl font-bold shadow-md hover:opacity-90 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    <WhatsAppIcon className="h-7 w-7" />
                                    <span className="text-sm">WhatsApp</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleLinkShare('facebook')} 
                                    className="flex flex-col items-center justify-center gap-2 bg-[#1877F2] text-white py-4 px-4 rounded-xl font-bold shadow-md hover:opacity-90 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    <FacebookIcon className="h-7 w-7" />
                                    <span className="text-sm">Facebook</span>
                                </button>

                                <button 
                                    onClick={() => handleLinkShare('instagram')} 
                                    className="flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white py-4 px-4 rounded-xl font-bold shadow-md hover:opacity-90 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    <InstagramIcon className="h-7 w-7" />
                                    <span className="text-sm">Instagram</span>
                                </button>

                                <button 
                                    onClick={() => handleLinkShare('tiktok')} 
                                    className="flex flex-col items-center justify-center gap-2 bg-black text-white py-4 px-4 rounded-xl font-bold shadow-md hover:opacity-90 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    <TikTokIcon className="h-7 w-7" />
                                    <span className="text-sm">TikTok</span>
                                </button>
                            </div>

                            <button 
                                onClick={() => { 
                                    navigator.clipboard.writeText(pageUrl); 
                                    alert('✅ Enlace copiado al portapapeles!'); 
                                }} 
                                className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-900 transition-colors mt-4"
                            >
                                🔗 Copiar Enlace
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- HIDDEN TEMPLATES FOR GENERATION --- */}
            {/* STORY TEMPLATE (1080x1920) */}
            <div 
                id="social-story-template" 
                ref={exportRef}
                style={{ 
                    width: '1080px', 
                    height: '1920px', 
                    position: 'fixed', 
                    top: '-3000px',
                    left: '-3000px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#000',
                    fontFamily: 'Arial, sans-serif'
                }}
            >
                {/* Background - Full image without cropping, ensures full coverage */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <img 
                        src={pet.imageUrls[0]} 
                        alt="bg" 
                        crossOrigin="anonymous"
                        style={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            filter: 'blur(20px) brightness(0.6)'
                        }}
                    />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85))' }}></div>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 35px 50px 35px', color: 'white', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                    
                    {/* Top Header - Logo */}
                    <div style={{ position: 'absolute', top: '30px', left: '35px', zIndex: 20 }}>
                        {/* Logo */}
                        <img 
                            src="/assets/images/logo.png" 
                            alt="Más Patas Logo" 
                            style={{ 
                                height: '120px',
                                width: 'auto',
                                maxWidth: '280px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
                            }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    
                    {/* Top Badge - SE BUSCA / PERDIDO */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '160px', marginBottom: '20px' }}>
                        <div style={{ 
                            color: statusColor, 
                            fontSize: '90px', 
                            fontWeight: '900', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.15em',
                            textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.7), 0 4px 8px rgba(0,0,0,0.8)'
                        }}>
                            {displayStatus}
                        </div>
                    </div>

                    {/* Main Image Card */}
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '600px',
                        margin: '0 auto',
                        aspectRatio: '4/5', 
                        backgroundColor: 'white', 
                        padding: '10px', 
                        borderRadius: '50px', 
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                        marginBottom: '20px',
                        flexShrink: 0
                    }}>
                        <img 
                            src={pet.imageUrls[0]} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '40px' }} 
                            alt="main" 
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Info Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0', minHeight: 0 }}>
                        {pet.name && pet.name.trim() && pet.name.trim().toLowerCase() !== 'desconocido' && (
                            <h1 style={{ fontSize: '70px', fontWeight: '900', lineHeight: '1.1', marginBottom: '12px', textShadow: '0 5px 15px rgba(0,0,0,0.7)' }}>
                                {pet.name}
                            </h1>
                        )}
                        
                        <div style={{ marginBottom: '18px' }}>
                            <p style={{ fontSize: '42px', fontWeight: '600', opacity: '0.95', marginBottom: '8px', lineHeight: '1.4' }}>
                                📍 {locationDisplay}
                            </p>
                            <p style={{ fontSize: '38px', fontWeight: '500', opacity: '0.9', lineHeight: '1.3' }}>
                                📅 {formattedDate}
                            </p>
                        </div>

                        {/* Footer Call to Action */}
                        <div style={{ 
                            backgroundColor: 'white', 
                            borderRadius: '30px', 
                            padding: '25px 35px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '15px',
                            color: '#1f2937',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                            marginBottom: '0'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '32px', fontWeight: '900', color: statusColor, textTransform: 'uppercase', marginBottom: '8px', lineHeight: '1.2', letterSpacing: '0.05em' }}>
                                    Ayúdame a volver
                                </p>
                                <p style={{ fontSize: '26px', color: '#374151', marginBottom: '5px', lineHeight: '1.4', fontWeight: '700' }}>
                                    Si tienes información contáctame
                                </p>
                            </div>
                            <p style={{ fontSize: '24px', color: '#1f2937', fontWeight: '700' }}>
                                www.maspatas.com
                            </p>
                            <div style={{ textAlign: 'center', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <img src={qrCodeUrl} style={{ width: '200px', height: '200px', borderRadius: '15px', backgroundColor: 'white', padding: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', margin: '0 auto' }} alt="QR" crossOrigin="anonymous" />
                                <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '6px', color: '#1f2937', letterSpacing: '0.05em', textAlign: 'center' }}>ESCANEA EL CODIGO QR PARA MAS INFORMACIÓN</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* POST TEMPLATE (1080x1080) */}
            <div 
                id="social-post-template" 
                style={{ 
                    width: '1080px', 
                    height: '1080px', 
                    position: 'fixed', 
                    top: '-3000px', 
                    left: '-3000px',
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: 'white'
                }}
            >
                {/* Top Bar */}
                <div style={{ 
                    height: '120px', 
                    backgroundColor: statusColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <h2 style={{ fontSize: '50px', fontWeight: '900', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{displayStatus}</h2>
                </div>

                {/* Image Area */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <img src={pet.imageUrls[0]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="post-img" crossOrigin="anonymous" />
                    
                    {/* Reward Badge if exists */}
                    {pet.reward && pet.reward > 0 && (
                        <div style={{ 
                            position: 'absolute', 
                            top: '40px', 
                            right: '40px', 
                            backgroundColor: '#D4AF37', 
                            color: 'white', 
                            padding: '15px 30px', 
                            borderRadius: '50px', 
                            fontSize: '30px', 
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}>
                            RECOMPENSA
                        </div>
                    )}
                </div>

                {/* Bottom Info */}
                <div style={{ padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                    <div style={{ maxWidth: '70%' }}>
                        <h1 style={{ fontSize: '70px', fontWeight: '900', color: '#1F2937', lineHeight: '1', marginBottom: '10px' }}>{pet.name}</h1>
                        <p style={{ fontSize: '30px', color: '#4B5563', marginBottom: '10px' }}>{pet.breed} • {pet.color}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: statusColor, fontSize: '24px', fontWeight: 'bold' }}>
                            <span>📍</span> <span>{pet.location}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ShareModal;
