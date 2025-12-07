import { supabase } from '../services/supabaseClient';
import type { SupportTicket } from '../types';
import type { CreateSupportTicketData, UpdateSupportTicketData } from './supportTickets.types';

/**
 * Fetch all support tickets (admin) or tickets by user
 */
export const getSupportTickets = async (userEmail?: string): Promise<SupportTicket[]> => {
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
  
  return data.map((t: any) => ({
    id: t.id,
    userEmail: t.user_email,
    category: t.category,
    subject: t.subject,
    description: t.description,
    status: t.status,
    assignedTo: t.assigned_to,
    response: t.response,
    assignmentHistory: t.assignment_history || [],
    timestamp: t.created_at,
    relatedReportId: t.related_report_id,
  }));
};

/**
 * Fetch a single support ticket by ID
 */
export const getSupportTicketById = async (id: string): Promise<SupportTicket | null> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    userEmail: data.user_email,
    category: data.category,
    subject: data.subject,
    description: data.description,
    status: data.status,
    assignedTo: data.assigned_to,
    response: data.response,
    assignmentHistory: data.assignment_history || [],
    timestamp: data.created_at,
    relatedReportId: data.related_report_id,
  };
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
  const { generateUUID } = await import('../utils/uuid');
  const { SUPPORT_TICKET_STATUS } = await import('../constants');
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
