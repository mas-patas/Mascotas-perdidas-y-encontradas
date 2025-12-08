import { useState, useEffect } from 'react';
import * as authApi from '@/api/auth/auth.api';
import { startGhosting, stopGhosting, getStoredGhostingAdmin } from '@/services/auth/ghostingService';
import { fetchUserProfileService } from '@/services/auth/authService';
import type { User } from '@/types';

/**
 * Hook for admin ghosting/impersonation functionality
 */
export const useGhosting = (
  currentUser: User | null,
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  // Restore ghosting state from localStorage on mount
  const [isGhosting, setIsGhosting] = useState<User | null>(() => {
    return getStoredGhostingAdmin();
  });
  
  // Restore ghosting state when component mounts
  useEffect(() => {
    const storedAdmin = getStoredGhostingAdmin();
    if (storedAdmin) {
      setIsGhosting(storedAdmin);
    }
  }, []);

  const ghostLogin = async (userToImpersonate: User): Promise<void> => {
    if (!userToImpersonate || !userToImpersonate.email) {
      throw new Error('Usuario inválido para impersonar');
    }
    
    if (!currentUser) {
      throw new Error('No hay usuario administrador autenticado');
    }
    
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
