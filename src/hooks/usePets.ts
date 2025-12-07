
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { PET_STATUS } from '../constants';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';
import * as petsApi from '../api/pets/pets.api';
import { usePetsRealtime } from '../api/pets/pets.query';

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

// enrichPets is now handled by petsApi.getPetsForDashboard and petsApi.getPets

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

                    // Use petsApi.getPetsForDashboard which handles enrichment
                    const enriched = await petsApi.getPetsForDashboard(filters);
                    return { data: enriched, nextCursor: undefined };

                } else {
                    // FILTERED LIST MODE - Use petsApi.getPets which handles enrichment
                    const result = await petsApi.getPets({ filters, page: pageParam, pageSize: LIST_PAGE_SIZE });
                    return { data: result.data, nextCursor: result.nextCursor };
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

    // Use dedicated realtime hook
    usePetsRealtime();

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
