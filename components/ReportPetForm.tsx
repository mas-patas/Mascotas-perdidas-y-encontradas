
import React, { useState, useEffect, useRef } from 'react';
import type { Pet, PetStatus, PetSize, AnimalType, OwnedPet } from '../types';
import { PET_STATUS, ANIMAL_TYPES, SIZES } from '../constants';
import { generatePetDescription } from '../services/geminiService';
import { SparklesIcon, XCircleIcon, LocationMarkerIcon, CrosshairIcon, DogIcon, CatIcon, InfoIcon } from './icons';
import { departments, getProvinces, getDistricts, locationCoordinates } from '../data/locations';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { uploadImage } from '../utils/imageUtils';


interface ReportPetFormProps {
    onClose: () => void;
    onSubmit: (pet: Omit<Pet, 'id' | 'userEmail'>, idToUpdate?: string) => void;
    initialStatus: PetStatus;
    petToEdit?: Pet | null;
    petFromProfile?: OwnedPet | null;
}

interface FormDataState {
    status: PetStatus;
    name: string;
    animalType: AnimalType;
    breed: string;
    size: PetSize;
    department: string;
    province: string;
    district: string;
    address: string;
    contact: string;
    description: string;
    date: string;
    lat?: number;
    lng?: number;
}

// Helper for normalizing strings for comparison (removes accents, lowercase, specific prefixes)
const normalizeLocationName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/(provincia|departamento|distrito|region|municipalidad) de /g, "") // Remove prefixes
        .trim();
};

