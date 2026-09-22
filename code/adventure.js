(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./session.js'));
  else root.SpellingBeastAdventure = factory(root.SpellingBeastSession);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (sessionModule) {
  const WORDS_PER_LEVEL = 5;

  function createLevels(words) {
    const source = Array.isArray(words) ? words : [];
    const levels = [];
    for (let index = 0; index < source.length; index += WORDS_PER_LEVEL) {
      levels.push({ number: levels.length + 1, words: source.slice(index, index + WORDS_PER_LEVEL) });
    }
    return levels;
  }

  function createLevelSession(wordList, levelNumber, random = Math.random) {
    const levels = createLevels(wordList?.words);
    const level = levels[Number(levelNumber) - 1];
    if (!level) throw new Error('Adventure level is invalid.');
    const words = sessionModule.shuffle(level.words, random);
    return {
      wordListId: String(wordList.id),
      wordListName: String(wordList.name || ''),
      levelNumber: level.number,
      availableWordCount: level.words.length,
      selectedWordCount: words.length,
      words,
      currentIndex: 0,
      createdAt: new Date().toISOString(),
    };
  }

  function scoreStars(correctCount, totalWords) {
    const correct = Number(correctCount);
    const total = Number(totalWords);
    if (!Number.isInteger(correct) || !Number.isInteger(total) || total <= 0 || correct < 0 || correct > total) {
      throw new Error('Adventure score is invalid.');
    }
    if (correct === total) return 3;
    if (correct * 100 >= total * 80) return 2;
    if (correct * 100 >= total * 60) return 1;
    return 0;
  }

  function progressForList(progress, wordListId) {
    return (Array.isArray(progress) ? progress : [])
      .filter((entry) => entry.wordListId === wordListId)
      .reduce((result, entry) => {
        const level = Number(entry.levelNumber);
        const stars = Number(entry.bestStars);
        if (Number.isInteger(level) && level > 0 && Number.isInteger(stars) && stars >= 0 && stars <= 3) {
          result[level] = Math.max(result[level] || 0, stars);
        }
        return result;
      }, {});
  }

  function isLevelUnlocked(levelNumber, progressByLevel) {
    const level = Number(levelNumber);
    if (!Number.isInteger(level) || level < 1) return false;
    return level === 1 || Number(progressByLevel?.[level - 1] || 0) >= 1;
  }

  function mergeBestStars(previous, attempted) {
    const oldStars = Number(previous || 0);
    const newStars = Number(attempted);
    if (!Number.isInteger(oldStars) || !Number.isInteger(newStars) || oldStars < 0 || oldStars > 3 || newStars < 0 || newStars > 3) {
      throw new Error('Stars must be an integer from 0 to 3.');
    }
    return Math.max(oldStars, newStars);
  }

  function totalStars(levels, progressByLevel) {
    return (Array.isArray(levels) ? levels : []).reduce((sum, level) => sum + Number(progressByLevel?.[level.number] || 0), 0);
  }

  function recommendedLevel(levels, progressByLevel) {
    const source = Array.isArray(levels) ? levels : [];
    const next = source.find((level) => isLevelUnlocked(level.number, progressByLevel) && Number(progressByLevel?.[level.number] || 0) === 0);
    return next ? next.number : (source.length ? source[source.length - 1].number : null);
  }

  function journeyPosition(levelNumber) {
    return ['left', 'center', 'right', 'center'][(Math.max(1, Number(levelNumber) || 1) - 1) % 4];
  }

  return { WORDS_PER_LEVEL, createLevels, createLevelSession, scoreStars, progressForList, isLevelUnlocked, mergeBestStars, totalStars, recommendedLevel, journeyPosition };
});
