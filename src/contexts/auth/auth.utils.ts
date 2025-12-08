import { USER_ROLES, USER_STATUS } from '@/constants';
import type { User, ProfileRow } from '@/types';

/**
 * Transform ProfileRow (snake_case) to User (camelCase)
 * This is a transformation utility for converting database types to frontend types
 */
export const transformProfileToUser = (profile: ProfileRow, email: string): User => {
  return {
    id: profile.id,
    email: email,
    role: (profile.role as any) || USER_ROLES.USER,
    status: (profile.status as any) || USER_STATUS.ACTIVE,
    username: profile.username || undefined,
    firstName: profile.first_name || undefined,
    lastName: profile.last_name || undefined,
    phone: profile.phone || undefined,
    dni: profile.dni || undefined,
    birthDate: profile.birth_date || undefined,
    country: profile.country || 'Perú',
    avatarUrl: profile.avatar_url || undefined,
    ownedPets: (profile.owned_pets as any) || [],
    savedPetIds: (profile.saved_pet_ids as any) || [],
    provider: profile.provider as 'email' | 'google' | 'apple' | undefined,
    businessId: profile.business_id || undefined,
  };
};

/**
 * Create a fallback user from minimal data
 */
export const createFallbackUser = (id: string, email: string): User => {
  return {
    id,
    email,
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    country: 'Perú',
  };
};
