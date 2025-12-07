
import { useState, useMemo } from 'react';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';

export const usePetFilters = (pets: Pet[]) => {
    const [filters, setFilters] = useState<{
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        color1: string;
        color2: string;
        color3: string;
        size: PetSize | 'Todos';
        department: string;
    }>({
        status: 'Todos',
        type: 'Todos',
        breed: 'Todos',
        color1: 'Todos',
        color2: 'Todos',
        color3: 'Todos',
        size: 'Todos',
        department: 'Todos'
    });

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            if (filters.status !== 'Todos' && pet.status !== filters.status) return false;
            if (filters.type !== 'Todos' && pet.animalType !== filters.type) return false;
            if (filters.breed !== 'Todos' && pet.breed !== filters.breed) return false;
            if (filters.size !== 'Todos' && pet.size !== filters.size) return false;
            
            // Loose color matching: if filter is set, pet colors string must include it.
            // AND logic: If user selects Black AND White, pet must have both.
            const petColorsLower = pet.color.toLowerCase();
            if (filters.color1 !== 'Todos' && !petColorsLower.includes(filters.color1.toLowerCase())) return false;
            if (filters.color2 !== 'Todos' && !petColorsLower.includes(filters.color2.toLowerCase())) return false;
            if (filters.color3 !== 'Todos' && !petColorsLower.includes(filters.color3.toLowerCase())) return false;

            // Simple string check for location as it is stored as "Address, District, Province, Department"
            if (filters.department !== 'Todos' && !pet.location.includes(filters.department)) return false;
            return true;
        });
    }, [pets, filters]);

    const resetFilters = () => {
        setFilters({
            status: 'Todos',
            type: 'Todos',
            breed: 'Todos',
            color1: 'Todos',
            color2: 'Todos',
            color3: 'Todos',
            size: 'Todos',
            department: 'Todos'
        });
    };

    return {
        filters,
        setFilters,
        filteredPets,
        resetFilters
    };
};
