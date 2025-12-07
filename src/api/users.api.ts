import { supabase } from '../services/supabaseClient';
import { USER_ROLES, USER_STATUS } from '../constants';
import type { User } from '../types';

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
