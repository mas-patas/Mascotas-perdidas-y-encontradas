
import React, { useState, useEffect } from 'react';
import type { Campaign, CampaignType } from '../types';
import { CAMPAIGN_TYPES } from '../constants';
import { XCircleIcon } from './icons';

interface CampaignFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (campaign: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => void;
    campaignToEdit?: Campaign | null;
}

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ isOpen, onClose, onSave, campaignToEdit }) => {
    const isEditMode = !!campaignToEdit;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<CampaignType>(CAMPAIGN_TYPES.ESTERILIZACION);
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && campaignToEdit) {
            setTitle(campaignToEdit.title);
            setDescription(campaignToEdit.description);
            setType(campaignToEdit.type);
            setDate(campaignToEdit.date.split('T')[0]);
            setLocation(campaignToEdit.location);
            setContactPhone(campaignToEdit.contactPhone || '');
            setImagePreviews(campaignToEdit.imageUrls);
        } else {
            // Reset form when opening for creation
            setTitle('');
            setDescription('');
            setType(CAMPAIGN_TYPES.ESTERILIZACION);
            setDate(new Date().toISOString().split('T')[0]);
            setLocation('');
            setContactPhone('');
            setImagePreviews([]);
        }
    }, [isOpen, campaignToEdit]);

    if (!isOpen) return null;
    
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
        };

        onSave(campaignData, campaignToEdit?.id);
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
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
                                <label htmlFor="type" className="block text-sm font-medium text-gray-900">Tipo</label>
                                <select id="type" value={type} onChange={(e) => setType(e.target.value as CampaignType)} className={inputClass} required>
                                    {Object.values(CAMPAIGN_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-900">Fecha</label>
                                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-900">Lugar</label>
                                <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Ej: Parque Central, Miraflores, Lima" required />
                            </div>
                            <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-900">Teléfono de Contacto (Opcional)</label>
                                <input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} placeholder="987654321" />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-900">Descripción</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputClass} required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">Imágenes (hasta 3)</label>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-100" disabled={imagePreviews.length >= 3} />
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
                        <button type="submit" className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark">
                            {isEditMode ? 'Guardar Cambios' : 'Crear Campaña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CampaignFormModal;
