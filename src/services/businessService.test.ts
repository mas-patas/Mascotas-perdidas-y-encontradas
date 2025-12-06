
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessService } from './businessService';
import { supabase } from './supabaseClient';

// Mock de Supabase
vi.mock('./supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            single: vi.fn(),
        }))
    }
}));

describe('businessService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAllBusinesses debe retornar array mapeado correctamente', async () => {
        const mockData = [
            { id: '1', name: 'Vet 1', owner_id: 'owner1', lat: 10, lng: 10 }
        ];

        // Configurar cadena de mocks de Supabase
        const selectMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
        (supabase.from as any).mockReturnValue({ select: selectMock });

        const result = await businessService.getAllBusinesses();

        expect(supabase.from).toHaveBeenCalledWith('businesses');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
        // Verificar mapeo camelCase
        expect(result[0].ownerId).toBe('owner1');
    });

    it('createBusiness debe manejar inserción y retornar ID', async () => {
        const newBiz = {
            ownerId: 'user1',
            name: 'New Vet',
            type: 'Veterinaria',
            description: 'Desc',
            address: 'Av 1',
            phone: '123',
            services: [],
            lat: 0,
            lng: 0
        };

        const insertMock = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ insert: insertMock });

        // @ts-ignore
        const id = await businessService.createBusiness(newBiz);

        expect(supabase.from).toHaveBeenCalledWith('businesses');
        expect(insertMock).toHaveBeenCalled();
        expect(typeof id).toBe('string');
        expect(id?.length).toBeGreaterThan(0);
    });

    it('debe manejar errores de Supabase elegantemente', async () => {
        const selectMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
        (supabase.from as any).mockReturnValue({ select: selectMock });

        const result = await businessService.getAllBusinesses();

        // En el servicio, capturamos el error y devolvemos array vacío
        expect(result).toEqual([]);
    });
});
