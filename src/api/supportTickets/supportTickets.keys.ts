/**
 * Query keys for Support Tickets API
 */
export const queryKeys = {
  supportTickets: (userId?: string) => userId ? ['supportTickets', userId] : ['supportTickets'] as const,
  supportTicket: (id: string) => ['supportTickets', id] as const,
} as const;

