import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as savedSearchesApi from './savedSearches.api';
import type { CreateSavedSearchData } from './savedSearches.types';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Mutation hook to create a saved search
 */
export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateSavedSearchData, 'userId'>) => {
      if (!currentUser) throw new Error('User must be logged in');

      return await savedSearchesApi.createSavedSearch({
        ...data,
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedSearches(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to delete a saved search
 */
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await savedSearchesApi.deleteSavedSearch(id);
    },
    onSuccess: () => {
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.savedSearches(currentUser.id) });
      }
    }
  });
};
