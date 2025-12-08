import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './pets.keys';
import * as petsApi from './pets.api';
import type { CreatePetData, UpdatePetData, MarkReunionData } from './pets.types';
import { useAuth } from '@/contexts/auth';
import { trackReportPet, trackPetReunited } from '@/services/analytics';
import { logActivity, POINTS_CONFIG } from '@/services/gamificationService';
import { generatePetEmbedding } from '@/services/geminiService';
import { generateUUID } from '@/utils/uuid';
import { PET_STATUS } from '@/constants';
import * as notificationsApi from '../notifications/notifications.api';

/**
 * Mutation hook to create a new pet
 */
export const useCreatePet = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: CreatePetData & { embedding?: number[] | null; isAiSearchEnabled?: boolean }) => {
      if (!currentUser) throw new Error('User must be logged in');

      let embedding = data.embedding;
      if (data.isAiSearchEnabled && !embedding) {
        const contentToEmbed = `${data.animalType} ${data.breed} ${data.color} ${data.description}`;
        embedding = await generatePetEmbedding(contentToEmbed);
      }

      // Ensure embedding is either a valid array with elements or null
      // Supabase rejects empty arrays for vector columns
      const finalEmbedding = (embedding && Array.isArray(embedding) && embedding.length > 0) 
        ? embedding 
        : null;

      const petId = await petsApi.createPet({
        ...data,
        userId: currentUser.id,
        embedding: finalEmbedding
      });

      // Create notification
      await notificationsApi.createNotification({
        id: generateUUID(),
        userId: currentUser.id,
        message: `Has publicado exitosamente el reporte de "${data.name}".`,
        link: { type: 'pet', id: petId }
      });

      // Track analytics
      const locationParts = data.location.split(',').map((s: string) => s.trim());
      const dept = locationParts[locationParts.length - 1] || 'Unknown';
      trackReportPet(data.status, data.animalType, dept);

      // Log activity for gamification
      await logActivity(currentUser.id, 'report_pet', POINTS_CONFIG.REPORT_PET, {
        petId,
        status: data.status
      });

      return petId;
    },
    onSuccess: (petId, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPets(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to update an existing pet
 */
export const useUpdatePet = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePetData }) => {
      await petsApi.updatePet(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPets(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to delete a pet
 */
export const useDeletePet = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await petsApi.deletePet(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPets(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to renew pet expiration
 */
export const useRenewPet = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      await petsApi.renewPet(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPets(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to update pet status
 */
export const useUpdatePetStatus = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await petsApi.updatePetStatus(id, status);

      // Log activity if reunited
      if (status === PET_STATUS.REUNIDO && currentUser) {
        await logActivity(currentUser.id, 'pet_reunited', POINTS_CONFIG.PET_REUNITED, {
          petId: id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPets(currentUser.id) });
      }
    }
  });
};

/**
 * Mutation hook to mark pet as reunited
 */
export const useMarkReunion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      existingImageUrls
    }: {
      id: string;
      data: MarkReunionData;
      existingImageUrls?: string[];
    }) => {
      await petsApi.markReunion(id, data, existingImageUrls);
      trackPetReunited(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pets });
      queryClient.invalidateQueries({ queryKey: queryKeys.pet(variables.id) });
    }
  });
};

/**
 * Mutation hook to record contact request
 */
export const useRecordContactRequest = () => {
  return useMutation({
    mutationFn: async ({
      petId,
      userEmail,
      existingRequests
    }: {
      petId: string;
      userEmail: string;
      existingRequests?: string[];
    }) => {
      await petsApi.recordContactRequest(petId, userEmail, existingRequests);
    }
  });
};
