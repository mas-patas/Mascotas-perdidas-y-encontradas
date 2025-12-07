/**
 * Query keys for Banned IPs API
 */
export const queryKeys = {
  bannedIps: ['bannedIps'] as const,
  bannedIp: (id: string) => ['bannedIps', id] as const,
} as const;

