import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as usersApi from './users.api';
import { useAuth } from '@/contexts/AuthContext';

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

/**
 * Mutation hook to update user profile
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      username?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      dni?: string;
      birthDate?: string;
      country?: string;
      avatarUrl?: string;
    }) => {
      if (!currentUser) throw new Error('User must be logged in');
      
      await usersApi.updateUserProfile(currentUser.id, {
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        dni: data.dni,
        birth_date: data.birthDate,
        country: data.country,
        avatar_url: data.avatarUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(currentUser.id) });
      }
    }
  });
};
