/**
 * Comment transformations for specific use cases
 * 
 * IMPORTANT: Use CommentRow (snake_case) directly as the default.
 * Only use transformations for combining data from multiple sources.
 */

import type { CommentRow, CommentLikeRow } from '@/types';

/**
 * Comment with likes array
 * Use when you need likes computed from comment_likes table
 */
export interface CommentWithLikes extends CommentRow {
  likes?: string[]; // Array of user_ids who liked
}

/**
 * Transform comment with likes
 * Use only when you need likes array computed from comment_likes table
 */
export const transformCommentWithLikes = (
  comment: CommentRow,
  likes: CommentLikeRow[] = []
): CommentWithLikes => {
  return {
    ...comment,
    likes: likes.filter(l => l.comment_id === comment.id).map(l => l.user_id),
  };
};
