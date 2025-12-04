
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // Usar MemoryRouter para tests
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';

// Mock del hook useAuth
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock del hook de navegación, pero ya no del de location
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Header Component', () => {
    const defaultProps = {
        onReportPet: vi.fn(),
        onOpenAdoptionModal: vi.fn(),
        onToggleSidebar: vi.fn(),
        hasUnreadMessages: false,
        notifications: [],
        onMarkNotificationAsRead: vi.fn(),
        onMarkAllNotificationsAsRead: vi.fn(),
        onResetFilters: vi.fn(),
    };

    // Limpiar mocks después de cada test
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('debe mostrar el botón de "Ingresar" cuando no hay usuario logueado', () => {
        (useAuth as any).mockReturnValue({ currentUser: null });

        render(
            <MemoryRouter initialEntries={['/']}>
                <Header {...defaultProps} />
            </MemoryRouter>
        );

        // FIX: Buscar por rol de link. getByText falla porque el texto está en un span que se oculta.
        const loginLink = screen.getByRole('link', { name: /ingresar/i });
        expect(loginLink).toBeInTheDocument();
        
        // FIX: Buscar el botón de cuenta por su aria-label, que es más fiable.
        expect(screen.queryByLabelText(/Mi Cuenta/i)).not.toBeInTheDocument();
    });

    it('debe mostrar el usuario y opciones cuando está logueado', () => {
        (useAuth as any).mockReturnValue({
            currentUser: { 
                id: '1', 
                email: 'test@test.com', 
                username: 'TestUser', 
                role: 'User',
                firstName: 'Test',
            },
            logout: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={['/']}>
                <Header {...defaultProps} />
            </MemoryRouter>
        );

        // FIX: El nombre de usuario está en un span que se oculta.
        // Se busca el botón que lo contiene y se verifica el contenido del texto.
        const accountButton = screen.getByLabelText(/Mi Cuenta/i);
        expect(accountButton).toHaveTextContent('TestUser');
        
        const msgBtn = screen.getByLabelText('Mensajes');
        expect(msgBtn).toBeInTheDocument();
    });

    it('debe llamar a onToggleSidebar al hacer clic en el menú (móvil)', () => {
        (useAuth as any).mockReturnValue({ currentUser: null });

        render(
            // FIX: Usar MemoryRouter para asegurar que el path es '/' y el botón se renderiza.
            <MemoryRouter initialEntries={['/']}>
                <Header {...defaultProps} />
            </MemoryRouter>
        );

        // El botón ahora se renderiza correctamente gracias a MemoryRouter.
        const menuBtn = screen.getByLabelText('Abrir menú de filtros');
        fireEvent.click(menuBtn);

        expect(defaultProps.onToggleSidebar).toHaveBeenCalledTimes(1);
    });
});
