import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const index = read('index.html');
const tabs = read('js/modules/utility-hub/tabs.js');
const utility = read('js/modules/utility-hub/index.js');
const css = read('css/planning-hub.css');
const legacyCss = `${read('css/styles.css')}\n${read('css/redesign.css')}\n${read('css/home-focus.css')}`;

test('planning hub is organised around five traveller jobs', () => {
    const jobs = ['entry', 'journey', 'money', 'health', 'road'];

    jobs.forEach(job => {
        assert.match(index, new RegExp(`data-hub-tab="${job}"`));
        assert.match(index, new RegExp(`data-hub-panel="${job}"`));
    });

    assert.equal((index.match(/class="hub-journey-tab/g) || []).length, 5);
    assert.match(index, /Turn a route idea into a journey you can use/);
    assert.match(index, /Entry[\s\S]*Journey[\s\S]*Money[\s\S]*Health[\s\S]*On the road/);
});

test('planning tools have one canonical job panel', () => {
    const uniqueIds = [
        'hub-my-safari', 'hub-visa', 'hub-expense-tracker', 'hub-currency',
        'hub-emergency', 'hub-on-the-ground', 'hub-seasons', 'hub-weather',
    ];

    uniqueIds.forEach(id => {
        assert.equal((index.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, id);
    });

    assert.match(tabs, /'hub-my-safari': 'journey'/);
    assert.match(tabs, /'hub-expense-tracker': 'money'/);
    assert.match(tabs, /'hub-visa': 'entry'/);
    assert.match(tabs, /'hub-emergency': 'road'/);
});

test('planning jobs initialise only the tools they need', () => {
    assert.match(utility, /registerHubTabInit\('entry', initDocumentsTab\)|registerHubTabInit\('entry', initEntryTab\)/);
    assert.match(utility, /registerHubTabInit\('money', initMoneyTab\)/);
    assert.match(utility, /registerHubTabInit\('road', initOnTheGoTab\)|registerHubTabInit\('road', initRoadTab\)/);
    assert.match(css, /grid-template-columns:\s*repeat\(5/);
    assert.match(css, /\.planning-health-grid/);
});

test('planning shell styles have one page-family owner', () => {
    assert.match(css, /\.planning-hub-hero/);
    assert.match(css, /\.hub-journey-nav/);
    assert.match(css, /\.hub-toolbar/);
    assert.doesNotMatch(legacyCss, /\.utility-hub\s*\{|\.hub-journey-nav\s*\{|\.hub-toolbar\s*\{/);
    assert.doesNotMatch(legacyCss, /home-section-focus--my-safari\s+#plan/);
});
