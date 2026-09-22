'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRepository, normalizeMistake, normalizeWordList, normalizeWords } = require('./repository');

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
  const repository = createRepository({ connect: async () => client });
  await assert.rejects(() => repository.upsertWordList('owner-1', { id: 'list-1', name: 'Animals', words: ['cat'] }));
  assert.ok(events.includes('begin'));
  assert.ok(events.includes('rollback'));
  assert.equal(events.includes('commit'), false);
  assert.equal(events.at(-1), 'release');
});

test('editing a list reconciles removed mistakes inside the same transaction', async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push([sql, params]);
      if (sql.startsWith('select owner_id')) return { rows: [{ owner_id: 'owner-1' }] };
      if (sql.startsWith('select normalized_word')) return { rows: [{ normalized_word: 'cat' }, { normalized_word: 'dog' }] };
      return { rows: [] };
    },
    release() {},
  };
  const repository = createRepository({ connect: async () => client });
  await repository.upsertWordList('owner-1', { id: 'list-1', name: 'Renamed', words: ['Cat', 'DOG'] });
  const reconcile = calls.find(([sql]) => sql.startsWith('delete from active_mistakes'));
  assert.deepEqual(reconcile[1], ['owner-1', 'list-1', ['cat', 'dog']]);
  assert.equal(calls.some(([sql]) => sql.startsWith('delete from adventure_level_progress')), false);
  assert.ok(calls.some(([sql]) => sql === 'commit'));
});

test('changed normalized word sequence resets only that list progress atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push([sql, params]);
      if (sql.startsWith('select owner_id')) return { rows: [{ owner_id: 'owner-1' }] };
      if (sql.startsWith('select normalized_word')) return { rows: [{ normalized_word: 'cat' }, { normalized_word: 'dog' }] };
      return { rows: [] };
    },
    release() {},
  };
  const repository = createRepository({ connect: async () => client });
  const saved = await repository.upsertWordList('owner-1', { id: 'list-1', name: 'Animals', words: ['dog', 'cat'] });
  assert.equal(saved.progressReset, true);
  const reset = calls.find(([sql]) => sql.startsWith('delete from adventure_level_progress'));
  assert.deepEqual(reset[1], ['owner-1', 'list-1']);
  assert.ok(calls.findIndex(([sql]) => sql.startsWith('delete from adventure_level_progress')) < calls.findIndex(([sql]) => sql === 'commit'));
});

test('progress reset failure rolls the whole list edit back', async () => {
  const events = [];
  const client = {
    async query(sql) {
      events.push(sql);
      if (sql.startsWith('select owner_id')) return { rows: [{ owner_id: 'owner-1' }] };
      if (sql.startsWith('select normalized_word')) return { rows: [{ normalized_word: 'cat' }] };
      if (sql.startsWith('delete from adventure_level_progress')) throw new Error('reset failed');
      return { rows: [] };
    },
    release() {},
  };
  const repository = createRepository({ connect: async () => client });
  await assert.rejects(repository.upsertWordList('owner-1', { id: 'list-1', name: 'Animals', words: ['dog'] }), /reset failed/);
  assert.ok(events.includes('rollback'));
  assert.equal(events.includes('commit'), false);
});

test('level progress upsert is owner scoped, level validated, and uses greatest best stars', async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push([sql, params]);
      if (sql.startsWith('select count')) return { rows: params[1] === 'owner-1' ? [{ word_count: 6 }] : [] };
      if (sql.startsWith('insert into adventure_level_progress')) return { rows: [{ word_list_id: 'list-1', level_number: 2, best_stars: 3, updated_at: '2026-01-01T00:00:00.000Z' }] };
      return { rows: [] };
    },
  };
  const repository = createRepository(pool);
  const saved = await repository.upsertLevelProgress('owner-1', { wordListId: 'list-1', levelNumber: 2, bestStars: 1 });
  assert.equal(saved.bestStars, 3);
  assert.match(calls[1][0], /greatest\(adventure_level_progress.best_stars, excluded.best_stars\)/);
  assert.deepEqual(calls[1][1], ['owner-1', 'list-1', 2, 1]);
  await assert.rejects(repository.upsertLevelProgress('owner-2', { wordListId: 'list-1', levelNumber: 1, bestStars: 1 }), { code: 'not_found', status: 404 });
  await assert.rejects(repository.upsertLevelProgress('owner-1', { wordListId: 'list-1', levelNumber: 3, bestStars: 1 }), { code: 'invalid_level_progress' });
  await assert.rejects(repository.upsertLevelProgress('owner-1', { wordListId: 'list-1', levelNumber: 1, bestStars: 4 }), { code: 'invalid_level_progress' });
});

test('state loads only the requested owner level progress', async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push([sql, params]);
      if (sql.startsWith('select word_list_id, level_number')) return { rows: [{ word_list_id: 'list-1', level_number: 1, best_stars: 2, updated_at: '2026-01-01T00:00:00.000Z' }] };
      return { rows: [] };
    },
  };
  const state = await createRepository(pool).loadState('owner-1');
  assert.deepEqual(state.levelProgress, [{ wordListId: 'list-1', levelNumber: 1, bestStars: 2, updatedAt: '2026-01-01T00:00:00.000Z' }]);
  assert.ok(calls.every(([, params]) => params[0] === 'owner-1'));
});

test('Adventure migration constrains stars and cascades list deletion with owner/list integrity', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '002_adventure_level_progress.sql'), 'utf8');
  assert.match(sql, /best_stars between 0 and 3/);
  assert.match(sql, /foreign key \(owner_id, word_list_id\).*on delete cascade/i);
  assert.match(sql, /primary key \(owner_id, word_list_id, level_number\)/i);
});

test('delete is owner scoped, transactional, and reports not found', async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push([sql, params]);
      if (sql.startsWith('delete from word_lists')) return { rows: [] };
      return { rows: [] };
    },
    release() {},
  };
  const repository = createRepository({ connect: async () => client });
  await assert.rejects(() => repository.deleteWordList('owner-1', 'list-1'), { code: 'not_found', status: 404 });
  assert.deepEqual(calls.find(([sql]) => sql.startsWith('delete from word_lists'))[1], ['list-1', 'owner-1']);
  assert.ok(calls.some(([sql]) => sql === 'rollback'));
});
