
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePetFilters } from './usePetFilters';
import { PET_STATUS, ANIMAL_TYPES, SIZES } from '../constants';
import type { Pet } from '../types';

// Mock data for testing
const mockPets: Pet[] = [
    {
        id: '1',
        name: 'Doggy',
        status: PET_STATUS.PERDIDO,
        animalType: ANIMAL_TYPES.PERRO,
        breed: 'Labrador',
        color: 'Negro',
        size: SIZES.GRANDE,
        location: 'Lima, Miraflores',
        date: '2023-01-01',
        contact: '123',
        description: 'Test dog',
        imageUrls: [],
        userEmail: 'test@test.com'
    },
    {
        id: '2',
        name: 'Kitty',
        status: PET_STATUS.ENCONTRADO,
        animalType: ANIMAL_TYPES.GATO,
        breed: 'Siames',
        color: 'Blanco',
        size: SIZES.PEQUENO,
        location: 'Arequipa, Cercado',
        date: '2023-01-02',
        contact: '123',
        description: 'Test cat',
        imageUrls: [],
        userEmail: 'test@test.com'
    }
];

describe('usePetFilters Hook', () => {
    it('debe inicializarse con todos los filtros en "Todos"', () => {
        const { result } = renderHook(() => usePetFilters(mockPets));
        
        expect(result.current.filters.status).toBe('Todos');
        expect(result.current.filters.type).toBe('Todos');
        expect(result.current.filteredPets).toHaveLength(2);
    });

    it('debe filtrar correctamente por estado (Perdido)', () => {
        const { result } = renderHook(() => usePetFilters(mockPets));

        act(() => {
            result.current.setFilters(prev => ({ ...prev, status: PET_STATUS.PERDIDO }));
        });

        expect(result.current.filteredPets).toHaveLength(1);
        expect(result.current.filteredPets[0].name).toBe('Doggy');
    });

    it('debe filtrar correctamente por tipo de animal (Gato)', () => {
        const { result } = renderHook(() => usePetFilters(mockPets));

        act(() => {
            result.current.setFilters(prev => ({ ...prev, type: ANIMAL_TYPES.GATO }));
        });

        expect(result.current.filteredPets).toHaveLength(1);
        expect(result.current.filteredPets[0].name).toBe('Kitty');
    });

    it('debe filtrar por ubicación (string match)', () => {
        const { result } = renderHook(() => usePetFilters(mockPets));

        act(() => {
            result.current.setFilters(prev => ({ ...prev, department: 'Arequipa' }));
        });

        expect(result.current.filteredPets).toHaveLength(1);
        expect(result.current.filteredPets[0].location).toContain('Arequipa');
    });

    it('debe resetear los filtros correctamente', () => {
        const { result } = renderHook(() => usePetFilters(mockPets));

        // Apply filters first
        act(() => {
            result.current.setFilters(prev => ({ ...prev, status: PET_STATUS.PERDIDO }));
        });
        expect(result.current.filteredPets).toHaveLength(1);

        // Reset
        act(() => {
            result.current.resetFilters();
        });

        expect(result.current.filters.status).toBe('Todos');
        expect(result.current.filteredPets).toHaveLength(2);
    });
});
