const test = require('node:test');
const assert = require('node:assert/strict');
const { createRemotePersistence, MIGRATION_KEY } = require('./remote-persistence.js');

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, String(value)) };
}

test('migration is acknowledged once and remote state becomes canonical', async () => {
  const store = storage();
  const calls = [];
  const local = {
    loadWordLists: () => [{ id: 'list-1', name: 'Animals', words: ['cat'] }],
    loadActiveMistakes: () => [],
  };
  const api = {
    async initialize() {},
    async request(path) {
      calls.push(path);
      if (path === '/state') return { wordLists: [], activeMistakes: [] };
      if (path === '/migrate') return { wordLists: local.loadWordLists(), activeMistakes: [] };
      throw new Error(path);
    },
  };
  const first = createRemotePersistence({ apiClient: api, localPersistence: local, storage: store });
  await first.initialize();
  assert.equal(first.loadWordLists().length, 1);
  assert.equal(store.getItem(MIGRATION_KEY), 'complete');
  const second = createRemotePersistence({ apiClient: api, localPersistence: local, storage: store });
  await second.initialize();
  assert.equal(calls.filter((path) => path === '/migrate').length, 1);
});

test('editing a list reconciles its cached mistakes and current name', async () => {
  const remote = createRemotePersistence({
    storage: storage(),
    localPersistence: { loadWordLists: () => [], loadActiveMistakes: () => [] },
    apiClient: {
      async initialize() {},
      async request(path) {
        if (path === '/state') return {
          wordLists: [{ id: 'list-1', name: 'Animals', words: ['cat', 'dog'] }],
          activeMistakes: [
            { id: 'list-1::cat', wordListId: 'list-1', wordListName: 'Animals', word: 'cat' },
            { id: 'list-1::dog', wordListId: 'list-1', wordListName: 'Animals', word: 'dog' },
          ],
        };
        return { wordList: { id: 'list-1', name: 'Pets', words: ['cat'] } };
      },
    },
  });
  await remote.initialize();
  await remote.saveWordList({ id: 'list-1', name: 'Pets', words: ['cat'] });
  assert.deepEqual(remote.loadActiveMistakes(), [
    { id: 'list-1::cat', wordListId: 'list-1', wordListName: 'Pets', word: 'cat' },
  ]);
});

test('deletes a list only after server confirmation and removes its cached mistakes', async () => {
  const requests = [];
  const remote = createRemotePersistence({
    storage: storage(),
    localPersistence: { loadWordLists: () => [], loadActiveMistakes: () => [] },
    apiClient: {
      async initialize() {},
      async request(path, options) {
        requests.push([path, options]);
        if (path === '/state') return {
          wordLists: [{ id: 'list-1', name: 'Animals', words: ['cat'] }],
          activeMistakes: [{ id: 'list-1::cat', wordListId: 'list-1', word: 'cat' }],
        };
        return null;
      },
    },
  });
  await remote.initialize();
  await remote.deleteWordList('list-1');
  assert.equal(requests.at(-1)[0], '/word-lists/list-1');
  assert.equal(requests.at(-1)[1].method, 'DELETE');
  assert.deepEqual(remote.loadWordLists(), []);
  assert.deepEqual(remote.loadActiveMistakes(), []);
});

test('remote word edits clear confirmed progress while rename-only edits preserve it', async () => {
  let reset = false;
  const remote = createRemotePersistence({
    storage: storage(),
    localPersistence: { loadWordLists: () => [], loadActiveMistakes: () => [] },
    apiClient: {
      async initialize() {},
      async request(path) {
        if (path === '/state') return {
          wordLists: [{ id: 'list-1', name: 'Words', words: ['cat'] }],
          activeMistakes: [],
          levelProgress: [{ wordListId: 'list-1', levelNumber: 1, bestStars: 2 }],
        };
        return { wordList: { id: 'list-1', name: 'Renamed', words: reset ? ['dog'] : ['cat'] }, progressReset: reset };
      },
    },
  });
  await remote.initialize();
  await remote.saveWordList({ id: 'list-1', name: 'Renamed', words: ['cat'] });
  assert.equal(remote.loadLevelProgress().length, 1);
  reset = true;
  await remote.saveWordList({ id: 'list-1', name: 'Renamed', words: ['dog'] });
  assert.deepEqual(remote.loadLevelProgress(), []);
});

test('failed migration leaves local data eligible for retry', async () => {
  const store = storage();
  const remote = createRemotePersistence({
    storage: store,
    localPersistence: { loadWordLists: () => [{ id: 'list-1' }], loadActiveMistakes: () => [] },
    apiClient: { async initialize() {}, async request(path) { if (path === '/state') return {}; throw new Error('offline'); } },
  });
  await assert.rejects(remote.initialize(), /offline/);
  assert.equal(store.getItem(MIGRATION_KEY), null);
});

test('level progress changes only after a confirmed owner API write and never regresses', async () => {
  let resolveWrite;
  const remote = createRemotePersistence({
    storage: storage(),
    localPersistence: { loadWordLists: () => [], loadActiveMistakes: () => [] },
    apiClient: {
      async initialize() {},
      async request(path) {
        if (path === '/state') return { wordLists: [{ id: 'list-1', words: ['a'] }], activeMistakes: [], levelProgress: [] };
        return new Promise((resolve) => { resolveWrite = resolve; });
      },
    },
  });
  await remote.initialize();
  const pending = remote.saveLevelProgress({ wordListId: 'list-1', levelNumber: 1, bestStars: 3 });
  assert.deepEqual(remote.loadLevelProgress(), []);
  resolveWrite({ levelProgress: { wordListId: 'list-1', levelNumber: 1, bestStars: 3, updatedAt: '2026-01-01T00:00:00.000Z' } });
  await pending;
  assert.equal(remote.loadLevelProgress()[0].bestStars, 3);
});
