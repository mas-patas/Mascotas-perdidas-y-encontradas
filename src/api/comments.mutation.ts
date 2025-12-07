import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as commentsApi from './comments.api';
import type { CreateCommentData } from './comments.types';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity, POINTS_CONFIG } from '@/services/gamificationService';

/**
 * Mutation hook to create a comment
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateCommentData, 'userId' | 'userEmail' | 'userName'>) => {
      if (!currentUser) throw new Error('User must be logged in');

      const commentId = await commentsApi.createComment({
        ...data,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.username || 'User'
      });

      // Log activity for gamification
      await logActivity(currentUser.id, 'comment_added', POINTS_CONFIG.COMMENT_ADDED, {
        petId: data.petId
      });

      return commentId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.petId) });
    }
  });
};

/**
 * Mutation hook to delete a comment
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, petId }: { id: string; petId: string }) => {
      await commentsApi.deleteComment(id);
      return { id, petId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.petId) });
    }
  });
};

/**
 * Mutation hook to toggle like on a comment
 */
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, petId }: { commentId: string; petId: string }) => {
      if (!currentUser) throw new Error('User must be logged in');

      const isLiked = await commentsApi.toggleCommentLike(commentId, currentUser.id);
      return { commentId, petId, isLiked };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.petId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.commentLikes(variables.commentId) });
    }
  });
};
