/**
 * Central export point for all API functions and query hooks
 */

// Query Keys - Combined from all modules
import { queryKeys as authKeys } from './auth/auth.keys';
import { queryKeys as usersKeys } from './users/users.keys';
import { queryKeys as petsKeys } from './pets/pets.keys';
import { queryKeys as campaignsKeys } from './campaigns/campaigns.keys';
import { queryKeys as chatsKeys } from './chats/chats.keys';
import { queryKeys as notificationsKeys } from './notifications/notifications.keys';
import { queryKeys as reportsKeys } from './reports/reports.keys';
import { queryKeys as supportTicketsKeys } from './supportTickets/supportTickets.keys';
import { queryKeys as businessesKeys } from './businesses/businesses.keys';
import { queryKeys as commentsKeys } from './comments/comments.keys';
import { queryKeys as savedSearchesKeys } from './savedSearches/savedSearches.keys';
import { queryKeys as bannedIpsKeys } from './bannedIps/bannedIps.keys';
import { queryKeys as gamificationKeys } from './gamification/gamification.keys';
import { bannerKeys } from './banners/banners.keys';

export const queryKeys = {
  ...authKeys,
  ...usersKeys,
  ...petsKeys,
  ...campaignsKeys,
  ...chatsKeys,
  ...notificationsKeys,
  ...reportsKeys,
  ...supportTicketsKeys,
  ...businessesKeys,
  ...commentsKeys,
  ...savedSearchesKeys,
  ...bannedIpsKeys,
  ...gamificationKeys,
  banners: bannerKeys,
} as const;

// Type Definitions
export * from './pets/pets.types';
export * from './comments/comments.types';
export * from './campaigns/campaigns.types';
export * from './chats/chats.types';
export * from './reports/reports.types';
export * from './supportTickets/supportTickets.types';
export * from './businesses/businesses.types';
export * from './savedSearches/savedSearches.types';
export * from './banners/banners.types';

// API Functions
export * as authApi from './auth/auth.api';
export * as usersApi from './users/users.api';
export * as petsApi from './pets/pets.api';
export * as campaignsApi from './campaigns/campaigns.api';
export * as chatsApi from './chats/chats.api';
export * as notificationsApi from './notifications/notifications.api';
export * as reportsApi from './reports/reports.api';
export * as supportTicketsApi from './supportTickets/supportTickets.api';
export * as businessesApi from './businesses/businesses.api';
export * as commentsApi from './comments/comments.api';
export * as savedSearchesApi from './savedSearches/savedSearches.api';
export * as bannedIpsApi from './bannedIps/bannedIps.api';
export * as gamificationApi from './gamification/gamification.api';
export * as pushSubscriptionsApi from './pushSubscriptions/pushSubscriptions.api';
export * as bannersApi from './banners/banners.api';

// Query Hooks
export * from './users/users.query';
export * from './pets/pets.query';
export * from './campaigns/campaigns.query';
export * from './chats/chats.query';
export * from './notifications/notifications.query';
export * from './reports/reports.query';
export * from './supportTickets/supportTickets.query';
export * from './businesses/businesses.query';
export * from './comments/comments.query';
export * from './savedSearches/savedSearches.query';
export * from './bannedIps/bannedIps.query';
export * from './gamification/gamification.query';
export * from './admin/admin.query';
export * from './banners/banners.query';

// Mutation Hooks
export * from './auth/auth.mutation';
export * from './pets/pets.mutation';
export * from './comments/comments.mutation';
export * from './campaigns/campaigns.mutation';
export * from './chats/chats.mutation';
export * from './notifications/notifications.mutation';
export * from './reports/reports.mutation';
export * from './supportTickets/supportTickets.mutation';
export * from './businesses/businesses.mutation';
export * from './users/users.mutation';
export * from './savedSearches/savedSearches.mutation';
export * from './bannedIps/bannedIps.mutation';
export * from './pushSubscriptions/pushSubscriptions.mutation';
export * from './banners/banners.mutation';
