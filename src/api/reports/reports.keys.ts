/**
 * Query keys for Reports API
 */
export const queryKeys = {
  reports: (userId?: string) => userId ? ['reports', userId] : ['reports'] as const,
  report: (id: string) => ['reports', id] as const,
} as const;

