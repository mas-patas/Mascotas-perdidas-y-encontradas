import React, { useState, useEffect } from 'react';
import type { SupportTicket, SupportTicketStatus, User, UserRole } from '../types';
import { SUPPORT_TICKET_STATUS, USER_ROLES } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface SupportTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: SupportTicket;
    onUpdate: (ticket: SupportTicket) => void;
    allUsers: User[];
}

const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose, ticket, onUpdate, allUsers }) => {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState(ticket.status);
    const [response, setResponse] = useState(ticket.response || '');
    const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || '');

    useEffect(() => {
        if (isOpen && currentUser) {
            // Auto-assign if the ticket is pending
            if (ticket.status === SUPPORT_TICKET_STATUS.PENDING) {
                const now = new Date().toISOString();
                const updatedTicket: SupportTicket = {
                    ...ticket,
                    status: SUPPORT_TICKET_STATUS.IN_PROGRESS,
                    assignedTo: currentUser.email,
                    assignmentHistory: [
                        ...(ticket.assignmentHistory || []),
                        { adminEmail: currentUser.email, timestamp: now },
                    ],
                };
                onUpdate(updatedTicket);
            }
        }
    }, [isOpen, currentUser, ticket.status]);
    
    useEffect(() => {
        // Reset local state when ticket prop changes
        setStatus(ticket.status);
        setResponse(ticket.response || '');
        setAssignedTo(ticket.assignedTo || '');
    }, [ticket]);

    if (!isOpen) return null;

    const user = allUsers.find(u => u.email === ticket.userEmail);
    const admins = allUsers.filter(u => u.role === USER_ROLES.ADMIN || u.role === USER_ROLES.SUPERADMIN);
    // FIX: Cast array to UserRole[] to allow .includes() to check against the broader UserRole type of currentUser.role.
    const canManage = currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);

    const handleSaveChanges = () => {
        if (!currentUser) return;
        const now = new Date().toISOString();

        const updatedTicket: SupportTicket = {
            ...ticket,
            status,
            response,
            assignedTo,
            // Add to history only if the assignment changes
            assignmentHistory: ticket.assignedTo !== assignedTo
                ? [...(ticket.assignmentHistory || []), { adminEmail: assignedTo, timestamp: now }]
                : ticket.assignmentHistory,
        };
        onUpdate(updatedTicket);
        onClose();
    };

    const getStatusClass = (s: SupportTicketStatus) => {
        switch (s) {
            case SUPPORT_TICKET_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
            case SUPPORT_TICKET_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            case SUPPORT_TICKET_STATUS.RESOLVED: return 'bg-green-100 text-green-800';
            case SUPPORT_TICKET_STATUS.NOT_RESOLVED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-brand-dark">Detalle del Ticket de Soporte</h2>
                    <p className="text-sm text-gray-500">{ticket.subject}</p>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Información del Usuario</h3>
                        <div className="text-sm text-gray-700 p-3 bg-gray-50 border rounded-md space-y-1">
                            <p><strong>Usuario:</strong> @{user?.username || 'N/A'}</p>
                            <p><strong>Email:</strong> {ticket.userEmail}</p>
                            <p><strong>Fecha de Creación:</strong> {new Date(ticket.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Descripción del Problema</h3>
                        <blockquote className="text-sm text-gray-800 p-3 bg-gray-50 border-l-2 border-gray-300 rounded-r-md">
                            {ticket.description}
                        </blockquote>
                    </div>
                    
                     <div className="pt-4 border-t">
                        <h3 className="font-semibold text-gray-800 mb-2">Gestionar Ticket</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as SupportTicketStatus)}
                                    className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-primary text-sm font-medium ${getStatusClass(status)}`}
                                >
                                    {Object.values(SUPPORT_TICKET_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Asignar a</label>
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-primary"
                                >
                                    <option value="">Sin asignar</option>
                                    {admins.map(admin => (
                                        <option key={admin.email} value={admin.email}>@{admin.username || admin.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Respuesta para el usuario</label>
                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                rows={4}
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-primary"
                                placeholder="Escribe una respuesta clara y concisa..."
                            />
                        </div>
                    </div>
                    
                    {canManage && ticket.assignmentHistory && ticket.assignmentHistory.length > 0 && (
                        <div className="pt-4 border-t">
                            <h3 className="font-semibold text-gray-800 mb-2">Historial de Asignación</h3>
                            <ul className="text-xs text-gray-500 space-y-1 max-h-24 overflow-y-auto">
                                {ticket.assignmentHistory.map((entry, index) => {
                                    const adminUser = allUsers.find(u => u.email === entry.adminEmail);
                                    return (
                                        <li key={index}>
                                            <span className="font-medium">@{adminUser?.username || entry.adminEmail}</span> - {new Date(entry.timestamp).toLocaleString()}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSaveChanges} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketModal;