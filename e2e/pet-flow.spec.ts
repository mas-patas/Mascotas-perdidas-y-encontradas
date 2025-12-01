import { test, expect } from '@playwright/test';

// Mock Data
const MOCK_PET = {
  id: 'pet-123',
  name: 'Firulais E2E',
  status: 'Perdido',
  animal_type: 'Perro',
  breed: 'Mestizo',
  color: 'Negro',
  location: 'Parque Kennedy, Lima',
  description: 'Prueba automatizada',
  lat: -12.122,
  lng: -77.030,
  user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  image_urls: ['https://placehold.co/400'],
  date: new Date().toISOString().split('T')[0],
  contact: '999888777'
};

test.describe('Gestión de Mascotas', () => {
  
  // Setup: Login Mockeado antes de cada test
  test.beforeEach(async ({ page }) => {
    // Mock Auth Session
    await page.addInitScript(() => {
        window.localStorage.setItem('sb-bacpduvlvymxvcdmtsvr-auth-token', JSON.stringify({
            access_token: "fake-jwt",
            refresh_token: "fake-refresh",
            user: { id: "test-user-id", email: "test@example.com" }
        }));
    });

    // Mock Profile
    await page.route('**/rest/v1/profiles*', async route => {
        await route.fulfill({ json: { id: "test-user-id", username: "TestUser", role: "User", saved_pet_ids: [] } });
    });
  });

  test('Debe permitir reportar una mascota perdida', async ({ page }) => {
    // Interceptar POST a pets
    let postRequestData: any;
    await page.route('**/rest/v1/pets', async route => {
        if (route.request().method() === 'POST') {
            postRequestData = route.request().postDataJSON();
            await route.fulfill({ status: 201, json: [MOCK_PET] }); // Supabase returns array on insert
        } else {
            await route.continue();
        }
    });

    // Interceptar subida de imagen (Storage)
    await page.route('**/storage/v1/object/pet-images/*', async route => {
        await route.fulfill({ json: { Key: 'fake-path' } });
    });
    // Interceptar URL pública
    await page.route('**/storage/v1/object/public/pet-images/*', async route => {
        await route.fulfill({ json: { publicUrl: 'https://placehold.co/400' } });
    });

    await page.goto('/');
    
    // 1. Abrir Modal
    const reportBtn = page.locator('[data-tour="header-report-btn"]');
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();
    await page.getByText('Reportar Mascota Perdida').click();

    // 2. Llenar Formulario
    await page.fill('input[name="name"]', 'Firulais E2E');
    await page.selectOption('select[name="breed"]', 'Mestizo');
    await page.selectOption('select[name="color1"]', 'Negro');
    await page.fill('input[name="address"]', 'Parque Kennedy');
    
    // Simular clic en mapa (esto actualizaría lat/lng en la app real)
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 150, y: 150 } });

    await page.fill('input[name="contact"]', '999888777');
    
    // Simular subida de archivo (creamos un buffer fake)
    // Usamos (globalThis as any).Buffer para evitar errores de TS si @types/node falta
    await page.setInputFiles('input[type="file"]', {
      name: 'dog.jpg',
      mimeType: 'image/jpeg',
      buffer: (globalThis as any).Buffer.from('fake-image-content')
    });

    // Esperar a que la "subida" termine (la UI cambia)
    await expect(page.getByText('Subiendo...')).not.toBeVisible();

    // 3. Enviar
    await page.click('button[type="submit"]');

    // 4. Verificar
    // Verificar que se hizo el POST con los datos correctos
    expect(postRequestData).toBeTruthy();
    expect(postRequestData.name).toBe('Firulais E2E');
    
    // Verificar mensaje de éxito o cierre de modal
    await expect(page.locator('text=Reportar Mascota Perdida')).not.toBeVisible();
  });

  test('Debe visualizar la mascota en el mapa', async ({ page }) => {
    // Interceptar GET pets para el mapa
    await page.route('**/rest/v1/pets*', async route => {
        const url = route.request().url();
        // Solo responder con mock si pide coordenadas (lat/lng not null)
        if (url.includes('lat') && url.includes('lng')) {
            await route.fulfill({ json: [MOCK_PET] });
        } else {
            await route.continue();
        }
    });

    await page.goto('/mapa');
    
    // Verificar que el mapa se carga
    await expect(page.locator('#map')).toBeVisible();
    
    // Verificar que el marcador existe (Leaflet crea imágenes para los marcadores)
    // Buscamos dentro del contenedor del mapa
    await expect(page.locator('.marker-pin.lost')).toBeVisible();
  });

  test('Debe generar el afiche correctamente (html2canvas integration)', async ({ page }) => {
    // Interceptar detalle de mascota
    await page.route(`**/rest/v1/pets?id=eq.${MOCK_PET.id}*`, async route => {
        await route.fulfill({ json: MOCK_PET });
    });
    // Interceptar comentarios
    await page.route('**/rest/v1/comments*', async route => {
        await route.fulfill({ json: [] });
    });

    await page.goto(`/mascota/${MOCK_PET.id}`);

    // Abrir modal de afiche (el botón de impresora)
    await page.click('button[title="Imprimir Afiche"]');
    
    // Verificar que el modal de preview se abre
    await expect(page.locator('#flyer-preview')).toBeVisible();

    // Mockear la descarga de imagen
    // html2canvas crea un enlace <a> y le hace click. Interceptamos ese download.
    const downloadPromise = page.waitForEvent('download');
    
    // Clic en "Descargar Imagen"
    await page.getByText('Descargar Imagen').click();

    // Esperar evento de descarga
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('SE_BUSCA_FIRULAIS');
  });

});