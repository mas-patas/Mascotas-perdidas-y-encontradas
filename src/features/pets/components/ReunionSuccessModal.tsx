
import React, { useState } from 'react';
import { Pet } from '@/types';
import { uploadImage } from '@/utils/imageUtils';
import { SparklesIcon, HeartIcon, XCircleIcon } from '@/shared/components/icons';

interface ReunionSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet;
    onSubmit: (story: string, date: string, image?: string) => Promise<void>;
}

const ReunionSuccessModal: React.FC<ReunionSuccessModalProps> = ({ isOpen, onClose, pet, onSubmit }) => {
    const [story, setStory] = useState('');
    const [reunionDate, setReunionDate] = useState(new Date().toISOString().split('T')[0]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const url = await uploadImage(file);
                setImagePreview(url);
            } catch (err) {
                console.error(err);
                alert("Error subiendo la imagen.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!story.trim()) {
            alert("Por favor cuéntanos brevemente cómo fue el reencuentro.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(story, reunionDate, imagePreview || undefined);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Hubo un problema al guardar tu historia.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-purple-900 bg-opacity-90 z-[3000] flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                {/* Confetti / Decorative Header */}
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')]"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                        <XCircleIcon className="h-8 w-8" />
                    </button>
                    
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner">
                        <HeartIcon className="h-10 w-10 text-white fill-current animate-pulse" filled />
                    </div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">¡Qué Alegría!</h2>
                    <p className="text-purple-100 font-medium">Nos hace muy felices saber que {pet.name} ha vuelto a casa.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <p className="text-gray-600 text-center text-sm">
                        Tu historia puede dar esperanza a otros dueños que siguen buscando. <br/>
                        ¡Comparte cómo sucedió el milagro!
                    </p>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cuéntanos la historia del reencuentro</label>
                        <textarea 
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-purple-50 placeholder-purple-300 text-gray-900"
                            rows={4}
                            placeholder="Ej: Un vecino vio el cartel en la app y me llamó..."
                            required
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha del Reencuentro</label>
                            <input 
                                type="date" 
                                value={reunionDate}
                                onChange={(e) => setReunionDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Foto del Reencuentro</label>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="hidden" 
                                    id="reunion-photo"
                                    disabled={isUploading}
                                />
                                <label 
                                    htmlFor="reunion-photo" 
                                    className="flex items-center justify-center w-full p-2 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors text-purple-600 text-xs font-bold h-[42px]"
                                >
                                    {isUploading ? 'Subiendo...' : (imagePreview ? 'Cambiar Foto' : '📷 Subir Foto')}
                                </label>
                            </div>
                        </div>
                    </div>

                    {imagePreview && (
                        <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-md border-2 border-purple-100">
                            <img src={imagePreview} alt="Reencuentro" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                ¡Se ven geniales juntos!
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isSubmitting || isUploading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Guardando...' : (
                            <>
                                <SparklesIcon className="h-6 w-6" />
                                <span>Celebrar Reencuentro</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReunionSuccessModal;
