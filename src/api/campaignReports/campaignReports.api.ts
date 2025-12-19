import { supabase } from '../../services/supabaseClient';

export interface CampaignReportRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  address: string;
  social_link: string;
  image_url: string | null;
  district: string;
  province: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface CreateCampaignReportData {
  user_id?: string | null;
  user_email?: string | null;
  address: string;
  social_link: string;
  image_url?: string | null;
  district: string;
  province: string;
  department: string;
}

/**
 * Fetch all campaign reports (admin only)
 */
export const getCampaignReports = async (): Promise<CampaignReportRow[]> => {
  try {
    // First, get the reports
    const { data: reports, error: reportsError } = await (supabase as any)
      .from('campaign_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reportsError) {
      console.error('Error fetching campaign reports:', reportsError);
      throw reportsError;
    }
    
    if (!reports || reports.length === 0) return [];
    
    // Get unique user IDs
    const userIds = reports
      .map((r: any) => r.user_id)
      .filter((id: string | null): id is string => id !== null && id !== undefined);
    
    // Fetch user profiles if there are any user IDs
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, username, first_name, last_name')
        .in('id', userIds);
      
      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }
    
    // Map reports with user data
    return reports.map((report: any) => ({
      ...report,
      user: report.user_id && profilesMap[report.user_id] ? {
        id: profilesMap[report.user_id].id,
        email: profilesMap[report.user_id].email,
        username: profilesMap[report.user_id].username,
        first_name: profilesMap[report.user_id].first_name,
        last_name: profilesMap[report.user_id].last_name,
      } : null,
    }));
  } catch (error) {
    console.error('Error in getCampaignReports:', error);
    // If table doesn't exist, return empty array
    if ((error as any)?.code === '42P01' || (error as any)?.message?.includes('does not exist')) {
      console.warn('campaign_reports table does not exist yet. Please run the migration.');
      return [];
    }
    throw error;
  }
};

/**
 * Create a new campaign report
 */
export const createCampaignReport = async (data: CreateCampaignReportData): Promise<string> => {
  const { data: inserted, error } = await (supabase as any)
    .from('campaign_reports')
    .insert({
      user_id: data.user_id,
      user_email: data.user_email,
      address: data.address,
      social_link: data.social_link,
      image_url: data.image_url,
      district: data.district,
      province: data.province,
      department: data.department,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) throw error;
  if (!inserted) throw new Error('Failed to create campaign report');
  
  return inserted.id;
};

/**
 * Update campaign report status (admin only)
 */
export const updateCampaignReportStatus = async (
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  const { error } = await (supabase as any)
    .from('campaign_reports')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Delete a campaign report (admin only)
 */
export const deleteCampaignReport = async (id: string): Promise<void> => {
  const { error } = await (supabase as any)
    .from('campaign_reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

