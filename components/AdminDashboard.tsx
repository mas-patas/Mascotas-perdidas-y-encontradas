


import React, { useState, useEffect, useMemo } from 'react';
import type { User, UserRole, Pet, Chat, PetStatus, AnimalType, UserStatus, Report, ReportStatus as ReportStatusType, ReportPostSnapshot, SupportTicket, SupportTicketStatus, SupportTicketCategory, Campaign, BannedIP } from '../types';
import { USER_ROLES, PET_STATUS, ANIMAL_TYPES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES } from '../constants';
import { UsersIcon, PetIcon, FlagIcon, SupportIcon, MegaphoneIcon, TrashIcon, EditIcon, EyeIcon, BellIcon, LocationMarkerIcon, XCircleIcon, PlusIcon, StoreIcon } from './icons';
import ReportDetailModal from './ReportDetailModal';
import SupportTicketModal from './SupportTicketModal';
import CampaignFormModal from './CampaignFormModal';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../services/supabaseClient';
import { useAppData } from '../hooks/useAppData';
import AdminBusinessPanel from './AdminBusinessPanel';

interface AdminDashboardProps {
    onBack: () => void;
    users: User[];
    onViewUser: (user: User) => void;
    pets: Pet[];
    chats: Chat[];
    reports: Report[];
    supportTickets: SupportTicket[];
    onUpdateReportStatus: (reportId: string, status: ReportStatusType) => void;
    onDeletePet: (petId: string) => void;
    onUpdateSupportTicket: (ticket: SupportTicket) => void;
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

// ... (Existing Helper functions: formatDateSafe, formatDateTimeSafe, StatCard, SimpleBarChart remain exactly the same)
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
         return d.toLocaleString('es-ES');
    } catch {
        return 'N/A';
    }
};


interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const SimpleBarChart: React.FC<{ data: { label: string, value: number }[], title: string }> = ({ data, title }) => {
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
                                    <div key={label} className="flex-1 min-w-[20px] h-full flex items-end">
                                        <div
                                            className="w-full bg-lime-500 hover:bg-lime-600 transition-colors relative"
                                            style={{ height: `${(value / maxValue) * 100}%` }}
                                            title={`${label}: ${value}`}
                                        >
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700">
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
                                    <p className="text-xs text-gray-500 text-center">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Pagination Component
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
    onBack, users, onViewUser, pets, chats, reports, supportTickets, 
    onUpdateReportStatus, onDeletePet, onUpdateSupportTicket, 
    isAiSearchEnabled, onToggleAiSearch, 
    isLocationAlertsEnabled, onToggleLocationAlerts, locationAlertRadius, onSetLocationAlertRadius,
    campaigns, onSaveCampaign, onDeleteCampaign, onNavigate, onDeleteComment 
}) => {
    const { bannedIps } = useAppData();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'support' | 'campaigns' | 'settings' | 'security' | 'businesses'>('dashboard');
    const [statusFilter, setStatusFilter] = useState<PetStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<AnimalType | 'all'>('all');
    const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '1y' | 'all'>('all');
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
    const REPORTS_PER_PAGE = 5;

    const [supportPage, setSupportPage] = useState(1);
    const SUPPORT_PER_PAGE = 5;

    const [searchQuery, setSearchQuery] = useState('');
    const [reportSearchQuery, setReportSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1); // Users Page
    const ITEMS_PER_PAGE = 10;

    // Reset pages on filter change
    useEffect(() => { setReportsPage(1); }, [reportSearchQuery]);
    useEffect(() => { setSupportPage(1); }, [ticketStatusFilter, ticketCategoryFilter]);
    useEffect(() => { setCampaignPage(1); }, [campaignFilter]);

    const dashboardData = useMemo(() => {
        // ... (Dashboard data logic matches previous file)
        const now = new Date();
        let startDate: Date | null = new Date();
        if (dateRangeFilter === '7d') startDate.setDate(now.getDate() - 7);
        else if (dateRangeFilter === '30d') startDate.setDate(now.getDate() - 30);
        else if (dateRangeFilter === '1y') startDate.setFullYear(now.getFullYear() - 1);
        else startDate = null;
        if(startDate) startDate.setHours(0, 0, 0, 0);

        const filteredPets = pets.filter(pet => {
            const petDate = new Date(pet.date);
            const statusMatch = statusFilter === 'all' || pet.status === statusFilter;
            const typeMatch = typeFilter === 'all' || pet.animalType === typeFilter;
            const dateMatch = !startDate || petDate >= startDate;
            return statusMatch && typeMatch && dateMatch;
        });

        const totalPets = filteredPets.length;
        const totalUsers = users.length;
        const totalReportsCount = reports.length;
        const pendingSupportTicketsCount = supportTickets.filter(t => t.status === SUPPORT_TICKET_STATUS.PENDING).length;
        const totalCampaigns = campaigns ? campaigns.length : 0;

        const petsByStatus = {
            lost: filteredPets.filter(p => p.status === PET_STATUS.PERDIDO).length,
            found: filteredPets.filter(p => p.status === PET_STATUS.ENCONTRADO).length,
            sighted: filteredPets.filter(p => p.status === PET_STATUS.AVISTADO).length,
        };

        const petsByType = {
            dogs: filteredPets.filter(p => p.animalType === ANIMAL_TYPES.PERRO).length,
            cats: filteredPets.filter(p => p.animalType === ANIMAL_TYPES.GATO).length,
            other: filteredPets.filter(p => p.animalType === ANIMAL_TYPES.OTRO).length,
        };
        
        const generateChartData = () => {
             if (dateRangeFilter === '1y' || dateRangeFilter === 'all') {
                const months = Array(12).fill(0).map((_, i) => {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    return {
                        label: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                        key: `${d.getFullYear()}-${d.getMonth()}`,
                        value: 0
                    };
                }).reverse();
                filteredPets.forEach(pet => {
                    const petDate = new Date(pet.date);
                    const key = `${petDate.getFullYear()}-${petDate.getMonth()}`;
                    const month = months.find(m => m.key === key);
                    if (month) month.value++;
                });
                return { data: months, title: 'Publicaciones en el último año' };
            }
            const days = dateRangeFilter === '7d' ? 7 : 30;
            const dayLabels = Array(days).fill(0).map((_, i) => {
                const d = new Date();
                d.setDate(now.getDate() - i);
                return {
                    label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                    key: d.toISOString().split('T')[0],
                    value: 0
                };
            }).reverse();
            filteredPets.forEach(pet => {
                const key = new Date(pet.date).toISOString().split('T')[0];
                const day = dayLabels.find(d => d.key === key);
                if(day) day.value++;
            });
            return { data: dayLabels, title: `Publicaciones en los últimos ${days} días` };
        };
        
        const { data: postsChartData, title: postsChartTitle } = generateChartData();
        const recentUsers = users.slice(-10).reverse();
        const recentPets = filteredPets.slice(0, 5);

        return { totalPets, totalUsers, totalReportsCount, pendingSupportTicketsCount, totalCampaigns, petsByStatus, petsByType, postsChartData, postsChartTitle, recentUsers, recentPets };
    }, [pets, users, chats, reports, supportTickets, campaigns, statusFilter, typeFilter, dateRangeFilter]);

    // ... (Filtered Users logic)
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        return users.filter(user => 
            (user.email?.toLowerCase().includes(lowercasedQuery)) ||
            (user.username?.toLowerCase().includes(lowercasedQuery)) ||
            (user.firstName?.toLowerCase().includes(lowercasedQuery)) ||
            (user.lastName?.toLowerCase().includes(lowercasedQuery)) ||
            (user.phone?.includes(lowercasedQuery)) ||
            (user.dni?.includes(lowercasedQuery))
        );
    }, [users, searchQuery]);

    const sortedReports = useMemo(() => [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [reports]);
    const filteredReports = useMemo(() => {
        if (!reportSearchQuery) return sortedReports;
        const lowercasedQuery = reportSearchQuery.toLowerCase().trim();
        return sortedReports.filter(report => {
            const reporter = users.find(u => u.email === report.reporterEmail);
            const reportedUser = users.find(u => u.email === report.reportedEmail);
            return (reporter?.email?.toLowerCase().includes(lowercasedQuery) || reporter?.username?.toLowerCase().includes(lowercasedQuery) || 
                    reportedUser?.email?.toLowerCase().includes(lowercasedQuery) || reportedUser?.username?.toLowerCase().includes(lowercasedQuery));
        });
    }, [sortedReports, users, reportSearchQuery]);

    const filteredSupportTickets = useMemo(() => {
        return supportTickets
            .filter(ticket => {
                const statusMatch = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter;
                const categoryMatch = ticketCategoryFilter === 'all' || ticket.category === ticketCategoryFilter;
                return statusMatch && categoryMatch;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [supportTickets, ticketStatusFilter, ticketCategoryFilter]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)), [filteredUsers]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const handlePrint = () => window.print();

    // ... (Helper styling functions getRoleClass, etc. - keeping them compact)
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

    // IP Management Functions
    const handleAddIp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIpAddress.trim()) return;
        setIsAddingIp(true);
        try {
            const { error } = await supabase.from('banned_ips').insert({
                ip_address: newIpAddress.trim(),
                reason: banReason.trim() || 'No specified reason'
            });
            if (error) throw error;
            setNewIpAddress('');
            setBanReason('');
            alert('IP baneada exitosamente.');
        } catch (err: any) {
            alert('Error al banear IP: ' + err.message);
        } finally {
            setIsAddingIp(false);
        }
    };

    const handleRemoveIp = async (ipId: string) => {
        if (!window.confirm('¿Estás seguro de desbloquear esta IP?')) return;
        try {
            const { error } = await supabase.from('banned_ips').delete().eq('id', ipId);
            if (error) throw error;
        } catch (err: any) {
            alert('Error al eliminar ban: ' + err.message);
        }
    };

    const renderDashboard = () => (
        // ... (KPIs, Charts - same as before)
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white text-gray-900">
                            <option value="all">Todos</option>
                            <option value={PET_STATUS.PERDIDO}>Perdido</option>
                            <option value={PET_STATUS.ENCONTRADO}>Encontrado</option>
                            <option value={PET_STATUS.AVISTADO}>Avistado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Animal</label>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white text-gray-900">
                            <option value="all">Todos</option>
                            <option value={ANIMAL_TYPES.PERRO}>Perro</option>
                            <option value={ANIMAL_TYPES.GATO}>Gato</option>
                            <option value={ANIMAL_TYPES.OTRO}>Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Periodo</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <button onClick={() => setDateRangeFilter('all')} className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md transition-colors ${dateRangeFilter === 'all' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Todo</button>
                            <button onClick={() => setDateRangeFilter('7d')} className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-300 -ml-px transition-colors ${dateRangeFilter === '7d' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>7 días</button>
                            <button onClick={() => setDateRangeFilter('30d')} className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-300 -ml-px transition-colors ${dateRangeFilter === '30d' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>30 días</button>
                            <button onClick={() => setDateRangeFilter('1y')} className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-md -ml-px transition-colors ${dateRangeFilter === '1y' ? 'bg-brand-primary text-white border-brand-primary z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>1 año</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard icon={<PetIcon />} title="Total de Publicaciones" value={dashboardData.totalPets} color="bg-blue-100 text-blue-600" />
                <StatCard icon={<UsersIcon />} title="Usuarios Registrados" value={dashboardData.totalUsers} color="bg-green-100 text-green-600" />
                <StatCard icon={<FlagIcon />} title="Total de Reportes" value={dashboardData.totalReportsCount} color="bg-red-100 text-red-600" />
                <StatCard icon={<SupportIcon />} title="Tickets Pendientes" value={dashboardData.pendingSupportTicketsCount} color="bg-yellow-100 text-yellow-600" />
                <StatCard icon={<MegaphoneIcon />} title="Total de Campañas" value={dashboardData.totalCampaigns} color="bg-indigo-100 text-indigo-600" />
            </div>
            <div className="col-span-1 lg:col-span-3">
                <SimpleBarChart data={dashboardData.postsChartData} title={dashboardData.postsChartTitle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Publicaciones por Estado</h3>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex justify-between"><span>Perdidos</span> <span className="font-bold">{dashboardData.petsByStatus.lost}</span></li>
                        <li className="flex justify-between"><span>Encontrados</span> <span className="font-bold">{dashboardData.petsByStatus.found}</span></li>
                        <li className="flex justify-between"><span>Avistados</span> <span className="font-bold">{dashboardData.petsByStatus.sighted}</span></li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Publicaciones por Tipo</h3>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex justify-between"><span>Perros</span> <span className="font-bold">{dashboardData.petsByType.dogs}</span></li>
                        <li className="flex justify-between"><span>Gatos</span> <span className="font-bold">{dashboardData.petsByType.cats}</span></li>
                        <li className="flex justify-between"><span>Otros</span> <span className="font-bold">{dashboardData.petsByType.other}</span></li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderUserManagement = () => {
        const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        return (
             <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por email, nombre, apellido, usuario, DNI o teléfono..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full max-w-md p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary bg-white text-gray-900"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Usuario</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Rol</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Estado</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {paginatedUsers.map(user => (
                                <tr key={user.email} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">@{user.username || 'N/A'}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>{user.role}</span></td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.status)}`}>{user.status || 'Activo'}</span></td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium"><button onClick={() => onViewUser(user)} className="text-brand-primary hover:text-brand-dark font-semibold">Ver Perfil</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Reportes</h3>
                <div className="mb-4"><input type="text" placeholder="Buscar por email..." value={reportSearchQuery} onChange={(e) => setReportSearchQuery(e.target.value)} className="w-full max-w-md p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary bg-white text-gray-900" /></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Tipo</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Razón</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Estado</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedReports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm text-gray-900">{formatDateTimeSafe(report.timestamp)}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900 capitalize">{report.type}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{report.reason}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getReportStatusClass(report.status)}`}>{report.status}</span></td>
                                    <td className="py-4 px-4 text-sm text-gray-900"><button onClick={() => setViewingReportDetail({ report, pet: (report.type === 'comment' ? report.postSnapshot : pets.find(p => p.id === report.targetId) || report.postSnapshot) as any, isDeleted: report.type === 'post' && !pets.find(p => p.id === report.targetId) })} className="text-blue-600 hover:text-blue-900 flex items-center gap-1"><EyeIcon className="h-4 w-4" /> Detalles</button></td>
                                </tr>
                            ))}
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Tickets</h3>
                {/* Filters would go here */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Usuario</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Asunto</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingTicket(ticket)}>
                                    <td className="py-4 px-4 text-sm text-gray-900">{formatDateTimeSafe(ticket.timestamp)}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{ticket.userEmail}</td>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{ticket.subject}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSupportTicketStatusClass(ticket.status)}`}>{ticket.status}</span></td>
                                </tr>
                            ))}
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
        // Reuse logic from original file
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Campañas</h3>
                    <button onClick={() => { setCampaignToEdit(null); setIsCampaignModalOpen(true); }} className="py-2 px-4 bg-brand-primary text-white rounded-lg flex items-center gap-2 text-sm"><MegaphoneIcon /> Crear</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Título</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Tipo</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedCampaigns.map(campaign => (
                                <tr key={campaign.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{campaign.title}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{campaign.type}</td>
                                    <td className="py-4 px-4 text-sm text-gray-900">{formatDateSafe(campaign.date)}</td>
                                    <td className="py-4 px-4 text-sm flex gap-3">
                                        <button onClick={() => { setCampaignToEdit(campaign); setIsCampaignModalOpen(true); }} className="text-blue-600"><EditIcon /></button>
                                        <button onClick={() => setCampaignToDelete(campaign)} className="text-red-600"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
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
        <div className="bg-white p-6 rounded-lg shadow-md">
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
                        className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Dirección IP</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Motivo</th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Fecha</th>
                                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase">Acciones</th>
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

    const renderSettingsManagement = () => (
        // ... (Existing settings - AI Search, etc.)
        <div className="bg-white p-6 rounded-lg shadow-md">
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
    );

    return (
        <div id="admin-dashboard" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div><h2 className="text-3xl font-bold text-brand-dark">Panel de Administración</h2><p className="text-gray-600">Métricas y gestión de la plataforma.</p></div>
                    <button onClick={handlePrint} className="mt-4 sm:mt-0 py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors no-print">Generar Reporte</button>
                </div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex flex-wrap text-center">
                         <button onClick={() => setActiveTab('dashboard')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Dashboard</button>
                         <button onClick={() => setActiveTab('users')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Usuarios</button>
                        <button onClick={() => setActiveTab('reports')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Reportes <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${reports.filter(r => r.status === 'Pendiente').length > 0 ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{reports.filter(r => r.status === 'Pendiente').length}</span></button>
                        <button onClick={() => setActiveTab('support')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'support' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Soporte <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${supportTickets.filter(t => t.status === 'Pendiente').length > 0 ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{supportTickets.filter(t => t.status === 'Pendiente').length}</span></button>
                        <button onClick={() => setActiveTab('campaigns')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Campañas</button>
                        <button onClick={() => setActiveTab('businesses')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'businesses' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Negocios</button>
                        <button onClick={() => setActiveTab('security')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'security' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Seguridad</button>
                        <button onClick={() => setActiveTab('settings')} className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Configuración</button>
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
                 <button onClick={onBack} className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors no-print">&larr; Volver a la lista principal</button>
            </div>

            {/* Modals remain same */}
            {viewingReportDetail && <ReportDetailModal isOpen={!!viewingReportDetail} onClose={() => setViewingReportDetail(null)} report={viewingReportDetail.report} pet={viewingReportDetail.pet as Pet} isDeleted={viewingReportDetail.isDeleted} onDeletePet={onDeletePet} onUpdateReportStatus={onUpdateReportStatus} allUsers={users} onViewUser={onViewUser} onDeleteComment={onDeleteComment} />}
            {viewingTicket && <SupportTicketModal isOpen={!!viewingTicket} onClose={() => setViewingTicket(null)} ticket={viewingTicket} onUpdate={onUpdateSupportTicket} allUsers={users} />}
            {isCampaignModalOpen && <CampaignFormModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} onSave={(data, id) => { onSaveCampaign(data, id); setIsCampaignModalOpen(false); }} campaignToEdit={campaignToEdit} />}
            {campaignToDelete && <ConfirmationModal isOpen={!!campaignToDelete} onClose={() => setCampaignToDelete(null)} onConfirm={() => { onDeleteCampaign(campaignToDelete.id); setCampaignToDelete(null); }} title="Eliminar Campaña" message={`¿Estás seguro?`} />}
        </div>
    );
};

export default AdminDashboard;
