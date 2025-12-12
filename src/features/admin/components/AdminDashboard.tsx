import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserRole, Pet, Chat, PetStatus, AnimalType, UserStatus, Report, ReportStatus as ReportStatusType, ReportPostSnapshot, SupportTicketRow, SupportTicketStatus, SupportTicketCategory, Campaign, BannedIP } from '@/types';
import { USER_ROLES, PET_STATUS, ANIMAL_TYPES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES } from '@/constants';
import { UsersIcon, PetIcon, FlagIcon, SupportIcon, MegaphoneIcon, TrashIcon, EditIcon, EyeIcon, BellIcon, LocationMarkerIcon, XCircleIcon, PlusIcon, StoreIcon, CheckCircleIcon, CalendarIcon } from '@/shared/components/icons';
import { ReportDetailModal } from '@/features/reports';
import { SupportTicketModal } from '@/features/support';
import { CampaignFormModal } from '@/features/campaigns';
import { ConfirmationModal, InfoModal } from '@/shared';
import { useAppData } from '@/hooks/useAppData';
import { AdminBusinessPanel } from '@/features/admin';
import { useAdminStats, useCreateBannedIp, useDeleteBannedIp, useDeleteReport, useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/api';
import { supabase } from '@/services/supabaseClient';
import BannerManagementModal from './BannerManagementModal';

interface AdminDashboardProps {
    onBack: () => void;
    users: User[];
    onViewUser: (user: User) => void;
    pets: Pet[];
    chats: Chat[];
    reports: Report[];
    supportTickets: SupportTicketRow[];
    onUpdateReportStatus: (reportId: string, status: ReportStatusType) => void;
    onDeletePet: (petId: string) => void;
    onUpdateSupportTicket: (ticket: SupportTicketRow) => void;
    isAiSearchEnabled: boolean;
    onToggleAiSearch: () => void;
    isLocationAlertsEnabled: boolean;
    onToggleLocationAlerts: () => void;
    locationAlertRadius: number;
    onSetLocationAlertRadius: (radius: number) => void;
    campaigns: Campaign[];
    onSaveCampaign: (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => void;
    onDeleteCampaign: (campaignId: string) => void;
    onNavigate: (path: string) => void;
    onDeleteComment: (commentId: string) => Promise<void>;
}

const formatDateSafe = (dateString: string) => {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('es-ES');
    } catch {
        return 'N/A';
    }
};

const formatDateTimeSafe = (dateString: string) => {
    try {
         const d = new Date(dateString);
         if (isNaN(d.getTime())) return 'N/A';
         const date = d.toLocaleDateString('es-ES');
         const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
         return `${date} ${time}`;
    } catch {
        return 'N/A';
    }
};

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, loading }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4 border border-gray-100">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            )}
        </div>
    </div>
);

