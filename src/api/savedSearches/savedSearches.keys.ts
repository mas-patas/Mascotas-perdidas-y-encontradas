/**
 * Query keys for Saved Searches API
 */
export const queryKeys = {
  savedSearches: (userId: string) => ['savedSearches', userId] as const,
  savedSearch: (id: string) => ['savedSearches', id] as const,
} as const;

