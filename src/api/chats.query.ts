import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as chatsApi from './chats.api';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Query hook to fetch all chats for a user
 */
export const useChats = (userEmail: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.chats(userEmail!),
    queryFn: () => chatsApi.getChats(userEmail!),
    enabled: !!userEmail,
    refetchInterval: 5000, // Polling as fallback/supplement to realtime
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Query hook to fetch a single chat by ID
 */
export const useChat = (chatId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.chat(chatId!),
    queryFn: () => chatsApi.getChatById(chatId!),
    enabled: !!chatId,
    refetchInterval: 5000,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Query hook to fetch messages for a chat
 */
export const useMessages = (chatId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.messages(chatId!),
    queryFn: () => chatsApi.getMessages(chatId!),
    enabled: !!chatId,
    refetchInterval: 5000,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to set up realtime subscriptions for chats and messages
 */
export const useChatsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('chats-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
