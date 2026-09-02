(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastSession = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createPracticeSession(wordList, requestedSize) {
    const normalizedWordList = normalizeWordList(wordList);
    const selectionSize = resolveSessionSize(requestedSize, normalizedWordList.words.length);
    const words = normalizedWordList.words.slice(0, selectionSize);

    return {
      wordListId: normalizedWordList.id,
      wordListName: normalizedWordList.name,
      requestedSize,
      availableWordCount: normalizedWordList.words.length,
      selectedWordCount: words.length,
      words,
      currentIndex: 0,
      createdAt: new Date().toISOString(),
    };
  }

  function resolveSessionSize(requestedSize, availableWordCount) {
    const normalized = normalizeRequestedSize(requestedSize);
    if (normalized === 'all') {
      return availableWordCount;
    }
    return Math.min(normalized, availableWordCount);
  }

  function normalizeRequestedSize(requestedSize) {
    if (typeof requestedSize === 'string' && requestedSize.trim().toLowerCase() === 'all') {
      return 'all';
    }

    const size = Number(requestedSize);
    if ([5, 10, 20].includes(size)) {
      return size;
    }

    throw new Error('Practice session size must be 5, 10, 20, or All.');
  }

  function normalizeWordList(wordList) {
    if (!wordList || typeof wordList !== 'object') {
      throw new Error('Word list must be an object.');
    }

    if (!wordList.id) {
      throw new Error('Word list must have an id.');
    }

    const words = Array.isArray(wordList.words) ? wordList.words.map(String) : [];

    return {
      id: String(wordList.id),
      name: String(wordList.name || ''),
      words,
    };
  }

  return {
    createPracticeSession,
    resolveSessionSize,
  };
});
