
import React from 'react';
import type { Chat, Pet, User } from '../types';

interface MessagesPageProps {
    chats: (Chat & { isUnread: boolean })[];
    pets: Pet[];
    users: User[];
    currentUser: User;
    onSelectChat: (chatId: string) => void;
    onBack: () => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ chats, pets, users, currentUser, onSelectChat, onBack }) => {

    const getChatDetails = (chat: Chat) => {
        const pet = chat.petId ? pets.find(p => p.id === chat.petId) : null;
        const otherUserEmail = chat.participantEmails.find(email => email !== currentUser.email);
        const otherUser = otherUserEmail ? users.find(u => u.email === otherUserEmail) : null;
        const lastMessage = chat.messages[chat.messages.length - 1];
        return { pet, otherUser, lastMessage };
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-brand-dark mb-4">Mis Mensajes</h2>
                
                {chats.length > 0 ? (
                    <div className="space-y-3">
                        {chats.map(chat => {
                            const { pet, otherUser, lastMessage } = getChatDetails(chat);
                            if (!otherUser) return null;

                            return (
                                <div 
                                    key={chat.id} 
                                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                    onClick={() => onSelectChat(chat.id)}
                                >
                                    <div className="w-4 flex-shrink-0 flex justify-center">
                                        {chat.isUnread && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-brand-primary"></span>
                                        )}
                                    </div>
                                    <img src={pet?.imageUrls[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Admin'} alt={pet?.name || 'Admin'} className="h-16 w-16 rounded-md object-cover mr-4" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-brand-dark">{pet ? `Conversación sobre ${pet.name}` : 'Mensaje de Administración'}</p>
                                                <p className="text-sm text-gray-500">con @{otherUser.username || 'usuario'}</p>
                                            </div>
                                            {lastMessage && (
                                                <p className="text-xs text-gray-400">{new Date(lastMessage.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                            )}
                                        </div>
                                        {lastMessage ? (
                                            <p className="text-sm text-gray-600 truncate mt-1">
                                                <span className="font-medium">{lastMessage.senderEmail === currentUser.email ? 'Tú' : (otherUser.firstName || 'Él/Ella')}:</span> {lastMessage.text}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic mt-1">No hay mensajes todavía.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10">
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