

import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_REASONS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES, BUSINESS_TYPES } from './constants';

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

export interface SavedSearch {
    id: string;
    userId: string;
    name: string;
    filters: {
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        department: string;
        // Simplified filters for saving
    };
    createdAt: string;
}

export interface BusinessProduct {
    id: string;
    businessId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string; // Deprecated, kept for compatibility
    imageUrls?: string[]; // New array
}

export interface Business {
    id: string;
    ownerId: string; // Links to a User.id
    name: string;
    type: BusinessType;
    description: string;
    address: string;
    phone: string;
    whatsapp?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    logoUrl?: string;
    coverUrl?: string; // Hero image
    bannerUrl?: string; // Secondary promotional banner
    services: string[]; // Array of strings e.g., ["Rayos X", "Baños", "Urgencias"]
    products?: BusinessProduct[];
    lat?: number;
    lng?: number;
    isVerified?: boolean;
    createdAt?: string;
}

export interface Campaign {
    id: string;
    userEmail: string; // Admin who created it
    type: CampaignType;
    title: string;
    description: string;
    location: string;
    date: string; // ISO String
    imageUrls: string[];
    contactPhone?: string;
    lat?: number;
    lng?: number;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    link: 'support' | 'messages' | { type: 'campaign'; id: string } | { type: 'pet'; id: string } | { type: 'pet-renew'; id: string };
    timestamp: string;
    isRead: boolean;
}

export interface SupportTicket {
    id: string;
    userEmail: string;
    category: SupportTicketCategory;
    subject: string;
    description: string;
    timestamp: string;
    status: SupportTicketStatus;
    assignedTo?: string; // Admin email
    assignmentHistory?: { adminEmail: string; timestamp: string }[];
    response?: string;
    relatedReportId?: string; // Link to a specific report
}

export interface Comment {
    id: string;
    userId?: string; // Added optional userId for DB linking
    userEmail: string;
    userName: string;
    text: string;
    timestamp: string;
    parentId?: string | null;
    likes?: string[];
}

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
    reward?: number; // Changed to number (integer in DB)
    currency?: string; // New field for 'S/' or '$'
    lat?: number; // Coordenada Latitud
    lng?: number; // Coordenada Longitud
    comments?: Comment[];
    expiresAt?: string; // ISO String for 60-day expiration
    createdAt?: string; // ISO String creation date
    embedding?: number[]; // Vector embedding for AI search
    reunionStory?: string; // Historia del reencuentro
    reunionDate?: string; // Fecha del reencuentro
}

export type ReportPostSnapshot = Pet | { text: string }; // Can be a Pet or a Comment text object

export interface Report {
    id: string;
    reporterEmail: string;
    reportedEmail: string;
    type: ReportType;
    targetId: string;
    reason: ReportReason;
    details: string;
    timestamp: string;
    status: ReportStatus;
    postSnapshot?: ReportPostSnapshot;
}

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

export interface Message {
    senderEmail: string;
    text: string;
    timestamp: string;
    isUnread?: boolean; // Helper for UI
}

export interface Chat {
    id: string;
    petId?: string;
    participantEmails: string[];
    messages: Message[];
    lastReadTimestamps: { [userEmail: string]: string };
}

export interface PotentialMatch {
    pet: Pet;
    score: number;
    explanation: string;
}

export interface BannedIP {
    id: string;
    ipAddress: string;
    reason: string;
    createdAt: string;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    points: number;
    isCompleted: boolean;
    icon: 'login' | 'share' | 'comment' | 'report';
}

export interface ActivityLog {
    id: string;
    userId: string;
    actionType: 'report_pet' | 'comment_added' | 'pet_reunited' | 'daily_login' | 'share_post';
    points: number;
    createdAt: string;
    details?: any;
}

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