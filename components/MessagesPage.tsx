
import React from 'react';
import type { Chat } from '../types';
import { formatTime } from '../utils/formatters';
import { useChats } from '../hooks/useCommunication';
import { useUsers } from '../hooks/useResources';
import { usePets } from '../hooks/usePets';
import { useAuth } from '../contexts/AuthContext';

interface MessagesPageProps {
    onSelectChat: (chatId: string) => void;
    onBack: () => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ onSelectChat, onBack }) => {
    const { currentUser } = useAuth();
    const { data: chats = [], isLoading } = useChats();
    const { data: users = [] } = useUsers();
    // Reusing usePets to get pet details for chat header. 
    // Optimization: In real world, we'd fetch specific pets by ID list, but existing cache is fine here.
    const { pets } = usePets({ filters: { status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos', department: 'Todos' } });

    if (!currentUser) return <div>Inicia sesión para ver tus mensajes.</div>;
    if (isLoading) return <div className="p-8 text-center">Cargando mensajes...</div>;

    const getChatDetails = (chat: Chat) => {
        const pet = chat.petId ? pets.find(p => p.id === chat.petId) : null;
        const otherUserEmail = chat.participantEmails.find(email => email !== currentUser.email);
        const otherUser = otherUserEmail ? users.find(u => u.email === otherUserEmail) : null;
        const lastMessage = chat.messages[chat.messages.length - 1];
        
        // Unread logic
        const myLastRead = chat.lastReadTimestamps?.[currentUser.email];
        const lastMsgTime = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
        const readTime = myLastRead ? new Date(myLastRead).getTime() : 0;
        const isUnread = lastMessage && lastMessage.senderEmail !== currentUser.email && lastMsgTime > readTime;

        return { pet, otherUser, lastMessage, isUnread };
    };

    // Sort by latest message
    const sortedChats = [...chats].sort((a, b) => {
        const timeA = a.messages[a.messages.length - 1]?.timestamp || a.id; // Fallback to ID/creation if no messages
        const timeB = b.messages[b.messages.length - 1]?.timestamp || b.id;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-brand-dark mb-4">Mis Mensajes</h2>
                
                {sortedChats.length > 0 ? (
                    <div className="space-y-3">
                        {sortedChats.map(chat => {
                            const { pet, otherUser, lastMessage, isUnread } = getChatDetails(chat);
                            if (!otherUser) return null;

                            return (
                                <div 
                                    key={chat.id} 
                                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <div className="w-4 flex-shrink-0 flex justify-center mr-2">
                                        {isUnread && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-brand-primary"></span>
                                        )}
                                    </div>
                                    <img src={pet?.imageUrls[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Admin'} alt={pet?.name || 'Admin'} className="h-14 w-14 rounded-full object-cover mr-4 border border-gray-200" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-brand-dark truncate">{pet ? `Sobre: ${pet.name}` : 'Soporte / Admin'}</p>
                                            {lastMessage && (
                                                <p className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatTime(lastMessage.timestamp)}</p>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1 font-medium">@{otherUser.username || 'usuario'}</p>
                                        {lastMessage ? (
                                            <p className={`text-sm truncate ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                <span className="font-normal text-gray-400">{lastMessage.senderEmail === currentUser.email ? 'Tú: ' : ''}</span>
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
