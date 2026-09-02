const assert = require('node:assert/strict');
const { parseTextareaWords, parseTxtWords, parseCsvWords, parseImportInput } = require('./import.js');

function testParseTextareaWordsTrimsBlankLinesWhitespaceAndDuplicates() {
  const result = parseTextareaWords('  Apple  \n\nbanana \n apple\n BANANA \ncarrot  ');

  assert.equal(result.valid, true);
  assert.deepEqual(result.words, ['Apple', 'banana', 'carrot']);
}

function testParseTextareaWordsRejectsEmptyInput() {
  const result = parseTextareaWords(' \n\t\n  ');

  assert.deepEqual(result, {
    valid: false,
    words: [],
    error: 'Add at least one word, with one word on each line.',
  });
}

function testParseTxtWordsUsesTextareaRules() {
  const result = parseTxtWords('  cat\r\n\r\ndog\r\nCAT  \r\n');

  assert.equal(result.valid, true);
  assert.deepEqual(result.words, ['cat', 'dog']);
}

function testParseTxtWordsRejectsEmptyInput() {
  const result = parseTxtWords('\n\n  \t  ');

  assert.deepEqual(result, {
    valid: false,
    words: [],
    error: 'Add at least one word, with one word on each line.',
  });
}

function testParseCsvWordsUsesFirstColumnAndSkipsWordHeader() {
  const result = parseCsvWords(' word,definition\n Apple,fruit\n\nbanana,yellow\n apple,duplicate\nCarrot,veggie');

  assert.equal(result.valid, true);
  assert.deepEqual(result.words, ['Apple', 'banana', 'Carrot']);
}

function testParseCsvWordsRejectsEmptyInput() {
  const result = parseCsvWords('\n\n   \t  ');

  assert.deepEqual(result, {
    valid: false,
    words: [],
    error: 'Add at least one word, with one word on each line.',
  });
}

function testParseImportInputAcceptsTextareaTxtAndCsv() {
  const textarea = parseImportInput('textarea', ' apple \nbanana\nAPPLE');
  const txt = parseImportInput('txt', ' cat \n\ndog\nCAT ');
  const csv = parseImportInput('csv', 'word,meaning\n apple,fruit\nbanana,fruit\n apple,duplicate');

  assert.deepEqual(textarea, { valid: true, words: ['apple', 'banana'] });
  assert.deepEqual(txt, { valid: true, words: ['cat', 'dog'] });
  assert.deepEqual(csv, { valid: true, words: ['apple', 'banana'] });
}

function testParseImportInputRejectsUnsupportedFileTypes() {
  const result = parseImportInput('pdf', 'apple');

  assert.deepEqual(result, {
    valid: false,
    words: [],
    error: 'Please choose a TXT or CSV file.',
  });
}

function run() {
  testParseTextareaWordsTrimsBlankLinesWhitespaceAndDuplicates();
  testParseTextareaWordsRejectsEmptyInput();
  testParseTxtWordsUsesTextareaRules();
  testParseTxtWordsRejectsEmptyInput();
  testParseCsvWordsUsesFirstColumnAndSkipsWordHeader();
  testParseCsvWordsRejectsEmptyInput();
  testParseImportInputAcceptsTextareaTxtAndCsv();
  testParseImportInputRejectsUnsupportedFileTypes();
  console.log('import tests passed');
}

run();
