import { supabase } from '../../services/supabaseClient';
import type { PetRow, CommentRow, ProfileRow, CommentLikeRow, Pet } from '../../types';
import type { PetFilters, FetchPetsParams, CreatePetData, UpdatePetData, MarkReunionData } from './pets.types';
import { mapPetFromDb } from '../../utils/mappers';

const PET_COLUMNS = 'id, status, name, animal_type, breed, color, size, location, date, contact, description, image_urls, adoption_requirements, share_contact_info, contact_requests, reward, currency, lat, lng, created_at, expires_at, user_id, reunion_story, reunion_date';

/**
 * Enrich pets with related data (profiles, comments, likes)
 * Returns database rows with snake_case column names
 * Note: Enrichment is optional - can be done at the component level if needed
 */
const enrichPets = async (rawPets: PetRow[]): Promise<PetRow[]> => {
  if (!rawPets || rawPets.length === 0) return [];

  const validPets = rawPets.filter(p => p && p.id);
  const uniquePetsMap = new Map(validPets.map(p => [p.id, p]));
  const uniquePets = Array.from(uniquePetsMap.values());
  
  if (uniquePets.length === 0) return [];

  // Return pets directly - enrichment with comments/likes can be done at component level
  // or via separate queries if needed
  return uniquePets;
};

/**
 * Fetch pets with filters (for list view)
 */

export const getPets = async ({ filters, page = 0, pageSize = 12 }: FetchPetsParams): Promise<{ data: Pet[]; nextCursor?: number; total?: number }> => {
  const nowIso = new Date().toISOString();
  
  if (filters.status === 'Todos') {
    // Dashboard mode - return empty for pagination
    if (page > 0) return { data: [], nextCursor: undefined };
    
    // This should be handled by the query hook for dashboard
    return { data: [], nextCursor: undefined };
  }
  
  // Filtered list mode
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('pets')
    .select(PET_COLUMNS, { count: 'exact' })
    .eq('status', filters.status)
    .gt('expires_at', nowIso);
  
  if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);
  if (filters.breed !== 'Todos') query = query.eq('breed', filters.breed);
  if (filters.size !== 'Todos') query = query.eq('size', filters.size);
  if (filters.color1 !== 'Todos') query = query.ilike('color', `%${filters.color1}%`);
  if (filters.department !== 'Todos') query = query.ilike('location', `%${filters.department}%`);
  
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) throw error;

  const enriched = await enrichPets(data || []);
  // Map PetRow[] to Pet[] using mapPetFromDb
  const mappedPets: Pet[] = enriched.map(p => mapPetFromDb(p));
  const hasMore = from + (data?.length || 0) < (count || 0);
  
  return { 
    data: mappedPets, 
    nextCursor: hasMore ? page + 1 : undefined,
    total: count || 0
  };
};

/**
 * Fetch pets for dashboard (all statuses with limits)
 */
