
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import type { User, UserRating } from '../types';
import { XCircleIcon, TrashIcon, UserIcon, WarningIcon } from './icons';
import StarRating from './StarRating';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../constants';

interface UserPublicProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUser: User;
}

const UserPublicProfileModal: React.FC<UserPublicProfileModalProps> = ({ isOpen, onClose, targetUser }) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch Ratings
    const { data: ratings = [], isLoading } = useQuery({
        queryKey: ['ratings', targetUser.id],
        enabled: !!targetUser.id && isOpen,
        queryFn: async () => {
            if (!targetUser.id) return [];
            
            const { data, error } = await supabase
                .from('user_ratings')
                .select(`
                    *,
                    profiles:rater_id (username, avatar_url)
                `)
                .eq('rated_user_id', targetUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((r: any) => ({
                id: r.id,
                raterId: r.rater_id,
                ratedUserId: r.rated_user_id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at,
                raterName: r.profiles?.username || 'Usuario',
                raterAvatar: r.profiles?.avatar_url
            })) as UserRating[];
        }
    });

    const averageRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / ratings.length).toFixed(1);
    }, [ratings]);

    const handleSubmitRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (newRating === 0) {
            setError('Por favor selecciona una calificación de estrellas.');
            return;
        }
        if (!newComment.trim()) {
            setError('Por favor explica el motivo de tu calificación.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const { error: submitError } = await supabase
                .from('user_ratings')
                .insert({
                    rater_id: currentUser.id,
                    rated_user_id: targetUser.id,
                    rating: newRating,
                    comment: newComment.trim()
                });

            if (submitError) {
                if (submitError.code === '42501' || submitError.message.includes('row-level security')) {
                    throw new Error('No tienes permisos para calificar. Si estás en modo fantasma, asegúrate de que los admins tengan permiso en la BD.');
                }
                throw submitError;
            }

            await queryClient.invalidateQueries({ queryKey: ['ratings', targetUser.id] });
            setNewRating(0);
            setNewComment('');
        } catch (err: any) {
            console.error(err);
            setError('Error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRating = async (ratingId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este feedback?')) return;
        try {
            const { error: deleteError } = await supabase
                .from('user_ratings')
                .delete()
                .eq('id', ratingId);
            
            if (deleteError) throw deleteError;
            queryClient.invalidateQueries({ queryKey: ['ratings', targetUser.id] });
        } catch (err: any) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    if (!isOpen) return null;

    const isOwnProfile = currentUser?.id === targetUser.id;
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    const hasRated = ratings.some(r => r.raterId === currentUser?.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header Profile Info */}
                <div className="p-6 bg-brand-primary text-white rounded-t-xl relative text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl">
                        <XCircleIcon />
                    </button>
                    <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 mb-3 shadow-lg overflow-hidden">
                        {targetUser.avatarUrl ? (
                            <img src={targetUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-3xl rounded-full">
                                {(targetUser.firstName || '?').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold">@{targetUser.username || 'Usuario'}</h2>
                    <p className="text-white/80 text-sm">{targetUser.firstName} {targetUser.lastName}</p>
                    
                    <div className="mt-4 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full backdrop-blur-sm">
                            <span className="text-3xl font-bold">{averageRating}</span>
                            <div className="flex flex-col items-start">
                                <StarRating rating={Number(averageRating)} size="sm" />
                                <span className="text-xs opacity-80">{ratings.length} opiniones</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                    
                    {/* Rating Form */}
                    {!isOwnProfile && !hasRated && currentUser && (
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-2 text-sm">Calificar a este usuario</h3>
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-2 mb-3 flex items-start gap-2">
                                    <WarningIcon className="h-4 w-4 text-red-500 mt-0.5" />
                                    <p className="text-red-700 text-xs">{error}</p>
                                </div>
                            )}
                            <form onSubmit={handleSubmitRating}>
                                <div className="flex justify-center mb-3">
                                    <StarRating rating={newRating} interactive onRate={setNewRating} size="lg" />
                                </div>
                                <textarea
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Cuéntanos tu experiencia con este usuario..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                ></textarea>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full mt-3 bg-brand-secondary text-brand-dark font-bold py-2 rounded-md hover:bg-amber-400 transition-colors text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Feedback List */}
                    <h3 className="font-bold text-gray-700 mb-3 pl-1">Opiniones Recientes</h3>
                    
                    {isLoading ? (
                        <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div></div>
                    ) : ratings.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4 italic">Este usuario aún no tiene calificaciones.</p>
                    ) : (
                        <div className="space-y-3">
                            {ratings.map(rating => (
                                <div key={rating.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 relative group">
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleDeleteRating(rating.id)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Eliminar feedback (Admin)"
                                        >
                                            <TrashIcon />
                                        </button>
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                                {rating.raterAvatar ? (
                                                    <img src={rating.raterAvatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-full h-full p-1 text-gray-500" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-sm text-gray-800">@{rating.raterName}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(rating.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mb-1">
                                        <StarRating rating={rating.rating} size="sm" />
                                    </div>
                                    <p className="text-sm text-gray-600 leading-snug">{rating.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPublicProfileModal;
