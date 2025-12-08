/**
 * Pet transformations for specific use cases
 * 
 * IMPORTANT: Use PetRow (snake_case) directly as the default.
 * Only use transformations for:
 * 1. Combining data from multiple sources (joins)
 * 2. Computing derived/computed fields
 * 3. Formatting for specific UI needs
 * 
 * DO NOT use transformations just to convert snake_case to camelCase.
 */

import type { PetRow, CommentRow, ProfileRow, CommentLikeRow } from '@/types';
import type { CommentWithLikes } from '@/api/comments/comments.transform';
import { transformCommentWithLikes } from '@/api/comments/comments.transform';

/**
 * Pet with owner information (from join)
 * Use when you need owner_email from a joined profile
 */
export interface PetWithOwner extends PetRow {
  owner_email?: string; // From joined profile
}

/**
 * Pet with comments and likes
 * Use when you need to combine pet with its comments and likes
 */
export interface PetWithComments extends PetWithOwner {
  comments?: CommentWithLikes[];
}

/**
 * Transform pet with owner information (from join)
 * Use only when you need owner_email from a joined profile
 */
export const transformPetWithOwner = (
  pet: PetRow,
  profile?: ProfileRow | null
): PetWithOwner => {
  return {
    ...pet,
    owner_email: profile?.email,
    image_urls: pet.image_urls || [],
    contact_requests: pet.contact_requests || [],
  };
};

/**
 * Transform pet with comments and likes
 * Use only when you need to combine pet with its comments and likes
 */
export const transformPetWithComments = (
  pet: PetRow,
  comments: CommentRow[] = [],
  commentLikes: CommentLikeRow[] = [],
  profile?: ProfileRow | null
): PetWithComments => {
  const petComments = comments
    .filter(c => c.pet_id === pet.id)
    .map(c => transformCommentWithLikes(c, commentLikes));

  return {
    ...transformPetWithOwner(pet, profile),
    comments: petComments,
  };
};
