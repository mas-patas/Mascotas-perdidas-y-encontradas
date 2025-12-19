
import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { Pet, PetStatus, AnimalType, PetSize } from '@/types';
import { PET_STATUS, ANIMAL_TYPES, SIZES } from '@/constants';
import { dogBreeds, catBreeds, petColors } from '@/data/breeds';
import { departments, getProvinces, getDistricts, locationCoordinates } from '@/data/locations';
import { XCircleIcon, LocationMarkerIcon, CrosshairIcon, DogIcon, CatIcon, InfoIcon, CameraIcon, SearchIcon } from '@/shared/components/icons';
import { uploadImage } from '@/utils/imageUtils';

interface ReportPetFormProps {
    onClose: () => void;
    onSubmit: (pet: any, idToUpdate?: string) => void;
    initialStatus: PetStatus;
    petToEdit?: Pet | null;
    dataToPrefill?: Partial<Pet> | null;
    isSubmitting?: boolean;
}

// Define the Form Values Interface
interface FormValues {
    status: PetStatus;
    name: string;
    animalType: AnimalType;
    breed: string;
    customBreed: string;
    customAnimalType: string;
    size: PetSize;
    description: string;
    color1: string;
    color2: string;
    color3: string;
    department: string;
    province: string;
    district: string;
    neighbourhood: string;
    address: string;
    lat: number;
    lng: number;
    date: string;
    contact: string;
    reward: number | '';
    currency: string;
    shareContactInfo: boolean;
    createAlert: boolean;
    imageUrls: string[]; 
    adoptionRequirements?: string;
}

// Helper robusto para normalizar nombres de lugares y compararlos
const normalizeLocationName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/(provincia|departamento|distrito|region|municipalidad|gobierno) de /g, "") // Quitar prefijos administrativos
        .replace(/\s+/g, " ") // Unificar espacios
        .trim();
};

