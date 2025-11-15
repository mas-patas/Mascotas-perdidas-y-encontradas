import React, { useState, useEffect } from 'react';
import type { Pet, AnimalType, PetSize } from '../types';
import { ANIMAL_TYPES, SIZES, PET_STATUS } from '../constants';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { locations, cities } from '../data/locations';
import { XCircleIcon } from './icons';

interface ReportAdoptionFormProps {
    onClose: () => void;
    onSubmit: (pet: Omit<Pet, 'id' | 'userEmail'>) => void;
}

interface AdoptionFormData {
    name: string;
    animalType: AnimalType;
    breed: string;
    size: PetSize;
    city: string;
    district: string;
    description: string;
    adoptionRequirements: string;
    contact: string;
}

export const ReportAdoptionForm: React.FC<ReportAdoptionFormProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState<AdoptionFormData>({
        name: '',
        animalType: ANIMAL_TYPES.PERRO,
        breed: dogBreeds[0],
        size: SIZES.MEDIANO,
        city: '',
        district: '',
        description: '',
        adoptionRequirements: '',
        contact: '',
    });
    
    const [color1, setColor1] = useState('');
    const [color2, setColor2] = useState('');
    const [color3, setColor3] = useState('');
    
    const [breeds, setBreeds] = useState(dogBreeds);
    const [districts, setDistricts] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [customAnimalType, setCustomAnimalType] = useState('');
    const [customBreed, setCustomBreed] = useState('');

    useEffect(() => {
        if (formData.animalType === ANIMAL_TYPES.PERRO) {
            setBreeds(dogBreeds);
            setFormData(prev => ({ ...prev, breed: dogBreeds[0] }));
            setCustomAnimalType('');
        } else if (formData.animalType === ANIMAL_TYPES.GATO) {
            setBreeds(catBreeds);
            setFormData(prev => ({ ...prev, breed: catBreeds[0] }));
            setCustomAnimalType('');
        } else {
            setBreeds(['Otro']);
            setFormData(prev => ({ ...prev, breed: 'Otro' }));
        }
        setColor1('');
        setColor2('');
        setColor3('');
    }, [formData.animalType]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'breed' && value !== 'Otro') {
            setCustomBreed('');
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCity = e.target.value;
        setFormData(prev => ({ ...prev, city: selectedCity, district: '' }));
        setDistricts(locations[selectedCity as keyof typeof locations] || []);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if (imagePreviews.length + files.length > 3) {
                setError('Puedes subir un máximo de 3 fotos.');
                return;
            }
            const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            for (let i = 0; i < files.length; i++) {
                const file = files.item(i);
                if (file) {
                    if (!supportedTypes.includes(file.type)) {
                        setError('Formato de archivo no soportado. Por favor, usa JPEG, PNG, o WEBP.');
                        continue;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreviews(prev => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };
    
    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (imagePreviews.length === 0) {
            setError("Por favor, sube al menos una foto de la mascota.");
            return;
        }

        if (!formData.contact.trim()) {
            setError("La información de contacto es obligatoria.");
            return;
        }

        const contactValue = formData.contact.trim();
        if (/^\d+$/.test(contactValue) && !/^9\d{8}$/.test(contactValue)) {
            setError("El número de teléfono de contacto debe tener 9 dígitos y empezar con 9. Si es un email, asegúrate de que esté bien escrito.");
            return;
        }
        
        const finalColor = [color1, color2, color3].filter(Boolean).join(', ');

        if (!color1) {
            setError("Por favor, especifica al menos el color primario de la mascota.");
            return;
        }
        
        let finalDescription = formData.description;
        if (formData.animalType === ANIMAL_TYPES.OTRO) {
            if (!customAnimalType.trim()) {
                setError("Por favor, especifica el tipo de animal.");
                return;
            }
            finalDescription = `[Tipo: ${customAnimalType.trim()}] ${formData.description}`;
        }

        let finalBreed = formData.breed;
        if (formData.breed === 'Otro') {
            if (!customBreed.trim()) {
                setError("Por favor, especifica la raza.");
                return;
            }
            finalBreed = customBreed.trim();
        }

        const petToSubmit: Omit<Pet, 'id' | 'userEmail'> = {
            status: PET_STATUS.EN_ADOPCION,
            name: formData.name || 'Sin Nombre',
            animalType: formData.animalType,
            breed: finalBreed,
            size: formData.size as PetSize,
            color: finalColor,
            location: [formData.district, formData.city].filter(Boolean).join(', '),
            date: new Date().toISOString(),
            contact: formData.contact,
            description: finalDescription,
            adoptionRequirements: formData.adoptionRequirements,
            imageUrls: imagePreviews,
        };
        
        onSubmit(petToSubmit);
    };

    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";
    const descriptionLegend = "Indica lo más importante de la mascota, como la edad si la conoces, si tiene vacunas, tiene alguna enfermedad, alguna discapacidad, y toda la información adicional que consideres importante que el adoptante deba saber.";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
                    <h2 className="text-2xl font-bold text-brand-dark mb-6">
                        Publicar Mascota en Adopción
                    </h2>
                    
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Nombre de la Mascota <span className="text-red-500">*</span></label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} placeholder="Ej: Luna" required />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Tipo de Animal <span className="text-red-500">*</span></label>
                                <select name="animalType" value={formData.animalType} onChange={handleInputChange} className={inputClass} required>
                                    <option value={ANIMAL_TYPES.PERRO}>Perro</option>
                                    <option value={ANIMAL_TYPES.GATO}>Gato</option>
                                    <option value={ANIMAL_TYPES.OTRO}>Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Raza <span className="text-red-500">*</span></label>
                                <select name="breed" value={formData.breed} onChange={handleInputChange} className={inputClass} required>
                                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {formData.animalType === ANIMAL_TYPES.OTRO && (
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Especificar Tipo de Animal <span className="text-red-500">*</span></label>
                                <input type="text" value={customAnimalType} onChange={(e) => setCustomAnimalType(e.target.value)} className={inputClass} placeholder="Ej: Conejo" required />
                            </div>
                        )}
                        
                        {formData.breed === 'Otro' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-900">Especificar Raza <span className="text-red-500">*</span></label>
                                <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className={inputClass} placeholder="Ej: Cabeza de León" required />
                            </div>
                        )}

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Tamaño <span className="text-red-500">*</span></label>
                                <select name="size" value={formData.size} onChange={handleInputChange} className={inputClass} required>
                                    <option value={SIZES.PEQUENO}>Pequeño</option>
                                    <option value={SIZES.MEDIANO}>Mediano</option>
                                    <option value={SIZES.GRANDE}>Grande</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-md border">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Colores</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div>
                                    <label className="block text-xs font-medium text-gray-900">Color Primario <span className="text-red-500">*</span></label>
                                    <select value={color1} onChange={(e) => setColor1(e.target.value)} className={inputClass} required>
                                        <option value="">Seleccionar</option>
                                        {petColors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900">Ciudad <span className="text-red-500">*</span></label>
                                <select name="city" value={formData.city} onChange={handleCityChange} className={inputClass} required>
                                    <option value="">Selecciona una ciudad</option>
                                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-900">Distrito <span className="text-red-500">*</span></label>
                                <select name="district" value={formData.district} onChange={handleInputChange} className={inputClass} required disabled={!formData.city || districts.length === 0}>
                                    <option value="">Selecciona un distrito</option>
                                    {districts.map(district => <option key={district} value={district}>{district}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-900">Descripción <span className="text-red-500">*</span></label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} className={inputClass} placeholder="Describe el carácter, comportamiento y necesidades de la mascota." required></textarea>
                            <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">{descriptionLegend}</p>
                        </div>
                        
                        <div>
                            <label htmlFor="adoptionRequirements" className="block text-sm font-medium text-gray-900">Requisitos para la Adopción (Opcional)</label>
                            <textarea id="adoptionRequirements" name="adoptionRequirements" value={formData.adoptionRequirements} onChange={handleInputChange} rows={3} className={inputClass} placeholder="Ej: Necesita patio, no convive con otros gatos, requiere familia con experiencia, etc."></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">Fotos de la Mascota (hasta 3) <span className="text-red-500">*</span></label>
                            <input type="file" accept="image/jpeg, image/png, image/webp" multiple onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-100" disabled={imagePreviews.length >= 3}/>
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
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Información de Contacto <span className="text-red-500">*</span></label>
                            <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className={inputClass} placeholder="Tu teléfono o email" required />
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark">
                                Publicar Anuncio de Adopción
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
