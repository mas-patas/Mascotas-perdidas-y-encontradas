
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from './Toast';
import { Toast } from '@/contexts/ToastContext';

describe('Toast Component', () => {
    const mockToasts: Toast[] = [
        { id: '1', message: 'Operación exitosa', type: 'success' },
        { id: '2', message: 'Hubo un error', type: 'error' }
    ];

    it('debe renderizar múltiples mensajes', () => {
        render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
        
        expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
        expect(screen.getByText('Hubo un error')).toBeInTheDocument();
    });

    it('debe aplicar estilos diferentes según el tipo', () => {
        render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
        
        // FIX: Usamos .parentElement en lugar de .closest('div') para seleccionar
        // el contenedor principal del Toast, que es donde se aplican los estilos.
        const successToast = screen.getByText('Operación exitosa').parentElement;
        const errorToast = screen.getByText('Hubo un error').parentElement;

        // Verificamos clases de Tailwind
        expect(successToast?.className).toContain('bg-green-50');
        expect(errorToast?.className).toContain('bg-red-50');
    });

    it('debe llamar a onClose al hacer click en el botón de cerrar', () => {
        const handleClose = vi.fn();
        render(<ToastContainer toasts={[mockToasts[0]]} onClose={handleClose} />);
        
        const closeButton = screen.getByLabelText('Close');
        fireEvent.click(closeButton);

        expect(handleClose).toHaveBeenCalledWith('1');
    });
});
