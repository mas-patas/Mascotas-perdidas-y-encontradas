import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './auth.keys';
import * as authApi from './auth.api';
import type { 
  LoginCredentials, 
  RegisterData, 
  UpdateProfileData,
  UpdateOwnedPetsData,
  UpdateSavedPetIdsData 
} from './auth.types';

/**
 * Mutation hook to sign in with email and password
 */
export const useSignIn = () => {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => 
      authApi.signInWithPassword(credentials),
  });
};

/**
 * Mutation hook to sign up with email and password
 */
export const useSignUp = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => authApi.signUp(data),
  });
};

/**
 * Mutation hook to sign in with Google
 */
export const useSignInWithGoogle = () => {
  return useMutation({
    mutationFn: () => authApi.signInWithGoogle(),
  });
};

/**
 * Mutation hook to reset password
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.resetPasswordForEmail(email),
  });
};

/**
 * Mutation hook to update password
 */
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (password: string) => authApi.updatePassword(password),
  });
};

/**
 * Mutation hook to sign out
 */
export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      queryClient.removeQueries();
    },
  });
};

/**
 * Mutation hook to update owned pets
 */
export const useUpdateOwnedPets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateOwnedPetsData }) =>
      authApi.updateOwnedPets(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
};

/**
 * Mutation hook to update saved pet IDs
 */
export const useUpdateSavedPetIds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateSavedPetIdsData }) =>
      authApi.updateSavedPetIds(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
};
