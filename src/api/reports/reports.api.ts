import { supabase } from '../../services/supabaseClient';
import type { ReportRow } from '../../types';
import type { CreateReportData } from './reports.types';

/**
 * Fetch all reports (admin) or reports by user
 * Returns database rows with snake_case column names
 */
export const getReports = async (userEmail?: string): Promise<ReportRow[]> => {
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
  
  return data;
};

/**
 * Fetch a single report by ID
 * Returns database row with snake_case column names
 */
export const getReportById = async (id: string): Promise<ReportRow | null> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return data;
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
