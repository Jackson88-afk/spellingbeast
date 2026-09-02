(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastAnswer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeAnswer(answer) {
    return String(answer).trim().toLowerCase();
  }

  function isCorrectAnswer(submittedAnswer, correctAnswer) {
    const normalizedSubmitted = normalizeAnswer(submittedAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);

    return normalizedSubmitted === normalizedCorrect;
  }

  return {
    normalizeAnswer,
    isCorrectAnswer,
  };
});
