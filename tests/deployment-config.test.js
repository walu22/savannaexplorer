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

test('corrected border slugs retain permanent redirects', async () => {
    const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
    const redirects = Object.fromEntries(config.redirects.map(rule => [rule.source, rule]));

    assert.equal(redirects['/borders/groblersbrug'].destination, '/borders/martins-drift');
    assert.equal(redirects['/borders/komatipoort'].destination, '/borders/lebombo');
    assert.equal(redirects['/borders/nakonde'].destination, '/borders/mwami-mchinji');
    assert.equal(redirects['/borders/mchinji'].destination, '/borders/mwami-mchinji');
    assert.equal(redirects['/borders/pafuri-sengwe'].destination, '/borders/pafuri-border-gate');
    assert.equal(redirects['/borders/ficksburg-van-rooyens'].destination, '/borders/ficksburg-maputsoe');
    assert.equal(redirects['/borders/calelonspoort'].destination, '/borders/caledonspoort');
    assert.ok(Object.values(redirects).every(rule => rule.permanent));
});
