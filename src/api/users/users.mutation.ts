import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './users.keys';
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

/**
 * Mutation hook to update user profile
 * Accepts userId as parameter to avoid circular dependency with auth context
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: {
      userId: string;
      data: {
        username?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        dni?: string;
        birthDate?: string;
        country?: string;
        avatarUrl?: string;
      };
    }) => {
      await usersApi.updateUserProfile(userId, {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.userId) });
    }
  });
};

/**
 * Mutation hook to update user location
 */
export const useUpdateUserLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, lat, lng }: { userId: string; lat: number; lng: number }) => {
      await usersApi.updateUserLocation(userId, lat, lng);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.userId) });
    }
  });
};
