import { supabase } from '@/services/supabaseClient';
import { USER_ROLES, USER_STATUS } from '@/constants';
import type { ProfileRow } from '@/types';
import type { 
  LoginCredentials, 
  RegisterData, 
  UpdateProfileData,
  UpdateOwnedPetsData,
  UpdateSavedPetIdsData,
  AuthSession 
} from './auth.types';

/**
 * Get current auth session
 */
export const getSession = async (): Promise<AuthSession | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

/**
 * Sign in with email and password
 */
export const signInWithPassword = async (credentials: LoginCredentials): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) throw new Error(error.message);
};

/**
 * Sign up with email and password
 */
export const signUp = async (data: RegisterData): Promise<void> => {
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (error) throw new Error(error.message);
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw new Error(error.message);
};

/**
 * Reset password for email
 */
export const resetPasswordForEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/setup-profile`,
  });
  if (error) throw new Error(error.message);
};

/**
 * Update user password
 */
export const updatePassword = async (password: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Fetch user profile from database
 * Returns ProfileRow with snake_case fields
 */
export const fetchUserProfile = async (userId: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile doesn't exist
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Create user profile from OAuth metadata
 */
export const createProfileFromOAuth = async (
  userId: string,
  email: string,
  metadata: Record<string, any>
): Promise<void> => {
  // Generate a cleaner username from email or name
  let baseUsername = (metadata.full_name || email.split('@')[0]).replace(/\s+/g, '_').toLowerCase();
  const tempUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
  
  const firstName = metadata.given_name || metadata.full_name?.split(' ')[0] || '';
  const lastName = metadata.family_name || metadata.full_name?.split(' ').slice(1).join(' ') || '';
  const avatarUrl = metadata.avatar_url || metadata.picture || '';

  const { usersApi } = await import('@/api');
  await usersApi.createUserProfile({
    id: userId,
    email: email,
    username: tempUsername,
    first_name: firstName,
    last_name: lastName,
    avatar_url: avatarUrl,
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    country: 'Perú',
  });
};

/**
 * Update owned pets in profile
 */
export const updateOwnedPets = async (
  userId: string,
  data: UpdateOwnedPetsData
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ owned_pets: data.ownedPets })
    .eq('id', userId);

  if (error) throw error;
};

/**
 * Update saved pet IDs in profile
 */
export const updateSavedPetIds = async (
  userId: string,
  data: UpdateSavedPetIdsData
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ saved_pet_ids: data.savedPetIds })
    .eq('id', userId);

  if (error) throw error;
};

/**
 * Subscribe to auth state changes
 * Returns an object with unsubscribe method
 */
export const onAuthStateChange = (
  callback: (event: string, session: AuthSession | null) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    callback(event, session);
  });

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
};
