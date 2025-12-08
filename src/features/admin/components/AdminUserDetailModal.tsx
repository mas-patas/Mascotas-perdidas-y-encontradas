
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Pet, Chat, UserStatus, UserRole } from '@/types';
import { useAuth } from '@/contexts/auth';
import { USER_ROLES, USER_STATUS } from '@/constants';
import { InfoIcon, EditIcon } from '@/shared/components/icons';
import { ContactRequestersModal } from '@/shared';

interface AdminUserDetailModalProps {
    user: User;
    allPets: Pet[];
    allChats: Chat[];
    allUsers: User[];
    onClose: () => void;
    onUpdateStatus: (email: string, status: UserStatus) => void;
    onUpdateRole: (email: string, role: UserRole) => void;
    onStartChat: (recipientEmail: string) => void;
    onGhostLogin?: (user: User) => void;
    onViewUser: (user: User) => void;
}

const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({ user, allPets, allChats, allUsers, onClose, onUpdateStatus, onUpdateRole, onStartChat, onGhostLogin, onViewUser }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'details' | 'posts' | 'messages'>('details');
    const [isEditing, setIsEditing] = useState(false);
    
    // Validate user object - must be done after hooks
    const safeUser = user && user.email && user.role ? user : null;
    
    const [editableUser, setEditableUser] = useState({
        role: user?.role || USER_ROLES.USER,
        status: user?.status || USER_STATUS.ACTIVE,
    });
    const [viewingContactRequesters, setViewingContactRequesters] = useState<Pet | null>(null);
    
    useEffect(() => {
        // Reset state if the user prop changes (e.g., opening a new user modal)
        if (user && user.email && user.role) {
            setEditableUser({
                role: user.role,
                status: user.status || USER_STATUS.ACTIVE,
            });
            setIsEditing(false);
            setActiveTab('details');
        }
    }, [user]);
    
    // Early return after all hooks
    if (!safeUser) {
        console.error('AdminUserDetailModal: Invalid user object', user);
        return null;
    }

    const canEditRole = currentUser?.role === USER_ROLES.SUPERADMIN && currentUser.email !== safeUser.email;

    const userPosts = useMemo(() => {
        if (!safeUser?.email) return [];
        return allPets.filter(p => p.userEmail === safeUser.email);
    }, [allPets, safeUser?.email]);
    
    const userSentMessages = useMemo(() => {
        if (!safeUser?.email) return [];
        return allChats
            .filter(chat => {
                const participantEmails = (chat as any).participant_emails || (chat as any).participantEmails || [];
                return Array.isArray(participantEmails) && participantEmails.includes(safeUser.email);
            })
            .flatMap(chat => {
                const participantEmails = (chat as any).participant_emails || (chat as any).participantEmails || [];
                const otherUserEmail = participantEmails.find((email: string) => email !== safeUser.email);
                const petId = (chat as any).pet_id || (chat as any).petId;
                const pet = petId ? allPets.find(p => p.id === petId) : null;
                const messages = (chat as any).messages || [];
                return messages
                    .filter((message: any) => {
                        const senderEmail = message.sender_email || message.senderEmail;
                        return message && senderEmail === safeUser.email;
                    })
                    .map((message: any) => {
                        const timestamp = message.timestamp || message.created_at;
                        return {
                            ...message,
                            chatId: chat.id,
                            recipientEmail: otherUserEmail,
                            petContext: pet,
                            timestamp: timestamp,
                            text: message.text,
                        };
                    });
            })
            .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });
    }, [allChats, allPets, safeUser?.email]);

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
            case USER_STATUS.INACTIVE: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleCancel = () => {
        setEditableUser({
            role: safeUser.role,
            status: safeUser.status || USER_STATUS.ACTIVE,
        });
        setIsEditing(false);
    };

    const handleSaveChanges = () => {
        if (editableUser.role !== safeUser.role) {
            onUpdateRole(safeUser.email, editableUser.role);
        }
        const originalStatus = safeUser.status || USER_STATUS.ACTIVE;
        if (editableUser.status !== originalStatus) {
            onUpdateStatus(safeUser.email, editableUser.status);
        }
        setIsEditing(false);
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableUser(prev => ({ ...prev, [name]: value as UserRole | UserStatus }));
    };

    const TabButton: React.FC<{ tabName: 'details' | 'posts' | 'messages'; label: string; count: number }> = ({ tabName, label, count }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tabName ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
            {label} <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">{count}</span>
        </button>
    );

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
                onClick={onClose}
            >
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 relative border-b">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold text-brand-dark mb-1">Perfil de Usuario</h2>
                        <p className="text-gray-500">@{safeUser.username || 'N/A'}</p>
                    </div>

                    <nav className="flex space-x-4 px-6 border-b">
                        <TabButton tabName="details" label="Detalles" count={1} />
                        <TabButton tabName="posts" label="Publicaciones" count={userPosts.length} />
                        <TabButton tabName="messages" label="Mensajes Enviados" count={userSentMessages.length} />
                    </nav>

                    <div className="p-6 overflow-y-auto flex-grow">
                        {activeTab === 'details' && (
                             <div className="space-y-4 text-gray-700">
                                 <div className="flex justify-between items-center">
                                     <h3 className="text-lg font-semibold text-gray-800">Información del Usuario</h3>
                                     {!isEditing && (
                                         <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm py-2 px-3 bg-blue-100 text-brand-primary rounded-lg hover:bg-blue-200 transition-colors">
                                             <EditIcon /> Editar
                                         </button>
                                     )}
                                 </div>
                                 <div className="space-y-3 p-4 border rounded-md bg-gray-50">
                                    <p><span className="font-semibold text-gray-800 w-28 inline-block">Nombre:</span> {safeUser.firstName || 'N/A'} {safeUser.lastName || 'N/A'}</p>
                                    <p><span className="font-semibold text-gray-800 w-28 inline-block">Usuario:</span> @{safeUser.username || 'N/A'}</p>
                                    <p><span className="font-semibold text-gray-800 w-28 inline-block">Email:</span> {safeUser.email}</p>
                                    <p><span className="font-semibold text-gray-800 w-28 inline-block">DNI:</span> {safeUser.dni || 'No registrado'}</p>
                                    <p><span className="font-semibold text-gray-800 w-28 inline-block">Teléfono:</span> {safeUser.phone || 'No registrado'}</p>
                                    {safeUser.birthDate && <p><span className="font-semibold text-gray-800 w-28 inline-block">Cumpleaños:</span> {new Date(safeUser.birthDate + 'T00:00:00').toLocaleDateString()}</p>}
                                    <div className="flex items-center">
                                        <span className="font-semibold text-gray-800 w-28 inline-block">Rol:</span>
                                        {isEditing && canEditRole ? (
                                            <select
                                                name="role"
                                                value={editableUser.role}
                                                onChange={handleFieldChange}
                                                className="p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary bg-white text-gray-900"
                                            >
                                                {Object.values(USER_ROLES).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="relative group flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-sm font-semibold rounded-full ${getRoleClass(safeUser.role)}`}>
                                                    {safeUser.role}
                                                </span>
                                                {!canEditRole && (
                                                    <>
                                                        <InfoIcon />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                            {currentUser?.email === safeUser.email 
                                                                ? "No puedes cambiar tu propio rol."
                                                                : "Solo Superadmins pueden cambiar roles."
                                                            }
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-semibold text-gray-800 w-28 inline-block">Estado:</span>
                                         {isEditing ? (
                                            <select
                                                name="status"
                                                value={editableUser.status}
                                                onChange={handleFieldChange}
                                                className="p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary bg-white text-gray-900"
                                            >
                                                {Object.values(USER_STATUS).map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-0.5 text-sm font-semibold rounded-full ${getStatusClass(safeUser.status)}`}>
                                                {safeUser.status || 'Activo'}
                                            </span>
                                        )}
                                    </div>
                                 </div>
                                 
                                 {isEditing ? (
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={handleCancel} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                                        <button onClick={handleSaveChanges} className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark">Guardar Cambios</button>
                                    </div>
                                 ) : (
                                     <div className="mt-6 pt-4 border-t space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-800">Acciones de Moderación</h3>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button onClick={() => onStartChat(safeUser.email)} className="flex-1 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                                                Enviar Mensaje
                                            </button>
                                             <button 
                                                onClick={() => onUpdateStatus(safeUser.email, safeUser.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE)} 
                                                className={`flex-1 py-2 px-4 text-white font-semibold rounded-lg transition-colors ${safeUser.status === USER_STATUS.INACTIVE ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                                            >
                                                {safeUser.status === USER_STATUS.INACTIVE ? 'Reactivar Usuario' : 'Banear Usuario'}
                                            </button>
                                        </div>
                                        {onGhostLogin && (
                                            <button
                                                onClick={() => {
                                                    if (!safeUser || !safeUser.email) {
                                                        alert('Error: Usuario inválido. No se puede hacer ghost login.');
                                                        return;
                                                    }
                                                    onGhostLogin(safeUser);
                                                }}
                                                className="w-full mt-3 py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                                            >
                                                Iniciar sesión como este usuario
                                            </button>
                                        )}
                                    </div>
                                 )}
                            </div>
                        )}
                        {activeTab === 'posts' && (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {userPosts.length > 0 ? (
                                userPosts.map(pet => (
                                <div key={pet.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg border">
                                    <img src={pet.imageUrls && pet.imageUrls.length > 0 ? pet.imageUrls[0] : '/placeholder-pet.png'} alt={pet.name || 'Mascota'} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-800">{pet.name}</p>
                                            {pet.contactRequests && pet.contactRequests.length > 0 && (
                                                <button
                                                    onClick={() => setViewingContactRequesters(pet)}
                                                    className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full hover:bg-gray-300 hover:text-gray-800 transition"
                                                    title="Ver la lista de usuarios que solicitaron el contacto"
                                                >
                                                    {pet.contactRequests.length} vistas de contacto
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{pet.breed} - <span className="font-medium">{pet.status}</span></p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className="text-xs text-gray-400">{new Date(pet.date).toLocaleDateString()}</p>
                                        <button
                                            onClick={() => {
                                                onClose();
                                                navigate(`/mascota/${pet.id}`);
                                            }}
                                            className="text-xs font-semibold text-brand-primary bg-blue-100 px-3 py-1 rounded-lg hover:bg-blue-200 transition"
                                        >
                                            Ir a publicación
                                        </button>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-10">Este usuario no tiene publicaciones.</p>
                            )}
                            </div>
                        )}
                        {activeTab === 'messages' && (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {userSentMessages.length > 0 ? (
                                userSentMessages.map((message, index) => {
                                    const recipient = allUsers.find(u => u.email === message.recipientEmail);
                                    const messageTimestamp = message.timestamp || (message as any).created_at;
                                    return (
                                        <div key={`${message.chatId}-${messageTimestamp}-${index}`} className="p-3 bg-gray-50 rounded-lg border">
                                            <div className="flex justify-between items-start text-xs text-gray-500 mb-1">
                                                <span>
                                                    Para: <span className="font-semibold text-brand-primary">@{recipient?.username || message.recipientEmail || 'desconocido'}</span>
                                                </span>
                                                <span className="flex-shrink-0">{messageTimestamp ? new Date(messageTimestamp).toLocaleString('es-ES') : 'Sin fecha'}</span>
                                            </div>
                                            {message.petContext ? (
                                                <div className="text-xs text-gray-500 mb-2">
                                                    En chat sobre: <span className="font-medium">{message.petContext.name}</span>
                                                </div>
                                            ) : (
                                                 <div className="text-xs text-gray-500 mb-2">
                                                    Chat Administrativo
                                                </div>
                                            )}
                                            <blockquote className="text-sm text-gray-800 pl-3 border-l-2 border-gray-300">
                                                {message.text || (message as any).text || 'Sin texto'}
                                            </blockquote>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 text-center py-10">Este usuario no ha enviado ningún mensaje.</p>
                            )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 border-t text-right rounded-b-lg">
                        <button onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cerrar</button>
                    </div>
                </div>
            </div>
             {viewingContactRequesters && (
                <ContactRequestersModal
                    isOpen={!!viewingContactRequesters}
                    onClose={() => setViewingContactRequesters(null)}
                    requesterEmails={viewingContactRequesters.contactRequests || []}
                    allUsers={allUsers}
                    onViewUser={onViewUser}
                />
            )}
        </>
    );
};

export default AdminUserDetailModal;
