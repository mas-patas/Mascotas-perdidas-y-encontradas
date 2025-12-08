import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth/auth.api';
import { initSession, fetchUserProfileService, handleAuthStateChange } from '@/services/auth/authService';
import { getStoredGhostingAdmin } from '@/services/auth/ghostingService';
import type { User } from '@/types';

/**
 * Hook for managing authentication session and state
 */
export const useAuthSession = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  // Setup keep-alive mechanism
  useEffect(() => {
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
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initialize session on mount
  useEffect(() => {
    mountedRef.current = true;
    
    const initAuth = async () => {
      const session = await initSession();

      if (mountedRef.current) {
        if (session?.user) {
          const user = await fetchUserProfileService(session.user);
          if (mountedRef.current) {
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(null);
        }
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { unsubscribe } = authApi.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      // Check if we're in ghost mode - if so, don't update the user
      const ghostingAdmin = getStoredGhostingAdmin();
      if (ghostingAdmin) {
        // We're in ghost mode, don't let auth state changes override the impersonated user
        // Only allow SIGNED_OUT to clear the session
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setLoading(false);
          queryClient.removeQueries();
        }
        return;
      }

      const { shouldUpdate, user } = await handleAuthStateChange(
        event,
        session,
        currentUser?.id
      );

      if (shouldUpdate && mountedRef.current) {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setLoading(false);
          queryClient.removeQueries();
        } else if (user) {
          setLoading(true);
          queryClient.removeQueries();
          setCurrentUser(user);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, queryClient]);

  return {
    currentUser,
    setCurrentUser,
    loading,
    setLoading,
  };
};
