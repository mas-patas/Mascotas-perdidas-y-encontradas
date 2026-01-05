import { supabase } from '../../services/supabaseClient';
import type { ChatRow, MessageRow } from '../../types';
import type { CreateChatData } from './chats.types';

/**
 * Extended chat type with messages
 */
export type ChatWithMessages = ChatRow & {
  messages?: MessageRow[];
};

/**
 * Fetch all chats for a user
 * Returns database rows with snake_case column names
 */
export const getChats = async (userEmail: string): Promise<ChatWithMessages[]> => {
  // Fetch all chats and filter client-side to ensure we get all chats where user is a participant
  const { data: rawChats, error } = await supabase
    .from('chats')
    .select('*');

  if (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
  if (!rawChats) return [];

  // Filter chats where user is a participant
  const userChats = rawChats.filter(chat => {
    const emails = chat.participant_emails || [];
    return Array.isArray(emails) && emails.includes(userEmail);
  });



  const chatIds = userChats.map((c) => c.id);
  let rawMessages: MessageRow[] = [];

  if (chatIds.length > 0) {
    const { data: msgs, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw msgError;
    }
    rawMessages = msgs || [];
  }

  const result = userChats.map((c) => {
    const chatMessages = rawMessages.filter((m) => m.chat_id === c.id);

    return {
      ...c,
      messages: chatMessages,
    };
  });

  return result;
};

/**
 * Fetch a single chat by ID
 * Returns database row with snake_case column names
 */
export const getChatById = async (chatId: string): Promise<ChatWithMessages | null> => {
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (chatError) throw chatError;
  if (!chatData) return null;

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  return {
    ...chatData,
    messages: messages || [],
  };
};

/**
 * Fetch messages for a chat
 * Returns database rows with snake_case column names
 */
export const getMessages = async (chatId: string): Promise<MessageRow[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data;
};

/**
 * Mutation API Functions
 */

/**
 * Create a new chat
 */
export const createChat = async (data: CreateChatData): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const chatId = generateUUID();
  const now = new Date().toISOString();

  // Normalize emails (lowercase, trim) to ensure consistency
  const normalizeEmail = (email: string) => email?.toLowerCase().trim() || '';
  const normalizedEmails = data.participantEmails.map(normalizeEmail).filter(Boolean);

  if (normalizedEmails.length < 2) {
    throw new Error('Se requieren al menos 2 participantes para crear un chat');
  }

  const lastReadTimestamps: Record<string, string> = {};
  normalizedEmails.forEach(email => {
    lastReadTimestamps[email] = now;
  });

  const { error } = await supabase.from('chats').insert({
    id: chatId,
    pet_id: data.petId || null,
    participant_emails: normalizedEmails,
    last_read_timestamps: lastReadTimestamps,
    created_at: now
  });

  if (error) {
    throw error;
  }

  return chatId;
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId: string, senderEmail: string, text: string): Promise<string> => {
  const { generateUUID } = await import('../../utils/uuid');
  const messageId = generateUUID();

  const { error } = await supabase.from('messages').insert({
    id: messageId,
    chat_id: chatId,
    sender_email: senderEmail,
    text,
    created_at: new Date().toISOString()
  });

  if (error) throw error;

  // Get chat participants to send push notifications
  // The trigger will create notifications in the database, but we also want to send
  // push notifications when the app is closed
  try {
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('participant_emails')
      .eq('id', chatId)
      .single();

    if (!chatError && chatData) {
      // Get other participants (excluding sender)
      const normalizedSenderEmail = senderEmail.toLowerCase().trim();
      const otherParticipants = (chatData.participant_emails || [])
        .map((email: string) => email.toLowerCase().trim())
        .filter((email: string) => email !== normalizedSenderEmail);

      if (otherParticipants.length > 0) {
        // Get user IDs for other participants
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', otherParticipants);

        if (profiles && profiles.length > 0) {
          // Truncate message preview
          const messagePreview = text.length > 50 ? text.substring(0, 50) + '...' : text;

          // Send push notifications to each participant
          // The trigger already creates notifications in the database, so this is just for push when app is closed
          for (const profile of profiles) {
            supabase.functions.invoke('send-message-notifications', {
              body: {
                userId: profile.id,
                message: `Nuevo mensaje: ${messagePreview}`,
                link: '#/mensajes'
              }
            }).catch((err) => {
              // Silently fail - we don't want to block message sending if push notifications fail
              console.warn('Failed to send push notification for message:', err);
            });
          }
        }
      }
    }
  } catch (err) {
    // Silently fail - we don't want to block message sending if push notifications fail
    console.warn('Error sending push notifications for message:', err);
  }

  return messageId;
};

/**
 * Mark chat as read
 */
export const markChatAsRead = async (chatId: string, userEmail: string): Promise<void> => {
  const now = new Date().toISOString();

  // Get current timestamps
  const { data: chatData } = await supabase
    .from('chats')
    .select('last_read_timestamps')
    .eq('id', chatId)
    .single();

  const timestamps: Record<string, string> = (chatData?.last_read_timestamps as Record<string, string>) || {};
  timestamps[userEmail] = now;

  const { error } = await supabase
    .from('chats')
    .update({ last_read_timestamps: timestamps })
    .eq('id', chatId);

  if (error) throw error;
};
