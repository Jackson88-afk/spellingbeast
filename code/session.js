(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpellingBeastSession = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function shuffle(values, random = Math.random) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function createPracticeSession(wordList, requestedSize, random = Math.random) {
    const normalizedWordList = normalizeWordList(wordList);
    const selectionSize = resolveSessionSize(requestedSize, normalizedWordList.words.length);
    const words = shuffle(normalizedWordList.words, random).slice(0, selectionSize);
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
    return normalized === 'all' ? availableWordCount : Math.min(normalized, availableWordCount);
  }

  function normalizeRequestedSize(requestedSize) {
    if (typeof requestedSize === 'string' && requestedSize.trim().toLowerCase() === 'all') return 'all';
    const size = Number(requestedSize);
    if ([5, 10, 20].includes(size)) return size;
    throw new Error('Practice session size must be 5, 10, 20, or All.');
  }

  function normalizeWordList(wordList) {
    if (!wordList || typeof wordList !== 'object') throw new Error('Word list must be an object.');
    if (!wordList.id) throw new Error('Word list must have an id.');
    return {
      id: String(wordList.id),
      name: String(wordList.name || ''),
      words: Array.isArray(wordList.words) ? wordList.words.map(String) : [],
    };
  }

  return { createPracticeSession, resolveSessionSize, shuffle };
});
