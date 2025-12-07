/**
 * Type definitions for Chat API operations
 */

export interface CreateChatData {
  petId?: string | null;
  participantEmails: string[];
}
