import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './reports.keys';
import * as reportsApi from './reports.api';
import type { CreateReportData } from './reports.types';
import { useAuth } from '@/contexts/auth';

/**
 * Mutation hook to create a report
 */
export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateReportData, 'reporterEmail'>) => {
      if (!currentUser) throw new Error('User must be logged in');

      return await reportsApi.createReport({
        ...data,
        reporterEmail: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports() });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.reports(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to update report status
 */
export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await reportsApi.updateReportStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports() });
    }
  });
};
