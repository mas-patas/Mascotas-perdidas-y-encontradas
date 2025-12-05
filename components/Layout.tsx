
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { FilterControls } from './FilterControls';
import { useAuth } from '../contexts/AuthContext';
import { PetStatus } from '../types';
import NotificationPermissionBanner from './NotificationPermissionBanner';
import CompleteProfileModal from './CompleteProfileModal';
import { useNotifications } from '../hooks/useCommunication';
import { supabase } from '../services/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

interface LayoutProps {
    onReportPet: (status: PetStatus) => void;
    onOpenAdoptionModal: () => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCloseSidebar: () => void;
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
    filters,
    setFilters,
    onResetFilters
}) => {
    const { isGhosting, stopGhosting, currentUser } = useAuth();
    const { data: notifications = [] } = useNotifications();
    const queryClient = useQueryClient();

    // Helper logic from previous App.tsx but simplified since data is local
    const hasUnreadMessages = false; // Chat logic moved to Chat/Messages components, header indicator might need a small separate hook or context if crucial

    const handleMarkNotificationAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleMarkAllNotificationsAsRead = async () => {
        if (!currentUser) return;
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return (
        <div className="min-h-screen bg-brand-light flex flex-col font-sans">
            {isGhosting && (
                 <div className="bg-yellow-400 text-yellow-900 text-center py-1 px-4 text-sm font-bold flex justify-between items-center">
                    <span>Modo Fantasma: Actuando como {currentUser?.email}</span>
                    <button onClick={stopGhosting} className="bg-white bg-opacity-50 hover:bg-opacity-75 rounded px-2 py-0.5 text-xs">Salir</button>
                </div>
            )}
            
            <NotificationPermissionBanner />
            <CompleteProfileModal />
            
            <Header 
                onReportPet={onReportPet} 
                onOpenAdoptionModal={onOpenAdoptionModal}
                onToggleSidebar={onToggleSidebar}
                hasUnreadMessages={hasUnreadMessages} // TODO: Separate hook for unread count if needed globally
                notifications={notifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
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
                    <div className="p-4 lg:p-8 flex-grow">
                        <Outlet />
                    </div>
                    <footer className="bg-purple-50 text-purple-900 py-8 mt-auto border-t border-purple-100">
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
