import { supabase } from '../../services/supabaseClient';
import { USER_ROLES, USER_STATUS } from '../../constants';
import type { User } from '../../types';

/**
 * Fetch all users/profiles
 */
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((p: any) => ({
    id: p.id,
    email: p.email,
    role: p.role || USER_ROLES.USER,
    status: p.status || USER_STATUS.ACTIVE,
    username: p.username,
    firstName: p.first_name,
    lastName: p.last_name,
    phone: p.phone,
    dni: p.dni,
    avatarUrl: p.avatar_url,
    ownedPets: p.owned_pets || [],
    savedPetIds: p.saved_pet_ids || [],
    birthDate: p.birth_date,
    country: p.country,
    provider: p.provider,
    businessId: p.business_id,
  }));
};

/**
 * Fetch a single user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    email: data.email,
    role: data.role || USER_ROLES.USER,
    status: data.status || USER_STATUS.ACTIVE,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    dni: data.dni,
    avatarUrl: data.avatar_url,
    ownedPets: data.owned_pets || [],
    savedPetIds: data.saved_pet_ids || [],
    birthDate: data.birth_date,
    country: data.country,
    provider: data.provider,
    businessId: data.business_id,
  };
};

/**
 * Fetch a single user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    email: data.email,
    role: data.role || USER_ROLES.USER,
    status: data.status || USER_STATUS.ACTIVE,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    dni: data.dni,
    avatarUrl: data.avatar_url,
    ownedPets: data.owned_pets || [],
    savedPetIds: data.saved_pet_ids || [],
    birthDate: data.birth_date,
    country: data.country,
    provider: data.provider,
    businessId: data.business_id,
  };
};

/**
 * Mutation API Functions
 */

/**
 * Update user status
 */
export const updateUserStatus = async (email: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('email', email);

  if (error) throw error;
};

/**
 * Update user role
 */
export const updateUserRole = async (email: string, role: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('email', email);

  if (error) throw error;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, data: {
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  dni?: string;
  birth_date?: string;
  country?: string;
  avatar_url?: string;
}): Promise<void> => {
  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
  };
  
  if (data.username !== undefined) dbUpdates.username = data.username;
  if (data.first_name !== undefined) dbUpdates.first_name = data.first_name;
  if (data.last_name !== undefined) dbUpdates.last_name = data.last_name;
  if (data.phone !== undefined) dbUpdates.phone = data.phone;
  if (data.dni !== undefined) dbUpdates.dni = data.dni;
  if (data.birth_date !== undefined) dbUpdates.birth_date = data.birth_date;
  if (data.country !== undefined) dbUpdates.country = data.country;
  if (data.avatar_url !== undefined) dbUpdates.avatar_url = data.avatar_url;

  const { error: updateError, data: updatedData } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select();

  if (updateError || !updatedData || updatedData.length === 0) {
    // Try insert if update failed (profile might not exist)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth session');
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, email: user.email, ...dbUpdates });
    
    if (insertError) throw new Error((updateError || insertError)?.message);
  }
};

/**
 * Create a user profile (for OAuth auto-creation)
 */
export const createUserProfile = async (data: {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  status?: string;
  country?: string;
}): Promise<void> => {
  const { error } = await supabase.from('profiles').insert({
    id: data.id,
    email: data.email,
    username: data.username,
    first_name: data.first_name,
    last_name: data.last_name,
    avatar_url: data.avatar_url,
    role: data.role || USER_ROLES.USER,
    status: data.status || USER_STATUS.ACTIVE,
    country: data.country || 'Perú',
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
};

/**
 * Ping database for keep-alive (lightweight query)
 */
export const pingDatabase = async (): Promise<void> => {
  const { error } = await supabase.from('profiles').select('id').limit(1);
  if (error) throw error;
};

/**
 * Update user location (lat/lng) and timestamp
 */
export const updateUserLocation = async (userId: string, lat: number, lng: number): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      lat,
      lng,
      location_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
};
