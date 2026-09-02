(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastPersistence = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const WORD_LISTS_KEY = 'word-lists';
  const ACTIVE_MISTAKES_KEY = 'active-mistakes';

  function createPersistence(options = {}) {
    const storage = options.storage || getBrowserStorage();
    const namespace = normalizeNamespace(options.namespace || 'spellingbeast');
    const wordListsKey = `${namespace}:${WORD_LISTS_KEY}`;
    const activeMistakesKey = `${namespace}:${ACTIVE_MISTAKES_KEY}`;

    return {
      loadWordLists() {
        return readArray(storage, wordListsKey);
      },
      saveWordList(wordList) {
        const lists = readArray(storage, wordListsKey);
        const normalized = normalizeWordList(wordList, lists);
        const index = lists.findIndex((entry) => entry.id === normalized.id);
        const next = index === -1
          ? lists.concat(normalized)
          : lists.map((entry, currentIndex) => (currentIndex === index ? normalized : entry));
        writeArray(storage, wordListsKey, next);
        return normalized;
      },
      updateWordList(wordListId, updates) {
        const lists = readArray(storage, wordListsKey);
        const index = lists.findIndex((entry) => entry.id === wordListId);
        if (index === -1) {
          throw new Error(`Word list not found: ${wordListId}`);
        }

        const current = lists[index];
        const patch = typeof updates === 'function' ? updates(current) : updates;
        const nextWordList = normalizeWordList({ ...current, ...patch, id: current.id }, lists, current);
        const next = lists.map((entry, currentIndex) => (currentIndex === index ? nextWordList : entry));
        writeArray(storage, wordListsKey, next);
        return nextWordList;
      },
      loadActiveMistakes() {
        return readArray(storage, activeMistakesKey);
      },
      saveActiveMistake(mistake) {
        const mistakes = readArray(storage, activeMistakesKey);
        const normalized = normalizeMistake(mistake);
        const index = mistakes.findIndex((entry) => entry.id === normalized.id);
        const next = index === -1
          ? mistakes.concat(normalized)
          : mistakes.map((entry, currentIndex) => (currentIndex === index ? normalized : entry));
        writeArray(storage, activeMistakesKey, next);
        return normalized;
      },
      deleteActiveMistake(mistake) {
        const key = resolveMistakeId(mistake);
        const mistakes = readArray(storage, activeMistakesKey);
        const next = mistakes.filter((entry) => entry.id !== key);
        writeArray(storage, activeMistakesKey, next);
      },
    };
  }

  function normalizeNamespace(namespace) {
    return String(namespace).trim().replace(/:+$/, '');
  }

  function getBrowserStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    throw new Error('Browser localStorage is not available. Provide a storage implementation.');
  }

  function readArray(storage, key) {
    const raw = storage.getItem(key);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeArray(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function normalizeWordList(wordList, existingLists, fallbackCurrent = null) {
    if (!wordList || typeof wordList !== 'object') {
      throw new Error('Word list must be an object.');
    }

    if (!wordList.id) {
      throw new Error('Word list must have an id.');
    }

    const existing = fallbackCurrent || existingLists.find((entry) => entry.id === wordList.id) || null;
    const createdAt = wordList.createdAt || (existing && existing.createdAt) || new Date().toISOString();
    const updatedAt = wordList.updatedAt || new Date().toISOString();

    return {
      id: String(wordList.id),
      name: String(wordList.name || ''),
      words: Array.isArray(wordList.words) ? wordList.words.map(String) : [],
      createdAt,
      updatedAt,
    };
  }

  function normalizeMistake(mistake) {
    if (!mistake || typeof mistake !== 'object') {
      throw new Error('Mistake must be an object.');
    }

    if (!mistake.wordListId) {
      throw new Error('Mistake must have a wordListId.');
    }

    if (!mistake.word) {
      throw new Error('Mistake must have a word.');
    }

    const id = resolveMistakeId(mistake);
    const wordListName = mistake.wordListName == null ? '' : String(mistake.wordListName).trim();
    return {
      id,
      wordListId: String(mistake.wordListId),
      ...(wordListName ? { wordListName } : {}),
      word: String(mistake.word).trim(),
      active: mistake.active !== false,
      createdAt: mistake.createdAt || new Date().toISOString(),
      updatedAt: mistake.updatedAt || new Date().toISOString(),
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

  return {
    createPersistence,
  };
});
