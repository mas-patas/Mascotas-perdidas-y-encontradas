import type { User, OwnedPet } from '@/types';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
}

/**
 * Update profile data (camelCase for frontend)
 */
export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dni?: string;
  birthDate?: string;
  avatarUrl?: string;
  country?: string;
}

/**
 * Update owned pets data
 */
export interface UpdateOwnedPetsData {
  ownedPets: OwnedPet[];
}

/**
 * Update saved pet IDs data
 */
export interface UpdateSavedPetIdsData {
  savedPetIds: string[];
}

/**
 * Auth session data
 */
export interface AuthSession {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
  access_token?: string;
  refresh_token?: string;
}
