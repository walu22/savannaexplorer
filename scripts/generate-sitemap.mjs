/**
 * Generate public/sitemap.xml and public/robots.txt before build.
 * Set VITE_SITE_URL in .env for production domain (no trailing slash).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
    const envPath = resolve(process.cwd(), '.env');
    try {
        for (const line of readFileSync(envPath, 'utf8').split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            const value = trimmed.slice(eq + 1).trim();
            if (!process.env[key]) process.env[key] = value;
        }
    } catch {
        // optional .env
    }
}

loadEnv();

const siteUrl = (process.env.VITE_SITE_URL || 'https://savannaexplorer.com').replace(/\/$/, '');
const countries = JSON.parse(readFileSync(resolve(process.cwd(), 'data/countries.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const urls = [
    { loc: `${siteUrl}/`, changefreq: 'weekly', priority: '1.0' },
    ...Object.keys(countries).map(id => ({
        loc: `${siteUrl}/countries/${id}`,
        changefreq: 'monthly',
        priority: '0.9',
    })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(resolve(process.cwd(), 'public/sitemap.xml'), sitemap);
writeFileSync(resolve(process.cwd(), 'public/robots.txt'), robots);
console.log(`Generated sitemap with ${urls.length} URLs for ${siteUrl}`);
