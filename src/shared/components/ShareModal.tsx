
import React, { useState } from 'react';
import type { Pet } from '@/types';
import { FacebookIcon, WhatsAppIcon, XCircleIcon, InstagramIcon, DownloadIcon, TikTokIcon } from './icons';
import { PET_STATUS } from '@/constants';
import { formatDate } from '@/utils/date.utils';

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
        setIsGenerating(true);
        try {
            const elementId = 'social-story-template';
            const element = document.getElementById(elementId);
            const html2canvas = (window as any).html2canvas;

            if (!element || !html2canvas) {
                alert('Error: No se pudo iniciar el generador de imágenes.');
                return;
            }

            // Wait for DOM to paint and images to load
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(element, {
                scale: 2, // High Res
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#000000',
                onclone: (clonedDoc: Document) => {
                    const el = clonedDoc.getElementById(elementId);
                    if (el) {
                        el.style.display = 'flex'; 
                        el.style.left = '0px';
                        el.style.top = '0px';
                    }
                }
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `MAS_PATAS_STORY_${pet.name ? pet.name.toUpperCase() : 'MASCOTA'}.jpg`;
            link.click();

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
        const text = `🚨 ¡AYUDA! ${petNameText}${pet.status.toLowerCase()} 🚨\n\n📍 Ubicación: ${locationDisplay}\n📅 Fecha: ${formattedDate}\n\nAyúdame a volver, si tienes información contáctame o ingresa a www.maspatas.com\n\n#MascotasPerdidas #Ayuda${pet.animalType} #${pet.status.replace(/\s/g, '')} #MasPatas`;
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
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[3000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary to-blue-600 p-5 border-b border-blue-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShareIcon className="text-white" />
                        Compartir
                    </h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-4 text-sm font-bold text-center transition-all ${activeTab === 'visual' ? 'border-b-3 border-brand-primary text-brand-primary bg-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        📸 Crear Imagen
                    </button>
                    <button 
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-4 text-sm font-bold text-center transition-all ${activeTab === 'link' ? 'border-b-3 border-brand-primary text-brand-primary bg-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        🔗 Compartir Enlace
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow overflow-y-auto bg-gray-50">
                    
                    {activeTab === 'visual' && (
                        <div className="space-y-6">
                            {/* Live Preview - Exact replica of generation templates */}
                            <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 border-2 border-gray-300 shadow-inner">
                                <div 
                                    className={`relative shadow-2xl transform transition-all duration-300 overflow-hidden border-4 border-white rounded-lg`}
                                    style={{ 
                                        aspectRatio: '9/16',
                                        height: '400px',
                                        backgroundColor: '#000',
                                    }}
                                >
                                    {/* STORY PREVIEW - Scaled 1:3.84 (500px / 1920px) */}
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
                                                        width: '150%',
                                                        height: '150%',
                                                        objectFit: 'contain',
                                                        objectPosition: 'center',
                                                        filter: 'blur(20px) brightness(0.6)'
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85))' }}></div>

                                            {/* Content */}
                                            <div className="relative z-10 h-full flex flex-col text-white text-center" style={{ padding: '12px 10px', boxSizing: 'border-box' }}>
                                                {/* Top Badge */}
                                                <div className="flex justify-center" style={{ marginBottom: '8px', flexShrink: 0 }}>
                                                    <div 
                                                        className="uppercase"
                                                        style={{ 
                                                            color: statusColor, 
                                                            fontSize: '18px',
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
                                                    className="mx-auto"
                                                    style={{ 
                                                        width: '100%', 
                                                        maxWidth: '140px',
                                                        aspectRatio: '4/5', 
                                                        backgroundColor: 'white', 
                                                        padding: '2px', 
                                                        borderRadius: '8px', 
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                                                        transform: 'rotate(-1.5deg)',
                                                        marginBottom: '6px',
                                                        marginTop: '4px',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img 
                                                        src={pet.imageUrls[0]} 
                                                        className="w-full h-full object-contain rounded-lg" 
                                                        alt="main" 
                                                        style={{ borderRadius: '4px' }}
                                                    />
                                                </div>

                                                {/* Info Section */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '4px', minHeight: 0 }}>
                                                    {pet.name && (
                                                        <h1 className="font-black leading-tight" style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                                                            {pet.name}
                                                        </h1>
                                                    )}
                                                    
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <p className="font-semibold opacity-95" style={{ fontSize: '9px', fontWeight: '600', marginBottom: '2px', lineHeight: '1.3' }}>
                                                            📍 {locationDisplay}
                                                        </p>
                                                        <p className="font-medium opacity-90" style={{ fontSize: '8px', fontWeight: '500', lineHeight: '1.2' }}>
                                                            📅 {formattedDate}
                                                        </p>
                                                    </div>

                                                    {/* Footer Call to Action */}
                                                    <div 
                                                        className="flex items-center justify-between text-gray-800"
                                                        style={{ 
                                                            backgroundColor: 'white', 
                                                            borderRadius: '6px', 
                                                            padding: '6px 8px', 
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <div className="text-left flex-1" style={{ paddingRight: '4px' }}>
                                                            <p 
                                                                className="uppercase font-black"
                                                                style={{ 
                                                                    fontSize: '9px', 
                                                                    fontWeight: '900', 
                                                                    color: statusColor, 
                                                                    marginBottom: '2px', 
                                                                    lineHeight: '1.1', 
                                                                    letterSpacing: '0.05em' 
                                                                }}
                                                            >
                                                                Ayúdame a volver
                                                            </p>
                                                            <p className="font-bold" style={{ fontSize: '7px', color: '#374151', marginBottom: '1px', lineHeight: '1.2', fontWeight: '700' }}>
                                                                Si tienes información contáctame
                                                            </p>
                                                            <p className="font-bold" style={{ fontSize: '6px', color: '#4b5563', fontWeight: '700' }}>
                                                                o ingresa a www.maspatas.com
                                                            </p>
                                                        </div>
                                                        <div className="text-center flex-shrink-0" style={{ marginLeft: '4px' }}>
                                                            <img src={qrCodeUrl} className="rounded-lg bg-white" alt="QR" style={{ width: '30px', height: '30px', borderRadius: '3px', padding: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                                                            <p className="font-bold" style={{ fontSize: '5px', fontWeight: 'bold', marginTop: '2px', color: '#1f2937', letterSpacing: '0.05em' }}>ESCANEAR QR</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDownloadImage}
                                    disabled={isGenerating}
                                    className="w-full py-4 bg-gradient-to-r from-brand-primary via-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                                >
                                    {isGenerating ? (
                                        <span className="animate-pulse flex items-center gap-2">
                                            <span className="animate-spin">⏳</span> Generando imagen...
                                        </span>
                                    ) : (
                                        <>
                                            <DownloadIcon className="h-5 w-5" /> Descargar Imagen
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={copyCaption}
                                    className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                                >
                                    📋 Copiar Texto para Redes
                                </button>
                            </div>
                            
                            <p className="text-xs text-center text-gray-500 leading-relaxed">
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
                            width: '150%',
                            height: '150%',
                            objectFit: 'contain',
                            objectPosition: 'center',
                            filter: 'blur(20px) brightness(0.6)'
                        }}
                    />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85))' }}></div>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 35px 50px 35px', color: 'white', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                    
                    {/* Top Header - Logo and Website */}
                    <div style={{ position: 'absolute', top: '30px', left: '35px', right: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
                        {/* Logo */}
                        <img 
                            src="/assets/images/logo.png" 
                            alt="Mas Patas Logo" 
                            style={{ 
                                height: '150px',
                                width: 'auto',
                                maxWidth: '350px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
                            }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        {/* Website */}
                        <p style={{ 
                            fontSize: '32px', 
                            fontWeight: '900', 
                            color: 'white', 
                            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                            letterSpacing: '0.05em'
                        }}>
                            www.maspatas.com
                        </p>
                    </div>
                    
                    {/* Top Badge - SE BUSCA / PERDIDO */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '120px', marginBottom: '20px' }}>
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
                        maxWidth: '800px',
                        margin: '0 auto',
                        aspectRatio: '4/5', 
                        backgroundColor: 'white', 
                        padding: '10px', 
                        borderRadius: '50px', 
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                        transform: 'rotate(-1.5deg)',
                        marginBottom: '20px',
                        flexShrink: 0
                    }}>
                        <img 
                            src={pet.imageUrls[0]} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '25px' }} 
                            alt="main" 
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Info Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0', minHeight: 0 }}>
                        {pet.name && (
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
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '25px',
                            color: '#1f2937',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                            marginBottom: '0'
                        }}>
                            <div style={{ textAlign: 'center', flex: 1, maxWidth: '550px' }}>
                                <p style={{ fontSize: '32px', fontWeight: '900', color: statusColor, textTransform: 'uppercase', marginBottom: '8px', lineHeight: '1.2', letterSpacing: '0.05em' }}>
                                    Ayúdame a volver
                                </p>
                                <p style={{ fontSize: '26px', color: '#374151', marginBottom: '5px', lineHeight: '1.4', fontWeight: '700' }}>
                                    Si tienes información contáctame
                                </p>
                                <p style={{ fontSize: '22px', color: '#4b5563', fontWeight: '700' }}>
                                    o ingresa a www.maspatas.com
                                </p>
                            </div>
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                <img src={qrCodeUrl} style={{ width: '140px', height: '140px', borderRadius: '15px', backgroundColor: 'white', padding: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} alt="QR" crossOrigin="anonymous" />
                                <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '6px', color: '#1f2937', letterSpacing: '0.05em' }}>ESCANEAR QR</p>
                            </div>
                            <img src={qrCodeUrl} style={{ width: '140px', height: '140px', borderRadius: '10px', mixBlendMode: 'multiply' }} alt="QR" crossOrigin="anonymous" />
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
                    <img src={pet.imageUrls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="post-img" crossOrigin="anonymous" />
                    
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
