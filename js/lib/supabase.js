import { createClient } from '@supabase/supabase-js';
import { CONFIG, isSupabaseConfigured } from '../config.js';

let client = null;

export function getSupabaseClient() {
    if (!isSupabaseConfigured()) return null;

    if (!client) {
        client = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    }

    return client;
}
