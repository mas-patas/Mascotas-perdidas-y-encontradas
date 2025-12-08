import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/types';

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (notificationId: string) => void;
    onClose: () => void;
}

/**
 * Format timestamp to relative time or locale string
 */
const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
};

const NotificationDropdown = ({ notifications, onMarkAsRead, onClose }: NotificationDropdownProps) => {
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        onMarkAsRead(notification.id);
        
        try {
            if (notification.link === 'support') {
                navigate('/soporte');
            } else if (notification.link === 'messages') {
                navigate('/mensajes');
            } else if (typeof notification.link === 'object' && notification.link !== null) {
                if (notification.link.type === 'campaign' && notification.link.id) {
                    navigate(`/campanas/${notification.link.id}`);
                } else if (notification.link.type === 'pet' && notification.link.id) {
                    navigate(`/mascota/${notification.link.id}`);
                } else if (notification.link.type === 'pet-renew' && notification.link.id) {
                    navigate(`/mascota/${notification.link.id}`);
                }
            }
        } catch (error) {
            console.error('Error navigating from notification:', error);
        }
        
        onClose();
    };

    const sortedNotifications = [...notifications].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
    });

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
                            <p className="text-xs text-gray-400 mt-1">{formatTimestamp(notification.timestamp)}</p>
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
