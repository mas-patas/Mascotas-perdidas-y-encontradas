import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './campaigns.keys';
import * as campaignsApi from './campaigns.api';
import type { CreateCampaignData, UpdateCampaignData } from './campaigns.types';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Mutation hook to create a campaign
 */
export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateCampaignData, 'userEmail'>) => {
      if (!currentUser) throw new Error('User must be logged in');

      return await campaignsApi.createCampaign({
        ...data,
        userEmail: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    }
  });
};

/**
 * Mutation hook to update a campaign
 */
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCampaignData }) => {
      await campaignsApi.updateCampaign(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    }
  });
};

/**
 * Mutation hook to delete a campaign
 */
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await campaignsApi.deleteCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    }
  });
};
