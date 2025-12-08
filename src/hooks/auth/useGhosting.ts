import { useState } from 'react';
import * as authApi from '@/api/auth/auth.api';
import { startGhosting, stopGhosting } from '@/services/auth/ghostingService';
import { fetchUserProfileService } from '@/services/auth/authService';
import type { User } from '@/types';

/**
 * Hook for admin ghosting/impersonation functionality
 */
export const useGhosting = (
  currentUser: User | null,
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  const [isGhosting, setIsGhosting] = useState<User | null>(null);

  const ghostLogin = async (userToImpersonate: User): Promise<void> => {
    const adminUser = startGhosting(currentUser, userToImpersonate);
    setIsGhosting(adminUser);
    setCurrentUser(userToImpersonate);
  };

  const stopGhostingSession = async (): Promise<void> => {
    await stopGhosting();
    setIsGhosting(null);
    
    // Restore admin user
    const user = await authApi.getCurrentUser();
    if (user) {
      const adminUser = await fetchUserProfileService(user);
      if (adminUser) {
        setCurrentUser(adminUser);
      }
    }
  };

  return {
    isGhosting,
    ghostLogin,
    stopGhosting: stopGhostingSession,
  };
};
