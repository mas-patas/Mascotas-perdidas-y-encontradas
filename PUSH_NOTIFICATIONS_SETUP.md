# Configuración de Push Notifications

## Cómo verificar si está configurado desde el backend

### Opción 1: Script de verificación (Recomendado)

Ejecuta el script de verificación:

```bash
npm run check:push
```

Este script verificará:
- ✅ Si `VITE_VAPID_PUBLIC_KEY` está configurada en el frontend
- ✅ Si `VAPID_PRIVATE_KEY` está configurada en Supabase Edge Functions
- ✅ Si la tabla `push_subscriptions` existe y tiene datos
- ✅ Si las credenciales de Supabase están configuradas

### Opción 2: Verificación manual

#### 1. Verificar Frontend

Revisa tu archivo `.env.local`:

```env
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

**Para generar tus propias claves VAPID:**
```bash
npx web-push generate-vapid-keys
```

#### 2. Verificar Backend (Supabase Edge Functions)

Las claves VAPID deben estar configuradas como secrets en Supabase:

```bash

```

#### 3. Verificar en la base de datos

Puedes verificar si hay suscripciones push guardadas:

```sql
SELECT COUNT(*) FROM push_subscriptions;
SELECT user_id, endpoint, created_at FROM push_subscriptions LIMIT 5;
```

## Estado actual del sistema

### ✅ Lo que ya está implementado:

1. **Frontend:**
   - Service Worker registrado (`public/sw.js`)
   - Banner de permisos (`NotificationPermissionBanner`)
   - Guardado de suscripciones en `push_subscriptions`
   - Notificaciones locales cuando la app está abierta

2. **Backend:**
   - Función helper para enviar push notifications (`pushNotifications.ts`)
   - Integración en `send-proximity-alerts` para enviar push cuando se crean alertas
   - Limpieza automática de suscripciones inválidas

### ⚠️ Lo que necesitas configurar:

1. **Frontend (.env.local):**
   ```env
 
   ```
   **Genera tus claves VAPID:**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Backend (Supabase Secrets):**

   **Nota:** Usa las mismas claves que generaste para el frontend.

## Cómo funciona

### Cuando la app está ABIERTA:
- Las notificaciones se envían a través de Supabase Realtime
- El frontend escucha cambios en la tabla `notifications`
- Se muestran notificaciones locales usando el Service Worker
- **Funciona sin configuración de VAPID**

### Cuando la app está CERRADA:
- El backend envía push notifications usando `web-push`
- Se usan las suscripciones guardadas en `push_subscriptions`
- El Service Worker recibe la notificación y la muestra
- **Requiere VAPID keys configuradas**

## Pruebas

### Probar notificaciones locales (app abierta):
1. Activa las notificaciones desde el banner
2. Crea una notificación en la base de datos
3. Deberías ver la notificación aparecer

### Probar push notifications (app cerrada):
1. Asegúrate de tener VAPID keys configuradas
2. Activa las notificaciones desde el banner
3. Cierra la app completamente
4. Dispara una alerta de proximidad (o crea una notificación manualmente)
5. Deberías recibir la notificación push

## Troubleshooting

### "Falta VITE_VAPID_PUBLIC_KEY"
- Agrega la clave a `.env.local`
- Reinicia el servidor de desarrollo

### "VAPID keys not configured" en el backend
- Configura los secrets en Supabase
- Redespliega las Edge Functions si es necesario

### Las notificaciones no aparecen cuando la app está cerrada
- Verifica que las VAPID keys estén configuradas
- Verifica que haya suscripciones en `push_subscriptions`
- Revisa los logs de Supabase Edge Functions

### Las suscripciones no se guardan
- Verifica los permisos RLS en `push_subscriptions`
- Verifica que el usuario esté autenticado

