import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './campaignReports.keys';
import * as campaignReportsApi from './campaignReports.api';

/**
 * Query hook to fetch all campaign reports (admin only)
 */
export const useCampaignReports = () => {
  return useQuery({
    queryKey: queryKeys.campaignReports.list(),
    queryFn: async () => {
      try {
        return await campaignReportsApi.getCampaignReports();
      } catch (error: any) {
        console.error('Error fetching campaign reports:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
          console.warn('campaign_reports table does not exist. Please run the migration: supabase/migrations/20250109000000_create_campaign_reports_table.sql');
          return [];
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if table doesn't exist
  });
};

