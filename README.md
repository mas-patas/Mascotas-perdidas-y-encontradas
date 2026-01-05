<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xJUADB6BqtL4OCVmNF4HoOHxzMAP4c-9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set environment variables in `.env.local`:
   - `VITE_SUPABASE_URL`: Your Supabase project URL (required)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (required)
   - `VITE_VAPID_PUBLIC_KEY`: Your VAPID public key for push notifications (required for push notifications)
   - `GEMINI_API_KEY`: Your Gemini API key (if using AI features)
   - `VITE_GA_MEASUREMENT_ID`: Your Google Analytics 4 Measurement ID (optional, format: `G-XXXXXXXXXX`)
3. Run the app:
   `npm run dev`

## Google Analytics Setup

This project includes Google Analytics 4 (GA4) integration. To enable it:

1. **Get your Measurement ID:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property or select an existing one
   - Navigate to Admin → Data Streams → Web
   - Copy your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure the environment variable:**
   - Create a `.env.local` file in the root directory (if it doesn't exist)
   - Add: `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (replace with your actual ID)
   - Restart your development server

3. **For production:**
   - Set the `VITE_GA_MEASUREMENT_ID` environment variable in your hosting platform (Vercel, Netlify, etc.)

**Note:** If `VITE_GA_MEASUREMENT_ID` is not set, Google Analytics will be automatically disabled and won't load any scripts.

## Push Notifications Setup

This project includes push notifications support. To enable it:

1. **Generate VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```
   This will output a Public Key and Private Key.

2. **Configure the environment variable:**
   - Create a `.env.local` file in the root directory (if it doesn't exist)
   - Add: `VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE` (replace with the Public Key from step 1)
   - **Important:** Keep the Private Key secure and store it in your backend/server environment variables (not in the frontend)

3. **For production:**
   - Set the `VITE_VAPID_PUBLIC_KEY` environment variable in your hosting platform (Vercel, Netlify, etc.)
   - Set the VAPID Private Key in your backend/server environment (for sending push notifications)

**Note:** If `VITE_VAPID_PUBLIC_KEY` is not set, push notifications will still work locally but remote push notifications (from the server) won't function. Users will still be able to receive local notifications.

### Verificar configuración

Para verificar si las push notifications están configuradas correctamente:

```bash
npm run check:push
```

Este script verificará:
- ✅ Configuración del frontend (VITE_VAPID_PUBLIC_KEY)
- ✅ Configuración del backend (VAPID_PRIVATE_KEY en Supabase)
- ✅ Estado de la base de datos (push_subscriptions)

### Configurar en Supabase Edge Functions

Para que las notificaciones funcionen cuando la app está cerrada, configura los secrets en Supabase:

```bash
supabase secrets set VAPID_PUBLIC_KEY=tu_clave_publica
supabase secrets set VAPID_PRIVATE_KEY=tu_clave_privada
supabase secrets set VAPID_EMAIL=noreply@maspatas.com
```

**Claves generadas para este proyecto:**
- Public Key: `BNepH_8rdfK9D9wWcal70NjGRJy8w5dinBP3sao3X1Wh-9fzo6rHN2_p7jh9vdF1X6YGawkLyqZWfJ8sclK1pBk`
- Private Key: `gdAFPyAlke2av2Vr634wuR-wDx2P7s5VyQsn1B5YTEc`

Para más detalles, consulta [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md)
