(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpellingBeastRemotePersistence = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MIGRATION_KEY = 'spellingbeast:v2-migration-complete';

  function createRemotePersistence({ apiClient, localPersistence, storage = globalThis.localStorage }) {
    let wordLists = [];
    let activeMistakes = [];

    function replaceState(state) {
      wordLists = Array.isArray(state?.wordLists) ? state.wordLists : [];
      activeMistakes = Array.isArray(state?.activeMistakes) ? state.activeMistakes : [];
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
      return { wordLists, activeMistakes };
    }
    function loadWordLists() { return wordLists.slice(); }
    function loadActiveMistakes() { return activeMistakes.slice(); }
    async function saveWordList(wordList) {
      const payload = await apiClient.request(`/word-lists/${encodeURIComponent(wordList.id)}`, { method: 'PUT', body: JSON.stringify(wordList) });
      const saved = payload.wordList;
      const index = wordLists.findIndex((entry) => entry.id === saved.id);
      wordLists = index === -1 ? wordLists.concat(saved) : wordLists.map((entry, i) => (i === index ? saved : entry));
      return saved;
    }
    async function updateWordList(wordListId, updates) {
      const current = wordLists.find((entry) => entry.id === wordListId);
      if (!current) throw new Error(`Word list not found: ${wordListId}`);
      const patch = typeof updates === 'function' ? updates(current) : updates;
      return saveWordList({ ...current, ...patch, id: current.id });
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
    return { initialize, loadActiveMistakes, loadWordLists, saveActiveMistake, saveWordList, updateWordList, deleteActiveMistake };
  }

  return { createRemotePersistence, MIGRATION_KEY };
});
