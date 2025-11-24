
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { PlusIcon, LogoutIcon, HomeIcon, UserIcon, ChevronDownIcon, ChatBubbleIcon, AdminIcon, MenuIcon, SupportIcon, BellIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { PetStatus, Notification, User } from '../types';
import { PET_STATUS, USER_ROLES } from '../constants';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
    onReportPet: (status: PetStatus) => void;
    onOpenAdoptionModal: () => void;
    onToggleSidebar: () => void;
    hasUnreadMessages: boolean;
    notifications: Notification[];
    onMarkNotificationAsRead: (notificationId: string) => void;
    onMarkAllNotificationsAsRead: () => void;
    onResetFilters: () => void;
}

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
    onReportPet, 
    onOpenAdoptionModal, 
    onToggleSidebar, 
    hasUnreadMessages,
    notifications,
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onResetFilters
}) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
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

    const handleHomeClick = () => {
        onResetFilters();
        navigate('/');
    };

    const navButtonClass = "flex items-center gap-2 px-2 sm:px-3 py-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative";
    const isMainView = ['/', '/campanas', '/mapa'].includes(location.pathname);

    return (
        <header className="bg-sidebar-dark text-white shadow-lg px-3 py-2 sm:p-4 flex justify-between items-center sticky top-0 z-20 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
                 {isMainView && (
                    <button onClick={onToggleSidebar} className="lg:hidden text-gray-200 hover:text-white" aria-label="Abrir menú de filtros">
                        <MenuIcon />
                    </button>
                 )}
                 <h1 className="text-xl sm:text-2xl font-bold tracking-wider cursor-pointer" onClick={handleHomeClick}>
                    PETS
                </h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
                <nav className="flex items-center gap-1 sm:gap-2">
                    {/* Reportar */}
                    <div className="relative" ref={reportDropdownRef}>
                        <button
                            onClick={() => setIsReportDropdownOpen(prev => !prev)}
                            className="flex items-center gap-1 sm:gap-2 bg-brand-secondary hover:bg-amber-400 text-brand-dark font-bold py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105 text-sm sm:text-base"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">Reportar</span>
                            <ChevronDownIcon />
                        </button>
                        {isReportDropdownOpen && (
                            <div className="absolute left-auto right-0 sm:right-auto sm:left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-30 ring-1 ring-black ring-opacity-5">
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
                    
                    {/* Inicio - Hidden on mobile since Logo does the same */}
                    <button onClick={handleHomeClick} className={`${navButtonClass} hidden sm:flex`} aria-label="Inicio">
                        <HomeIcon />
                        <span className="hidden md:inline">Inicio</span>
                    </button>
                    
                    {/* Messages (Visible if logged in) - Placed LEFT of Notifications */}
                    {currentUser && (
                        <button 
                            onClick={() => navigate('/mensajes')} 
                            className={navButtonClass} 
                            aria-label="Mensajes"
                        >
                            <ChatBubbleIcon />
                            {hasUnreadMessages && (
                                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-sidebar-dark transform translate-x-1/2 -translate-y-1/2"></span>
                            )}
                            <span className="hidden md:inline">Mensajes</span>
                        </button>
                    )}

                    {/* Notifications (Only if logged in) */}
                    {currentUser && (
                        <div className="relative" ref={notificationsRef}>
                            <button onClick={handleToggleNotifications} className={navButtonClass} aria-label="Notificaciones">
                                <BellIcon />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 sm:top-1 sm:right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border-2 border-sidebar-dark min-w-[1rem] h-4 sm:h-5 z-10">
                                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <NotificationDropdown 
                                    notifications={notifications}
                                    onMarkAsRead={onMarkNotificationAsRead}
                                    onClose={() => setIsNotificationsOpen(false)}
                                />
                            )}
                        </div>
                    )}

                    {/* Mi Cuenta / Login */}
                    {currentUser ? (
                        <div className="relative" ref={accountDropdownRef}>
                            <button 
                                onClick={() => setIsAccountDropdownOpen(prev => !prev)} 
                                className="flex items-center gap-2 text-gray-200 hover:text-white rounded-full p-1 hover:bg-white/10 transition-colors ml-1"
                                aria-label="Mi Cuenta"
                            >
                                <Avatar user={currentUser} />
                                <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">{currentUser?.username || 'Mi Cuenta'}</span>
                                <ChevronDownIcon />
                            </button>
                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-30 ring-1 ring-black ring-opacity-5 animate-fade-in">
                                    <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                                        <p className="text-sm font-bold text-gray-800">{currentUser.firstName} {currentUser.lastName}</p>
                                        <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                                    </div>
                                    
                                    <button
                                        onClick={() => { navigate('/perfil'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                    >
                                        <Avatar user={currentUser} size="sm" />
                                        <span>Mi Perfil</span>
                                    </button>
                                     <button
                                        onClick={() => { navigate('/soporte'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                    >
                                        <SupportIcon />
                                        <span>Soporte y Ayuda</span>
                                    </button>
                                    
                                    {/* Admin Link - Always inside dropdown, never in main bar */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => { navigate('/admin'); setIsAccountDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                        >
                                            <AdminIcon />
                                            <span>Panel Admin</span>
                                        </button>
                                    )}

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
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-gray-200 hover:text-white font-semibold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                        >
                            <UserIcon />
                            <span className="hidden sm:inline">Ingresar</span>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
};
