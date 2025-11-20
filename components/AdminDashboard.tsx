
import React, { useState, useEffect, useMemo } from 'react';
import type { User, UserRole, Pet, Chat, PetStatus, AnimalType, UserStatus, Report, ReportStatus as ReportStatusType, ReportPostSnapshot, SupportTicket, SupportTicketStatus, SupportTicketCategory, Campaign } from '../types';
import { USER_ROLES, PET_STATUS, ANIMAL_TYPES, USER_STATUS, REPORT_STATUS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_CATEGORIES, CAMPAIGN_TYPES } from '../constants';
import { UsersIcon, PetIcon, FlagIcon, SupportIcon, MegaphoneIcon, TrashIcon, EditIcon } from './icons';
import ReportDetailModal from './ReportDetailModal';
import SupportTicketModal from './SupportTicketModal';
import CampaignFormModal from './CampaignFormModal';
import ConfirmationModal from './ConfirmationModal';

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
    campaigns: Campaign[];
    onSaveCampaign: (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => void;
    onDeleteCampaign: (campaignId: string) => void;
    onNavigate: (path: string) => void;
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
                {/* min-w-[700px] keeps it from squishing too much inside the scroll container */}
                <div className="min-w-[700px] flex">
                    {/* Y-Axis */}
                    <div className="flex flex-col justify-between text-xs text-gray-500 pr-4 py-3" style={{ height: '220px' }}>
                        {ticks.map(tick => <span key={tick}>{tick}</span>)}
                    </div>
                    {/* Chart + X-Axis container */}
                    <div className="flex-1 flex flex-col">
                        {/* Chart Area */}
                        <div className="flex-1 relative border-l border-b border-gray-300">
                            {/* Grid Lines */}
                            {ticks.slice(0, -1).map(tick => (
                                <div
                                    key={`grid-${tick}`}
                                    className="absolute w-full border-t border-gray-200 border-dashed"
                                    style={{ bottom: `calc(${(tick / maxValue) * 100}% - 1px)` }}
                                ></div>
                            ))}
                            {/* Bars */}
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
                        {/* X-Axis Labels */}
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


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, users, onViewUser, pets, chats, reports, supportTickets, onUpdateReportStatus, onDeletePet, onUpdateSupportTicket, isAiSearchEnabled, onToggleAiSearch, campaigns, onSaveCampaign, onDeleteCampaign, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'support' | 'campaigns' | 'settings'>('dashboard');
    const [statusFilter, setStatusFilter] = useState<PetStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<AnimalType | 'all'>('all');
    const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '1y' | 'all'>('all');
    const [viewingReportDetail, setViewingReportDetail] = useState<{ report: Report; pet: Pet | ReportPostSnapshot; isDeleted: boolean } | null>(null);
    const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

    // Support ticket filters
    const [ticketStatusFilter, setTicketStatusFilter] = useState<SupportTicketStatus | 'all'>('all');
    const [ticketCategoryFilter, setTicketCategoryFilter] = useState<SupportTicketCategory | 'all'>('all');

    
    const [searchQuery, setSearchQuery] = useState('');
    const [reportSearchQuery, setReportSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dashboardData = useMemo(() => {
        const now = new Date();
        let startDate: Date | null = new Date();
    
        if (dateRangeFilter === '7d') {
            startDate.setDate(now.getDate() - 7);
        } else if (dateRangeFilter === '30d') {
            startDate.setDate(now.getDate() - 30);
        } else if (dateRangeFilter === '1y') {
            startDate.setFullYear(now.getFullYear() - 1);
        } else {
            startDate = null;
        }

        if(startDate) {
            startDate.setHours(0, 0, 0, 0);
        }

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

        return {
            totalPets,
            totalUsers,
            totalReportsCount,
            pendingSupportTicketsCount,
            totalCampaigns,
            petsByStatus,
            petsByType,
            postsChartData,
            postsChartTitle,
            recentUsers,
            recentPets,
        };
    }, [pets, users, chats, reports, supportTickets, campaigns, statusFilter, typeFilter, dateRangeFilter]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) {
            return users;
        }
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
        if (!reportSearchQuery) {
            return sortedReports;
        }
        const lowercasedQuery = reportSearchQuery.toLowerCase().trim();
        return sortedReports.filter(report => {
            const reporter = users.find(u => u.email === report.reporterEmail);
            const reportedUser = users.find(u => u.email === report.reportedEmail);
            
            if (reporter?.email?.toLowerCase().includes(lowercasedQuery) || reporter?.username?.toLowerCase().includes(lowercasedQuery)) {
                return true;
            }

            if (reportedUser?.email?.toLowerCase().includes(lowercasedQuery) || reportedUser?.username?.toLowerCase().includes(lowercasedQuery)) {
                return true;
            }
            
            return false;
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
        // Correct the current page if it's out of bounds (e.g., after filtering)
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handlePrint = () => {
        window.print();
    };

    const getRoleClass = (role: UserRole) => {
        switch (role) {
            case USER_ROLES.SUPERADMIN: return 'bg-red-100 text-red-800';
            case USER_ROLES.ADMIN: return 'bg-purple-100 text-purple-800';
            case USER_ROLES.MODERATOR: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusClass = (status?: UserStatus) => {
        switch (status) {
            case USER_STATUS.ACTIVE: return 'bg-green-100 text-green-800';
            case USER_STATUS.INACTIVE: return 'bg-gray-200 text-gray-800';
            default: return 'bg-green-100 text-green-800'; // Default to active
        }
    };

    const getReportStatusClass = (status: ReportStatusType) => {
        switch (status) {
            case REPORT_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case REPORT_STATUS.ELIMINATED: return 'bg-red-100 text-red-800';
            case REPORT_STATUS.INVALID: return 'bg-blue-100 text-blue-800';
            case REPORT_STATUS.NO_ACTION: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const getSupportTicketStatusClass = (status: SupportTicketStatus) => {
        switch (status) {
            case SUPPORT_TICKET_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case SUPPORT_TICKET_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            case SUPPORT_TICKET_STATUS.RESOLVED: return 'bg-green-100 text-green-800';
            case SUPPORT_TICKET_STATUS.NOT_RESOLVED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const renderDashboard = () => (
         <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                            <option value="all">Todos</option>
                            <option value={PET_STATUS.PERDIDO}>Perdido</option>
                            <option value={PET_STATUS.ENCONTRADO}>Encontrado</option>
                            <option value={PET_STATUS.AVISTADO}>Avistado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Animal</label>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard icon={<PetIcon />} title="Total de Publicaciones" value={dashboardData.totalPets} color="bg-blue-100 text-blue-600" />
                <StatCard icon={<UsersIcon />} title="Usuarios Registrados" value={dashboardData.totalUsers} color="bg-green-100 text-green-600" />
                <StatCard icon={<FlagIcon />} title="Total de Reportes" value={dashboardData.totalReportsCount} color="bg-red-100 text-red-600" />
                <StatCard icon={<SupportIcon />} title="Tickets Pendientes" value={dashboardData.pendingSupportTicketsCount} color="bg-yellow-100 text-yellow-600" />
                <StatCard icon={<MegaphoneIcon />} title="Total de Campañas" value={dashboardData.totalCampaigns} color="bg-indigo-100 text-indigo-600" />
            </div>

            {/* Bar Chart */}
            <div className="col-span-1 lg:col-span-3">
                <SimpleBarChart data={dashboardData.postsChartData} title={dashboardData.postsChartTitle} />
            </div>
            
            {/* Posts Breakdown */}
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

             {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimos 10 Usuarios Registrados</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-900">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-2 px-3 text-left font-medium text-xs uppercase tracking-wider">Usuario</th>
                                    <th className="py-2 px-3 text-left font-medium text-xs uppercase tracking-wider">Email</th>
                                    <th className="py-2 px-3 text-left font-medium text-xs uppercase tracking-wider">Rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dashboardData.recentUsers.map(user => (
                                    <tr key={user.email}>
                                        <td className="py-2 px-3">
                                            <button
                                                onClick={() => onViewUser(user)}
                                                className="text-brand-primary hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer disabled:text-gray-500 disabled:no-underline disabled:cursor-default"
                                                disabled={!user.username}
                                                title={user.username ? `Ver perfil de @${user.username}` : 'El usuario no ha completado el perfil'}
                                            >
                                                @{user.username || 'N/A'}
                                            </button>
                                        </td>
                                        <td className="py-2 px-3">{user.email}</td>
                                        <td className="py-2 px-3">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimas Publicaciones</h3>
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-900">
                            <tbody className="divide-y divide-gray-200">
                                {dashboardData.recentPets.map(pet => (
                                    <tr key={pet.id}>
                                        <td className="py-2">{pet.name} ({pet.animalType})</td>
                                        <td className="py-2 text-right">{pet.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );

    const renderUserManagement = () => {
        const paginatedUsers = filteredUsers.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    
        return (
             <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por email, nombre, apellido, usuario, DNI o teléfono..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full max-w-md p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Usuario</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Nombres</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Apellidos</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">DNI</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Rol</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Estado</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {paginatedUsers.map(user => (
                                <tr key={user.email} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">{user.email}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">@{user.username || 'N/A'}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">{user.firstName || 'N/A'}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">{user.lastName || 'N/A'}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">{user.dni || 'N/A'}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.status)}`}>
                                            {user.status || 'Activo'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => onViewUser(user)}
                                            className="text-brand-primary hover:text-brand-dark font-semibold"
                                        >
                                            Ver Perfil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredUsers.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No se encontraron usuarios.</p>
                    </div>
                 )}
                 {totalPages > 1 && (
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{paginatedUsers.length}</span> de <span className="font-medium">{filteredUsers.length}</span> usuarios
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border-transparent rounded-md text-sm text-white bg-brand-primary hover:bg-brand-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-700">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border-transparent rounded-md text-sm text-white bg-brand-primary hover:bg-brand-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
             </div>
        );
    };

    const renderReportsManagement = () => {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Reportes</h3>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por email o nombre de usuario..."
                        value={reportSearchQuery}
                        onChange={(e) => setReportSearchQuery(e.target.value)}
                        className="w-full max-w-md p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Reportado por</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Objetivo</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tipo</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Razón</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Autor</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Acción Tomada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {filteredReports.map(report => {
                                const reporter = users.find(u => u.email === report.reporterEmail);
                                const reportedUser = users.find(u => u.email === report.reportedEmail);
                                
                                const reportedPet = report.type === 'post' ? pets.find(p => p.id === report.targetId) : null;
                                const petData = reportedPet || report.postSnapshot;
                                const isDeleted = report.type === 'post' && !reportedPet;
                                const author = petData ? users.find(u => u.email === petData.userEmail) : null;


                                return (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">{formatDateTimeSafe(report.timestamp)}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                                            <button onClick={() => reporter && onViewUser(reporter)} className="text-brand-primary hover:underline">{reporter?.username || report.reporterEmail}</button>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                                            {report.type === 'user' && (
                                                <button onClick={() => reportedUser && onViewUser(reportedUser)} className="text-brand-primary hover:underline">
                                                    {reportedUser?.username || report.targetId}
                                                </button>
                                            )}
                                            {report.type === 'post' && petData && (
                                                <button onClick={() => setViewingReportDetail({ report, pet: petData, isDeleted })} className="text-brand-primary hover:underline">
                                                    {petData.name || `ID: ${report.targetId.slice(0, 6)}...`}
                                                    {isDeleted && <span className="ml-2 text-xs text-red-600">(Eliminado)</span>}
                                                </button>
                                            )}
                                            {report.type === 'post' && !petData && `ID: ${report.targetId.slice(0, 6)}...`}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm capitalize">{report.type === 'post' ? 'Publicación' : 'Usuario'}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">{report.reason}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                                            {author ? (
                                                <button onClick={() => onViewUser(author)} className="text-brand-primary hover:underline">{author.username || author.email}</button>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                                            <select
                                                value={report.status}
                                                onChange={(e) => onUpdateReportStatus(report.id, e.target.value as ReportStatusType)}
                                                className={`p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-primary text-xs font-medium ${getReportStatusClass(report.status)}`}
                                            >
                                                {Object.values(REPORT_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {filteredReports.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No hay reportes que coincidan con la búsqueda.</p>
                        </div>
                     )}
                </div>
            </div>
        );
    };

    const renderSupportManagement = () => {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Tickets de Soporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Filtrar por Estado</label>
                        <select
                            value={ticketStatusFilter}
                            onChange={(e) => setTicketStatusFilter(e.target.value as SupportTicketStatus | 'all')}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        >
                            <option value="all">Todos los Estados</option>
                            {Object.values(SUPPORT_TICKET_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Filtrar por Categoría</label>
                        <select
                            value={ticketCategoryFilter}
                            onChange={(e) => setTicketCategoryFilter(e.target.value as SupportTicketCategory | 'all')}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        >
                            <option value="all">Todas las Categorías</option>
                            {Object.values(SUPPORT_TICKET_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Usuario</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Categoría</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Asunto</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Estado</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Asignado a</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {filteredSupportTickets.map(ticket => {
                                const user = users.find(u => u.email === ticket.userEmail);
                                const assignedAdmin = users.find(u => u.email === ticket.assignedTo);
                                return (
                                    <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingTicket(ticket)}>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">{formatDateTimeSafe(ticket.timestamp)}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                                            {user?.username || ticket.userEmail}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">{ticket.category}</td>
                                        <td className="py-4 px-4 text-sm font-medium">{ticket.subject}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSupportTicketStatusClass(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                         <td className="py-4 px-4 whitespace-nowrap text-sm">{assignedAdmin?.username || ticket.assignedTo || 'N/A'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredSupportTickets.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No hay tickets de soporte que coincidan con los filtros.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCampaignsManagement = () => {
        const handleOpenCreateModal = () => {
            setCampaignToEdit(null);
            setIsCampaignModalOpen(true);
        };
    
        const handleOpenEditModal = (campaign: Campaign) => {
            setCampaignToEdit(campaign);
            setIsCampaignModalOpen(true);
        };
        
        const handleSave = (campaignData: Omit<Campaign, 'id' | 'userEmail'>, idToUpdate?: string) => {
            onSaveCampaign(campaignData, idToUpdate);
            setIsCampaignModalOpen(false);
        };

        const handleConfirmDelete = () => {
            if (campaignToDelete) {
                onDeleteCampaign(campaignToDelete.id);
                setCampaignToDelete(null);
            }
        };
        
        // Robust handling: treat campaigns as an array even if null/undefined is passed
        // AND filter out nulls just in case
        const safeCampaigns = (Array.isArray(campaigns) ? campaigns : []).filter(c => c && c.id);
    
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Gestión de Campañas</h3>
                    <button onClick={handleOpenCreateModal} className="py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark flex items-center gap-2">
                        <MegaphoneIcon /> Crear Campaña
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Título</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tipo</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Lugar</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-900">
                            {safeCampaigns.map(campaign => (
                                <tr key={campaign.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm font-medium">
                                        <button 
                                            onClick={() => onNavigate(`/campanas/${campaign.id}`)}
                                            className="text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                                        >
                                            {campaign.title}
                                        </button>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">{campaign.type}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm">{formatDateSafe(campaign.date)}</td>
                                    <td className="py-4 px-4 text-sm">{campaign.location}</td>
                                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium flex gap-4">
                                        <button onClick={() => handleOpenEditModal(campaign)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                                            <EditIcon /> Editar
                                        </button>
                                        <button onClick={() => setCampaignToDelete(campaign)} className="text-red-600 hover:text-red-900 flex items-center gap-1">
                                            <TrashIcon /> Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {safeCampaigns.length === 0 && (
                        <p className="text-center py-10 text-gray-500">No se han creado campañas.</p>
                    )}
                </div>
                {isCampaignModalOpen && (
                    <CampaignFormModal 
                        isOpen={isCampaignModalOpen}
                        onClose={() => setIsCampaignModalOpen(false)}
                        onSave={handleSave}
                        campaignToEdit={campaignToEdit}
                    />
                )}
                {campaignToDelete && (
                    <ConfirmationModal
                        isOpen={!!campaignToDelete}
                        onClose={() => setCampaignToDelete(null)}
                        onConfirm={handleConfirmDelete}
                        title="Eliminar Campaña"
                        message={`¿Estás seguro de que quieres eliminar la campaña "${campaignToDelete.title}"? Esta acción no se puede deshacer.`}
                    />
                )}
            </div>
        );
    };

    const renderSettingsManagement = () => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Configuración de la Plataforma</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                        <h4 className="font-semibold text-gray-800">Búsqueda automática con IA al reportar un perdido</h4>
                        <p className="text-sm text-gray-500">
                            Si está activado, el sistema buscará automáticamente mascotas encontradas/avistadas similares cuando un usuario reporte una mascota perdida.
                        </p>
                    </div>
                    <label htmlFor="ai-search-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="ai-search-toggle" 
                            className="sr-only peer" 
                            checked={isAiSearchEnabled} 
                            onChange={onToggleAiSearch} 
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div id="admin-dashboard" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-brand-dark">Panel de Administración</h2>
                        <p className="text-gray-600">Métricas y gestión de la plataforma.</p>
                    </div>
                    <button onClick={handlePrint} className="mt-4 sm:mt-0 py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors no-print">
                        Generar Reporte
                    </button>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex flex-wrap text-center">
                         <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Dashboard
                        </button>
                         <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <span className="hidden sm:inline">Gestión de </span>Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'reports' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                             <span className="hidden sm:inline">Reportes</span>
                            <span className="sm:hidden">Rep.</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${reports.filter(r => r.status === 'Pendiente').length > 0 ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                                {reports.filter(r => r.status === 'Pendiente').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'support' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                             <span className="hidden sm:inline">Soporte</span>
                            <span className="sm:hidden">Sop.</span>
                             <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${supportTickets.filter(t => t.status === 'Pendiente').length > 0 ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                                {supportTickets.filter(t => t.status === 'Pendiente').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('campaigns')}
                            className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Campañas
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-grow sm:flex-1 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Configuración
                        </button>
                    </nav>
                </div>
            </div>

            <div className="p-1 md:p-0">
                {activeTab === 'dashboard' ? renderDashboard() 
                : activeTab === 'users' ? renderUserManagement() 
                : activeTab === 'reports' ? renderReportsManagement() 
                : activeTab === 'support' ? renderSupportManagement()
                : activeTab === 'campaigns' ? renderCampaignsManagement()
                : renderSettingsManagement()}
            </div>
            
            <div className="text-center pt-4">
                 <button
                    onClick={onBack}
                    className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors no-print"
                >
                    &larr; Volver a la lista principal
                </button>
            </div>

            {viewingReportDetail && (
                <ReportDetailModal
                    isOpen={!!viewingReportDetail}
                    onClose={() => setViewingReportDetail(null)}
                    report={viewingReportDetail.report}
                    pet={viewingReportDetail.pet}
                    isDeleted={viewingReportDetail.isDeleted}
                    onDeletePet={onDeletePet}
                />
            )}
            {viewingTicket && (
                <SupportTicketModal
                    isOpen={!!viewingTicket}
                    onClose={() => setViewingTicket(null)}
                    ticket={viewingTicket}
                    onUpdate={onUpdateSupportTicket}
                    allUsers={users}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
