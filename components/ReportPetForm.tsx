
import React, { useState, useEffect, useRef } from 'react';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';
import { PET_STATUS, ANIMAL_TYPES, SIZES } from '../constants';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { departments, getProvinces, getDistricts, locationCoordinates } from '../data/locations';
import { XCircleIcon, LocationMarkerIcon, CrosshairIcon, DogIcon, CatIcon, InfoIcon, CameraIcon, SearchIcon } from './icons';
import { uploadImage } from '../utils/imageUtils';

interface ReportPetFormProps {
    onClose: () => void;
    onSubmit: (pet: any, idToUpdate?: string) => void;
    initialStatus: PetStatus;
    petToEdit?: Pet | null;
}

const normalizeLocationName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/(provincia|departamento|distrito|region|municipalidad) de /g, "") 
        .trim();
};

export const ReportPetForm: React.FC<ReportPetFormProps> = ({ onClose, onSubmit, initialStatus, petToEdit }) => {
    const isEditMode = !!petToEdit;
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const isUpdatingFromMapRef = useRef(false);
    const isMounted = useRef(true);
    
    // AbortControllers for cancelling stale requests
    const reverseGeocodingAbortController = useRef<AbortController | null>(null);
    const forwardGeocodingAbortController = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // Form States
    const [status, setStatus] = useState<PetStatus>(initialStatus);
    
    // Section 1: Details
    const [name, setName] = useState('');
    const [animalType, setAnimalType] = useState<AnimalType>(ANIMAL_TYPES.PERRO);
    const [breed, setBreed] = useState(dogBreeds[0]);
    const [customAnimalType, setCustomAnimalType] = useState('');
    const [customBreed, setCustomBreed] = useState('');
    const [size, setSize] = useState<PetSize>(SIZES.MEDIANO);
    const [description, setDescription] = useState('');
    
    // Colors (Explicitly 3)
    const [color1, setColor1] = useState('');
    const [color2, setColor2] = useState('');
    const [color3, setColor3] = useState('');

    // Section 2: Location
    const [department, setDepartment] = useState('Lima');
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);
    
    // Address Autocomplete States
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    
    // Section 3: Contact & Meta
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [contact, setContact] = useState('');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [reward, setReward] = useState<number | ''>('');
    const [currency, setCurrency] = useState('S/');
    const [shareContactInfo, setShareContactInfo] = useState(true);
    const [createAlert, setCreateAlert] = useState(true);

    // Helpers
    const [breeds, setBreeds] = useState(dogBreeds);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // Dynamic Header Text Logic
    const getHeaderInfo = () => {
        if (isEditMode) {
            return {
                title: 'Editar Publicación',
                description: 'Actualiza los datos de tu reporte para mantener informada a la comunidad.'
            };
        }

        switch (status) {
            case PET_STATUS.PERDIDO:
                return {
                    title: 'Vas a reportar una mascota perdida',
                    description: 'Estás reportando que es tu mascota y tienes los datos necesarios para recuperarla.'
                };
            case PET_STATUS.ENCONTRADO:
                return {
                    title: 'Vas a reportar una mascota encontrada',
                    description: 'Has encontrado una mascota en la calle y la tienes en tu casa o en un lugar seguro donde sabes que puedes ubicarla hasta que pueda encontrar a su dueño.'
                };
            case PET_STATUS.AVISTADO:
                return {
                    title: 'Vas a reportar una mascota avistada',
                    description: 'Has visto en la calle o algún lugar a una mascota que parece estar perdida y está buscando a sus dueños. Completa la siguiente información para poder ayudar a que esta mascota vuelva a su casa o a su hogar.'
                };
            default:
                return {
                    title: 'Reportar Mascota',
                    description: 'Completa los datos para ayudar a la comunidad.'
                };
        }
    };

    const headerInfo = getHeaderInfo();

    // Initialize from petToEdit
    useEffect(() => {
        if (isEditMode && petToEdit) {
            setStatus(petToEdit.status);
            setName(petToEdit.name);
            setAnimalType(petToEdit.animalType);
            
            // Handle Breed initialization (Check if it's in the list or custom)
            const currentList = petToEdit.animalType === ANIMAL_TYPES.GATO ? catBreeds : dogBreeds;
            if (petToEdit.animalType !== ANIMAL_TYPES.OTRO && currentList.includes(petToEdit.breed)) {
                setBreed(petToEdit.breed);
            } else {
                setBreed('Otro');
                setCustomBreed(petToEdit.breed);
            }
            
            // Extract colors
            const colors = petToEdit.color ? petToEdit.color.split(',').map(c => c.trim()) : [];
            setColor1(colors[0] || '');
            setColor2(colors[1] || '');
            setColor3(colors[2] || '');
            
            setSize(petToEdit.size || SIZES.MEDIANO);
            setDate(petToEdit.date.split('T')[0]);
            setContact(petToEdit.contact);
            
            // Handle Description & Custom Type Extraction
            if (petToEdit.animalType === ANIMAL_TYPES.OTRO) {
                // Try to extract [Tipo: Conejo] from description
                const match = petToEdit.description.match(/^\[Tipo: (.*?)\]\s*(.*)/s);
                if (match) {
                    setCustomAnimalType(match[1]);
                    setDescription(match[2]);
                } else {
                    setCustomAnimalType('');
                    setDescription(petToEdit.description);
                }
            } else {
                setDescription(petToEdit.description);
            }

            setImagePreviews(petToEdit.imageUrls || []);
            setReward(petToEdit.reward || '');
            setCurrency(petToEdit.currency || 'S/');
            setShareContactInfo(petToEdit.shareContactInfo ?? true);
            setLat(petToEdit.lat);
            setLng(petToEdit.lng);

            if (petToEdit.location) {
                const parts = petToEdit.location.split(',').map(s => s.trim());
                if (parts.length >= 3) {
                    setDepartment(parts[parts.length - 1]);
                    setProvince(parts[parts.length - 2]);
                    setDistrict(parts[parts.length - 3]);
                    setAddress(parts.slice(0, parts.length - 3).join(', '));
                } else {
                    setAddress(petToEdit.location);
                }
            }
        }
    }, [isEditMode, petToEdit]);

    // Update Breeds list when Type changes
    useEffect(() => {
        if (animalType === ANIMAL_TYPES.PERRO) {
            setBreeds(dogBreeds);
            if (!isEditMode) setBreed(dogBreeds[0]);
        } else if (animalType === ANIMAL_TYPES.GATO) {
            setBreeds(catBreeds);
            if (!isEditMode) setBreed(catBreeds[0]);
        } else {
            setBreeds(['Otro']);
            if (!isEditMode) setBreed('Otro');
        }
    }, [animalType, isEditMode]);

    // Update Provinces/Districts
    useEffect(() => {
        if (department) {
            setProvinces(getProvinces(department));
            if (!isEditMode && !isUpdatingFromMapRef.current) {
                setProvince('');
                setDistrict('');
            }
        }
    }, [department, isEditMode]);

    useEffect(() => {
        if (department && province) {
            setDistricts(getDistricts(department, province));
            if (!isEditMode && !isUpdatingFromMapRef.current) {
                setDistrict('');
            }
        }
    }, [department, province, isEditMode]);

    // Address Autocomplete Logic
    useEffect(() => {
        // Don't search if the update comes from map dragging or if address is too short
        if (isUpdatingFromMapRef.current || address.length < 4) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingAddress(true);
            
            // Abort previous request if exists
            if (forwardGeocodingAbortController.current) {
                forwardGeocodingAbortController.current.abort();
            }
            forwardGeocodingAbortController.current = new AbortController();

            try {
                // Prioritize Peru with countrycodes=pe
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=pe&limit=5&addressdetails=1`,
                    {
                        headers: {
                            'Accept-Language': 'es-ES,es;q=0.9', // Improve result language
                        },
                        signal: forwardGeocodingAbortController.current.signal
                    }
                );
                
                if (!response.ok) throw new Error("Network response was not ok");
                
                const data = await response.json();
                if (isMounted.current) {
                    setSuggestions(data);
                    setShowSuggestions(true);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.warn("Error fetching address suggestions (skipping):", err);
            } finally {
                if (isMounted.current) setIsSearchingAddress(false);
            }
        }, 1000); // 1000ms debounce to prevent "Failed to fetch" (Rate Limit)

        return () => clearTimeout(timer);
    }, [address]);

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        
        // Update Map
        if (mapInstance.current) {
            mapInstance.current.setView([lat, lon], 16);
            updateMarker(lat, lon);
        }

        // Parse Address Details to Auto-fill Dept/Prov/Dist
        const addr = suggestion.address;
        let newDept = '';
        let newProv = '';
        let newDist = '';
        let newProvincesList: string[] = [];
        let newDistrictsList: string[] = [];

        const apiState = addr.state || addr.region;
        if (apiState) {
            const normalizedApiState = normalizeLocationName(apiState);
            newDept = departments.find(d => normalizeLocationName(d) === normalizedApiState) || '';
        }

        if (newDept) {
            newProvincesList = getProvinces(newDept);
            const apiProv = addr.province || addr.region || addr.city;
            if (apiProv) {
                const normalizedApiProv = normalizeLocationName(apiProv);
                newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedApiProv) || '';
            }
        }

        if (newDept && newProv) {
            newDistrictsList = getDistricts(newDept, newProv);
            const apiDist = addr.district || addr.town || addr.suburb || addr.city_district;
            if (apiDist) {
                const normalizedApiDist = normalizeLocationName(apiDist);
                newDist = newDistrictsList.find(d => normalizeLocationName(d) === normalizedApiDist) || '';
            }
        }

        isUpdatingFromMapRef.current = true; // Prevent the address text from triggering a new search loop immediately
        
        // Update Lists
        if (newProvincesList.length > 0) setProvinces(newProvincesList);
        if (newDistrictsList.length > 0) setDistricts(newDistrictsList);

        // Update Fields
        if (newDept) setDepartment(newDept);
        if (newProv) setProvince(newProv);
        if (newDist) setDistrict(newDist);
        
        // Use the display name part that matches the street/place
        const road = addr.road || addr.pedestrian || addr.construction || '';
        const houseNumber = addr.house_number || '';
        const placeName = addr.amenity || addr.shop || addr.tourism || addr.historic || '';
        
        let newAddressText = suggestion.display_name.split(',')[0]; // Fallback
        if (road) newAddressText = `${road} ${houseNumber}`.trim();
        else if (placeName) newAddressText = placeName;

        setAddress(newAddressText);
        setSuggestions([]);
        setShowSuggestions(false);

        // Reset the flag after state updates settle
        setTimeout(() => { if (isMounted.current) isUpdatingFromMapRef.current = false; }, 1000);
    };

    // Map Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isMounted.current || !mapRef.current) return;
            const L = (window as any).L;
            if (!L) return;

            const setupMap = () => {
                const initialLat = lat || -12.046374;
                const initialLng = lng || -77.042793;

                if (!mapInstance.current) {
                    mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(mapInstance.current);

                    mapInstance.current.on('click', (e: any) => {
                        const { lat, lng } = e.latlng;
                        updateMarker(lat, lng);
                        updateAddressFromCoords(lat, lng);
                    });
                } else {
                    mapInstance.current.invalidateSize();
                    if (lat && lng) mapInstance.current.setView([lat, lng], 15);
                }

                if (lat && lng) {
                    updateMarker(lat, lng, false);
                }
            };
            setupMap();
        }, 500);

        return () => {
            clearTimeout(timer);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []); 

    const updateMarker = (latitude: number, longitude: number, updateState = true) => {
        const L = (window as any).L;
        if (!mapInstance.current || !L) return;

        if (updateState) {
            setLat(latitude);
            setLng(longitude);
        }

        const iconClass = status === PET_STATUS.ENCONTRADO ? 'found' : status === PET_STATUS.AVISTADO ? 'sighted' : 'lost';
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
            markerInstance.current.on('dragend', (event: any) => {
                const pos = event.target.getLatLng();
                setLat(pos.lat);
                setLng(pos.lng);
                updateAddressFromCoords(pos.lat, pos.lng);
            });
        }
    };

    // Update marker color dynamically when status changes
    useEffect(() => {
        if(markerInstance.current && lat && lng) {
            updateMarker(lat, lng, false);
        }
    }, [status]);

    const updateAddressFromCoords = async (latitude: number, longitude: number) => {
        // Abort previous pending request
        if (reverseGeocodingAbortController.current) {
            reverseGeocodingAbortController.current.abort();
        }
        reverseGeocodingAbortController.current = new AbortController();

        try {
            // Using generic headers to avoid some fetch blocks, and Accept-Language for Spanish
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'es-ES,es;q=0.9',
                    },
                    signal: reverseGeocodingAbortController.current.signal
                }
            );
            
            if (!response.ok) {
                console.warn('Nominatim reverse fetch failed (silent ignore):', response.status);
                return;
            }

            const data = await response.json();
            
            if (data && data.address && isMounted.current) {
                const addr = data.address;
                const road = addr.road || '';
                const number = addr.house_number || '';
                const newAddress = `${road} ${number}`.trim();
                
                let newDept = '';
                let newProv = '';
                let newDist = '';
                let newProvincesList: string[] = [];
                let newDistrictsList: string[] = [];

                const apiState = addr.state || addr.region;
                if (apiState) {
                    const normalizedApiState = normalizeLocationName(apiState);
                    newDept = departments.find(d => normalizeLocationName(d) === normalizedApiState) || '';
                }

                if (newDept) {
                    newProvincesList = getProvinces(newDept);
                    const apiProv = addr.province || addr.region || addr.city;
                    if (apiProv) {
                        const normalizedApiProv = normalizeLocationName(apiProv);
                        newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedApiProv) || '';
                    }
                }

                if (newDept && newProv) {
                    newDistrictsList = getDistricts(newDept, newProv);
                    const apiDist = addr.district || addr.town || addr.suburb;
                    if (apiDist) {
                        const normalizedApiDist = normalizeLocationName(apiDist);
                        newDist = newDistrictsList.find(d => normalizeLocationName(d) === normalizedApiDist) || '';
                    }
                }

                isUpdatingFromMapRef.current = true;
                if (newProvincesList.length > 0) setProvinces(newProvincesList);
                if (newDistrictsList.length > 0) setDistricts(newDistrictsList);

                if (newDept) setDepartment(newDept);
                if (newProv) setProvince(newProv);
                if (newDist) setDistrict(newDist);
                if (newAddress) setAddress(newAddress);

                setTimeout(() => { if (isMounted.current) isUpdatingFromMapRef.current = false; }, 1000);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return; // Ignore cancelled requests
            console.warn("Geocoding error (likely network or rate limit):", err);
            // Non-blocking error: allow user to type address manually
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            if (mapInstance.current) {
                mapInstance.current.setView([latitude, longitude], 16);
                updateMarker(latitude, longitude);
                updateAddressFromCoords(latitude, longitude);
            }
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if (imagePreviews.length + files.length > 3) {
                setError('Puedes subir un máximo de 3 fotos.');
                return;
            }
            setIsUploading(true);
            setError('');
            try {
                const newImages: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const url = await uploadImage(files[i]);
                    newImages.push(url);
                }
                if (isMounted.current) setImagePreviews(prev => [...prev, ...newImages]);
            } catch (err) {
                setError('Error al subir imagen');
            } finally {
                if (isMounted.current) setIsUploading(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (imagePreviews.length === 0) {
            setError('Sube al menos una foto.');
            return;
        }
        if (!color1) {
            setError('Debes seleccionar al menos el color primario.');
            return;
        }
        if (!contact) {
            setError('El contacto es obligatorio.');
            return;
        }

        // Concatenate colors
        const finalColors = [color1, color2, color3].filter(Boolean).join(', ');
        const finalLocation = [address, district, province, department].filter(Boolean).join(', ');
        const finalBreed = breed === 'Otro' ? customBreed : breed;
        const finalType = animalType === 'Otro' ? ANIMAL_TYPES.OTRO : animalType;
        
        let finalDescription = description;
        if (animalType === 'Otro' && customAnimalType) {
            finalDescription = `[Tipo: ${customAnimalType}] ${description}`;
        }

        const petData: any = {
            status,
            name: name || 'Desconocido',
            animalType: finalType,
            breed: finalBreed || 'Mestizo',
            color: finalColors,
            size,
            location: finalLocation,
            date: new Date(date).toISOString(),
            contact,
            description: finalDescription,
            imageUrls: imagePreviews,
            shareContactInfo,
            reward: reward ? Number(reward) : undefined,
            currency,
            lat,
            lng,
            createAlert: createAlert && status === PET_STATUS.PERDIDO && !isEditMode
        };

        onSubmit(petData, petToEdit?.id);
    };

    const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900 shadow-sm";
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

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-300">
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">{error}</div>}

                    {/* --- SECTION 1: DETAILS --- */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><InfoIcon className="h-6 w-6 text-brand-primary"/> Detalles de la Mascota</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Nombre {status !== PET_STATUS.PERDIDO && '(Opcional)'}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder={status === PET_STATUS.PERDIDO ? 'Ej: Rocky' : 'Ej: Desconocido'} required={status === PET_STATUS.PERDIDO} />
                            </div>
                            <div>
                                <label className={labelClass}>Tipo de Animal</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {[ANIMAL_TYPES.PERRO, ANIMAL_TYPES.GATO, ANIMAL_TYPES.OTRO].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setAnimalType(t)}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${animalType === t ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {animalType === ANIMAL_TYPES.OTRO && (
                            <div>
                                <label className={labelClass}>Especificar Tipo</label>
                                <input type="text" value={customAnimalType} onChange={e => setCustomAnimalType(e.target.value)} className={inputClass} placeholder="Ej: Conejo, Loro..." required />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Raza <span className="text-red-500">*</span></label>
                                <select value={breed} onChange={e => setBreed(e.target.value)} className={inputClass} required>
                                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            {breed === 'Otro' && (
                                <div>
                                    <label className={labelClass}>Especificar Raza</label>
                                    <input type="text" value={customBreed} onChange={e => setCustomBreed(e.target.value)} className={inputClass} required />
                                </div>
                            )}
                            <div>
                                <label className={labelClass}>Tamaño</label>
                                <select value={size} onChange={e => setSize(e.target.value as PetSize)} className={inputClass}>
                                    {Object.values(SIZES).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* COLORS SECTION - EXPLICITLY SEPARATED */}
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">Colores (Identificación)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Color Principal <span className="text-red-500">*</span></label>
                                    <select value={color1} onChange={e => setColor1(e.target.value)} className={inputClass} required>
                                        <option value="">Seleccionar</option>
                                        {petColors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Color Secundario</label>
                                    <select value={color2} onChange={e => setColor2(e.target.value)} className={inputClass}>
                                        <option value="">(Opcional)</option>
                                        {petColors.filter(c => c !== color1).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Tercer Color</label>
                                    <select value={color3} onChange={e => setColor3(e.target.value)} className={inputClass}>
                                        <option value="">(Opcional)</option>
                                        {petColors.filter(c => c !== color1 && c !== color2).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Descripción Adicional</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Collar, cicatrices, comportamiento..."></textarea>
                        </div>
                    </section>

                    {/* --- SECTION 2: LOCATION --- */}
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
                                <select value={department} onChange={e => { setDepartment(e.target.value); setProvince(''); setDistrict(''); }} className={inputClass}>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Provincia</label>
                                <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }} className={inputClass} disabled={!department}>
                                    <option value="">Seleccionar</option>
                                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Distrito</label>
                                <select value={district} onChange={e => setDistrict(e.target.value)} className={inputClass} disabled={!province}>
                                    <option value="">Seleccionar</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <label className={labelClass}>Dirección o Referencia <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)} 
                                    className={`${inputClass} pr-8`} 
                                    placeholder="Ej: Parque Kennedy, Miraflores" 
                                    required 
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
                        </div>
                        
                        <div className="h-56 w-full rounded-xl overflow-hidden border border-gray-300 relative z-0 shadow-inner">
                            <div ref={mapRef} className="w-full h-full"></div>
                            <div className="absolute bottom-2 left-2 bg-white/90 text-xs px-2 py-1 rounded shadow pointer-events-none text-gray-600">
                                Mueve el pin para ajustar la posición
                            </div>
                        </div>
                    </section>

                    {/* --- SECTION 3: MEDIA & CONTACT --- */}
                    <section className="space-y-4 border-t pt-4 border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CameraIcon className="h-6 w-6 text-brand-primary"/> Fotos y Contacto</h3>

                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                            <label className="cursor-pointer block">
                                <span className="block text-sm font-bold text-gray-600 mb-2">Sube hasta 3 fotos <span className="text-red-500">*</span></span>
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={isUploading || imagePreviews.length >= 3} />
                                <div className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-sm">
                                    {isUploading ? 'Subiendo...' : 'Seleccionar Fotos'}
                                </div>
                            </label>
                            <div className="flex gap-4 mt-4 justify-center flex-wrap">
                                {imagePreviews.map((url, idx) => (
                                    <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden shadow-sm group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setImagePreviews(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XCircleIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Fecha del Suceso</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} required max={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono de Contacto <span className="text-red-500">*</span></label>
                                <input type="tel" value={contact} onChange={e => setContact(e.target.value)} className={inputClass} placeholder="999888777" required />
                                <div className="flex items-center mt-2">
                                    <input type="checkbox" id="shareContact" checked={shareContactInfo} onChange={e => setShareContactInfo(e.target.checked)} className="mr-2 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded" />
                                    <label htmlFor="shareContact" className="text-sm text-gray-600">Mostrar número públicamente</label>
                                </div>
                            </div>
                        </div>

                        {status === PET_STATUS.PERDIDO && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">💰</span>
                                    <h4 className="font-bold text-yellow-800 text-sm">Recompensa (Opcional)</h4>
                                </div>
                                <div className="flex gap-2">
                                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-24 p-2 border border-yellow-300 rounded-lg bg-white font-bold text-gray-700">
                                        <option value="S/">S/</option>
                                        <option value="$">$</option>
                                    </select>
                                    <input type="number" value={reward} onChange={e => setReward(e.target.value === '' ? '' : Number(e.target.value))} className="flex-1 p-2 border border-yellow-300 rounded-lg" placeholder="Monto" />
                                </div>
                            </div>
                        )}

                        {!isEditMode && status === PET_STATUS.PERDIDO && (
                            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <InfoIcon className="text-blue-500 h-5 w-5 mt-0.5" />
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="createAlert" className="text-sm font-bold text-blue-900 cursor-pointer">Crear Alerta Automática</label>
                                        <input type="checkbox" id="createAlert" checked={createAlert} onChange={e => setCreateAlert(e.target.checked)} className="h-5 w-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                                    </div>
                                    <p className="text-xs text-blue-700 mt-1">Te avisaremos inmediatamente si alguien reporta haber encontrado una mascota con estas características.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </form>

                <div className="p-6 bg-gray-50 border-t flex justify-end gap-4 rounded-b-xl shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                    <button type="button" onClick={handleSubmit} disabled={isUploading} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-dark transition-all transform hover:-translate-y-0.5 disabled:opacity-50">
                        {isUploading ? 'Subiendo...' : (isEditMode ? 'Guardar Cambios' : 'Publicar Reporte')}
                    </button>
                </div>
            </div>
        </div>
    );
};
