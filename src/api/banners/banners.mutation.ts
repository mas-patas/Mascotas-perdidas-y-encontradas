import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBanner, updateBanner, deleteBanner } from './banners.api';
import { bannerKeys } from './banners.keys';
import type { CreateBannerData, UpdateBannerData } from './banners.types';

/**
 * Mutation hook to create a new banner
 */
export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerData) => createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
};

/**
 * Mutation hook to update a banner
 */
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannerData }) => updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
};

/**
 * Mutation hook to delete a banner
 */
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
};



