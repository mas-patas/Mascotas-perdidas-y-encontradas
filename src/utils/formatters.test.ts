
import { describe, it, expect } from 'vitest';
import { formatTime } from './formatters';

describe('formatTime', () => {
  it('debe formatear correctamente una fecha ISO a hora (HH:MM)', () => {
    // Simulamos una fecha: 2023-10-05 T 14:30:00
    const testDate = '2023-10-05T14:30:00.000Z';
    // Nota: El resultado depende de la zona horaria del sistema donde corre el test.
    // Para consistencia en tests, verificamos que devuelva un string con formato correcto
    const result = formatTime(testDate);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('debe devolver cadena vacía si la fecha es inválida', () => {
    const result = formatTime('fecha-invalida');
    expect(result).toBe('');
  });

  it('debe devolver cadena vacía si la fecha es null o undefined', () => {
    // @ts-ignore
    expect(formatTime(null)).toBe('');
    // @ts-ignore
    expect(formatTime(undefined)).toBe('');
  });
});
