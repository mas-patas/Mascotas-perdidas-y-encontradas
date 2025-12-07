import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno del directorio actual
  // Fix: Cast process to any to avoid TypeScript error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Aseguramos que el build busque el index.html en la raíz
    root: '.',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/pages': path.resolve(__dirname, './src/pages'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
    server: {
      port: 3000,
      host: true
    },
    // Esto soluciona el error "process is not defined" en el navegador
    define: {
      // Reemplaza process.env.API_KEY con el valor real de la variable de entorno
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill seguro para cualquier otro uso de process.env
      'process.env': {} 
    }
  };
});