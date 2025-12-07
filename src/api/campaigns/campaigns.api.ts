import { supabase } from '../../services/supabaseClient';
import type { CampaignRow } from '../../types';
import type { CreateCampaignData, UpdateCampaignData } from './campaigns.types';

/**
 * Fetch all campaigns
 * Returns database rows with snake_case column names
 */
export const getCampaigns = async (): Promise<CampaignRow[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch active campaigns (future dates)
 */
export const getActiveCampaigns = async (): Promise<CampaignRow[]> => {
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch campaigns for map (with coordinates)
 */
export const getCampaignsForMap = async (): Promise<CampaignRow[]> => {
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('date', today);
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch a single campaign by ID
 */
export const getCampaignById = async (id: string): Promise<CampaignRow | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Mutation API Functions
 */

/**
 * Create a new campaign
 */
export const createCampaign = async (data: CreateCampaignData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const campaignId = generateUUID();

  const { error } = await supabase.from('campaigns').insert({
    id: campaignId,
    user_email: data.userEmail,
    type: data.type,
    title: data.title,
    description: data.description,
    location: data.location,
    date: data.date,
    contact_phone: data.contactPhone,
    image_urls: data.imageUrls,
    lat: data.lat,
    lng: data.lng
  });

  if (error) throw error;
  return campaignId;
};

/**
 * Update an existing campaign
 */
export const updateCampaign = async (id: string, data: UpdateCampaignData): Promise<void> => {
  const dbData: any = {};

  if (data.type !== undefined) dbData.type = data.type;
  if (data.title !== undefined) dbData.title = data.title;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.location !== undefined) dbData.location = data.location;
  if (data.date !== undefined) dbData.date = data.date;
  if (data.contactPhone !== undefined) dbData.contact_phone = data.contactPhone;
  if (data.imageUrls !== undefined) dbData.image_urls = data.imageUrls;
  if (data.lat !== undefined) dbData.lat = data.lat;
  if (data.lng !== undefined) dbData.lng = data.lng;

  const { error } = await supabase
    .from('campaigns')
    .update(dbData)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Delete a campaign
 */
export const deleteCampaign = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
