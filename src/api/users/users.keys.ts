/**
 * Query keys for Users API
 */
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  userByEmail: (email: string) => ['users', 'email', email] as const,
} as const;

