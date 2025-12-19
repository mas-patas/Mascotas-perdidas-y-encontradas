import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './pets.keys';
import * as petsApi from './pets.api';
import type { PetFilters } from './pets.types';
import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

const LIST_PAGE_SIZE = 12;
const REQUEST_TIMEOUT_MS = 45000;

// Wrapper for timeout
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

/**
 * Query hook to fetch pets with filters (infinite query for pagination)
 */
export const usePets = (filters: PetFilters) => {
  const cacheKeyString = `pets_offline_cache_${JSON.stringify(filters)}`;

  const fetchPets = async ({ pageParam = 0 }: { pageParam: number }) => {
    try {
      if (filters.status === 'Todos') {
        // Dashboard mode - fetch all categories
        const loadDataPromise = async () => {
          return await petsApi.getPetsForDashboard(filters);
        };
        
        const response = await fetchWithTimeout(
          loadDataPromise(),
          REQUEST_TIMEOUT_MS,
          "La conexión está lenta. Intentando reconectar..."
        );
        
        if (pageParam === 0 && response.length > 0) {
          try {
            localStorage.setItem(cacheKeyString, JSON.stringify(response));
          } catch (e) {
            console.warn("No se pudo guardar en caché local (quota exceeded?)", e);
          }
        }
        
        return { data: response, nextCursor: undefined };
      } else {
        // Filtered list mode
        const loadDataPromise = async () => {
          return await petsApi.getPets({ filters, page: pageParam, pageSize: LIST_PAGE_SIZE });
        };
        
        const response = await fetchWithTimeout(
          loadDataPromise(),
          REQUEST_TIMEOUT_MS,
          "La conexión está lenta. Intentando reconectar..."
        );
        
        if (pageParam === 0 && response.data.length > 0) {
          try {
            localStorage.setItem(cacheKeyString, JSON.stringify(response.data));
          } catch (e) {
            console.warn("No se pudo guardar en caché local (quota exceeded?)", e);
          }
        }
        
        return { data: response.data, nextCursor: response.nextCursor };
      }
    } catch (error: any) {
      console.error("Error fetching pets:", error);

      // OFFLINE STRATEGY: Try to recover from LocalStorage
      if (pageParam === 0) {
        const cachedData = localStorage.getItem(cacheKeyString);
        if (cachedData) {
          console.info("Sirviendo datos desde caché offline local.");
          const parsedData = JSON.parse(cachedData);
          return { data: parsedData, nextCursor: undefined };
        }
      }

      throw error;
    }
  };

  return useInfiniteQuery({
    queryKey: queryKeys.petsWithFilters(filters),
    queryFn: fetchPets,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

/**
 * Query hook to fetch a single pet by ID
 */
export const usePet = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.pet(id!),
    queryFn: () => petsApi.getPetById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch pets by user ID
 */
export const usePetsByUserId = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.myPets(userId!),
    queryFn: () => petsApi.getPetsByUserId(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch pets for map
 */
export const usePetsForMap = () => {
  return useQuery({
    queryKey: queryKeys.mapPets,
    queryFn: petsApi.getPetsForMap,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a reunited pet story by ID
 */
export const useReunionStory = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.reunionStory(id!),
    queryFn: () => petsApi.getReunionStoryById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to set up realtime subscriptions for pets
 */
export const usePetsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('pets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pets' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.pets });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.pets });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
