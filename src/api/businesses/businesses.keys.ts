/**
 * Query keys for Businesses API
 */
export const queryKeys = {
  businesses: ['businesses'] as const,
  business: (id: string) => ['businesses', id] as const,
  businessByOwner: (ownerId: string) => ['businesses', 'owner', ownerId] as const,
} as const;

