import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
const payload = {
    version: pkg.version,
    builtAt: new Date().toISOString(),
};

writeFileSync(
    resolve(process.cwd(), 'public/version.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
);

console.log(`Wrote public/version.json (${payload.version})`);
