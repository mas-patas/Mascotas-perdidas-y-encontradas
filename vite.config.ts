import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';

// Plugin para reemplazar variables de entorno en index.html
function htmlEnvPlugin(mode: string): Plugin {
  return {
    name: 'html-env-replace',
    transformIndexHtml(html: string) {
      // Cargar variables de entorno
      const env = loadEnv(mode, (process as any).cwd(), '');
      const gtmId = env.VITE_GTM_ID || '';
      const gaId = env.VITE_GA_MEASUREMENT_ID || '';
      
      let result = html;
      
      // Procesar Google Tag Manager
      if (gtmId) {
        // Reemplazar el placeholder GTM-XXXXXXX con el ID real
        result = result.replace(/GTM-XXXXXXX/g, gtmId);
      } else {
        // Si no hay ID, reemplazar todo el bloque de GTM con un comentario
        const gtmBlockPattern = /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/;
        const gtmNoscriptPattern = /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/;
        
        result = result.replace(
          gtmBlockPattern,
          '<!-- Google Tag Manager - Disabled: VITE_GTM_ID not set -->'
        );
        result = result.replace(
          gtmNoscriptPattern,
          '<!-- Google Tag Manager (noscript) - Disabled: VITE_GTM_ID not set -->'
        );
      }
      
      // Procesar Google Analytics 4
      if (gaId) {
        // Reemplazar el placeholder con el ID real
        result = result.replace(/G-XXXXXXXXXX/g, gaId);
      } else {
        // Si no hay ID, reemplazar todo el bloque de Google Analytics con un no-op
        // Match desde el comentario hasta el último </script> de Google Analytics (3 script tags)
        const gaBlockPattern = /<!-- Google Analytics 4 -->[\s\S]*?<!-- If VITE_GA_MEASUREMENT_ID is not set, this section will be commented out -->[\s\S]*?<\/script>\s*<script[^>]*>[\s\S]*?<\/script>\s*<script[^>]*>[\s\S]*?<\/script>/;
        
        result = result.replace(
          gaBlockPattern,
          '<!-- Google Analytics 4 - Disabled: VITE_GA_MEASUREMENT_ID not set -->\n    <script>\n      // No-op gtag function to prevent errors\n      window.gtag = window.gtag || function(){};\n    </script>'
        );
      }
      
      return result;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno del directorio actual
  // Fix: Cast process to any to avoid TypeScript error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react(), htmlEnvPlugin(mode)],
    // Aseguramos que el build busque el index.html en la raíz
    root: '.',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
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