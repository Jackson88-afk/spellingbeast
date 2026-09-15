(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./session.js'));
  else root.SpellingBeastMistake = factory(root.SpellingBeastSession);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (sessionModule) {
  function createMistake(data = {}) {
    if (!data.wordListId) throw new Error('Mistake must have a wordListId.');
    if (!data.word) throw new Error('Mistake must have a word.');
    const word = String(data.word).trim();
    const wordListName = data.wordListName == null ? '' : String(data.wordListName).trim();
    return {
      id: resolveMistakeId({ ...data, word }),
      wordListId: String(data.wordListId),
      ...(wordListName ? { wordListName } : {}),
      word,
      active: data.active !== false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  function resolveMistakeId(mistake) {
    if (typeof mistake === 'string') return mistake;
    if (mistake && mistake.id) return String(mistake.id);
    if (!mistake || !mistake.wordListId || !mistake.word) throw new Error('Mistake id requires id or wordListId + word.');
    return `${String(mistake.wordListId)}::${String(mistake.word).trim().toLowerCase()}`;
  }

  function summarizeActiveMistakes(mistakes = []) {
    const words = [];
    if (Array.isArray(mistakes)) {
      mistakes.forEach((mistake) => {
        if (!mistake?.word || !mistake.wordListId) return;
        try {
          words.push({
            id: resolveMistakeId(mistake),
            wordListId: String(mistake.wordListId),
            word: String(mistake.word).trim(),
            wordListName: mistake.wordListName == null ? '' : String(mistake.wordListName).trim(),
          });
        } catch (_error) {}
      });
    }
    return {
      count: words.length,
      words,
      emptyState: 'All Caught Up! 现在没有需要额外练习的错题。做得很棒，继续保持！',
    };
  }

  function groupActiveMistakes(mistakes = []) {
    const groups = new Map();
    for (const mistake of summarizeActiveMistakes(mistakes).words) {
      if (!groups.has(mistake.wordListId)) {
        groups.set(mistake.wordListId, { wordListId: mistake.wordListId, wordListName: mistake.wordListName, count: 0, mistakes: [] });
      }
      const group = groups.get(mistake.wordListId);
      group.wordListName = mistake.wordListName || group.wordListName;
      group.mistakes.push(mistake);
      group.count += 1;
    }
    return Array.from(groups.values());
  }

  function createPracticeMistakesSession(mistakes = [], wordListId, random = Math.random) {
    const group = groupActiveMistakes(mistakes).find((entry) => entry.wordListId === String(wordListId));
    const selected = group ? sessionModule.shuffle(group.mistakes, random) : [];
    return {
      id: 'mistakes',
      name: '错题练习',
      wordListId: String(wordListId || ''),
      wordListName: group?.wordListName || '',
      requestedSize: 'All',
      availableWordCount: selected.length,
      selectedWordCount: selected.length,
      mistakes: selected,
      words: selected.map((entry) => entry.word),
      currentIndex: 0,
      createdAt: new Date().toISOString(),
    };
  }

  function applyPracticeMistakeSubmission({ practiceMode, isCorrect, activeMistake, persistence }) {
    if (practiceMode !== 'mistakes' || !activeMistake || !persistence) return null;
    if (isCorrect) {
      persistence.deleteActiveMistake(activeMistake);
      return 'delete';
    }
    return 'keep';
  }

  return { applyPracticeMistakeSubmission, createMistake, createPracticeMistakesSession, groupActiveMistakes, resolveMistakeId, summarizeActiveMistakes };
});
