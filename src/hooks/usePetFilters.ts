
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

            // Date filter (using calendar day boundaries to match server-side logic)
            if (filters.dateFilter) {
                const petDate = new Date(pet.date || pet.createdAt);
                const now = new Date();
                let dateThreshold: Date;
                
                switch (filters.dateFilter) {
                    case 'today':
                        // Use calendar day start (midnight) to match server-side logic
                        dateThreshold = new Date(now);
                        dateThreshold.setHours(0, 0, 0, 0);
                        break;
                    case 'last3days':
                        dateThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                        dateThreshold.setHours(0, 0, 0, 0);
                        break;
                    case 'lastWeek':
                        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        dateThreshold.setHours(0, 0, 0, 0);
                        break;
                    case 'lastMonth':
                        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        dateThreshold.setHours(0, 0, 0, 0);
                        break;
                    default:
                        return true; // No filter applied
                }
                
                // Check if pet date is on or after the threshold
                if (petDate < dateThreshold) return false;
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
