import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as usersApi from './users.api';

/**
 * Mutation hook to update user status
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, status }: { email: string; status: string }) => {
      await usersApi.updateUserStatus(email, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    }
  });
};

/**
 * Mutation hook to update user role
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      await usersApi.updateUserRole(email, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    }
  });
};
