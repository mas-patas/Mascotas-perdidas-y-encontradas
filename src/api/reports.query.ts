import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as reportsApi from './reports.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Query hook to fetch all reports (admin) or reports by user
 */
export const useReports = (userEmail?: string) => {
  return useQuery({
    queryKey: queryKeys.reports(userEmail),
    queryFn: () => reportsApi.getReports(userEmail),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single report by ID
 */
export const useReport = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.report(id!),
    queryFn: () => reportsApi.getReportById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to set up realtime subscriptions for reports
 */
export const useReportsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.reports() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
