import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './auth.types';
import type { User, OwnedPet } from '@/types';
import { USER_ROLES } from '@/constants';
import * as authApi from '@/api/auth/auth.api';
import { useSignIn, useSignUp, useSignInWithGoogle, useResetPassword, useUpdatePassword, useSignOut, useUpdateOwnedPets, useUpdateSavedPetIds } from '@/api/auth/auth.mutation';
import { useUpdateUserProfile as useUpdateUserProfileMutation } from '@/api/users/users.mutation';
import { transformProfileToUser, createFallbackUser } from './auth.utils';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGhosting, setIsGhosting] = useState<User | null>(null);
  
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  // Mutation hooks
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signInWithGoogleMutation = useSignInWithGoogle();
  const resetPasswordMutation = useResetPassword();
  const updatePasswordMutation = useUpdatePassword();
  const signOutMutation = useSignOut();
  const updateOwnedPetsMutation = useUpdateOwnedPets();
  const updateSavedPetIdsMutation = useUpdateSavedPetIds();
  const updateUserProfileMutation = useUpdateUserProfileMutation();

  // Keep-alive mechanism
  useEffect(() => {
    mountedRef.current = true;
    const pingSupabase = async () => {
      try {
        const session = await authApi.getSession();
        if (!session) return;

        const { usersApi } = await import('@/api');
        await usersApi.pingDatabase();
      } catch (error) {
        console.error('Keep-alive database ping failed:', error);
      }
    };

    const intervalId = setInterval(pingSupabase, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pingSupabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initial session check
  useEffect(() => {
    const initAuth = async () => {
      try {
        const sessionPromise = authApi.getSession();
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 15000)
        );

        const session = await Promise.race([sessionPromise, timeoutPromise]);

        if (mountedRef.current) {
          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setCurrentUser(null);
            setLoading(false);
          }
        }
      } catch (error: any) {
        console.error("Auth Init Error Details:", error);
        console.log("Auth init info: Defaulting to guest mode due to timeout or network.");

        if (mountedRef.current) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const { unsubscribe } = authApi.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (session?.user) {
        if (!currentUser || currentUser.id !== session.user.id) {
          queryClient.removeQueries();
          setLoading(true);
          await fetchProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLoading(false);
        queryClient.removeQueries();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, queryClient]);

  const fetchProfile = async (authUser: any, retryCount = 0) => {
    if (retryCount > 2) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    const email = authUser.email;
    const uid = authUser.id;

    try {
      const profile = await authApi.fetchUserProfile(uid);

      if (!profile) {
        // Profile missing: Create it using OAuth metadata if available
        const metadata = authUser.user_metadata || {};
        
        try {
          await authApi.createProfileFromOAuth(uid, email, metadata);
          // Retry fetch after creating profile
          return fetchProfile(authUser, retryCount + 1);
        } catch (insertError) {
          console.error("Error creating profile from OAuth:", insertError);
          // Fallback for UI if DB insert failed
          if (mountedRef.current) {
            setCurrentUser(createFallbackUser(uid, email));
          }
        }
      } else {
        const user = transformProfileToUser(profile, email);
        if (mountedRef.current) setCurrentUser(user);
      }
    } catch (err) {
      console.error("Fetch profile exception:", err);
      if (mountedRef.current) {
        setCurrentUser(createFallbackUser(uid, email));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

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

  const logout = async () => {
    try {
      await signOutMutation.mutateAsync();
      localStorage.removeItem('ghostingAdmin');
    } catch (error) {
      console.error("Error during sign out:", error);
      setCurrentUser(null);
      queryClient.clear();
      localStorage.removeItem('ghostingAdmin');
    }
  };

  const updateUserProfile = async (
    profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'birthDate' | 'avatarUrl' | 'country'>>
  ): Promise<void> => {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error('No auth session');
    
    await updateUserProfileMutation.mutateAsync({
      userId: user.id,
      data: {
        username: profileData.username,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        dni: profileData.dni,
        birthDate: profileData.birthDate,
        country: profileData.country,
        avatarUrl: profileData.avatarUrl
      }
    });

    setCurrentUser(prev => prev ? { ...prev, ...profileData } : null);
  };

  const updatePassword = async (password: string): Promise<void> => {
    await updatePasswordMutation.mutateAsync(password);
  };

  const addOwnedPet = async (petData: Omit<OwnedPet, 'id'>) => {
    if (!currentUser) return;
    
    const newPet = { ...petData, id: Date.now().toString() };
    const updatedOwnedPets = [...(currentUser.ownedPets || []), newPet];

    await updateOwnedPetsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { ownedPets: updatedOwnedPets }
    });

    setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
  };

  const updateOwnedPet = async (petData: OwnedPet) => {
    if (!currentUser) return;

    const updatedOwnedPets = (currentUser.ownedPets || []).map(p => 
      p.id === petData.id ? petData : p
    );

    await updateOwnedPetsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { ownedPets: updatedOwnedPets }
    });

    setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
  };

  const deleteOwnedPet = async (petId: string) => {
    if (!currentUser) return;

    const updatedOwnedPets = (currentUser.ownedPets || []).filter(p => p.id !== petId);

    await updateOwnedPetsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { ownedPets: updatedOwnedPets }
    });

    setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
  };

  const savePet = async (petId: string) => {
    if (!currentUser) return;
    
    if (currentUser.savedPetIds?.includes(petId)) return;
    
    const updatedSavedIds = [...(currentUser.savedPetIds || []), petId];

    await updateSavedPetIdsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { savedPetIds: updatedSavedIds }
    });

    setCurrentUser(prev => prev ? { ...prev, savedPetIds: updatedSavedIds } : null);
  };

  const unsavePet = async (petId: string) => {
    if (!currentUser) return;

    const updatedSavedIds = (currentUser.savedPetIds || []).filter(id => id !== petId);

    await updateSavedPetIdsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { savedPetIds: updatedSavedIds }
    });

    setCurrentUser(prev => prev ? { ...prev, savedPetIds: updatedSavedIds } : null);
  };

  const ghostLogin = async (userToImpersonate: User) => {
    if (!currentUser || currentUser.role !== USER_ROLES.SUPERADMIN) {
      throw new Error('Acción no permitida.');
    }
    const ghostingAdmin = currentUser;
    localStorage.setItem('ghostingAdmin', JSON.stringify(ghostingAdmin));
    setIsGhosting(ghostingAdmin);
    setCurrentUser(userToImpersonate);
  };

  const stopGhosting = async () => {
    const storedAdmin = localStorage.getItem('ghostingAdmin');
    if (!storedAdmin) throw new Error('No hay sesión fantasma.');
    
    const adminUser = JSON.parse(storedAdmin);
    const user = await authApi.getCurrentUser();
    if (user) await fetchProfile(user);
    
    localStorage.removeItem('ghostingAdmin');
    setIsGhosting(null);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