const SimpleBarChart: React.FC<{ data: { label: string, value: number }[], title: string, loading?: boolean }> = ({ data, title, loading }) => {
    if (loading) return <div className="bg-white p-6 rounded-lg shadow-md h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>;

    const dataMax = Math.max(...data.map(d => d.value), 0);
    const maxValue = dataMax > 0 ? Math.ceil(dataMax / 5) * 5 : 5;

    const numTicks = 5;
    const ticks = Array.from({ length: numTicks + 1 }, (_, i) => {
        const value = (maxValue / numTicks) * i;
        return Math.round(value);
    }).reverse();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <div className="min-w-[700px] flex">
                    <div className="flex flex-col justify-between text-xs text-gray-500 pr-4 py-3" style={{ height: '220px' }}>
                        {ticks.map(tick => <span key={tick}>{tick}</span>)}
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 relative border-l border-b border-gray-300">
                            {ticks.slice(0, -1).map(tick => (
                                <div
                                    key={`grid-${tick}`}
                                    className="absolute w-full border-t border-gray-200 border-dashed"
                                    style={{ bottom: `calc(${(tick / maxValue) * 100}% - 1px)` }}
                                ></div>
                            ))}
                            <div className="h-full flex justify-around items-end space-x-2 px-1 pt-5">
                                {data.map(({ label, value }) => (
                                    <div key={label} className="flex-1 min-w-[20px] h-full flex items-end group relative">
                                        <div
                                            className="w-full bg-brand-secondary hover:bg-amber-400 transition-all rounded-t-sm relative"
                                            style={{ height: `${(value / maxValue) * 100}%` }}
                                        >
                                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow-sm border">
                                                {value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-around items-start space-x-2 px-1 pt-2 border-l border-transparent">
                             {data.map(({ label }) => (
                                <div key={label} className="flex-1 min-w-[20px]">
                                    <p className="text-[10px] text-gray-500 text-center truncate">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PaginationControls: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; totalItems: number }> = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">
                Mostrando página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span> ({totalItems} total)
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    onBack, users, onViewUser, pets: propPets, chats, reports, supportTickets, 
    onUpdateReportStatus, onDeletePet, onUpdateSupportTicket, 
    isAiSearchEnabled, onToggleAiSearch, 
    isLocationAlertsEnabled, onToggleLocationAlerts, locationAlertRadius, onSetLocationAlertRadius,
    campaigns, onSaveCampaign, onDeleteCampaign, onNavigate, onDeleteComment 
}) => {
    const queryClient = useQueryClient();
    const { bannedIps } = useAppData();
    const deleteReport = useDeleteReport();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'support' | 'campaigns' | 'settings' | 'security' | 'businesses'>('dashboard');
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ isOpen: false, message: '', type: 'info' });
    const [statusFilter, setStatusFilter] = useState<PetStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<AnimalType | 'all'>('all');
    const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '1y' | 'all'>('30d');
    
    // Modal States
    const [viewingReportDetail, setViewingReportDetail] = useState<{ report: Report; pet: Pet | ReportPostSnapshot; isDeleted: boolean } | null>(null);
    const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

    // Security - Banned IPs
    const [newIpAddress, setNewIpAddress] = useState('');
    const [banReason, setBanReason] = useState('');
    const [isAddingIp, setIsAddingIp] = useState(false);

    // Pagination & Filters
    const [ticketStatusFilter, setTicketStatusFilter] = useState<SupportTicketStatus | 'all'>('all');
    const [ticketCategoryFilter, setTicketCategoryFilter] = useState<SupportTicketCategory | 'all'>('all');
    const [campaignFilter, setCampaignFilter] = useState<'all' | 'upcoming' | 'expired'>('all');
    
    const [campaignPage, setCampaignPage] = useState(1);
    const CAMPAIGNS_PER_PAGE = 5;
    const [reportsPage, setReportsPage] = useState(1);
    const REPORTS_PER_PAGE = 10;
    const [supportPage, setSupportPage] = useState(1);
    const SUPPORT_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1); // Users Page
    const ITEMS_PER_PAGE = 10;

    // Banner Management Hooks (must be at component level)
    const { data: banners = [], isLoading: bannersLoading } = useBanners();
    const createBanner = useCreateBanner();
    const deleteBanner = useDeleteBanner();
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

    // Advanced User Filters
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userFilterStatus, setUserFilterStatus] = useState<UserStatus | 'all'>('all');
    const [userFilterDateStart, setUserFilterDateStart] = useState('');
    const [userFilterDateEnd, setUserFilterDateEnd] = useState('');

    // Bulk Actions (Reports)
    const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [reportSearchQuery, setReportSearchQuery] = useState('');

    // --- REAL METRICS FETCHING ---
    // Using dedicated hook for admin stats
    const { data: adminStats, isLoading: statsLoading } = useAdminStats(dateRangeFilter);

    // Reset pagination on filter change
    useEffect(() => { setReportsPage(1); }, [reportSearchQuery]);
    useEffect(() => { setSupportPage(1); }, [ticketStatusFilter, ticketCategoryFilter]);
    useEffect(() => { setCampaignPage(1); }, [campaignFilter]);
    useEffect(() => { setCurrentPage(1); }, [userSearchQuery, userFilterStatus, userFilterDateStart, userFilterDateEnd]);

    // FILTERED USERS LOGIC
    const filteredUsers = useMemo(() => {
        let res = users;

        // Text Search
        if (userSearchQuery) {
            const q = userSearchQuery.toLowerCase().trim();
            res = res.filter(user => 
                (user.email?.toLowerCase().includes(q)) ||
                (user.username?.toLowerCase().includes(q)) ||
                (user.firstName?.toLowerCase().includes(q)) ||
                (user.lastName?.toLowerCase().includes(q)) ||
                (user.phone?.includes(q)) ||
                (user.dni?.includes(q))
            );
        }

        // Status Filter
        if (userFilterStatus !== 'all') {
            res = res.filter(u => (u.status || USER_STATUS.ACTIVE) === userFilterStatus);
        }

        // Date Range Filter (assuming profiles doesn't have created_at in type, but if it did...)
        // Note: The 'User' type in types.ts doesn't explicitly list created_at, but Supabase usually has it.
        // Assuming we can't filter by date on users easily without that field in the type/data. 
        // If users data has createdAt (from useAppData), we use it.
        // Since useAppData fetches from 'profiles', let's check if we map it. 
        // types.ts User doesn't have createdAt. Skipping date filter implementation for Users to avoid TS errors
        // unless we update types. For now, sticking to Status and Search.
        
        return res;
    }, [users, userSearchQuery, userFilterStatus]);

    // REPORTS LOGIC
    const sortedReports = useMemo(() => [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [reports]);
    const filteredReports = useMemo(() => {
        if (!reportSearchQuery) return sortedReports;
        const q = reportSearchQuery.toLowerCase().trim();
        return sortedReports.filter(report => {
            const reporter = users.find(u => u.email === report.reporterEmail);
            const reportedUser = users.find(u => u.email === report.reportedEmail);
            return (reporter?.email?.toLowerCase().includes(q) || reporter?.username?.toLowerCase().includes(q) || 
                    reportedUser?.email?.toLowerCase().includes(q) || reportedUser?.username?.toLowerCase().includes(q) ||
                    report.reason.toLowerCase().includes(q));
        });
    }, [sortedReports, users, reportSearchQuery]);

    // SUPPORT TICKETS LOGIC
    const filteredSupportTickets = useMemo(() => {
        return supportTickets
            .filter(ticket => {
                const statusMatch = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter;
                const categoryMatch = ticketCategoryFilter === 'all' || ticket.category === ticketCategoryFilter;
                return statusMatch && categoryMatch;
            })
            .sort((a, b) => {
                const aTime = new Date(a.timestamp || a.created_at || 0).getTime();
                const bTime = new Date(b.timestamp || b.created_at || 0).getTime();
                return bTime - aTime;
            });
    }, [supportTickets, ticketStatusFilter, ticketCategoryFilter]);

    const handlePrint = () => window.print();

    // BULK ACTIONS
    const handleSelectReport = (id: string) => {
        const newSelected = new Set(selectedReportIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedReportIds(newSelected);
    };

    const handleSelectAllReports = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select only visible reports on current page or all? usually all visible is safer UX, but let's do visible.
            const paginatedIds = filteredReports
                .slice((reportsPage - 1) * REPORTS_PER_PAGE, reportsPage * REPORTS_PER_PAGE)
                .map(r => r.id);
            setSelectedReportIds(new Set(paginatedIds));
        } else {
            setSelectedReportIds(new Set());
        }
    };

    const handleBulkDeleteReports = async () => {
        if (selectedReportIds.size === 0) return;
        if (!window.confirm(`¿Estás seguro de eliminar ${selectedReportIds.size} reportes seleccionados? Esta acción no se puede deshacer.`)) return;

        setIsBulkDeleting(true);
        try {
            // Delete reports in parallel
            await Promise.all(
                Array.from(selectedReportIds).map(id => deleteReport.mutateAsync(id))
            );
            
            setSelectedReportIds(new Set());
            setInfoModal({ isOpen: true, message: 'Reportes eliminados correctamente.', type: 'success' });
        } catch (err: any) {
            setInfoModal({ isOpen: true, message: 'Error al eliminar reportes: ' + (err.message || 'Error desconocido'), type: 'error' });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Styling Helpers
    const getRoleClass = (role: UserRole) => {
        switch (role) {
            case USER_ROLES.SUPERADMIN: return 'bg-red-100 text-red-800';
            case USER_ROLES.ADMIN: return 'bg-purple-100 text-purple-800';
            case USER_ROLES.MODERATOR: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusClass = (status?: UserStatus) => status === USER_STATUS.INACTIVE ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800';
    const getReportStatusClass = (status: ReportStatusType) => {
        switch (status) {
            case REPORT_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case REPORT_STATUS.ELIMINATED: return 'bg-red-100 text-red-800';
            case REPORT_STATUS.INVALID: return 'bg-blue-100 text-blue-800';
            case REPORT_STATUS.NO_ACTION: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getSupportTicketStatusClass = (status: SupportTicketStatus) => {
        switch (status) {
            case SUPPORT_TICKET_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case SUPPORT_TICKET_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            case SUPPORT_TICKET_STATUS.RESOLVED: return 'bg-green-100 text-green-800';
            case SUPPORT_TICKET_STATUS.NOT_RESOLVED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // IP Management
    const createBannedIp = useCreateBannedIp();
    const deleteBannedIp = useDeleteBannedIp();

    const handleAddIp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIpAddress.trim()) return;
        setIsAddingIp(true);
        try {
            await createBannedIp.mutateAsync({
                ipAddress: newIpAddress.trim(),
                reason: banReason.trim() || 'No specified reason'
            });
            setNewIpAddress('');
            setBanReason('');
            setInfoModal({ isOpen: true, message: 'IP baneada exitosamente.', type: 'success' });
        } catch (err: any) {
            setInfoModal({ isOpen: true, message: 'Error al banear IP: ' + err.message, type: 'error' });
        } finally {
            setIsAddingIp(false);
        }
    };

    const handleRemoveIp = async (ipId: string) => {
        if (!window.confirm('¿Estás seguro de desbloquear esta IP?')) return;
        try {
            await deleteBannedIp.mutateAsync(ipId);
        } catch (err: any) {
            setInfoModal({ isOpen: true, message: 'Error al eliminar ban: ' + err.message, type: 'error' });
        }
    };

    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-700">Resumen General</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setDateRangeFilter('7d')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${dateRangeFilter === '7d' ? 'bg-white shadow text-brand-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>7 días</button>
                        <button onClick={() => setDateRangeFilter('30d')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${dateRangeFilter === '30d' ? 'bg-white shadow text-brand-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>30 días</button>
                        <button onClick={() => setDateRangeFilter('1y')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${dateRangeFilter === '1y' ? 'bg-white shadow text-brand-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>1 año</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard loading={statsLoading} icon={<PetIcon />} title="Publicaciones" value={adminStats?.totalPets || 0} color="bg-blue-100 text-blue-600" />
                <StatCard loading={statsLoading} icon={<UsersIcon />} title="Usuarios" value={adminStats?.totalUsers || 0} color="bg-green-100 text-green-600" />
                <StatCard loading={statsLoading} icon={<FlagIcon />} title="Reportes" value={adminStats?.totalReports || 0} color="bg-red-100 text-red-600" />
                <StatCard loading={statsLoading} icon={<SupportIcon />} title="Tickets Pendientes" value={adminStats?.pendingTickets || 0} color="bg-yellow-100 text-yellow-600" />
                <StatCard loading={statsLoading} icon={<MegaphoneIcon />} title="Campañas" value={adminStats?.totalCampaigns || 0} color="bg-indigo-100 text-indigo-600" />
            </div>

            <div className="col-span-1 lg:col-span-3">
                <SimpleBarChart 
                    loading={statsLoading}
                    data={adminStats?.chartData || []} 
                    title={dateRangeFilter === '1y' ? 'Publicaciones Mensuales' : 'Publicaciones Diarias'} 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado de Mascotas (Total)</h3>
                    {statsLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded"></div> : (
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100">
                                <span className="font-medium text-red-800">Perdidos</span> 
                                <span className="font-bold text-lg text-red-600">{adminStats?.petsByStatus?.lost || 0}</span>
                            </li>
                            <li className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-100">
                                <span className="font-medium text-green-800">Encontrados</span> 
                                <span className="font-bold text-lg text-green-600">{adminStats?.petsByStatus?.found || 0}</span>
                            </li>
                            <li className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100">
                                <span className="font-medium text-blue-800">Avistados</span> 
                                <span className="font-bold text-lg text-blue-600">{adminStats?.petsByStatus?.sighted || 0}</span>
                            </li>
                        </ul>
                    )}
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Tipos de Animales</h3>
                    {statsLoading ? <div className="h-32 bg-gray-100 animate-pulse rounded"></div> : (
                        <div className="flex items-end justify-around h-32">
                            <div className="flex flex-col items-center">
                                <div className="w-16 bg-gray-200 rounded-t-lg relative group transition-all hover:bg-brand-secondary" style={{ height: `${Math.min(100, (adminStats?.petsByType?.dogs || 0) * 2)}px`, minHeight: '10px' }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold">{adminStats?.petsByType?.dogs || 0}</span>
                                </div>
                                <span className="mt-2 font-medium text-gray-600">Perros</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 bg-gray-200 rounded-t-lg relative group transition-all hover:bg-brand-secondary" style={{ height: `${Math.min(100, (adminStats?.petsByType?.cats || 0) * 2)}px`, minHeight: '10px' }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold">{adminStats?.petsByType?.cats || 0}</span>
                                </div>
                                <span className="mt-2 font-medium text-gray-600">Gatos</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 bg-gray-200 rounded-t-lg relative group transition-all hover:bg-brand-secondary" style={{ height: `${Math.min(100, (adminStats?.petsByType?.other || 0) * 2)}px`, minHeight: '10px' }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-bold">{adminStats?.petsByType?.other || 0}</span>
                                </div>
                                <span className="mt-2 font-medium text-gray-600">Otros</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderUserManagement = () => {
        const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
        const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        
        return (
             <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="w-full md:w-1/2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Usuario</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Nombre, email, DNI..."
                                value={userSearchQuery}
                                onChange={(e) => { setUserSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary bg-white text-gray-900"
                            />
                            <div className="absolute left-2.5 top-2.5 text-gray-400">
                                <UsersIcon className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-1/4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                        <select 
                            value={userFilterStatus} 
                            onChange={(e) => { setUserFilterStatus(e.target.value as any); setCurrentPage(1); }}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary bg-white text-gray-900"
                        >
                            <option value="all">Todos</option>
                            <option value={USER_STATUS.ACTIVE}>Activos</option>
                            <option value={USER_STATUS.INACTIVE}>Inactivos/Baneados</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Usuario</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rol</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {paginatedUsers.map(user => (
                                <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 whitespace-nowrap text-sm">{user.email}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">@{user.username || 'N/A'}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm"><span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>{user.role}</span></td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm"><span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.status)}`}>{user.status || 'Activo'}</span></td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-right">
                                        <button onClick={() => onViewUser(user)} className="text-brand-primary hover:text-brand-dark font-bold hover:underline">Ver Perfil</button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">No se encontraron usuarios con estos filtros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls 
                    currentPage={currentPage} 
                    totalPages={totalUserPages} 
                    onPageChange={setCurrentPage} 
                    totalItems={filteredUsers.length} 
                />
             </div>
        );
    };

    const renderReportsManagement = () => {
        const totalReportPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE);
        const paginatedReports = filteredReports.slice((reportsPage - 1) * REPORTS_PER_PAGE, reportsPage * REPORTS_PER_PAGE);

        return (
            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in relative">
                
                {/* Header & Bulk Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold text-gray-800">Gestión de Reportes</h3>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <input 
                                type="text" 
                                placeholder="Buscar reporte..." 
                                value={reportSearchQuery} 
                                onChange={(e) => setReportSearchQuery(e.target.value)} 
                                className="w-full md:w-64 p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary text-sm" 
                            />
                            <div className="absolute left-2.5 top-2.5 text-gray-400"><FlagIcon className="h-4 w-4"/></div>
                        </div>
                    </div>
                </div>

                {/* Bulk Delete Bar - Visible only when items selected */}
                {selectedReportIds.size > 0 && (
                    <div className="absolute top-20 left-0 right-0 mx-6 bg-red-50 border border-red-200 p-3 rounded-lg shadow-md flex justify-between items-center z-10 animate-fade-in-up">
                        <span className="text-red-800 font-bold text-sm flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5"/> {selectedReportIds.size} reportes seleccionados
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setSelectedReportIds(new Set())}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleBulkDeleteReports}
                                disabled={isBulkDeleting}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 shadow-sm flex items-center gap-1"
                            >
                                {isBulkDeleting ? 'Eliminando...' : <><TrashIcon className="h-3 w-3"/> Eliminar Selección</>}
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAllReports}
                                        checked={paginatedReports.length > 0 && paginatedReports.every(r => selectedReportIds.has(r.id))}
                                        className="rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                                    />
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Razón</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedReports.map(report => (
                                <tr key={report.id} className={`hover:bg-gray-50 transition-colors ${selectedReportIds.has(report.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="py-4 px-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedReportIds.has(report.id)}
                                            onChange={() => handleSelectReport(report.id)}
                                            className="rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{formatDateTimeSafe(report.timestamp)}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900 capitalize font-medium">{report.type === 'post' ? 'Publicación' : report.type === 'user' ? 'Usuario' : 'Comentario'}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900 truncate max-w-[150px]" title={report.reason}>{report.reason}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getReportStatusClass(report.status)}`}>{report.status}</span></td>
                                    <td className="py-4 px-4 text-sm text-right">
                                        <button 
                                            onClick={() => setViewingReportDetail({ report, pet: (report.type === 'comment' ? report.postSnapshot : propPets.find(p => p.id === report.targetId) || report.postSnapshot) as any, isDeleted: report.type === 'post' && !propPets.find(p => p.id === report.targetId) })} 
                                            className="text-blue-600 hover:text-blue-900 font-bold text-xs inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                                        >
                                            <EyeIcon className="h-3 w-3" /> Revisar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedReports.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">No hay reportes que coincidan con la búsqueda.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls 
                    currentPage={reportsPage} 
                    totalPages={totalReportPages} 
                    onPageChange={setReportsPage} 
                    totalItems={filteredReports.length} 
                />
            </div>
        );
    };

    const renderSupportManagement = () => {
        const totalSupportPages = Math.ceil(filteredSupportTickets.length / SUPPORT_PER_PAGE);
        const paginatedTickets = filteredSupportTickets.slice((supportPage - 1) * SUPPORT_PER_PAGE, supportPage * SUPPORT_PER_PAGE);

        return (
            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Tickets de Soporte</h3>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <select 
                        value={ticketStatusFilter} 
                        onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                        className="p-2 border rounded text-sm bg-gray-50"
                    >
                        <option value="all">Todos los Estados</option>
                        {Object.values(SUPPORT_TICKET_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                        value={ticketCategoryFilter} 
                        onChange={(e) => setTicketCategoryFilter(e.target.value as any)}
                        className="p-2 border rounded text-sm bg-gray-50"
                    >
                        <option value="all">Todas las Categorías</option>
                        {Object.values(SUPPORT_TICKET_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Usuario</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Categoría</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Asunto</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedTickets.map(ticket => {
                                const ticketUser = users.find(u => u.email === ticket.user_email);
                                return (
                                    <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setViewingTicket(ticket)}>
                                        <td className="py-4 px-4 text-sm text-gray-900">{formatDateTimeSafe(ticket.timestamp || ticket.created_at)}</td>
                                        <td className="py-4 px-4 text-sm text-gray-900">
                                            {ticketUser ? (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewUser(ticketUser);
                                                    }}
                                                    className="text-brand-primary hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                                                >
                                                    @{ticketUser.username || ticketUser.email}
                                                </button>
                                            ) : (
                                                ticket.user_email || 'N/A'
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500 font-medium">{ticket.category || 'N/A'}</td>
                                        <td className="py-4 px-4 text-sm font-bold text-gray-800">{ticket.subject || 'Sin asunto'}</td>
                                        <td className="py-4 px-4 text-sm text-gray-900"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getSupportTicketStatusClass(ticket.status as SupportTicketStatus)}`}>{ticket.status || 'Pendiente'}</span></td>
                                    </tr>
                                );
                            })}
                            {paginatedTickets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">No hay tickets pendientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls 
                    currentPage={supportPage} 
                    totalPages={totalSupportPages} 
                    onPageChange={setSupportPage} 
                    totalItems={filteredSupportTickets.length} 
                />
            </div>
        );
    };

    const renderCampaignsManagement = () => {
        const safeCampaigns = (Array.isArray(campaigns) ? campaigns : []).filter(c => c && c.id);
        const filteredCampaigns = safeCampaigns.filter(c => {
            const campaignDate = new Date(c.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (campaignFilter === 'upcoming') return campaignDate >= today;
            if (campaignFilter === 'expired') return campaignDate < today;
            return true;
        });
        const totalCampaignPages = Math.ceil(filteredCampaigns.length / CAMPAIGNS_PER_PAGE);
        const paginatedCampaigns = filteredCampaigns.slice((campaignPage - 1) * CAMPAIGNS_PER_PAGE, campaignPage * CAMPAIGNS_PER_PAGE);

        return (
            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-gray-800">Gestión de Campañas</h3>
                    <div className="flex gap-2">
                        <select 
                            value={campaignFilter} 
                            onChange={(e) => setCampaignFilter(e.target.value as any)}
                            className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg p-2"
                        >
                            <option value="all">Todas</option>
                            <option value="upcoming">Próximas</option>
                            <option value="expired">Pasadas</option>
                        </select>
                        <button onClick={() => { setCampaignToEdit(null); setIsCampaignModalOpen(true); }} className="py-2 px-4 bg-brand-primary text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow hover:bg-brand-dark transition-colors"><PlusIcon /> Crear Nueva</button>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Título</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedCampaigns.map(campaign => (
                                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{campaign.title}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900"><span className={`px-2 py-1 rounded-full text-xs font-bold ${campaign.type === CAMPAIGN_TYPES.ESTERILIZACION ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'}`}>{campaign.type}</span></td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{formatDateSafe(campaign.date)}</td>
                                    <td className="py-4 px-4 text-sm flex gap-3">
                                        <button onClick={() => { setCampaignToEdit(campaign); setIsCampaignModalOpen(true); }} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded hover:bg-blue-100 transition-colors"><EditIcon /></button>
                                        <button onClick={() => setCampaignToDelete(campaign)} className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded hover:bg-red-100 transition-colors"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedCampaigns.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-gray-500">No hay campañas registradas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls 
                    currentPage={campaignPage} 
                    totalPages={totalCampaignPages} 
                    onPageChange={setCampaignPage} 
                    totalItems={filteredCampaigns.length} 
                />
            </div>
        );
    };

    const renderSecuritySettings = () => (
        <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-full text-red-600"><FlagIcon /></div>
                Seguridad y Bloqueos
            </h3>

            <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Banear Dirección IP</h4>
                <p className="text-sm text-gray-500 mb-4">
                    Bloquea el acceso a la plataforma para direcciones IP específicas. Los usuarios con esta IP no podrán ver ni interactuar con la aplicación.
                </p>
                <form onSubmit={handleAddIp} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección IP</label>
                        <input 
                            type="text" 
                            placeholder="Ej: 192.168.1.1" 
                            value={newIpAddress}
                            onChange={(e) => setNewIpAddress(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                            required
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (Opcional)</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Spam masivo" 
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isAddingIp}
                        className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
                    >
                        {isAddingIp ? 'Bloqueando...' : 'Banear IP'}
                    </button>
                </form>
            </div>

            <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-4">IPs Bloqueadas ({bannedIps.length})</h4>
                {bannedIps.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No hay direcciones IP bloqueadas actualmente.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Dirección IP</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Motivo</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bannedIps.map((ban) => (
                                    <tr key={ban.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm font-mono text-gray-800">{ban.ipAddress}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{ban.reason}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{new Date(ban.createdAt).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-right">
                                            <button 
                                                onClick={() => handleRemoveIp(ban.id)}
                                                className="text-gray-400 hover:text-green-600 transition-colors"
                                                title="Desbloquear IP"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const handleCreateBanner = async (imageUrl: string) => {
        try {
            await createBanner.mutateAsync({
                imageUrl,
            });
            setInfoModal({ isOpen: true, message: 'Banner creado exitosamente', type: 'success' });
        } catch (err: any) {
            setInfoModal({ isOpen: true, message: 'Error al crear banner: ' + (err.message || 'Error desconocido'), type: 'error' });
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este banner?')) return;
        try {
            await deleteBanner.mutateAsync(id);
            setInfoModal({ isOpen: true, message: 'Banner eliminado exitosamente', type: 'success' });
        } catch (err: any) {
            setInfoModal({ isOpen: true, message: 'Error al eliminar banner: ' + (err.message || 'Error desconocido'), type: 'error' });
        }
    };

    const renderSettingsManagement = () => {

        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Configuración General</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div>
                                <h4 className="font-semibold text-gray-800">Búsqueda automática con IA</h4>
                                <p className="text-sm text-gray-500">Buscar coincidencias automáticamente al reportar.</p>
                            </div>
                            <label htmlFor="ai-search-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="ai-search-toggle" className="sr-only peer" checked={isAiSearchEnabled} onChange={onToggleAiSearch} />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-primary peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600"><BellIcon className="h-6 w-6" /></div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Alertas de Proximidad</h4>
                                        <p className="text-sm text-gray-500">Notificaciones Push a usuarios cercanos.</p>
                                    </div>
                                </div>
                                <label htmlFor="location-alert-toggle" className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="location-alert-toggle" className="sr-only peer" checked={isLocationAlertsEnabled} onChange={onToggleLocationAlerts} />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-primary peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>
                            {isLocationAlertsEnabled && (
                                <div className="pl-14 mt-2 animate-fade-in">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><LocationMarkerIcon className="h-4 w-4" /> Radio de Alerta (Km)</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((km) => (
                                            <button key={km} onClick={() => onSetLocationAlertRadius(km)} className={`px-4 py-2 rounded-md text-sm font-bold border transition-all ${locationAlertRadius === km ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>{km} km</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner Management Button */}
                <div className="flex items-center justify-between p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-full text-purple-600 text-xl">🖼️</div>
                        <div>
                            <h4 className="font-semibold text-gray-800">Gestión de Banners</h4>
                            <p className="text-sm text-gray-500">Administra el carrusel de banners del inicio</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsBannerModalOpen(true)}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-dark transition-colors shadow-sm"
                    >
                        Gestionar
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div id="admin-dashboard" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div><h2 className="text-3xl font-bold text-brand-dark">Panel de Administración</h2><p className="text-gray-600">Métricas y gestión de la plataforma.</p></div>
                    <button onClick={handlePrint} className="mt-4 sm:mt-0 py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors no-print">Generar Reporte PDF</button>
                </div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex flex-wrap text-center overflow-x-auto no-scrollbar">
                         <button onClick={() => setActiveTab('dashboard')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'dashboard' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Dashboard</button>
                         <button onClick={() => setActiveTab('users')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Usuarios</button>
                        <button onClick={() => setActiveTab('reports')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'reports' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Reportes <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 ${reports.filter(r => r.status === 'Pendiente').length > 0 ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{reports.filter(r => r.status === 'Pendiente').length}</span></button>
                        <button onClick={() => setActiveTab('support')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'support' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Soporte <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 ${supportTickets.filter(t => t.status === SUPPORT_TICKET_STATUS.PENDING).length > 0 ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{supportTickets.filter(t => t.status === SUPPORT_TICKET_STATUS.PENDING).length}</span></button>
                        <button onClick={() => setActiveTab('campaigns')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'campaigns' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Campañas</button>
                        <button onClick={() => setActiveTab('businesses')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'businesses' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Negocios</button>
                        <button onClick={() => setActiveTab('security')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'security' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Seguridad</button>
                        <button onClick={() => setActiveTab('settings')} className={`flex-shrink-0 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Configuración</button>
                    </nav>
                </div>
            </div>

            <div className="p-1 md:p-0">
                {activeTab === 'dashboard' ? renderDashboard() 
                : activeTab === 'users' ? renderUserManagement() 
                : activeTab === 'reports' ? renderReportsManagement() 
                : activeTab === 'support' ? renderSupportManagement()
                : activeTab === 'campaigns' ? renderCampaignsManagement()
                : activeTab === 'security' ? renderSecuritySettings()
                : activeTab === 'businesses' ? <AdminBusinessPanel allUsers={users} />
                : renderSettingsManagement()}
            </div>
            
            <div className="text-center pt-4">
                 <button onClick={onBack} className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors no-print font-bold shadow-sm border border-gray-300">&larr; Volver al sitio</button>
            </div>

            {/* Modals */}
            {viewingReportDetail && <ReportDetailModal isOpen={!!viewingReportDetail} onClose={() => setViewingReportDetail(null)} report={viewingReportDetail.report} pet={viewingReportDetail.pet as Pet} isDeleted={viewingReportDetail.isDeleted} onDeletePet={onDeletePet} onUpdateReportStatus={onUpdateReportStatus} allUsers={users} onViewUser={onViewUser} onDeleteComment={onDeleteComment} />}
            {viewingTicket && <SupportTicketModal isOpen={!!viewingTicket} onClose={() => setViewingTicket(null)} ticket={viewingTicket} onUpdate={(ticket) => { onUpdateSupportTicket(ticket); setViewingTicket(null); }} allUsers={users} />}
            {isCampaignModalOpen && <CampaignFormModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} onSave={(data, id) => { onSaveCampaign(data, id); setIsCampaignModalOpen(false); }} campaignToEdit={campaignToEdit} />}
            {campaignToDelete && <ConfirmationModal isOpen={!!campaignToDelete} onClose={() => setCampaignToDelete(null)} onConfirm={() => { onDeleteCampaign(campaignToDelete.id); setCampaignToDelete(null); }} title="Eliminar Campaña" message={`¿Estás seguro de que quieres eliminar la campaña "${campaignToDelete.title}"?`} />}
            
            <InfoModal 
                isOpen={infoModal.isOpen} 
                onClose={() => setInfoModal({ isOpen: false, message: '', type: 'info' })} 
                title={infoModal.type === 'success' ? 'Éxito' : infoModal.type === 'error' ? 'Error' : 'Información'}
                message={infoModal.message}
                type={infoModal.type || 'info'}
            />

            {/* Banner Management Modal */}
            <BannerManagementModal
                isOpen={isBannerModalOpen}
                onClose={() => setIsBannerModalOpen(false)}
                banners={banners}
                isLoading={bannersLoading}
                onCreateBanner={handleCreateBanner}
                onDeleteBanner={handleDeleteBanner}
            />
        </div>
    );
};

export default AdminDashboard;