export const CONFIG = {
    appVersion: '4.1.0',
    supportPhone: '260977123456',
    supportEmail: 'bookings@savannaexplorer.com',
    supabase: {
        url: 'YOUR_SUPABASE_PROJECT_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY',
    },
};

export function isSupabaseConfigured() {
    return CONFIG.supabase.url !== 'YOUR_SUPABASE_PROJECT_URL';
}
