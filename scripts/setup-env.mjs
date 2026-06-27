import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');

const envContent = `VITE_SUPABASE_URL=https://pyfxdiqbpiwmpfutvxbh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_j0XZeObIGvUMM1IC9UYJyA_HB1RgYUf
`;

if (existsSync(envPath)) {
    console.log('.env already exists — leaving it unchanged.');
} else {
    writeFileSync(envPath, envContent, 'utf8');
    console.log('Created .env with Supabase credentials.');
}
