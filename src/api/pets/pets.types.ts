/**
 * Type definitions for Pet API operations
 */

export interface PetFilters {
  status: string;
  type: string;
  breed: string;
  color1: string;
  color2: string;
  color3: string;
  size: string;
  department: string;
}

export interface FetchPetsParams {
  filters: PetFilters;
  page?: number;
  pageSize?: number;
}

export interface CreatePetData {
  userId: string;
  status: string;
  name: string;
  animalType: string;
  breed: string;
  color: string;
  size?: string;
  location: string;
  date: string;
  contact: string;
  description: string;
  imageUrls: string[];
  adoptionRequirements?: string;
  shareContactInfo?: boolean;
  reward?: number;
  currency?: string;
  lat?: number;
  lng?: number;
  embedding?: number[] | null;
  createAlert?: boolean;
}

export interface UpdatePetData {
  status?: string;
  name?: string;
  animalType?: string;
  breed?: string;
  color?: string;
  size?: string;
  location?: string;
  date?: string;
  contact?: string;
  description?: string;
  imageUrls?: string[];
  adoptionRequirements?: string;
  shareContactInfo?: boolean;
  reward?: number;
  currency?: string;
  lat?: number;
  lng?: number;
}

export interface MarkReunionData {
  story: string;
  date: string;
  imageUrl?: string;
}
