
import React, { useState } from 'react';
import { XCircleIcon } from '@/shared/components/icons';
import { uploadImage } from '@/utils/imageUtils';
import { departments, getProvinces, getDistricts } from '@/data/locations';
import { useAuth } from '@/contexts/auth';
import { useCreateCampaignReport } from '@/api';

interface CampaignReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CampaignReportModal: React.FC<CampaignReportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const createReport = useCreateCampaignReport();
    const [address, setAddress] = useState('');
    const [socialLink, setSocialLink] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    
    // Location fields
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    
    const provinces = selectedDepartment ? getProvinces(selectedDepartment) : [];
    const districts = selectedDepartment && selectedProvince ? getDistricts(selectedDepartment, selectedProvince) : [];

    if (!isOpen) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            setError('Formato de archivo no soportado. Por favor, usa JPEG, PNG, o WEBP.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const publicUrl = await uploadImage(file);
            setImagePreview(publicUrl);
        } catch (err: any) {
            console.error("Error uploading image:", err);
            setError("Error al subir la imagen. Intenta de nuevo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };

    const validateSocialLink = (link: string): boolean => {
        if (!link) return false;
        const facebookPattern = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+/i;
        const instagramPattern = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/i;
        return facebookPattern.test(link) || instagramPattern.test(link);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!address.trim()) {
            setError('La dirección de la campaña es obligatoria.');
            return;
        }

        if (!socialLink.trim()) {
            setError('El link de Facebook o Instagram es obligatorio.');
            return;
        }

        if (!validateSocialLink(socialLink)) {
            setError('Por favor, ingresa un link válido de Facebook o Instagram.');
            return;
        }

        if (!selectedDistrict) {
            setError('Por favor, selecciona un distrito.');
            return;
        }

        try {
            await createReport.mutateAsync({
                user_id: currentUser?.id || null,
                user_email: currentUser?.email || null,
                address: address.trim(),
                social_link: socialLink.trim(),
                image_url: imagePreview,
                district: selectedDistrict,
                department: selectedDepartment,
                province: selectedProvince,
            });

            // Reset form
            setAddress('');
            setSocialLink('');
            setImagePreview(null);
            setSelectedDepartment('');
            setSelectedProvince('');
            setSelectedDistrict('');
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error submitting campaign report:", err);
            setError("Error al enviar el reporte. Intenta de nuevo.");
        }
    };

    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-brand-dark">Informar de Campaña</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XCircleIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                                {error}
                            </div>
                        )}
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Nota importante:</strong> La administración revisará la veracidad de la campaña y la publicará en la sección "Campañas" en la brevedad posible.
                            </p>
                            <p className="text-sm text-red-600 font-semibold mt-2">
                                ⚠️ Enviar información falsa puede resultar en la suspensión de tu cuenta.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1">
                                Dirección de la Campaña <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={inputClass}
                                placeholder="Ej: Parque Central, Av. Principal 123"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="socialLink" className="block text-sm font-medium text-gray-900 mb-1">
                                Link de Facebook o Instagram <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="socialLink"
                                type="url"
                                value={socialLink}
                                onChange={(e) => setSocialLink(e.target.value)}
                                className={inputClass}
                                placeholder="https://www.facebook.com/... o https://www.instagram.com/..."
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ingresa el link completo de la publicación o perfil de la campaña
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-900 mb-1">
                                    Departamento <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="department"
                                    value={selectedDepartment}
                                    onChange={(e) => {
                                        setSelectedDepartment(e.target.value);
                                        setSelectedProvince('');
                                        setSelectedDistrict('');
                                    }}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Selecciona...</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="province" className="block text-sm font-medium text-gray-900 mb-1">
                                    Provincia <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="province"
                                    value={selectedProvince}
                                    onChange={(e) => {
                                        setSelectedProvince(e.target.value);
                                        setSelectedDistrict('');
                                    }}
                                    className={inputClass}
                                    disabled={!selectedDepartment}
                                    required
                                >
                                    <option value="">Selecciona...</option>
                                    {provinces.map(prov => (
                                        <option key={prov} value={prov}>{prov}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-900 mb-1">
                                    Distrito <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="district"
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                    className={inputClass}
                                    disabled={!selectedProvince}
                                    required
                                >
                                    <option value="">Selecciona...</option>
                                    {districts.map(dist => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                                Imagen de la Campaña (Opcional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-100"
                                disabled={isUploading}
                            />
                            {isUploading && <p className="text-sm text-blue-600 mt-1">Subiendo imagen...</p>}
                            {imagePreview && (
                                <div className="mt-2 relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Vista previa"
                                        className="h-32 w-32 object-cover rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-700"
                                    >
                                        <XCircleIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            disabled={createReport.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createReport.isPending || isUploading}
                            className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createReport.isPending ? 'Enviando...' : 'Enviar Información'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CampaignReportModal;

