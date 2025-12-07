import { supabase } from '../../services/supabaseClient';
import type { ActivityLog, LeaderboardEntry } from '../../types';

/**
 * Fetch activity logs for a user
 */
export const getActivityLogs = async (userId: string, limit: number = 50): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    if (error.code === '42501' || error.message.includes('row-level security')) {
      console.error("⛔ RLS ERROR (Read): No se puede leer el historial. Ejecuta el script 'SUPABASE_SETUP.sql'.");
    } else {
      console.error('Error fetching history:', error.message);
    }
    return [];
  }
  
  if (!data) return [];
  
  return data.map((log: any) => ({
    id: log.id,
    userId: log.user_id,
    actionType: log.action_type,
    points: log.points,
    createdAt: log.created_at,
    details: log.details,
  }));
};

/**
 * Fetch weekly leaderboard
 */
export const getWeeklyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase.rpc('get_weekly_leaderboard');
    
    if (error) {
      console.warn('Error fetching leaderboard (RPC missing or DB timeout):', error.message);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error("Exception fetching leaderboard:", e);
    return [];
  }
};
