import { supabase } from '../services/supabaseClient';
import type { Notification } from '../types';

/**
 * Fetch all notifications for a user
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    message: n.message,
    link: n.link,
    isRead: n.is_read,
    timestamp: n.created_at,
  }));
};

/**
 * Fetch unread notifications count for a user
 */
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

/**
 * Fetch a single notification by ID
 */
export const getNotificationById = async (id: string): Promise<Notification | null> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    id: data.id,
    userId: data.user_id,
    message: data.message,
    link: data.link,
    isRead: data.is_read,
    timestamp: data.created_at,
  };
};

/**
 * Mutation API Functions
 */

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
};
