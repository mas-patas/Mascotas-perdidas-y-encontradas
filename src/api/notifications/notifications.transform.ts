/**
 * Notification transformations
 * 
 * Transforms NotificationRow (snake_case from database) to Notification (camelCase for UI)
 */

import type { NotificationRow, Notification } from '../../types';

/**
 * Transform NotificationRow to Notification (camelCase)
 */
export const transformNotificationRow = (row: NotificationRow): Notification => {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    link: row.link,
    isRead: row.is_read ?? false,
    timestamp: row.created_at || new Date().toISOString()
  };
};

/**
 * Transform array of NotificationRow to Notification[]
 */
export const transformNotificationRows = (rows: NotificationRow[]): Notification[] => {
  return rows.map(transformNotificationRow);
};
