
import React, { useState, useEffect, useRef } from 'react';
import { Business, BusinessProduct } from '@/types';
import { businessService } from '@/services/businessService';
import { XCircleIcon, PlusIcon, TrashIcon, StoreIcon, LocationMarkerIcon, CrosshairIcon, FacebookIcon, InstagramIcon, ExternalLinkIcon, InfoIcon } from '@/shared/components/icons';
import { uploadImage } from '@/utils/imageUtils';
import { departments, getProvinces, getDistricts } from '@/data/locations';

interface BusinessManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
}

// Component to explain image purpose
const ImageHelper: React.FC<{ type: 'Logo' | 'Portada' }> = ({ type }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    let description = "";
    let previewStyle = "";

    switch (type) {
        case 'Logo':
            description = "Es la imagen de perfil de tu negocio. Aparece en los listados, en el mapa y junto a tu nombre.";
            previewStyle = "w-10 h-10 rounded-full bg-blue-500 border-2 border-white shadow";
            break;
        case 'Portada':
            description = "Es la imagen principal de fondo (Hero). Se recomienda una resolución de 1500x500 px para que se vea nítida en todos los dispositivos.";
            previewStyle = "w-full h-16 bg-gray-300 rounded-t-lg opacity-50";
            break;
    }

    return (
        <div className="relative inline-block ml-2">
            <button 
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-blue-500 transition-colors"
            >
                <InfoIcon className="w-4 h-4" />
            </button>
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded p-3 shadow-xl z-50 pointer-events-none">
                    <p className="font-bold mb-2">{type}</p>
                    <p className="mb-2 opacity-90">{description}</p>
                    <div className="bg-white p-2 rounded text-gray-800">
                        <div className="border border-gray-300 rounded p-1 relative h-24 bg-gray-50 flex flex-col">
                            {type === 'Portada' && <div className={previewStyle}></div>}
                            <div className="flex items-center gap-2 mt-2 px-2">
                                {type === 'Logo' && <div className={previewStyle}></div>}
                                <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-center mt-1 text-gray-500">Vista Previa</p>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            )}
        </div>
    );
};

const normalizeLocationName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/(provincia|departamento|distrito|region|municipalidad) de /g, "") 
        .trim();
};

