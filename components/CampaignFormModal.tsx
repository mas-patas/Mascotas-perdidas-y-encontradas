
import React, { useState, useEffect, useRef } from 'react';
import type { Campaign, CampaignType } from '../types';
import { CAMPAIGN_TYPES } from '../constants';
import { XCircleIcon, LocationMarkerIcon, CrosshairIcon } from './icons';
import { uploadImage } from '../utils/imageUtils';


interface CampaignFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (campaign: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => void;
    campaignToEdit?: Campaign | null;
}

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ isOpen, onClose, onSave, campaignToEdit }) => {
    const isEditMode = !!campaignToEdit;
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const isUpdatingFromMapRef = useRef(false);
    
    // Safety guard against unmounted state updates
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<CampaignType>(CAMPAIGN_TYPES.ESTERILIZACION);
    const [date, setDate] = useState('');
    const [location, setLocation] = useState(''); // Used as address now
    const [contactPhone, setContactPhone] = useState('');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (isOpen && campaignToEdit) {
            setTitle(campaignToEdit.title);
            setDescription(campaignToEdit.description);
            setType(campaignToEdit.type);
            setDate(campaignToEdit.date.split('T')[0]);
            setLocation(campaignToEdit.location);
            setContactPhone(campaignToEdit.contactPhone || '');
            setImagePreviews(campaignToEdit.imageUrls);
            setLat(campaignToEdit.lat);
            setLng(campaignToEdit.lng);
        } else {
            setTitle('');
            setDescription('');
            setType(CAMPAIGN_TYPES.ESTERILIZACION);
            setDate(new Date().toISOString().split('T')[0]);
            setLocation('');
            setContactPhone('');
            setImagePreviews([]);
            setLat(undefined);
            setLng(undefined);
        }
    }, [isOpen, campaignToEdit]);

    // Initialize Map
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isMounted.current) return;
            if (!mapRef.current || !isOpen) return;
            
            const L = (window as any).L;
            if (!L) return;
            
            // Update function for reverse geocoding
            const updateAddressFromCoords = async (latitude: number, longitude: number) => {
                if (!isMounted.current) return;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.display_name && isMounted.current) {
                        isUpdatingFromMapRef.current = true;
                        // Use display_name for campaigns as it's more descriptive for events
                        setLocation(data.display_name);
                        setTimeout(() => { if(isMounted.current) isUpdatingFromMapRef.current = false; }, 2000);
                    }
                } catch (err) {
                    console.error("Reverse geocoding error", err);
                }
            };

            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
                if (lat && lng) {
                    mapInstance.current.setView([lat, lng], 15);
                    if (!markerInstance.current) {
                        const icon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                            iconSize: [30, 42],
                            iconAnchor: [15, 42]
                        });
                         markerInstance.current = L.marker([lat, lng], { 
                            icon: icon,
                            draggable: true 
                        }).addTo(mapInstance.current);
                         markerInstance.current.on('dragend', (event: any) => {
                            if (!isMounted.current) return;
                            const position = event.target.getLatLng();
                            setLat(position.lat);
                            setLng(position.lng);
                            updateAddressFromCoords(position.lat, position.lng);
                        });
                    } else {
                        markerInstance.current.setLatLng([lat, lng]);
                    }
                }
                return;
            }

            // Default center (Lima)
            const initialLat = lat || -12.046374;
            const initialLng = lng || -77.042793;

            mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });
            
            if (lat && lng) {
                markerInstance.current = L.marker([lat, lng], { 
                    icon: icon,
                    draggable: true 
                }).addTo(mapInstance.current);
                 markerInstance.current.on('dragend', (event: any) => {
                    if (!isMounted.current) return;
                    const position = event.target.getLatLng();
                    setLat(position.lat);
                    setLng(position.lng);
                    updateAddressFromCoords(position.lat, position.lng);
                });
            }

            mapInstance.current.on('click', (e: any) => {
                if (!isMounted.current) return;
                const { lat, lng } = e.latlng;
                
                if (markerInstance.current) {
                    markerInstance.current.setLatLng([lat, lng]);
                } else {
                    markerInstance.current = L.marker([lat, lng], { 
                        icon: icon,
                        draggable: true 
                    }).addTo(mapInstance.current);
                    
                    markerInstance.current.on('dragend', (event: any) => {
                        if (!isMounted.current) return;
                        const position = event.target.getLatLng();
                        setLat(position.lat);
                        setLng(position.lng);
                        updateAddressFromCoords(position.lat, position.lng);
                    });
                }
                setLat(lat);
                setLng(lng);
                updateAddressFromCoords(lat, lng);
            });
            
            setTimeout(() => {
                if (isMounted.current && mapInstance.current) mapInstance.current.invalidateSize();
            }, 200);

        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [isOpen]);


    // Geocoding Logic for Campaign Location
    useEffect(() => {
        if (!location || isUpdatingFromMapRef.current) return;

        const timeoutId = setTimeout(async () => {
            if (!isMounted.current) return;
            try {
                const query = `${location}, Peru`;
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data && data.length > 0 && isMounted.current) {
                    const { lat, lon } = data[0];
                    const newLat = parseFloat(lat);
                    const newLng = parseFloat(lon);

                    setLat(newLat);
                    setLng(newLng);

                    if (mapInstance.current) {
                        mapInstance.current.invalidateSize(); // Fix: Ensure map is resized properly
                        mapInstance.current.setView([newLat, newLng], 16);
                        
                        const L = (window as any).L;
                        const icon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                            iconSize: [30, 42],
                            iconAnchor: [15, 42]
                        });

                        if (markerInstance.current) {
                            markerInstance.current.setLatLng([newLat, newLng]);
                        } else {
                            markerInstance.current = L.marker([newLat, newLng], { 
                                icon: icon,
                                draggable: true 
                            }).addTo(mapInstance.current);
                             markerInstance.current.on('dragend', (event: any) => {
                                if (!isMounted.current) return;
                                const position = event.target.getLatLng();
                                setLat(position.lat);
                                setLng(position.lng);
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Geocoding error:", error);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [location]);

    if (!isOpen) return null;
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if (imagePreviews.length + files.length > 3) {
                setError('Puedes subir un máximo de 3 fotos.');
                return;
            }
            
            setIsUploading(true);
            setError('');
            
            const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const newImages: string[] = [];

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files.item(i);
                    if (file) {
                        if (!supportedTypes.includes(file.type)) {
                            setError('Formato de archivo no soportado. Por favor, usa JPEG, PNG, o WEBP.');
                            continue;
                        }
                        const publicUrl = await uploadImage(file);
                        newImages.push(publicUrl);
                    }
                }
                if (isMounted.current) {
                    setImagePreviews(prev => [...prev, ...newImages]);
                }
            } catch (err: any) {
                console.error("Error uploading image:", err);
                if (isMounted.current) {
                    setError("Error al subir la imagen. Intenta de nuevo.");
                }
            } finally {
                if (isMounted.current) setIsUploading(false);
            }
        }
    };
    
    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("La geolocalización no es soportada por este navegador.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                if (!isMounted.current) return;
                const { latitude, longitude } = position.coords;
                
                setLat(latitude);
                setLng(longitude);

                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                    mapInstance.current.setView([latitude, longitude], 16);

                    const L = (window as any).L;
                    if (markerInstance.current) {
                        markerInstance.current.setLatLng([latitude, longitude]);
                    } else {
                        const icon = L.divIcon({
                             className: 'custom-div-icon',
                             html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                             iconSize: [30, 42],
                             iconAnchor: [15, 42]
                         });
                        markerInstance.current = L.marker([latitude, longitude], { icon, draggable: true }).addTo(mapInstance.current);
                         markerInstance.current.on('dragend', (event: any) => {
                             if (!isMounted.current) return;
                             const pos = event.target.getLatLng();
                             setLat(pos.lat);
                             setLng(pos.lng);
                         });
                    }
                }

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.display_name && isMounted.current) {
                        isUpdatingFromMapRef.current = true;
                        setLocation(data.display_name);
                        setTimeout(() => { if (isMounted.current) isUpdatingFromMapRef.current = false; }, 2000);
                    }
                } catch (error) {
                    console.error("Error reversing location", error);
                }
            },
            (error: GeolocationPositionError) => {
                console.error("Error getting location", error.message);
                alert("No se pudo obtener tu ubicación. Asegúrate de dar permisos.");
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title || !description || !location || !date || imagePreviews.length === 0) {
            setError('Todos los campos, incluyendo al menos una imagen, son obligatorios.');
            return;
        }

        const campaignData: Omit<Campaign, 'id' | 'userEmail'> = {
            title,
            description,
            type,
            location,
            date: new Date(date).toISOString(),
            imageUrls: imagePreviews,
            contactPhone,
            lat,
            lng,
        };

        onSave(campaignData, campaignToEdit?.id);
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-brand-dark">{isEditMode ? 'Editar Campaña' : 'Crear Nueva Campaña'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}
                        
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-900">Título de la Campaña</label>
                            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Tipo</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setType(CAMPAIGN_TYPES.ESTERILIZACION)}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === CAMPAIGN_TYPES.ESTERILIZACION ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Esterilización
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType(CAMPAIGN_TYPES.ADOPCION)}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === CAMPAIGN_TYPES.ADOPCION ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Adopción
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-900">Fecha</label>
                                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-900">Lugar / Dirección</label>
                                <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Ej: Parque Central, Miraflores, Lima" required />
                            </div>
                            <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-900">Teléfono de Contacto (Opcional)</label>
                                <input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} placeholder="987654321" />
                            </div>
                        </div>
                        
                        {/* Map Section */}
                        <div>
                             <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-medium text-gray-900">Ubicación exacta del evento</label>
                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    className="flex items-center gap-2 text-sm font-bold text-white transition-colors bg-emerald-500 px-3 py-1.5 rounded-lg shadow hover:bg-emerald-600"
                                    title="Usar mi ubicación actual"
                                >
                                    <CrosshairIcon /> Usar mi ubicación actual
                                </button>
                            </div>
                            <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-300 relative">
                                <div ref={mapRef} className="w-full h-full z-0" />
                            </div>
                             <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <LocationMarkerIcon /> El mapa se actualiza al escribir. Mueve el pin para ajustar la dirección.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-900">Descripción</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputClass} required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">Imágenes (hasta 3)</label>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-100" disabled={imagePreviews.length >= 3 || isUploading} />
                            {isUploading && <p className="text-sm text-blue-600 mt-1">Subiendo imágenes...</p>}
                            {imagePreviews.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative">
                                            <img src={preview} alt={`Vista previa ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                                            <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-700">
                                                <XCircleIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" disabled={isUploading} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed">
                            {isUploading ? 'Subiendo...' : (isEditMode ? 'Guardar Cambios' : 'Crear Campaña')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CampaignFormModal;
