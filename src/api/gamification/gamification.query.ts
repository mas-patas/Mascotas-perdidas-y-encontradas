import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './gamification.keys';
import * as gamificationApi from './gamification.api';

/**
 * Query hook to fetch activity logs for a user
 */
export const useActivityLogs = (userId: string | undefined, limit: number = 50) => {
  return useQuery({
    queryKey: queryKeys.activityLogs(userId!),
    queryFn: () => gamificationApi.getActivityLogs(userId!, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Query hook to fetch weekly leaderboard
 */
export const useWeeklyLeaderboard = () => {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: gamificationApi.getWeeklyLeaderboard,
    staleTime: 1000 * 60 * 10, // 10 minutes (leaderboard doesn't change frequently)
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};
