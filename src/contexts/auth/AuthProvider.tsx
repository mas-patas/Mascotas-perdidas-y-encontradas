import React, { useMemo } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './auth.types';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useAuthOperations } from '@/hooks/auth/useAuthOperations';
import { useUserProfile } from '@/hooks/auth/useUserProfile';
import { useGhosting } from '@/hooks/auth/useGhosting';

export const AuthProvider = ({ children }: React.PropsWithChildren): React.ReactElement => {
  const { currentUser, setCurrentUser, loading } = useAuthSession();
  const { login, register, logout, loginWithGoogle, loginWithFacebook, resetPassword } = useAuthOperations();
  const {
    updateUserProfile,
    updatePassword,
    addOwnedPet,
    updateOwnedPet,
    deleteOwnedPet,
    savePet,
    unsavePet,
  } = useUserProfile(currentUser, setCurrentUser);
  const { isGhosting, ghostLogin, stopGhosting } = useGhosting(currentUser, setCurrentUser);

  const value: AuthContextType = useMemo(
    () => ({
      currentUser,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
      loginWithFacebook,
      resetPassword,
      updateUserProfile,
      updatePassword,
      addOwnedPet,
      updateOwnedPet,
      deleteOwnedPet,
      savePet,
      unsavePet,
      isGhosting,
      ghostLogin,
      stopGhosting,
    }),
    [
      currentUser,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
      loginWithFacebook,
      resetPassword,
      updateUserProfile,
      updatePassword,
      addOwnedPet,
      updateOwnedPet,
      deleteOwnedPet,
      savePet,
      unsavePet,
      isGhosting,
      ghostLogin,
      stopGhosting,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
