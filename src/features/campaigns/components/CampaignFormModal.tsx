import React, { useState, useEffect, useRef } from 'react';
import { XCircleIcon, LocationMarkerIcon, CameraIcon } from '@/shared/components/icons';
import { uploadImage } from '@/utils/imageUtils';
import { CAMPAIGN_TYPES } from '@/constants';
import { useCreateCampaign, useUpdateCampaign } from '@/api';
import type { Campaign } from '@/types';
import { departments, getProvinces, getDistricts } from '@/data/locations';

// Helper function to normalize location names for matching
const normalizeLocationName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/(provincia|departamento|distrito|region|municipalidad) de /g, "") 
        .trim();
};

interface CampaignFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    onSaveCampaign?: (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => void;
    campaignToEdit?: Campaign | null;
}

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess,
    onSaveCampaign,
    campaignToEdit 
}) => {
    const createCampaign = useCreateCampaign();
    const updateCampaign = useUpdateCampaign();
    const isEditMode = !!campaignToEdit;
    
    // Form state
    const [title, setTitle] = useState('');
    const [type, setType] = useState<string>(CAMPAIGN_TYPES.ESTERILIZACION);
    const [customType, setCustomType] = useState('');
    const [date, setDate] = useState('');
    const [address, setAddress] = useState('');
    const [department, setDepartment] = useState('Lima');
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);
    
    // Location dropdowns
    const [provinces, setProvinces] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    
    // UI state
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    
    // Map refs
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const isUpdatingFromMapRef = useRef(false);
    const reverseGeocodingAbortController = useRef<AbortController | null>(null);
    
    // Initialize provinces when department changes
    useEffect(() => {
        if (department) {
            const newProvinces = getProvinces(department);
            setProvinces(newProvinces);
            if (!newProvinces.includes(province)) {
                setProvince('');
                setDistrict('');
            }
        }
    }, [department]);
    
    // Initialize districts when province changes
    useEffect(() => {
        if (department && province) {
            const newDistricts = getDistricts(department, province);
            setDistricts(newDistricts);
            if (!newDistricts.includes(district)) {
                setDistrict('');
            }
        }
    }, [department, province]);
    
    // Initialize form with campaign data if editing
    useEffect(() => {
        if (isEditMode && campaignToEdit) {
            setTitle(campaignToEdit.title || '');
            setType(campaignToEdit.type || CAMPAIGN_TYPES.ESTERILIZACION);
            setDate(campaignToEdit.date ? new Date(campaignToEdit.date).toISOString().split('T')[0] : '');
            
            // Parse location string to extract address, department, province, district
            const locationString = campaignToEdit.location || '';
            const locationParts = locationString.split(',').map(s => s.trim());
            
            // Extract address (first part)
            if (locationParts.length > 0) {
                setAddress(locationParts[0] || '');
            }
            
            // Try to extract department, province, district from location string
            // Location format is typically: "address, district, province, department"
            // We'll try to match against our known departments, provinces, and districts
            let foundDept = '';
            let foundProv = '';
            let foundDist = '';
            
            // Reverse order: department, province, district (last parts of location string)
            for (let i = locationParts.length - 1; i >= 0; i--) {
                const part = locationParts[i];
                if (!part) continue;
                
                // Check if it's a department
                if (!foundDept) {
                    const deptMatch = departments.find(d => 
                        normalizeLocationName(d) === normalizeLocationName(part)
                    );
                    if (deptMatch) {
                        foundDept = deptMatch;
                        continue;
                    }
                }
                
                // Check if it's a province (only if we have a department)
                if (foundDept && !foundProv) {
                    const provs = getProvinces(foundDept);
                    const provMatch = provs.find(p => 
                        normalizeLocationName(p) === normalizeLocationName(part)
                    );
                    if (provMatch) {
                        foundProv = provMatch;
                        continue;
                    }
                }
                
                // Check if it's a district (only if we have province)
                if (foundDept && foundProv && !foundDist) {
                    const dists = getDistricts(foundDept, foundProv);
                    const distMatch = dists.find(d => 
                        normalizeLocationName(d) === normalizeLocationName(part)
                    );
                    if (distMatch) {
                        foundDist = distMatch;
                        continue;
                    }
                }
            }
            
            // Set extracted values or defaults
            if (foundDept) {
                setDepartment(foundDept);
                if (foundProv) {
                    setProvince(foundProv);
                    if (foundDist) {
                        setDistrict(foundDist);
                    }
                }
            }
            
            setPhone(campaignToEdit.contactPhone || '');
            setDescription(campaignToEdit.description || '');
            setImageUrls(campaignToEdit.imageUrls || []);
            setLat(campaignToEdit.lat);
            setLng(campaignToEdit.lng);
            
            // If we have coordinates but missing location hierarchy, perform reverse geocoding
            if (campaignToEdit.lat && campaignToEdit.lng && (!foundDept || !foundProv || !foundDist)) {
                // Will be triggered by the map initialization effect
            }
        } else {
            // Reset form
            setTitle('');
            setType(CAMPAIGN_TYPES.ESTERILIZACION);
            setCustomType('');
            setDate('');
            setAddress('');
            setDepartment('Lima');
            setProvince('');
            setDistrict('');
            setPhone('');
            setDescription('');
            setImageUrls([]);
            setLat(undefined);
            setLng(undefined);
        }
    }, [isEditMode, campaignToEdit, isOpen]);
    
    // Initialize map
    useEffect(() => {
        if (!isOpen || !mapRef.current || mapInstance.current) return;
        
        const timer = setTimeout(() => {
            if (typeof (window as any).L === 'undefined') {
                return;
            }
            
            const L = (window as any).L;
            if (!L || !mapRef.current) return;
            
            const initialLat = lat || -12.046374;
            const initialLng = lng || -77.042793;
            
            mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
                attribution: '© OpenStreetMap' 
            }).addTo(mapInstance.current);
            
            // Map click event
            mapInstance.current.on('click', (e: any) => {
                const { lat: clickedLat, lng: clickedLng } = e.latlng;
                setLat(clickedLat);
                setLng(clickedLng);
                updateMarker(clickedLat, clickedLng, true, true);
            });
            
            // Add initial marker if coordinates exist
            if (lat && lng) {
                updateMarker(lat, lng, false);
                // If we don't have address data, perform reverse geocoding
                if (!address || !department || !province || !district) {
                    performReverseGeocoding(lat, lng);
                }
            }
            
            mapInstance.current.invalidateSize();
        }, 100);
        
        return () => {
            clearTimeout(timer);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
            }
        };
    }, [isOpen]);
    
    // Update marker when lat/lng changes
    useEffect(() => {
        if (mapInstance.current && lat && lng) {
            updateMarker(lat, lng, false);
        }
    }, [lat, lng]);
    
    // Helper function to parse and set location hierarchy from reverse geocoding
    const parseAndSetHierarchy = (addr: any) => {
        if (!addr) return;
        
        // 1. Find Department
        const apiState = normalizeLocationName(addr.state || addr.region || '');
        const deptMatch = departments.find(d => normalizeLocationName(d) === apiState);
        
        if (deptMatch) {
            const newProvs = getProvinces(deptMatch);
            
            // 2. Find Province
            const apiProv = normalizeLocationName(addr.province || addr.region || addr.city || '');
            const provMatch = newProvs.find(p => normalizeLocationName(p) === apiProv);
            
            let newDists: string[] = [];
            let distMatch: string | null = null;
            
            if (provMatch) {
                newDists = getDistricts(deptMatch, provMatch);
                
                // 3. Find District
                const apiDist = normalizeLocationName(addr.city_district || addr.district || addr.town || addr.suburb || '');
                distMatch = newDists.find(d => normalizeLocationName(d) === apiDist) || null;
            }

            // Update provinces and districts lists first
            setProvinces(newProvs);
            if (newDists.length > 0) {
                setDistricts(newDists);
            }

            // Then update all form values at once
            setDepartment(deptMatch);
            if (provMatch) {
                setProvince(provMatch);
                if (distMatch) {
                    setDistrict(distMatch);
                }
            }
        }
    };
    
    // Reverse geocoding function
    const performReverseGeocoding = async (latitude: number, longitude: number, isRetry = false) => {
        isUpdatingFromMapRef.current = true;
        
        if (reverseGeocodingAbortController.current) {
            reverseGeocodingAbortController.current.abort();
        }
        reverseGeocodingAbortController.current = new AbortController();
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: { 'Accept-Language': 'es-ES,es;q=0.9' },
                    signal: reverseGeocodingAbortController.current.signal
                }
            );
            
            if (!response.ok) return;
            const data = await response.json();
            
            if (data && data.address) {
                const addr = data.address;
                
                // Construct basic street address
                let addressText = addr.road || addr.pedestrian || addr.footway || addr.path || '';
                if (addr.house_number) addressText += ` ${addr.house_number}`;
                
                // Fallbacks
                if (!addressText) {
                    addressText = addr.amenity || addr.building || addr.park || addr.leisure || '';
                }
                
                // Update address if we have one
                if (addressText) {
                    setAddress(addressText);
                }
                
                // Update location hierarchy
                parseAndSetHierarchy(addr);
                
                // If this is the first call (not a retry), make a second call after 1.5 seconds
                // to ensure district is set correctly after lists are updated
                if (!isRetry) {
                    setTimeout(() => {
                        performReverseGeocoding(latitude, longitude, true);
                    }, 1500);
                }
            }
        } catch (err: any) {
            // Ignore aborts
            if (err.name !== 'AbortError') {
                console.warn('Reverse geocoding error:', err);
            }
        } finally {
            // Release lock after delay
            setTimeout(() => {
                isUpdatingFromMapRef.current = false;
            }, 2000);
        }
    };
    
    const updateMarker = (latitude: number, longitude: number, shouldCenter: boolean, performReverseGeocode: boolean = false) => {
        const L = (window as any).L;
        if (!L || !mapInstance.current) return;
        
        if (shouldCenter && mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 15);
        }
        
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin found'></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
        
        if (markerInstance.current) {
            markerInstance.current.setLatLng([latitude, longitude]);
        } else {
            markerInstance.current = L.marker([latitude, longitude], { icon, draggable: true })
                .addTo(mapInstance.current);
            markerInstance.current.on('dragend', (e: any) => {
                const { lat: draggedLat, lng: draggedLng } = e.target.getLatLng();
                setLat(draggedLat);
                setLng(draggedLng);
                performReverseGeocoding(draggedLat, draggedLng);
            });
        }
        
        // Perform reverse geocoding when marker is moved
        if (performReverseGeocode) {
            performReverseGeocoding(latitude, longitude);
        }
    };
    
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocalización no soportada en tu navegador.');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLat(latitude);
                setLng(longitude);
                if (mapInstance.current) {
                    mapInstance.current.setView([latitude, longitude], 16);
                    updateMarker(latitude, longitude, false, true);
                }
            },
            () => {
                setError('No se pudo obtener tu ubicación.');
            }
        );
    };
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
        if (imageUrls.length + files.length > 5) {
            setError('Puedes subir un máximo de 5 fotos.');
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
            setImageUrls(prev => [...prev, ...newImages]);
        } catch (err: any) {
            console.error("Error uploading image:", err);
            setError("Error al subir la imagen. Intenta de nuevo.");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleRemoveImage = (indexToRemove: number) => {
        setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!title.trim()) {
            setError('El título de la campaña es obligatorio.');
            return;
        }
        
        if (!date) {
            setError('La fecha de la campaña es obligatoria.');
            return;
        }
        
        if (!address.trim()) {
            setError('La dirección es obligatoria.');
            return;
        }
        
        if (!department) {
            setError('El departamento es obligatorio.');
            return;
        }
        
        if (!province) {
            setError('La provincia es obligatoria.');
            return;
        }
        
        if (!district) {
            setError('El distrito es obligatorio.');
            return;
        }
        
        if (!description.trim()) {
            setError('La descripción es obligatoria.');
            return;
        }
        
        if (imageUrls.length === 0) {
            setError('Debes subir al menos una imagen.');
            return;
        }
        
        if (type === CAMPAIGN_TYPES.OTRO && !customType.trim()) {
            setError('Debes especificar el tipo de campaña.');
            return;
        }
        
        const finalType = type === CAMPAIGN_TYPES.OTRO ? customType.trim() : type;
        
        // Build location string from all parts
        const finalLocation = [address, district, province, department].filter(Boolean).join(', ');
        
        try {
            const campaignData = {
                title: title.trim(),
                type: finalType,
                date: new Date(date).toISOString(),
                location: finalLocation,
                contactPhone: phone.trim() || undefined,
                description: description.trim(),
                imageUrls: imageUrls,
                lat: lat,
                lng: lng
            };
            
            if (isEditMode && campaignToEdit) {
                // Update existing campaign
                await updateCampaign.mutateAsync({
                    id: campaignToEdit.id,
                    data: campaignData
                });
                
                // Call onSaveCampaign callback if provided (for parent component state updates)
                if (onSaveCampaign) {
                    onSaveCampaign(campaignData, campaignToEdit.id);
                }
            } else {
                // Create new campaign
                await createCampaign.mutateAsync(campaignData);
                
                // Call onSaveCampaign callback if provided (for parent component state updates)
                if (onSaveCampaign) {
                    onSaveCampaign(campaignData);
                }
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error saving campaign:", err);
            setError("Error al guardar la campaña: " + (err.message || 'Error desconocido'));
        }
    };
    
    if (!isOpen) return null;
    
    const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";
    const labelClass = "block text-sm font-bold text-gray-700 mb-1";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-auto">
                {/* Header */}
                <div className="p-6 border-b bg-gray-50 rounded-t-xl flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-brand-dark">
                            {isEditMode ? 'Editar Campaña' : 'Crear Nueva Campaña'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEditMode ? 'Actualiza los datos de la campaña.' : 'Completa todos los campos para crear una nueva campaña.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircleIcon className="h-8 w-8"/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                            {error}
                        </div>
                    )}
                    
                    {/* Título */}
                    <div>
                        <label className={labelClass}>
                            Título de la Campaña <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                            placeholder="Ej: Campaña de Esterilización Gratuita"
                            required
                        />
                    </div>
                    
                    {/* Tipo */}
                    <div>
                        <label className={labelClass}>
                            Tipo de Campaña <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className={inputClass}
                            required
                        >
                            <option value={CAMPAIGN_TYPES.ESTERILIZACION}>Esterilización</option>
                            <option value={CAMPAIGN_TYPES.VACUNACION}>Vacunación</option>
                            <option value={CAMPAIGN_TYPES.ADOPCION}>Adopción</option>
                            <option value={CAMPAIGN_TYPES.OTRO}>Otro</option>
                        </select>
                        
                        {type === CAMPAIGN_TYPES.OTRO && (
                            <div className="mt-2">
                                <label className={labelClass}>
                                    Especificar Tipo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ej: Desparasitación, Castración, etc."
                                    required
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Fecha y Teléfono */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                Fecha <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={inputClass}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Teléfono (Opcional)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={inputClass}
                                placeholder="999888777"
                            />
                        </div>
                    </div>
                    
                    {/* Ubicación */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <LocationMarkerIcon className="h-6 w-6 text-brand-primary"/> Ubicación
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Departamento <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    {departments.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Provincia <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={province}
                                    onChange={(e) => setProvince(e.target.value)}
                                    className={inputClass}
                                    disabled={!department}
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    {provinces.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Distrito <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    className={inputClass}
                                    disabled={!province}
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    {districts.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className={labelClass}>
                                Dirección o Referencia <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={inputClass}
                                placeholder="Ej: Parque Kennedy, Av. Larco 123"
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Mapa */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={labelClass}>
                                Ubicación en el Mapa
                            </label>
                            <button
                                type="button"
                                onClick={handleGetCurrentLocation}
                                className="text-xs bg-brand-light text-brand-primary px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1 border border-blue-200 transition-colors"
                            >
                                <LocationMarkerIcon className="h-3 w-3"/> Usar mi ubicación
                            </button>
                        </div>
                        <div className="w-full rounded-xl overflow-hidden border border-gray-300 relative z-0 shadow-inner" style={{ height: '300px' }}>
                            <div ref={mapRef} className="w-full h-full" style={{ height: '100%' }}></div>
                            <div className="absolute bottom-2 left-2 bg-white/90 text-xs px-2 py-1 rounded shadow pointer-events-none text-gray-600 z-[1000]">
                                Haz clic en el mapa para marcar la ubicación
                            </div>
                        </div>
                        {lat && lng && (
                            <p className="text-xs text-gray-500 mt-1">
                                Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        )}
                    </div>
                    
                    {/* Descripción */}
                    <div>
                        <label className={labelClass}>
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className={inputClass}
                            placeholder="Describe los detalles de la campaña, horarios, requisitos, etc."
                            required
                        />
                    </div>
                    
                    {/* Imágenes */}
                    <div>
                        <label className={labelClass}>
                            Imágenes <span className="text-red-500">*</span>
                        </label>
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                            <label className="cursor-pointer block">
                                <span className="block text-sm font-bold text-gray-600 mb-2">
                                    Sube hasta 5 fotos
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={isUploading || imageUrls.length >= 5}
                                />
                                <div className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-sm">
                                    {isUploading ? 'Subiendo...' : 'Seleccionar Fotos'}
                                </div>
                            </label>
                            <div className="flex gap-4 mt-4 justify-center flex-wrap">
                                {imageUrls.map((url, idx) => (
                                    <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden shadow-sm group">
                                        <img src={url} className="w-full h-full object-cover" alt="preview" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XCircleIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 rounded-b-xl shrink-0 -mx-6 -mb-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={createCampaign.isPending || updateCampaign.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading || createCampaign.isPending || updateCampaign.isPending}
                            className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-dark transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {(createCampaign.isPending || updateCampaign.isPending) ? 'Guardando...' : isUploading ? 'Subiendo...' : (isEditMode ? 'Guardar Cambios' : 'Crear Campaña')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CampaignFormModal;

