import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { generateUUID } from '../utils/uuid';
import { Pet, PetStatus } from '../types';
import { trackReportPet } from '../services/analytics';
import { logActivity, POINTS_CONFIG } from '../services/gamificationService';
import { generatePetEmbedding } from '../services/geminiService';

export const usePetMutations = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // 1. CREATE PET
    const createPet = useMutation({
        mutationFn: async (petData: any & { userId: string, isAiSearchEnabled: boolean }) => {
            const newPetId = generateUUID();
            const now = new Date();
            const expirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
            
            let embedding = null;
            if (petData.isAiSearchEnabled) {
                const contentToEmbed = `${petData.animalType} ${petData.breed} ${petData.color} ${petData.description}`;
                embedding = await generatePetEmbedding(contentToEmbed);
            }

            // Remove non-DB fields
            const { userId, isAiSearchEnabled, createAlert, ...dbPayload } = petData;

            const { data, error } = await supabase.from('pets').insert({
                id: newPetId,
                user_id: userId,
                ...dbPayload, // status, name, breed, etc.
                contact_requests: [],
                created_at: now.toISOString(),
                expires_at: expirationDate.toISOString(),
                embedding: embedding
            }).select().single();

            if (error) throw error;

            // Side Effects (Alerts & Analytics)
            if (createAlert && petData.status === 'Perdido') {
                const locationParts = petData.location.split(',').map((s: string) => s.trim());
                const dept = locationParts[locationParts.length - 1] || 'Todos';
                await supabase.from('saved_searches').insert({
                    id: generateUUID(),
                    user_id: userId,
                    name: `Alerta: ${petData.breed} (${petData.color})`,
                    filters: {
                        status: 'Todos',
                        type: petData.animalType,
                        breed: petData.breed,
                        department: dept
                    },
                    created_at: now.toISOString()
                });
            }

            const locationParts = petData.location.split(',').map((s: string) => s.trim());
            const dept = locationParts[locationParts.length - 1] || 'Unknown';
            trackReportPet(petData.status, petData.animalType, dept);
            
            await logActivity(userId, 'report_pet', POINTS_CONFIG.REPORT_PET, { petId: newPetId, status: petData.status });
            
            await supabase.from('notifications').insert({
                id: generateUUID(),
                user_id: userId,
                message: `Has publicado exitosamente el reporte de "${petData.name}".`,
                link: { type: 'pet', id: newPetId },
                is_read: false,
                created_at: now.toISOString()
            });

            return data;
        },
        onSuccess: () => {
            showToast('Mascota publicada exitosamente', 'success');
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['myPets'] });
            queryClient.invalidateQueries({ queryKey: ['gamificationStats'] });
        },
        onError: (error: any) => {
            showToast(`Error al publicar: ${error.message}`, 'error');
        }
    });

    // 2. UPDATE PET
    const updatePet = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Pet> }) => {
            // Map camelCase to snake_case for DB
            const dbUpdates: any = {
                status: updates.status,
                name: updates.name,
                animal_type: updates.animalType,
                breed: updates.breed,
                color: updates.color,
                size: updates.size,
                location: updates.location,
                date: updates.date,
                contact: updates.contact,
                description: updates.description,
                image_urls: updates.imageUrls,
                adoption_requirements: updates.adoptionRequirements,
                share_contact_info: updates.shareContactInfo,
                reward: updates.reward,
                currency: updates.currency,
                lat: updates.lat,
                lng: updates.lng
            };

            // Remove undefined keys
            Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

            const { data, error } = await supabase.from('pets').update(dbUpdates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            showToast('Publicación actualizada', 'success');
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['pet_detail', data.id] });
            queryClient.invalidateQueries({ queryKey: ['myPets'] });
        },
        onError: (error: any) => {
            showToast(`Error al actualizar: ${error.message}`, 'error');
        }
    });

    // 3. UPDATE STATUS
    const updatePetStatus = useMutation({
        mutationFn: async ({ id, status, userId }: { id: string, status: PetStatus, userId?: string }) => {
            const { error } = await supabase.from('pets').update({ status }).eq('id', id);
            if (error) throw error;
            
            if (status === 'Reunido' && userId) {
                await logActivity(userId, 'pet_reunited', POINTS_CONFIG.PET_REUNITED, { petId: id });
            }
            return { id, status };
        },
        onSuccess: (variables) => {
            showToast(`Estado actualizado a ${variables.status}`, 'success');
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['pet_detail', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['myPets'] });
            if (variables.status === 'Reunido') {
                queryClient.invalidateQueries({ queryKey: ['gamificationStats'] });
            }
        },
        onError: (error: any) => {
            showToast(`Error al cambiar estado: ${error.message}`, 'error');
        }
    });

    // 4. DELETE PET
    const deletePet = useMutation({
        mutationFn: async (petId: string) => {
            const { error } = await supabase.from('pets').delete().eq('id', petId);
            if (error) throw error;
            return petId;
        },
        onSuccess: () => {
            showToast('Publicación eliminada', 'info');
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['myPets'] });
        },
        onError: (error: any) => {
            showToast(`Error al eliminar: ${error.message}`, 'error');
        }
    });

    // 5. RENEW PET
    const renewPet = useMutation({
        mutationFn: async (petId: string) => {
            const now = new Date();
            const newExpirationDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
            const { error } = await supabase.from('pets').update({ 
                expires_at: newExpirationDate.toISOString(), 
                created_at: now.toISOString() 
            }).eq('id', petId);
            if (error) throw error;
        },
        onSuccess: () => {
            showToast('Publicación renovada por 60 días', 'success');
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            queryClient.invalidateQueries({ queryKey: ['myPets'] });
        },
        onError: (error: any) => {
            showToast(error.message, 'error');
        }
    });

    return {
        createPet,
        updatePet,
        updatePetStatus,
        deletePet,
        renewPet
    };
};