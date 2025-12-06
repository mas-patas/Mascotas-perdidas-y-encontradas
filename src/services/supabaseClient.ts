
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Credenciales de Supabase no encontradas en config.ts');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true, // Ensures session allows survives browser restarts
        autoRefreshToken: true, // Automatically refreshes the token
        detectSessionInUrl: true // Detects OAuth tokens in URL after redirect
    }
});
