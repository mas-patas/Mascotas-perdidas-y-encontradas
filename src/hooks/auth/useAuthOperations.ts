import { useSignIn, useSignUp, useSignInWithGoogle, useResetPassword, useSignOut } from '@/api/auth/auth.mutation';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth/auth.api';
import { clearGhosting } from '@/services/auth/ghostingService';

/**
 * Hook for authentication operations (login, register, logout, etc.)
 */
export const useAuthOperations = () => {
  const queryClient = useQueryClient();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signInWithGoogleMutation = useSignInWithGoogle();
  const resetPasswordMutation = useResetPassword();
  const signOutMutation = useSignOut();

  const login = async (email: string, password: string): Promise<void> => {
    await signInMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string): Promise<void> => {
    await signUpMutation.mutateAsync({ email, password });
  };

  const loginWithGoogle = async (): Promise<void> => {
    await signInWithGoogleMutation.mutateAsync();
  };

  const resetPassword = async (email: string): Promise<void> => {
    await resetPasswordMutation.mutateAsync(email);
  };

  const logout = async (): Promise<void> => {
    try {
      await signOutMutation.mutateAsync();
      clearGhosting();
    } catch (error) {
      console.error("Error during sign out:", error);
      queryClient.clear();
      clearGhosting();
      throw error;
    }
  };

  return {
    login,
    register,
    loginWithGoogle,
    resetPassword,
    logout,
  };
};
