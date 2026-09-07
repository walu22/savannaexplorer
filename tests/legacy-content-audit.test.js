import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('legacy culture stereotypes are replaced by actionable community-travel guidance', () => {
    assert.doesNotMatch(index, /Cultural Mosaic|most fascinating peoples|legendary warriors|Masters of cattle and democracy/);
    assert.match(index, /Connect with local communities respectfully/);
    assert.match(index, /Choose an experience that benefits its hosts/);
    assert.match(index, /Agree on photography first/);
    assert.match(index, /Protect children/);
    assert.match(index, /Find official operator directories/);
    assert.match(index, /Open the phrasebook/);
});

test('community travel page links to context for all nine supported countries', () => {
    const countryIds = [
        'namibia', 'botswana', 'south-africa', 'zambia', 'zimbabwe',
        'malawi', 'mozambique', 'lesotho', 'eswatini',
    ];

    countryIds.forEach(countryId => assert.match(index, new RegExp(`href="/countries/${countryId}"`)));
});
