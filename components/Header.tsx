
import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, LogoutIcon, HomeIcon, UserIcon, ChevronDownIcon, ChatBubbleIcon, AdminIcon, MenuIcon, SupportIcon, BellIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { PetStatus, Notification, User } from '../types';
import { PET_STATUS, USER_ROLES } from '../constants';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
    currentPage: 'list' | 'profile' | 'messages' | 'chat' | 'admin' | 'support' | 'campaigns' | 'map';
    onReportPet: (status: PetStatus) => void;
    onOpenAdoptionModal: () => void;
    onNavigate: (path: string) => void;
    onToggleSidebar: () => void;
    hasUnreadMessages: boolean;
    notifications: Notification[];
    onMarkNotificationAsRead: (notificationId: string) => void;
    onMarkAllNotificationsAsRead: () => void;
}

// A new simple Avatar component
const Avatar: React.FC<{ user: User | null, size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
    if (!user) return null;
    
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-10 h-10 text-xl',
        lg: 'w-24 h-24 text-4xl',
    };

    if (user.avatarUrl) {
        return (
            <img src={user.avatarUrl} alt="Avatar" className={`${sizeClasses[size]} rounded-full object-cover`} />
        );
    }

    const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-brand-primary text-white flex items-center justify-center font-bold`}>
            {initial}
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ 
    currentPage,
    onReportPet, 
    onOpenAdoptionModal, 
    onNavigate,
    onToggleSidebar, 
    hasUnreadMessages,
    notifications,
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead
}) => {
    const { currentUser, logout } = useAuth();
    const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const reportDropdownRef = useRef<HTMLDivElement>(null);
    const accountDropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    const useOutsideAlerter = (ref: React.RefObject<HTMLDivElement>, close: () => void) => {
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    close();
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [ref, close]);
    }

    useOutsideAlerter(reportDropdownRef, () => setIsReportDropdownOpen(false));
    useOutsideAlerter(accountDropdownRef, () => setIsAccountDropdownOpen(false));
    useOutsideAlerter(notificationsRef, () => setIsNotificationsOpen(false));
    
    const handleReportSelection = (status: PetStatus) => {
        onReportPet(status);
        setIsReportDropdownOpen(false);
    };

    const handleToggleNotifications = () => {
        setIsNotificationsOpen(prev => {
            const willBeOpen = !prev;
            if (willBeOpen) {
                onMarkAllNotificationsAsRead();
            }
            return willBeOpen;
        });
    };

    const navButtonClass = "flex items-center gap-2 px-3 py-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors";

    return (
        <header className="bg-sidebar-dark text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-20 flex-shrink-0">
            <div className="flex items-center gap-4">
                 {(currentPage === 'list' || currentPage === 'campaigns' || currentPage === 'map') && (
                    <button onClick={onToggleSidebar} className="lg:hidden text-gray-200 hover:text-white" aria-label="Abrir menú de filtros">
                        <MenuIcon />
                    </button>
                 )}
                 <h1 className="text-2xl font-bold tracking-wider cursor-pointer" onClick={() => onNavigate('/')}>
                    PETS
                </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <nav className="flex items-center gap-1 sm:gap-4">
                    {/* Reportar */}
                    <div className="relative" ref={reportDropdownRef}>
                        <button
                            onClick={() => setIsReportDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 bg-brand-secondary hover:bg-amber-400 text-brand-dark font-bold py-2 px-3 sm:px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">Reportar</span>
                            <ChevronDownIcon />
                        </button>
                        {isReportDropdownOpen && (
                            <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-30 ring-1 ring-black ring-opacity-5">
                                <button
                                    onClick={() => handleReportSelection(PET_STATUS.PERDIDO)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Reportar Mascota Perdida
                                </button>
                                <button
                                    onClick={() => handleReportSelection(PET_STATUS.ENCONTRADO)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Reportar Mascota Encontrada
                                </button>
                                <button
                                    onClick={() => handleReportSelection(PET_STATUS.AVISTADO)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Reportar Mascota Avistada
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                    onClick={() => {
                                        onOpenAdoptionModal();
                                        setIsReportDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                                >
                                    Publicar Mascota en Adopción
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Inicio */}
                    <button onClick={() => onNavigate('/')} className={navButtonClass} aria-label="Inicio">
                        <HomeIcon />
                        <span className="hidden md:inline">Inicio</span>
                    </button>
                    
                    {/* Admin */}
                    {isAdmin && (
                        <button onClick={() => onNavigate('/admin')} className={navButtonClass} aria-label="Admin">
                            <AdminIcon />
                             <span className="hidden md:inline">Admin</span>
                        </button>
                    )}

                    {/* Notifications (Only if logged in) */}
                    {currentUser && (
                        <div className="relative" ref={notificationsRef}>
                            <button onClick={handleToggleNotifications} className={`${navButtonClass} relative`} aria-label="Notificaciones">
                                <BellIcon />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-1 right-1 h-4 w-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                                        {unreadNotificationsCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <NotificationDropdown 
                                    notifications={notifications}
                                    onMarkAsRead={onMarkNotificationAsRead}
                                    onClose={() => setIsNotificationsOpen(false)}
                                    onNavigate={ (link) => {
                                        if(link === 'support') onNavigate('/soporte');
                                        else if (link === 'messages') onNavigate('/mensajes');
                                        else if (typeof link === 'object' && link.type === 'campaign') {
                                            onNavigate(`/campanas/${link.id}`);
                                        } else if (typeof link === 'object' && link.type === 'pet') {
                                            onNavigate(`/mascota/${link.id}`);
                                        }
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* Mi Cuenta / Login */}
                    {currentUser ? (
                        <div className="relative" ref={accountDropdownRef}>
                            <button 
                                onClick={() => setIsAccountDropdownOpen(prev => !prev)} 
                                className="flex items-center gap-2 text-gray-200 hover:text-white rounded-full p-1 hover:bg-white/10 transition-colors"
                                aria-label="Mi Cuenta"
                            >
                                <Avatar user={currentUser} />
                                <span className="hidden md:inline">{currentUser?.username || 'Mi Cuenta'}</span>
                                <ChevronDownIcon />
                            </button>
                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 ring-1 ring-black ring-opacity-5">
                                    <button
                                        onClick={() => { onNavigate('/perfil'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                    >
                                        <Avatar user={currentUser} size="sm" />
                                        <span>Mi Perfil</span>
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('/mensajes'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 relative"
                                    >
                                        <ChatBubbleIcon />
                                        <span>Mensajes</span>
                                        {hasUnreadMessages && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                                        )}
                                    </button>
                                     <button
                                        onClick={() => { onNavigate('/soporte'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                    >
                                        <SupportIcon />
                                        <span>Soporte y Ayuda</span>
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={() => { logout(); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                    >
                                        <LogoutIcon />
                                        <span>Salir</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => onNavigate('/login')}
                            className="flex items-center gap-2 text-gray-200 hover:text-white font-semibold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                        >
                            <UserIcon />
                            <span className="hidden sm:inline">Ingresar / Registrarse</span>
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};
