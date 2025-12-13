import { useQuery } from '@tanstack/react-query';
import { getAllBanners, getActiveBanners, getBannerById } from './banners.api';
import { bannerKeys } from './banners.keys';

/**
 * Query hook to fetch all banners (admin only)
 */
export const useBanners = () => {
  return useQuery({
    queryKey: bannerKeys.list('all'),
    queryFn: getAllBanners,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * Query hook to fetch active banners for public display
 */
export const useActiveBanners = () => {
  return useQuery({
    queryKey: bannerKeys.active(),
    queryFn: getActiveBanners,
  });
};

/**
 * Query hook to fetch a single banner by ID
 */
export const useBanner = (id: string) => {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => getBannerById(id),
    enabled: !!id,
  });
};

