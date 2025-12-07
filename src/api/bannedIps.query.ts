import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as bannedIpsApi from './bannedIps.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Query hook to fetch all banned IPs
 */
export const useBannedIps = () => {
  return useQuery({
    queryKey: queryKeys.bannedIps,
    queryFn: bannedIpsApi.getBannedIps,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single banned IP by ID
 */
export const useBannedIp = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.bannedIp(id!),
    queryFn: () => bannedIpsApi.getBannedIpById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to set up realtime subscriptions for banned IPs
 */
export const useBannedIpsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('banned-ips-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banned_ips' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.bannedIps });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
