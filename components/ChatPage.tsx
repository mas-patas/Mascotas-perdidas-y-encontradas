
import React, { useState, useRef, useEffect } from 'react';
import type { Chat, Pet, User } from '../types';
import { SendIcon } from './icons';

interface ChatPageProps {
    chat: Chat;
    pet?: Pet;
    users: User[];
    currentUser: User;
    onSendMessage: (chatId: string, text: string) => void;
    onBack: () => void;
    onMarkAsRead: (chatId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ chat, pet, users, currentUser, onSendMessage, onBack, onMarkAsRead }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const otherUserEmail = chat.participantEmails.find(email => email !== currentUser.email);
    const otherUser = users.find(u => u.email === otherUserEmail);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        onMarkAsRead(chat.id);
    }, [chat.id, onMarkAsRead]);

    useEffect(scrollToBottom, [chat.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(chat.id, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full max-h-[calc(100vh-150px)]">
            {/* Chat Header */}
            <div className="flex items-center p-4 border-b border-gray-200">
                <button onClick={onBack} className="mr-4 text-brand-primary hover:text-brand-dark">&larr;</button>
                <img src={pet?.imageUrls[0] || 'https://placehold.co/400x400/CCCCCC/FFFFFF?text=Admin'} alt={pet?.name || 'Admin'} className="h-10 w-10 rounded-full object-cover mr-3" />
                <div>
                    <p className="font-semibold text-brand-dark">{pet ? `Conversación sobre ${pet.name}` : 'Mensaje de Administración'}</p>
                    <p className="text-sm text-gray-500">con @{otherUser?.username || 'usuario'}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chat.messages.map((message, index) => {
                    const isCurrentUser = message.senderEmail === currentUser.email;
                    return (
                        <div key={index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p>{message.text}</p>
                                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} text-right`}>
                                    {new Date(message.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <button type="submit" className="bg-brand-primary text-white rounded-full p-3 hover:bg-brand-dark transition-colors">
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;