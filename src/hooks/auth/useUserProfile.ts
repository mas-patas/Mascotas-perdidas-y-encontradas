import { useUpdatePassword, useUpdateOwnedPets, useUpdateSavedPetIds } from '@/api/auth/auth.mutation';
import { useUpdateUserProfile as useUpdateUserProfileMutation } from '@/api/users/users.mutation';
import * as authApi from '@/api/auth/auth.api';
import type { User, OwnedPet } from '@/types';

/**
 * Hook for user profile management operations
 */
export const useUserProfile = (
  currentUser: User | null,
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  const updatePasswordMutation = useUpdatePassword();
  const updateOwnedPetsMutation = useUpdateOwnedPets();
  const updateSavedPetIdsMutation = useUpdateSavedPetIds();
  const updateUserProfileMutation = useUpdateUserProfileMutation();

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

  const addOwnedPet = async (petData: Omit<OwnedPet, 'id'>): Promise<void> => {
    if (!currentUser) return;
    
    const newPet = { ...petData, id: Date.now().toString() };
    const updatedOwnedPets = [...(currentUser.ownedPets || []), newPet];

    await updateOwnedPetsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { ownedPets: updatedOwnedPets }
    });

    setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
  };

  const updateOwnedPet = async (petData: OwnedPet): Promise<void> => {
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

  const deleteOwnedPet = async (petId: string): Promise<void> => {
    if (!currentUser) return;

    const updatedOwnedPets = (currentUser.ownedPets || []).filter(p => p.id !== petId);

    await updateOwnedPetsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { ownedPets: updatedOwnedPets }
    });

    setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
  };

  const savePet = async (petId: string): Promise<void> => {
    if (!currentUser) return;
    
    if (currentUser.savedPetIds?.includes(petId)) return;
    
    const updatedSavedIds = [...(currentUser.savedPetIds || []), petId];

    await updateSavedPetIdsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { savedPetIds: updatedSavedIds }
    });

    setCurrentUser(prev => prev ? { ...prev, savedPetIds: updatedSavedIds } : null);
  };

  const unsavePet = async (petId: string): Promise<void> => {
    if (!currentUser) return;

    const updatedSavedIds = (currentUser.savedPetIds || []).filter(id => id !== petId);

    await updateSavedPetIdsMutation.mutateAsync({
      userId: currentUser.id!,
      data: { savedPetIds: updatedSavedIds }
    });

    setCurrentUser(prev => prev ? { ...prev, savedPetIds: updatedSavedIds } : null);
  };

  return {
    updateUserProfile,
    updatePassword,
    addOwnedPet,
    updateOwnedPet,
    deleteOwnedPet,
    savePet,
    unsavePet,
  };
};
