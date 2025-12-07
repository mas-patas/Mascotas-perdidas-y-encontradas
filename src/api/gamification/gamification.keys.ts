/**
 * Query keys for Gamification API
 */
export const queryKeys = {
  activityLogs: (userId: string) => ['activityLogs', userId] as const,
  leaderboard: ['leaderboard'] as const,
} as const;

