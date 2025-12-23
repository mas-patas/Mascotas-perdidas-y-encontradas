
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import type { User, UserRating } from '@/types';
import { XCircleIcon, TrashIcon, UserIcon, WarningIcon, AdminIcon } from '@/shared/components/icons';
import { StarRating, VerifiedBadge } from '@/shared';
import { useAuth } from '@/contexts/auth';
import { USER_ROLES } from '@/constants';
import { generateUUID } from '@/utils/uuid';
import { GamificationBadge, getLevelFromPoints } from '@/features/gamification';

interface UserPublicProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUser: User;
    onViewAdminProfile?: (user: User) => void;
}

const UserPublicProfileModal: React.FC<UserPublicProfileModalProps> = ({ isOpen, onClose, targetUser, onViewAdminProfile }) => {
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

    // Fetch User's Reported Pets (for points calculation)
    const { data: userReportsCount = 0 } = useQuery({
        queryKey: ['publicUserReportsCount', targetUser.id],
        enabled: !!targetUser.id && isOpen,
        queryFn: async () => {
            const { count, error } = await supabase
                .from('pets')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', targetUser.id);
            if (error) return 0;
            return count || 0;
        }
    });

    const averageRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / ratings.length).toFixed(1);
    }, [ratings]);

    // --- GAMIFICATION SCORE CALCULATION ---
    const gamificationPoints = useMemo(() => {
        const reportPoints = userReportsCount * 15;
        const ratingCountPoints = ratings.length * 10;
        const qualityPoints = Number(averageRating) * 20;
        return Math.round(reportPoints + ratingCountPoints + qualityPoints);
    }, [userReportsCount, ratings.length, averageRating]);

    // Get Dynamic Level Info for Gradient
    const currentLevel = useMemo(() => getLevelFromPoints(gamificationPoints), [gamificationPoints]);

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
                    id: generateUUID(),
                    rater_id: currentUser.id,
                    rated_user_id: targetUser.id,
                    rating: newRating,
                    comment: newComment.trim(),
                    created_at: new Date().toISOString()
                });

            if (submitError) throw submitError;

            await queryClient.invalidateQueries({ queryKey: ['ratings', targetUser.id] });
            setNewRating(0);
            setNewComment('');
        } catch (err: any) {
            console.error(err);
            setError('Error al enviar la calificación: ' + (err.message || 'Intente nuevamente.'));
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
                
                {/* Header Profile Info - Light Purple Background */}
                <div className="p-6 bg-purple-100 rounded-t-xl relative pb-8 text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 text-purple-400 hover:text-purple-700 text-2xl">
                        <XCircleIcon />
                    </button>
                    
                    {isAdmin && onViewAdminProfile && (
                        <button 
                            onClick={() => { onClose(); onViewAdminProfile(targetUser); }}
                            className="absolute top-4 left-4 text-purple-600 hover:text-purple-900 flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full shadow-sm"
                            title="Ver perfil de administración"
                        >
                            <AdminIcon />
                            <span className="hidden sm:inline">Admin</span>
                        </button>
                    )}

                    <div className="flex flex-col items-center space-y-3">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md overflow-hidden">
                            {targetUser.avatarUrl ? (
                                <img src={targetUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-3xl rounded-full">
                                    {(targetUser.firstName || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        {/* User Info - Dark Text for Contrast */}
                        <div className="flex items-center justify-center gap-2">
                            <h2 className="text-2xl font-black text-purple-900">@{targetUser.username || 'Usuario'}</h2>
                            <VerifiedBadge user={targetUser} size="md" />
                        </div>

                        {/* Badge Section - In between Name and Score */}
                        <div className="py-2 transform scale-110">
                            <GamificationBadge points={gamificationPoints} size="md" showProgress={false} />
                        </div>

                        {/* Score Card - Dynamic Gradient based on Level */}
                        <div className={`flex flex-col items-center gap-1 bg-gradient-to-r ${currentLevel.gradient} text-white px-8 py-3 rounded-xl shadow-lg w-full max-w-[200px] transform hover:scale-105 transition-transform`}>
                            <div className="flex items-center gap-2">
                                <span className="text-4xl font-black drop-shadow-md">{averageRating}</span>
                                <div className="flex flex-col items-start">
                                    <StarRating rating={1} size="md" maxRating={1} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-0.5">Promedio</span>
                                </div>
                            </div>
                            <div className="w-full h-[1px] bg-white/30 my-1"></div>
                            <span className="text-xs font-medium opacity-90">{ratings.length} opiniones</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-white p-4 pt-6">
                    
                    {/* Rating Form */}
                    {!isOwnProfile && !hasRated && currentUser && (
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
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
                                    className="w-full mt-3 bg-brand-secondary text-brand-dark font-bold py-2 rounded-md hover:bg-amber-400 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-dark"></div>
                                            <span>Enviando...</span>
                                        </>
                                    ) : 'Enviar Calificación'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Feedback List */}
                    <h3 className="font-bold text-gray-700 mb-3 pl-1 border-b pb-2">Opiniones Recientes</h3>
                    
                    {isLoading ? (
                        <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div></div>
                    ) : ratings.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-500 text-sm italic">Este usuario aún no tiene calificaciones.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ratings.map(rating => (
                                <div key={rating.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 relative group hover:bg-gray-50 transition-colors">
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
                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                {rating.raterAvatar ? (
                                                    <img src={rating.raterAvatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        <UserIcon className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-sm text-gray-800 block leading-none flex items-center gap-1">
                                                    @{rating.raterName}
                                                    <VerifiedBadge user={(() => {
                                                        // We need to find the user by raterId, but we don't have access to users array here
                                                        // For now, we'll check if the rater is the targetUser (which would be admin)
                                                        return targetUser.id === rating.raterId ? targetUser : null;
                                                    })()} size="sm" />
                                                </span>
                                                <span className="text-[10px] text-gray-400">{new Date(rating.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <StarRating rating={rating.rating} size="sm" />
                                    </div>
                                    <p className="text-sm text-gray-600 leading-snug mt-2 pl-10">{rating.comment}</p>
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
