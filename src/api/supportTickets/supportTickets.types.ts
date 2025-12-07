/**
 * Type definitions for Support Ticket API operations
 */

export interface CreateSupportTicketData {
  userEmail: string;
  category: string;
  subject: string;
  description: string;
}

export interface UpdateSupportTicketData {
  status?: string;
  response?: string;
  assignedTo?: string;
}