export const ReportPetForm: React.FC<ReportPetFormProps> = ({ onClose, onSubmit, initialStatus, petToEdit, dataToPrefill, isSubmitting }) => {
    const isEditMode = !!petToEdit;
    
    // RHF Setup
    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormValues>({
        defaultValues: {
            status: initialStatus,
            animalType: ANIMAL_TYPES.PERRO,
            breed: dogBreeds[0],
            size: SIZES.MEDIANO,
            department: 'Lima',
            province: '',
            district: '',
            neighbourhood: '',
            date: new Date().toISOString().split('T')[0],
            shareContactInfo: true,
            createAlert: false,
            currency: 'S/',
            imageUrls: [],
            ... (isEditMode && petToEdit ? {
                status: petToEdit.status,
                name: petToEdit.name,
                animalType: petToEdit.animalType,
                size: petToEdit.size,
                description: petToEdit.description,
                contact: petToEdit.contact,
                date: petToEdit.date.split('T')[0],
                shareContactInfo: petToEdit.shareContactInfo,
                reward: petToEdit.reward,
                currency: petToEdit.currency || 'S/',
                lat: petToEdit.lat,
                lng: petToEdit.lng,
                imageUrls: petToEdit.imageUrls || []
            } : {})
        }
    });

    // Watch fields for logic
    const watchedStatus = watch('status');
    const watchedAnimalType = watch('animalType');
    const watchedBreed = watch('breed');
    const watchedDepartment = watch('department');
    const watchedProvince = watch('province');
    const watchedDistrict = watch('district');
    const watchedNeighbourhood = watch('neighbourhood');
    const watchedAddress = watch('address');
    const watchedImageUrls = watch('imageUrls');
    const watchedLat = watch('lat');
    const watchedLng = watch('lng');

    // Local State for Non-Form UI interactions
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    
    // Refs to control flow and prevent infinite loops
    const isUpdatingFromMapRef = useRef(false); 
    const mapClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reverseGeocodingAbortController = useRef<AbortController | null>(null);
    const forwardGeocodingAbortController = useRef<AbortController | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [breeds, setBreeds] = useState(dogBreeds);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // --- EFFECT: Initialize from Edit Mode OR Prefill ---
    useEffect(() => {
        if (isEditMode && petToEdit) {
            // Colors
            const colors = petToEdit.color ? petToEdit.color.split(',').map(c => c.trim()) : [];
            setValue('color1', colors[0] || '');
            setValue('color2', colors[1] || '');
            setValue('color3', colors[2] || '');

            // Breed logic
            const currentList = petToEdit.animalType === ANIMAL_TYPES.GATO ? catBreeds : dogBreeds;
            if (petToEdit.animalType !== ANIMAL_TYPES.OTRO && currentList.includes(petToEdit.breed)) {
                setValue('breed', petToEdit.breed);
            } else {
                setValue('breed', 'Otro');
                setValue('customBreed', petToEdit.breed);
            }

            // Description / Custom Type
            if (petToEdit.animalType === ANIMAL_TYPES.OTRO) {
                const match = petToEdit.description.match(/^\[Tipo: (.*?)\]\s*(.*)/s);
                if (match) {
                    setValue('customAnimalType', match[1]);
                    setValue('description', match[2]);
                } else {
                    setValue('description', petToEdit.description);
                }
            }

            // Location Parsing Logic for Edit
            // Format: address, neighbourhood, district, province, department
            if (petToEdit.location) {
                const parts = petToEdit.location.split(',').map(s => s.trim());
                if (parts.length >= 3) {
                    // Try to match department (last part)
                    const deptCand = parts[parts.length - 1];
                    const deptMatch = departments.find(d => normalizeLocationName(d) === normalizeLocationName(deptCand));
                    
                    if (deptMatch) {
                        setValue('department', deptMatch);
                        const provList = getProvinces(deptMatch);
                        setProvinces(provList);

                        // Try to match province (second to last)
                        const provCand = parts[parts.length - 2];
                        const provMatch = provList.find(p => normalizeLocationName(p) === normalizeLocationName(provCand));
                        
                        if (provMatch) {
                            setValue('province', provMatch);
                            const distList = getDistricts(deptMatch, provMatch);
                            setDistricts(distList);

                            // Try to match district (third to last)
                            const distCand = parts[parts.length - 3];
                            const distMatch = distList.find(d => normalizeLocationName(d) === normalizeLocationName(distCand));
                            
                            if (distMatch) {
                                setValue('district', distMatch);
                                
                                // If there are 5 parts, the 4th from end is likely neighbourhood
                                if (parts.length >= 5) {
                                    const neighbourhoodCand = parts[parts.length - 4];
                                    setValue('neighbourhood', neighbourhoodCand);
                                    // The rest is the address
                                    setValue('address', parts.slice(0, parts.length - 4).join(', '));
                                } else {
                                    // No neighbourhood, rest is address
                                    setValue('address', parts.slice(0, parts.length - 3).join(', '));
                                }
                            } else {
                                // District not found, check if 4th from end might be district
                                if (parts.length >= 4) {
                                    const distCandAlt = parts[parts.length - 4];
                                    const distMatchAlt = distList.find(d => normalizeLocationName(d) === normalizeLocationName(distCandAlt));
                                    if (distMatchAlt) {
                                        setValue('district', distMatchAlt);
                                        setValue('address', parts.slice(0, parts.length - 4).join(', '));
                                    } else {
                                        setValue('address', parts.slice(0, parts.length - 2).join(', '));
                                    }
                                } else {
                                    setValue('address', parts.slice(0, parts.length - 2).join(', '));
                                }
                            }
                        } else {
                            setValue('address', parts.slice(0, parts.length - 1).join(', '));
                        }
                    } else {
                        setValue('address', petToEdit.location);
                    }
                } else {
                    setValue('address', petToEdit.location);
                }
            }
        } else if (dataToPrefill) {
             // Prefill Logic for New Report (e.g. from Owned Pet)
             setValue('name', dataToPrefill.name || '');
             if (dataToPrefill.animalType) setValue('animalType', dataToPrefill.animalType);
             
             // Breed
             const currentList = dataToPrefill.animalType === ANIMAL_TYPES.GATO ? catBreeds : dogBreeds;
             if (dataToPrefill.breed && currentList.includes(dataToPrefill.breed)) {
                 setValue('breed', dataToPrefill.breed);
             } else if (dataToPrefill.breed) {
                 setValue('breed', 'Otro');
                 setValue('customBreed', dataToPrefill.breed);
             }

             // Colors (Assumes comma separated string in dataToPrefill.color)
             const colors = dataToPrefill.color ? dataToPrefill.color.split(',').map(c => c.trim()) : [];
             setValue('color1', colors[0] || '');
             setValue('color2', colors[1] || '');
             setValue('color3', colors[2] || '');

             setValue('description', dataToPrefill.description || '');
             setValue('imageUrls', dataToPrefill.imageUrls || []);
             if (dataToPrefill.contact) setValue('contact', dataToPrefill.contact);
        }
    }, [isEditMode, petToEdit, dataToPrefill, setValue]);

    // --- EFFECT: Update Breeds List ---
    useEffect(() => {
        if (watchedAnimalType === ANIMAL_TYPES.PERRO) {
            setBreeds(dogBreeds);
            if (!isEditMode && !dataToPrefill) setValue('breed', dogBreeds[0]);
        } else if (watchedAnimalType === ANIMAL_TYPES.GATO) {
            setBreeds(catBreeds);
            if (!isEditMode && !dataToPrefill) setValue('breed', catBreeds[0]);
        } else {
            setBreeds(['Otro']);
            if (!isEditMode && !dataToPrefill) setValue('breed', 'Otro');
        }
    }, [watchedAnimalType, isEditMode, dataToPrefill, setValue]);

    // --- EFFECT: Update Location Lists (Normal User Selection) ---
    useEffect(() => {
        // Only run this logic if NOT currently driven by map click to prevent overwriting
        if (!isUpdatingFromMapRef.current && watchedDepartment) {
            setProvinces(getProvinces(watchedDepartment));
            // Reset children if manually changed
            if (!isEditMode && !dataToPrefill?.location) { // Don't reset if filling from existing data (though location parsing is tricky)
                // Actually location parsing above handles setting province/district, 
                // but if user changes dept manually, we should reset.
                // The check !isUpdatingFromMapRef handles map clicks.
                // For initial load, the other useEffect handles setting the lists.
            }
        }
    }, [watchedDepartment]); 

    useEffect(() => {
        if (!isUpdatingFromMapRef.current && watchedDepartment && watchedProvince) {
            setDistricts(getDistricts(watchedDepartment, watchedProvince));
        }
    }, [watchedDepartment, watchedProvince]);


    // --- ADDRESS AUTOCOMPLETE (FORWARD GEOCODING - TYPING) ---
    useEffect(() => {
        // Skip search if:
        // 1. The update came from a map click (reverse geo)
        // 2. Address is too short
        // 3. No address
        if (isUpdatingFromMapRef.current || !watchedAddress || watchedAddress.length < 4) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingAddress(true);
            if (forwardGeocodingAbortController.current) forwardGeocodingAbortController.current.abort();
            forwardGeocodingAbortController.current = new AbortController();

            try {
                // CONTEXTUAL SEARCH: Prioritize selected location
                let searchQuery = watchedAddress;
                
                // Append context if available to narrow down search
                const contextParts = [];
                if (watchedDistrict && watchedDistrict !== 'Todos') contextParts.push(watchedDistrict);
                if (watchedProvince && watchedProvince !== 'Todos') contextParts.push(watchedProvince);
                if (watchedDepartment && watchedDepartment !== 'Todos') contextParts.push(watchedDepartment);
                contextParts.push('Peru');

                if (contextParts.length > 0) {
                    searchQuery += `, ${contextParts.join(', ')}`;
                }

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pe&limit=5&addressdetails=1`,
                    {
                        headers: { 'Accept-Language': 'es-ES,es;q=0.9' },
                        signal: forwardGeocodingAbortController.current.signal
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                }
            } catch (err: any) { 
                if (err.name !== 'AbortError') console.error(err);
            }
            finally { setIsSearchingAddress(false); }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [watchedAddress, watchedDistrict, watchedProvince, watchedDepartment]);

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        
        // 1. Set coordinates
        setValue('lat', lat);
        setValue('lng', lon);

        // 2. Move Map
        if (mapInstance.current) {
            mapInstance.current.setView([lat, lon], 16);
            updateMarker(lat, lon, false); // false = don't trigger recursive update
        }

        // 3. Extract and Set Address Text (Avoid overwrite loop)
        isUpdatingFromMapRef.current = true;
        
        // Extract street name only
        let streetName = suggestion.address?.road || 
                         suggestion.address?.pedestrian ||
                         suggestion.address?.building ||
                         suggestion.display_name.split(',')[0];
                         
        if (suggestion.address?.house_number) streetName += ` ${suggestion.address.house_number}`;
        
        setValue('address', streetName);
        
        // 4. Try to match hierarchy from result
        parseAndSetHierarchy(suggestion.address);

        setSuggestions([]);
        setShowSuggestions(false);

        // Reset flag after a safe delay
        if (mapClickTimeoutRef.current) clearTimeout(mapClickTimeoutRef.current);
        mapClickTimeoutRef.current = setTimeout(() => { isUpdatingFromMapRef.current = false; }, 1500);
    };

    // --- REVERSE GEOCODING HELPER ---
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
            setValue('department', deptMatch);
            if (provMatch) {
                setValue('province', provMatch);
                if (distMatch) {
                    setValue('district', distMatch);
                    
                    // 4. Extract Urbanization/Neighbourhood (suburb, neighbourhood, residential, quarter)
                    // These fields typically contain urbanization information in Peru
                    const urbanization = addr.suburb || 
                                       addr.neighbourhood || 
                                       addr.residential || 
                                       addr.quarter || 
                                       '';
                    
                    if (urbanization) {
                        setValue('neighbourhood', urbanization);
                    }
                } else {
                    // If district not found, check if suburb might be the district
                    const apiDistFallback = normalizeLocationName(addr.suburb || '');
                    const distMatchFallback = newDists.find(d => normalizeLocationName(d) === apiDistFallback);
                    
                    if (distMatchFallback) {
                        setValue('district', distMatchFallback);
                    } else if (addr.suburb) {
                        // If suburb doesn't match a district, it's likely an urbanization
                        setValue('neighbourhood', addr.suburb);
                    }
                }
            }
        }
    };

    // --- MAP LOGIC ---
    const updateMarker = (latitude: number, longitude: number, shouldReverseGeocode = true) => {
        const L = (window as any).L;
        if (!mapInstance.current || !L) return;

        // Visual update
        const iconClass = watchedStatus === PET_STATUS.ENCONTRADO ? 'found' : watchedStatus === PET_STATUS.AVISTADO ? 'sighted' : 'lost';
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin ${iconClass}'></div><i class='material-icons'></i>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        if (markerInstance.current) {
            markerInstance.current.setLatLng([latitude, longitude]);
            markerInstance.current.setIcon(icon);
        } else {
            markerInstance.current = L.marker([latitude, longitude], { icon, draggable: true }).addTo(mapInstance.current);
            
            // Drag Event
            markerInstance.current.on('dragstart', () => {
                isUpdatingFromMapRef.current = true;
            });
            markerInstance.current.on('dragend', (event: any) => {
                const pos = event.target.getLatLng();
                setValue('lat', pos.lat);
                setValue('lng', pos.lng);
                performReverseGeocoding(pos.lat, pos.lng);
            });
        }

        if (shouldReverseGeocode) {
            performReverseGeocoding(latitude, longitude);
        }
    };

    const performReverseGeocoding = async (latitude: number, longitude: number, isRetry = false) => {
        isUpdatingFromMapRef.current = true;
        
        if (reverseGeocodingAbortController.current) reverseGeocodingAbortController.current.abort();
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
                
                // Avoid setting empty address if we are clicking middle of nowhere
                if (addressText) {
                    setValue('address', addressText, { shouldValidate: true });
                }

                // Update Hierarchy
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
        } finally {
            // Release lock after delay
            if (mapClickTimeoutRef.current) clearTimeout(mapClickTimeoutRef.current);
            mapClickTimeoutRef.current = setTimeout(() => { isUpdatingFromMapRef.current = false; }, 2000);
        }
    };

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const timer = setTimeout(() => {
            if (typeof (window as any).L !== 'undefined') {
                const L = (window as any).L;
                // Default to Lima or existing coords
                const initialLat = watchedLat || -12.046374;
                const initialLng = watchedLng || -77.042793;

                mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapInstance.current);

                // Map Click Event
                mapInstance.current.on('click', (e: any) => {
                    const { lat, lng } = e.latlng;
                    setValue('lat', lat);
                    setValue('lng', lng);
                    updateMarker(lat, lng, true);
                });

                if (watchedLat && watchedLng) {
                    updateMarker(watchedLat, watchedLng, false);
                }
                
                mapInstance.current.invalidateSize();
            }
        }, 100);
        
        return () => { 
            clearTimeout(timer); 
            if(mapInstance.current) { 
                mapInstance.current.remove(); 
                mapInstance.current = null; 
            } 
        };
    }, []);

    // Center map when Dept/Prov changes manually (NOT from map click)
    useEffect(() => {
        if (isUpdatingFromMapRef.current || !mapInstance.current) return;
        
        const coords = locationCoordinates[watchedProvince] || locationCoordinates[watchedDepartment];
        if (coords) {
            mapInstance.current.setView([coords.lat, coords.lng], 12);
        }
    }, [watchedDepartment, watchedProvince]);

    // Update marker icon when status changes
    useEffect(() => {
        if(markerInstance.current && watchedLat && watchedLng) {
            updateMarker(watchedLat, watchedLng, false);
        }
    }, [watchedStatus]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setValue('lat', latitude);
            setValue('lng', longitude);
            
            if (mapInstance.current) {
                mapInstance.current.setView([latitude, longitude], 16);
                updateMarker(latitude, longitude, true);
            }
        });
    };

    // --- IMAGES ---
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if (watchedImageUrls.length + files.length > 3) {
                setUploadError('Puedes subir un máximo de 3 fotos.');
                return;
            }
            setIsUploading(true);
            setUploadError('');
            try {
                const newImages: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const url = await uploadImage(files[i]);
                    newImages.push(url);
                }
                setValue('imageUrls', [...watchedImageUrls, ...newImages]);
            } catch (err) {
                console.error(err);
                setUploadError('Error al subir imagen. Por favor intenta de nuevo.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const removeImage = (index: number) => {
        setValue('imageUrls', watchedImageUrls.filter((_, i) => i !== index));
    };

    // --- SUBMIT ---
    const onFormSubmit: SubmitHandler<FormValues> = (data) => {
        setUploadError('');
        if (data.imageUrls.length === 0) {
            setUploadError('Sube al menos una foto.');
            return;
        }

        const finalColors = [data.color1, data.color2, data.color3].filter(Boolean).join(', ');
        // Build location with hierarchy: address, neighbourhood (urbanization), district, province, department
        const finalLocation = [
            data.address, 
            data.neighbourhood, 
            data.district, 
            data.province, 
            data.department
        ].filter(Boolean).join(', ');
        const finalBreed = data.breed === 'Otro' ? data.customBreed : data.breed;
        const finalType = data.animalType === 'Otro' ? ANIMAL_TYPES.OTRO : data.animalType;
        
        let finalDescription = data.description;
        if (data.animalType === 'Otro' && data.customAnimalType) {
            finalDescription = `[Tipo: ${data.customAnimalType}] ${data.description}`;
        }

        // Obtener coordenadas: usar las del mapa si existen, sino usar coordenadas por defecto de la ubicación
        let finalLat = data.lat;
        let finalLng = data.lng;
        
        // Si no hay coordenadas del mapa, usar coordenadas por defecto basadas en provincia o departamento
        if (!finalLat || !finalLng) {
            const coords = locationCoordinates[data.province] || locationCoordinates[data.department];
            if (coords) {
                finalLat = coords.lat;
                finalLng = coords.lng;
            }
        }

        const petData = {
            status: data.status,
            name: data.name || 'Desconocido',
            animalType: finalType,
            breed: finalBreed || 'Mestizo',
            color: finalColors,
            size: data.size,
            location: finalLocation,
            date: new Date(data.date).toISOString(),
            contact: data.contact,
            description: finalDescription,
            imageUrls: data.imageUrls,
            shareContactInfo: data.shareContactInfo,
            reward: data.reward ? Number(data.reward) : undefined,
            currency: data.currency,
            lat: finalLat,
            lng: finalLng,
            createAlert: data.createAlert && data.status === PET_STATUS.PERDIDO && !isEditMode
        };

        onSubmit(petData, petToEdit?.id);
    };

    // Header Logic
    const getHeaderInfo = () => {
        if (isEditMode) return { title: 'Editar Publicación', description: 'Actualiza los datos de tu reporte.' };
        switch (watchedStatus) {
            case PET_STATUS.PERDIDO: return { title: 'Reportar Mascota Perdida', description: 'Ayuda a que regrese a casa.' };
            case PET_STATUS.ENCONTRADO: return { title: 'Reportar Mascota Encontrada', description: 'Ayuda a encontrar a su dueño.' };
            case PET_STATUS.AVISTADO: return { title: 'Reportar Avistamiento', description: 'Informa si viste una mascota perdida.' };
            default: return { title: 'Reportar Mascota', description: 'Completa los datos.' };
        }
    };
    const headerInfo = getHeaderInfo();
    
    const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900 shadow-sm disabled:bg-gray-100";
    const labelClass = "block text-sm font-bold text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-auto">
                {/* Header */}
                <div className="p-6 border-b bg-gray-50 rounded-t-xl flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-brand-dark">{headerInfo.title}</h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">{headerInfo.description}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XCircleIcon className="h-8 w-8"/></button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-300">
                    {uploadError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">{uploadError}</div>}

                    {/* SECTION 1: DETAILS */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><InfoIcon className="h-6 w-6 text-brand-primary"/> Detalles</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Nombre {watchedStatus !== PET_STATUS.PERDIDO && '(Opcional)'}</label>
                                <input 
                                    type="text" 
                                    {...register('name', { required: watchedStatus === PET_STATUS.PERDIDO ? "El nombre es obligatorio" : false })} 
                                    className={inputClass} 
                                    placeholder={watchedStatus === PET_STATUS.PERDIDO ? 'Ej: Rocky' : 'Ej: Desconocido'} 
                                />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>
                            <div>
                                <label className={labelClass}>Tipo de Animal</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {[ANIMAL_TYPES.PERRO, ANIMAL_TYPES.GATO, ANIMAL_TYPES.OTRO].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setValue('animalType', t)}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${watchedAnimalType === t ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {watchedAnimalType === ANIMAL_TYPES.OTRO && (
                            <div>
                                <label className={labelClass}>Especificar Tipo</label>
                                <input type="text" {...register('customAnimalType', { required: "Especifique el tipo" })} className={inputClass} placeholder="Ej: Conejo" />
                                {errors.customAnimalType && <span className="text-red-500 text-xs">{errors.customAnimalType.message}</span>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Raza <span className="text-red-500">*</span></label>
                                <select {...register('breed', { required: true })} className={inputClass}>
                                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            {watchedBreed === 'Otro' && (
                                <div>
                                    <label className={labelClass}>Especificar Raza</label>
                                    <input type="text" {...register('customBreed', { required: "Especifique la raza" })} className={inputClass} />
                                    {errors.customBreed && <span className="text-red-500 text-xs">{errors.customBreed.message}</span>}
                                </div>
                            )}
                            <div>
                                <label className={labelClass}>Tamaño</label>
                                <select {...register('size')} className={inputClass}>
                                    {Object.values(SIZES).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* COLORS */}
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">Colores (Identificación)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Color Principal <span className="text-red-500">*</span></label>
                                    <select {...register('color1', { required: "Color principal obligatorio" })} className={inputClass}>
                                        <option value="">Seleccionar</option>
                                        {petColors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {errors.color1 && <span className="text-red-500 text-xs">{errors.color1.message}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Color Secundario</label>
                                    <select {...register('color2')} className={inputClass}>
                                        <option value="">(Opcional)</option>
                                        {petColors.filter(c => c !== watch('color1')).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Tercer Color</label>
                                    <select {...register('color3')} className={inputClass}>
                                        <option value="">(Opcional)</option>
                                        {petColors.filter(c => c !== watch('color1') && c !== watch('color2')).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Descripción Adicional</label>
                            <textarea {...register('description')} rows={3} className={inputClass} placeholder="Collar, cicatrices, comportamiento..."></textarea>
                        </div>
                    </section>

                    {/* SECTION 2: LOCATION */}
                    <section className="space-y-4 border-t pt-4 border-gray-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><LocationMarkerIcon className="h-6 w-6 text-brand-primary"/> Ubicación</h3>
                            <button type="button" onClick={handleGetCurrentLocation} className="text-xs bg-brand-light text-brand-primary px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1 border border-blue-200 transition-colors">
                                <CrosshairIcon className="h-3 w-3"/> Usar mi ubicación
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Departamento</label>
                                <select {...register('department')} className={inputClass}>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Provincia</label>
                                <select {...register('province')} className={inputClass} disabled={!watchedDepartment}>
                                    <option value="">Seleccionar</option>
                                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Distrito</label>
                                <select {...register('district')} className={inputClass} disabled={!watchedProvince}>
                                    <option value="">Seleccionar</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Urbanización (Opcional)</label>
                                <input 
                                    type="text" 
                                    {...register('neighbourhood')}
                                    className={inputClass} 
                                    placeholder="Ej: Mangomarca, Campoy" 
                                />
                                <p className="text-xs text-gray-500 mt-1">Se detecta automáticamente al seleccionar en el mapa</p>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <label className={labelClass}>Dirección o Referencia <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    {...register('address', { required: "La dirección es obligatoria" })}
                                    className={`${inputClass} pr-8`} 
                                    placeholder="Ej: Parque Kennedy, Miraflores" 
                                    autoComplete="off"
                                />
                                {isSearchingAddress && (
                                    <div className="absolute right-2 top-1/2 transform -translate-x-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                                    </div>
                                )}
                            </div>
                            {/* Autocomplete Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                    {suggestions.map((item, index) => (
                                        <li 
                                            key={index} 
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0 border-gray-100 text-gray-700 flex items-center gap-2"
                                        >
                                            <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{item.display_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
                        </div>
                        
                        <div className="w-full rounded-xl overflow-hidden border border-gray-300 relative z-0 shadow-inner" style={{ height: '300px' }}>
                            <div ref={mapRef} className="w-full h-full" style={{ height: '100%' }}></div>
                            <div className="absolute bottom-2 left-2 bg-white/90 text-xs px-2 py-1 rounded shadow pointer-events-none text-gray-600 z-[1000]">
                                Mueve el pin para ajustar la posición
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: MEDIA & CONTACT */}
                    <section className="space-y-4 border-t pt-4 border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CameraIcon className="h-6 w-6 text-brand-primary"/> Fotos y Contacto</h3>

                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                            <label className="cursor-pointer block">
                                <span className="block text-sm font-bold text-gray-600 mb-2">Sube hasta 3 fotos <span className="text-red-500">*</span></span>
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={isUploading || watchedImageUrls.length >= 3} />
                                <div className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-sm">
                                    {isUploading ? 'Subiendo...' : 'Seleccionar Fotos'}
                                </div>
                            </label>
                            <div className="flex gap-4 mt-4 justify-center flex-wrap">
                                {watchedImageUrls.map((url, idx) => (
                                    <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden shadow-sm group">
                                        <img src={url} className="w-full h-full object-cover" alt="preview" />
                                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XCircleIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Fecha del Suceso</label>
                                <input type="date" {...register('date', { required: true })} className={inputClass} max={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono de Contacto (Opcional)</label>
                                <input type="tel" {...register('contact')} className={inputClass} placeholder="999888777" />
                                <div className="flex items-center mt-2">
                                    <input type="checkbox" {...register('shareContactInfo')} className="mr-2 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded" />
                                    <label className="text-sm text-gray-600">Mostrar número públicamente</label>
                                </div>
                            </div>
                        </div>

                        {watchedStatus === PET_STATUS.PERDIDO && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">💰</span>
                                    <h4 className="font-bold text-yellow-800 text-sm">Recompensa (Opcional)</h4>
                                </div>
                                <div className="flex gap-2">
                                    <select {...register('currency')} className="w-24 p-2 border border-yellow-300 rounded-lg bg-white font-bold text-gray-700">
                                        <option value="S/">S/</option>
                                        <option value="$">$</option>
                                    </select>
                                    <input type="number" {...register('reward')} className="flex-1 p-2 border border-yellow-300 rounded-lg" placeholder="Monto" />
                                </div>
                            </div>
                        )}

                        {!isEditMode && watchedStatus === PET_STATUS.PERDIDO && (
                            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <InfoIcon className="text-blue-500 h-5 w-5 mt-0.5" />
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-blue-900 cursor-pointer">Crear Alerta Automática</label>
                                        <input type="checkbox" {...register('createAlert')} className="h-5 w-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                                    </div>
                                    <p className="text-xs text-blue-700 mt-1">Te avisaremos inmediatamente si alguien reporta haber encontrado una mascota con estas características.</p>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 rounded-b-xl shrink-0 -mx-6 -mb-6">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" disabled={isUploading || isSubmitting} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-dark transition-all transform hover:-translate-y-0.5 disabled:opacity-50">
                            {isSubmitting ? 'Publicando...' : isUploading ? 'Subiendo...' : (isEditMode ? 'Guardar Cambios' : 'Publicar Reporte')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
