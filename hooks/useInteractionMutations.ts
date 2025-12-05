import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { generateUUID } from '../utils/uuid';
import { logActivity, POINTS_CONFIG } from '../services/gamificationService';
import { ReportType, ReportReason } from '../types';

export const useInteractionMutations = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // 1. ADD COMMENT
    const addComment = useMutation({
        mutationFn: async ({ petId, text, userId, userEmail, userName, parentId }: { petId: string, text: string, userId: string, userEmail: string, userName: string, parentId?: string }) => {
            const { error } = await supabase.from('comments').insert({
                id: generateUUID(),
                pet_id: petId,
                user_id: userId,
                user_email: userEmail,
                user_name: userName,
                text,
                parent_id: parentId || null
            });
            if (error) throw error;
            
            await logActivity(userId, 'comment_added', POINTS_CONFIG.COMMENT_ADDED, { petId });
            return petId;
        },
        onSuccess: (petId) => {
            showToast('Comentario enviado', 'success');
            queryClient.invalidateQueries({ queryKey: ['pet_detail', petId] });
            queryClient.invalidateQueries({ queryKey: ['gamificationStats'] });
        },
        onError: (error: any) => {
            showToast(`Error al comentar: ${error.message}`, 'error');
        }
    });

    // 2. TOGGLE LIKE COMMENT
    const toggleLikeComment = useMutation({
        mutationFn: async ({ commentId, userId, petId }: { commentId: string, userId: string, petId: string }) => {
            const exists = await supabase.from('comment_likes').select('*').eq('user_id', userId).eq('comment_id', commentId).single();
            
            if (exists.data) {
                await supabase.from('comment_likes').delete().eq('user_id', userId).eq('comment_id', commentId);
                return { action: 'removed', petId };
            } else {
                await supabase.from('comment_likes').insert({ user_id: userId, comment_id: commentId });
                return { action: 'added', petId };
            }
        },
        onSuccess: (data) => {
            // Quiet update
            queryClient.invalidateQueries({ queryKey: ['pet_detail', data.petId] });
        }
    });

    // 3. REPORT CONTENT
    const reportContent = useMutation({
        mutationFn: async ({ type, targetId, reason, details, reporterEmail }: { type: ReportType, targetId: string, reason: ReportReason, details: string, reporterEmail: string }) => {
            const reportId = generateUUID();
            const { error } = await supabase.from('reports').insert({
                id: reportId,
                reporter_email: reporterEmail,
                reported_email: '', // Usually filled by trigger or backend logic if possible, otherwise empty is fine
                type,
                target_id: targetId,
                reason,
                details,
                status: 'Pendiente',
                created_at: new Date().toISOString()
            });
            if (error) throw error;
        },
        onSuccess: () => {
            showToast('Reporte enviado. Gracias por ayudar a la comunidad.', 'success');
        },
        onError: (error: any) => {
            showToast(`Error al reportar: ${error.message}`, 'error');
        }
    });

    // 4. REQUEST CONTACT
    const requestContact = useMutation({
        mutationFn: async (petId: string) => {
            const { error } = await supabase.rpc('request_pet_contact', { pet_id: petId });
            if (error) throw error;
            return petId;
        },
        onSuccess: (petId) => {
            // Optimistic update or refetch
            queryClient.invalidateQueries({ queryKey: ['pet_detail', petId] });
        },
        onError: (error: any) => {
            console.error(error);
        }
    });

    return {
        addComment,
        toggleLikeComment,
        reportContent,
        requestContact
    };
};