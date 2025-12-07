import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import * as bannedIpsApi from './bannedIps.api';

/**
 * Mutation hook to create a banned IP
 */
export const useCreateBannedIp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ipAddress: string; reason: string }) => {
      const { generateUUID } = await import('../utils/uuid');
      const id = generateUUID();
      
      const { supabase } = await import('../services/supabaseClient');
      const { error } = await supabase.from('banned_ips').insert({
        id,
        ip_address: data.ipAddress,
        reason: data.reason,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bannedIps });
    }
  });
};

/**
 * Mutation hook to delete a banned IP
 */
export const useDeleteBannedIp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { supabase } = await import('../services/supabaseClient');
      const { error } = await supabase.from('banned_ips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bannedIps });
    }
  });
};
