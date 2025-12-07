import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as usersApi from './users.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Query hook to fetch all users
 */
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: usersApi.getUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single user by ID
 */
export const useUser = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.user(id!),
    queryFn: () => usersApi.getUserById(id!),
    enabled: !!id,
  });
};

/**
 * Query hook to fetch a single user by email
 */
export const useUserByEmail = (email: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.userByEmail(email!),
    queryFn: () => usersApi.getUserByEmail(email!),
    enabled: !!email,
  });
};

/**
 * Hook to set up realtime subscriptions for users
 */
export const useUsersRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('users-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.users });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
