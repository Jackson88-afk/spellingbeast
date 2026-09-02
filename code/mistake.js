(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastMistake = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createMistake(data = {}) {
    if (!data.wordListId) {
      throw new Error('Mistake must have a wordListId.');
    }
    if (!data.word) {
      throw new Error('Mistake must have a word.');
    }

    const normalizedWord = String(data.word).trim();
    const normalizedWordListName = data.wordListName == null ? '' : String(data.wordListName).trim();
    const id = resolveMistakeId({ ...data, word: normalizedWord });

    return {
      id,
      wordListId: String(data.wordListId),
      ...(normalizedWordListName ? { wordListName: normalizedWordListName } : {}),
      word: normalizedWord,
      active: data.active !== false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  function resolveMistakeId(mistake) {
    if (typeof mistake === 'string') {
      return mistake;
    }
    if (mistake && mistake.id) {
      return String(mistake.id);
    }
    if (!mistake || !mistake.wordListId || !mistake.word) {
      throw new Error('Mistake id requires id or wordListId + word.');
    }
    return `${String(mistake.wordListId)}::${String(mistake.word).trim().toLowerCase()}`;
  }

  function summarizeActiveMistakes(mistakes = []) {
    const words = [];

    if (Array.isArray(mistakes)) {
      mistakes.forEach((mistake) => {
        if (!mistake || !mistake.word) {
          return;
        }

        try {
          words.push({
            id: resolveMistakeId(mistake),
            word: String(mistake.word).trim(),
            wordListName: mistake.wordListName == null ? '' : String(mistake.wordListName).trim(),
          });
        } catch (_error) {
          // Ignore malformed stored mistakes so the UI can still render.
        }
      });
    }

    return {
      count: words.length,
      words,
      emptyState: 'All Caught Up! 现在没有需要额外练习的错题。做得很棒，继续保持！',
    };
  }

  function createPracticeMistakesSession(mistakes = []) {
    const summary = summarizeActiveMistakes(mistakes);

    return {
      id: 'mistakes',
      name: '错题练习',
      wordListId: 'mistakes',
      wordListName: '错题练习',
      requestedSize: 'All',
      availableWordCount: summary.count,
      selectedWordCount: summary.count,
      mistakes: summary.words,
      words: summary.words.map((entry) => entry.word),
      currentIndex: 0,
      createdAt: new Date().toISOString(),
    };
  }

  function applyPracticeMistakeSubmission({ practiceMode, isCorrect, activeMistake, persistence }) {
    if (practiceMode !== 'mistakes' || !activeMistake || !persistence) {
      return null;
    }

    if (isCorrect) {
      persistence.deleteActiveMistake(activeMistake);
      return 'delete';
    }

    persistence.saveActiveMistake(activeMistake);
    return 'save';
  }

  return {
    applyPracticeMistakeSubmission,
    createMistake,
    createPracticeMistakesSession,
    resolveMistakeId,
    summarizeActiveMistakes,
  };
});
