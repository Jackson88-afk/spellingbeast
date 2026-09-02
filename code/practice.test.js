const assert = require('node:assert/strict');
const { createPracticeSession } = require('./session.js');
const { createPracticeStateMachine, shouldShowPracticeMistakesAction } = require('./practice.js');

function createSampleSession() {
  const wordList = {
    id: 'list-1',
    name: 'Animals',
    words: ['ant', 'bear'],
  };

  return createPracticeSession(wordList, 'All');
}

function testPracticeStateMachineFollowsNormalLifecycle() {
  const session = createSampleSession();
  const practice = createPracticeStateMachine(session);

  assert.equal(practice.getState().phase, 'ready');

  practice.start();
  assert.equal(practice.getState().phase, 'question');
  assert.equal(practice.getState().currentIndex, 0);
  assert.equal(practice.getState().currentPosition, 1);
  assert.equal(practice.getState().totalWords, 2);
  assert.equal('targetWord' in practice.getState(), false);

  practice.beginAnswer();
  assert.equal(practice.getState().phase, 'answering');

  practice.submitAnswer('ant');
  assert.equal(practice.getState().phase, 'submitted');

  practice.showFeedback();
  assert.equal(practice.getState().phase, 'feedback');
  assert.equal(practice.getState().feedback.isCorrect, true);
  assert.equal(practice.getState().feedback.correctAnswer, 'ant');

  practice.next();
  assert.equal(practice.getState().phase, 'question');
  assert.equal(practice.getState().currentIndex, 1);
  assert.equal(practice.getState().currentPosition, 2);

  practice.beginAnswer();
  practice.submitAnswer('bear');
  practice.showFeedback();
  practice.next();
  assert.equal(practice.getState().phase, 'complete');
  assert.equal(practice.getState().currentIndex, 2);
  assert.equal(practice.getState().currentPosition, 2);
}

function testPracticeStateMachineDoesNotExposeTargetWordBeforeSubmission() {
  const session = createSampleSession();
  const practice = createPracticeStateMachine(session);

  practice.start();
  practice.beginAnswer();

  const state = practice.getState();
  assert.equal('targetWord' in state, false);
  assert.equal('visibleWord' in state, false);
  assert.equal('correctAnswer' in state, false);
}

function testPracticeStateMachineAcceptsSpecifiedNormalizedCorrectAnswers() {
  const session = {
    id: 'list-1',
    name: 'Fruit',
    words: ['apple'],
  };
  const practice = createPracticeStateMachine(createPracticeSession(session, 'All'));

  practice.start();
  practice.beginAnswer();
  practice.submitAnswer('  APPLE  ');
  practice.showFeedback();

  const state = practice.getState();
  assert.equal(state.feedback.isCorrect, true);
  assert.equal(state.feedback.correctAnswer, 'apple');
  assert.equal(state.feedback.submittedAnswer, '  APPLE  ');
}

function testPracticeStateMachineMarksIncorrectAnswers() {
  const session = createSampleSession();
  const practice = createPracticeStateMachine(session);

  practice.start();
  practice.beginAnswer();
  practice.submitAnswer('antt');
  practice.showFeedback();

  const state = practice.getState();
  assert.equal(state.feedback.isCorrect, false);
  assert.equal(state.feedback.correctAnswer, 'ant');
  assert.equal(state.feedback.submittedAnswer, 'antt');

  practice.next();
  const nextState = practice.getState();
  assert.equal(nextState.phase, 'question');
  assert.equal(nextState.currentIndex, 1);
}

function testPracticeStateMachineBuildsSessionSummary() {
  const session = createSampleSession();
  const practice = createPracticeStateMachine(session);

  practice.start();
  practice.beginAnswer();
  practice.submitAnswer('ant');
  practice.showFeedback();
  practice.next();

  practice.beginAnswer();
  practice.submitAnswer('beerr');
  practice.showFeedback();
  practice.next();

  const state = practice.getState();
  assert.equal(state.phase, 'complete');
  assert.deepEqual(state.summary, {
    correctCount: 1,
    totalAttempted: 2,
    needsMorePracticeCount: 1,
    missedWords: [
      { word: 'bear', correctSpelling: 'bear' },
    ],
  });
  assert.equal(shouldShowPracticeMistakesAction(state.summary), true);
}

function testPracticeStateMachineHidesPracticeMistakesActionWhenNoWordsWereMissed() {
  const session = createSampleSession();
  const practice = createPracticeStateMachine(session);

  practice.start();
  practice.beginAnswer();
  practice.submitAnswer('ant');
  practice.showFeedback();
  practice.next();

  practice.beginAnswer();
  practice.submitAnswer('bear');
  practice.showFeedback();
  practice.next();

  const state = practice.getState();
  assert.equal(state.phase, 'complete');
  assert.equal(state.summary.needsMorePracticeCount, 0);
  assert.equal(shouldShowPracticeMistakesAction(state.summary), false);
}

function testPracticeStateMachineKeepsWordAndCorrectSpellingForEachMissedWord() {
  const wordList = {
    id: 'list-2',
    name: 'Mixed List',
    words: ['ant', 'bear', 'cat'],
  };
  const session = createPracticeSession(wordList, 'All');
  const practice = createPracticeStateMachine(session);

  practice.start();

  practice.beginAnswer();
  practice.submitAnswer('ant');
  practice.showFeedback();
  practice.next();

  practice.beginAnswer();
  practice.submitAnswer('beerr');
  practice.showFeedback();
  practice.next();

  practice.beginAnswer();
  practice.submitAnswer('catt');
  practice.showFeedback();
  practice.next();

  const state = practice.getState();
  assert.equal(state.phase, 'complete');
  assert.deepEqual(state.summary.missedWords, [
    { word: 'bear', correctSpelling: 'bear' },
    { word: 'cat', correctSpelling: 'cat' },
  ]);
}

function run() {
  testPracticeStateMachineFollowsNormalLifecycle();
  testPracticeStateMachineDoesNotExposeTargetWordBeforeSubmission();
  testPracticeStateMachineAcceptsSpecifiedNormalizedCorrectAnswers();
  testPracticeStateMachineMarksIncorrectAnswers();
  testPracticeStateMachineBuildsSessionSummary();
  testPracticeStateMachineHidesPracticeMistakesActionWhenNoWordsWereMissed();
  testPracticeStateMachineKeepsWordAndCorrectSpellingForEachMissedWord();
  console.log('practice tests passed');
}

run();
