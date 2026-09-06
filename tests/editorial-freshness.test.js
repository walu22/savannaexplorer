import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    buildFreshnessReport,
    classifyFreshness,
    parseReviewedDate,
} from '../scripts/lib/editorial-freshness.mjs';
import { hubPages } from '../scripts/lib/seo-data.mjs';

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
    assert.equal(report.summary.overdue, 0);
    assert.equal(report.records[0].status, 'due-soon');
    assert.equal(report.summary.criticalOverdue, 0);
    assert.ok(report.summary.sourceLinked >= 90);
    assert.equal(report.summary.evidenceComplete, 87);
    assert.equal(report.records.filter(record => record.category === 'emergency' && record.status === 'current').length, 9);
    assert.equal(report.records.filter(record => record.id.startsWith('visa-summary:') && record.status === 'current').length, 9);
    assert.equal(report.records.find(record => record.id === 'visa-matrix:zimbabwe').status, 'current');
    assert.equal(report.records.find(record => record.id === 'visa-matrix:mozambique').status, 'current');
    assert.equal(report.records.filter(record => record.category === 'travel-advisory' && record.status === 'due-soon').length, 9);
    assert.equal(report.records.filter(record => record.category === 'park-fee' && record.status === 'current').length, 27);
    assert.equal(report.records.filter(record => record.category === 'border' && record.status === 'current').length, 30);
    assert.deepEqual(new Set(report.records.map(record => record.category)), new Set([
        'visa', 'border', 'park-fee', 'emergency', 'travel-advisory',
    ]));
});

test('park records expose reviewed authority links without stale unsupported tariffs', () => {
    const parks = productionData.parks;
    const byId = Object.fromEntries(parks.map(park => [park.id, park]));
    const confirmOnlyCountries = new Set(['botswana', 'malawi', 'lesotho']);

    assert.equal(parks.length, 27);
    assert.ok(parks.every(park => park.lastVerified === '2026-09-06'));
    assert.ok(parks.every(park => park.sourceUrl.startsWith('https://')));
    assert.equal(byId.kruger.feeTable.rows.find(row => row.label === 'International adult').amount, '602');
    assert.equal(byId.addo.feeTable.rows.find(row => row.label === 'International adult').amount, '492');
    assert.equal(byId.hwange.feeTable.rows.find(row => row.label === 'International adult').amount, '24');
    assert.equal(byId.gonarezhou.feeTable.rows.find(row => row.label === 'International adult').amount, '30');
    assert.equal(byId.gorongosa.feeTable.rows.find(row => row.label === 'Vehicle conservation fee').amount, 'Free');
    assert.equal(byId.hlane.feeTable.rows.find(row => row.label === 'Daily conservation fee').amount, '95');
    assert.equal(byId.malolotja.sourceUrl, 'https://entc.org.sz/malolotja-game-reserve/');
    assert.ok(parks
        .filter(park => confirmOnlyCountries.has(park.country))
        .every(park => park.feeTable.rows
            .filter(row => ['person', 'vehicle', 'camping'].includes(row.category))
            .every(row => row.amount === 'Confirm')));
});

test('parks hub review metadata follows the latest park audit', () => {
    const parksHub = hubPages('https://savannaexplorer.com').find(page => page.path === '/parks');

    assert.match(parksHub.bodyHtml, /Last reviewed September 6, 2026/);
    assert.equal(parksHub.jsonLd.dateModified, '2026-09-06');
});

test('border records use audited crossing pairs without invented live estimates', () => {
    const borders = productionData.borders;
    const byId = Object.fromEntries(borders.map(border => [border.id, border]));

    assert.equal(borders.length, 30);
    assert.equal(new Set(borders.map(border => border.id)).size, 30);
    assert.ok(borders.every(border => border.lastVerified === '2026-09-06'));
    assert.ok(borders.every(border => border.sourceUrl.startsWith('https://')));
    assert.ok(borders.every(border => border.typicalWait === 'No official live estimate'));
    assert.ok(borders.every(border => !/\d+[–-]\d+/.test(border.fees)));
    assert.equal(byId['martins-drift'].name, "Martin's Drift / Groblersbrug");
    assert.deepEqual(byId.kazungula.countries, ['botswana', 'zambia']);
    assert.equal(byId['vic-falls-bridge'].vehicleCrossing, true);
    assert.deepEqual(byId['pafuri-border-gate'].countries, ['south-africa', 'mozambique']);
    assert.equal(byId['mwami-mchinji'].name, 'Mwami / Mchinji');
    assert.equal(byId['mwanza-zobue'].name, 'Mwanza / Zóbuè');
    assert.equal(byId.forbes.name, 'Forbes / Machipanda');
    assert.equal(byId.caledonspoort.hours, '06:00–22:00');
    assert.equal(byId['sani-pass'].hours, '06:00–18:00 — weather dependent');
    assert.ok(!byId.nakonde);
    assert.ok(!byId.groblersbrug);
    assert.ok(!byId.komatipoort);
});

test('borders hub review metadata follows the latest border audit', () => {
    const bordersHub = hubPages('https://savannaexplorer.com').find(page => page.path === '/borders');

    assert.match(bordersHub.bodyHtml, /Last reviewed September 6, 2026/);
    assert.equal(bordersHub.jsonLd.dateModified, '2026-09-06');
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
