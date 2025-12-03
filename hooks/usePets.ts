
import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { PET_STATUS } from '../constants';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';
import { mapPetFromDb } from '../utils/mappers';

const LIST_PAGE_SIZE = 12;
const DASHBOARD_CATEGORY_LIMIT = 8;
// Aumentamos el timeout a 45 segundos para manejar "Cold Starts" de Supabase (proyectos pausados)
const REQUEST_TIMEOUT_MS = 45000; 

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

// Función auxiliar para enriquecer datos
const enrichPets = async (rawPets: any[]): Promise<Pet[]> => {
    if (!rawPets || rawPets.length === 0) return [];

    const validPets = rawPets.filter(p => p && p.id);
    const uniquePetsMap = new Map(validPets.map(p => [p.id, p]));
    const uniquePets = Array.from(uniquePetsMap.values());
    
    if (uniquePets.length === 0) return [];

    const petIds = uniquePets.map(p => p.id);
    const userIds = [...new Set(uniquePets.map(p => p.user_id).filter(Boolean))];

    try {
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
        return uniquePets.map(p => mapPetFromDb(p));
    }
};

// Wrapper para simular timeout en promesas
const fetchWithTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    let timer: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(errorMessage));
        }, ms);
    });

    return Promise.race([
        promise.then(res => {
            clearTimeout(timer);
            return res;
        }),
        timeoutPromise
    ]);
};

export const usePets = ({ filters }: UsePetsProps) => {
    const queryClient = useQueryClient();
    const cacheKeyString = `pets_offline_cache_${JSON.stringify(filters)}`;

    const fetchPets = async ({ pageParam = 0 }) => {
        const nowIso = new Date().toISOString();
        const columns = 'id, status, name, animal_type, breed, color, size, location, date, contact, description, image_urls, adoption_requirements, share_contact_info, contact_requests, reward, currency, lat, lng, created_at, expires_at, user_id, reunion_story, reunion_date';

        try {
            // Lógica de carga principal
            let resultData: Pet[] = [];
            let nextCursor: number | undefined = undefined;

            // Definimos la promesa de carga de datos
            const loadDataPromise = async () => {
                if (filters.status === 'Todos') {
                    // DASHBOARD MODE
                    if (pageParam > 0) return { data: [], nextCursor: undefined };

                    const categories = [PET_STATUS.PERDIDO, PET_STATUS.ENCONTRADO, PET_STATUS.AVISTADO, PET_STATUS.EN_ADOPCION, PET_STATUS.REUNIDO];

                    const fetchCategory = async (status: string) => {
                        let query = supabase
                            .from('pets')
                            .select(columns)
                            .eq('status', status)
                            .gt('expires_at', nowIso);
                        
                        if (filters.department !== 'Todos') query = query.ilike('location', `%${filters.department}%`);
                        if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);

                        const { data, error } = await query.order('created_at', { ascending: false }).limit(DASHBOARD_CATEGORY_LIMIT);
                        if (error) throw error;
                        return data || [];
                    };

                    const results = await Promise.all(categories.map(fetchCategory));
                    const combinedRawData = results.flat();
                    
                    if (combinedRawData.length === 0) return { data: [], nextCursor: undefined };

                    const enriched = await enrichPets(combinedRawData);
                    enriched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                    
                    return { data: enriched, nextCursor: undefined };

                } else {
                    // FILTERED LIST MODE
                    const pageSize = LIST_PAGE_SIZE;
                    const from = pageParam * pageSize;
                    const to = from + pageSize - 1;

                    let query = supabase.from('pets').select(columns, { count: 'exact' });

                    query = query.eq('status', filters.status).gt('expires_at', nowIso);
                    
                    if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);
                    if (filters.breed !== 'Todos') query = query.eq('breed', filters.breed);
                    if (filters.size !== 'Todos') query = query.eq('size', filters.size);
                    if (filters.color1 !== 'Todos') query = query.ilike('color', `%${filters.color1}%`);
                    if (filters.department !== 'Todos') query = query.ilike('location', `%${filters.department}%`);
                    
                    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
                    
                    if (error) throw error;

                    const enriched = await enrichPets(data || []);
                    return { data: enriched, nextCursor: (from + (data?.length || 0) < (count || 0)) ? pageParam + 1 : undefined };
                }
            };

            // Ejecutar con Timeout
            const response = await fetchWithTimeout(loadDataPromise(), REQUEST_TIMEOUT_MS, "La conexión está lenta. Intentando reconectar...");
            
            // Si tiene éxito y es la primera página, guardamos en caché local para modo offline
            if (pageParam === 0 && response.data.length > 0) {
                try {
                    localStorage.setItem(cacheKeyString, JSON.stringify(response.data));
                } catch (e) {
                    console.warn("No se pudo guardar en caché local (quota exceeded?)", e);
                }
            }

            return response;

        } catch (error: any) {
            console.error("Error fetching pets:", error);

            // ESTRATEGIA OFFLINE: Si falla la red, intentamos recuperar del LocalStorage
            if (pageParam === 0) {
                const cachedData = localStorage.getItem(cacheKeyString);
                if (cachedData) {
                    console.info("Sirviendo datos desde caché offline local.");
                    const parsedData = JSON.parse(cachedData);
                    return { data: parsedData, nextCursor: undefined }; // No permitimos paginación en modo offline
                }
            }

            // Si no hay caché, lanzamos el error para que lo maneje React Query
            throw error;
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: ['pets', filters],
        queryFn: fetchPets,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 5, // 5 minutos de frescura
        gcTime: 1000 * 60 * 60 * 24, // Mantener en memoria 24 horas (Garbage Collection Time)
        retry: 2, // Intentar 2 veces más antes de fallar
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
    });

    useEffect(() => {
        const channel = supabase.channel('pets-realtime-rq')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, () => { queryClient.invalidateQueries({ queryKey: ['pets'] }); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => { queryClient.invalidateQueries({ queryKey: ['pets'] }); })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    const pets = data?.pages.flatMap(page => page.data) || [];

    return { 
        pets, 
        loading: isLoading || isRefetching, 
        hasMore: hasNextPage, 
        loadMore: fetchNextPage,
        isError,
        refetch
    };
};
