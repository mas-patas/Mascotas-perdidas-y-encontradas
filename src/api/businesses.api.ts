import { supabase } from '../services/supabaseClient';
import type { Business, BusinessProduct } from '../types';
import type { CreateBusinessData, UpdateBusinessData, CreateProductData } from './businesses.types';

/**
 * Fetch all businesses
 */
export const getBusinesses = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*');
  
  if (error) throw error;
  if (!data) return [];

  return data.map((b: any) => ({
    id: b.id,
    ownerId: b.owner_id,
    name: b.name,
    type: b.type,
    description: b.description,
    address: b.address,
    phone: b.phone,
    whatsapp: b.whatsapp,
    website: b.website,
    facebook: b.facebook,
    instagram: b.instagram,
    logoUrl: b.logo_url,
    coverUrl: b.cover_url,
    bannerUrl: b.banner_url,
    services: b.services || [],
    lat: b.lat,
    lng: b.lng,
    isVerified: b.is_verified,
    createdAt: b.created_at,
  }));
};

/**
 * Fetch a single business by ID (with products)
 */
export const getBusinessById = async (id: string): Promise<Business | null> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  // Fetch products
  const { data: products, error: prodError } = await supabase
    .from('business_products')
    .select('*')
    .eq('business_id', id);
  
  if (prodError) console.warn("Error fetching products:", prodError.message);

  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    type: data.type,
    description: data.description,
    address: data.address,
    phone: data.phone,
    whatsapp: data.whatsapp,
    website: data.website,
    facebook: data.facebook,
    instagram: data.instagram,
    logoUrl: data.logo_url,
    coverUrl: data.cover_url,
    bannerUrl: data.banner_url,
    services: data.services || [],
    products: (products || []).map((p: any) => ({
      id: p.id,
      businessId: p.business_id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: p.image_url,
      imageUrls: p.image_urls || (p.image_url ? [p.image_url] : []),
    })),
    lat: data.lat,
    lng: data.lng,
    isVerified: data.is_verified,
    createdAt: data.created_at,
  };
};

/**
 * Fetch business by owner ID (with products)
 */
export const getBusinessByOwnerId = async (ownerId: string): Promise<Business | null> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching business by owner:', error.message);
    return null;
  }
  if (!data) return null;

  // Fetch products
  const { data: products } = await supabase
    .from('business_products')
    .select('*')
    .eq('business_id', data.id);

  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    type: data.type,
    description: data.description,
    address: data.address,
    phone: data.phone,
    whatsapp: data.whatsapp,
    website: data.website,
    facebook: data.facebook,
    instagram: data.instagram,
    logoUrl: data.logo_url,
    coverUrl: data.cover_url,
    bannerUrl: data.banner_url,
    services: data.services || [],
    products: (products || []).map((p: any) => ({
      id: p.id,
      businessId: p.business_id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: p.image_url,
      imageUrls: p.image_urls || (p.image_url ? [p.image_url] : []),
    })),
    lat: data.lat,
    lng: data.lng,
    isVerified: data.is_verified,
    createdAt: data.created_at,
  };
};

/**
 * Fetch businesses for map (with coordinates)
 */
export const getBusinessesForMap = async (): Promise<Business[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null);
  
  if (error) throw error;
  if (!data) return [];

  return data.map((b: any) => ({
    id: b.id,
    ownerId: b.owner_id,
    name: b.name,
    type: b.type,
    description: b.description,
    address: b.address,
    phone: b.phone,
    whatsapp: b.whatsapp,
    website: b.website,
    facebook: b.facebook,
    instagram: b.instagram,
    logoUrl: b.logo_url,
    coverUrl: b.cover_url,
    bannerUrl: b.banner_url,
    services: b.services || [],
    lat: b.lat,
    lng: b.lng,
    isVerified: b.is_verified,
    createdAt: b.created_at,
  }));
};

/**
 * Mutation API Functions
 */

/**
 * Create a new business
 */
export const createBusiness = async (data: CreateBusinessData): Promise<string> => {
  const { generateUUID } = await import('../utils/uuid');
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
  const { generateUUID } = await import('../utils/uuid');
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
