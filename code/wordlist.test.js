const assert = require('node:assert/strict');
const { createWordList, validateWordList, createId, addWord, removeWord, updateName, getWordCount, hasWord } = require('./wordlist.js');

function testCreateWordList() {
  const wl = createWordList({ id: 'list-1', name: 'Animals', words: ['cat', 'dog'] });
  assert.equal(wl.id, 'list-1');
  assert.equal(wl.name, 'Animals');
  assert.deepEqual(wl.words, ['cat', 'dog']);
  assert.ok(wl.createdAt);
  assert.ok(wl.updatedAt);
  assert.ok(isValidISODate(wl.createdAt));
  assert.ok(isValidISODate(wl.updatedAt));
  console.log('testCreateWordList passed');
}

function testCreateWordListDefaults() {
  const wl = createWordList({ id: 'list-2' });
  assert.equal(wl.id, 'list-2');
  assert.equal(wl.name, '');
  assert.deepEqual(wl.words, []);
  assert.ok(wl.createdAt);
  assert.ok(wl.updatedAt);
  console.log('testCreateWordListDefaults passed');
}

function testValidateWordListValid() {
  const wl = createWordList({ id: 'list-1', name: 'Animals', words: ['cat', 'dog'] });
  const result = validateWordList(wl);
  assert.equal(result.valid, true);
  console.log('testValidateWordListValid passed');
}

function testValidateWordListMissingId() {
  const result = validateWordList({ name: 'Test', words: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('id'));
  console.log('testValidateWordListMissingId passed');
}

function testValidateWordListInvalidName() {
  const wl = createWordList({ id: 'list-1', name: 'Test', words: [] });
  wl.name = 123;
  const result = validateWordList(wl);
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('name'));
  console.log('testValidateWordListInvalidName passed');
}

function testValidateWordListInvalidWords() {
  const wl = createWordList({ id: 'list-1', name: 'Test', words: [] });
  wl.words = 'not-an-array';
  const result = validateWordList(wl);
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('array'));
  console.log('testValidateWordListInvalidWords passed');
}

function testValidateWordListInvalidWordType() {
  const wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat'] });
  wl.words = [123];
  const result = validateWordList(wl);
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('strings'));
  console.log('testValidateWordListInvalidWordType passed');
}

function testValidateWordListInvalidDate() {
  const wl = createWordList({ id: 'list-1', name: 'Test', words: [] });
  wl.createdAt = 'not-a-date';
  const result = validateWordList(wl);
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('ISO date'));
  console.log('testValidateWordListInvalidDate passed');
}

function testCreateId() {
  const id1 = createId();
  const id2 = createId();
  assert.ok(typeof id1 === 'string' && id1.length > 0);
  assert.notEqual(id1, id2);
  console.log('testCreateId passed');
}

function testAddWord() {
  let wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat'] });
  wl = addWord(wl, 'dog');
  assert.deepEqual(wl.words, ['cat', 'dog']);
  assert.ok(wl.updatedAt);
  console.log('testAddWord passed');
}

function testAddWordDuplicate() {
  let wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat'] });
  wl = addWord(wl, 'CAT');
  assert.deepEqual(wl.words, ['cat']);
  console.log('testAddWordDuplicate passed');
}

function testAddWordEmpty() {
  let wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat'] });
  const originalUpdatedAt = wl.updatedAt;
  wl = addWord(wl, '  ');
  assert.deepEqual(wl.words, ['cat']);
  assert.equal(wl.updatedAt, originalUpdatedAt);
  console.log('testAddWordEmpty passed');
}

function testRemoveWord() {
  let wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat', 'dog', 'bird'] });
  wl = removeWord(wl, 'dog');
  assert.deepEqual(wl.words, ['cat', 'bird']);
  assert.ok(wl.updatedAt);
  console.log('testRemoveWord passed');
}

function testRemoveWordCaseInsensitive() {
  let wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat', 'dog'] });
  wl = removeWord(wl, 'CAT');
  assert.deepEqual(wl.words, ['dog']);
  console.log('testRemoveWordCaseInsensitive passed');
}

function testRemoveWordNotFound() {
  let wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat'] });
  const originalUpdatedAt = wl.updatedAt;
  wl = removeWord(wl, 'dog');
  assert.deepEqual(wl.words, ['cat']);
  assert.equal(wl.updatedAt, originalUpdatedAt);
  console.log('testRemoveWordNotFound passed');
}

function testUpdateName() {
  let wl = createWordList({ id: 'list-1', name: 'Old Name', words: [] });
  wl = updateName(wl, 'New Name');
  assert.equal(wl.name, 'New Name');
  assert.ok(wl.updatedAt);
  console.log('testUpdateName passed');
}

function testUpdateNameNoChange() {
  let wl = createWordList({ id: 'list-1', name: 'Same', words: [] });
  const originalUpdatedAt = wl.updatedAt;
  wl = updateName(wl, 'Same');
  assert.equal(wl.name, 'Same');
  assert.equal(wl.updatedAt, originalUpdatedAt);
  console.log('testUpdateNameNoChange passed');
}

function testGetWordCount() {
  const wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat', 'dog', 'bird'] });
  assert.equal(getWordCount(wl), 3);
  console.log('testGetWordCount passed');
}

function testHasWord() {
  const wl = createWordList({ id: 'list-1', name: 'Test', words: ['cat', 'dog'] });
  assert.equal(hasWord(wl, 'cat'), true);
  assert.equal(hasWord(wl, 'CAT'), true);
  assert.equal(hasWord(wl, 'bird'), false);
  console.log('testHasWord passed');
}

function isValidISODate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

function run() {
  testCreateWordList();
  testCreateWordListDefaults();
  testValidateWordListValid();
  testValidateWordListMissingId();
  testValidateWordListInvalidName();
  testValidateWordListInvalidWords();
  testValidateWordListInvalidWordType();
  testValidateWordListInvalidDate();
  testCreateId();
  testAddWord();
  testAddWordDuplicate();
  testAddWordEmpty();
  testRemoveWord();
  testRemoveWordCaseInsensitive();
  testRemoveWordNotFound();
  testUpdateName();
  testUpdateNameNoChange();
  testGetWordCount();
  testHasWord();
  console.log('\nAll wordlist tests passed');
}

run();