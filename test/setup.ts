
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpiar el DOM después de cada prueba
afterEach(() => {
  cleanup();
});
