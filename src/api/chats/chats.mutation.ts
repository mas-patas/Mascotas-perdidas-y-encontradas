import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './chats.keys';
import * as chatsApi from './chats.api';
import type { CreateChatData } from './chats.types';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Mutation hook to create a chat
 */
export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateChatData) => {
      if (!currentUser) throw new Error('User must be logged in');

      return await chatsApi.createChat(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate chats for all participants
      variables.participantEmails.forEach(email => {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats(email) });
      });
    }
  });
};

/**
 * Mutation hook to send a message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string; text: string }) => {
      if (!currentUser) throw new Error('User must be logged in');

      return await chatsApi.sendMessage(chatId, currentUser.email, text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat(variables.chatId) });
      // Invalidate all user chats to update last message
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats(currentUser.email) });
      }
    }
  });
};

/**
 * Mutation hook to mark chat as read
 */
export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!currentUser) throw new Error('User must be logged in');

      await chatsApi.markChatAsRead(chatId, currentUser.email);
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat(chatId) });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats(currentUser.email) });
      }
    }
  });
};
