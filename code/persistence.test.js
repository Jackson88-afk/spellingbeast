const assert = require('node:assert/strict');
const { createPersistence } = require('./persistence.js');

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

function testWordListPersistence() {
  const storage = createMemoryStorage();
  const persistence = createPersistence({ storage, namespace: 'test' });

  assert.deepEqual(persistence.loadWordLists(), []);

  const first = persistence.saveWordList({
    id: 'list-1',
    name: 'Animals',
    words: ['cat', 'dog'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const second = persistence.saveWordList({
    id: 'list-2',
    name: 'Fruits',
    words: ['apple', 'banana'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(first.id, 'list-1');
  assert.equal(second.id, 'list-2');
  assert.deepEqual(persistence.loadWordLists(), [first, second]);

  const updated = persistence.updateWordList('list-1', {
    name: 'Farm Animals',
    words: ['cow'],
    updatedAt: '2026-01-02T00:00:00.000Z',
  });

  assert.equal(updated.name, 'Farm Animals');
  assert.deepEqual(updated.words, ['cow']);
  assert.equal(updated.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(updated.updatedAt, '2026-01-02T00:00:00.000Z');
  assert.deepEqual(persistence.loadWordLists(), [updated, second]);

  const afterRefresh = createPersistence({ storage, namespace: 'test' });
  assert.deepEqual(afterRefresh.loadWordLists(), [updated, second]);
}

function testNamespaceIsolation() {
  const storage = createMemoryStorage();
  const alpha = createPersistence({ storage, namespace: 'alpha' });
  const beta = createPersistence({ storage, namespace: 'beta' });

  alpha.saveWordList({
    id: 'list-alpha',
    name: 'Alpha List',
    words: ['alpha'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  alpha.saveActiveMistake({
    wordListId: 'list-alpha',
    wordListName: 'Alpha List',
    word: 'alpha',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  beta.saveWordList({
    id: 'list-beta',
    name: 'Beta List',
    words: ['beta'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  beta.saveActiveMistake({
    wordListId: 'list-beta',
    wordListName: 'Beta List',
    word: 'beta',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(alpha.loadWordLists().length, 1);
  assert.equal(alpha.loadActiveMistakes().length, 1);
  assert.equal(beta.loadWordLists().length, 1);
  assert.equal(beta.loadActiveMistakes().length, 1);
  assert.equal(alpha.loadWordLists()[0].id, 'list-alpha');
  assert.equal(alpha.loadActiveMistakes()[0].wordListId, 'list-alpha');
  assert.equal(beta.loadWordLists()[0].id, 'list-beta');
  assert.equal(beta.loadActiveMistakes()[0].wordListId, 'list-beta');
}

function testActiveMistakePersistence() {
  const storage = createMemoryStorage();
  const persistence = createPersistence({ storage, namespace: 'test' });

  assert.deepEqual(persistence.loadActiveMistakes(), []);

  const saved = persistence.saveActiveMistake({
    wordListId: 'list-1',
    wordListName: 'Animals',
    word: 'apple',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const second = persistence.saveActiveMistake({
    wordListId: 'list-1',
    wordListName: 'Animals',
    word: 'banana',
    active: true,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });

  const duplicate = persistence.saveActiveMistake({
    wordListId: 'list-1',
    wordListName: '  Animals  ',
    word: '  APPLE  ',
    active: true,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  });

  assert.equal(duplicate.id, saved.id);
  assert.equal(duplicate.wordListName, 'Animals');
  assert.deepEqual(persistence.loadActiveMistakes(), [duplicate, second]);

  const afterRefresh = createPersistence({ storage, namespace: 'test' });
  assert.deepEqual(afterRefresh.loadActiveMistakes(), [duplicate, second]);

  persistence.deleteActiveMistake({ wordListId: 'list-1', word: 'apple' });
  assert.deepEqual(persistence.loadActiveMistakes(), [second]);
  assert.deepEqual(afterRefresh.loadActiveMistakes(), [second]);

  const afterDeleteRefresh = createPersistence({ storage, namespace: 'test' });
  assert.deepEqual(afterDeleteRefresh.loadActiveMistakes(), [second]);
}

function run() {
  testWordListPersistence();
  testNamespaceIsolation();
  testActiveMistakePersistence();
  console.log('persistence tests passed');
}

run();
