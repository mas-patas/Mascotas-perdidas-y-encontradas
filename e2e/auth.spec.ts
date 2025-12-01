import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('Debe permitir al usuario iniciar sesión y redirigir al home', async ({ page }) => {
    // 1. Interceptar la petición de login a Supabase
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      const json = {
        access_token: "fake-jwt-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "fake-refresh-token",
        user: {
          id: "test-user-id",
          aud: "authenticated",
          role: "authenticated",
          email: "test@example.com",
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      await route.fulfill({ json });
    });

    // 2. Interceptar la petición del perfil
    await page.route('**/rest/v1/profiles*', async route => {
      await route.fulfill({
        json: {
          id: "test-user-id",
          email: "test@example.com",
          username: "TestUser",
          role: "User",
          first_name: "Test",
          last_name: "User"
        }
      });
    });

    // 3. Flujo de UI
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    await page.click('button[type="submit"]');

    // 4. Verificaciones
    // Esperar redirección
    await expect(page).toHaveURL('/');
    
    // Verificar que aparece el nombre de usuario en el header (esto confirma login exitoso)
    await expect(page.getByText('TestUser')).toBeVisible();
  });
});