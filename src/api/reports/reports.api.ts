import { supabase } from '../../services/supabaseClient';
import type { Report } from '../../types';
import type { CreateReportData } from './reports.types';

/**
 * Fetch all reports (admin) or reports by user
 */
export const getReports = async (userEmail?: string): Promise<Report[]> => {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userEmail) {
    query = query.eq('reporter_email', userEmail);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((r: any) => ({
    id: r.id,
    reporterEmail: r.reporter_email,
    reportedEmail: r.reported_email,
    type: r.type,
    targetId: r.target_id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    timestamp: r.created_at,
    postSnapshot: r.post_snapshot,
  }));
};

/**
 * Fetch a single report by ID
 */
export const getReportById = async (id: string): Promise<Report | null> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    reporterEmail: data.reporter_email,
    reportedEmail: data.reported_email,
    type: data.type,
    targetId: data.target_id,
    reason: data.reason,
    details: data.details,
    status: data.status,
    timestamp: data.created_at,
    postSnapshot: data.post_snapshot,
  };
};

/**
 * Mutation API Functions
 */

/**
 * Create a new report
 */
export const createReport = async (data: CreateReportData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const { REPORT_STATUS } = await import('../../constants');
  const reportId = generateUUID();

  const { error } = await supabase.from('reports').insert({
    id: reportId,
    reporter_email: data.reporterEmail,
    reported_email: data.reportedEmail || '',
    type: data.type,
    target_id: data.targetId,
    reason: data.reason,
    details: data.details,
    status: REPORT_STATUS.PENDING,
    post_snapshot: data.postSnapshot,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
  return reportId;
};

/**
 * Update report status
 */
export const updateReportStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
};
