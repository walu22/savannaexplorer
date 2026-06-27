export const CONFIG = {
    appVersion: '4.6.1',
    supportPhone: '260977123456',
    supportEmail: 'bookings@savannaexplorer.com',
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
    },
};

export function isSupabaseConfigured() {
    const { url, anonKey } = CONFIG.supabase;
    return Boolean(
        url &&
        anonKey &&
        url !== 'YOUR_SUPABASE_PROJECT_URL' &&
        anonKey !== 'YOUR_SUPABASE_ANON_KEY'
    );
}
