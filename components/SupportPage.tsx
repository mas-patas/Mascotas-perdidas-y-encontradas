
import React, { useState } from 'react';
import type { SupportTicketCategory, SupportTicketStatus, ReportStatus } from '../types';
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_STATUS, REPORT_STATUS } from '../constants';
import { FlagIcon, ChatBubbleIcon, UserIcon, CheckCircleIcon, XCircleIcon, InfoIcon, TrashIcon } from './icons';
import { useAdminData } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';

interface SupportPageProps {
    onBack: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ onBack }) => {
    const { currentUser } = useAuth();
    // Reusing the admin hook which filters by user if not admin, or we can rely on RLS/Backend
    // The hook inside useAdmin.ts filters by currentUser if not admin.
    const { supportTickets: userTickets, reports: userReports, refetchTickets } = useAdminData();
    
    const [activeTab, setActiveTab] = useState<'tickets' | 'reports'>('tickets');
    const [category, setCategory] = useState<SupportTicketCategory>(SUPPORT_TICKET_CATEGORIES.GENERAL_INQUIRY);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ... (Helper functions getTicketStatusClass, getReportStatusBadge same as before) ...
    const getTicketStatusClass = (status: SupportTicketStatus) => {
        switch (status) {
            case SUPPORT_TICKET_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case SUPPORT_TICKET_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
            case SUPPORT_TICKET_STATUS.RESOLVED: return 'bg-green-100 text-green-800 border-green-200';
            case SUPPORT_TICKET_STATUS.NOT_RESOLVED: return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const getReportStatusBadge = (status: ReportStatus) => {
        switch (status) {
            case REPORT_STATUS.PENDING: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1"><InfoIcon className="h-3 w-3"/> Pendiente</span>;
            case REPORT_STATUS.ELIMINATED: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1"><TrashIcon className="h-3 w-3"/> Eliminado</span>;
            case REPORT_STATUS.INVALID: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 border border-gray-300 flex items-center gap-1"><XCircleIcon className="h-3 w-3"/> Desestimado</span>;
            case REPORT_STATUS.NO_ACTION: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><CheckCircleIcon className="h-3 w-3"/> Revisado</span>;
            default: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    }

    // Direct tickets exclude report follow-ups
    const directTickets = userTickets.filter(t => t.category !== SUPPORT_TICKET_CATEGORIES.REPORT_FOLLOWUP);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!subject.trim() || !description.trim()) { setError('Completa los campos.'); return; }
        setIsSubmitting(true);
        
        // Dynamic import or passed prop would be better, but for now assuming direct supabase call or prop
        // We will assume onAddTicket logic is handled here
        const { supabase } = await import('../services/supabaseClient');
        const { generateUUID } = await import('../utils/uuid');
        
        await supabase.from('support_tickets').insert({ id: generateUUID(), user_email: currentUser?.email, category, subject, description, status: SUPPORT_TICKET_STATUS.PENDING });
        
        setSubject(''); setDescription(''); setIsSubmitting(false);
        refetchTickets();
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
                    <h2 className="text-3xl font-bold text-brand-dark mb-2">Centro de Soporte</h2>
                    <p className="text-gray-500">Estamos aquí para ayudarte. Crea un ticket o revisa tus reportes.</p>
                </div>
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('tickets')} className={`flex-1 py-4 text-sm font-bold text-center border-b-4 transition-all ${activeTab === 'tickets' ? 'border-brand-primary text-brand-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>🎫 Mis Tickets</button>
                    <button onClick={() => setActiveTab('reports')} className={`flex-1 py-4 text-sm font-bold text-center border-b-4 transition-all ${activeTab === 'reports' ? 'border-brand-primary text-brand-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>🚩 Mis Reportes</button>
                </div>

                <div className="p-6 bg-gray-50 min-h-[500px]">
                    {activeTab === 'tickets' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Crear Nuevo Ticket</h3>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && <div className="text-red-500 text-sm">{error}</div>}
                                        <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-2 border rounded">{Object.values(SUPPORT_TICKET_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}</select>
                                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto" className="w-full p-2 border rounded" />
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Descripción" className="w-full p-2 border rounded"></textarea>
                                        <button type="submit" disabled={isSubmitting} className="w-full bg-brand-primary text-white py-2 rounded font-bold hover:bg-brand-dark">{isSubmitting ? 'Enviando...' : 'Enviar Ticket'}</button>
                                    </form>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                {directTickets.map(ticket => (
                                    <div key={ticket.id} className="bg-white p-4 rounded-xl border shadow-sm">
                                        <div className="flex justify-between mb-2">
                                            <h4 className="font-bold text-brand-dark">{ticket.subject}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs ${getTicketStatusClass(ticket.status)}`}>{ticket.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                                        {ticket.response && <div className="bg-blue-50 p-2 rounded text-sm text-blue-900"><strong>Respuesta:</strong> {ticket.response}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {userReports.map(report => (
                                <div key={report.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800">{report.reason}</p>
                                        <p className="text-sm text-gray-500 italic">"{report.details}"</p>
                                    </div>
                                    <div className="text-right">
                                        {getReportStatusBadge(report.status)}
                                        <p className="text-xs text-gray-400 mt-1">{new Date(report.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="text-center pt-4 pb-8"><button onClick={onBack} className="text-gray-500 hover:text-gray-700">Volver al Inicio</button></div>
        </div>
    );
};

export default SupportPage;