const BusinessManagementModal: React.FC<BusinessManagementModalProps> = ({ isOpen, onClose, businessId }) => {
    const [business, setBusiness] = useState<Business | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'products'>('details');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState<Partial<Business>>({});
    
    // Location State
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedProv, setSelectedProv] = useState('');
    const [selectedDist, setSelectedDist] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [provinces, setProvinces] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);

    const [newProduct, setNewProduct] = useState<Partial<BusinessProduct>>({ name: '', price: 0, description: '', imageUrls: [] });
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Map State
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const isMounted = useRef(true);
    const isUpdatingFromMapRef = useRef(false);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen && businessId) {
            setLoading(true);
            businessService.getBusinessById(businessId).then(data => {
                if (!isMounted.current) return;
                setBusiness(data);
                setFormData(data || {});
                
                // Attempt to parse address if it follows the format "Street, District, Province, Department"
                if (data?.address) {
                    const parts = data.address.split(',').map(p => p.trim());
                    if (parts.length >= 4) {
                        const dept = parts[parts.length - 1];
                        const prov = parts[parts.length - 2];
                        const dist = parts[parts.length - 3];
                        const street = parts.slice(0, parts.length - 3).join(', ');
                        
                        setSelectedDept(dept);
                        setSelectedProv(prov);
                        setSelectedDist(dist);
                        setStreetAddress(street);
                    } else {
                        setStreetAddress(data.address);
                    }
                }
                
                setLoading(false);
            });
        }
    }, [isOpen, businessId]);

    // Update location lists
    useEffect(() => {
        if (selectedDept) {
            setProvinces(getProvinces(selectedDept));
        } else {
            setProvinces([]);
            setDistricts([]);
        }
    }, [selectedDept]);

    useEffect(() => {
        if (selectedDept && selectedProv) {
            setDistricts(getDistricts(selectedDept, selectedProv));
        } else {
            setDistricts([]);
        }
    }, [selectedDept, selectedProv]);

    // Initialize Map
    useEffect(() => {
        if (!isOpen || activeTab !== 'details') return;

        const timer = setTimeout(() => {
            if (!mapRef.current || !isMounted.current) return;
            
            const L = (window as any).L;
            if (!L) return;

            // Logic to reverse geocode coordinates to address
            const updateAddressFromCoords = async (latitude: number, longitude: number) => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                        headers: { 'Accept-Language': 'es-ES,es;q=0.9' }
                    });
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

                        // Detect Department
                        const apiState = addr.state || addr.region;
                        if (apiState) {
                            const normalizedApiState = normalizeLocationName(apiState);
                            newDept = departments.find(d => normalizeLocationName(d) === normalizedApiState) || 
                                      departments.find(d => normalizedApiState.includes(normalizeLocationName(d))) || '';
                        }

                        // Detect Province
                        if (newDept) {
                            newProvincesList = getProvinces(newDept);
                            const apiProv = addr.province || addr.region || addr.city || addr.county;
                            if (apiProv) {
                                const normalizedApiProv = normalizeLocationName(apiProv);
                                newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedApiProv) || 
                                          newProvincesList.find(p => normalizedApiProv.includes(normalizeLocationName(p))) || '';
                            }
                            if (!newProv && addr.city) {
                                const normalizedCity = normalizeLocationName(addr.city);
                                newProv = newProvincesList.find(p => normalizeLocationName(p) === normalizedCity) || '';
                            }
                        }

                        // Detect District
                        if (newDept && newProv) {
                            newDistrictsList = getDistricts(newDept, newProv);
                            const apiDist = addr.district || addr.town || addr.city_district || addr.suburb || addr.village || addr.neighbourhood;
                            if (apiDist) {
                                const normalizedApiDist = normalizeLocationName(apiDist);
                                newDist = newDistrictsList.find(d => normalizeLocationName(d) === normalizedApiDist) ||
                                          newDistrictsList.find(d => normalizedApiDist.includes(normalizeLocationName(d))) || '';
                            }
                        }

                        isUpdatingFromMapRef.current = true;
                        if (newProvincesList.length > 0) setProvinces(newProvincesList);
                        if (newDistrictsList.length > 0) setDistricts(newDistrictsList);

                        setSelectedDept(newDept);
                        setSelectedProv(newProv);
                        setSelectedDist(newDist);
                        setStreetAddress(newAddress || road);

                        setTimeout(() => { if (isMounted.current) isUpdatingFromMapRef.current = false; }, 1000);
                    }
                } catch (err) {
                    console.warn("Reverse geocoding error:", err);
                }
            };

            if (!mapInstance.current) {
                const initialLat = formData.lat || -12.046374;
                const initialLng = formData.lng || -77.042793;

                mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(mapInstance.current);

                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                });

                if (formData.lat && formData.lng) {
                    markerInstance.current = L.marker([formData.lat, formData.lng], { icon, draggable: true }).addTo(mapInstance.current);
                }

                const handleMarkerUpdate = (lat: number, lng: number) => {
                    setFormData(prev => ({ ...prev, lat, lng }));
                    updateAddressFromCoords(lat, lng);
                };

                mapInstance.current.on('click', (e: any) => {
                    const { lat, lng } = e.latlng;
                    if (markerInstance.current) {
                        markerInstance.current.setLatLng([lat, lng]);
                    } else {
                        markerInstance.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapInstance.current);
                        markerInstance.current.on('dragend', (ev: any) => {
                            const { lat: dLat, lng: dLng } = ev.target.getLatLng();
                            handleMarkerUpdate(dLat, dLng);
                        });
                    }
                    handleMarkerUpdate(lat, lng);
                });

                if(markerInstance.current) {
                    markerInstance.current.on('dragend', (e: any) => {
                        const { lat, lng } = e.target.getLatLng();
                        handleMarkerUpdate(lat, lng);
                    });
                }
            } else {
                mapInstance.current.invalidateSize();
            }
        }, 500); 

        return () => clearTimeout(timer);
    }, [isOpen, activeTab]);

    // Forward Geocoding (Text -> Map)
    useEffect(() => {
        if (isUpdatingFromMapRef.current || !selectedDist || !selectedProv) return;
        
        const timeoutId = setTimeout(async () => {
            if (!isMounted.current) return;
            const query = `${streetAddress}, ${selectedDist}, ${selectedProv}, ${selectedDept}, Peru`;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
                    headers: { 'Accept-Language': 'es-ES,es;q=0.9' }
                });
                const data = await response.json();
                if (data && data.length > 0 && mapInstance.current) {
                    const { lat, lon } = data[0];
                    const newLat = parseFloat(lat);
                    const newLng = parseFloat(lon);
                    
                    setFormData(prev => ({ ...prev, lat: newLat, lng: newLng }));
                    mapInstance.current.setView([newLat, newLng], 16);
                    
                    if (markerInstance.current) {
                        markerInstance.current.setLatLng([newLat, newLng]);
                    } else {
                        const L = (window as any).L;
                        const icon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                            iconSize: [30, 42],
                            iconAnchor: [15, 42]
                        });
                        markerInstance.current = L.marker([newLat, newLng], { icon, draggable: true }).addTo(mapInstance.current);
                    }
                }
            } catch (e) { console.warn(e); }
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [streetAddress, selectedDist, selectedProv, selectedDept]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
            
            if (mapInstance.current) {
                mapInstance.current.setView([latitude, longitude], 16);
                const L = (window as any).L;
                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class='marker-pin sighted'></div><i class='material-icons'></i>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                });
                
                if (markerInstance.current) {
                    markerInstance.current.setLatLng([latitude, longitude]);
                } else {
                    markerInstance.current = L.marker([latitude, longitude], { icon, draggable: true }).addTo(mapInstance.current);
                    markerInstance.current.on('dragend', (e: any) => {
                        const { lat, lng } = e.target.getLatLng();
                        setFormData(prev => ({ ...prev, lat, lng }));
                    });
                }
            }
        });
    };

    const handleSaveDetails = async () => {
        if (!business) return;
        
        // Construct full address
        const fullAddress = [streetAddress, selectedDist, selectedProv, selectedDept].filter(Boolean).join(', ');
        const updatedData = {
            ...formData,
            address: fullAddress
        };

        setIsSaving(true);
        try {
            await businessService.updateBusiness(business.id, updatedData);
            alert('Datos actualizados correctamente');
        } catch (error) {
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddProduct = async () => {
        if (!business || !newProduct.name || !newProduct.price) {
            alert('Nombre y precio son obligatorios');
            return;
        }
        setIsSaving(true);
        try {
            await businessService.addProduct({
                businessId: business.id,
                name: newProduct.name,
                description: newProduct.description,
                price: Number(newProduct.price),
                imageUrls: newProduct.imageUrls
            });
            // Refresh
            const updated = await businessService.getBusinessById(business.id);
            setBusiness(updated);
            setNewProduct({ name: '', price: 0, description: '', imageUrls: [] });
            setIsAddingProduct(false);
        } catch (error) {
            console.error(error);
            alert('Error al agregar producto');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('¿Eliminar producto?')) return;
        if (!business) return;
        try {
            await businessService.deleteProduct(productId);
            // Refresh
            const updated = await businessService.getBusinessById(business.id);
            setBusiness(updated);
        } catch (e) { alert('Error al eliminar'); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'coverUrl' | 'bannerUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData(prev => ({ ...prev, [field]: url }));
        } catch (e) { 
            alert('Error subiendo imagen'); 
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteImage = (field: 'logoUrl' | 'coverUrl' | 'bannerUrl') => {
        setFormData(prev => ({ ...prev, [field]: '' }));
    };

    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        if ((newProduct.imageUrls?.length || 0) + files.length > 3) {
            alert('Máximo 3 imágenes por producto');
            return;
        }

        setIsUploading(true);
        try {
            const newUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadImage(files[i]);
                newUrls.push(url);
            }
            setNewProduct(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...newUrls] }));
        } catch (e) {
            alert('Error subiendo imágenes');
        } finally {
            setIsUploading(false);
        }
    };

    const removeProductImage = (index: number) => {
        setNewProduct(prev => ({
            ...prev,
            imageUrls: prev.imageUrls?.filter((_, i) => i !== index)
        }));
    };

    const inputClass = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary bg-white text-gray-900";

    if (!isOpen) return null;
    if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center text-white z-[3000]">Cargando...</div>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[3000] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-gray-900">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <StoreIcon className="text-brand-primary h-6 w-6" />
                        <h2 className="text-xl font-bold text-gray-800">Gestionar Mi Negocio</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircleIcon className="h-8 w-8"/></button>
                </div>

                <div className="flex border-b bg-white">
                    <button 
                        onClick={() => setActiveTab('details')} 
                        className={`flex-1 py-3 font-bold text-sm ${activeTab === 'details' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Detalles de la Tienda
                    </button>
                    <button 
                        onClick={() => setActiveTab('products')} 
                        className={`flex-1 py-3 font-bold text-sm ${activeTab === 'products' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Productos y Servicios
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow bg-gray-50">
                    {activeTab === 'details' && (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Negocio</label>
                                    <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono / WhatsApp</label>
                                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="999888777" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={inputClass} />
                            </div>

                            {/* Hierarchical Location Fields */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2"><LocationMarkerIcon className="h-4 w-4 text-brand-primary"/> Ubicación</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Departamento</label>
                                        <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedProv(''); setSelectedDist(''); }} className={inputClass}>
                                            <option value="">Seleccionar</option>
                                            {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Provincia</label>
                                        <select value={selectedProv} onChange={(e) => { setSelectedProv(e.target.value); setSelectedDist(''); }} className={inputClass} disabled={!selectedDept}>
                                            <option value="">Seleccionar</option>
                                            {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Distrito</label>
                                        <select value={selectedDist} onChange={(e) => setSelectedDist(e.target.value)} className={inputClass} disabled={!selectedProv}>
                                            <option value="">Seleccionar</option>
                                            {districts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Dirección Exacta (Calle, Av, Nro)</label>
                                    <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className={inputClass} placeholder="Ej: Av. Arequipa 123" />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-xs font-bold text-gray-600">Ubicación en Mapa (Coordenadas)</label>
                                        <button onClick={handleGetCurrentLocation} className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 text-xs font-bold hover:bg-blue-600 transition-colors">
                                            <CrosshairIcon className="w-3 h-3"/> Usar mi ubicación
                                        </button>
                                    </div>
                                    <div className="w-full h-64 rounded border border-gray-300 shadow-inner relative z-0">
                                        <div ref={mapRef} className="w-full h-full"></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Arrastra el pin para ajustar la posición exacta en el mapa. La dirección se actualizará automáticamente.</p>
                                </div>
                            </div>

                            {/* Social Media Section */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                <h4 className="font-bold text-gray-800">Redes Sociales y Web</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1"><FacebookIcon className="h-3 w-3"/> Facebook (Link)</label>
                                        <input type="url" value={formData.facebook || ''} onChange={e => setFormData({...formData, facebook: e.target.value})} className={inputClass} placeholder="https://facebook.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1"><InstagramIcon className="h-3 w-3"/> Instagram (Link)</label>
                                        <input type="url" value={formData.instagram || ''} onChange={e => setFormData({...formData, instagram: e.target.value})} className={inputClass} placeholder="https://instagram.com/..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1"><ExternalLinkIcon className="h-3 w-3"/> Sitio Web</label>
                                        <input type="url" value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} className={inputClass} placeholder="https://mitienda.com" />
                                    </div>
                                </div>
                            </div>

                            {/* Images Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-gray-800">Logo</p>
                                        <ImageHelper type="Logo" />
                                    </div>
                                    <div className="w-24 h-24 bg-gray-100 rounded-full mb-3 border overflow-hidden flex items-center justify-center relative group mt-2">
                                        {formData.logoUrl ? (
                                            <>
                                                <img src={formData.logoUrl} className="w-full h-full object-cover" alt="logo preview" />
                                                <button onClick={() => handleDeleteImage('logoUrl')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon />
                                                </button>
                                            </>
                                        ) : <span className="text-gray-400 text-xs">Sin Logo</span>}
                                    </div>
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-100 transition-colors w-full">
                                        Subir Logo
                                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logoUrl')} className="hidden" disabled={isUploading} />
                                    </label>
                                </div>

                                <div className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-gray-800">Portada (Hero)</p>
                                        <ImageHelper type="Portada" />
                                    </div>
                                    <div className="w-full h-24 bg-gray-100 rounded mb-3 border overflow-hidden flex items-center justify-center relative group mt-2">
                                        {formData.coverUrl ? (
                                            <>
                                                <img src={formData.coverUrl} className="w-full h-full object-cover" alt="cover preview" />
                                                <button onClick={() => handleDeleteImage('coverUrl')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon />
                                                </button>
                                            </>
                                        ) : <span className="text-gray-400 text-xs">Sin Portada</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mb-2">Recomendado: 1500x500 px</p>
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-bold hover:bg-blue-100 transition-colors w-full">
                                        Subir Portada
                                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'coverUrl')} className="hidden" disabled={isUploading} />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button onClick={handleSaveDetails} disabled={isSaving || isUploading} className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 shadow-md transition-all">
                                    {(isSaving || isUploading) ? 'Procesando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">Mis Productos ({business?.products?.length || 0}/10)</h3>
                                {(business?.products?.length || 0) < 10 && (
                                    <button onClick={() => setIsAddingProduct(true)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-green-700 transition shadow-sm">
                                        <PlusIcon /> Agregar Nuevo
                                    </button>
                                )}
                            </div>

                            {isAddingProduct && (
                                <div className="bg-white p-4 rounded-lg shadow border border-green-200 mb-4 animate-fade-in">
                                    <h4 className="font-bold text-green-800 mb-3">Nuevo Producto</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-gray-700">Nombre</label>
                                            <input type="text" className={inputClass} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-gray-700">Precio (S/.)</label>
                                            <input type="number" className={inputClass} value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold mb-1 text-gray-700">Descripción</label>
                                        <textarea className={inputClass} rows={2} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-xs font-bold block mb-1 text-gray-700">Imágenes (Máx 3)</label>
                                        <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="text-xs w-full mb-2 text-gray-500" disabled={isUploading} />
                                        <div className="flex gap-2 mt-1">
                                            {newProduct.imageUrls?.map((url, idx) => (
                                                <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <button onClick={() => removeProductImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 text-xs font-bold hover:bg-red-700">×</button>
                                                </div>
                                            ))}
                                            {isUploading && <span className="text-xs text-gray-500 self-center animate-pulse">Subiendo...</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2 border-t">
                                        <button onClick={() => setIsAddingProduct(false)} className="text-gray-500 text-sm px-3 py-1 hover:text-gray-700">Cancelar</button>
                                        <button onClick={handleAddProduct} disabled={isSaving || isUploading} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50">Guardar</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {business?.products?.map(product => (
                                    <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex gap-3 items-start hover:shadow-md transition-shadow">
                                        <img src={product.imageUrls?.[0] || product.imageUrl || 'https://placehold.co/100'} className="w-20 h-20 object-cover rounded bg-gray-100 flex-shrink-0 border" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{product.name}</p>
                                            <p className="text-brand-primary font-black text-sm">S/. {product.price}</p>
                                            <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                                            {product.imageUrls && product.imageUrls.length > 1 && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded mt-1 inline-block border">+{product.imageUrls.length - 1} fotos</span>
                                            )}
                                        </div>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors"><TrashIcon /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessManagementModal;
