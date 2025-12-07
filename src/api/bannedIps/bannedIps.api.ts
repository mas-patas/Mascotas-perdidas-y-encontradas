import { supabase } from '../../services/supabaseClient';
import type { BannedIP } from '../../types';

/**
 * Fetch all banned IPs
 */
export const getBannedIps = async (): Promise<BannedIP[]> => {
  const { data, error } = await supabase
    .from('banned_ips')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((b: any) => ({
    id: b.id,
    ipAddress: b.ip_address,
    reason: b.reason,
    createdAt: b.created_at,
  }));
};

/**
 * Fetch a single banned IP by ID
 */
export const getBannedIpById = async (id: string): Promise<BannedIP | null> => {
  const { data, error } = await supabase
    .from('banned_ips')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    ipAddress: data.ip_address,
    reason: data.reason,
    createdAt: data.created_at,
  };
};
