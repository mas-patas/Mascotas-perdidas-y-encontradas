import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as savedSearchesApi from './savedSearches.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Query hook to fetch saved searches for a user
 */
export const useSavedSearches = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.savedSearches(userId!),
    queryFn: () => savedSearchesApi.getSavedSearches(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single saved search by ID
 */
export const useSavedSearch = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.savedSearch(id!),
    queryFn: () => savedSearchesApi.getSavedSearchById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to set up realtime subscriptions for saved searches
 */
export const useSavedSearchesRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('saved-searches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_searches' },
        (payload: any) => {
          if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.savedSearches(userId) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
