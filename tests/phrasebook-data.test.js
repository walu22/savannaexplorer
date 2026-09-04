import test from 'node:test';
import assert from 'node:assert/strict';
import phrasebook from '../data/phrasebook.json' with { type: 'json' };

test('phrasebook covers the principal travel languages in the nine-country guide', () => {
    const languageIds = new Set(phrasebook.languages.map(language => language.id));
    ['afrikaans', 'setswana', 'shona', 'isizulu', 'isixhosa', 'chichewa', 'sesotho', 'siswati', 'portuguese']
        .forEach(languageId => assert.ok(languageIds.has(languageId), languageId));
    phrasebook.languages.forEach(language => assert.ok(language.phrases.length >= 5, language.id));
});
