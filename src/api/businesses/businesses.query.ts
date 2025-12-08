import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './businesses.keys';
import * as businessesApi from './businesses.api';
import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

/**
 * Query hook to fetch all businesses
 */
export const useBusinesses = () => {
  return useQuery({
    queryKey: queryKeys.businesses,
    queryFn: businessesApi.getBusinesses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single business by ID
 */
export const useBusiness = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.business(id!),
    queryFn: () => businessesApi.getBusinessById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch business by owner ID
 */
export const useBusinessByOwner = (ownerId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.businessByOwner(ownerId!),
    queryFn: () => businessesApi.getBusinessByOwnerId(ownerId!),
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch businesses for map
 */
export const useBusinessesForMap = () => {
  return useQuery({
    queryKey: [...queryKeys.businesses, 'map'],
    queryFn: businessesApi.getBusinessesForMap,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch products for a business
 */
export const useBusinessProducts = (businessId: string | undefined) => {
  return useQuery({
    queryKey: [...queryKeys.business(businessId!), 'products'],
    queryFn: () => businessesApi.getBusinessProducts(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to set up realtime subscriptions for businesses
 */
export const useBusinessesRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('businesses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_products' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
          // Invalidate products for the specific business
          if (payload.new && 'business_id' in payload.new) {
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.businessProducts(payload.new.business_id as string) 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
