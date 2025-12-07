/**
 * Type definitions for Campaign API operations
 */

export interface CreateCampaignData {
  userEmail: string;
  type: string;
  title: string;
  description: string;
  location: string;
  date: string;
  imageUrls: string[];
  contactPhone: string;
  lat?: number;
  lng?: number;
}

export interface UpdateCampaignData {
  type?: string;
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  imageUrls?: string[];
  contactPhone?: string;
  lat?: number;
  lng?: number;
}
