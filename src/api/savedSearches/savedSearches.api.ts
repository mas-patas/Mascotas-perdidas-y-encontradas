import { supabase } from '../../services/supabaseClient';
import type { SavedSearchRow } from '../../types';
import type { CreateSavedSearchData } from './savedSearches.types';

/**
 * Fetch saved searches for a user
 * Returns database rows with snake_case column names
 */
export const getSavedSearches = async (userId: string): Promise<SavedSearchRow[]> => {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  
  return data;
};

/**
 * Fetch a single saved search by ID
 * Returns database row with snake_case column names
 */
export const getSavedSearchById = async (id: string): Promise<SavedSearchRow | null> => {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return data;
};

/**
 * Mutation API Functions
 */

/**
 * Create a new saved search
 */
export const createSavedSearch = async (data: CreateSavedSearchData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
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

/**
 * Delete a saved search
 */
export const deleteSavedSearch = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
