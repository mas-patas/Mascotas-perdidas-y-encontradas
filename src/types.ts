
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_REASONS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES, BUSINESS_TYPES } from './constants';
import type { Database } from './types/database.types';

// Type aliases for generated database types (snake_case from database)
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

// Type aliases for backward compatibility (deprecated - use Row types directly)
// These will be removed in a future version
/** @deprecated Use SavedSearchRow instead */
export type SavedSearch = SavedSearchRow;
/** @deprecated Use BusinessProductRow instead */
export type BusinessProduct = BusinessProductRow;
/** @deprecated Use BusinessRow instead */
export type Business = BusinessRow;
/** @deprecated Use CampaignRow instead */
export type Campaign = CampaignRow;
/** @deprecated Use NotificationRow instead */
export type Notification = NotificationRow;
/** @deprecated Use SupportTicketRow instead */
export type SupportTicket = SupportTicketRow;
/** @deprecated Use CommentRow instead */
export type Comment = CommentRow;
/** @deprecated Use PetRow instead */
export type Pet = PetRow;
/** @deprecated Use ReportRow instead */
export type Report = ReportRow;

// Utility type for report post snapshot (can reference PetRow or CommentRow)
export type ReportPostSnapshot = PetRow | { text: string };

export interface OwnedPet {
    id: string;
    name: string;
    animalType: 'Perro' | 'Gato';
    breed: string;
    colors: string[];
    description?: string;
    imageUrls?: string[];
}

export interface User {
    id?: string; // Added ID for DB linking
    email: string;
    role: UserRole;
    status?: UserStatus;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    dni?: string;
    birthDate?: string; // Nuevo campo Fecha de Nacimiento
    country?: string; // Nuevo campo Pais
    provider?: 'email' | 'google' | 'apple';
    ownedPets?: OwnedPet[];
    savedPetIds?: string[];
    avatarUrl?: string;
    businessId?: string; // ID of the business if they own one
}

export interface UserRating {
    id: string;
    raterId: string; // User who gave the rating
    ratedUserId: string; // User who received the rating
    rating: number; // 1-5
    comment: string;
    createdAt: string;
    raterName?: string; // Enriched
    raterAvatar?: string; // Enriched
}

export interface LocationDetails {
    city: string;
    district: string;
    address: string;
}

// Type aliases for backward compatibility (deprecated - use Row types directly)
/** @deprecated Use MessageRow instead */
export type Message = MessageRow;
/** @deprecated Use ChatRow instead */
export type Chat = ChatRow;

export interface PotentialMatch {
    pet: PetRow;
    score: number;
    explanation: string;
}

// Type alias for backward compatibility (deprecated - use Row type directly)
/** @deprecated Use BannedIpRow instead */
export type BannedIP = BannedIpRow;

export interface Mission {
    id: string;
    title: string;
    description: string;
    points: number;
    isCompleted: boolean;
    icon: 'login' | 'share' | 'comment' | 'report';
}

// Type alias for backward compatibility (deprecated - use Row type directly)
/** @deprecated Use ActivityLogRow instead */
export type ActivityLog = ActivityLogRow;

export interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon: string;
    actionType: 'boost_post' | 'urgent_badge' | 'frame';
}

export interface LeaderboardEntry {
    user_id: string;
    username: string;
    avatar_url: string;
    total_points: number;
    rank: number;
}