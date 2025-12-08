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
    console.log('🔍 ghostLogin called');
    console.log('  - userToImpersonate:', userToImpersonate?.email, userToImpersonate?.username);
    console.log('  - currentUser (admin):', currentUser?.email, currentUser?.username);
    
    if (!userToImpersonate || !userToImpersonate.email) {
      console.error('❌ Invalid userToImpersonate:', userToImpersonate);
      throw new Error('Usuario inválido para impersonar');
    }
    
    if (!currentUser) {
      console.error('❌ No currentUser (admin) available');
      throw new Error('No hay usuario administrador autenticado');
    }
    
    const adminUser = startGhosting(currentUser, userToImpersonate);
    setIsGhosting(adminUser);
    
    console.log('✅ Setting currentUser to impersonated user:', userToImpersonate.email);
    setCurrentUser(userToImpersonate);
    
    console.log('✅ Ghost login completed. Now impersonating:', userToImpersonate.email);
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
