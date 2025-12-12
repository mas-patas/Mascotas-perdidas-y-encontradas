import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './reports.keys';
import * as reportsApi from './reports.api';
import { transformReportRows } from './reports.transform';
import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

/**
 * Query hook to fetch all reports (admin) or reports by user
 */
export const useReports = (userEmail?: string) => {
  return useQuery({
    queryKey: queryKeys.reports(userEmail),
    queryFn: async () => {
      const rows = await reportsApi.getReports(userEmail);
      return transformReportRows(rows);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch a single report by ID
 */
export const useReport = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.report(id!),
    queryFn: async () => {
      const row = await reportsApi.getReportById(id!);
      if (!row) return null;
      const { transformReportRow } = await import('./reports.transform');
      return transformReportRow(row);
    },
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
