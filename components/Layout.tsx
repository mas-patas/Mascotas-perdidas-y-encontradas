
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { FilterControls } from './FilterControls';
import { useAuth } from '../contexts/AuthContext';
import { Notification, PetStatus, AnimalType, PetSize } from '../types';
import NotificationPermissionBanner from './NotificationPermissionBanner';
import CompleteProfileModal from './CompleteProfileModal';

interface LayoutProps {
    onReportPet: (status: PetStatus) => void;
    onOpenAdoptionModal: () => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCloseSidebar: () => void;
    hasUnreadMessages: boolean;
    notifications: Notification[];
    onMarkNotificationAsRead: (id: string) => void;
    onMarkAllNotificationsAsRead: () => void;
    filters: any;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    onResetFilters: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    onReportPet,
    onOpenAdoptionModal,
    isSidebarOpen,
    onToggleSidebar,
    onCloseSidebar,
    hasUnreadMessages,
    notifications,
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    filters,
    setFilters,
    onResetFilters
}) => {
    const { isGhosting, stopGhosting, currentUser } = useAuth();

    return (
        <div className="h-screen overflow-hidden bg-brand-light flex flex-col font-sans">
            {isGhosting && (
                 <div className="bg-yellow-400 text-yellow-900 text-center py-1 px-4 text-sm font-bold flex justify-between items-center flex-shrink-0">
                    <span>Modo Fantasma: Actuando como {currentUser?.email}</span>
                    <button onClick={stopGhosting} className="bg-white bg-opacity-50 hover:bg-opacity-75 rounded px-2 py-0.5 text-xs">Salir</button>
                </div>
            )}
            
            {/* Push Notification Request Banner */}
            <div className="flex-shrink-0">
                <NotificationPermissionBanner />
            </div>
            
            {/* Incomplete Profile Prompt */}
            <CompleteProfileModal />
            
            <Header 
                onReportPet={onReportPet} 
                onOpenAdoptionModal={onOpenAdoptionModal}
                onToggleSidebar={onToggleSidebar}
                hasUnreadMessages={hasUnreadMessages}
                notifications={notifications}
                onMarkNotificationAsRead={onMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
                onResetFilters={onResetFilters}
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                <FilterControls 
                    filters={filters} 
                    setFilters={setFilters} 
                    isSidebarOpen={isSidebarOpen} 
                    onClose={onCloseSidebar}
                    onClearFilters={onResetFilters}
                />

                <main className="flex-1 overflow-y-auto flex flex-col scroll-smooth">
                    <div className="p-4 pt-2 lg:p-8 lg:pt-4 flex-grow">
                        <Outlet />
                    </div>
                    {/* Global Footer with Slogan - Updated to Light Purple */}
                    <footer className="bg-purple-50 text-purple-900 py-8 mt-auto border-t border-purple-100 flex-shrink-0">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                            <div className="max-w-lg">
                                <p className="font-serif italic text-purple-800 text-xs md:text-sm leading-relaxed opacity-80">
                                    "POR LOS QUE NUNCA VOLVIERON, POR LOS QUE NECESITAN VOLVER Y POR LOS QUE NUNCA DEBERIAN IRSE"
                                </p>
                            </div>
                            <div className="flex flex-col items-center md:items-end text-sm text-purple-700">
                                <p>&copy; {new Date().getFullYear()} Pets. Todos los derechos reservados.</p>
                                <div className="mt-2 flex gap-4">
                                    <Link to="/terminos" className="hover:underline">Términos y Condiciones</Link>
                                    <span>|</span>
                                    <p>Hecho con <span className="text-red-500">♥</span> en Perú</p>
                                </div>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};
