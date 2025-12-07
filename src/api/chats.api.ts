import { supabase } from '../services/supabaseClient';
import type { Chat, Message } from '../types';
import type { CreateChatData } from './chats.types';

/**
 * Fetch all chats for a user
 */
export const getChats = async (userEmail: string): Promise<Chat[]> => {
  const { data: rawChats, error } = await supabase
    .from('chats')
    .select('*')
    .contains('participant_emails', [userEmail]);
  
  if (error) throw error;
  if (!rawChats) return [];

  const chatIds = rawChats.map((c: any) => c.id);
  let rawMessages: any[] = [];
  
  if (chatIds.length > 0) {
    const { data: msgs, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true });
    
    if (msgError) throw msgError;
    rawMessages = msgs || [];
  }

  return rawChats.map((c: any) => {
    const chatMessages = rawMessages
      .filter((m: any) => m.chat_id === c.id)
      .map((m: any) => ({
        senderEmail: m.sender_email,
        text: m.text,
        timestamp: m.created_at,
        isUnread: false, // Will be calculated by the query hook
      }));
    
    return {
      id: c.id,
      petId: c.pet_id,
      participantEmails: c.participant_emails,
      messages: chatMessages,
      lastReadTimestamps: c.last_read_timestamps || {},
    };
  });
};

/**
 * Fetch a single chat by ID
 */
export const getChatById = async (chatId: string): Promise<Chat | null> => {
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
    id: chatData.id,
    petId: chatData.pet_id,
    participantEmails: chatData.participant_emails,
    messages: (messages || []).map((m: any) => ({
      senderEmail: m.sender_email,
      text: m.text,
      timestamp: m.created_at,
      isUnread: false,
    })),
    lastReadTimestamps: chatData.last_read_timestamps || {},
  };
};

/**
 * Fetch messages for a chat
 */
export const getMessages = async (chatId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  if (!data) return [];
  
  return data.map((m: any) => ({
    senderEmail: m.sender_email,
    text: m.text,
    timestamp: m.created_at,
    isUnread: false,
  }));
};

/**
 * Mutation API Functions
 */

/**
 * Create a new chat
 */
export const createChat = async (data: CreateChatData): Promise<string> => {
  const { generateUUID } = await import('../utils/uuid');
  const chatId = generateUUID();
  const now = new Date().toISOString();

  const lastReadTimestamps: Record<string, string> = {};
  data.participantEmails.forEach(email => {
    lastReadTimestamps[email] = now;
  });

  const { error } = await supabase.from('chats').insert({
    id: chatId,
    pet_id: data.petId || null,
    participant_emails: data.participantEmails,
    last_read_timestamps: lastReadTimestamps,
    created_at: now
  });

  if (error) throw error;
  return chatId;
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId: string, senderEmail: string, text: string): Promise<string> => {
  const { generateUUID } = await import('../utils/uuid');
  const messageId = generateUUID();

  const { error } = await supabase.from('messages').insert({
    id: messageId,
    chat_id: chatId,
    sender_email: senderEmail,
    text,
    created_at: new Date().toISOString()
  });

  if (error) throw error;
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

  const timestamps = chatData?.last_read_timestamps || {};
  timestamps[userEmail] = now;

  const { error } = await supabase
    .from('chats')
    .update({ last_read_timestamps: timestamps })
    .eq('id', chatId);

  if (error) throw error;
};
