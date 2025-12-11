import type { User, OwnedPet } from '@/types';

/**
 * Auth context type definition
 */
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'birthDate' | 'avatarUrl' | 'country'>>) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  addOwnedPet: (petData: Omit<OwnedPet, 'id'>) => Promise<void>;
  updateOwnedPet: (petData: OwnedPet) => Promise<void>;
  deleteOwnedPet: (petId: string) => Promise<void>;
  savePet: (petId: string) => Promise<void>;
  unsavePet: (petId: string) => Promise<void>;
  isGhosting: User | null;
  ghostLogin: (userToImpersonate: User) => Promise<void>;
  stopGhosting: () => Promise<void>;
}
