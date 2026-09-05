import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildProductEvent,
    classifyClientError,
    sanitizeAnalyticsUrl,
} from '../js/lib/product-analytics-core.js';

test('analytics URLs exclude private tokens, fragments and arbitrary query values', () => {
    const result = sanitizeAnalyticsUrl(
        'https://savannaexplorer.com/my-safari?share=private-token&invite=secret&utm_source=email&utm_campaign=spring-sale#hub-my-safari',
    );
    assert.equal(result, 'https://savannaexplorer.com/my-safari?utm_source=email&utm_campaign=spring-sale');
    assert.doesNotMatch(result, /private-token|secret|share|invite|#/);
});

test('product events contain only the approved coarse dimensions', () => {
    const event = buildProductEvent('trip_created', {
        source: 'My_Safari',
        status: 'not safe text!',
        itemType: 'stay',
        countryCount: 30,
        hasDates: true,
        tripName: 'Private family holiday',
    }, { pathname: '/my-safari', hash: '' }, '4.60.0');

    assert.deepEqual(Object.keys(event), [
        'event_type', 'page_type', 'source', 'status', 'item_type',
        'country_count', 'has_dates', 'client', 'app_version',
    ]);
    assert.equal(event.event_type, 'trip_created');
    assert.equal(event.page_type, 'hub_my-safari');
    assert.equal(event.source, 'my_safari');
    assert.equal(event.status, null);
    assert.equal(event.country_count, 9);
    assert.equal(event.has_dates, true);
    assert.equal('tripName' in event, false);
});

test('unknown events are rejected and client failures are coarsely classified', () => {
    assert.equal(buildProductEvent('trip_deleted', {}, { pathname: '/', hash: '' }, '4.60.0'), null);
    assert.equal(classifyClientError({ message: 'Failed to fetch dynamically imported module' }), 'chunk_load');
    assert.equal(classifyClientError({ reason: new Error('NetworkError') }), 'network');
    assert.equal(classifyClientError({ message: 'Unexpected token' }), 'runtime');
});
