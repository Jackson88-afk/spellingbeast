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
