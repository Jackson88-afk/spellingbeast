'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeMistake, normalizeWordList, normalizeWords } = require('./repository');

test('word validation trims, drops blanks, and keeps first case-insensitive spelling', () => {
  assert.deepEqual(normalizeWords([' Cat ', '', 'cat', 'DOG', 'dog ']), [
    { word: 'Cat', normalizedWord: 'cat' },
    { word: 'DOG', normalizedWord: 'dog' },
  ]);
  assert.deepEqual(normalizeWordList({ id: 'list-1', name: ' Animals ', words: ['Cat', 'cat'] }).words, [
    { word: 'Cat', normalizedWord: 'cat' },
  ]);
  assert.throws(() => normalizeWordList({ id: 'list-1', name: 'Empty', words: ['  '] }), { code: 'empty_word_list' });
});

test('mistake identity is stable and case-insensitive', () => {
  const mistake = normalizeMistake({ wordListId: 'list-1', word: ' Apple ' });
  assert.equal(mistake.id, 'list-1::apple');
  assert.equal(mistake.normalizedWord, 'apple');
});

test('word-list writes roll back atomically when a word insert fails', async () => {
  const events = [];
  const client = {
    async query(sql) {
      events.push(sql);
      if (sql.startsWith('select owner_id')) return { rows: [] };
      if (sql.startsWith('insert into word_list_words')) throw Object.assign(new Error('write failed'), { code: '08006' });
      return { rows: [] };
    },
    release() { events.push('release'); },
  };
  const { createRepository } = require('./repository');
  const repository = createRepository({ connect: async () => client });
  await assert.rejects(() => repository.upsertWordList('owner-1', { id: 'list-1', name: 'Animals', words: ['cat'] }));
  assert.ok(events.includes('begin'));
  assert.ok(events.includes('rollback'));
  assert.equal(events.includes('commit'), false);
  assert.equal(events.at(-1), 'release');
});
