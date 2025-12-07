/**
 * Type definitions for Report API operations
 */

export interface CreateReportData {
  reporterEmail: string;
  reportedEmail?: string;
  type: string;
  targetId: string;
  reason: string;
  details: string;
  postSnapshot?: any;
}
