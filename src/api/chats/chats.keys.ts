/**
 * Query keys for Chats API
 */
export const queryKeys = {
  chats: (userId: string) => ['chats', userId] as const,
  chat: (chatId: string) => ['chats', chatId] as const,
  messages: (chatId: string) => ['messages', chatId] as const,
} as const;

