export const CONFIG = {
    appVersion: '4.13.0',
    siteMode: 'hub',
    siteUrl: import.meta.env.VITE_SITE_URL || '',
    supportPhone: '260977123456',
    supportEmail: 'info@savannaexplorer.com',
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
