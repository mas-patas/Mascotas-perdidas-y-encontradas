import { supabase } from '../../services/supabaseClient';
import type { Banner } from './banners.types';
import type { CreateBannerData, UpdateBannerData } from './banners.types';
import { ensurePublicImageUrl } from '../../utils/imageUtils';

/**
 * Map BannerRow to Banner type
 */
const mapBannerFromDb = (row: any): Banner => {
  return {
    id: row.id,
    imageUrl: ensurePublicImageUrl(row.image_url),
    title: row.title || undefined,
    paragraph: row.paragraph || undefined,
    order: row.order || 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

/**
 * Fetch all banners (admin only - includes inactive)
 */
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order', { ascending: true });
    
    // If table doesn't exist, return empty array
    if (error) {
      // Check if error is about table not existing
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('Banners table does not exist yet. Please run the migration.');
        return [];
      }
      throw error;
    }
    if (!data) return [];
    
    return data.map(mapBannerFromDb);
  } catch (error: any) {
    // If table doesn't exist, return empty array instead of throwing
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
      console.warn('Banners table does not exist yet. Please run the migration.');
      return [];
    }
    throw error;
  }
};

/**
 * Fetch active banners for public display (max 5)
 */
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .limit(5);
    
    // If table doesn't exist, return empty array
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    if (!data) return [];
    
    return data.map(mapBannerFromDb);
  } catch (error: any) {
    // If table doesn't exist, return empty array instead of throwing
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
};

/**
 * Fetch a single banner by ID
 */
export const getBannerById = async (id: string): Promise<Banner | null> => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return mapBannerFromDb(data);
};

/**
 * Create a new banner
 */
export const createBanner = async (data: CreateBannerData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const bannerId = generateUUID();

  // Get max order if not provided
  let order = data.order;
  if (order === undefined) {
    const { data: maxOrderData } = await supabase
      .from('banners')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();
    
    order = maxOrderData ? (maxOrderData.order || 0) + 1 : 0;
  }

  const { error } = await supabase.from('banners').insert({
    id: bannerId,
    image_url: data.imageUrl,
    title: null,
    paragraph: null,
    order: order,
    is_active: true,
    updated_at: new Date().toISOString()
  } as any);

  if (error) throw error;
  return bannerId;
};

/**
 * Update an existing banner
 */
export const updateBanner = async (id: string, data: UpdateBannerData): Promise<void> => {
  const dbData: any = {
    updated_at: new Date().toISOString()
  };

  if (data.imageUrl !== undefined) dbData.image_url = data.imageUrl;
  if (data.title !== undefined) dbData.title = data.title || null;
  if (data.paragraph !== undefined) dbData.paragraph = data.paragraph || null;
  if (data.order !== undefined) dbData.order = data.order;
  if (data.isActive !== undefined) dbData.is_active = data.isActive;

  const { error } = await (supabase.from('banners') as any)
    .update(dbData as any)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Delete a banner
 */
export const deleteBanner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

