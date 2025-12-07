/**
 * Query keys for Pets API
 */
export const queryKeys = {
  pets: ['pets'] as const,
  petsWithFilters: (filters: any) => ['pets', filters] as const,
  pet: (id: string) => ['pets', id] as const,
  myPets: (userId: string) => ['myPets', userId] as const,
  mapPets: ['mapPets'] as const,
} as const;

