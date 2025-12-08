import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './supportTickets.keys';
import * as supportTicketsApi from './supportTickets.api';
import type { CreateSupportTicketData, UpdateSupportTicketData } from './supportTickets.types';
import { useAuth } from '@/contexts/auth';

/**
 * Mutation hook to create a support ticket
 */
export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<CreateSupportTicketData, 'userEmail'>) => {
      if (!currentUser) throw new Error('User must be logged in');

      return await supportTicketsApi.createSupportTicket({
        ...data,
        userEmail: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets() });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to update a support ticket
 */
export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupportTicketData }) => {
      await supportTicketsApi.updateSupportTicket(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets() });
    }
  });
};
