import * as authApi from '@/api/auth/auth.api';
import { USER_ROLES } from '@/constants';
import type { User } from '@/types';

const GHOSTING_STORAGE_KEY = 'ghostingAdmin';

/**
 * Start ghosting (admin impersonation)
 */
export const startGhosting = (
  currentUser: User | null,
  userToImpersonate: User
): User => {
  if (!currentUser || currentUser.role !== USER_ROLES.SUPERADMIN) {
    throw new Error('Acción no permitida.');
  }
  
  const ghostingAdmin = currentUser;
  localStorage.setItem(GHOSTING_STORAGE_KEY, JSON.stringify(ghostingAdmin));
  return ghostingAdmin;
};

/**
 * Stop ghosting and restore admin session
 */
export const stopGhosting = async (): Promise<void> => {
  const storedAdmin = localStorage.getItem(GHOSTING_STORAGE_KEY);
  if (!storedAdmin) {
    throw new Error('No hay sesión fantasma.');
  }
  
  localStorage.removeItem(GHOSTING_STORAGE_KEY);
};

/**
 * Get stored ghosting admin user
 */
export const getStoredGhostingAdmin = (): User | null => {
  const stored = localStorage.getItem(GHOSTING_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Clear ghosting data
 */
export const clearGhosting = (): void => {
  localStorage.removeItem(GHOSTING_STORAGE_KEY);
};
