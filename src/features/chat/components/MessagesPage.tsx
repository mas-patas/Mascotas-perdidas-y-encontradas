
import React from 'react';
import type { ChatRow, PetRow, User, MessageRow } from '@/types';
import { formatTime } from '@/utils/formatters';
import { VerifiedBadge } from '@/shared';

interface MessagesPageProps {
    chats: (ChatRow & { isUnread: boolean })[];
    pets: PetRow[];
    users: User[];
    currentUser: User;
    onSelectChat: (chatId: string) => void;
    onBack: () => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ chats, pets, users, currentUser, onSelectChat, onBack }) => {
    const getChatDetails = (chat: ChatRow) => {
        const pet = chat.pet_id ? pets.find(p => p.id === chat.pet_id) : null;
        const participantEmails = chat.participant_emails || [];
        
        // Normalize emails for comparison (lowercase, trim)
        const normalizeEmail = (email: string) => email?.toLowerCase().trim() || '';
        const currentUserEmailNormalized = normalizeEmail(currentUser.email);
        
        const otherUserEmail = participantEmails.find(email => normalizeEmail(email) !== currentUserEmailNormalized);
        
        // Try to find user with normalized email comparison
        const otherUser = otherUserEmail ? users.find(u => {
            const userEmailNormalized = normalizeEmail(u.email);
            return userEmailNormalized === normalizeEmail(otherUserEmail);
        }) : null;
        
        const messages = (chat.messages as MessageRow[] | null) || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        return { pet, otherUser, otherUserEmail, lastMessage };
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-brand-dark mb-4">Mis Mensajes</h2>
                
                {chats.length > 0 ? (
                    <div className="space-y-3">
                        {chats.map(chat => {
                            const { pet, otherUser, otherUserEmail, lastMessage } = getChatDetails(chat);
                            // Show chat even if otherUser is not found (might be admin or user not loaded yet)
                            const displayName = otherUser?.username || 
                                               (otherUser?.firstName && otherUser?.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : null) ||
                                               otherUser?.email?.split('@')[0] || 
                                               otherUserEmail?.split('@')[0] ||
                                               'Usuario';
                            const displayAvatar = otherUser?.avatarUrl || (otherUser?.firstName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random` : null);

                            return (
                                <div 
                                    key={chat.id} 
                                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${chat.isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <div className="w-4 flex-shrink-0 flex justify-center mr-2">
                                        {chat.isUnread && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-brand-primary"></span>
                                        )}
                                    </div>
                                    <div className="h-14 w-14 rounded-full mr-4 border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                        {displayAvatar ? (
                                            <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-600">{displayName.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-brand-dark truncate">
                                                {pet ? `Sobre: ${pet.name}` : `${displayName}`}
                                            </p>
                                            {lastMessage && (
                                                <p className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatTime(lastMessage.created_at)}</p>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                                            {otherUser ? `@${displayName}` : (otherUserEmail ? `@${otherUserEmail.split('@')[0]}` : '@Usuario')}
                                            <VerifiedBadge user={otherUser} size="sm" />
                                        </p>
                                        {lastMessage ? (
                                            <p className={`text-sm truncate ${chat.isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                <span className="font-normal text-gray-400">{lastMessage.sender_email === currentUser.email ? 'Tú: ' : ''}</span>
                                                {lastMessage.text}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No hay mensajes todavía.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-lg text-gray-500">No tienes mensajes.</p>
                        <p className="text-sm text-gray-400 mt-1">Cuando contactes a alguien sobre una mascota, tus conversaciones aparecerán aquí.</p>
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

export default MessagesPage;
