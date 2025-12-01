
import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { PET_STATUS } from '../constants';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';
import { mapPetFromDb } from '../utils/mappers';

const LIST_PAGE_SIZE = 12;
const DASHBOARD_CATEGORY_LIMIT = 8;

interface UsePetsProps {
    filters: {
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        color1: string;
        color2: string;
        size: PetSize | 'Todos';
        department: string;
    };
}

const enrichPets = async (rawPets: any[]): Promise<Pet[]> => {
    if (!rawPets || rawPets.length === 0) return [];

    // Deduplicate IDs and filter out invalid entries
    const validPets = rawPets.filter(p => p && p.id);
    const uniquePetsMap = new Map(validPets.map(p => [p.id, p]));
    const uniquePets = Array.from(uniquePetsMap.values());
    
    if (uniquePets.length === 0) return [];

    const petIds = uniquePets.map(p => p.id);
    const userIds = [...new Set(uniquePets.map(p => p.user_id).filter(Boolean))];

    try {
        // Parallel fetch for enrichment data
        const [profilesResult, commentsResult] = await Promise.all([
            userIds.length > 0 
                ? supabase.from('profiles').select('id, email').in('id', userIds)
                : Promise.resolve({ data: [] }),
            supabase.from('comments').select('*').in('pet_id', petIds).order('created_at', { ascending: true })
        ]);

        const profiles = profilesResult.data || [];
        const comments = commentsResult.data || [];
        
        let commentIds: string[] = comments.map((c: any) => c.id);
        const { data: likes } = commentIds.length > 0
            ? await supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds)
            : { data: [] };

        return uniquePets.map(p => mapPetFromDb(p, profiles, comments, likes || []));
    } catch (error) {
        console.error("Enrichment partial failure:", error);
        // Fallback: return pets without enriched data
        return uniquePets.map(p => mapPetFromDb(p));
    }
};

export const usePets = ({ filters }: UsePetsProps) => {
    const queryClient = useQueryClient();

    const fetchPets = async ({ pageParam = 0 }) => {
        const nowIso = new Date().toISOString();
        
        // Optimize column selection
        const columns = 'id, status, name, animal_type, breed, color, size, location, date, contact, description, image_urls, adoption_requirements, share_contact_info, contact_requests, reward, currency, lat, lng, created_at, expires_at, user_id, reunion_story, reunion_date';

        if (filters.status === 'Todos') {
            // DASHBOARD MODE
            if (pageParam > 0) return { data: [], nextCursor: undefined };

            const categories = [
                PET_STATUS.PERDIDO,
                PET_STATUS.ENCONTRADO,
                PET_STATUS.AVISTADO,
                PET_STATUS.EN_ADOPCION,
                PET_STATUS.REUNIDO
            ];

            const fetchCategory = async (status: string) => {
                try {
                    let query = supabase
                        .from('pets')
                        .select(columns)
                        .eq('status', status)
                        .gt('expires_at', nowIso);
                    
                    if (filters.department !== 'Todos') {
                        query = query.ilike('location', `%${filters.department}%`);
                    }
                    if (filters.type !== 'Todos') {
                        query = query.eq('animal_type', filters.type);
                    }

                    const { data, error } = await query.order('created_at', { ascending: false }).limit(DASHBOARD_CATEGORY_LIMIT);
                    
                    if (error) {
                        console.warn(`Failed to fetch ${status}:`, error.message);
                        return [];
                    }
                    return data || [];
                } catch (e) {
                    console.warn(`Exception fetching ${status}:`, e);
                    return [];
                }
            };

            const results = await Promise.all(categories.map(fetchCategory));
            const combinedRawData = results.flat();

            if (combinedRawData.length === 0) {
                return { data: [], nextCursor: undefined };
            }

            const enriched = await enrichPets(combinedRawData);
            
            // Sort by creation date
            enriched.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });

            return { data: enriched, nextCursor: undefined };

        } else {
            // FILTERED LIST MODE
            const pageSize = LIST_PAGE_SIZE;
            const from = pageParam * pageSize;
            const to = from + pageSize - 1;

            let query = supabase.from('pets').select(columns, { count: 'exact' });

            query = query.eq('status', filters.status);
            query = query.gt('expires_at', nowIso);
            
            if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);
            if (filters.breed !== 'Todos') query = query.eq('breed', filters.breed);
            if (filters.size !== 'Todos') query = query.eq('size', filters.size);
            if (filters.color1 !== 'Todos') query = query.ilike('color', `%${filters.color1}%`);
            if (filters.department !== 'Todos') query = query.ilike('location', `%${filters.department}%`);
            
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, count, error } = await query;
            
            if (error) throw error;

            const enriched = await enrichPets(data || []);
            return { data: enriched, nextCursor: (from + (data?.length || 0) < (count || 0)) ? pageParam + 1 : undefined };
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteQuery({
        queryKey: ['pets', filters],
        queryFn: fetchPets,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: 2,
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        const channel = supabase.channel('pets-realtime-rq')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pets' },
                () => { queryClient.invalidateQueries({ queryKey: ['pets'] }); }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                () => { queryClient.invalidateQueries({ queryKey: ['pets'] }); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    const pets = data?.pages.flatMap(page => page.data) || [];

    return { 
        pets, 
        loading: isLoading, 
        hasMore: hasNextPage, 
        loadMore: fetchNextPage,
        isError,
        refetch
    };
};
