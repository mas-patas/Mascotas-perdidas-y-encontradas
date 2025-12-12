import { supabase } from '../../services/supabaseClient';
import type { CommentRow, CommentLikeRow } from '../../types';
import type { CreateCommentData } from './comments.types';

/**
 * Extended comment type with computed likes field
 */
export type CommentWithLikes = CommentRow & {
  likes?: string[];
};

/**
 * Fetch comments for a pet
 * Returns database rows with snake_case column names
 */
export const getCommentsByPetId = async (petId: string): Promise<CommentWithLikes[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  if (!data) return [];

  // Fetch likes for all comments
  const commentIds = data.map((c) => c.id);
  const { data: likes } = commentIds.length > 0
    ? await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds)
    : { data: [] };

  return data.map((c) => {
    const commentLikes = (likes || [])
      .filter((l) => l.comment_id === c.id)
      .map((l) => l.user_id);
    
    return {
      ...c,
      likes: commentLikes,
    };
  });
};

/**
 * Fetch a single comment by ID
 * Returns database row with snake_case column names
 */
export const getCommentById = async (id: string): Promise<CommentWithLikes | null> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('id', id)
    .single();
  
  // PGRST116 = no rows returned (comment not found)
  if (error && error.code !== 'PGRST116') throw error;
  if (!data || error?.code === 'PGRST116') return null;

  // Fetch likes
  const { data: likes } = await supabase
    .from('comment_likes')
    .select('user_id')
    .eq('comment_id', id);

  return {
    ...data,
    likes: (likes || []).map((l) => l.user_id),
  };
};

/**
 * Fetch likes for a comment
 * Returns array of user IDs
 */
export const getCommentLikes = async (commentId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('user_id')
    .eq('comment_id', commentId);
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((l) => l.user_id);
};

/**
 * Check if user has liked a comment
 */
export const hasUserLikedComment = async (commentId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }
  
  return !!data;
};

/**
 * Mutation API Functions
 */

/**
 * Create a new comment
 */
export const createComment = async (data: CreateCommentData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const commentId = generateUUID();

  const { error } = await supabase.from('comments').insert({
    id: commentId,
    pet_id: data.petId,
    user_id: data.userId,
    user_email: data.userEmail,
    user_name: data.userName,
    text: data.text,
    parent_id: data.parentId || null
  });

  if (error) throw error;
  return commentId;
};

/**
 * Delete a comment and all its subcomments (replies) recursively
 */
export const deleteComment = async (id: string): Promise<void> => {
  // First, find all subcomments (comments that have this comment as parent)
  const { data: subcomments, error: fetchError } = await supabase
    .from('comments')
    .select('id')
    .eq('parent_id', id);

  if (fetchError) throw fetchError;

  // Recursively delete all subcomments
  if (subcomments && subcomments.length > 0) {
    for (const subcomment of subcomments) {
      await deleteComment(subcomment.id);
    }
  }

  // Delete comment likes associated with this comment
  const { error: likesError } = await supabase
    .from('comment_likes')
    .delete()
    .eq('comment_id', id);

  if (likesError) throw likesError;

  // Finally, delete the comment itself
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Toggle like on a comment
 */
export const toggleCommentLike = async (commentId: string, userId: string): Promise<boolean> => {
  // Check if already liked
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return false; // Now unliked
  } else {
    // Like
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId
      });
    
    if (error) throw error;
    return true; // Now liked
  }
};
