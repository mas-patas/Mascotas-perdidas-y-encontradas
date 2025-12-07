import { supabase } from '../services/supabaseClient';
import type { SavedSearch } from '../types';
import type { CreateSavedSearchData } from './savedSearches.types';

/**
 * Fetch saved searches for a user
 */
export const getSavedSearches = async (userId: string): Promise<SavedSearch[]> => {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    name: s.name,
    filters: s.filters,
    createdAt: s.created_at,
  }));
};

/**
 * Fetch a single saved search by ID
 */
export const getSavedSearchById = async (id: string): Promise<SavedSearch | null> => {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    filters: data.filters,
    createdAt: data.created_at,
  };
};

/**
 * Mutation API Functions
 */

/**
 * Create a new saved search
 */
export const createSavedSearch = async (data: CreateSavedSearchData): Promise<string> => {
  const { generateUUID } = await import('../utils/uuid');
  const searchId = generateUUID();

  const { error } = await supabase.from('saved_searches').insert({
    id: searchId,
    user_id: data.userId,
    name: data.name,
    filters: data.filters,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
  return searchId;
};
