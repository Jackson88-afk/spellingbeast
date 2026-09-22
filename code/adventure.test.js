const test = require('node:test');
const assert = require('node:assert/strict');
const adventure = require('./adventure.js');

for (const [count, expected] of [[1, 1], [5, 1], [6, 2], [12, 3]]) {
  test(`${count} words generate ${expected} consecutive levels without mutation`, () => {
    const words = Array.from({ length: count }, (_, index) => `word-${index + 1}`);
    const original = words.slice();
    const levels = adventure.createLevels(words);
    assert.equal(levels.length, expected);
    assert.deepEqual(levels.flatMap((level) => level.words), words);
    assert.deepEqual(words, original);
    assert.ok(levels.every((level) => level.words.length <= 5));
  });
}

test('selected level alone is shuffled through the injected Fisher-Yates seam', () => {
  const list = { id: 'list-1', name: 'Twelve', words: Array.from({ length: 12 }, (_, i) => `w${i + 1}`) };
  const before = list.words.slice();
  const session = adventure.createLevelSession(list, 2, () => 0);
  assert.deepEqual(session.words, ['w7', 'w8', 'w9', 'w10', 'w6']);
  assert.deepEqual(list.words, before);
});

test('integer star boundaries cover full and small final levels', () => {
  assert.equal(adventure.scoreStars(0, 5), 0);
  assert.equal(adventure.scoreStars(2, 5), 0);
  assert.equal(adventure.scoreStars(3, 5), 1);
  assert.equal(adventure.scoreStars(4, 5), 2);
  assert.equal(adventure.scoreStars(5, 5), 3);
  assert.equal(adventure.scoreStars(0, 1), 0);
  assert.equal(adventure.scoreStars(1, 1), 3);
  assert.equal(adventure.scoreStars(1, 2), 0);
  assert.equal(adventure.scoreStars(2, 3), 1);
  assert.equal(adventure.scoreStars(3, 4), 1);
});

test('unlock state depends only on the immediately preceding passed level', () => {
  assert.equal(adventure.isLevelUnlocked(1, {}), true);
  assert.equal(adventure.isLevelUnlocked(2, { 1: 0 }), false);
  assert.equal(adventure.isLevelUnlocked(2, { 1: 1 }), true);
  assert.equal(adventure.isLevelUnlocked(3, { 1: 3, 2: 0 }), false);
});

test('best stars never regress and list progress is owner-state shaped', () => {
  assert.equal(adventure.mergeBestStars(3, 1), 3);
  assert.equal(adventure.mergeBestStars(1, 2), 2);
  assert.deepEqual(adventure.progressForList([
    { wordListId: 'a', levelNumber: 1, bestStars: 1 },
    { wordListId: 'a', levelNumber: 1, bestStars: 3 },
    { wordListId: 'b', levelNumber: 1, bestStars: 2 },
  ], 'a'), { 1: 3 });
});

for (const levelCount of [1, 3, 10, 30]) {
  test(`${levelCount} journey levels preserve ascending numbers and positions`, () => {
    const levels = adventure.createLevels(Array.from({ length: levelCount * 5 }, (_, index) => `journey-${index + 1}`));
    assert.deepEqual(levels.map((level) => level.number), Array.from({ length: levelCount }, (_, index) => index + 1));
    assert.deepEqual(levels.slice(0, 5).map((level) => adventure.journeyPosition(level.number)), ['left', 'center', 'right', 'center', 'left'].slice(0, levelCount));
  });
}

test('recommended level follows confirmed sequential progress', () => {
  const levels = adventure.createLevels(Array.from({ length: 15 }, (_, index) => `word-${index}`));
  assert.equal(adventure.recommendedLevel(levels, {}), 1);
  assert.equal(adventure.recommendedLevel(levels, { 1: 2 }), 2);
  assert.equal(adventure.recommendedLevel(levels, { 1: 2, 2: 3 }), 3);
  assert.equal(adventure.recommendedLevel(levels, { 1: 2, 2: 3, 3: 1 }), 3);
  assert.equal(adventure.recommendedLevel([], {}), null);
});
