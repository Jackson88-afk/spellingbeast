const assert = require('node:assert/strict');
const { normalizeAnswer, isCorrectAnswer } = require('./answer.js');

function testNormalizeAnswerTrimsAndLowercases() {
  assert.equal(normalizeAnswer('  Apple  '), 'apple');
  assert.equal(normalizeAnswer('\tBanana\n'), 'banana');
}

function testIsCorrectAnswerAcceptsSpecifiedExactMatchesAfterNormalization() {
  assert.equal(isCorrectAnswer('Apple', 'apple'), true);
  assert.equal(isCorrectAnswer('  apple  ', 'apple'), true);
  assert.equal(isCorrectAnswer('APPLE', 'apple'), true);
}

function testIsCorrectAnswerRejectsDifferentSpellings() {
  assert.equal(isCorrectAnswer('aple', 'apple'), false);
  assert.equal(isCorrectAnswer('appel', 'apple'), false);
  assert.equal(isCorrectAnswer('appple', 'apple'), false);
}

function testIsCorrectAnswerRejectsEmptyAnswer() {
  assert.equal(isCorrectAnswer('   ', 'apple'), false);
  assert.equal(isCorrectAnswer('', 'apple'), false);
}

function run() {
  testNormalizeAnswerTrimsAndLowercases();
  testIsCorrectAnswerAcceptsSpecifiedExactMatchesAfterNormalization();
  testIsCorrectAnswerRejectsDifferentSpellings();
  testIsCorrectAnswerRejectsEmptyAnswer();
  console.log('answer tests passed');
}

run();
