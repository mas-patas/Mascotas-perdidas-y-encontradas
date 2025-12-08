/**
 * Query keys for Auth API
 */
export const queryKeys = {
  auth: ['auth'] as const,
  currentUser: ['auth', 'currentUser'] as const,
  session: ['auth', 'session'] as const,
} as const;
