const assert = require('node:assert/strict');
const { createPracticeSession } = require('./session.js');

function testCreatePracticeSessionSelectsRequestedNumberOfWords() {
  const wordList = {
    id: 'list-1',
    name: 'Animals',
    words: ['ant', 'bear', 'cat', 'dog', 'eel', 'fox', 'goat'],
  };

  const session = createPracticeSession(wordList, 5);

  assert.equal(session.wordListId, 'list-1');
  assert.equal(session.requestedSize, 5);
  assert.equal(session.availableWordCount, 7);
  assert.equal(session.selectedWordCount, 5);
  assert.deepEqual(session.words, ['ant', 'bear', 'cat', 'dog', 'eel']);
}

function testCreatePracticeSessionUsesAllWordsWhenListIsSmallerThanRequestedSize() {
  const wordList = {
    id: 'list-2',
    name: 'Short List',
    words: ['apple', 'banana', 'carrot'],
  };

  const session = createPracticeSession(wordList, 10);

  assert.equal(session.wordListId, 'list-2');
  assert.equal(session.requestedSize, 10);
  assert.equal(session.availableWordCount, 3);
  assert.equal(session.selectedWordCount, 3);
  assert.deepEqual(session.words, ['apple', 'banana', 'carrot']);
}

function testCreatePracticeSessionUsesAllWordsWhenTwentyExceedsAvailableWords() {
  const wordList = {
    id: 'list-2b',
    name: 'Small List',
    words: ['apple', 'banana', 'carrot', 'date', 'elderberry', 'fig', 'grape'],
  };

  const session = createPracticeSession(wordList, 20);

  assert.equal(session.wordListId, 'list-2b');
  assert.equal(session.requestedSize, 20);
  assert.equal(session.availableWordCount, 7);
  assert.equal(session.selectedWordCount, 7);
  assert.deepEqual(session.words, ['apple', 'banana', 'carrot', 'date', 'elderberry', 'fig', 'grape']);
}

function testCreatePracticeSessionSupportsAllWords() {
  const wordList = {
    id: 'list-3',
    name: 'Long List',
    words: ['alpha', 'beta', 'gamma', 'delta'],
  };

  const session = createPracticeSession(wordList, 'All');

  assert.equal(session.wordListId, 'list-3');
  assert.equal(session.requestedSize, 'All');
  assert.equal(session.availableWordCount, 4);
  assert.equal(session.selectedWordCount, 4);
  assert.deepEqual(session.words, ['alpha', 'beta', 'gamma', 'delta']);
}

function run() {
  testCreatePracticeSessionSelectsRequestedNumberOfWords();
  testCreatePracticeSessionUsesAllWordsWhenListIsSmallerThanRequestedSize();
  testCreatePracticeSessionUsesAllWordsWhenTwentyExceedsAvailableWords();
  testCreatePracticeSessionSupportsAllWords();
  console.log('session tests passed');
}

run();
