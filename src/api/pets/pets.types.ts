/**
 * Type definitions for Pet API operations
 */

export interface PetFilters {
  status: string;
  type: string;
  breed: string;
  colors: string[]; // Array of selected colors (max 3)
  size: string;
  department: string;
  province: string;
  district: string;
  dateFilter: string; // 'today' | 'last3days' | 'lastWeek' | 'lastMonth' | ''
  name: string; // Only used when status includes 'Perdido'
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
