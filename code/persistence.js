(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastPersistence = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const WORD_LISTS_KEY = 'word-lists';
  const ACTIVE_MISTAKES_KEY = 'active-mistakes';
  const LEVEL_PROGRESS_KEY = 'level-progress';

  function createPersistence(options = {}) {
    const storage = options.storage || getBrowserStorage();
    const namespace = normalizeNamespace(options.namespace || 'spellingbeast');
    const wordListsKey = `${namespace}:${WORD_LISTS_KEY}`;
    const activeMistakesKey = `${namespace}:${ACTIVE_MISTAKES_KEY}`;
    const levelProgressKey = `${namespace}:${LEVEL_PROGRESS_KEY}`;

    return {
      loadWordLists() {
        return readArray(storage, wordListsKey);
      },
      saveWordList(wordList) {
        const lists = readArray(storage, wordListsKey);
        const normalized = normalizeWordList(wordList, lists);
        const index = lists.findIndex((entry) => entry.id === normalized.id);
        const existing = index === -1 ? null : lists[index];
        const next = index === -1
          ? lists.concat(normalized)
          : lists.map((entry, currentIndex) => (currentIndex === index ? normalized : entry));
        writeArray(storage, wordListsKey, next);
        const progressReset = Boolean(existing && !sameNormalizedWords(existing.words, normalized.words));
        if (progressReset) {
          writeArray(storage, levelProgressKey, readArray(storage, levelProgressKey).filter((entry) => entry.wordListId !== normalized.id));
        }
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
        if (!sameNormalizedWords(current.words, nextWordList.words)) {
          writeArray(storage, levelProgressKey, readArray(storage, levelProgressKey).filter((entry) => entry.wordListId !== wordListId));
        }
        return nextWordList;
      },
      deleteWordList(wordListId) {
        writeArray(storage, wordListsKey, readArray(storage, wordListsKey).filter((entry) => entry.id !== wordListId));
        writeArray(storage, activeMistakesKey, readArray(storage, activeMistakesKey).filter((entry) => entry.wordListId !== wordListId));
        writeArray(storage, levelProgressKey, readArray(storage, levelProgressKey).filter((entry) => entry.wordListId !== wordListId));
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
      loadLevelProgress() {
        return readArray(storage, levelProgressKey);
      },
      saveLevelProgress(progress) {
        const wordListId = String(progress?.wordListId || '');
        const levelNumber = Number(progress?.levelNumber);
        const bestStars = Number(progress?.bestStars);
        const list = readArray(storage, wordListsKey).find((entry) => entry.id === wordListId);
        const maxLevel = list ? Math.ceil(list.words.length / 5) : 0;
        if (!wordListId || !Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > maxLevel
          || !Number.isInteger(bestStars) || bestStars < 0 || bestStars > 3) {
          throw new Error('Adventure progress is invalid.');
        }
        const entries = readArray(storage, levelProgressKey);
        const index = entries.findIndex((entry) => entry.wordListId === wordListId && entry.levelNumber === levelNumber);
        const saved = {
          wordListId,
          levelNumber,
          bestStars: Math.max(bestStars, index === -1 ? 0 : entries[index].bestStars),
          updatedAt: new Date().toISOString(),
        };
        const next = index === -1 ? entries.concat(saved) : entries.map((entry, i) => i === index ? saved : entry);
        writeArray(storage, levelProgressKey, next);
        return saved;
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

  function sameNormalizedWords(left, right) {
    const normalize = (values) => (Array.isArray(values) ? values : []).map((word) => String(word).trim().toLocaleLowerCase('en-US'));
    const a = normalize(left);
    const b = normalize(right);
    return a.length === b.length && a.every((word, index) => word === b[index]);
  }

  return {
    createPersistence,
  };
});
