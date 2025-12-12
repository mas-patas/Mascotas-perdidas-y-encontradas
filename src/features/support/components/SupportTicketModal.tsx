import React, { useState, useEffect, useRef } from 'react';
import type { SupportTicketRow, SupportTicketStatus, User, UserRole } from '@/types';
import { SUPPORT_TICKET_STATUS, USER_ROLES } from '@/constants';
import { useAuth } from '@/contexts/auth';
import { ConfirmationModal } from '@/shared';
import { useCreateNotification } from '@/api';
import * as usersApi from '@/api/users/users.api';
import { generateUUID } from '@/utils/uuid';
import { useQueryClient } from '@tanstack/react-query';

interface SupportTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: SupportTicketRow;
    onUpdate: (ticket: SupportTicketRow) => void;
    allUsers: User[];
}

const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose, ticket, onUpdate, allUsers }) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const createNotification = useCreateNotification();
    const [status, setStatus] = useState<SupportTicketStatus>(ticket.status as SupportTicketStatus || SUPPORT_TICKET_STATUS.PENDING);
    const [response, setResponse] = useState(ticket.response || '');
    const [assignedTo, setAssignedTo] = useState(ticket.assigned_to || '');
    const [showResolvedConfirmation, setShowResolvedConfirmation] = useState(false);
    const initialStatusRef = useRef<SupportTicketStatus>(ticket.status as SupportTicketStatus || SUPPORT_TICKET_STATUS.PENDING);
    const hasBeenAssignedRef = useRef(false);

    useEffect(() => {
        if (isOpen && currentUser && !hasBeenAssignedRef.current) {
            // Auto-assign if the ticket is pending and not yet assigned
            if ((ticket.status === SUPPORT_TICKET_STATUS.PENDING || !ticket.assigned_to) && !ticket.assigned_to) {
                const now = new Date().toISOString();
                const assignmentHistory = Array.isArray(ticket.assignment_history) 
                    ? ticket.assignment_history 
                    : (ticket.assignment_history ? [ticket.assignment_history] : []);
                
                const updatedTicket: SupportTicketRow = {
                    ...ticket,
                    status: SUPPORT_TICKET_STATUS.PENDING, // Keep as pending initially
                    assigned_to: currentUser.email,
                    assignment_history: [
                        ...assignmentHistory,
                        { adminEmail: currentUser.email, timestamp: now },
                    ] as any,
                };
                onUpdate(updatedTicket);
                hasBeenAssignedRef.current = true;
            } else if (ticket.assigned_to) {
                hasBeenAssignedRef.current = true;
            }
        }
    }, [isOpen, currentUser, ticket.id]);
    
    useEffect(() => {
        // Reset local state when ticket prop changes
        const ticketStatus = ticket.status as SupportTicketStatus || SUPPORT_TICKET_STATUS.PENDING;
        setStatus(ticketStatus);
        setResponse(ticket.response || '');
        setAssignedTo(ticket.assigned_to || '');
        initialStatusRef.current = ticketStatus;
        hasBeenAssignedRef.current = !!ticket.assigned_to;
    }, [ticket]);

    if (!isOpen) return null;

    const user = allUsers.find(u => u.email === ticket.user_email);
    const admins = allUsers.filter(u => u.role === USER_ROLES.ADMIN || u.role === USER_ROLES.SUPERADMIN);
    const canManage = currentUser && ([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN] as UserRole[]).includes(currentUser.role);
    const assignedUser = ticket.assigned_to ? allUsers.find(u => u.email === ticket.assigned_to) : null;

    const handleClose = () => {
        // If status is still pending and no changes were saved, auto-change to Not Resolved
        // Only if the ticket was initially pending and we haven't made any changes
        const hasChanges = status !== initialStatusRef.current || response !== (ticket.response || '');
        if (!hasChanges && initialStatusRef.current === SUPPORT_TICKET_STATUS.PENDING && status === SUPPORT_TICKET_STATUS.PENDING) {
            const updatedTicket: SupportTicketRow = {
                ...ticket,
                status: SUPPORT_TICKET_STATUS.NOT_RESOLVED,
            };
            onUpdate(updatedTicket);
        }
        hasBeenAssignedRef.current = false;
        onClose();
    };

    const handleSaveChanges = async () => {
        if (!currentUser) return;
        
        // If status is pending, show confirmation dialog
        if (status === SUPPORT_TICKET_STATUS.PENDING && initialStatusRef.current === SUPPORT_TICKET_STATUS.PENDING) {
            setShowResolvedConfirmation(true);
            return;
        }

        await saveTicketChanges();
    };

    const saveTicketChanges = async (resolved: boolean = false) => {
        if (!currentUser) return;
        const now = new Date().toISOString();

        let finalStatus = status;
        let finalAssignedTo = assignedTo || ticket.assigned_to || currentUser.email;

        // If user confirmed resolution
        if (resolved) {
            finalStatus = SUPPORT_TICKET_STATUS.RESOLVED;
        } else if (status === SUPPORT_TICKET_STATUS.PENDING) {
            // If user said no to resolved, change to in progress and assign to current user
            finalStatus = SUPPORT_TICKET_STATUS.IN_PROGRESS;
            finalAssignedTo = currentUser.email;
        }

        const assignmentHistory = Array.isArray(ticket.assignment_history) 
            ? ticket.assignment_history 
            : (ticket.assignment_history ? [ticket.assignment_history] : []);

        const updatedTicket: SupportTicketRow = {
            ...ticket,
            status: finalStatus,
            response: response || ticket.response,
            assigned_to: finalAssignedTo,
            assignment_history: finalAssignedTo !== ticket.assigned_to
                ? [...assignmentHistory, { adminEmail: finalAssignedTo, timestamp: now }] as any
                : ticket.assignment_history,
        };
        
        // Update ticket first
        onUpdate(updatedTicket);

        // Send notification to user about the solution - do this immediately and wait for it
        try {
            const ticketUser = allUsers.find(u => u.email === ticket.user_email);
            let ticketUserId = ticketUser?.id;
            
            if (!ticketUserId) {
                const fetchedUser = await usersApi.getUserByEmail(ticket.user_email || '');
                ticketUserId = fetchedUser?.id;
            }
            
            if (ticketUserId) {
                let notificationMessage = '';
                if (finalStatus === SUPPORT_TICKET_STATUS.RESOLVED) {
                    notificationMessage = `Tu ticket de soporte "${ticket.subject}" ha sido resuelto. ${response ? 'Respuesta: ' + response : ''}`;
                } else if (finalStatus === SUPPORT_TICKET_STATUS.IN_PROGRESS) {
                    notificationMessage = `Tu ticket de soporte "${ticket.subject}" está siendo procesado.`;
                } else if (finalStatus === SUPPORT_TICKET_STATUS.NOT_RESOLVED) {
                    notificationMessage = `Tu ticket de soporte "${ticket.subject}" ha sido marcado como no resuelto.`;
                } else {
                    notificationMessage = `El estado de tu ticket de soporte "${ticket.subject}" ha sido actualizado a: ${finalStatus}.`;
                }
                
                // Use the mutation hook which handles query invalidation properly
                await createNotification.mutateAsync({
                    id: generateUUID(),
                    userId: ticketUserId,
                    message: notificationMessage,
                    link: 'support'
                });
                
                // Force immediate refresh of notifications for the user
                // This ensures the notification appears immediately in the bell icon
                queryClient.invalidateQueries({ 
                    queryKey: ['notifications', ticketUserId],
                    refetchType: 'active' // Only refetch active queries
                });
            }
        } catch (error) {
            console.error('Error creating notification for ticket user:', error);
            // Don't block the modal close if notification fails
        }

        setShowResolvedConfirmation(false);
        hasBeenAssignedRef.current = false;
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

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
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

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-brand-dark">Detalle del Ticket de Soporte</h2>
                        <p className="text-sm text-gray-500">{ticket.subject || 'Sin asunto'}</p>
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Información del Usuario</h3>
                            <div className="text-sm text-gray-700 p-3 bg-gray-50 border rounded-md space-y-1">
                                <p><strong>Usuario:</strong> {user ? (
                                    <button 
                                        onClick={() => {
                                            // We need to pass onViewUser from parent, but for now just show email
                                            window.location.href = `#/perfil/${user.email}`;
                                        }}
                                        className="text-brand-primary hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                                    >
                                        @{user.username || user.email}
                                    </button>
                                ) : 'N/A'}</p>
                                <p><strong>Email:</strong> {ticket.user_email || 'N/A'}</p>
                                <p><strong>Fecha de Creación:</strong> {formatDateTime(ticket.timestamp || ticket.created_at)}</p>
                                <p><strong>Categoría:</strong> {ticket.category || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Descripción del Problema</h3>
                            <blockquote className="text-sm text-gray-800 p-3 bg-gray-50 border-l-2 border-gray-300 rounded-r-md whitespace-pre-wrap">
                                {ticket.description || 'Sin descripción'}
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
                                    <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                                    <div className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm">
                                        {assignedUser ? `@${assignedUser.username || assignedUser.email}` : (ticket.assigned_to || 'Sin asignar')}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">La asignación no puede ser modificada</p>
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
                        
                        {canManage && ticket.assignment_history && Array.isArray(ticket.assignment_history) && ticket.assignment_history.length > 0 && (
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-gray-800 mb-2">Historial de Asignación</h3>
                                <ul className="text-xs text-gray-500 space-y-1 max-h-24 overflow-y-auto">
                                    {ticket.assignment_history.map((entry: any, index: number) => {
                                        const adminUser = allUsers.find(u => u.email === entry.adminEmail);
                                        return (
                                            <li key={index}>
                                                <span className="font-medium">@{adminUser?.username || entry.adminEmail}</span> - {formatDateTime(entry.timestamp)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button onClick={handleClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSaveChanges} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark">Guardar Cambios</button>
                    </div>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={showResolvedConfirmation}
                onClose={() => setShowResolvedConfirmation(false)}
                onConfirm={() => saveTicketChanges(true)}
                title="¿Se solucionó el problema?"
                message="¿El problema del usuario ha sido resuelto?"
                confirmText="Sí"
                cancelText="No"
                onCancel={() => saveTicketChanges(false)}
            />
        </>
    );
};

export default SupportTicketModal;
