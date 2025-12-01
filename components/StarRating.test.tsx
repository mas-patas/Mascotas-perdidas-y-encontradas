
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating Component', () => {
    it('debe renderizar el número correcto de estrellas (5 por defecto)', () => {
        const { container } = render(<StarRating rating={3} />);
        // Buscamos los botones que contienen los SVGs
        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(5);
    });

    it('debe mostrar visualmente el rating correcto (clase de color)', () => {
        const { container } = render(<StarRating rating={3} />);
        const buttons = container.querySelectorAll('button');
        
        // Las primeras 3 deben tener clase de color amarillo (text-yellow-400)
        // Nota: Esto depende de la implementación exacta de clases en StarRating.tsx
        expect(buttons[0].className).toContain('text-yellow-400');
        expect(buttons[2].className).toContain('text-yellow-400');
        
        // La 4ta debe ser gris (text-gray-300)
        expect(buttons[3].className).toContain('text-gray-300');
    });

    it('debe llamar a onRate al hacer click si es interactivo', () => {
        const handleRate = vi.fn();
        const { container } = render(<StarRating rating={0} interactive={true} onRate={handleRate} />);
        
        const buttons = container.querySelectorAll('button');
        // Click en la 4ta estrella
        fireEvent.click(buttons[3]);

        expect(handleRate).toHaveBeenCalledWith(4);
    });

    it('no debe llamar a onRate si no es interactivo', () => {
        const handleRate = vi.fn();
        const { container } = render(<StarRating rating={0} interactive={false} onRate={handleRate} />);
        
        const buttons = container.querySelectorAll('button');
        fireEvent.click(buttons[3]);

        expect(handleRate).not.toHaveBeenCalled();
    });
});
