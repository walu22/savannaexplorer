import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterFoodCountries, foodFilterSummary, normalizeFoodFilters } from '../js/lib/food-planner.js';

const foodTravel = JSON.parse(readFileSync(new URL('../data/food-travel.json', import.meta.url), 'utf8'));

test('food planner covers every supported country with a route and source', () => {
    const ids = foodTravel.countries.map(country => country.id).sort();
    assert.deepEqual(ids, [
        'botswana', 'eswatini', 'lesotho', 'malawi', 'mozambique',
        'namibia', 'south-africa', 'zambia', 'zimbabwe',
    ]);
    foodTravel.countries.forEach(country => {
        assert.ok(country.routeId);
        assert.match(country.source.url, /^https:\/\//);
        assert.ok(country.ask.length >= 2);
    });
});

test('food planner combines country, context and dietary filters', () => {
    const matches = filterFoodCountries(foodTravel.countries, {
        country: 'south-africa',
        context: 'city',
        dietary: 'halal',
    });
    assert.deepEqual(matches.map(country => country.id), ['south-africa']);
    assert.equal(filterFoodCountries(foodTravel.countries, { context: 'coast' }).length, 4);
});

test('food filter defaults and summaries are stable', () => {
    assert.deepEqual(normalizeFoodFilters(), { country: 'all', context: 'all', dietary: 'all' });
    assert.equal(foodFilterSummary({}, 9), 'Showing all countries.');
    assert.equal(foodFilterSummary({ dietary: 'vegan' }, 5), '5 countries match your planning questions.');
    assert.equal(foodFilterSummary({ country: 'namibia' }, 1), '1 country matches your planning questions.');
});
