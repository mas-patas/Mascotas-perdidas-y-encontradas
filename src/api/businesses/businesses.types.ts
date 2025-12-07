/**
 * Type definitions for Business API operations
 */

export interface CreateBusinessData {
  ownerId: string;
  name: string;
  type: string;
  description: string;
  address: string;
  phone: string;
  services?: string[];
  logoUrl?: string;
  coverUrl?: string;
}

export interface UpdateBusinessData {
  name?: string;
  type?: string;
  description?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  logoUrl?: string;
  coverUrl?: string;
  bannerUrl?: string;
  services?: string[];
  lat?: number;
  lng?: number;
}

export interface CreateProductData {
  businessId: string;
  name: string;
  description: string;
  price: number;
  imageUrls?: string[];
}
