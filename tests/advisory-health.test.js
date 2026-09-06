import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
    advisorySources,
    checkAdvisorySource,
    runAdvisoryHealthCheck,
} from '../api/_lib/advisory-health.js';
import { createAdvisoryHealthHandler } from '../api/cron/advisory-health.js';

const productionData = JSON.parse(await readFile(new URL('../data/travel-advisories.json', import.meta.url), 'utf8'));

function mockResponse() {
    return {
        statusCode: 200,
        body: null,
        headers: {},
        once() {},
        setHeader(name, value) { this.headers[name] = value; },
        status(value) { this.statusCode = value; return this; },
        json(value) { this.body = value; return this; },
    };
}

test('advisory monitor covers two HTTPS authorities for every country', () => {
    const sources = advisorySources(productionData);

    assert.equal(productionData.countries.length, 9);
    assert.equal(sources.length, 18);
    assert.equal(new Set(sources.map(source => source.url)).size, 18);
    assert.ok(sources.every(source => source.validUrl));
    assert.ok(productionData.countries.every(country => country.links.length === 2));
});

test('source checks distinguish healthy, guarded and failed responses', async () => {
    const source = {
        countryId: 'test', country: 'Test', reviewedOn: '2026-09-06',
        label: 'Authority', url: 'https://example.gov/advice', validUrl: true,
    };
    const response = status => ({
        status,
        url: source.url,
        headers: { get: () => null },
        body: { cancel: async () => {} },
    });

    assert.equal((await checkAdvisorySource(source, { fetchImpl: async () => response(200) })).result, 'healthy');
    assert.equal((await checkAdvisorySource(source, { fetchImpl: async () => response(403) })).result, 'guarded');
    assert.equal((await checkAdvisorySource(source, { fetchImpl: async () => response(404) })).result, 'failed');
    const networkFailure = await checkAdvisorySource(source, {
        fetchImpl: async () => { throw Object.assign(new Error('offline'), { name: 'TypeError' }); },
    });
    assert.equal(networkFailure.result, 'failed');
    assert.equal(networkFailure.errorType, 'TypeError');
});

test('health report fails on broken links or overdue human review', async () => {
    const data = {
        countries: [
            { id: 'current', name: 'Current', lastVerified: '2026-09-20', links: [{ label: 'One', url: 'https://one.gov' }] },
            { id: 'old', name: 'Old', lastVerified: '2026-08-01', links: [{ label: 'Two', url: 'https://two.gov' }] },
        ],
    };
    const report = await runAdvisoryHealthCheck(data, {
        now: new Date('2026-09-26T06:00:00.000Z'),
        fetchImpl: async url => ({
            status: url.includes('two') ? 404 : 200,
            url,
            headers: { get: () => null },
            body: { cancel: async () => {} },
        }),
    });

    assert.equal(report.ok, false);
    assert.deepEqual(report.summary, {
        countries: 2, sources: 2, healthy: 1, guarded: 0, failed: 1,
        current: 1, dueSoon: 0, overdue: 1, unknown: 0,
    });
    assert.equal(report.needsReview[0].countryId, 'old');
});

test('cron endpoint requires GET and a configured matching secret', async () => {
    const runCheck = async () => ({
        ok: true,
        summary: { countries: 9, sources: 18, healthy: 18, guarded: 0, failed: 0, current: 9, dueSoon: 0, overdue: 0, unknown: 0 },
        needsReview: [],
        results: [],
    });
    const handler = createAdvisoryHealthHandler({
        loadData: async () => productionData,
        runCheck,
        secret: () => 'sixteen-character-secret',
    });

    const wrongMethod = mockResponse();
    await handler({ method: 'POST', headers: {} }, wrongMethod);
    assert.equal(wrongMethod.statusCode, 405);

    const unauthorized = mockResponse();
    await handler({ method: 'GET', headers: { authorization: 'Bearer wrong' } }, unauthorized);
    assert.equal(unauthorized.statusCode, 401);

    const authorized = mockResponse();
    await handler({
        method: 'GET',
        headers: {
            authorization: 'Bearer sixteen-character-secret',
            'x-vercel-cron-schedule': '17 4 * * *',
        },
    }, authorized);
    assert.equal(authorized.statusCode, 200);
    assert.equal(authorized.body.summary.sources, 18);
});

test('cron endpoint returns a failing status when editorial action is required', async () => {
    const handler = createAdvisoryHealthHandler({
        loadData: async () => productionData,
        runCheck: async () => ({
            ok: false,
            summary: { countries: 9, sources: 18, healthy: 17, guarded: 0, failed: 1, current: 8, dueSoon: 0, overdue: 1, unknown: 0 },
            needsReview: [{ countryId: 'zambia', status: 'overdue', dueOn: '2026-10-06' }],
            results: [{ countryId: 'zambia', label: 'Authority', result: 'failed', httpStatus: 404, errorType: null }],
        }),
        secret: () => 'sixteen-character-secret',
    });
    const response = mockResponse();

    await handler({ method: 'GET', headers: { authorization: 'Bearer sixteen-character-secret' } }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.ok, false);
});
