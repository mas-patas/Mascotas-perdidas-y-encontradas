import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './campaigns.keys';
import * as campaignsApi from './campaigns.api';
import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

/**
 * Query hook to fetch all campaigns
 */
export const useCampaigns = () => {
  return useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: campaignsApi.getCampaigns,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch active campaigns (future dates)
 */
export const useActiveCampaigns = () => {
  return useQuery({
    queryKey: [...queryKeys.campaigns, 'active'],
    queryFn: campaignsApi.getActiveCampaigns,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch campaigns for map
 */
export const useCampaignsForMap = () => {
  return useQuery({
    queryKey: [...queryKeys.campaigns, 'map'],
    queryFn: campaignsApi.getCampaignsForMap,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single campaign by ID
 */
export const useCampaign = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.campaign(id!),
    queryFn: () => campaignsApi.getCampaignById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to set up realtime subscriptions for campaigns
 */
export const useCampaignsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('campaigns-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
