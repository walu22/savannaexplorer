/**
 * Verify all Unsplash IDs in data/image-catalog.json return HTTP 200.
 * Run: npm run verify:images
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalog = JSON.parse(readFileSync(resolve(process.cwd(), 'data/image-catalog.json'), 'utf8'));
const images = catalog.images;

let failed = 0;

for (const [key, id] of Object.entries(images)) {
    if (key.startsWith('_')) continue;
    const url = `https://images.unsplash.com/photo-${id}?w=100`;
    try {
        const res = await fetch(url, { method: 'HEAD' });
        if (!res.ok) {
            console.error('FAIL', key, id, res.status);
            failed += 1;
        } else {
            console.log('OK  ', key);
        }
    } catch (err) {
        console.error('ERR ', key, err.message);
        failed += 1;
    }
}

if (failed) {
    console.error(`\n${failed} image(s) failed verification.`);
    process.exit(1);
}

console.log(`\nAll ${Object.keys(images).length} catalog images verified.`);
