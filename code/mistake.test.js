const assert = require('node:assert/strict');
const { createPersistence } = require('./persistence.js');
const { applyPracticeMistakeSubmission, createMistake, createPracticeMistakesSession, resolveMistakeId, summarizeActiveMistakes } = require('./mistake.js');

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

function testCreateMistakeNormalizesWordAndGeneratesDeterministicId() {
  const mistake = createMistake({ wordListId: 'list-1', wordListName: '  Animals  ', word: '  Apple  ' });

  assert.equal(mistake.wordListId, 'list-1');
  assert.equal(mistake.wordListName, 'Animals');
  assert.equal(mistake.word, 'Apple');
  assert.equal(mistake.id, 'list-1::apple');
  assert.equal(mistake.active, true);
  assert.ok(mistake.createdAt);
  assert.ok(mistake.updatedAt);
}

function testCreateMistakeDeduplicatesCaseInsensitiveWordsThroughId() {
  const first = createMistake({ wordListId: 'list-1', word: 'Apple' });
  const second = createMistake({ wordListId: 'list-1', word: '  apple  ' });

  assert.equal(first.id, second.id);
}

function testResolveMistakeIdSupportsExistingId() {
  assert.equal(resolveMistakeId({ id: 'custom-id', wordListId: 'list-1', word: 'apple' }), 'custom-id');
}

function testSummarizeActiveMistakesReturnsCountWordsAndEmptyState() {
  const summary = summarizeActiveMistakes([
    { wordListId: 'list-1', wordListName: 'Animals', word: ' ant ' },
    { wordListId: 'list-2', wordListName: 'Colors', word: 'blue' },
  ]);

  assert.equal(summary.count, 2);
  assert.deepEqual(summary.words, [
    { id: 'list-1::ant', word: 'ant', wordListName: 'Animals' },
    { id: 'list-2::blue', word: 'blue', wordListName: 'Colors' },
  ]);
  assert.equal(summary.emptyState, 'All Caught Up! 现在没有需要额外练习的错题。做得很棒，继续保持！');
}

function testSummarizeActiveMistakesSkipsMalformedEntries() {
  const summary = summarizeActiveMistakes([
    null,
    { wordListId: 'list-1', word: '  cat  ' },
    { wordListId: 'list-2' },
  ]);

  assert.equal(summary.count, 1);
  assert.deepEqual(summary.words, [{ id: 'list-1::cat', word: 'cat', wordListName: '' }]);
}

function testCreatePracticeMistakesSessionUsesActiveMistakeWords() {
  const session = createPracticeMistakesSession([
    { wordListId: 'list-1', wordListName: 'Animals', word: ' ant ' },
    { wordListId: 'list-2', wordListName: 'Colors', word: ' blue ' },
  ]);

  assert.equal(session.id, 'mistakes');
  assert.equal(session.name, '错题练习');
  assert.equal(session.wordListId, 'mistakes');
  assert.equal(session.wordListName, '错题练习');
  assert.equal(session.requestedSize, 'All');
  assert.equal(session.availableWordCount, 2);
  assert.equal(session.selectedWordCount, 2);
  assert.deepEqual(session.mistakes, [
    { id: 'list-1::ant', word: 'ant', wordListName: 'Animals' },
    { id: 'list-2::blue', word: 'blue', wordListName: 'Colors' },
  ]);
  assert.deepEqual(session.words, ['ant', 'blue']);
}

function testCreatePracticeMistakesSessionHandlesEmptyMistakeList() {
  const session = createPracticeMistakesSession([]);

  assert.equal(session.availableWordCount, 0);
  assert.equal(session.selectedWordCount, 0);
  assert.deepEqual(session.mistakes, []);
  assert.deepEqual(session.words, []);
}

function testApplyPracticeMistakeSubmissionRetainsIncorrectMistakes() {
  const persistence = createPersistence({ storage: createMemoryStorage(), namespace: 'mistake-tests' });
  const activeMistake = createMistake({
    wordListId: 'list-1',
    wordListName: 'Animals',
    word: 'ant',
  });

  const result = applyPracticeMistakeSubmission({
    practiceMode: 'mistakes',
    isCorrect: false,
    activeMistake,
    persistence,
  });

  assert.equal(result, 'save');
  assert.deepEqual(persistence.loadActiveMistakes(), [activeMistake]);
  assert.equal(persistence.loadActiveMistakes()[0].wordListId, 'list-1');
  assert.equal(persistence.loadActiveMistakes()[0].wordListName, 'Animals');
}

function testApplyPracticeMistakeSubmissionRemovesCorrectMistakes() {
  const persistence = createPersistence({ storage: createMemoryStorage(), namespace: 'mistake-tests' });
  const activeMistake = createMistake({
    wordListId: 'list-1',
    wordListName: 'Animals',
    word: 'ant',
  });

  persistence.saveActiveMistake(activeMistake);

  const result = applyPracticeMistakeSubmission({
    practiceMode: 'mistakes',
    isCorrect: true,
    activeMistake,
    persistence,
  });

  assert.equal(result, 'delete');
  assert.deepEqual(persistence.loadActiveMistakes(), []);
}

function run() {
  testCreateMistakeNormalizesWordAndGeneratesDeterministicId();
  testCreateMistakeDeduplicatesCaseInsensitiveWordsThroughId();
  testResolveMistakeIdSupportsExistingId();
  testSummarizeActiveMistakesReturnsCountWordsAndEmptyState();
  testSummarizeActiveMistakesSkipsMalformedEntries();
  testCreatePracticeMistakesSessionUsesActiveMistakeWords();
  testCreatePracticeMistakesSessionHandlesEmptyMistakeList();
  testApplyPracticeMistakeSubmissionRetainsIncorrectMistakes();
  testApplyPracticeMistakeSubmissionRemovesCorrectMistakes();
  console.log('mistake tests passed');
}

run();
