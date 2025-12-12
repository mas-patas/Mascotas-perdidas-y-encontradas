/**
 * Utility to track which pets have been celebrated by users
 * Uses localStorage to persist celebration state
 */

const STORAGE_KEY_PREFIX = 'celebratedPets';

/**
 * Get the storage key for a user
 */
const getStorageKey = (userId: string | null | undefined): string => {
    const userKey = userId || 'anonymous';
    return `${STORAGE_KEY_PREFIX}:${userKey}`;
};

/**
 * Get the list of celebrated pet IDs for a user
 */
const getCelebratedPets = (userId: string | null | undefined): string[] => {
    try {
        const key = getStorageKey(userId);
        const stored = localStorage.getItem(key);
        if (!stored) return [];
        return JSON.parse(stored) as string[];
    } catch (error) {
        console.error('Error reading celebrated pets:', error);
        return [];
    }
};

/**
 * Check if a pet has already been celebrated by a user
 */
export const hasCelebrated = (petId: string, userId: string | null | undefined): boolean => {
    const celebratedPets = getCelebratedPets(userId);
    return celebratedPets.includes(petId);
};

/**
 * Mark a pet as celebrated for a user
 */
export const markAsCelebrated = (petId: string, userId: string | null | undefined): void => {
    try {
        const key = getStorageKey(userId);
        const celebratedPets = getCelebratedPets(userId);
        
        if (!celebratedPets.includes(petId)) {
            celebratedPets.push(petId);
            localStorage.setItem(key, JSON.stringify(celebratedPets));
        }
    } catch (error) {
        console.error('Error marking pet as celebrated:', error);
    }
};

