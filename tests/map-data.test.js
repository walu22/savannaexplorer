import test from 'node:test';
import assert from 'node:assert/strict';
import parks from '../data/parks.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };

function validCoordinates(item) {
  const { lat, lng } = item.coordinates || {};
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
    && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

test('every park has valid map coordinates', () => {
  const missing = parks.filter(item => !validCoordinates(item)).map(item => item.id);
  assert.deepEqual(missing, []);
});

test('mapped borders have valid coordinates', () => {
  const invalid = borders
    .filter(item => item.coordinates && !validCoordinates(item))
    .map(item => item.id);
  assert.deepEqual(invalid, []);
});
