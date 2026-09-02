(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastImport = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EMPTY_WORDS_ERROR = 'Add at least one word, with one word on each line.';

  function parseTextareaWords(text) {
    const words = uniqueWords(String(text).split(/\r?\n/));

    if (words.length === 0) {
      return { valid: false, words: [], error: EMPTY_WORDS_ERROR };
    }

    return { valid: true, words };
  }

  function parseTxtWords(text) {
    return parseTextareaWords(text);
  }

  function parseCsvWords(text) {
    const firstColumnValues = String(text)
      .split(/\r?\n/)
      .map((line) => line.split(',')[0]);
    const firstUsableValue = firstColumnValues.find((value) => String(value).trim());
    const values = firstUsableValue && String(firstUsableValue).trim().toLowerCase() === 'word'
      ? firstColumnValues.slice(firstColumnValues.indexOf(firstUsableValue) + 1)
      : firstColumnValues;
    const words = uniqueWords(values);

    if (words.length === 0) {
      return { valid: false, words: [], error: EMPTY_WORDS_ERROR };
    }

    return { valid: true, words };
  }

  function parseImportInput(type, text) {
    if (type === 'textarea' || type === 'txt') {
      return parseTextareaWords(text);
    }
    if (type === 'csv') {
      return parseCsvWords(text);
    }
    return { valid: false, words: [], error: 'Please choose a TXT or CSV file.' };
  }

  function uniqueWords(lines) {
    const seen = new Set();

    return lines.reduce((words, line) => {
      const word = String(line).trim();
      const key = word.toLowerCase();

      if (word && !seen.has(key)) {
        seen.add(key);
        words.push(word);
      }

      return words;
    }, []);
  }

  return {
    parseTextareaWords,
    parseTxtWords,
    parseCsvWords,
    parseImportInput,
  };
});
