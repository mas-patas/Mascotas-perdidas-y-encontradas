
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
            // Check specifically for RLS errors to guide the developer/user
            if (error.code === '42501' || error.message.includes('row-level security')) {
                console.error("⛔ RLS ERROR: No tienes permisos para escribir en 'user_activity_logs'. Ejecuta el script 'SUPABASE_SETUP.sql' en tu panel de Supabase para corregir esto.");
            } else {
                console.warn('Error logging activity:', error.message);
            }
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
        if (error.code === '42501' || error.message.includes('row-level security')) {
             console.error("⛔ RLS ERROR (Read): No se puede leer el historial. Ejecuta el script 'SUPABASE_SETUP.sql'.");
        } else {
             console.error('Error fetching history:', error.message);
        }
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
    try {
        // RPC: Remote Procedure Call. Esto requiere que la función 'get_weekly_leaderboard'
        // exista en la base de datos de Supabase.
        const { data, error } = await supabase.rpc('get_weekly_leaderboard');
        
        if (error) {
            // Si la función no existe, o hay un error de conexión, devolvemos array vacío
            // para no romper la interfaz de usuario.
            console.warn('Error fetching leaderboard (RPC missing or DB timeout):', error.message);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error("Exception fetching leaderboard:", e);
        return [];
    }
};
