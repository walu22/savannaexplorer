import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    buildFreshnessReport,
    classifyFreshness,
    parseReviewedDate,
} from '../scripts/lib/editorial-freshness.mjs';

function loadJson(file) {
    return JSON.parse(readFileSync(resolve(process.cwd(), 'data', file), 'utf8'));
}

const productionData = {
    countries: loadJson('countries.json'),
    practical: loadJson('practical.json'),
    visaPassport: loadJson('visa-passport.json'),
    countryResources: loadJson('country-resources.json'),
    borders: loadJson('borders.json'),
    parks: loadJson('parks.json'),
    travelAdvisories: loadJson('travel-advisories.json'),
    editorialEvidence: loadJson('editorial-review-evidence.json'),
};

test('month-only review dates use the final day of the month', () => {
    assert.equal(parseReviewedDate('2026-02').toISOString(), '2026-02-28T00:00:00.000Z');
    assert.equal(parseReviewedDate('2024-02').toISOString(), '2024-02-29T00:00:00.000Z');
    assert.equal(parseReviewedDate('2026-13'), null);
});

test('freshness classification distinguishes overdue, due soon and current records', () => {
    assert.equal(classifyFreshness('2026-03', 90, '2026-09-05').status, 'overdue');
    assert.equal(classifyFreshness('2026-06', 90, '2026-09-05').status, 'due-soon');
    assert.equal(classifyFreshness('2026-08', 90, '2026-09-05').status, 'current');
    assert.equal(classifyFreshness('not-a-date', 90, '2026-09-05').status, 'unknown');
});

test('editorial report covers every first-slice high-change record', () => {
    const report = buildFreshnessReport(productionData, { asOf: '2026-09-06' });
    const expected = productionData.practical.visaHealth.length
        + Object.keys(productionData.visaPassport.rules).length
        + productionData.borders.length
        + productionData.parks.length
        + productionData.practical.emergencies.length
        + productionData.travelAdvisories.countries.length;

    assert.equal(report.summary.total, expected);
    assert.equal(report.summary.total, 93);
    assert.equal(report.summary.overdue + report.summary.dueSoon + report.summary.current + report.summary.unknown, 93);
    assert.equal(report.records[0].status, 'overdue');
    assert.equal(report.summary.criticalOverdue, 0);
    assert.ok(report.summary.sourceLinked >= 90);
    assert.equal(report.summary.evidenceComplete, 30);
    assert.equal(report.records.filter(record => record.category === 'emergency' && record.status === 'current').length, 9);
    assert.equal(report.records.filter(record => record.id.startsWith('visa-summary:') && record.status === 'current').length, 9);
    assert.equal(report.records.find(record => record.id === 'visa-matrix:zimbabwe').status, 'current');
    assert.equal(report.records.find(record => record.id === 'visa-matrix:mozambique').status, 'current');
    assert.equal(report.records.filter(record => record.category === 'travel-advisory' && record.status === 'due-soon').length, 9);
    assert.deepEqual(new Set(report.records.map(record => record.category)), new Set([
        'visa', 'border', 'park-fee', 'emergency', 'travel-advisory',
    ]));
});

test('travel advisories use record-level review dates and working official URLs', () => {
    const advisories = productionData.travelAdvisories.countries;
    const usLinks = advisories.map(country => country.links.find(link => link.label.startsWith('US State Dept'))?.url);

    assert.ok(advisories.every(country => country.lastVerified === '2026-09-06'));
    assert.ok(usLinks.every(Boolean));
    assert.ok(usLinks.every(url => !url.includes('International-Travel-Country-Information-Pages')));
    assert.ok(usLinks.every(url => url.startsWith('https://travel.state.gov/')));
});

test('invalid report date is rejected', () => {
    assert.throws(
        () => buildFreshnessReport(productionData, { asOf: '05-09-2026' }),
        /Invalid --as-of date/,
    );
});