export const ReportPetForm: React.FC<ReportPetFormProps> = ({ onClose, onSubmit, initialStatus, petToEdit, petFromProfile }) => {
    const isEditMode = !!petToEdit;
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const isUpdatingFromMapRef = useRef(false); // Lock to prevent loop
    
    // Safety guard against unmounted state updates
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const [formData, setFormData] = useState<FormDataState>({
        status: initialStatus,
        name: '',
        animalType: ANIMAL_TYPES.PERRO,
        breed: dogBreeds[0],
        size: SIZES.MEDIANO,
        department: 'Lima',
        province: '',
        district: '',
        address: '',
        contact: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });
    
    const [color1, setColor1] = useState('');
    const [color2, setColor2] = useState('');
    const [color3, setColor3] = useState('');
    
    const [breeds, setBreeds] = useState(dogBreeds);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [customAnimalType, setCustomAnimalType] = useState('');
    const [customBreed, setCustomBreed] = useState('');
    const [shareContactInfo, setShareContactInfo] = useState(true);

    const isEncontrado = formData.status === PET_STATUS.ENCONTRADO;
    const isPerdido = formData.status === PET_STATUS.PERDIDO;

    // Initialize Proviences for default Department
    useEffect(() => {
        if (formData.department) {
            setProvinces(getProvinces(formData.department));
        }
    }, []);
    
    // Initialize Map
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isMounted.current) return;
            if (!mapRef.current) return;
            
            const L = (window as any).L;
            if (!L || mapInstance.current) return;

            const initialLat = formData.lat || locationCoordinates['Lima'].lat;
            const initialLng = formData.lng || locationCoordinates['Lima'].lng;

            mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='marker-pin ${formData.status === PET_STATUS.ENCONTRADO ? 'found' : formData.status === PET_STATUS.AVISTADO ? 'sighted' : 'lost'}'></div><i class='material-icons'></i>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });

            const updateAddressFromCoords = async (lat: number, lng: number) => {
                if (!isMounted.current) return;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await response.json();
                    
                    if (data && data.address && isMounted.current) {
                        const addr = data.address;
                        const road = addr.road || '';
                        const number = addr.house_number || '';
                        const newAddress = `${road} ${number}`.trim();

                        // Logic to auto-detect Department, Province, District
                        let newDept = '';
                        let newProv = '';
                        let newDist = '';
                        let newProvincesList: string[] = [];
                        let newDistrictsList: string[] = [];

                        // 1. Identify Department
                        const apiState = addr.state || addr.region;
                        if (apiState) {
                            const normalizedApiState = normalizeLocationName(apiState);
                            newDept = departments.find(d => normalizeLocationName(d) === normalizedApiState) || 
                                      departments.find(d => normalizedApiState.includes(normalizeLocationName(d))) || '';
                        }

                        // 2. Identify Province
                        if (newDept) {
                            newProvincesList = getProvinces(newDept);
                            // OSM can map province to 'province', 'region', 'city', or 'county'
                            const apiProv = addr.province || addr.region || addr.city || addr.county;
                            
                            if (apiProv) {
                                const normalizedApiProv = normalizeLocationName(apiProv);
                                newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedApiProv) || 
                                          newProvincesList.find(p => normalizedApiProv.includes(normalizeLocationName(p))) || '';
                            }
                            
                             // Fallback: sometimes City name is the Province name (e.g. Lima)
                            if (!newProv && addr.city) {
                                const normalizedCity = normalizeLocationName(addr.city);
                                newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedCity) || '';
                            }
                        }

                        // 3. Identify District
                        if (newDept && newProv) {
                            newDistrictsList = getDistricts(newDept, newProv);
                            // OSM can map district to 'district', 'town', 'city_district', 'suburb', 'village', 'neighbourhood'
                            const apiDist = addr.district || addr.town || addr.city_district || addr.suburb || addr.village || addr.neighbourhood;
                            if (apiDist) {
                                const normalizedApiDist = normalizeLocationName(apiDist);
                                newDist = newDistrictsList.find(d => normalizeLocationName(d) === normalizedApiDist) ||
                                          newDistrictsList.find(d => normalizedApiDist.includes(normalizeLocationName(d))) || '';
                            }
                        }
                        
                        isUpdatingFromMapRef.current = true;
                        
                        // Update lists if found - CRITICAL: These setters are async, so React might not update state immediately
                        // but passing valid values to setFormData works because the select will pick it up if the list matches
                        if (newProvincesList.length > 0) setProvinces(newProvincesList);
                        if (newDistrictsList.length > 0) setDistricts(newDistrictsList);

                        setFormData(prev => ({ 
                            ...prev, 
                            address: newAddress || prev.address,
                            department: newDept || prev.department,
                            province: newProv || (newDept ? '' : prev.province),
                            district: newDist || (newProv ? '' : prev.district)
                        }));

                        setTimeout(() => { if (isMounted.current) isUpdatingFromMapRef.current = false; }, 2000); // Release lock
                    }
                } catch (err) {
                    console.error("Reverse geocoding error", err);
                }
            };

            const onDragEnd = (event: any) => {
                if (!isMounted.current) return;
                const position = event.target.getLatLng();
                setFormData(prev => ({ ...prev, lat: position.lat, lng: position.lng }));
                updateAddressFromCoords(position.lat, position.lng);
            };

            if (formData.lat && formData.lng) {
                markerInstance.current = L.marker([formData.lat, formData.lng], { 
                    icon: icon,
                    draggable: true 
                }).addTo(mapInstance.current);
                markerInstance.current.on('dragend', onDragEnd);
            }

            mapInstance.current.on('click', (e: any) => {
                if (!isMounted.current) return;
                const { lat, lng } = e.latlng;
                if (markerInstance.current) {
                    markerInstance.current.setLatLng([lat, lng]);
                } else {
                    markerInstance.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapInstance.current);
                    markerInstance.current.on('dragend', onDragEnd);
                }
                setFormData(prev => ({ ...prev, lat, lng }));
                updateAddressFromCoords(lat, lng);
            });
            
            setTimeout(() => { if(isMounted.current) mapInstance.current.invalidateSize(); }, 200);
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []); 

    // Forward Geocoding (Address -> Coords)
    useEffect(() => {
        if (!formData.address || isUpdatingFromMapRef.current) return;

        const timeoutId = setTimeout(async () => {
            if (!isMounted.current) return;
            try {
                // Construct cleaner query to avoid empty parts
                const queryParts = [formData.address, formData.district, formData.province, formData.department, 'Peru'].filter(part => part && part.trim() !== '');
                const query = queryParts.join(', ');
                
                if (!query) return;

                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data && data.length > 0 && isMounted.current) {
                    const { lat, lon } = data[0];
                    const newLat = parseFloat(lat);
                    const newLng = parseFloat(lon);

                    setFormData(prev => ({ ...prev, lat: newLat, lng: newLng }));

                    if (mapInstance.current) {
                        mapInstance.current.invalidateSize(); // Force refresh size
                        mapInstance.current.setView([newLat, newLng], 16);
                        if (markerInstance.current) {
                            markerInstance.current.setLatLng([newLat, newLng]);
                        } else {
                            const L = (window as any).L;
                            const icon = L.divIcon({
                                className: 'custom-div-icon',
                                html: `<div class='marker-pin ${formData.status === PET_STATUS.ENCONTRADO ? 'found' : formData.status === PET_STATUS.AVISTADO ? 'sighted' : 'lost'}'></div><i class='material-icons'></i>`,
                                iconSize: [30, 42],
                                iconAnchor: [15, 42]
                            });
                            markerInstance.current = L.marker([newLat, newLng], { icon, draggable: true }).addTo(mapInstance.current);
                            
                            markerInstance.current.on('dragend', (event: any) => {
                                const position = event.target.getLatLng();
                                setFormData(prev => ({ ...prev, lat: position.lat, lng: position.lng }));
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Geocoding error:", error);
            }
        }, 1500); // Increased debounce to 1.5s to avoid excessive requests during typing

        return () => clearTimeout(timeoutId);
    }, [formData.address, formData.district, formData.province, formData.department]);

    // Center map when Department or Province changes
    useEffect(() => {
        // If the update is coming from the map interaction (isUpdatingFromMapRef), do NOT re-center the map.
        if (!mapInstance.current || isUpdatingFromMapRef.current) return;
        
        const coords = locationCoordinates[formData.province] || locationCoordinates[formData.department];
        if (coords) {
             mapInstance.current.invalidateSize();
             mapInstance.current.setView([coords.lat, coords.lng], 10);
        }
    }, [formData.department, formData.province]);


    useEffect(() => {
        if (petFromProfile) {
            setFormData(prev => ({
                ...prev,
                status: PET_STATUS.PERDIDO,
                name: petFromProfile.name,
                animalType: petFromProfile.animalType as AnimalType,
                breed: petFromProfile.breed,
                description: `Señas particulares: ${petFromProfile.description || 'No especificadas'}.`,
            }));
            const colors = petFromProfile.colors;
            setColor1(colors[0] || '');
            setColor2(colors[1] || '');
            setColor3(colors[2] || '');
            setImagePreviews(petFromProfile.imageUrls || []);
        }
    }, [petFromProfile]);

    useEffect(() => {
        if (isEditMode && petToEdit) {
            // Attempt to parse location string: "Address, District, Province, Department"
            const locationParts = petToEdit.location.split(', ').reverse(); // Dept, Prov, Dist, Addr
            
            let dept = 'Lima';
            let prov = 'Lima';
            let dist = '';
            let addr = '';

            if (locationParts.length >= 3) {
                dept = locationParts[0] || 'Lima';
                prov = locationParts[1] || '';
                dist = locationParts[2] || '';
                addr = locationParts.slice(3).reverse().join(', '); 
            } else if (locationParts.length > 0) {
                 const city = locationParts[0];
                 if (city === 'Arequipa' || city === 'Cusco' || city === 'Trujillo' || city === 'Piura' || city === 'Chiclayo') {
                     dept = city;
                     prov = city;
                 }
            }
            
            setProvinces(getProvinces(dept));
            setDistricts(getDistricts(dept, prov));

            let description = petToEdit.description;
            if (petToEdit.animalType === ANIMAL_TYPES.OTRO) {
                const match = description.match(/^\[Tipo: (.*?)\]\s*/);
                if (match) {
                    setCustomAnimalType(match[1]);
                    description = description.substring(match[0].length);
                }
            }

            let breed = petToEdit.breed;
            const currentBreeds = petToEdit.animalType === ANIMAL_TYPES.PERRO ? dogBreeds : (petToEdit.animalType === ANIMAL_TYPES.GATO ? catBreeds : []);
            if (petToEdit.animalType !== ANIMAL_TYPES.OTRO && !currentBreeds.includes(breed)) {
                setCustomBreed(breed);
                breed = 'Otro';
            } else if (petToEdit.animalType === ANIMAL_TYPES.OTRO) {
                 setCustomBreed(breed);
                 breed = 'Otro';
            }

            setFormData({
                status: petToEdit.status,
                name: petToEdit.name === 'Desconocido' ? '' : petToEdit.name,
                animalType: petToEdit.animalType,
                breed: breed,
                size: petToEdit.size || SIZES.MEDIANO,
                department: dept,
                province: prov,
                district: dist,
                address: addr,
                contact: petToEdit.contact === 'No aplica' ? '' : petToEdit.contact,
                description: description,
                date: petToEdit.date.split('T')[0],
                lat: petToEdit.lat,
                lng: petToEdit.lng
            });
            
            const colors = petToEdit.color.split(', ');
            setColor1(colors[0] || '');
            setColor2(colors[1] || '');
            setColor3(colors[2] || '');
            
            setImagePreviews(petToEdit.imageUrls);
            setShareContactInfo(petToEdit.shareContactInfo !== false);
        }
    }, [petToEdit, isEditMode]);

    useEffect(() => {
        if (formData.animalType === ANIMAL_TYPES.PERRO) {
            setBreeds(dogBreeds);
            if (!isEditMode && !petFromProfile) setFormData(prev => ({ ...prev, breed: dogBreeds[0] }));
            setCustomAnimalType('');
        } else if (formData.animalType === ANIMAL_TYPES.GATO) {
            setBreeds(catBreeds);
            if (!isEditMode && !petFromProfile) setFormData(prev => ({ ...prev, breed: catBreeds[0] }));
             setCustomAnimalType('');
        } else {
            setBreeds(['Otro']);
            if (!isEditMode && !petFromProfile) setFormData(prev => ({ ...prev, breed: 'Otro' }));
        }
        if (!isEditMode && !petFromProfile) {
            setColor1('');
            setColor2('');
            setColor3('');
        }
    }, [formData.animalType, isEditMode, petFromProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'breed' && value !== 'Otro') {
            setCustomBreed('');
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAnimalTypeChange = (type: AnimalType) => {
        setFormData(prev => ({ ...prev, animalType: type }));
    };

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dept = e.target.value;
        const newProvinces = getProvinces(dept);
        setProvinces(newProvinces);
        setDistricts([]);
        setFormData(prev => ({ ...prev, department: dept, province: '', district: '' }));
    };

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prov = e.target.value;
        const newDistricts = getDistricts(formData.department, prov);
        setDistricts(newDistricts);
        setFormData(prev => ({ ...prev, province: prov, district: '' }));
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
                    setError("Error al subir la imagen: " + (err.message || "Intentelo de nuevo."));
                    e.target.value = '';
                }
            } finally {
                if (isMounted.current) setIsUploading(false);
            }
        }
    };
    
    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerateDescription = async () => {
        const finalColor = [color1, color2, color3].filter(Boolean).join(', ');
        if (!formData.animalType || !formData.breed || !finalColor) {
            setError('Por favor, completa Tipo, Raza y Color para generar una descripción.');
            return;
        }
        setError('');
        setIsGenerating(true);
        try {
            const description = await generatePetDescription(formData.animalType, formData.breed, finalColor);
            if (isMounted.current) setFormData(prev => ({ ...prev, description }));
        } catch (err) {
            console.error(err);
            setError('No se pudo generar la descripción. Inténtalo de nuevo.');
        } finally {
            if (isMounted.current) setIsGenerating(false);
        }
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
                
                setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));

                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                    mapInstance.current.setView([latitude, longitude], 16);

                    const L = (window as any).L;
                    if (markerInstance.current) {
                        markerInstance.current.setLatLng([latitude, longitude]);
                    } else {
                        const icon = L.divIcon({
                             className: 'custom-div-icon',
                             html: `<div class='marker-pin ${formData.status === PET_STATUS.ENCONTRADO ? 'found' : formData.status === PET_STATUS.AVISTADO ? 'sighted' : 'lost'}'></div><i class='material-icons'></i>`,
                             iconSize: [30, 42],
                             iconAnchor: [15, 42]
                         });
                        markerInstance.current = L.marker([latitude, longitude], { icon, draggable: true }).addTo(mapInstance.current);
                         markerInstance.current.on('dragend', (event: any) => {
                             if (!isMounted.current) return;
                             const pos = event.target.getLatLng();
                             setFormData(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }));
                         });
                    }
                }

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.address && isMounted.current) {
                        const addr = data.address;
                        const road = addr.road || '';
                        const number = addr.house_number || '';
                        const newAddress = `${road} ${number}`.trim();
                        
                        if (newAddress) {
                             isUpdatingFromMapRef.current = true;
                             
                             // Copied logic for consistency
                             let newDept = '';
                             let newProv = '';
                             let newDist = '';
                             let newProvincesList: string[] = [];
                             let newDistrictsList: string[] = [];

                             const apiState = addr.state || addr.region;
                             if (apiState) {
                                const normalizedApiState = normalizeLocationName(apiState);
                                newDept = departments.find(d => normalizeLocationName(d) === normalizedApiState) || 
                                          departments.find(d => normalizedApiState.includes(normalizeLocationName(d))) || '';
                             }

                             if (newDept) {
                                newProvincesList = getProvinces(newDept);
                                const apiProv = addr.province || addr.region || addr.city || addr.county;
                                if (apiProv) {
                                    const normalizedApiProv = normalizeLocationName(apiProv);
                                    newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedApiProv) || 
                                              newProvincesList.find(p => normalizedApiProv.includes(normalizeLocationName(p))) || '';
                                }
                                // Fallback for city
                                if (!newProv && addr.city) {
                                    const normalizedCity = normalizeLocationName(addr.city);
                                    newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedCity) || '';
                                }
                             }

                             if (newDept && newProv) {
                                newDistrictsList = getDistricts(newDept, newProv);
                                const apiDist = addr.district || addr.town || addr.city_district || addr.suburb || addr.village || addr.neighbourhood;
                                if (apiDist) {
                                    const normalizedApiDist = normalizeLocationName(apiDist);
                                    newDist = newDistrictsList.find(d => normalizeLocationName(d) === normalizedApiDist) ||
                                              newDistrictsList.find(d => normalizedApiDist.includes(normalizeLocationName(d))) || '';
                                }
                             }

                             if (newProvincesList.length > 0) setProvinces(newProvincesList);
                             if (newDistrictsList.length > 0) setDistricts(newDistrictsList);

                             setFormData(prev => ({ 
                                 ...prev, 
                                 address: newAddress,
                                 department: newDept || prev.department,
                                 province: newProv || (newDept ? '' : prev.province),
                                 district: newDist || (newProv ? '' : prev.district)
                             }));
                             
                             setTimeout(() => { if (isMounted.current) isUpdatingFromMapRef.current = false; }, 2000);
                        }
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

        if(imagePreviews.length === 0) {
            setError("Por favor, sube al menos una foto de la mascota.");
            return;
        }

        const contactValue = formData.contact.trim();
        if (formData.status !== PET_STATUS.AVISTADO && contactValue && /^\d+$/.test(contactValue) && !/^9\d{8}$/.test(contactValue)) {
            setError("El número de teléfono de contacto debe tener 9 dígitos y empezar con 9. Si es un email, asegúrate de que esté bien escrito.");
            return;
        }
        
        const finalColor = [color1, color2, color3].filter(Boolean).join(', ');

        if (!color1) {
            setError("Por favor, especifica al menos el color primario de la mascota.");
            return;
        }
        
        let finalDescription = formData.description;
        let typeLabel = formData.animalType as string;

        if (formData.animalType === ANIMAL_TYPES.OTRO) {
            if (!customAnimalType.trim()) {
                setError("Por favor, especifica el tipo de animal.");
                return;
            }
            typeLabel = customAnimalType.trim();
            finalDescription = `[Tipo: ${typeLabel}] ${formData.description}`;
        }
        
        let finalBreed = formData.breed;
        if (formData.breed === 'Otro') {
            if (!customBreed.trim()) {
                setError("Por favor, especifica la raza.");
                return;
            }
            finalBreed = customBreed.trim();
        }

        let generatedName = formData.name;
        if (!isPerdido) {
            // For Found/Sighted, generate descriptive name like "Perro Encontrado"
            generatedName = `${typeLabel} ${formData.status}`;
        } else if (!generatedName.trim()) {
             // Fallback if name is missing for Lost pets
             generatedName = 'Desconocido';
        }

        const petToSubmit: Omit<Pet, 'id' | 'userEmail'> = {
            status: formData.status,
            name: generatedName,
            animalType: formData.animalType,
            breed: finalBreed,
            size: formData.size as PetSize,
            color: finalColor,
            location: [
                !isEncontrado ? formData.address : '',
                formData.district,
                formData.province,
                formData.department
            ].filter(Boolean).join(', '),
            date: new Date(formData.date).toISOString(),
            contact: formData.status === PET_STATUS.AVISTADO ? 'No aplica' : formData.contact,
            description: finalDescription,
            imageUrls: imagePreviews,
            shareContactInfo: formData.status === PET_STATUS.AVISTADO ? false : shareContactInfo,
            lat: formData.lat,
            lng: formData.lng
        };
        
        onSubmit(petToSubmit, petToEdit?.id);
    };

    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
                    <h2 className="text-2xl font-bold text-brand-dark mb-6">
                        {isEditMode ? 'Editar Publicación' : `Reportar Mascota ${initialStatus}`}
                    </h2>
                    
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Estado</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className={`${inputClass} bg-gray-100`} required disabled={!isEditMode}>
                                    <option value={PET_STATUS.PERDIDO}>Perdido</option>
                                    <option value={PET_STATUS.ENCONTRADO}>Encontrado</option>
                                    <option value={PET_STATUS.AVISTADO}>Avistado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Tipo de Animal <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => handleAnimalTypeChange(ANIMAL_TYPES.PERRO)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${formData.animalType === ANIMAL_TYPES.PERRO ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <DogIcon className="h-8 w-8 mb-1" />
                                        <span className="text-xs font-bold">Perro</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleAnimalTypeChange(ANIMAL_TYPES.GATO)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${formData.animalType === ANIMAL_TYPES.GATO ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <CatIcon className="h-8 w-8 mb-1" />
                                        <span className="text-xs font-bold">Gato</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleAnimalTypeChange(ANIMAL_TYPES.OTRO)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${formData.animalType === ANIMAL_TYPES.OTRO ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <InfoIcon />
                                        <span className="text-xs font-bold mt-1">Otro</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {formData.animalType === ANIMAL_TYPES.OTRO && (
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Especificar Tipo de Animal <span className="text-red-500">*</span></label>
                                <input type="text" value={customAnimalType} onChange={(e) => setCustomAnimalType(e.target.value)} className={inputClass} placeholder="Ej: Conejo, Loro" required />
                            </div>
                        )}
                        
                        {isPerdido && (
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Nombre de la Mascota <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} placeholder="Buddy" required disabled={!!petFromProfile} />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Raza <span className="text-red-500">*</span></label>
                                <select name="breed" value={formData.breed} onChange={handleInputChange} className={inputClass} required>
                                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Tamaño <span className="text-red-500">*</span></label>
                                <select name="size" value={formData.size} onChange={handleInputChange} className={inputClass} required>
                                    <option value={SIZES.PEQUENO}>Pequeño</option>
                                    <option value={SIZES.MEDIANO}>Mediano</option>
                                    <option value={SIZES.GRANDE}>Grande</option>
                                </select>
                            </div>
                        </div>

                        {formData.breed === 'Otro' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-900">Especificar Raza <span className="text-red-500">*</span></label>
                                <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className={inputClass} placeholder="Ej: Cabeza de León" required />
                            </div>
                        )}
                        
                        <div className="p-4 bg-gray-50 rounded-md border">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Colores</h3>
                            <div className="grid grid-cols-1 gap-4">
                                 <div>
                                    <label className="block text-xs font-medium text-gray-900 mb-2">Color Primario <span className="text-red-500">*</span></label>
                                    <select value={color1} onChange={(e) => setColor1(e.target.value)} className={inputClass} required>
                                        <option value="">Seleccionar</option>
                                        {petColors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-900">Color Secundario</label>
                                        <select value={color2} onChange={(e) => setColor2(e.target.value)} className={inputClass} disabled={!color1}>
                                            <option value="">Ninguno</option>
                                            {petColors.filter(c => c !== color1).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-900">Tercer Color</label>
                                        <select value={color3} onChange={(e) => setColor3(e.target.value)} className={inputClass} disabled={!color1 || !color2}>
                                            <option value="">Ninguno</option>
                                            {petColors.filter(c => c !== color1 && c !== color2).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchical Location Fields */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Departamento <span className="text-red-500">*</span></label>
                                <select name="department" value={formData.department} onChange={handleDepartmentChange} className={inputClass} required>
                                    <option value="">Seleccionar</option>
                                    {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Provincia <span className="text-red-500">*</span></label>
                                <select name="province" value={formData.province} onChange={handleProvinceChange} className={inputClass} required disabled={!formData.department}>
                                    <option value="">Seleccionar</option>
                                    {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-900">Distrito <span className="text-red-500">*</span></label>
                                <select name="district" value={formData.district} onChange={handleInputChange} className={inputClass} required disabled={!formData.province}>
                                    <option value="">Seleccionar</option>
                                    {districts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                                </select>
                            </div>
                        </div>
                        
                         <div>
                            <label className="block text-sm font-medium text-gray-900">Calle / Número / Referencia <span className="text-red-500">*</span></label>
                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`${inputClass}`} placeholder="Ej: Av. Arequipa 500" required />
                        </div>

                        {/* Interactive Map Section */}
                        <div>
                             <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-medium text-gray-900">Ubicación exacta (Opcional)</label>
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
                                <LocationMarkerIcon /> Mueve el pin para ajustar. La dirección se actualizará automáticamente.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">Fecha del Suceso <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className={inputClass}
                                required
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-900">
                                Descripción
                                {formData.status !== PET_STATUS.AVISTADO && <span className="text-red-500"> *</span>}
                            </label>
                            <textarea 
                                name="description" 
                                value={formData.description} onChange={handleInputChange} rows={3} 
                                className={inputClass} 
                                placeholder="Señales particulares, comportamiento..." 
                                required={formData.status !== PET_STATUS.AVISTADO}
                            />
                            <button
                                type="button"
                                onClick={handleGenerateDescription}
                                disabled={isGenerating}
                                className="mt-2 flex items-center gap-2 text-sm text-brand-primary hover:text-brand-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon />
                                {isGenerating ? 'Generando...' : 'Generar descripción con IA'}
                            </button>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Fotos de la Mascota (hasta 3) <span className="text-red-500">*</span></label>
                            <input type="file" accept="image/jpeg, image/png, image/webp" multiple onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-100" disabled={imagePreviews.length >= 3 || isUploading}/>
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
                        
                        {formData.status !== PET_STATUS.AVISTADO && (
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Información de Contacto <span className="text-red-500">*</span></label>
                                <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className={inputClass} placeholder="Tu teléfono o email" required />
                                <div className="mt-2 flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="shareContact"
                                            name="shareContact"
                                            type="checkbox"
                                            checked={shareContactInfo}
                                            onChange={(e) => setShareContactInfo(e.target.checked)}
                                            className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="shareContact" className="font-medium text-gray-700">Compartir públicamente mi contacto</label>
                                        <p className="text-gray-500">Si desmarcas esta opción, otros usuarios solo podrán contactarte a través del chat de la aplicación.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button type="submit" disabled={isUploading} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed">
                                {isUploading ? 'Subiendo...' : (isEditMode ? 'Guardar Cambios' : 'Publicar Reporte')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
