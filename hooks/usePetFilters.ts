
import { useState, useMemo } from 'react';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';

export const usePetFilters = (pets: Pet[]) => {
    const [filters, setFilters] = useState<{
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        color1: string;
        color2: string;
        size: PetSize | 'Todos';
        department: string;
    }>({
        status: 'Todos',
        type: 'Todos',
        breed: 'Todos',
        color1: 'Todos',
        color2: 'Todos',
        size: 'Todos',
        department: 'Todos'
    });

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            if (filters.status !== 'Todos' && pet.status !== filters.status) return false;
            if (filters.type !== 'Todos' && pet.animalType !== filters.type) return false;
            if (filters.breed !== 'Todos' && pet.breed !== filters.breed) return false;
            if (filters.size !== 'Todos' && pet.size !== filters.size) return false;
            if (filters.color1 !== 'Todos' && !pet.color.includes(filters.color1)) return false;
            if (filters.color2 !== 'Todos' && !pet.color.includes(filters.color2)) return false;
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
