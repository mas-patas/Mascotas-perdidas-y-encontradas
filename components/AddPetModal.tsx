
import React, { useState, useEffect } from 'react';
import type { OwnedPet } from '../types';
import { dogBreeds, catBreeds, petColors } from '../data/breeds';
import { XCircleIcon, DogIcon, CatIcon } from './icons';
import { uploadImage } from '../utils/imageUtils';


interface AddPetModalProps {
    onClose: () => void;
    onSubmit: (pet: Omit<OwnedPet, 'id'>) => Promise<void>;
    onUpdate: (pet: OwnedPet) => Promise<void>;
    petToEdit?: OwnedPet | null;
}

const AddPetModal: React.FC<AddPetModalProps> = ({ onClose, onSubmit, onUpdate, petToEdit }) => {
    const isEditMode = !!petToEdit;
    const [name, setName] = useState('');
    const [animalType, setAnimalType] = useState<'Perro' | 'Gato'>('Perro');
    const [breed, setBreed] = useState(dogBreeds[0]);
    const [breeds, setBreeds] = useState(dogBreeds);
    const [color1, setColor1] = useState('');
    const [color2, setColor2] = useState('');
    const [color3, setColor3] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (animalType === 'Perro') {
            setBreeds(dogBreeds);
            if (!isEditMode) setBreed(dogBreeds[0]);
        } else {
            setBreeds(catBreeds);
            if (!isEditMode) setBreed(catBreeds[0]);
        }
        if (!isEditMode) {
            setColor1('');
            setColor2('');
            setColor3('');
        }
    }, [animalType, isEditMode]);

    useEffect(() => {
        if (isEditMode && petToEdit) {
            setName(petToEdit.name);
            setAnimalType(petToEdit.animalType);
            setBreed(petToEdit.breed);
            setDescription(petToEdit.description || '');
            setColor1(petToEdit.colors[0] || '');
            setColor2(petToEdit.colors[1] || '');
            setColor3(petToEdit.colors[2] || '');
            setImagePreviews(petToEdit.imageUrls || []);
        }
    }, [petToEdit, isEditMode]);
    
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
                setImagePreviews(prev => [...prev, ...newImages]);
            } catch (err: any) {
                console.error("Error uploading image:", err);
                setError("Error al subir la imagen. Intenta de nuevo.");
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name) {
            setError('El nombre es obligatorio.');
            return;
        }
        if (!color1) {
            setError('Debes seleccionar al menos un color para tu mascota.');
            return;
        }
        if (imagePreviews.length === 0) {
            setError('Debes subir al menos una foto de tu mascota.');
            return;
        }
        
        setLoading(true);

        const colors = [color1, color2, color3].filter(Boolean);
        const petData = { name, animalType, breed, colors, description, imageUrls: imagePreviews };
        
        try {
            if (isEditMode && petToEdit) {
                await onUpdate({ ...petData, id: petToEdit.id });
            } else {
                await onSubmit(petData);
            }
        } catch (err: any) {
            setError(err.message || `Ocurrió un error al ${isEditMode ? 'actualizar' : 'agregar'} la mascota.`);
        } finally {
            setLoading(false);
        }
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
                    <h2 className="text-2xl font-bold text-brand-dark mb-6">{isEditMode ? 'Editar Mascota' : 'Agregar mi Mascota'}</h2>
                    
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-900">Nombre de la Mascota <span className="text-red-500">*</span></label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Buddy" required />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Tipo de Animal <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setAnimalType('Perro')}
                                        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${animalType === 'Perro' ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <DogIcon className="h-6 w-6 mb-1" />
                                        <span className="text-xs font-bold">Perro</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setAnimalType('Gato')}
                                        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${animalType === 'Gato' ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <CatIcon className="h-6 w-6 mb-1" />
                                        <span className="text-xs font-bold">Gato</span>
                                    </button>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-900">Raza <span className="text-red-500">*</span></label>
                                <select value={breed} onChange={(e) => setBreed(e.target.value)} className={inputClass} required>
                                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-md border">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Colores</h3>
                            <div className="grid grid-cols-1 gap-4">
                                 <div>
                                    <label htmlFor="color1" className="block text-xs font-medium text-gray-900 mb-2">Color Primario <span className="text-red-500">*</span></label>
                                    <select value={color1} onChange={(e) => setColor1(e.target.value)} className={inputClass} required>
                                        <option value="">Seleccionar</option>
                                        {petColors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="color2" className="block text-xs font-medium text-gray-900">Color Secundario</label>
                                        <select id="color2" value={color2} onChange={(e) => setColor2(e.target.value)} className={inputClass} disabled={!color1}>
                                            <option value="">Ninguno</option>
                                            {petColors.filter(c => c !== color1).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="color3" className="block text-xs font-medium text-gray-900">Tercer Color</label>
                                        <select id="color3" value={color3} onChange={(e) => setColor3(e.target.value)} className={inputClass} disabled={!color1 || !color2}>
                                            <option value="">Ninguno</option>
                                            {petColors.filter(c => c !== color1 && c !== color2).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-900">Descripción (Opcional)</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Describe a tu mascota..."></textarea>
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
                        
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button type="submit" disabled={loading || isUploading} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50">
                                {loading ? 'Guardando...' : (isUploading ? 'Subiendo...' : (isEditMode ? 'Guardar Cambios' : 'Agregar Mascota'))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPetModal;
