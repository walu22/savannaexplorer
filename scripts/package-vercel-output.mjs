/**
 * Package dist/ into Vercel Build Output API format — no `vercel build` / cmd.exe required.
 * Used by deploy:live:prebuilt on Windows and CI.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const outputDir = resolve(root, '.vercel/output');
const staticDir = resolve(outputDir, 'static');

const vercelConfig = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(staticDir, { recursive: true });
cpSync(distDir, staticDir, { recursive: true });

const routes = [];

for (const headerRule of vercelConfig.headers || []) {
    const src = headerRule.source?.replace(/\(\.\*\)/g, '(.*)') || '/(.*)';
    const headers = Object.fromEntries(
        (headerRule.headers || []).map(h => [h.key.toLowerCase(), h.value]),
    );
    if (Object.keys(headers).length) {
        routes.push({ src, headers, continue: true });
    }
}

routes.push({ handle: 'filesystem' });

for (const rewrite of vercelConfig.rewrites || []) {
    routes.push({
        src: rewrite.source?.replace(/\(\.\*\)/g, '(.*)') || '/(.*)',
        dest: rewrite.destination || '/index.html',
    });
}

const config = {
    version: 3,
    routes,
};

writeFileSync(resolve(outputDir, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
console.log(`Packaged ${distDir} → ${outputDir} (Vercel Output API v3)`);
