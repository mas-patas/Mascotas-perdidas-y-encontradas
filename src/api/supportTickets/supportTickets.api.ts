import { supabase } from '../../services/supabaseClient';
import type { SupportTicketRow } from '../../types';
import type { CreateSupportTicketData, UpdateSupportTicketData } from './supportTickets.types';

/**
 * Fetch all support tickets (admin) or tickets by user
 * Returns database rows with snake_case column names
 */
export const getSupportTickets = async (userEmail?: string): Promise<SupportTicketRow[]> => {
  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  if (!data) return [];
  
  return data;
};

/**
 * Fetch a single support ticket by ID
 * Returns database row with snake_case column names
 */
export const getSupportTicketById = async (id: string): Promise<SupportTicketRow | null> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return data;
};

/**
 * Fetch pending support tickets count (admin)
 */
export const getPendingSupportTicketsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pendiente');
  
  if (error) throw error;
  return count || 0;
};

/**
 * Mutation API Functions
 */

/**
 * Create a new support ticket
 */
export const createSupportTicket = async (data: CreateSupportTicketData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const { SUPPORT_TICKET_STATUS } = await import('../../constants');
  const ticketId = generateUUID();

  const { error } = await supabase.from('support_tickets').insert({
    id: ticketId,
    user_email: data.userEmail,
    category: data.category,
    subject: data.subject,
    description: data.description,
    status: SUPPORT_TICKET_STATUS.PENDING
  });

  if (error) throw error;
  return ticketId;
};

/**
 * Update a support ticket
 */
export const updateSupportTicket = async (id: string, data: UpdateSupportTicketData): Promise<void> => {
  const dbData: any = {};

  if (data.status !== undefined) dbData.status = data.status;
  if (data.response !== undefined) dbData.response = data.response;
  if (data.assignedTo !== undefined) dbData.assigned_to = data.assignedTo;

  const { error } = await supabase
    .from('support_tickets')
    .update(dbData)
    .eq('id', id);

  if (error) throw error;
};
