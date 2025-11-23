
import { PET_STATUS, ANIMAL_TYPES, SIZES, USER_ROLES, USER_STATUS, REPORT_REASONS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES } from './constants';

export type PetStatus = typeof PET_STATUS[keyof typeof PET_STATUS];
export type AnimalType = typeof ANIMAL_TYPES[keyof typeof ANIMAL_TYPES];
export type PetSize = typeof SIZES[keyof typeof SIZES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type ReportReason = typeof REPORT_REASONS[keyof typeof REPORT_REASONS];
export type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];
export type ReportType = 'post' | 'user';
export type SupportTicketStatus = typeof SUPPORT_TICKET_STATUS[keyof typeof SUPPORT_TICKET_STATUS];
export type SupportTicketCategory = typeof SUPPORT_TICKET_CATEGORIES[keyof typeof SUPPORT_TICKET_CATEGORIES];
export type CampaignType = typeof CAMPAIGN_TYPES[keyof typeof CAMPAIGN_TYPES];

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
    link: 'support' | 'messages' | { type: 'campaign'; id: string } | { type: 'pet'; id: string };
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
}

export interface Comment {
    id: string;
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
    lat?: number; // Coordenada Latitud
    lng?: number; // Coordenada Longitud
    comments?: Comment[];
    expiresAt?: string; // ISO String for 60-day expiration
    createdAt?: string; // ISO String creation date
}

export type ReportPostSnapshot = Pet;

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
    provider?: 'email' | 'google' | 'apple';
    ownedPets?: OwnedPet[];
    savedPetIds?: string[];
    avatarUrl?: string;
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
