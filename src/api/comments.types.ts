/**
 * Type definitions for Comment API operations
 */

export interface CreateCommentData {
  petId: string;
  userId: string;
  userEmail: string;
  userName: string;
  text: string;
  parentId?: string | null;
}
