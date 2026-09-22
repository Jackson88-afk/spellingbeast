(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpellingBeastRemotePersistence = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MIGRATION_KEY = 'spellingbeast:v2-migration-complete';

  function createRemotePersistence({ apiClient, localPersistence, storage = globalThis.localStorage }) {
    let wordLists = [];
    let activeMistakes = [];
    let levelProgress = [];

    function replaceState(state) {
      wordLists = Array.isArray(state?.wordLists) ? state.wordLists : [];
      activeMistakes = Array.isArray(state?.activeMistakes) ? state.activeMistakes : [];
      levelProgress = Array.isArray(state?.levelProgress) ? state.levelProgress : [];
    }
    async function initialize() {
      await apiClient.initialize();
      replaceState(await apiClient.request('/state'));
      const localWordLists = localPersistence.loadWordLists();
      const localMistakes = localPersistence.loadActiveMistakes();
      if (storage.getItem(MIGRATION_KEY) !== 'complete' && (localWordLists.length || localMistakes.length)) {
        replaceState(await apiClient.request('/migrate', {
          method: 'POST',
          body: JSON.stringify({ wordLists: localWordLists, activeMistakes: localMistakes }),
        }));
        storage.setItem(MIGRATION_KEY, 'complete');
      }
      return { wordLists, activeMistakes, levelProgress };
    }
    function loadWordLists() { return wordLists.slice(); }
    function loadActiveMistakes() { return activeMistakes.slice(); }
    function loadLevelProgress() { return levelProgress.slice(); }
    async function saveWordList(wordList) {
      const payload = await apiClient.request(`/word-lists/${encodeURIComponent(wordList.id)}`, { method: 'PUT', body: JSON.stringify(wordList) });
      const saved = payload.wordList;
      const index = wordLists.findIndex((entry) => entry.id === saved.id);
      wordLists = index === -1 ? wordLists.concat(saved) : wordLists.map((entry, i) => (i === index ? saved : entry));
      const savedWords = new Set(saved.words.map((word) => String(word).trim().toLocaleLowerCase('en-US')));
      activeMistakes = activeMistakes
        .filter((mistake) => mistake.wordListId !== saved.id || savedWords.has(String(mistake.word).trim().toLocaleLowerCase('en-US')))
        .map((mistake) => mistake.wordListId === saved.id ? { ...mistake, wordListName: saved.name } : mistake);
      if (payload.progressReset) levelProgress = levelProgress.filter((entry) => entry.wordListId !== saved.id);
      return saved;
    }
    async function updateWordList(wordListId, updates) {
      const current = wordLists.find((entry) => entry.id === wordListId);
      if (!current) throw new Error(`Word list not found: ${wordListId}`);
      const patch = typeof updates === 'function' ? updates(current) : updates;
      return saveWordList({ ...current, ...patch, id: current.id });
    }
    async function deleteWordList(id) {
      await apiClient.request(`/word-lists/${encodeURIComponent(id)}`, { method: 'DELETE' });
      wordLists = wordLists.filter((entry) => entry.id !== id);
      activeMistakes = activeMistakes.filter((entry) => entry.wordListId !== id);
      levelProgress = levelProgress.filter((entry) => entry.wordListId !== id);
    }
    async function saveActiveMistake(mistake) {
      const payload = await apiClient.request('/mistakes', { method: 'POST', body: JSON.stringify(mistake) });
      const saved = payload.mistake;
      const index = activeMistakes.findIndex((entry) => entry.id === saved.id || (entry.wordListId === saved.wordListId && entry.word.toLowerCase() === saved.word.toLowerCase()));
      activeMistakes = index === -1 ? activeMistakes.concat(saved) : activeMistakes.map((entry, i) => (i === index ? saved : entry));
      return saved;
    }
    async function deleteActiveMistake(mistake) {
      const id = typeof mistake === 'string' ? mistake : mistake.id;
      await apiClient.request(`/mistakes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      activeMistakes = activeMistakes.filter((entry) => entry.id !== id);
    }
    async function saveLevelProgress(progress) {
      const payload = await apiClient.request(`/word-lists/${encodeURIComponent(progress.wordListId)}/levels/${encodeURIComponent(progress.levelNumber)}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ bestStars: progress.bestStars }),
      });
      const saved = payload.levelProgress;
      const index = levelProgress.findIndex((entry) => entry.wordListId === saved.wordListId && entry.levelNumber === saved.levelNumber);
      levelProgress = index === -1 ? levelProgress.concat(saved) : levelProgress.map((entry, i) => i === index ? saved : entry);
      return saved;
    }
    return { initialize, loadActiveMistakes, loadLevelProgress, loadWordLists, saveActiveMistake, saveLevelProgress, saveWordList, updateWordList, deleteWordList, deleteActiveMistake };
  }

  return { createRemotePersistence, MIGRATION_KEY };
});
