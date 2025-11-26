
import React, { useState, useRef } from 'react';
import type { Pet } from '../types';
import { FacebookIcon, WhatsAppIcon, XCircleIcon, InstagramIcon, DownloadIcon, SparklesIcon } from './icons';
import { PET_STATUS } from '../constants';

interface ShareModalProps {
    pet: Pet;
    isOpen: boolean;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ pet, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'visual' | 'link'>('visual');
    const [format, setFormat] = useState<'story' | 'post'>('story');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    // Dynamic URLs
    const pageUrl = window.location.href;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}`;

    const handleDownloadImage = async () => {
        setIsGenerating(true);
        try {
            const elementId = format === 'story' ? 'social-story-template' : 'social-post-template';
            const element = document.getElementById(elementId);
            const html2canvas = (window as any).html2canvas;

            if (!element || !html2canvas) {
                alert('Error: No se pudo iniciar el generador de imágenes.');
                return;
            }

            // Wait for DOM to paint
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                scale: 2, // High Res
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: format === 'story' ? '#1D4ED8' : '#ffffff', // Fallback background
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
            link.download = `PETS_${format.toUpperCase()}_${pet.name.toUpperCase()}.jpg`;
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
        const text = `¡Ayuda a ${pet.name}! ${pet.status} en ${pet.location}.`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(pageUrl);

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
                break;
        }
        if (shareUrl) window.open(shareUrl, '_blank');
    };

    const copyCaption = () => {
        const text = `🚨 ¡AYUDA! ${pet.status} 🚨\n\nNombre: ${pet.name}\nRaza: ${pet.breed}\nUbicación: ${pet.location}\n\nSi tienes información, por favor contacta. #MascotasPerdidas #Ayuda${pet.animalType} #${pet.status.replace(/\s/g, '')} #PetsApp`;
        navigator.clipboard.writeText(text);
        alert('Texto copiado. Listo para pegar en Instagram/Facebook.');
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
    
    const displayStatus = pet.status === PET_STATUS.PERDIDO ? 'SE BUSCA' : pet.status.toUpperCase();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[3000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <SparklesIcon className="text-brand-secondary" />
                        Centro de Difusión
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'visual' ? 'border-b-2 border-brand-primary text-brand-primary bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        📸 Crear Diseño
                    </button>
                    <button 
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'link' ? 'border-b-2 border-brand-primary text-brand-primary bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        🔗 Compartir Enlace
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow overflow-y-auto">
                    
                    {activeTab === 'visual' && (
                        <div className="space-y-6">
                            <div className="flex justify-center gap-4 mb-4">
                                <button 
                                    onClick={() => setFormat('story')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${format === 'story' ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    Historia (9:16)
                                </button>
                                <button 
                                    onClick={() => setFormat('post')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${format === 'post' ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    Post Cuadrado (1:1)
                                </button>
                            </div>

                            {/* Live CSS Preview (Scaled Down) */}
                            <div className="flex justify-center bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-inner">
                                <div 
                                    className={`relative bg-white shadow-lg transform transition-all duration-300 overflow-hidden border-4 border-white`}
                                    style={{ 
                                        aspectRatio: format === 'story' ? '9/16' : '1/1',
                                        height: format === 'story' ? '400px' : '300px',
                                    }}
                                >
                                    {/* We render a mini simplified HTML version for user preview to avoid heavy canvas ops on every render */}
                                    <div className="w-full h-full relative flex flex-col">
                                        <img src={pet.imageUrls[0]} className="absolute inset-0 w-full h-full object-cover" alt="bg" style={{ filter: 'blur(8px) brightness(0.7)' }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                        
                                        <div className="relative z-10 flex flex-col h-full p-4 items-center justify-between text-white text-center">
                                            <div className="mt-4 px-4 py-1 bg-white text-black font-black text-lg uppercase tracking-widest rounded-sm shadow-lg" style={{ color: statusColor }}>
                                                {displayStatus}
                                            </div>
                                            
                                            <div className="w-full aspect-square max-w-[60%] rounded-lg border-4 border-white shadow-2xl overflow-hidden my-auto relative">
                                                <img src={pet.imageUrls[0]} className="w-full h-full object-cover" alt="main" />
                                            </div>

                                            <div className="mb-2 w-full">
                                                <h2 className="text-2xl font-black uppercase leading-none mb-1">{pet.name}</h2>
                                                <p className="text-xs font-medium opacity-90 line-clamp-2 mb-3">{pet.location}</p>
                                                
                                                <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-lg">
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold uppercase text-yellow-400">Ayúdame a volver</p>
                                                        <p className="text-[8px] opacity-70">Escanea para ver más info</p>
                                                    </div>
                                                    <img src={qrCodeUrl} className="w-10 h-10 rounded bg-white p-0.5" alt="QR" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDownloadImage}
                                    disabled={isGenerating}
                                    className="w-full py-3 bg-gradient-to-r from-brand-primary to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isGenerating ? <span className="animate-pulse">Generando...</span> : <><DownloadIcon /> Descargar Imagen</>}
                                </button>
                                <button 
                                    onClick={copyCaption}
                                    className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Copiar Texto para Redes
                                </button>
                            </div>
                            
                            <p className="text-xs text-center text-gray-400">
                                Descarga la imagen y compártela en tus Historias de Instagram, WhatsApp o Grupos de Facebook.
                            </p>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm text-center mb-4">Comparte el enlace directo a esta publicación.</p>
                            
                            <button onClick={() => handleLinkShare('whatsapp')} className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity">
                                <WhatsAppIcon /> Compartir en WhatsApp
                            </button>
                            
                            <button onClick={() => handleLinkShare('facebook')} className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity">
                                <FacebookIcon /> Compartir en Facebook
                            </button>

                            <button onClick={() => { navigator.clipboard.writeText(pageUrl); alert('Enlace copiado!'); }} className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity">
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
                    top: '-3000px', // Hide offscreen
                    left: '-3000px',
                    display: 'flex', // Usually hidden, flex when cloning
                    flexDirection: 'column',
                    backgroundColor: '#000'
                }}
            >
                {/* Background */}
                <img src={pet.imageUrls[0]} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.6)' }} alt="bg" crossOrigin="anonymous" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))' }}></div>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '80px 60px', color: 'white', textAlign: 'center' }}>
                    
                    {/* Top Badge */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ 
                            backgroundColor: statusColor, 
                            color: 'white', 
                            fontSize: '60px', 
                            fontWeight: '900', 
                            padding: '20px 60px', 
                            borderRadius: '100px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                            {displayStatus}
                        </div>
                    </div>

                    {/* Main Image Card */}
                    <div style={{ 
                        width: '100%', 
                        aspectRatio: '4/5', 
                        backgroundColor: 'white', 
                        padding: '20px', 
                        borderRadius: '40px', 
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        transform: 'rotate(-2deg)',
                        marginTop: '40px'
                    }}>
                        <img 
                            src={pet.imageUrls[0]} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} 
                            alt="main" 
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Info */}
                    <div style={{ marginTop: 'auto' }}>
                        <h1 style={{ fontSize: '90px', fontWeight: '900', lineHeight: '1', marginBottom: '20px', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                            {pet.name}
                        </h1>
                        <p style={{ fontSize: '40px', fontWeight: '500', opacity: '0.9', marginBottom: '60px', lineHeight: '1.3' }}>
                            {pet.animalType} - {pet.breed}<br/>
                            <span style={{ fontSize: '30px', opacity: '0.8' }}>📍 {pet.location}</span>
                        </p>

                        {/* Footer Call to Action */}
                        <div style={{ 
                            backgroundColor: 'white', 
                            borderRadius: '30px', 
                            padding: '30px 40px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            color: '#1f2937'
                        }}>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '32px', fontWeight: '900', color: statusColor, textTransform: 'uppercase', marginBottom: '5px' }}>¡AYÚDANOS!</p>
                                <p style={{ fontSize: '24px', color: '#4b5563' }}>Escanea el QR para contactar al dueño</p>
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
                            backgroundColor: '#10B981', 
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
                    <div style={{ textAlign: 'center' }}>
                        <img src={qrCodeUrl} style={{ width: '150px', height: '150px', mixBlendMode: 'multiply' }} alt="QR" crossOrigin="anonymous" />
                        <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px', color: '#4B5563' }}>ESCANEAR</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ShareModal;
