
import { useState, useMemo } from 'react';
import type { Pet, PetStatus, AnimalType, PetSize } from '../types';
import { PET_STATUS } from '../constants';

export const usePetFilters = (pets: Pet[]) => {
    const [filters, setFilters] = useState<{
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        colors: string[];
        size: PetSize | 'Todos';
        department: string;
        province: string;
        district: string;
        dateFilter: string;
        name: string;
    }>({
        status: 'Todos',
        type: 'Todos',
        breed: 'Todos',
        colors: [],
        size: 'Todos',
        department: 'Todos',
        province: 'Todos',
        district: 'Todos',
        dateFilter: '',
        name: ''
    });

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            if (filters.status !== 'Todos' && pet.status !== filters.status) return false;
            
            if (filters.type !== 'Todos' && pet.animalType !== filters.type) return false;
            if (filters.breed !== 'Todos' && pet.breed !== filters.breed) return false;
            if (filters.size !== 'Todos' && pet.size !== filters.size) return false;
            
            // Color filter: OR logic - pet must match at least one selected color
            if (filters.colors.length > 0) {
                const petColorsLower = pet.color.toLowerCase();
                const matchesColor = filters.colors.some(color => 
                    petColorsLower.includes(color.toLowerCase())
                );
                if (!matchesColor) return false;
            }

            // Location filter: hierarchical (department, province, district)
            if (filters.department !== 'Todos' && !pet.location.includes(filters.department)) return false;
            if (filters.province !== 'Todos' && !pet.location.includes(filters.province)) return false;
            if (filters.district !== 'Todos' && !pet.location.includes(filters.district)) return false;

            // Date filter
            if (filters.dateFilter) {
                const petDate = new Date(pet.date || pet.createdAt);
                const now = new Date();
                const daysDiff = Math.floor((now.getTime() - petDate.getTime()) / (1000 * 60 * 60 * 24));
                
                switch (filters.dateFilter) {
                    case 'today':
                        if (daysDiff > 0) return false;
                        break;
                    case 'last3days':
                        if (daysDiff > 3) return false;
                        break;
                    case 'lastWeek':
                        if (daysDiff > 7) return false;
                        break;
                    case 'lastMonth':
                        if (daysDiff > 30) return false;
                        break;
                }
            }

            // Name filter: only apply if status is 'Perdido'
            if (filters.name && filters.status === PET_STATUS.PERDIDO) {
                const petNameLower = (pet.name || '').toLowerCase();
                if (!petNameLower.includes(filters.name.toLowerCase())) return false;
            }

            return true;
        });
    }, [pets, filters]);

    const resetFilters = () => {
        setFilters({
            status: 'Todos',
            type: 'Todos',
            breed: 'Todos',
            colors: [],
            size: 'Todos',
            department: 'Todos',
            province: 'Todos',
            district: 'Todos',
            dateFilter: '',
            name: ''
        });
    };

    return {
        filters,
        setFilters,
        filteredPets,
        resetFilters
    };
};
