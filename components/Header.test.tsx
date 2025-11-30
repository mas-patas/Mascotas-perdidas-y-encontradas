
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';

// Mock del hook useAuth
vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock de hooks de navegación ya que Header usa useNavigate/useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/' }),
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

    it('debe mostrar el botón de "Ingresar" cuando no hay usuario logueado', () => {
        // Simulamos estado: No usuario
        (useAuth as any).mockReturnValue({
            currentUser: null,
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <Header {...defaultProps} />
            </BrowserRouter>
        );

        // Verifica que aparezca el enlace/botón de Ingresar
        expect(screen.getByText(/Ingresar/i)).toBeInTheDocument();
        // Verifica que NO aparezca el perfil
        expect(screen.queryByText(/Mi Cuenta/i)).not.toBeInTheDocument();
    });

    it('debe mostrar el usuario y opciones cuando está logueado', () => {
        // Simulamos estado: Usuario logueado
        (useAuth as any).mockReturnValue({
            currentUser: { 
                id: '1', 
                email: 'test@test.com', 
                username: 'TestUser', 
                role: 'User' 
            },
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <Header {...defaultProps} />
            </BrowserRouter>
        );

        // Verifica que aparezca el nombre del usuario
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        
        // Verifica que aparezca el botón de mensajes
        // Nota: El botón de mensajes tiene texto oculto en móvil, buscamos por aria-label o icono si es necesario,
        // pero en desktop el texto "Mensajes" existe.
        const msgBtn = screen.getByLabelText('Mensajes');
        expect(msgBtn).toBeInTheDocument();
    });

    it('debe llamar a onToggleSidebar al hacer clic en el menú (móvil)', () => {
        (useAuth as any).mockReturnValue({ currentUser: null });

        render(
            <BrowserRouter>
                <Header {...defaultProps} />
            </BrowserRouter>
        );

        // El botón de menú solo es visible en resoluciones móviles, pero existe en el DOM.
        const menuBtn = screen.getByLabelText('Abrir menú de filtros');
        fireEvent.click(menuBtn);

        expect(defaultProps.onToggleSidebar).toHaveBeenCalledTimes(1);
    });
});
