import { supabase } from '../../services/supabaseClient';
import type { BusinessRow, BusinessProductRow } from '../../types';
import type { CreateBusinessData, UpdateBusinessData, CreateProductData } from './businesses.types';

/**
 * Fetch all businesses
 * Returns database rows with snake_case column names
 */
export const getBusinesses = async (): Promise<BusinessRow[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*');
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch a single business by ID (with products)
 * Returns database row with snake_case column names
 */
export const getBusinessById = async (id: string): Promise<BusinessRow | null> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Fetch business by owner ID
 * Returns database row with snake_case column names
 */
export const getBusinessByOwnerId = async (ownerId: string): Promise<BusinessRow | null> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching business by owner:', error.message);
    return null;
  }
  return data;
};

/**
 * Fetch businesses for map (with coordinates)
 * Returns database rows with snake_case column names
 */
export const getBusinessesForMap = async (): Promise<BusinessRow[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null);
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch products for a business
 * Returns database rows with snake_case column names
 */
export const getBusinessProducts = async (businessId: string): Promise<BusinessProductRow[]> => {
  const { data, error } = await supabase
    .from('business_products')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

/**
 * Mutation API Functions
 */

/**
 * Create a new business
 */
export const createBusiness = async (data: CreateBusinessData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const businessId = generateUUID();

  const { error } = await supabase.from('businesses').insert({
    id: businessId,
    owner_id: data.ownerId,
    name: data.name,
    type: data.type,
    description: data.description,
    address: data.address,
    phone: data.phone,
    services: data.services || [],
    logo_url: data.logoUrl || '',
    cover_url: data.coverUrl || ''
  });

  if (error) throw error;
  return businessId;
};

/**
 * Update a business
 */
export const updateBusiness = async (id: string, data: UpdateBusinessData): Promise<void> => {
  const dbData: any = {};

  if (data.name !== undefined) dbData.name = data.name;
  if (data.type !== undefined) dbData.type = data.type;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.address !== undefined) dbData.address = data.address;
  if (data.phone !== undefined) dbData.phone = data.phone;
  if (data.whatsapp !== undefined) dbData.whatsapp = data.whatsapp;
  if (data.website !== undefined) dbData.website = data.website;
  if (data.facebook !== undefined) dbData.facebook = data.facebook;
  if (data.instagram !== undefined) dbData.instagram = data.instagram;
  if (data.logoUrl !== undefined) dbData.logo_url = data.logoUrl;
  if (data.coverUrl !== undefined) dbData.cover_url = data.coverUrl;
  if (data.bannerUrl !== undefined) dbData.banner_url = data.bannerUrl;
  if (data.services !== undefined) dbData.services = data.services;
  if (data.lat !== undefined) dbData.lat = data.lat;
  if (data.lng !== undefined) dbData.lng = data.lng;

  // Clean undefined
  Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

  const { error } = await supabase
    .from('businesses')
    .update(dbData)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Add a product to a business
 */
export const addProduct = async (data: CreateProductData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const productId = generateUUID();

  const { error } = await supabase.from('business_products').insert({
    id: productId,
    business_id: data.businessId,
    name: data.name,
    description: data.description,
    price: data.price,
    image_url: data.imageUrls?.[0],
    image_urls: data.imageUrls
  });

  if (error) throw error;
  return productId;
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('business_products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
};
