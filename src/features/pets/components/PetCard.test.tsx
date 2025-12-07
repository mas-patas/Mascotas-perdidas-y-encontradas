
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PetCard } from '@/features/pets';
import { PET_STATUS, ANIMAL_TYPES } from '@/constants';
import type { Pet } from '@/types';

// Mock useAuth since PetCard uses it
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: null, // Simulate logged out for basic render
        savePet: vi.fn(),
        unsavePet: vi.fn()
    })
}));

const mockPet: Pet = {
    id: '123',
    name: 'Firulais',
    status: PET_STATUS.PERDIDO,
    animalType: ANIMAL_TYPES.PERRO,
    breed: 'Mestizo',
    color: 'Marron',
    location: 'Parque Kennedy, Lima',
    date: '2023-10-10T10:00:00Z',
    contact: '999999999',
    description: 'Un perro muy bueno',
    imageUrls: ['https://example.com/img.jpg'],
    userEmail: 'owner@test.com'
};

describe('PetCard Component', () => {
    it('debe renderizar el nombre de la mascota', () => {
        render(
            <BrowserRouter>
                <PetCard pet={mockPet} />
            </BrowserRouter>
        );
        expect(screen.getByText('Firulais')).toBeInTheDocument();
    });

    it('debe mostrar el estado correcto (badge)', () => {
        render(
            <BrowserRouter>
                <PetCard pet={mockPet} />
            </BrowserRouter>
        );
        expect(screen.getByText(PET_STATUS.PERDIDO)).toBeInTheDocument();
    });

    it('debe mostrar la ubicación y raza', () => {
        render(
            <BrowserRouter>
                <PetCard pet={mockPet} />
            </BrowserRouter>
        );
        expect(screen.getByText(/Parque Kennedy/i)).toBeInTheDocument();
        expect(screen.getByText(/Mestizo/i)).toBeInTheDocument();
    });

    it('debe contener el link correcto hacia el detalle', () => {
        render(
            <BrowserRouter>
                <PetCard pet={mockPet} />
            </BrowserRouter>
        );
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/mascota/123');
    });
});
