/**
 * Upsert all marketplace experiences into Supabase.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (Dashboard → Project Settings → API → secret key).
 * The publishable/anon key cannot insert due to RLS.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
    const envPath = resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
    console.error('Missing VITE_SUPABASE_URL in .env');
    process.exit(1);
}

if (!serviceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('Add it from Supabase Dashboard → Project Settings → API → secret key');
    console.error('Then run: npm run seed:supabase');
    process.exit(1);
}

const marketplace = JSON.parse(readFileSync(resolve(process.cwd(), 'data/marketplace.json'), 'utf8'));
const rows = Object.values(marketplace).flat().map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    location: item.location,
    duration: item.duration,
    price_range: item.price_range,
    rating: item.rating,
    badge: item.badge,
    best_time: item.best_time,
    image_url: item.image,
    description: item.description,
}));

const supabase = createClient(url, serviceKey);

const { data: before } = await supabase.from('experiences').select('id', { count: 'exact', head: true });
console.log(`Current experiences in Supabase: ${before ?? 'unknown'}`);

const { data, error } = await supabase
    .from('experiences')
    .upsert(rows, { onConflict: 'id' })
    .select('id');

if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
}

const { count } = await supabase.from('experiences').select('id', { count: 'exact', head: true });

console.log(`Seeded ${data.length} experiences (upsert).`);
console.log(`Total in Supabase: ${count}`);
