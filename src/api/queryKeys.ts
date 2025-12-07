/**
 * Centralized query keys for React Query
 * Used for cache management and invalidation
 */
export const queryKeys = {
  // Users
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  userByEmail: (email: string) => ['users', 'email', email] as const,
  
  // Pets
  pets: ['pets'] as const,
  petsWithFilters: (filters: any) => ['pets', filters] as const,
  pet: (id: string) => ['pets', id] as const,
  myPets: (userId: string) => ['myPets', userId] as const,
  mapPets: ['mapPets'] as const,
  
  // Campaigns
  campaigns: ['campaigns'] as const,
  campaign: (id: string) => ['campaigns', id] as const,
  
  // Chats
  chats: (userId: string) => ['chats', userId] as const,
  chat: (chatId: string) => ['chats', chatId] as const,
  messages: (chatId: string) => ['messages', chatId] as const,
  
  // Notifications
  notifications: (userId: string) => ['notifications', userId] as const,
  notification: (id: string) => ['notifications', id] as const,
  
  // Reports
  reports: (userId?: string) => userId ? ['reports', userId] : ['reports'] as const,
  report: (id: string) => ['reports', id] as const,
  
  // Support Tickets
  supportTickets: (userId?: string) => userId ? ['supportTickets', userId] : ['supportTickets'] as const,
  supportTicket: (id: string) => ['supportTickets', id] as const,
  
  // Businesses
  businesses: ['businesses'] as const,
  business: (id: string) => ['businesses', id] as const,
  businessByOwner: (ownerId: string) => ['businesses', 'owner', ownerId] as const,
  
  // Comments
  comments: (petId: string) => ['comments', petId] as const,
  comment: (id: string) => ['comments', id] as const,
  commentLikes: (commentId: string) => ['commentLikes', commentId] as const,
  
  // Saved Searches
  savedSearches: (userId: string) => ['savedSearches', userId] as const,
  savedSearch: (id: string) => ['savedSearches', id] as const,
  
  // Banned IPs
  bannedIps: ['bannedIps'] as const,
  bannedIp: (id: string) => ['bannedIps', id] as const,
  
  // Gamification
  activityLogs: (userId: string) => ['activityLogs', userId] as const,
  leaderboard: ['leaderboard'] as const,
} as const;
