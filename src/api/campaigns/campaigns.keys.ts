/**
 * Query keys for Campaigns API
 */
export const queryKeys = {
  campaigns: ['campaigns'] as const,
  campaign: (id: string) => ['campaigns', id] as const,
} as const;

