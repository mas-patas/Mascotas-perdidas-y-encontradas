import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys as commentsKeys } from './comments.keys';
import { queryKeys as petsKeys } from '../pets/pets.keys';
import * as commentsApi from './comments.api';
import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

const queryKeys = { ...commentsKeys, pets: petsKeys.pets };

/**
 * Query hook to fetch comments for a pet
 */
export const useCommentsByPetId = (petId: string | undefined) => {
  return useQuery({
    queryKey: commentsKeys.comments(petId!),
    queryFn: () => commentsApi.getCommentsByPetId(petId!),
    enabled: !!petId,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Query hook to fetch a single comment by ID
 */
export const useComment = (id: string | undefined) => {
  return useQuery({
    queryKey: commentsKeys.comment(id!),
    queryFn: () => commentsApi.getCommentById(id!),
    enabled: !!id,
  });
};

/**
 * Query hook to fetch likes for a comment
 */
export const useCommentLikes = (commentId: string | undefined) => {
  return useQuery({
    queryKey: commentsKeys.commentLikes(commentId!),
    queryFn: () => commentsApi.getCommentLikes(commentId!),
    enabled: !!commentId,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Query hook to check if user has liked a comment
 */
export const useHasUserLikedComment = (commentId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: [...commentsKeys.commentLikes(commentId!), 'user', userId],
    queryFn: () => commentsApi.hasUserLikedComment(commentId!, userId!),
    enabled: !!commentId && !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to set up realtime subscriptions for comments
 */
export const useCommentsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload: any) => {
          if (payload.new?.pet_id) {
            queryClient.invalidateQueries({ queryKey: commentsKeys.comments(payload.new.pet_id) });
          }
          // Also invalidate pets since comments are part of pet data
          queryClient.invalidateQueries({ queryKey: queryKeys.pets });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comment_likes' },
        (payload: any) => {
          if (payload.new?.comment_id) {
            queryClient.invalidateQueries({ queryKey: commentsKeys.commentLikes(payload.new.comment_id) });
          }
          // Also invalidate pets since comment likes affect pet comments
          queryClient.invalidateQueries({ queryKey: queryKeys.pets });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
