
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChatRow, PetRow, User, MessageRow } from '@/types';
import { SendIcon } from '@/shared/components/icons';
import { formatTime } from '@/utils/formatters';
import { useAppData } from '@/hooks/useAppData';
import { usePets } from '@/hooks/usePets';
import { useChat } from '@/api/chats/chats.query';
import { SecurityDisclaimer } from '@/shared';

interface ChatPageProps {
    chat?: ChatRow; // Optional, we'll find it if missing
    pet?: PetRow;
    users: User[];
    currentUser: User;
    onSendMessage: (chatId: string, text: string) => void;
    onBack: () => void;
    onMarkAsRead: (chatId: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ chat: propChat, pet: propPet, users, currentUser, onSendMessage, onBack, onMarkAsRead }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // Try to get chat from props or from the list
    const { chats } = useAppData();
    const { pets } = usePets({ filters: { status: 'Todos', type: 'Todos', breed: 'Todos', color1: 'Todos', color2: 'Todos', size: 'Todos', department: 'Todos' } });
    
    // Find chat in list first
    const chatFromList = propChat || chats.find(c => c.id === id);
    
    // Only use useChat hook if chat is not found in the list (e.g., newly created chat)
    // This prevents infinite loops by avoiding unnecessary queries
    const shouldFetchChat = !chatFromList && !!id;
    const { data: fetchedChat, isLoading: isLoadingChat } = useChat(shouldFetchChat ? id : undefined);
    
    // Prefer propChat, then chat from list, then fetched chat
    const chat = chatFromList || fetchedChat || null;
    const pet = propPet || (chat && chat.pet_id ? pets.find(p => p.id === chat.pet_id) : undefined);

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedReadTimeRef = useRef<string>('');
    const isMarkingAsReadRef = useRef<boolean>(false);
    const lastChatIdRef = useRef<string | null>(null);
    
    const participantEmails = chat?.participant_emails || [];
    
    // Normalize emails for comparison (lowercase, trim)
    const normalizeEmail = (email: string) => email?.toLowerCase().trim() || '';
    const currentUserEmailNormalized = normalizeEmail(currentUser.email);
    
    const otherUserEmail = participantEmails.find(email => normalizeEmail(email) !== currentUserEmailNormalized);
    
    // Try to find user with normalized email comparison
    const otherUser = otherUserEmail ? users.find(u => {
        const userEmailNormalized = normalizeEmail(u.email);
        return userEmailNormalized === normalizeEmail(otherUserEmail);
    }) : null;
    
    const displayName = otherUser?.username || 
                       (otherUser?.firstName && otherUser?.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : null) ||
                       otherUser?.email?.split('@')[0] || 
                       otherUserEmail?.split('@')[0] ||
                       'Usuario';
    const displayAvatar = otherUser?.avatarUrl || (displayName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random` : null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        if (!chat || !currentUser) return;
        
        // Reset marking flag if chat ID changed
        if (lastChatIdRef.current !== chat.id) {
            lastChatIdRef.current = chat.id;
            isMarkingAsReadRef.current = false;
            lastProcessedReadTimeRef.current = '';
        }
        
        // Don't mark as read if already in process
        if (isMarkingAsReadRef.current) return;
        
        const messages = (chat.messages as MessageRow[] | null) || [];
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        const lastReadTimestamps = (chat.last_read_timestamps as Record<string, string> | null) || {};
        const myLastRead = lastReadTimestamps[currentUser.email];
        
        // Prevent infinite loops by checking if we've already processed this read time
        if (lastProcessedReadTimeRef.current === myLastRead && lastProcessedReadTimeRef.current !== '') {
             const lastMsgTime = new Date(lastMessage.created_at).getTime();
             const processedTime = new Date(lastProcessedReadTimeRef.current).getTime();
             if (lastMsgTime <= processedTime) return;
        }

        const lastMsgTime = new Date(lastMessage.created_at).getTime();
        const myReadTime = myLastRead ? new Date(myLastRead).getTime() : 0;

        // Only mark as read if it's not our message and we haven't read it yet
        if (lastMessage.sender_email !== currentUser.email && lastMsgTime > myReadTime) {
            const newReadTime = new Date().toISOString();
            // Update refs immediately to prevent multiple calls
            lastProcessedReadTimeRef.current = newReadTime;
            isMarkingAsReadRef.current = true;
            
            // Mark as read and reset flag after a delay
            onMarkAsRead(chat.id);
            setTimeout(() => {
                isMarkingAsReadRef.current = false;
            }, 1000);
        }
    }, [chat?.id, chat?.messages?.length, currentUser?.email, onMarkAsRead]);

    useEffect(() => {
        if(chat) scrollToBottom();
    }, [chat?.messages]);

    // Show loading state while fetching chat (especially for newly created chats)
    if (isLoadingChat || !chat) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-4"></div>
                    <p className="text-gray-600">Cargando chat...</p>
                </div>
            </div>
        );
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(chat.id, newMessage.trim());
            setNewMessage('');
        }
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        onBack();
    };

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col h-full max-h-[calc(100vh-150px)]">
            {/* Chat Header */}
            <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <button 
                    onClick={handleBack} 
                    className="mr-4 text-sm font-semibold text-brand-primary hover:text-brand-dark flex items-center gap-1 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                >
                    &larr; Volver
                </button>
                <div className="h-10 w-10 rounded-full mr-3 border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {displayAvatar ? (
                        <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-gray-600">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div>
                    <p className="font-bold text-brand-dark text-sm">{pet ? `Conversación sobre ${pet.name}` : `Conversación con ${displayName}`}</p>
                    <p className="text-xs text-gray-500">con @{displayName}</p>
                </div>
            </div>

            {/* Security Disclaimer */}
            <div className="px-4 pt-2 pb-1">
                <SecurityDisclaimer 
                    variant="compact" 
                    type="warning"
                    customMessage="Ten cuidado al compartir información personal. Verifica la identidad de la persona con la que estás hablando. Puedes reportar usuarios sospechosos."
                    showReportInfo={true}
                    showSupportLink={true}
                    dismissible={true}
                />
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
                {(() => {
                    const messages = (chat.messages as MessageRow[] | null) || [];
                    return messages.map((message: MessageRow, index: number) => {
                        const isCurrentUser = message.sender_email === currentUser.email;
                        const messageSender = message.sender_email === currentUser.email ? currentUser : (users.find(u => u.email === message.sender_email) || null);
                        const senderName = messageSender?.username || 
                                         (messageSender?.firstName && messageSender?.lastName ? `${messageSender.firstName} ${messageSender.lastName}` : null) ||
                                         message.sender_email?.split('@')[0] || 
                                         'Usuario';
                        
                        return (
                            <div key={message.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                                {!isCurrentUser && (
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        {messageSender?.avatarUrl ? (
                                            <img src={messageSender.avatarUrl} alt={senderName} className="h-full w-full object-cover rounded-full" />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-600">{senderName.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl shadow-sm ${isCurrentUser ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    {!isCurrentUser && (
                                        <p className="text-xs font-semibold text-gray-600 mb-1">@{senderName}</p>
                                    )}
                                    <p className="text-sm">{message.text}</p>
                                    <p className={`text-[10px] mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                                        {formatTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    });
                })()}
                 <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm bg-white text-gray-900"
                    />
                    <button type="submit" className="bg-brand-primary text-white rounded-full p-3 hover:bg-brand-dark transition-colors shadow-md disabled:opacity-50" disabled={!newMessage.trim()}>
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};
