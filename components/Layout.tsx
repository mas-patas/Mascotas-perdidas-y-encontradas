
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { FilterControls } from './FilterControls';
import { useAuth } from '../contexts/AuthContext';
import { Notification, PetStatus, AnimalType, PetSize } from '../types';

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
        <div className="min-h-screen bg-brand-light flex flex-col font-sans">
            {isGhosting && (
                 <div className="bg-yellow-400 text-yellow-900 text-center py-1 px-4 text-sm font-bold flex justify-between items-center">
                    <span>Modo Fantasma: Actuando como {currentUser?.email}</span>
                    <button onClick={stopGhosting} className="bg-white bg-opacity-50 hover:bg-opacity-75 rounded px-2 py-0.5 text-xs">Salir</button>
                </div>
            )}
            
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

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
