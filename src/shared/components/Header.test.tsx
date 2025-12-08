import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { PlusIcon, LogoutIcon, HomeIcon, UserIcon, ChevronDownIcon, ChatBubbleIcon, AdminIcon, MenuIcon, SupportIcon, BellIcon, HeartIcon, LightbulbIcon, DocumentIcon, TrophyIcon } from './icons';
import { useAuth } from '@/contexts/auth';
import { PetStatus, Notification, User } from '@/types';
import { PET_STATUS, USER_ROLES } from '@/constants';
import { NotificationDropdown } from '@/features/notifications';
import { useGamification } from '@/hooks/useGamification';

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
    // Hook call inside component is safe
    const { level } = useGamification(user?.id);
    
    if (!user) return null;
    
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-10 h-10 text-xl',
        lg: 'w-24 h-24 text-4xl',
    };

    // Dynamic border color based on level
    const borderClass = user.id ? `border-2 ${level.ring.replace('ring-', 'border-')}` : 'border-transparent';

    if (user.avatarUrl) {
        return (
            <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className={`${sizeClasses[size]} rounded-full object-cover ${borderClass}`} 
            />
        );
    }

    const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-sidebar-dark text-white flex items-center justify-center font-bold ${borderClass}`}>
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
    const { points, level, progress, nextLevel } = useGamification(currentUser?.id);
    
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
    
    const handleLogout = () => {
        setIsAccountDropdownOpen(false);
        navigate('/');
        logout();
    };

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

    // Updated Styling: Light gray background, dark gray text, Purple hover
    const navButtonClass = "flex items-center gap-2 px-2 sm:px-3 py-2 text-gray-600 hover:text-sidebar-dark hover:bg-purple-100 rounded-lg transition-all duration-200 relative font-medium";
    const isMainView = ['/', '/campanas', '/mapa', '/servicios', '/tips', '/terminos'].includes(location.pathname);

    return (
        <header className="bg-gray-100 text-gray-800 shadow-md px-3 py-2 sm:px-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-50 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
                 {isMainView && (
                    <button 
                        onClick={onToggleSidebar} 
                        className="lg:hidden text-gray-600 hover:text-sidebar-dark" 
                        aria-label="Abrir menú de filtros"
                        data-tour="mobile-menu-btn"
                    >
                        <MenuIcon />
                    </button>
                 )}
                 <h1 
                    className="text-xl sm:text-2xl font-extrabold tracking-wider cursor-pointer flex items-center gap-2 text-sidebar-dark hover:opacity-80 transition-opacity" 
                    onClick={handleHomeClick}
                 >
                    MAS PATAS
                </h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
                <nav className="flex items-center gap-1 sm:gap-2">
                    {/* Reportar */}
                    <div className="relative" ref={reportDropdownRef} data-tour="header-report-btn">
                        <button
                            onClick={() => setIsReportDropdownOpen(prev => !prev)}
                            className="flex items-center gap-1 sm:gap-2 bg-brand-secondary hover:bg-amber-400 text-brand-dark font-bold py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105 text-sm sm:text-base"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">Reportar</span>
                            <ChevronDownIcon />
                        </button>
                        {isReportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 border border-gray-100 origin-top-right">
                                <button
                                    onClick={() => handleReportSelection(PET_STATUS.PERDIDO)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark"
                                >
                                    Reportar Mascota Perdida
                                </button>
                                <button
                                    onClick={() => handleReportSelection(PET_STATUS.ENCONTRADO)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark"
                                >
                                    Reportar Mascota Encontrada
                                </button>
                                <button
                                    onClick={() => handleReportSelection(PET_STATUS.AVISTADO)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark"
                                >
                                    Reportar Mascota Avistada
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                    onClick={() => {
                                        onOpenAdoptionModal();
                                        setIsReportDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-medium"
                                >
                                    Publicar Mascota en Adopción
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Tips Link - Desktop Only (visible in sidebar on mobile) */}
                    <button onClick={() => navigate('/tips')} className={`${navButtonClass} hidden xl:flex`} aria-label="Consejos">
                        <LightbulbIcon className="h-5 w-5" />
                        <span>Tips</span>
                    </button>

                    {/* Nosotros Link - Always visible, text visible on tablet (md) and up */}
                    <button onClick={() => navigate('/nosotros')} className={navButtonClass} aria-label="Quiénes Somos">
                        <HeartIcon className="h-5 w-5" />
                        <span className="hidden md:inline">Nosotros</span>
                    </button>
                    
                    {/* Messages (Visible if logged in) */}
                    {currentUser && (
                        <button 
                            onClick={() => navigate('/mensajes')} 
                            className={navButtonClass} 
                            aria-label="Mensajes"
                            data-tour="header-messages-btn"
                        >
                            <ChatBubbleIcon />
                            {hasUnreadMessages && (
                                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/2 -translate-y-1/2"></span>
                            )}
                            <span className="hidden xl:inline">Mensajes</span>
                        </button>
                    )}

                    {/* Notifications (Only if logged in) */}
                    {currentUser && (
                        <div className="relative" ref={notificationsRef} data-tour="header-notifications-btn">
                            <button onClick={handleToggleNotifications} className={navButtonClass} aria-label="Notificaciones">
                                <BellIcon />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 sm:top-1 sm:right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border-2 border-white min-w-[1rem] h-4 sm:h-5 z-10">
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
                        <div className="relative" ref={accountDropdownRef} data-tour="header-account-btn">
                            <button 
                                onClick={() => setIsAccountDropdownOpen(prev => !prev)} 
                                className="flex items-center gap-2 text-gray-600 hover:text-sidebar-dark rounded-full p-1 hover:bg-purple-100 transition-colors ml-1"
                                aria-label="Mi Cuenta"
                            >
                                <Avatar user={currentUser} />
                                <span className="hidden lg:inline text-sm font-bold max-w-[100px] truncate">{currentUser?.username || 'Mi Cuenta'}</span>
                                <ChevronDownIcon />
                            </button>
                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-30 ring-1 ring-black ring-opacity-5 animate-fade-in border border-gray-100 overflow-hidden">
                                    {/* Gamification Mini-Header */}
                                    <div className={`px-4 py-3 bg-gradient-to-r ${level.gradient} text-white`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider">{level.title}</span>
                                            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{points} pts</span>
                                        </div>
                                        <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-white h-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        {nextLevel && <p className="text-[10px] mt-1 text-white/80 text-right">Próximo: {nextLevel.name}</p>}
                                    </div>

                                    <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                                        <p className="text-sm font-bold text-gray-800">{currentUser.firstName} {currentUser.lastName}</p>
                                        <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                                    </div>
                                    
                                    <button
                                        onClick={() => { navigate('/perfil'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark flex items-center gap-3"
                                    >
                                        <Avatar user={currentUser} size="sm" />
                                        <span>Mi Perfil</span>
                                    </button>
                                     <button
                                        onClick={() => { navigate('/soporte'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark flex items-center gap-3"
                                    >
                                        <SupportIcon />
                                        <span>Soporte y Ayuda</span>
                                    </button>
                                    
                                    {/* Admin Link */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => { navigate('/admin'); setIsAccountDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark flex items-center gap-3"
                                        >
                                            <AdminIcon />
                                            <span>Panel Admin</span>
                                        </button>
                                    )}

                                    <div className="border-t border-gray-100 my-1"></div>
                                    
                                    <button
                                        onClick={() => { navigate('/terminos'); setIsAccountDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-sidebar-dark flex items-center gap-3"
                                    >
                                        <DocumentIcon className="h-4 w-4" />
                                        <span>Términos y Condiciones</span>
                                    </button>

                                    <button
                                        onClick={handleLogout}
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
                            className="flex items-center gap-2 text-gray-600 hover:text-sidebar-dark hover:bg-purple-100 font-semibold px-3 py-2 rounded-lg transition-colors text-sm"
                            data-tour="header-login-btn"
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