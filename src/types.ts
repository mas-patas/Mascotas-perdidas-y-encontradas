import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_REASONS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES, BUSINESS_TYPES } from './constants';
import type { Database } from './types/database.types';

// ============================================================================
// Database Row/Insert/Update Type Aliases
// ============================================================================
// These are convenient shortcuts to Supabase-generated types.
// All database columns use snake_case as per database schema.

export type BusinessRow = Database['public']['Tables']['businesses']['Row'];
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

export type PetRow = Database['public']['Tables']['pets']['Row'];
export type PetInsert = Database['public']['Tables']['pets']['Insert'];
export type PetUpdate = Database['public']['Tables']['pets']['Update'];

export type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export type CommentRow = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];

export type ChatRow = Database['public']['Tables']['chats']['Row'];
export type ChatInsert = Database['public']['Tables']['chats']['Insert'];
export type ChatUpdate = Database['public']['Tables']['chats']['Update'];

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type ReportRow = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];

export type SupportTicketRow = Database['public']['Tables']['support_tickets']['Row'];
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];

export type SavedSearchRow = Database['public']['Tables']['saved_searches']['Row'];
export type SavedSearchInsert = Database['public']['Tables']['saved_searches']['Insert'];
export type SavedSearchUpdate = Database['public']['Tables']['saved_searches']['Update'];

export type BannedIpRow = Database['public']['Tables']['banned_ips']['Row'];
export type BannedIpInsert = Database['public']['Tables']['banned_ips']['Insert'];
export type BannedIpUpdate = Database['public']['Tables']['banned_ips']['Update'];

export type ActivityLogRow = Database['public']['Tables']['user_activity_logs']['Row'];
export type ActivityLogInsert = Database['public']['Tables']['user_activity_logs']['Insert'];

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type BusinessProductRow = Database['public']['Tables']['business_products']['Row'];
export type BusinessProductInsert = Database['public']['Tables']['business_products']['Insert'];
export type BusinessProductUpdate = Database['public']['Tables']['business_products']['Update'];

export type CommentLikeRow = Database['public']['Tables']['comment_likes']['Row'];
export type CommentLikeInsert = Database['public']['Tables']['comment_likes']['Insert'];

export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type UserRatingRow = Database['public']['Tables']['user_ratings']['Row'];
export type UserRatingInsert = Database['public']['Tables']['user_ratings']['Insert'];
export type UserRatingUpdate = Database['public']['Tables']['user_ratings']['Update'];

export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row'];
export type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert'];
export type PushSubscriptionUpdate = Database['public']['Tables']['push_subscriptions']['Update'];

// ============================================================================
// Database Function Return Types
// ============================================================================

export type LeaderboardEntry = Database['public']['Functions']['get_weekly_leaderboard']['Returns'][number];

// ============================================================================
// Enum Types (from constants)
// ============================================================================

export type PetStatus = typeof PET_STATUS[keyof typeof PET_STATUS];
export type AnimalType = typeof ANIMAL_TYPES[keyof typeof ANIMAL_TYPES];
export type PetSize = typeof SIZES[keyof typeof SIZES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type ReportReason = typeof REPORT_REASONS[keyof typeof REPORT_REASONS];
export type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];
export type ReportType = 'post' | 'user' | 'comment';
export type SupportTicketStatus = typeof SUPPORT_TICKET_STATUS[keyof typeof SUPPORT_TICKET_STATUS];
export type SupportTicketCategory = typeof SUPPORT_TICKET_CATEGORIES[keyof typeof SUPPORT_TICKET_CATEGORIES];
export type CampaignType = typeof CAMPAIGN_TYPES[keyof typeof CAMPAIGN_TYPES];
export type BusinessType = typeof BUSINESS_TYPES[keyof typeof BUSINESS_TYPES];

// ============================================================================
// Custom Types & Interfaces
// ============================================================================
// These are types that don't directly map to database tables:
// - Enriched/computed types (combining data from multiple sources)
// - UI-specific types (forms, gamification, etc.)
// - Helper types for specific use cases

/**
 * Utility type for report post snapshot (can reference PetRow or CommentRow)
 */
export type ReportPostSnapshot = PetRow | { text: string };

/**
 * Enriched user rating with additional display fields from joins
 */
export interface UserRating {
  id: string;
  raterId: string;
  ratedUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  raterName?: string; // Enriched from profile join
  raterAvatar?: string; // Enriched from profile join
}

/**
 * Computed type for pet matching results
 */
export interface PotentialMatch {
  pet: PetRow;
  score: number;
  explanation: string;
}

/**
 * Location details helper type (used for forms/UI)
 */
export interface LocationDetails {
  city: string;
  district: string;
  address: string;
}

/**
 * UI-specific mission type for gamification
 */
export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  isCompleted: boolean;
  icon: 'login' | 'share' | 'comment' | 'report';
}

/**
 * UI-specific reward type for gamification
 */
export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  actionType: 'boost_post' | 'urgent_badge' | 'frame';
}

// ============================================================================
// Legacy Types (Evaluate for Removal)
// ============================================================================
// TODO: These types use camelCase and may duplicate ProfileRow functionality.
// Consider migrating to ProfileRow with transformations where needed.

/**
 * Simplified pet type for owned pets (used in forms/UI)
 * Consider: Can this be replaced with PetRow or a subset type?
 */
export interface OwnedPet {
  id: string;
  name: string;
  animalType: 'Perro' | 'Gato';
  breed: string;
  colors: string[];
  description?: string;
  imageUrls?: string[];
}

/**
 * User type with camelCase fields (used in forms/UI)
 * Consider: Can this be replaced with ProfileRow + transformations?
 * Note: ProfileRow uses snake_case (first_name, last_name, avatar_url, etc.)
 */
export interface User {
  id?: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dni?: string;
  birthDate?: string;
  country?: string;
  provider?: 'email' | 'google' | 'apple';
  ownedPets?: OwnedPet[];
  savedPetIds?: string[];
  avatarUrl?: string;
  businessId?: string;
}

/**
 * Pet type with camelCase fields (used in mappers/UI)
 * Consider: Can this be replaced with PetRow + transformations?
 * Note: PetRow uses snake_case (animal_type, image_urls, etc.)
 */
export interface Pet {
  id: string;
  userEmail: string;
  status: PetStatus;
  name: string;
  animalType: AnimalType;
  breed: string;
  color: string;
  size?: PetSize;
  location: string;
  date: string;
  contact: string;
  description: string;
  imageUrls: string[];
  adoptionRequirements?: string;
  shareContactInfo?: boolean;
  contactRequests?: string[];
  reward?: number;
  currency?: string;
  lat?: number;
  lng?: number;
  comments: Comment[];
  expiresAt?: string;
  createdAt: string;
  reunionStory?: string;
  reunionDate?: string;
}

/**
 * Comment type with camelCase fields (used in mappers/UI)
 * Consider: Can this be replaced with CommentRow + transformations?
 * Note: CommentRow uses snake_case (user_id, created_at, etc.)
 */
export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  text: string;
  timestamp: string;
  parentId?: string | null;
  likes: string[];
}

/**
 * Notification type with camelCase fields (used in UI)
 * Note: NotificationRow uses snake_case (user_id, created_at, is_read, etc.)
 */
export interface Notification {
  id: string;
  userId: string;
  message: string;
  link: NotificationRow['link'];
  isRead: boolean;
  timestamp: string;
}
