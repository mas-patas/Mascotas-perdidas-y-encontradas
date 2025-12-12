/**
 * Report transformations
 * 
 * Transforms ReportRow (snake_case from database) to Report (camelCase for UI)
 */

import type { ReportRow } from '../../types';

/**
 * Report type with camelCase fields (used in UI)
 * Note: ReportRow uses snake_case (created_at, reporter_email, etc.)
 */
export interface Report {
  id: string;
  reporterEmail: string;
  reportedEmail: string;
  type: 'post' | 'user' | 'comment';
  targetId: string;
  reason: string;
  details: string;
  status: string;
  timestamp: string;
  postSnapshot?: any;
}

/**
 * Transform ReportRow to Report (camelCase)
 */
export const transformReportRow = (row: ReportRow): Report => {
  return {
    id: row.id,
    reporterEmail: row.reporter_email || '',
    reportedEmail: row.reported_email || '',
    type: (row.type as 'post' | 'user' | 'comment') || 'post',
    targetId: row.target_id || '',
    reason: row.reason || '',
    details: row.details || '',
    status: row.status || '',
    timestamp: row.created_at || row.timestamp || new Date().toISOString(),
    postSnapshot: row.post_snapshot
  };
};

/**
 * Transform array of ReportRow to Report[]
 */
export const transformReportRows = (rows: ReportRow[]): Report[] => {
  return rows.map(transformReportRow);
};

