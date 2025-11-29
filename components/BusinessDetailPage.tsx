
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { businessService } from '../services/businessService';
import { Business } from '../types';
import { PhoneIcon, LocationMarkerIcon, FacebookIcon, InstagramIcon, ExternalLinkIcon, ChevronLeftIcon, WhatsAppIcon, GoogleMapsIcon, WazeIcon } from './icons';

const BusinessDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Map refs
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            businessService.getBusinessById(id).then(data => {
                setBusiness(data);
                setLoading(false);
            });
        }
    }, [id]);

    // Initialize Map for specific business location
    useEffect(() => {
        if (!loading && business && business.lat && business.lng && mapRef.current) {
            const L = (window as any).L;
            if (!L) return;

            // Function to setup map
            const setupMap = () => {
                if (!mapInstance.current) {
                    mapInstance.current = L.map(mapRef.current, {
                        center: [business.lat, business.lng],
                        zoom: 16, // Slightly closer zoom for detail view
                        zoomControl: false, 
                        dragging: true, // Allow dragging to see surroundings
                        scrollWheelZoom: false,
                        doubleClickZoom: false
                    });

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap'
                    }).addTo(mapInstance.current);

                    // Custom marker based on type - REDUCED SIZE manually (22px)
                    const isVet = business.type === 'Veterinaria';
                    const pinColor = isVet ? '#EF4444' : '#3B82F6';
                    
                    // SVG Icons with explicit smaller styling (10px) and centered positioning relative to rotated parent
                    const medicalIconSVG = `<svg viewBox="0 0 24 24" fill="white" stroke="none" style="position: absolute; width: 10px; height: 10px; left: 6px; top: 4px; z-index: 10; transform: rotate(45deg);"><path d="M18 10h-4V6a2 2 0 00-4 0v4H6a2 2 0 000 4h4v4a2 2 0 004 0v-4h4a2 2 0 000-4z" /></svg>`;
                    const storeIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; width: 10px; height: 10px; left: 6px; top: 4px; z-index: 10; color: white; transform: rotate(45deg);"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`;

                    // Manually construct the pin HTML to control size (22px)
                    // Note: The rotation happens on the container div
                    const pinHtml = `
                        <div style="position: relative; width: 22px; height: 32px; display: flex; justify-content: center;">
                            <div style="
                                width: 22px; 
                                height: 22px; 
                                border-radius: 50% 50% 50% 0; 
                                background: ${pinColor}; 
                                transform: rotate(-45deg); 
                                box-shadow: 0px 2px 5px rgba(0,0,0,0.3);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                ${isVet ? medicalIconSVG : storeIconSVG}
                            </div>
                        </div>
                    `;

                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: pinHtml,
                        iconSize: [22, 32], // Width, Total Height
                        iconAnchor: [11, 32] // Horizontal center, Bottom tip
                    });

                    L.marker([business.lat, business.lng], { icon }).addTo(mapInstance.current);
                } else {
                    // Update view if map exists
                    mapInstance.current.setView([business.lat, business.lng], 16);
                }
                
                // Force resize to fix grey tiles issue
                setTimeout(() => {
                    if (mapInstance.current) {
                        mapInstance.current.invalidateSize();
                    }
                }, 200);
            };

            // Delay setup slightly to ensure container render
            setTimeout(setupMap, 100);
        }
    }, [loading, business]);

    const openInGoogleMaps = () => {
        if (business?.lat && business?.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`, '_blank');
        }
    };

    const openInWaze = () => {
         if (business?.lat && business?.lng) {
            window.open(`https://waze.com/ul?ll=${business.lat},${business.lng}&navigate=yes`, '_blank');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    if (!business) return <div className="text-center py-20">Negocio no encontrado.</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            {/* Hero Header */}
            <div className="relative h-72 md:h-96 w-full bg-gray-900 group">
                <img 
                    src={business.coverUrl || 'https://placehold.co/1200x400/1e3a8a/ffffff?text=Pets+Store'} 
                    alt="Cover" 
                    className="w-full h-full object-cover opacity-80" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                <button 
                    onClick={() => navigate('/servicios')}
                    className="absolute top-4 left-4 bg-white/90 p-2 rounded-full text-gray-800 hover:bg-white shadow-lg z-20"
                >
                    <ChevronLeftIcon />
                </button>

                {/* Centered Logo and Title Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white pointer-events-none">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl bg-white overflow-hidden mb-4 pointer-events-auto">
                        <img src={business.logoUrl || 'https://placehold.co/200?text=Logo'} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-center drop-shadow-md px-4">{business.name}</h1>
                    <span className="mt-2 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider border border-white/30">
                        {business.type}
                    </span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Sidebar: Contact & Location */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Actions Card */}
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">Contacto</h3>
                            <div className="flex flex-col gap-3">
                                {business.whatsapp && (
                                    <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
                                        <WhatsAppIcon /> WhatsApp
                                    </a>
                                )}
                                {business.phone && (
                                    <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                                        <PhoneIcon /> Llamar
                                    </a>
                                )}
                                
                                <div className="flex gap-2 mt-2">
                                    {business.facebook && (
                                        <a href={business.facebook} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center bg-[#1877F2] text-white p-2 rounded-lg hover:opacity-90 transition-opacity">
                                            <FacebookIcon className="h-5 w-5" />
                                        </a>
                                    )}
                                    {business.instagram && (
                                        <a href={business.instagram} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:opacity-90 transition-opacity">
                                            <InstagramIcon className="h-5 w-5" />
                                        </a>
                                    )}
                                    {business.website && (
                                        <a href={business.website} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center bg-gray-800 text-white p-2 rounded-lg hover:opacity-90 transition-opacity">
                                            <ExternalLinkIcon className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <LocationMarkerIcon className="text-brand-primary"/> Ubicación
                                </h3>
                            </div>
                            {business.lat && business.lng && (
                                <div className="w-full h-48 relative z-0">
                                    <div ref={mapRef} className="w-full h-full"></div>
                                </div>
                            )}
                            <div className="p-4">
                                <p className="text-sm text-gray-600 mb-3">{business.address}</p>
                                <div className="flex gap-2">
                                    <button onClick={openInGoogleMaps} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-2 rounded flex items-center justify-center gap-1 transition-colors">
                                        <GoogleMapsIcon /> Maps
                                    </button>
                                    <button onClick={openInWaze} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 px-2 rounded flex items-center justify-center gap-1 transition-colors">
                                        <WazeIcon /> Waze
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Services Tags */}
                        {business.services && business.services.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-3">Servicios</h3>
                                <div className="flex flex-wrap gap-2">
                                    {business.services.map(s => (
                                        <span key={s} className="bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content: Description & Products */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Sobre Nosotros</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {business.description}
                            </p>
                        </div>

                        {/* Products Grid */}
                        <div>
                            <h3 className="font-bold text-2xl mb-6 text-gray-800 flex items-center gap-2 border-l-4 border-brand-secondary pl-3">
                                Productos y Servicios Destacados
                            </h3>
                            
                            {business.products && business.products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {business.products.map(product => (
                                        <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300">
                                            <div className="h-48 bg-gray-100 overflow-hidden relative">
                                                <img 
                                                    src={product.imageUrl || (product.imageUrls && product.imageUrls[0]) || 'https://placehold.co/300'} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                />
                                                {product.imageUrls && product.imageUrls.length > 1 && (
                                                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                                        +{product.imageUrls.length - 1} fotos
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <h4 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{product.name}</h4>
                                                <p className="text-brand-primary font-black text-xl mb-2">S/ {product.price}</p>
                                                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{product.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-10 rounded-xl text-center text-gray-500 border border-dashed">
                                    Este negocio aún no ha subido productos.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetailPage;
