import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth';
import { useUpdateUserLocation } from '@/api/users/users.mutation';

interface UseUserLocationOptions {
  enabled?: boolean;
  updateInterval?: number; // in milliseconds, default 15 minutes
}

/**
 * Hook to automatically update user location when enabled
 * Requests geolocation permission and updates location periodically
 */
export const useUserLocation = ({
  enabled = true,
  updateInterval = 15 * 60 * 1000, // 15 minutes default
}: UseUserLocationOptions = {}) => {
  const { currentUser } = useAuth();
  const updateLocation = useUpdateUserLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedPermission = useRef(false);

  useEffect(() => {
    if (!enabled || !currentUser?.id) {
      // Clear interval if disabled or user not logged in
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateUserLocation = () => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation.mutate({
            userId: currentUser.id!,
            lat: latitude,
            lng: longitude,
          });
        },
        (error) => {
          // Silently handle errors (user denied, timeout, etc.)
          console.debug('Location update failed:', error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000, // Accept cached position up to 5 minutes old
        }
      );
    };

    // Request permission and update immediately
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      updateUserLocation();
    }

    // Set up periodic updates
    intervalRef.current = setInterval(updateUserLocation, updateInterval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, currentUser?.id, updateInterval, updateLocation]);

  return {
    isUpdating: updateLocation.isPending,
  };
};




