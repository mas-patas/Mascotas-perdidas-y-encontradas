import { getSession, fetchUserProfile, createProfileFromOAuth } from '@/api/auth/auth.api';
import { transformProfileToUser, createFallbackUser } from '@/contexts/auth/auth.utils';
import type { User } from '@/types';
import type { AuthSession } from '@/api/auth/auth.types';

/**
 * Initial session check with timeout
 * Returns the session if exists, null otherwise
 */
export const initSession = async (): Promise<AuthSession | null> => {
  try {
    const sessionPromise = getSession();
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 15000)
    );

    const session = await Promise.race([sessionPromise, timeoutPromise]);
    return session;
  } catch (error) {
    console.error("Auth Init Error Details:", error);
    return null;
  }
};

/**
 * Fetch and transform user profile
 * Handles profile creation from OAuth metadata if profile doesn't exist
 */
export const fetchUserProfileService = async (
  authUser: any,
  retryCount = 0
): Promise<User | null> => {
  if (retryCount > 2) {
    return null;
  }

  const email = authUser.email;
  const uid = authUser.id;

  try {
    const profile = await fetchUserProfile(uid);

    if (!profile) {
      // Profile missing: Create it using OAuth metadata if available
      const metadata = authUser.user_metadata || {};
      
      try {
        await createProfileFromOAuth(uid, email, metadata);
        // Retry fetch after creating profile
        return fetchUserProfileService(authUser, retryCount + 1);
      } catch (insertError) {
        console.error("Error creating profile from OAuth:", insertError);
        // Fallback for UI if DB insert failed
        return createFallbackUser(uid, email);
      }
    } else {
      return transformProfileToUser(profile, email);
    }
  } catch (err) {
    console.error("Fetch profile exception:", err);
    return createFallbackUser(uid, email);
  }
};

/**
 * Handle auth state change
 * Returns the new user if session exists, null if signed out
 */
export const handleAuthStateChange = async (
  event: string,
  session: any,
  currentUserId?: string
): Promise<{ shouldUpdate: boolean; user: User | null }> => {
  if (session?.user) {
    // Only fetch profile if user changed
    if (!currentUserId || currentUserId !== session.user.id) {
      // Use fetchUserProfileService to ensure returned type matches User | null
      const user = await fetchUserProfileService(session.user);
      return { shouldUpdate: true, user };
    }
    return { shouldUpdate: false, user: null };
  } else if (event === 'SIGNED_OUT') {
    return { shouldUpdate: true, user: null };
  }
  
  return { shouldUpdate: false, user: null };
};
