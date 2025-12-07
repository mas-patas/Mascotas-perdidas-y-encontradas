/**
 * Query keys for Comments API
 */
export const queryKeys = {
  comments: (petId: string) => ['comments', petId] as const,
  comment: (id: string) => ['comments', id] as const,
  commentLikes: (commentId: string) => ['commentLikes', commentId] as const,
} as const;

