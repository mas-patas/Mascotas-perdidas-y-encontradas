import React from 'react';
import { Notification } from '../types';

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (notificationId: string) => void;
    onClose: () => void;
    onNavigate: (page: 'support') => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkAsRead, onClose, onNavigate }) => {
    
    const handleNotificationClick = (notification: Notification) => {
        onMarkAsRead(notification.id);
        if (notification.link === 'support') {
            onNavigate('support');
        }
        onClose();
    };

    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-30 ring-1 ring-black ring-opacity-5">
            <div className="p-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900">Notificaciones</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {sortedNotifications.length > 0 ? (
                    sortedNotifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-3 hover:bg-gray-100 cursor-pointer border-l-4 ${notification.isRead ? 'border-transparent' : 'border-brand-primary'}`}
                        >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleString('es-ES')}</p>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">No tienes notificaciones nuevas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;