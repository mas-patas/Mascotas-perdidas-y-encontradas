import React, { useState, useEffect } from 'react';
import { XCircleIcon, TrashIcon } from '@/shared/components/icons';
import { uploadImage } from '@/utils/imageUtils';
import type { Banner } from '@/api/banners/banners.types';

interface BannerManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    banners: Banner[];
    isLoading: boolean;
    onCreateBanner: (imageUrl: string) => Promise<void>;
    onDeleteBanner: (id: string) => Promise<void>;
}

const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1544568100-847a948585b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80';

const BannerManagementModal: React.FC<BannerManagementModalProps> = ({
    isOpen,
    onClose,
    banners,
    isLoading,
    onCreateBanner,
    onDeleteBanner,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [newBannerImageUrl, setNewBannerImageUrl] = useState('');

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setNewBannerImageUrl('');
        }
    }, [isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen debe ser menor a 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadImage(file);
            setNewBannerImageUrl(url);
        } catch (err: any) {
            alert('Error al subir la imagen: ' + (err.message || 'Error desconocido'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateBanner = async () => {
        if (!newBannerImageUrl) {
            alert('Debes subir una imagen');
            return;
        }

        if (banners.length >= 5) {
            alert('Máximo 5 banners permitidos');
            return;
        }

        try {
            await onCreateBanner(newBannerImageUrl);
            setNewBannerImageUrl('');
        } catch (err: any) {
            alert('Error al crear banner: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleAddDefaultBanner = async () => {
        // Check if default banner already exists
        const defaultExists = banners.some(b => b.imageUrl === DEFAULT_BANNER_IMAGE);
        if (defaultExists) {
            alert('La imagen por defecto ya está en el carrusel');
            return;
        }

        if (banners.length >= 5) {
            alert('Máximo 5 banners permitidos');
            return;
        }

        try {
            await onCreateBanner(DEFAULT_BANNER_IMAGE);
        } catch (err: any) {
            alert('Error al agregar banner: ' + (err.message || 'Error desconocido'));
        }
    };

    if (!isOpen) return null;

    // Check if default banner exists
    const defaultExists = banners.some(b => b.imageUrl === DEFAULT_BANNER_IMAGE);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Gestión de Banners</h3>
                        <p className="text-sm text-gray-500 mt-1">Administra el carrusel de banners (máximo 5 imágenes)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar"
                    >
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Image Size Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-semibold mb-1">📐 Tamaño recomendado:</p>
                        <p className="text-xs text-blue-700">1920x600px (16:5), JPG/PNG, máximo 5MB, mínimo 1200px de ancho</p>
                    </div>

                    {/* Add Default Banner */}
                    {!defaultExists && banners.length < 5 && (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Imagen por Defecto</h4>
                                    <p className="text-xs text-gray-500">La imagen actual del banner</p>
                                </div>
                                <button
                                    onClick={handleAddDefaultBanner}
                                    className="px-4 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-dark transition-colors text-sm"
                                >
                                    Agregar al Carrusel
                                </button>
                            </div>
                            <img src={DEFAULT_BANNER_IMAGE} alt="Banner por defecto" className="w-full h-32 object-cover rounded-lg" />
                        </div>
                    )}

                    {/* Add New Banner Form */}
                    {banners.length < 5 && (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-gray-800 mb-4">Agregar Nueva Imagen</h4>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                        className="hidden"
                                        id="banner-image-upload"
                                    />
                                    <label
                                        htmlFor="banner-image-upload"
                                        className={`flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isUploading ? 'Subiendo...' : (newBannerImageUrl ? '✓ Imagen subida - Cambiar' : '📷 Subir Imagen')}
                                    </label>
                                    {newBannerImageUrl && (
                                        <div className="mt-2">
                                            <img src={newBannerImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleCreateBanner}
                                    disabled={!newBannerImageUrl || isUploading}
                                    className="w-full bg-brand-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Agregar Banner
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Banners List */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-4">Banners del Carrusel ({banners.length}/5)</h4>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Cargando...</div>
                        ) : banners.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                No hay banners configurados. Agrega la imagen por defecto o sube nuevas imágenes.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {banners.map((banner, index) => (
                                    <div key={banner.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative group">
                                        <div className="relative">
                                            <img 
                                                src={banner.imageUrl} 
                                                alt={`Banner ${index + 1}`} 
                                                className="w-full h-32 object-cover rounded-lg" 
                                            />
                                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
                                                {index + 1}
                                            </div>
                                            <button
                                                onClick={() => onDeleteBanner(banner.id)}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                                aria-label="Eliminar banner"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BannerManagementModal;

