
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { User, SupportTicket, SupportTicketCategory, SupportTicketStatus, Report, ReportStatus } from '@/types';
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_STATUS, REPORT_STATUS } from '@/constants';
import { FlagIcon, ChatBubbleIcon, UserIcon, CheckCircleIcon, XCircleIcon, InfoIcon, TrashIcon, WarningIcon } from '@/shared/components/icons';
import { SecurityDisclaimer } from '@/shared';

interface SupportPageProps {
    currentUser: User;
    userTickets: SupportTicket[];
    userReports: Report[];
    onAddTicket: (category: SupportTicketCategory, subject: string, description: string) => void;
    onBack: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ currentUser, userTickets, userReports, onAddTicket, onBack }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'tickets' | 'reports'>('tickets');
    const [category, setCategory] = useState<SupportTicketCategory>(SUPPORT_TICKET_CATEGORIES.GENERAL_INQUIRY);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check URL parameter to set active tab
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'reports') {
            setActiveTab('reports');
            // Clean up URL parameter after reading it
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Filter tickets to only show direct inquiries in the "Tickets" tab (exclude report follow-ups)
    const directTickets = userTickets.filter(t => t.category !== SUPPORT_TICKET_CATEGORIES.REPORT_FOLLOWUP);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!subject.trim() || !description.trim()) {
            setError('Por favor, completa el asunto y la descripción.');
            return;
        }
        setIsSubmitting(true);
        // Simulate async operation
        setTimeout(() => {
            onAddTicket(category, subject, description);
            setSubject('');
            setDescription('');
            setCategory(SUPPORT_TICKET_CATEGORIES.GENERAL_INQUIRY);
            setIsSubmitting(false);
        }, 500);
    };

    const getTicketStatusClass = (status: SupportTicketStatus) => {
        switch (status) {
            case SUPPORT_TICKET_STATUS.PENDING: return 'bg-yellow-50 text-brand-secondary border-yellow-200';
            case SUPPORT_TICKET_STATUS.IN_PROGRESS: return 'bg-brand-light text-brand-primary border-card-border';
            case SUPPORT_TICKET_STATUS.RESOLVED: return 'bg-green-50 text-status-found border-green-200';
            case SUPPORT_TICKET_STATUS.NOT_RESOLVED: return 'bg-red-50 text-status-lost border-red-200';
            default: return 'bg-gray-100 text-text-sub';
        }
    }

    const getReportStatusBadge = (status: ReportStatus) => {
        switch (status) {
            case REPORT_STATUS.PENDING: 
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-50 text-brand-secondary border border-yellow-200 flex items-center gap-1"><InfoIcon className="h-3 w-3"/> Pendiente</span>;
            case REPORT_STATUS.ELIMINATED: 
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-50 text-status-lost border border-red-200 flex items-center gap-1"><TrashIcon className="h-3 w-3"/> Eliminado</span>;
            case REPORT_STATUS.INVALID: 
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-text-sub border border-gray-300 flex items-center gap-1"><XCircleIcon className="h-3 w-3"/> Desestimado</span>;
            case REPORT_STATUS.NO_ACTION: 
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-brand-light text-brand-primary border border-card-border flex items-center gap-1"><CheckCircleIcon className="h-3 w-3"/> Revisado</span>;
            default: 
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-text-sub">{status}</span>;
        }
    }
    
    const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900 shadow-sm";

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
                    <h2 className="text-3xl font-bold text-brand-dark mb-2">Centro de Soporte</h2>
                    <p className="text-gray-500">Estamos aquí para ayudarte. Crea un ticket o revisa tus reportes.</p>
                </div>

                {/* Information Banner */}
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-start gap-3">
                        <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-sm text-blue-800">
                            <p className="font-semibold mb-2">¿Qué puedes reportar?</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>Publicaciones:</strong> Contenido inapropiado, información falsa, o publicaciones que violen nuestros términos.</li>
                                <li><strong>Comentarios:</strong> Comentarios ofensivos, spam, o que no cumplan con nuestras normas.</li>
                                <li><strong>Usuarios:</strong> Comportamiento sospechoso, acoso, o actividad fraudulenta.</li>
                            </ul>
                            <p className="mt-2">
                                <strong>Proceso:</strong> Todos los reportes son revisados por nuestro equipo de moderación. El tiempo de respuesta estimado es de 24-48 horas. Te notificaremos sobre el resultado de tu reporte.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`flex-1 py-4 text-sm font-bold text-center border-b-4 transition-all ${
                            activeTab === 'tickets'
                                ? 'border-brand-primary text-brand-primary bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🎫 Mis Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex-1 py-4 text-sm font-bold text-center border-b-4 transition-all ${
                            activeTab === 'reports'
                                ? 'border-brand-primary text-brand-primary bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🚩 Mis Reportes
                    </button>
                </div>

                <div className="p-6 bg-gray-50 min-h-[500px]">
                    {activeTab === 'tickets' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Create Ticket Form */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="bg-brand-primary text-white rounded-full p-1"><InfoIcon className="h-4 w-4"/></span>
                                        Crear Nuevo Ticket
                                    </h3>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded-r">{error}</div>}
                                        <div>
                                            <label htmlFor="category" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Categoría</label>
                                            <select
                                                id="category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                                                className={inputClass}
                                            >
                                                {Object.values(SUPPORT_TICKET_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="subject" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Asunto</label>
                                            <input
                                                type="text"
                                                id="subject"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className={inputClass}
                                                placeholder="Ej: Error al subir foto"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Descripción</label>
                                            <textarea
                                                id="description"
                                                rows={5}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className={inputClass}
                                                placeholder="Detalla tu problema aquí..."
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-3 px-6 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            {isSubmitting ? 'Enviando...' : 'Enviar Ticket'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Ticket History */}
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Historial de Consultas</h3>
                                {directTickets.length > 0 ? (
                                    <div className="space-y-4">
                                        {directTickets.map(ticket => (
                                            <div key={ticket.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-brand-dark text-lg">{ticket.subject}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Ticket #{ticket.id.slice(0,8)} • {ticket.category} • {new Date(ticket.timestamp).toLocaleDateString('es-ES')}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getTicketStatusClass(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 border border-gray-100">
                                                    {ticket.description}
                                                </div>
                                                
                                                {ticket.response ? (
                                                    <div className="mt-3 pl-4 border-l-4 border-brand-secondary bg-yellow-50 p-3 rounded-r-lg">
                                                        <h5 className="text-xs font-bold text-brand-dark uppercase mb-1 flex items-center gap-1">
                                                            <UserIcon className="h-3 w-3" /> Respuesta del Equipo
                                                        </h5>
                                                        <p className="text-sm text-text-main">{ticket.response}</p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 text-xs text-icon-gray italic flex items-center gap-1">
                                                        <InfoIcon className="h-3 w-3" /> Esperando respuesta de un administrador...
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                        <div className="text-gray-300 mb-3 flex justify-center"><ChatBubbleIcon className="h-12 w-12" /></div>
                                        <p className="text-lg text-gray-500 font-medium">No tienes tickets abiertos.</p>
                                        <p className="text-sm text-gray-400">Si tienes alguna duda, usa el formulario.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-end mb-6 border-b pb-2">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Historial de Reportes</h3>
                                    <p className="text-sm text-gray-600 mt-1">Seguimiento de tus reportes sobre contenido inapropiado o usuarios.</p>
                                </div>
                                <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Total: {userReports.length}</span>
                            </div>
                            
                            {userReports.length > 0 ? (
                                <div className="space-y-6">
                                    {userReports.map(report => {
                                        // Find the linked support ticket to show the automated response
                                        const linkedTicket = userTickets.find(t => t.relatedReportId === report.id);
                                        const hasResponse = linkedTicket && linkedTicket.response;
                                        
                                        return (
                                            <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                                {/* Header */}
                                                <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${
                                                            report.type === 'post' ? 'bg-red-50 text-status-lost' : 
                                                            report.type === 'comment' ? 'bg-brand-light text-brand-primary' : 
                                                            'bg-status-adoption/20 text-status-adoption'
                                                        }`}>
                                                            {report.type === 'post' ? <FlagIcon className="h-5 w-5" /> : 
                                                             report.type === 'comment' ? <ChatBubbleIcon className="h-5 w-5" /> : 
                                                             <UserIcon className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-gray-900 block uppercase tracking-wide text-xs">
                                                                {report.type === 'post' ? 'Publicación' : report.type === 'comment' ? 'Comentario' : 'Usuario'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">ID: {report.targetId.slice(0,8)}...</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        {getReportStatusBadge(report.status)}
                                                        <span className="text-xs text-gray-400 mt-1">{new Date(report.timestamp).toLocaleString('es-ES')}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="p-5">
                                                    <div className="mb-4">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Motivo del Reporte</p>
                                                        <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 
                                                            {report.reason}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1 italic bg-gray-50 p-2 rounded border border-gray-100">
                                                            "{report.details}"
                                                        </p>
                                                    </div>

                                                    {/* Resolution / Response Section */}
                                                    {hasResponse ? (
                                                        <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                                                            report.status === REPORT_STATUS.ELIMINATED 
                                                                ? 'bg-red-50 border-red-500' 
                                                                : 'bg-blue-50 border-blue-500'
                                                        }`}>
                                                            <h5 className={`text-xs font-bold uppercase mb-2 flex items-center gap-2 ${
                                                                report.status === REPORT_STATUS.ELIMINATED ? 'text-red-800' : 'text-blue-800'
                                                            }`}>
                                                                {report.status === REPORT_STATUS.ELIMINATED 
                                                                    ? <><TrashIcon className="h-4 w-4"/> Acción Tomada: Contenido Eliminado</>
                                                                    : <><InfoIcon className="h-4 w-4"/> Resolución del Equipo</>
                                                                }
                                                            </h5>
                                                            <p className="text-sm text-gray-800 leading-relaxed">
                                                                {linkedTicket.response}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 p-3 bg-yellow-50 text-brand-secondary text-sm rounded flex items-center gap-2">
                                                            <div className="animate-pulse h-2 w-2 bg-brand-secondary rounded-full"></div>
                                                            Tu reporte está siendo revisado por nuestro equipo de moderación.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                    <div className="text-gray-300 mb-3 flex justify-center"><FlagIcon className="h-12 w-12" /></div>
                                    <p className="text-lg text-gray-500 font-medium">No has realizado ningún reporte.</p>
                                    <p className="text-sm text-gray-400">Gracias por ayudar a mantener segura la comunidad.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center pt-4 pb-8">
                 <button
                    onClick={onBack}
                    className="py-2 px-6 bg-white text-gray-700 font-bold rounded-full hover:bg-gray-100 transition-all shadow-sm border border-gray-300 hover:shadow-md flex items-center gap-2 mx-auto"
                >
                    &larr; Volver al Inicio
                </button>
            </div>
        </div>
    );
};

export default SupportPage;
