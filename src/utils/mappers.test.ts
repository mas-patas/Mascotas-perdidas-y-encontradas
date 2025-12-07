
import { describe, it, expect } from 'vitest';
import { mapPetFromDb } from './mappers';
import { PET_STATUS, ANIMAL_TYPES, SIZES } from '../constants';

describe('mapPetFromDb', () => {
    const rawDbPet = {
        id: '123-abc',
        user_id: 'user-1',
        status: PET_STATUS.PERDIDO,
        name: 'Firulais',
        animal_type: ANIMAL_TYPES.PERRO,
        breed: 'Mestizo',
        color: 'Negro',
        size: SIZES.MEDIANO,
        location: 'Lima, Peru',
        date: '2024-01-01',
        contact: '999999999',
        description: 'Perro amigable',
        image_urls: ['img1.jpg'],
        adoption_requirements: null,
        share_contact_info: true,
        contact_requests: [],
        reward: 100,
        currency: 'S/',
        lat: -12.0,
        lng: -77.0,
        created_at: '2024-01-01T10:00:00Z',
        expires_at: '2024-03-01T10:00:00Z',
        reunion_story: null,
        reunion_date: null,
        profiles: { email: 'owner@test.com' } // Simulating join
    };

    it('debe mapear correctamente snake_case a camelCase', () => {
        const result = mapPetFromDb(rawDbPet);

        expect(result.id).toBe(rawDbPet.id);
        expect(result.animalType).toBe(rawDbPet.animal_type);
        expect(result.imageUrls).toEqual(rawDbPet.image_urls);
        expect(result.createdAt).toBe(rawDbPet.created_at);
        expect(result.userEmail).toBe('owner@test.com');
    });

    it('debe manejar la ausencia de perfil unido (fallback)', () => {
        const petWithoutJoin = { ...rawDbPet, profiles: null };
        const profilesList = [{ id: 'user-1', email: 'fallback@test.com' }];
        
        const result = mapPetFromDb(petWithoutJoin, profilesList);
        
        expect(result.userEmail).toBe('fallback@test.com');
    });

    it('debe inicializar arrays vacíos si son nulos en DB', () => {
        const petNullArrays = { ...rawDbPet, image_urls: null, contact_requests: null };
        const result = mapPetFromDb(petNullArrays);

        expect(result.imageUrls).toEqual([]);
        expect(result.contactRequests).toEqual([]);
    });
});
