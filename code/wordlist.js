(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastWordList = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  function createWordList(data = {}) {
    if (!data.id) {
      throw new Error('Word list must have an id.');
    }

    return {
      id: String(data.id),
      name: String(data.name || ''),
      words: Array.isArray(data.words) ? data.words.map(String) : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  function validateWordList(wordList) {
    if (!wordList || typeof wordList !== 'object') {
      return { valid: false, error: 'Word list must be an object.' };
    }
    if (!wordList.id || typeof wordList.id !== 'string') {
      return { valid: false, error: 'Word list must have a string id.' };
    }
    if (typeof wordList.name !== 'string') {
      return { valid: false, error: 'Word list name must be a string.' };
    }
    if (!Array.isArray(wordList.words)) {
      return { valid: false, error: 'Word list words must be an array.' };
    }
    for (const word of wordList.words) {
      if (typeof word !== 'string') {
        return { valid: false, error: 'All words must be strings.' };
      }
    }
    if (typeof wordList.createdAt !== 'string' || !isValidISODate(wordList.createdAt)) {
      return { valid: false, error: 'Word list createdAt must be a valid ISO date string.' };
    }
    if (typeof wordList.updatedAt !== 'string' || !isValidISODate(wordList.updatedAt)) {
      return { valid: false, error: 'Word list updatedAt must be a valid ISO date string.' };
    }
    return { valid: true };
  }

  function isValidISODate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  }

  function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  function addWord(wordList, word) {
    const trimmed = String(word).trim();
    if (!trimmed) {
      return wordList;
    }
    const exists = wordList.words.some(w => w.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return wordList;
    }
    return {
      ...wordList,
      words: [...wordList.words, trimmed],
      updatedAt: new Date().toISOString(),
    };
  }

  function removeWord(wordList, word) {
    const trimmed = String(word).trim().toLowerCase();
    const filtered = wordList.words.filter(w => w.toLowerCase() !== trimmed);
    if (filtered.length === wordList.words.length) {
      return wordList;
    }
    return {
      ...wordList,
      words: filtered,
      updatedAt: new Date().toISOString(),
    };
  }

  function updateName(wordList, name) {
    const trimmed = String(name).trim();
    if (trimmed === wordList.name) {
      return wordList;
    }
    return {
      ...wordList,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    };
  }

  function getWordCount(wordList) {
    return wordList.words.length;
  }

  function hasWord(wordList, word) {
    const trimmed = String(word).trim().toLowerCase();
    return wordList.words.some(w => w.toLowerCase() === trimmed);
  }

  return {
    createWordList,
    validateWordList,
    createId,
    addWord,
    removeWord,
    updateName,
    getWordCount,
    hasWord,
  };
});