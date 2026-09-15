const assert = require('node:assert/strict');
const { createPracticeSession, shuffle } = require('./session.js');

const keepOrder = () => 0.999999;

function testCreatePracticeSessionSelectsRequestedNumberOfWords() {
  const wordList = { id: 'list-1', name: 'Animals', words: ['ant', 'bear', 'cat', 'dog', 'eel', 'fox', 'goat'] };
  const session = createPracticeSession(wordList, 5, keepOrder);
  assert.equal(session.wordListId, 'list-1');
  assert.equal(session.requestedSize, 5);
  assert.equal(session.availableWordCount, 7);
  assert.equal(session.selectedWordCount, 5);
  assert.deepEqual(session.words, ['ant', 'bear', 'cat', 'dog', 'eel']);
}

function testCreatePracticeSessionUsesAllWordsWhenListIsSmallerThanRequestedSize() {
  const wordList = { id: 'list-2', name: 'Short List', words: ['apple', 'banana', 'carrot'] };
  const session = createPracticeSession(wordList, 10, keepOrder);
  assert.equal(session.requestedSize, 10);
  assert.equal(session.selectedWordCount, 3);
  assert.deepEqual(session.words, ['apple', 'banana', 'carrot']);
}

function testCreatePracticeSessionUsesAllWordsWhenTwentyExceedsAvailableWords() {
  const wordList = { id: 'list-2b', name: 'Small List', words: ['apple', 'banana', 'carrot', 'date', 'elderberry', 'fig', 'grape'] };
  const session = createPracticeSession(wordList, 20, keepOrder);
  assert.equal(session.selectedWordCount, 7);
  assert.deepEqual(session.words, wordList.words);
}

function testCreatePracticeSessionSupportsAllWords() {
  const wordList = { id: 'list-3', name: 'Long List', words: ['alpha', 'beta', 'gamma', 'delta'] };
  const session = createPracticeSession(wordList, 'All', keepOrder);
  assert.equal(session.requestedSize, 'All');
  assert.equal(session.selectedWordCount, 4);
  assert.deepEqual(session.words, wordList.words);
}

function testShuffleUsesInjectedRandomWithoutMutatingSavedOrder() {
  const saved = ['ant', 'bear', 'cat', 'dog'];
  const values = [0, 0.5, 0];
  const shuffled = shuffle(saved, () => values.shift());
  assert.deepEqual(shuffled, ['cat', 'dog', 'bear', 'ant']);
  assert.deepEqual(saved, ['ant', 'bear', 'cat', 'dog']);
}

function run() {
  testCreatePracticeSessionSelectsRequestedNumberOfWords();
  testCreatePracticeSessionUsesAllWordsWhenListIsSmallerThanRequestedSize();
  testCreatePracticeSessionUsesAllWordsWhenTwentyExceedsAvailableWords();
  testCreatePracticeSessionSupportsAllWords();
  testShuffleUsesInjectedRandomWithoutMutatingSavedOrder();
  console.log('session tests passed');
}

run();
