import { supabase } from '../../services/supabaseClient';
import type { CampaignRow, Campaign } from '../../types';
import type { CreateCampaignData, UpdateCampaignData } from './campaigns.types';
import { ensurePublicImageUrls } from '../../utils/imageUtils';

/**
 * Map CampaignRow to Campaign type
 */
const mapCampaignFromDb = (row: CampaignRow): Campaign => {
  return {
    id: row.id,
    userEmail: row.user_email,
    type: row.type,
    title: row.title,
    description: row.description,
    location: row.location,
    date: row.date,
    imageUrls: ensurePublicImageUrls(row.image_urls || []),
    contactPhone: row.contact_phone,
    lat: row.lat,
    lng: row.lng
  };
};

/**
 * Fetch all campaigns
 * Returns mapped Campaign objects
 */
export const getCampaigns = async (): Promise<Campaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map(mapCampaignFromDb);
};

/**
 * Fetch active campaigns (future dates)
 */
export const getActiveCampaigns = async (): Promise<Campaign[]> => {
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true });
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map(mapCampaignFromDb);
};

/**
 * Fetch campaigns for map (with coordinates)
 */
export const getCampaignsForMap = async (): Promise<Campaign[]> => {
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('date', today);
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map(mapCampaignFromDb);
};

/**
 * Fetch a single campaign by ID
 */
export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return mapCampaignFromDb(data);
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
  } as any);

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

  const { error } = await (supabase.from('campaigns') as any)
    .update(dbData as any)
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
