(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./answer.js'));
  } else {
    root.SpellingBeastPractice = factory(root.SpellingBeastAnswer);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (answerModule) {
  const { isCorrectAnswer } = answerModule;

  function createPracticeStateMachine(session) {
    const words = normalizeSession(session);
    let phase = 'ready';
    let currentIndex = 0;
    let answerText = '';
    let feedback = null;
    let attempts = [];

    function getState() {
      return {
        phase,
        currentIndex,
        totalWords: words.length,
        currentPosition: words.length === 0 ? 0 : Math.min(currentIndex + 1, words.length),
        isComplete: phase === 'complete',
        hasWords: words.length > 0,
        ...(phase === 'answering' ? { answer: answerText } : {}),
        ...(feedback ? { feedback: { ...feedback } } : {}),
        ...(phase === 'complete' ? { summary: buildSummary() } : {}),
      };
    }

    function start() {
      ensurePhase(['ready']);
      answerText = '';
      feedback = null;
      attempts = [];
      if (words.length === 0) {
        phase = 'complete';
      } else {
        phase = 'question';
      }
      return getState();
    }

    function beginAnswer() {
      ensurePhase(['question']);
      phase = 'answering';
      return getState();
    }

    function setAnswer(answer) {
      ensurePhase(['question', 'answering']);
      answerText = String(answer);
      phase = 'answering';
      return getState();
    }

    function submitAnswer(answer) {
      ensurePhase(['question', 'answering']);
      if (arguments.length > 0) {
        answerText = String(answer);
      }
      const correctAnswer = words[currentIndex] || '';
      feedback = {
        submittedAnswer: answerText,
        correctAnswer,
        isCorrect: isCorrectAnswer(answerText, correctAnswer),
      };
      attempts.push({
        word: correctAnswer,
        correctAnswer,
        submittedAnswer: answerText,
        isCorrect: feedback.isCorrect,
      });
      phase = 'submitted';
      return getState();
    }

    function submit(answer) {
      return submitAnswer(answer);
    }

    function showFeedback() {
      ensurePhase(['submitted']);
      phase = 'feedback';
      return getState();
    }

    function next() {
      ensurePhase(['feedback']);
      currentIndex += 1;
      answerText = '';
      feedback = null;
      if (currentIndex >= words.length) {
        phase = 'complete';
      } else {
        phase = 'question';
      }
      return getState();
    }

    function ensurePhase(allowed) {
      if (!allowed.includes(phase)) {
        throw new Error(`Cannot perform action in ${phase} phase.`);
      }
    }

    function buildSummary() {
      const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
      const missedWords = attempts
        .filter((attempt) => !attempt.isCorrect)
        .map((attempt) => ({
          word: attempt.word,
          correctSpelling: attempt.correctAnswer,
        }));

      return {
        correctCount,
        totalAttempted: attempts.length,
        needsMorePracticeCount: missedWords.length,
        missedWords,
      };
    }

    return {
      getState,
      start,
      beginAnswer,
      setAnswer,
      submitAnswer,
      submit,
      showFeedback,
      next,
    };
  }

  function shouldShowPracticeMistakesAction(summary) {
    return Boolean(summary && summary.needsMorePracticeCount > 0);
  }

  function normalizeSession(session) {
    if (!session || typeof session !== 'object') {
      throw new Error('Practice session must be an object.');
    }
    return Array.isArray(session.words) ? session.words.map(String) : [];
  }

  return {
    createPracticeStateMachine,
    shouldShowPracticeMistakesAction,
  };
});
