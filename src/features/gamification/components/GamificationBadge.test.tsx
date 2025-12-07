
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GamificationBadge, getLevelFromPoints, LEVELS } from '@/features/gamification';

describe('Lógica de Gamificación', () => {
    it('debe retornar nivel Novato para 0 puntos', () => {
        const level = getLevelFromPoints(0);
        expect(level.name).toBe('Chihuahua');
        expect(level.title).toBe('Novato');
    });

    it('debe retornar nivel Activo para 150 puntos', () => {
        const level = getLevelFromPoints(150);
        expect(level.name).toBe('Pug');
    });

    it('debe retornar nivel Leyenda (Gran Danés) para puntos muy altos', () => {
        const level = getLevelFromPoints(5000);
        expect(level.name).toBe('Gran Danés');
        expect(level.title).toBe('Leyenda');
    });
});

describe('Componente GamificationBadge', () => {
    it('debe renderizar el título y nombre del nivel correcto', () => {
        // Renderizamos con 50 puntos (Novato/Chihuahua)
        render(<GamificationBadge points={50} />);
        
        expect(screen.getByText('Chihuahua')).toBeInTheDocument();
        expect(screen.getByText('Novato')).toBeInTheDocument();
    });

    it('debe mostrar la barra de progreso si showProgress es true', () => {
        // 50 puntos es la mitad de camino para el siguiente nivel (100)
        const { container } = render(<GamificationBadge points={50} showProgress={true} />);
        
        // Verificamos que se renderice texto de puntos
        expect(screen.getByText('50 pts')).toBeInTheDocument();
        
        // Buscamos el elemento de la barra de progreso por su clase o estructura
        // En este caso verificamos que exista el contenedor de progreso
        const progressBar = container.querySelector('.bg-gray-200.rounded-full');
        expect(progressBar).toBeInTheDocument();
    });
});
