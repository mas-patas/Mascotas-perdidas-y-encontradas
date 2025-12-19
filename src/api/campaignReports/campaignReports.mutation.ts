import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './campaignReports.keys';
import * as campaignReportsApi from './campaignReports.api';
import type { CreateCampaignReportData } from './campaignReports.api';

/**
 * Mutation hook to create a campaign report
 */
export const useCreateCampaignReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCampaignReportData) => {
      return await campaignReportsApi.createCampaignReport(data);
    },
    onSuccess: () => {
      // Invalidate campaign reports list
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignReports.list() });
    },
  });
};

/**
 * Mutation hook to update campaign report status
 */
export const useUpdateCampaignReportStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'approved' | 'rejected' }) => {
      return await campaignReportsApi.updateCampaignReportStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignReports.list() });
    },
  });
};

/**
 * Mutation hook to delete a campaign report
 */
export const useDeleteCampaignReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await campaignReportsApi.deleteCampaignReport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignReports.list() });
    },
  });
};

