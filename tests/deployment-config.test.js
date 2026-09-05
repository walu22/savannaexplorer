import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production deployment preserves root API functions', async () => {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const command = pkg.scripts['deploy:live'];

    assert.match(command, /vercel@59\.11\.7 deploy --prod --yes/);
    assert.doesNotMatch(command, /vercel deploy dist|--prebuilt/);
    assert.equal(pkg.scripts['verify:deployment'], 'node scripts/deployment-smoke.mjs');
});
