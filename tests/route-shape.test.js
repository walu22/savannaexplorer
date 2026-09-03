import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRouteShape } from '../js/lib/route-shape.js';

const location = (pathname, hash = '') => ({ pathname, hash });

test('public hubs resolve to their focused sections', () => {
    assert.deepEqual(parseRouteShape(location('/routes')), { type: 'home', sectionHash: 'route-explorer' });
    assert.deepEqual(parseRouteShape(location('/my-safari')), { type: 'home', sectionHash: 'hub-my-safari' });
    assert.deepEqual(parseRouteShape(location('/parks')), { type: 'home', sectionHash: 'parks' });
});

test('detail routes are classified without loading content datasets', () => {
    assert.deepEqual(parseRouteShape(location('/countries/namibia')), { type: 'country', countryId: 'namibia' });
    assert.deepEqual(parseRouteShape(location('/routes/namibia-desert-classics')), { type: 'route', routeId: 'namibia-desert-classics' });
    assert.deepEqual(parseRouteShape(location('/guides/planning/botswana')), { type: 'planning-guide', countryId: 'botswana' });
});

test('legacy hashes continue to resolve as homepage sections', () => {
    assert.deepEqual(parseRouteShape(location('/', '#packing-list')), { type: 'home', sectionHash: 'packing-list' });
});