export const getPetsForDashboard = async (filters: Partial<PetFilters>): Promise<Pet[]> => {
  const nowIso = new Date().toISOString();
  const { PET_STATUS } = await import('../../constants');
  const categories = [PET_STATUS.PERDIDO, PET_STATUS.ENCONTRADO, PET_STATUS.AVISTADO, PET_STATUS.EN_ADOPCION, PET_STATUS.REUNIDO];
  const limit = 8;

  const fetchCategory = async (status: string) => {
    let query = supabase
      .from('pets')
      .select(PET_COLUMNS)
      .eq('status', status)
      .gt('expires_at', nowIso);
    
    if (filters.department && filters.department !== 'Todos') {
      query = query.ilike('location', `%${filters.department}%`);
    }
    if (filters.type && filters.type !== 'Todos') {
      query = query.eq('animal_type', filters.type);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  };

  const results = await Promise.all(categories.map(fetchCategory));
  const combinedRawData = results.flat();
  
  if (combinedRawData.length === 0) return [];

  const enriched = await enrichPets(combinedRawData);
  enriched.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  
  // Map PetRow[] to Pet[] using mapPetFromDb
  const mappedPets: Pet[] = enriched.map(p => mapPetFromDb(p));
  
  return mappedPets;
};

/**
 * Fetch a single pet by ID
 */
export const getPetById = async (id: string): Promise<Pet | null> => {
  const { data, error } = await supabase
    .from('pets')
    .select(PET_COLUMNS)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return mapPetFromDb(data);
};

/**
 * Fetch pets by user ID
 */
export const getPetsByUserId = async (userId: string): Promise<Pet[]> => {
  const { data, error } = await supabase
    .from('pets')
    .select(PET_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];

  const enriched = await enrichPets(data);
  // Map PetRow[] to Pet[] using mapPetFromDb
  const mappedPets: Pet[] = enriched.map(p => mapPetFromDb(p));
  return mappedPets;
};

/**
 * Fetch pets for map (with coordinates)
 */
export const getPetsForMap = async (): Promise<Pet[]> => {
  const nowIso = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('pets')
    .select(PET_COLUMNS)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gt('expires_at', nowIso);
  
  if (error) throw error;
  if (!data) return [];

  const enriched = await enrichPets(data);
  // Map PetRow[] to Pet[] using mapPetFromDb
  const mappedPets: Pet[] = enriched.map(p => mapPetFromDb(p));
  return mappedPets;
};

/**
 * Mutation API Functions
 */

/**
 * Create a new pet
 */
export const createPet = async (data: CreatePetData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const newPetId = generateUUID();
  const now = new Date();
  const expirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

  const { error } = await supabase.from('pets').insert({
    id: newPetId,
    user_id: data.userId,
    status: data.status,
    name: data.name,
    animal_type: data.animalType,
    breed: data.breed,
    color: data.color,
    size: data.size,
    location: data.location,
    date: data.date,
    contact: data.contact,
    description: data.description,
    image_urls: data.imageUrls,
    adoption_requirements: data.adoptionRequirements,
    share_contact_info: data.shareContactInfo,
    reward: data.reward,
    currency: data.currency,
    contact_requests: [],
    lat: data.lat,
    lng: data.lng,
    created_at: now.toISOString(),
    expires_at: expirationDate.toISOString(),
    embedding: data.embedding || null
  });

  if (error) throw error;

  // Create saved search alert if requested
  if (data.createAlert && data.status === 'Perdido') {
    const { PET_STATUS } = await import('../../constants');
    if (data.status === PET_STATUS.PERDIDO) {
      const alertName = `Alerta: ${data.breed} (${data.color})`;
      const dept = data.location.split(',').map((s: string) => s.trim()).pop() || 'Todos';

      await supabase.from('saved_searches').insert({
        id: generateUUID(),
        user_id: data.userId,
        name: alertName,
        filters: {
          status: 'Todos',
          type: data.animalType,
          breed: data.breed,
          department: dept
        },
        created_at: now.toISOString()
      });
    }
  }

  return newPetId;
};

/**
 * Update an existing pet
 */
export const updatePet = async (id: string, data: UpdatePetData): Promise<void> => {
  const dbData: any = {};
  
  if (data.status !== undefined) dbData.status = data.status;
  if (data.name !== undefined) dbData.name = data.name;
  if (data.animalType !== undefined) dbData.animal_type = data.animalType;
  if (data.breed !== undefined) dbData.breed = data.breed;
  if (data.color !== undefined) dbData.color = data.color;
  if (data.size !== undefined) dbData.size = data.size;
  if (data.location !== undefined) dbData.location = data.location;
  if (data.date !== undefined) dbData.date = data.date;
  if (data.contact !== undefined) dbData.contact = data.contact;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.imageUrls !== undefined) dbData.image_urls = data.imageUrls;
  if (data.adoptionRequirements !== undefined) dbData.adoption_requirements = data.adoptionRequirements;
  if (data.shareContactInfo !== undefined) dbData.share_contact_info = data.shareContactInfo;
  if (data.reward !== undefined) dbData.reward = data.reward;
  if (data.currency !== undefined) dbData.currency = data.currency;
  if (data.lat !== undefined) dbData.lat = data.lat;
  if (data.lng !== undefined) dbData.lng = data.lng;

  const { error } = await supabase
    .from('pets')
    .update(dbData)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Delete a pet
 */
export const deletePet = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Renew pet expiration
 */
export const renewPet = async (id: string): Promise<void> => {
  const now = new Date();
  const newExpirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

  const { error } = await supabase
    .from('pets')
    .update({
      expires_at: newExpirationDate.toISOString(),
      created_at: now.toISOString()
    })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Update pet status
 */
export const updatePetStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('pets')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Mark pet as reunited
 */
export const markReunion = async (id: string, data: MarkReunionData, existingImageUrls?: string[]): Promise<void> => {
  const { PET_STATUS } = await import('../../constants');
  const updateData: any = {
    status: PET_STATUS.REUNIDO,
    reunion_story: data.story,
    reunion_date: data.date
  };

  if (data.imageUrl && existingImageUrls) {
    updateData.image_urls = [data.imageUrl, ...existingImageUrls];
  }

  const { error } = await supabase
    .from('pets')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Record contact request for a pet
 */
export const recordContactRequest = async (petId: string, userEmail: string, existingRequests?: string[]): Promise<void> => {
  try {
    const { error } = await supabase.rpc('request_pet_contact', { pet_id: petId });
    if (error) {
      // Fallback: manually update contact_requests
      const reqs = [...(existingRequests || []), userEmail];
      const uniqueReqs = [...new Set(reqs)];
      await supabase
        .from('pets')
        .update({ contact_requests: uniqueReqs })
        .eq('id', petId);
    }
  } catch (e) {
    console.error("Error recording contact request:", e);
    throw e;
  }
};
