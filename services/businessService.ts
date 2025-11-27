

import { supabase } from './supabaseClient';
import { Business, BusinessProduct } from '../types';
import { generateUUID } from '../utils/uuid';

export const businessService = {
    // Fetch a single business by ID
    getBusinessById: async (id: string): Promise<Business | null> => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            // Enrich with products
            const { data: products, error: prodError } = await supabase
                .from('business_products')
                .select('*')
                .eq('business_id', id);
            
            if (prodError) console.warn("Error fetching products:", prodError.message);

            return {
                id: data.id,
                ownerId: data.owner_id,
                name: data.name,
                type: data.type,
                description: data.description,
                address: data.address,
                phone: data.phone,
                whatsapp: data.whatsapp,
                website: data.website,
                facebook: data.facebook,
                instagram: data.instagram,
                logoUrl: data.logo_url,
                coverUrl: data.cover_url,
                bannerUrl: data.banner_url,
                services: data.services || [],
                products: (products || []).map((p: any) => ({
                    id: p.id,
                    businessId: p.business_id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    imageUrl: p.image_url, // Fallback
                    imageUrls: p.image_urls || (p.image_url ? [p.image_url] : [])
                })),
                lat: data.lat,
                lng: data.lng
            };
        } catch (error: any) {
            console.error('Error fetching business:', error.message || error);
            return null;
        }
    },

    // Fetch all businesses
    getAllBusinesses: async (): Promise<Business[]> => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*');
            
            if (error) throw error;

            return data.map((b: any) => ({
                id: b.id,
                ownerId: b.owner_id,
                name: b.name,
                type: b.type,
                description: b.description,
                address: b.address,
                phone: b.phone,
                whatsapp: b.whatsapp,
                website: b.website,
                facebook: b.facebook,
                instagram: b.instagram,
                logoUrl: b.logo_url,
                coverUrl: b.cover_url,
                bannerUrl: b.banner_url,
                services: b.services || [],
                lat: b.lat,
                lng: b.lng
            }));
        } catch (error: any) {
            console.error('Error fetching businesses:', error.message || error);
            return [];
        }
    },

    // Fetch business by owner ID
    getBusinessByOwnerId: async (ownerId: string): Promise<Business | null> => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', ownerId)
                .single();
            
            if (error) {
                // Ignore error if specifically "Row not found" (PGRST116), it just means user has no business
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching business by owner:', error.message);
                }
                return null; 
            }

            // Enrich with products
            const { data: products } = await supabase
                .from('business_products')
                .select('*')
                .eq('business_id', data.id);

            return {
                id: data.id,
                ownerId: data.owner_id,
                name: data.name,
                type: data.type,
                description: data.description,
                address: data.address,
                phone: data.phone,
                whatsapp: data.whatsapp,
                website: data.website,
                facebook: data.facebook,
                instagram: data.instagram,
                logoUrl: data.logo_url,
                coverUrl: data.cover_url,
                bannerUrl: data.banner_url,
                services: data.services || [],
                products: (products || []).map((p: any) => ({
                    id: p.id,
                    businessId: p.business_id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    imageUrl: p.image_url,
                    imageUrls: p.image_urls || (p.image_url ? [p.image_url] : [])
                })),
                lat: data.lat,
                lng: data.lng
            };
        } catch (error) {
            return null;
        }
    },

    // Create Business (Admin)
    createBusiness: async (business: Omit<Business, 'id' | 'products'>): Promise<string | null> => {
        const id = generateUUID();
        const { error } = await supabase.from('businesses').insert({
            id: id,
            owner_id: business.ownerId,
            name: business.name,
            type: business.type,
            description: business.description,
            address: business.address,
            phone: business.phone,
            whatsapp: business.whatsapp,
            logo_url: business.logoUrl,
            cover_url: business.coverUrl,
            banner_url: business.bannerUrl,
            services: business.services,
            lat: business.lat,
            lng: business.lng,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error('Error creating business:', error.message || error);
            throw error;
        }
        return id;
    },

    // Update Business
    updateBusiness: async (id: string, updates: Partial<Business>): Promise<void> => {
        const dbUpdates: any = {
            name: updates.name,
            type: updates.type,
            description: updates.description,
            address: updates.address,
            phone: updates.phone,
            whatsapp: updates.whatsapp,
            website: updates.website,
            facebook: updates.facebook,
            instagram: updates.instagram,
            logo_url: updates.logoUrl,
            cover_url: updates.coverUrl,
            banner_url: updates.bannerUrl,
            services: updates.services,
            lat: updates.lat,
            lng: updates.lng
        };

        // Clean undefined
        Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

        const { error } = await supabase
            .from('businesses')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating business:', error.message || error);
            throw error;
        }
    },

    // Add Product
    addProduct: async (product: Omit<BusinessProduct, 'id'>): Promise<void> => {
        const { error } = await supabase.from('business_products').insert({
            id: generateUUID(),
            business_id: product.businessId,
            name: product.name,
            description: product.description,
            price: product.price,
            image_url: product.imageUrls?.[0], // Backwards compatibility
            image_urls: product.imageUrls
        });
        if (error) {
            console.error('Error adding product:', error.message || error);
            throw error;
        }
    },

    // Delete Product
    deleteProduct: async (productId: string): Promise<void> => {
        const { error } = await supabase.from('business_products').delete().eq('id', productId);
        if (error) throw error;
    }
};