/**
 * Query keys for Notifications API
 */
export const queryKeys = {
  notifications: (userId: string) => ['notifications', userId] as const,
  notification: (id: string) => ['notifications', id] as const,
} as const;

