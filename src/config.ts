// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Storage Configuration
// Options: 'supabase'
export const STORAGE_PROVIDER = import.meta.env.VITE_STORAGE_PROVIDER || 'supabase';

// Bucket name in Supabase Storage
export const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'pet-images';

// Push Notifications - VAPID Public Key
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required');
}
