import { supabase } from '../../services/supabaseClient';
import type { NotificationRow } from '../../types';

/**
 * Fetch all notifications for a user
 * Returns database rows with snake_case column names
 */
export const getNotifications = async (userId: string): Promise<NotificationRow[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!data) return [];
  
  return data;
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
 * Returns database row with snake_case column names
 */
export const getNotificationById = async (id: string): Promise<NotificationRow | null> => {
  const { data, error } = await supabase
    .from('notifications')
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

/**
 * Create a new notification
 */
export const createNotification = async (data: {
  id: string;
  userId: string;
  message: string;
  link?: NotificationRow['link'];
}): Promise<void> => {
  const { error } = await supabase.from('notifications').insert({
    id: data.id,
    user_id: data.userId,
    message: data.message,
    link: data.link || null,
    is_read: false,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
};
