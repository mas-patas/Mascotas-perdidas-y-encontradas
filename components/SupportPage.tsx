import React, { useState } from 'react';
import type { User, SupportTicket, SupportTicketCategory, SupportTicketStatus } from '../types';
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_STATUS } from '../constants';

interface SupportPageProps {
    currentUser: User;
    userTickets: SupportTicket[];
    onAddTicket: (category: SupportTicketCategory, subject: string, description: string) => void;
    onBack: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ currentUser, userTickets, onAddTicket, onBack }) => {
    const [category, setCategory] = useState<SupportTicketCategory>(SUPPORT_TICKET_CATEGORIES.GENERAL_INQUIRY);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const getStatusClass = (status: SupportTicketStatus) => {
        switch (status) {
            case SUPPORT_TICKET_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case SUPPORT_TICKET_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            case SUPPORT_TICKET_STATUS.RESOLVED: return 'bg-green-100 text-green-800';
            case SUPPORT_TICKET_STATUS.NOT_RESOLVED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-brand-dark mb-1">Centro de Soporte y Ayuda</h2>
                <p className="text-gray-500 mb-6">¿Tienes alguna pregunta, problema o sugerencia? Envíanos un ticket.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                     {error && <div className="bg-red-100 border-red-400 text-red-700 p-3 rounded-md text-sm">{error}</div>}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                            className={`${inputClass} mt-1`}
                        >
                            {Object.values(SUPPORT_TICKET_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Asunto</label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className={`${inputClass} mt-1`}
                            placeholder="Ej: Problema al iniciar sesión"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            id="description"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${inputClass} mt-1`}
                            placeholder="Describe tu problema o consulta con el mayor detalle posible."
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                         <button
                            type="submit"
                            disabled={isSubmitting}
                            className="py-2 px-6 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Ticket'}
                        </button>
                    </div>
                </form>
            </div>

            {/* History Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-2xl font-semibold text-gray-700 mb-4">Historial de Mis Tickets</h3>
                 {userTickets.length > 0 ? (
                    <div className="space-y-4">
                        {userTickets.map(ticket => (
                            <div key={ticket.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                    <h4 className="font-bold text-brand-dark">{ticket.subject}</h4>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    <span className="font-medium">{ticket.category}</span> - Creado el {new Date(ticket.timestamp).toLocaleString('es-ES')}
                                </p>
                                <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                                
                                {ticket.response && (
                                    <div className="mt-3 pt-3 border-t">
                                        <h5 className="text-sm font-semibold text-gray-800 mb-1">Respuesta del Equipo de Soporte:</h5>
                                        <blockquote className="text-sm text-gray-800 p-3 bg-blue-50 border-l-2 border-blue-300 rounded-r-md">
                                            {ticket.response}
                                        </blockquote>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-500">No has enviado ningún ticket de soporte todavía.</p>
                    </div>
                 )}
            </div>

            <div className="text-center pt-4">
                 <button
                    onClick={onBack}
                    className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    &larr; Volver a la lista principal
                </button>
            </div>
        </div>
    );
};

export default SupportPage;