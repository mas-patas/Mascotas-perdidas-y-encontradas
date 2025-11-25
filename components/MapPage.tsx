
import React, { useEffect, useRef, useState } from 'react';
import type { Pet, Campaign } from '../types';
import { PET_STATUS } from '../constants';
import { locationCoordinates } from '../data/locations';
import { SearchIcon, CrosshairIcon, ChevronDownIcon } from './icons';
import { supabase } from '../services/supabaseClient';

interface MapPageProps {
    pets: Pet[]; // Kept for type compatibility
    onNavigate: (path: string) => void;
}

const MapPage: React.FC<MapPageProps> = ({ onNavigate }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerClusterGroupRef = useRef<any>(null);
    const boundaryLayerRef = useRef<any>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);
    const [visibleStatuses, setVisibleStatuses] = useState({
        [PET_STATUS.PERDIDO]: true,
        [PET_STATUS.ENCONTRADO]: true,
        [PET_STATUS.AVISTADO]: true,
        [PET_STATUS.EN_ADOPCION]: true,
        'CAMPAIGNS': true,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapPets, setMapPets] = useState<Pet[]>([]);
    const [mapCampaigns, setMapCampaigns] = useState<Campaign[]>([]);
    const [isLoadingMapData, setIsLoadingMapData] = useState(true);

    // Helper to add small random offset to prevent stacking
    const getJitteredCoords = (lat: number, lng: number) => {
        const jitter = 0.0005;
        return {
            lat: lat + (Math.random() - 0.5) * jitter,
            lng: lng + (Math.random() - 0.5) * jitter
        };
    };

    const handleToggleStatus = (status: string) => {
        setVisibleStatuses(prev => ({ ...prev, [status]: !prev[status as keyof typeof prev] }));
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const query = `${searchQuery}, Peru`; // Bias to Peru
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&polygon_geojson=1&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                const { lat, lon, geojson } = result;
                const L = (window as any).L;

                if (mapInstance.current && L) {
                    // Remove previous boundary if exists
                    if (boundaryLayerRef.current) {
                        mapInstance.current.removeLayer(boundaryLayerRef.current);
                        boundaryLayerRef.current = null;
                    }

                    // If GeoJSON polygon data is present, draw it
                    if (geojson && (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon')) {
                        boundaryLayerRef.current = L.geoJSON(geojson, {
                            style: {
                                color: 'red',
                                weight: 3,
                                opacity: 0.8,
                                fillOpacity: 0.1,
                                fillColor: 'red'
                            }
                        }).addTo(mapInstance.current);
                        
                        // Zoom to fit the polygon
                        mapInstance.current.fitBounds(boundaryLayerRef.current.getBounds());
                    } else {
                        // Standard flyTo if no polygon (e.g. a point address)
                        mapInstance.current.flyTo([parseFloat(lat), parseFloat(lon)], 14);
                    }
                }
            } else {
                alert('No se encontró la ubicación.');
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

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
        }, () => {
            alert("No se pudo obtener tu ubicación.");
        });
    };

    // Fetch ALL pets and campaigns with coordinates for the map
    useEffect(() => {
        let mounted = true;

        // Safety timeout to ensure loading state doesn't stick forever
        // Increased to 15s to prevent false positives on cold starts
        const safetyTimer = setTimeout(() => {
            if (mounted) {
                // Quietly stop loading if it takes too long, removed console warning
                setIsLoadingMapData(false);
            }
        }, 15000);

        const fetchMapData = async () => {
            if (mounted) setIsLoadingMapData(true);
            const now = new Date();
            const nowIso = now.toISOString();

            try {
                // 1. Fetch Pets
                let { data: petData, error: petError } = await supabase
                    .from('pets')
                    .select('id, status, name, animal_type, breed, color, location, lat, lng, image_urls, created_at, expires_at, reward, currency')
                    .not('lat', 'is', null)
                    .not('lng', 'is', null)
                    .gt('expires_at', nowIso);

                // 2. Fetch Campaigns
                const { data: campaignData, error: campaignError } = await supabase
                    .from('campaigns')
                    .select('*')
                    .not('lat', 'is', null)
                    .not('lng', 'is', null)
                    .gte('date', nowIso.split('T')[0]); // Only future or today campaigns

                if (petError) {
                    console.warn("Map: Primary pet fetch failed, using fallback.", petError.message);
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('pets')
                        .select('id, status, name, animal_type, breed, color, location, lat, lng, image_urls, created_at, reward, currency')
                        .not('lat', 'is', null)
                        .not('lng', 'is', null);

                    if (!fallbackError && fallbackData) {
                        petData = fallbackData.filter((p: any) => {
                            const created = new Date(p.created_at);
                            const expires = new Date(created.getTime() + (60 * 24 * 60 * 60 * 1000));
                            return expires > now;
                        });
                    }
                }

                if (mounted) {
                    // Map to Pet type
                    const mappedPets: Pet[] = (petData || []).map((p: any) => ({
                        id: p.id,
                        userEmail: '',
                        status: p.status,
                        name: p.name,
                        animalType: p.animal_type,
                        breed: p.breed,
                        color: p.color,
                        location: p.location,
                        date: '',
                        contact: '',
                        description: '',
                        imageUrls: p.image_urls || [],
                        lat: p.lat,
                        lng: p.lng,
                        reward: p.reward,
                        currency: p.currency,
                        createdAt: p.created_at,
                        expiresAt: p.expires_at
                    }));

                    const mappedCampaigns: Campaign[] = (campaignData || []).map((c: any) => ({
                        id: c.id,
                        userEmail: c.user_email,
                        type: c.type,
                        title: c.title,
                        description: c.description,
                        location: c.location,
                        date: c.date,
                        imageUrls: c.image_urls || [],
                        contactPhone: c.contact_phone,
                        lat: c.lat,
                        lng: c.lng
                    }));

                    setMapPets(mappedPets);
                    setMapCampaigns(mappedCampaigns);
                }
            } catch (err) {
                console.error("Error loading map data:", err);
            } finally {
                // Important: Clear the safety timer if data loaded successfully to prevent the warning
                clearTimeout(safetyTimer);
                if (mounted) setIsLoadingMapData(false);
            }
        };

        fetchMapData();

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
        };
    }, []);

    // 1. Map Initialization and Cleanup Effect
    useEffect(() => {
        if (!mapRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        // Initialize map if not already done
        if (!mapInstance.current) {
            const map = L.map(mapRef.current, { zoomControl: false }).setView([-12.046374, -77.042793], 12); // Default to Lima

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            
            mapInstance.current = map;

            // Initialize Marker Cluster Group
            if (L.markerClusterGroup) {
                markerClusterGroupRef.current = L.markerClusterGroup({
                    showCoverageOnHover: false,
                    maxClusterRadius: 50,
                });
                map.addLayer(markerClusterGroupRef.current);
            } else {
                console.warn("Leaflet.markercluster plugin not loaded.");
            }
        }

        // Cleanup on unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerClusterGroupRef.current = null;
                boundaryLayerRef.current = null;
            }
        };
    }, []);

    // 2. Marker Updates Effect
    useEffect(() => {
        if (!mapInstance.current) return; // Wait for map init

        const L = (window as any).L;
        if (!L) return;

        // Clear existing markers
        if (markerClusterGroupRef.current) {
            markerClusterGroupRef.current.clearLayers();
        } else {
             mapInstance.current.eachLayer((layer: any) => {
                if (layer instanceof L.Marker) {
                    mapInstance.current.removeLayer(layer);
                }
            });
        }

        // Define custom icon HTML generator
        const createCustomIcon = (status: string, iconSVG: string, isCampaign = false) => {
            let statusClass = 'lost';
            if (isCampaign) statusClass = 'sighted'; 
            else if (status === PET_STATUS.ENCONTRADO) statusClass = 'found';
            else if (status === PET_STATUS.AVISTADO) statusClass = 'sighted';
            else if (status === PET_STATUS.EN_ADOPCION) statusClass = 'adoption';

            // Override background for campaigns to distinct indigo
            const styleOverride = isCampaign ? 'background-color: #4F46E5;' : '';

            return L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='marker-pin ${statusClass}' style='${styleOverride}'></div>${iconSVG}`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });
        };

        const dogIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM8 14s1.5 2 4 2 4-2 4-2M9 10h6"/><path d="M12 14v6a2 2 0 002 2h2a2 2 0 00-2-2h-2M12 14v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 012-2h2"/><path d="M5 8a3 3 0 016 0c0 1.5-3 4-3 4s-3-2.5-3-4zM19 8a3 3 0 00-6 0c0 1.5 3 4 3 4s3-2.5 3-4z"/></svg>`;
        const catIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2zM9 12s1.5 2 3 2 3-2 3-2M9 9h6"/><path d="M20 12c0 4-4 8-8 8s-8-4-8-8 4-8 8-8 8 4 8 8zM5 8l-2 2M19 8l2 2"/></svg>`;
        const otherIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zm-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8-8 3.582-8 8zm0 0h16" /></svg>`;
        const megaphoneIconSVG = `<svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.136A1.76 1.76 0 015.882 11H3a1 1 0 01-1-1V8a1 1 0 011-1h2.882a1.76 1.76 0 011.649.931l2.147 6.136-1.09-3.115A1.76 1.76 0 0110.232 5h1.232c1.026 0 1.943.684 2.247 1.647L15 12l-1.09-3.115"/></svg>`;

        const markersToAdd: any[] = [];

        // Add Pets
        mapPets.forEach(pet => {
            if (!visibleStatuses[pet.status as keyof typeof visibleStatuses]) return;

            let lat = pet.lat;
            let lng = pet.lng;

            if (!lat || !lng) {
                const locationText = pet.location || "";
                let foundCity = Object.keys(locationCoordinates).find(city => locationText.includes(city));
                if (foundCity) {
                    const baseCoords = locationCoordinates[foundCity];
                    const jittered = getJitteredCoords(baseCoords.lat, baseCoords.lng);
                    lat = jittered.lat;
                    lng = jittered.lng;
                }
            }

            if (lat && lng) {
                const iconSVG = pet.animalType === 'Perro' ? dogIconSVG : (pet.animalType === 'Gato' ? catIconSVG : otherIconSVG);
                const marker = L.marker([lat, lng], { icon: createCustomIcon(pet.status, iconSVG) })
                    .bindPopup(`
                        <div class="text-center min-w-[150px]">
                            <img src="${pet.imageUrls?.[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'}" alt="${pet.name}" class="w-full h-28 object-cover rounded-md mb-2" />
                            <strong class="block text-lg font-bold text-gray-800">${pet.name}</strong>
                            <div class="flex flex-wrap justify-center gap-1 mb-2">
                                <span class="text-xs uppercase font-bold px-2 py-0.5 rounded-full text-white inline-block
                                    ${pet.status === PET_STATUS.PERDIDO ? 'bg-red-500' : 
                                    pet.status === PET_STATUS.ENCONTRADO ? 'bg-green-500' : 
                                    pet.status === PET_STATUS.AVISTADO ? 'bg-blue-500' : 'bg-purple-500'}">
                                    ${pet.status}
                                </span>
                                ${pet.reward ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-green-800 bg-green-100 border border-green-200 rounded-full shadow-sm">💵 Recompensa</span>` : ''}
                            </div>
                            <p class="text-sm text-gray-600 mb-2">${pet.breed}</p>
                            <button onclick="window.location.hash = '#/mascota/${pet.id}'" class="block w-full bg-brand-primary text-white text-sm py-1.5 px-3 rounded hover:bg-brand-dark transition-colors">
                                Ver Detalles
                            </button>
                        </div>
                    `);
                
                markersToAdd.push(marker);
            }
        });

        // Add Campaigns
        if (visibleStatuses['CAMPAIGNS']) {
            mapCampaigns.forEach(campaign => {
                if (campaign.lat && campaign.lng) {
                    const marker = L.marker([campaign.lat, campaign.lng], { icon: createCustomIcon('campaign', megaphoneIconSVG, true) })
                        .bindPopup(`
                            <div class="text-center min-w-[180px]">
                                <img src="${campaign.imageUrls?.[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Sin+Imagen'}" alt="${campaign.title}" class="w-full h-28 object-cover rounded-md mb-2" />
                                <strong class="block text-md font-bold text-indigo-900 leading-tight mb-1">${campaign.title}</strong>
                                <span class="text-xs font-bold px-2 py-0.5 rounded-full text-white mb-2 inline-block bg-indigo-500">
                                    ${campaign.type}
                                </span>
                                <p class="text-xs text-gray-600 mb-1">📅 ${new Date(campaign.date).toLocaleDateString()}</p>
                                <p class="text-xs text-gray-500 mb-2 truncate">${campaign.location}</p>
                                <button onclick="window.location.hash = '#/campanas/${campaign.id}'" class="block w-full bg-indigo-600 text-white text-sm py-1.5 px-3 rounded hover:bg-indigo-700 transition-colors">
                                    Ver Campaña
                                </button>
                            </div>
                        `);
                    markersToAdd.push(marker);
                }
            });
        }

        if (markerClusterGroupRef.current) {
            markerClusterGroupRef.current.addLayers(markersToAdd);
        } else {
            markersToAdd.forEach(m => m.addTo(mapInstance.current));
        }

    }, [mapPets, mapCampaigns, visibleStatuses]); 

    return (
        <div className="h-full flex flex-col relative">
            {/* Loading Overlay */}
            {isLoadingMapData && (
                <div className="absolute inset-0 bg-white bg-opacity-75 z-[2000] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-2"></div>
                    <p className="text-brand-primary font-semibold">Cargando mapa...</p>
                </div>
            )}

            {/* Top Bar Overlay for Controls */}
            <div className="absolute top-4 left-4 right-4 z-[10] flex flex-col sm:flex-row justify-between items-start pointer-events-none gap-4">
                
                {/* Search Bar */}
                <div className="pointer-events-auto w-full sm:w-80 bg-white rounded-lg shadow-lg overflow-hidden flex z-[10]">
                    <form onSubmit={handleSearch} className="flex w-full">
                        <input 
                            type="text" 
                            placeholder="Buscar zona (ej. Miraflores)" 
                            className="flex-grow p-3 text-sm outline-none text-black bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="bg-brand-primary text-white p-3 hover:bg-brand-dark transition-colors">
                            {isSearching ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SearchIcon />}
                        </button>
                    </form>
                </div>

                {/* Filters Toggle */}
                <div className="pointer-events-auto bg-white rounded-lg shadow-lg overflow-hidden z-[10]">
                    <button 
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)} 
                        className="w-full flex items-center justify-between gap-3 p-3 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700"
                    >
                        <span>Filtros de Mapa</span>
                        <div className={`transform transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </div>
                    </button>
                    
                    {isFiltersOpen && (
                        <div className="p-3 pt-0 bg-white border-t border-gray-100 space-y-2">
                            {[
                                { id: PET_STATUS.PERDIDO, label: 'Perdidos', color: 'bg-red-500' },
                                { id: PET_STATUS.ENCONTRADO, label: 'Encontrados', color: 'bg-green-500' },
                                { id: PET_STATUS.AVISTADO, label: 'Avistados', color: 'bg-blue-500' },
                                { id: PET_STATUS.EN_ADOPCION, label: 'En Adopción', color: 'bg-purple-500' },
                                { id: 'CAMPAIGNS', label: 'Campañas', color: 'bg-indigo-600' }
                            ].map(status => (
                                <label key={status.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={visibleStatuses[status.id as keyof typeof visibleStatuses]} 
                                        onChange={() => handleToggleStatus(status.id)}
                                        className="rounded text-brand-primary focus:ring-brand-primary"
                                    />
                                    <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                                    <span className="text-sm text-gray-600">{status.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Right Controls */}
            <div className="absolute bottom-8 right-4 z-[10] flex flex-col gap-2 pointer-events-auto">
                <button 
                    onClick={handleMyLoc}
                    className="bg-white p-2.5 rounded shadow-lg hover:bg-gray-100 text-brand-primary flex items-center justify-center"
                    title="Mi Ubicación"
                >
                    <CrosshairIcon />
                </button>
            </div>

            <div className="flex-grow relative z-0">
                <div id="map" ref={mapRef} className="absolute inset-0 w-full h-full"></div>
            </div>
        </div>
    );
};

export default MapPage;
