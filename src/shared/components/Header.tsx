
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { PlusIcon, LogoutIcon, HomeIcon, UserIcon, ChevronDownIcon, ChatBubbleIcon, AdminIcon, MenuIcon, SupportIcon, BellIcon, HeartIcon, LightbulbIcon, DocumentIcon, TrophyIcon } from './icons';
import { useAuth } from '@/contexts/auth';
import type { PetStatus, Notification, User } from '@/types';
import { PET_STATUS, USER_ROLES } from '@/constants';
import { NotificationDropdown } from '@/features/notifications';
import { useGamification } from '@/hooks/useGamification';
import { getLevelFromPoints } from '@/features/gamification';
import { ChihuahuaIcon, PugIcon, BeagleIcon, BorderCollieIcon, GoldenIcon, GreatDaneIcon } from './BreedBadges';

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
    const { level } = useGamification(user?.id);
    
    if (!user) return null;
    
    const sizeClasses = {
        sm: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
        md: 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-xl',
        lg: 'w-24 h-24 text-4xl',
    };

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target as Node)) setIsReportDropdownOpen(false);
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) setIsAccountDropdownOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
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

    const navButtonClass = "flex items-center gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-brand-primary hover:bg-gray-50 rounded-full transition-all duration-200 relative font-medium text-xs sm:text-sm";
    const isMainView = ['/', '/campanas', '/mapa', '/servicios', '/tips', '/terminos'].includes(location.pathname);

    return (
        <header className="bg-white text-gray-800 shadow-sm px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 sticky top-0 z-50 h-14 sm:h-16 md:h-20">
            <div className="max-w-[1920px] mx-auto flex justify-between items-center h-full gap-1 sm:gap-2">
                
                {/* LEFT: Logo & Home */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1 min-w-0">
                     <button 
                         onClick={onToggleSidebar} 
                         className="lg:hidden text-gray-600 hover:text-brand-primary p-1 flex-shrink-0" 
                         aria-label="Abrir menú de navegación"
                     >
                         <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                     </button>
                     <div 
                        className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-0.5 sm:gap-1 md:gap-2 text-brand-dark hover:opacity-80 transition-opacity mr-0.5 sm:mr-1 md:mr-2 lg:mr-4 flex-shrink-0" 
                        onClick={handleHomeClick}
                     >
                        <img 
                            src="/assets/images/logo.png" 
                            alt="Mas Patas Logo" 
                            className="object-contain flex-shrink-0"
                            style={{ 
                                height: '85%',
                                width: 'auto',
                                maxHeight: '4rem',
                                minHeight: '2.5rem'
                            }}
                            onError={(e) => {
                                // Fallback si la imagen no existe
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <span className="hidden sm:inline whitespace-nowrap">MAS PATAS</span><span className="hidden sm:inline text-[#FF4F4F]">.</span>
                    </div>
                    
                    <button onClick={handleHomeClick} className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-brand-primary font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 transition-colors">
                        <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="hidden sm:inline">Inicio</span>
                    </button>
                </div>
                
                {/* CENTER: Report Button (Primary Call to Action) */}
                <div className="relative flex-shrink-0" ref={reportDropdownRef} data-tour="header-report-btn">
                    <button
                        onClick={() => setIsReportDropdownOpen(prev => !prev)}
                        className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#FF4F4F] to-red-600 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-4 md:py-3 md:px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all transform text-[9px] sm:text-xs md:text-sm uppercase tracking-wider whitespace-nowrap"
                    >
                        <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        <span>REPORTAR</span>
                    </button>
                    {isReportDropdownOpen && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 sm:mt-3 w-[calc(100vw-2rem)] max-w-[280px] sm:w-72 bg-white rounded-xl shadow-2xl py-2 z-50 ring-1 ring-black ring-opacity-5 animate-fade-in-up origin-top overflow-hidden">
                            <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider text-center">¿Qué deseas reportar?</div>
                            <button onClick={() => handleReportSelection(PET_STATUS.PERDIDO)} className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 font-bold flex items-center gap-2 transition-all">
                                🔴 Perdí mi mascota
                            </button>
                            <button onClick={() => handleReportSelection(PET_STATUS.ENCONTRADO)} className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 font-bold flex items-center gap-2 transition-all">
                                🟢 Encontré una mascota
                            </button>
                            <button onClick={() => handleReportSelection(PET_STATUS.AVISTADO)} className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-bold flex items-center gap-2 transition-all">
                                🔵 Vi una mascota perdida
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={() => { onOpenAdoptionModal(); setIsReportDropdownOpen(false); }} className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-status-adoption hover:bg-status-adoption/10 font-bold flex items-center gap-2 transition-all">
                                💜 Dar en adopción
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: Navigation & Profile */}
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-1 justify-end min-w-0">
                    <button onClick={() => navigate('/tips')} className={`${navButtonClass} hidden xl:flex`} aria-label="Tips y Consejos">
                        <LightbulbIcon className="h-5 w-5" /> Tips
                    </button>

                    <button onClick={() => navigate('/nosotros')} className={`${navButtonClass} px-1 sm:px-2`} aria-label="Quiénes Somos">
                        <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden lg:inline">Nosotros</span>
                    </button>
                    
                    {currentUser && (
                        <button 
                            onClick={() => navigate('/mensajes')} 
                            className={`${navButtonClass} px-1 sm:px-2`} 
                            aria-label="Mensajes"
                            data-tour="header-messages-btn"
                        >
                            <ChatBubbleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            {hasUnreadMessages && (
                                <span className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-500 ring-1 sm:ring-2 ring-white"></span>
                            )}
                        </button>
                    )}

                    {currentUser && (
                        <div className="relative" ref={notificationsRef} data-tour="header-notifications-btn">
                            <button onClick={handleToggleNotifications} className={`${navButtonClass} px-1 sm:px-2`} aria-label="Notificaciones">
                                <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 sm:top-1 sm:right-1 inline-flex items-center justify-center px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-1 sm:border-2 border-white min-w-[0.875rem] sm:min-w-[1rem]">
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

                    {currentUser ? (
                        <div className="relative ml-1 sm:ml-2 flex-shrink-0" ref={accountDropdownRef} data-tour="header-account-btn">
                            <button 
                                onClick={() => setIsAccountDropdownOpen(prev => !prev)} 
                                className="flex items-center gap-1 sm:gap-2 hover:bg-gray-100 p-0.5 sm:p-1 rounded-full transition-colors border border-transparent hover:border-gray-200"
                                aria-label="Mi Cuenta"
                            >
                                <Avatar user={currentUser} size="sm" />
                                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hidden sm:block" />
                            </button>
                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 mt-2 sm:mt-3 w-[calc(100vw-2rem)] max-w-[240px] sm:w-64 bg-white rounded-xl shadow-2xl py-1 z-30 ring-1 ring-black ring-opacity-5 animate-fade-in border border-gray-100 overflow-hidden">
                                    <div className={`px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r ${level.gradient} text-white`}>
                                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                            <div className="flex-shrink-0">
                                                {(() => {
                                                    const BadgeIcon = level.icon;
                                                    return (
                                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${level.solidBg} ring-2 ring-white/80 shadow-lg`}>
                                                            <BadgeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md filter brightness-125" />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-tight truncate">{level.name}</span>
                                                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide opacity-90 whitespace-nowrap">{level.title}</span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">{points} pts</span>
                                        </div>
                                        <div className="w-full bg-black/20 h-1 sm:h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-white h-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => { navigate('/perfil'); setIsAccountDropdownOpen(false); }} className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary flex items-center gap-2 sm:gap-3 font-medium"><UserIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Mi Perfil</button>
                                    <button onClick={() => { navigate('/soporte'); setIsAccountDropdownOpen(false); }} className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary flex items-center gap-2 sm:gap-3 font-medium"><SupportIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Soporte</button>
                                    {isAdmin && <button onClick={() => { navigate('/admin'); setIsAccountDropdownOpen(false); }} className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary flex items-center gap-2 sm:gap-3 font-medium"><AdminIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Panel Admin</button>}
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button onClick={handleLogout} className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 sm:gap-3 font-medium"><LogoutIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Salir</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="ml-1 sm:ml-2 flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-brand-primary font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-300 hover:border-brand-primary transition-all text-xs sm:text-sm flex-shrink-0"
                            data-tour="header-login-btn"
                        >
                            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Ingresar</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};
