
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessService } from '@/services/businessService';
import { Business } from '@/types';
import { SearchIcon, CrosshairIcon, StoreIcon, MedicalIcon, ShoppingBagIcon, ScissorsIcon, StarIcon } from '@/shared/components/icons';
import { BUSINESS_TYPES } from '@/constants';

const ServicesMapPage: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerClusterGroupRef = useRef<any>(null);
    const navigate = useNavigate();
    
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Businesses
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const data = await businessService.getAllBusinesses();
            setBusinesses(data);
            setLoading(false);
        };
        fetch();
    }, []);

    const filteredBusinesses = businesses.filter(b => {
        const matchesTab = activeTab === 'ALL' || b.type === activeTab;
        const matchesSearch = searchQuery === '' || 
                              b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              b.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Initialize Map (Only when viewMode is map)
    useEffect(() => {
        if (viewMode !== 'map' || !mapRef.current) return;
        
        const L = (window as any).L;
        if (!L) return;

        if (!mapInstance.current) {
            const map = L.map(mapRef.current, { zoomControl: false }).setView([-12.046374, -77.042793], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            mapInstance.current = map;

            if (L.markerClusterGroup) {
                markerClusterGroupRef.current = L.markerClusterGroup({
                    showCoverageOnHover: false,
                    maxClusterRadius: 50,
                });
                map.addLayer(markerClusterGroupRef.current);
            }
        } else {
            mapInstance.current.invalidateSize();
        }

        // Cleanup only if component unmounts, typically we want to keep instance if just hiding
        return () => {
            // Keeping map instance alive for toggling performance usually better, 
            // but here we can just rely on the ref check
        };
    }, [viewMode]);

    // Update Markers
    useEffect(() => {
        if (viewMode !== 'map' || !mapInstance.current) return;
        const L = (window as any).L;
        
        if (markerClusterGroupRef.current) {
            markerClusterGroupRef.current.clearLayers();
        }

        const markersToAdd: any[] = [];

        filteredBusinesses.forEach(biz => {
            if (!biz.lat || !biz.lng) return;

            const isVet = biz.type === BUSINESS_TYPES.VETERINARIA;
            
            // Use thick red cross for Veterinarians
            const medicalIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M18 10h-4V6a2 2 0 00-4 0v4H6a2 2 0 000 4h4v4a2 2 0 004 0v-4h4a2 2 0 000-4z" /></svg>`;
            const storeIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`;

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='marker-pin ${isVet ? 'lost' : 'sighted'}' style='background-color: ${isVet ? '#EF4444' : '#3B82F6'}'></div>${isVet ? medicalIconSVG : storeIconSVG}`,
                iconSize: [25, 35],
                iconAnchor: [12, 35]
            });

            const popupContent = `
                <div class="text-center min-w-[180px]">
                    ${biz.logoUrl ? `<img src="${biz.logoUrl}" class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-gray-200" />` : ''}
                    <strong class="block text-lg font-bold text-gray-900">${biz.name}</strong>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full text-white inline-block mb-2 ${isVet ? 'bg-red-500' : 'bg-blue-500'}">
                        ${biz.type}
                    </span>
                    <p class="text-xs text-gray-600 mb-2">${biz.address}</p>
                    <button onclick="window.location.hash = '#/negocio/${biz.id}'" class="block w-full bg-gray-900 text-white text-sm py-1.5 px-3 rounded hover:bg-gray-700 transition-colors">
                        Ver Tienda
                    </button>
                </div>
            `;

            const marker = L.marker([biz.lat, biz.lng], { icon })
                .bindPopup(popupContent, {
                    maxWidth: 250,
                    className: 'custom-popup',
                    closeButton: true,
                    autoPan: true,
                    autoPanPadding: [50, 50],
                    autoPanPaddingTopLeft: [50, 50],
                    autoPanPaddingBottomRight: [50, 50]
                });
            
            // Update popup size when it opens and after image loads
            marker.on('popupopen', function() {
                const popup = marker.getPopup();
                if (popup) {
                    // Update immediately
                    popup.update();
                    
                    // Update again after a short delay to ensure images are loaded
                    setTimeout(() => {
                        popup.update();
                    }, 100);
                    
                    // Also update when images inside the popup load
                    const popupElement = popup.getElement();
                    if (popupElement) {
                        const images = popupElement.querySelectorAll('img');
                        images.forEach((img: HTMLImageElement) => {
                            if (!img.complete) {
                                img.addEventListener('load', () => {
                                    popup.update();
                                }, { once: true });
                            }
                        });
                    }
                }
            });
            
            markersToAdd.push(marker);
        });

        if (markerClusterGroupRef.current) {
            markerClusterGroupRef.current.addLayers(markersToAdd);
        }

    }, [filteredBusinesses, viewMode]);

    const handleMyLoc = () => {
       if (!navigator.geolocation) {
           alert("Geolocalización no soportada.");
           return;
       }
       navigator.geolocation.getCurrentPosition((pos) => {
           const { latitude, longitude } = pos.coords;
           if (mapInstance.current) {
               mapInstance.current.flyTo([latitude, longitude], 15);
           }
       });
   };

   // Helper for Tab Button
   const TabButton = ({ id, label, icon }: { id: string, label: string, icon?: React.ReactNode }) => (
       <button
           onClick={() => setActiveTab(id)}
           className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-all border-b-4 whitespace-nowrap ${
               activeTab === id 
               ? 'border-white text-white bg-white/10' 
               : 'border-transparent text-purple-200 hover:text-white hover:bg-white/5'
           }`}
       >
           {icon} {label}
       </button>
   );

    return (
        <div className="h-full flex flex-col">
            {/* Header / Tabs Section (Gamification Dashboard Style) */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white relative overflow-hidden shrink-0 shadow-md rounded-xl mb-4">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <div className="relative z-10 p-6 pb-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-wide flex items-center gap-2">
                                <StoreIcon className="h-8 w-8" /> Directorio de Servicios
                            </h2>
                            <p className="opacity-80 text-sm font-medium mt-1">Encuentra veterinarias, tiendas y servicios confiables.</p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative w-full md:w-72">
                            <input 
                                type="text" 
                                placeholder="Buscar servicio..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                            <SearchIcon className="absolute left-3 top-2.5 text-purple-200 h-4 w-4" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto no-scrollbar">
                        <TabButton id="ALL" label="Todos" icon={<StarIcon className="h-4 w-4" />} />
                        <TabButton id={BUSINESS_TYPES.VETERINARIA} label="Veterinarias" icon={<MedicalIcon className="h-4 w-4" />} />
                        <TabButton id={BUSINESS_TYPES.PET_SHOP} label="Pet Shops" icon={<ShoppingBagIcon className="h-4 w-4" />} />
                        <TabButton id={BUSINESS_TYPES.ESTETICA} label="Estética" icon={<ScissorsIcon className="h-4 w-4" />} />
                        <TabButton id={BUSINESS_TYPES.HOTEL} label="Hospedaje" />
                    </div>
                </div>
            </div>

            {/* View Toggle & Content */}
            <div className="flex-grow flex flex-col">
                <div className="flex justify-start mb-4 px-2">
                    <div className="bg-gray-100 p-1 rounded-lg flex shadow-sm">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-brand-primary shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Lista
                        </button>
                        <button 
                            onClick={() => setViewMode('map')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white text-brand-primary shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Mapa Interactivo
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-primary"></div>
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 px-1">
                                {filteredBusinesses.length > 0 ? (
                                    filteredBusinesses.map(biz => (
                                        <div key={biz.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                                            <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                <img 
                                                    src={biz.coverUrl || 'https://placehold.co/600x300/e2e8f0/94a3b8?text=Negocio'} 
                                                    alt={biz.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                />
                                                <div className="absolute top-3 right-3 bg-white p-1 rounded-full shadow-md">
                                                    <img src={biz.logoUrl || 'https://placehold.co/100?text=L'} className="w-10 h-10 rounded-full object-cover" alt="logo" />
                                                </div>
                                                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full text-white ${biz.type === BUSINESS_TYPES.VETERINARIA ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                    {biz.type}
                                                </span>
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{biz.name}</h3>
                                                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                                    <CrosshairIcon className="h-3 w-3" /> {biz.address}
                                                </p>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                                                    {biz.description}
                                                </p>
                                                <button 
                                                    onClick={() => navigate(`/negocio/${biz.id}`)}
                                                    className="w-full py-2 bg-gray-50 text-brand-primary font-bold text-sm rounded-lg border border-gray-200 hover:bg-brand-primary hover:text-white transition-colors"
                                                >
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                            <StoreIcon className="text-gray-400 h-8 w-8" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No se encontraron servicios con los filtros actuales.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {viewMode === 'map' && (
                            <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                <div id="map" ref={mapRef} className="absolute inset-0 w-full h-full"></div>
                                <button 
                                    onClick={handleMyLoc} 
                                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 text-brand-primary z-[1000]"
                                    title="Mi Ubicación"
                                >
                                    <CrosshairIcon className="h-6 w-6" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ServicesMapPage;
