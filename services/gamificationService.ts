
import { supabase } from './supabaseClient';
import { generateUUID } from '../utils/uuid';
import type { ActivityLog, LeaderboardEntry } from '../types';

export const POINTS_CONFIG = {
    REPORT_PET: 15,
    COMMENT_ADDED: 5,
    PET_REUNITED: 50,
    SHARE_POST: 10,
    DAILY_LOGIN: 5
};

export const logActivity = async (
    userId: string, 
    actionType: ActivityLog['actionType'], 
    points: number,
    details?: any
) => {
    try {
        const { error } = await supabase.from('user_activity_logs').insert({
            id: generateUUID(),
            user_id: userId,
            action_type: actionType,
            points: points,
            details: details,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.warn('Error logging activity, likely table missing or RLS:', error.message);
            // Fail silently to not disrupt main user flow, 
            // simply means gamification history won't update in this instance.
        }
    } catch (e) {
        console.error('Exception logging activity:', e);
    }
};

export const getUserHistory = async (userId: string): Promise<ActivityLog[]> => {
    const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }

    return data.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        actionType: log.action_type,
        points: log.points,
        createdAt: log.created_at,
        details: log.details
    }));
};

export const getWeeklyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const { data, error } = await supabase.rpc('get_weekly_leaderboard');
    
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
    
    return data || [];
};
