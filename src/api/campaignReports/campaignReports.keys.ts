/**
 * Query keys for campaign reports
 */
export const queryKeys = {
  campaignReports: {
    all: ['campaignReports'] as const,
    lists: () => [...queryKeys.campaignReports.all, 'list'] as const,
    list: () => [...queryKeys.campaignReports.lists()] as const,
  },
} as const;

