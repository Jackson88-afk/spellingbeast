const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseAttributes(attributeSource) {
  const attributes = {};
  const attributeRegex = /([a-zA-Z0-9:-]+)(?:="([^"]*)")?/g;
  let match;
  while ((match = attributeRegex.exec(attributeSource)) !== null) {
    const key = match[1];
    attributes[key] = match[2] === undefined ? '' : match[2];
  }
  return attributes;
}

function createElement(tagName, attributes = {}) {
  const listeners = new Map();
  let textContent = '';
  let value = attributes.value || '';
  let innerHTML = '';
  const element = {
    tagName: tagName.toUpperCase(),
    id: attributes.id || '',
    className: attributes.class || '',
    dataset: Object.keys(attributes).reduce((acc, key) => {
      if (key.startsWith('data-')) {
        const camelKey = key
          .slice(5)
          .split('-')
          .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
          .join('');
        acc[camelKey] = attributes[key];
      }
      return acc;
    }, {}),
    style: {},
    disabled: false,
    hidden: false,
    files: [],
    focus() {
      this.focused = true;
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    dispatchEvent(type, event = {}) {
      const handlers = listeners.get(type) || [];
      let lastResult;
      handlers.forEach((handler) => {
        lastResult = handler({
          currentTarget: this,
          preventDefault() {},
          target: this,
          type,
          ...event,
        });
      });
      return lastResult;
    },
    click() {
      return this.dispatchEvent('click');
    },
    get value() {
      return value;
    },
    set value(nextValue) {
      value = String(nextValue);
    },
    get textContent() {
      return textContent;
    },
    set textContent(nextValue) {
      textContent = String(nextValue);
    },
    get innerHTML() {
      if (tagName === 'span') {
        return escapeHtml(textContent);
      }
      return innerHTML;
    },
    set innerHTML(nextValue) {
      innerHTML = String(nextValue);
    },
  };
  return element;
}

function createDocument() {
  const elementsById = new Map();
  const practiceListButtons = [];
  const sizeButtons = [];
  const appElement = createElement('div', { id: 'app' });
  let markup = '';

  function hydrate(nextMarkup) {
    markup = String(nextMarkup);
    elementsById.clear();
    elementsById.set('app', appElement);
    practiceListButtons.length = 0;
    sizeButtons.length = 0;

    const tagRegex = /<([a-zA-Z0-9-]+)\b([^>]*)>/g;
    let match;
    while ((match = tagRegex.exec(markup)) !== null) {
      const tagName = match[1].toLowerCase();
      const attributes = parseAttributes(match[2]);
      const element = createElement(tagName, attributes);
      if (attributes.id) {
        elementsById.set(attributes.id, element);
      }
      if (tagName === 'button') {
        if ((attributes.class || '').split(/\s+/).includes('practice-list')) {
          practiceListButtons.push(element);
        }
        if (Object.prototype.hasOwnProperty.call(attributes, 'data-size')) {
          sizeButtons.push(element);
        }
      }
    }
  }

  Object.defineProperty(appElement, 'innerHTML', {
    get() {
      return markup;
    },
    set(value) {
      hydrate(value);
    },
  });

  const document = {
    getElementById(id) {
      return elementsById.get(id) || null;
    },
    querySelectorAll(selector) {
      if (selector === '.practice-list') {
        return practiceListButtons;
      }
      if (selector === '[data-size]') {
        return sizeButtons;
      }
      return [];
    },
    createElement(tagName) {
      return createElement(tagName);
    },
    __appElement: appElement,
  };

  elementsById.set('app', appElement);
  return document;
}

function loadAppSandbox(overrides = {}) {
  const document = createDocument();
  const playWordCalls = [];
  const overrideAudio = overrides.audio || {};
  const audio = {
    async playWord(word) {
      playWordCalls.push(word);
      if (typeof overrideAudio.playWord === 'function') {
        return overrideAudio.playWord(word);
      }
      return { word };
    },
    describeSpeechSynthesisFailure(error) {
      if (typeof overrideAudio.describeSpeechSynthesisFailure === 'function') {
        return overrideAudio.describeSpeechSynthesisFailure(error);
      }
      return error && error.message ? error.message : '无法播放这个单词，请再试一次。';
    },
  };
  const session = overrides.session || {
    createPracticeSession(list, selectedSessionSize) {
      return {
        availableWordCount: list.words.length,
        selectedWordCount: selectedSessionSize === 'All' ? list.words.length : Math.min(selectedSessionSize, list.words.length),
        words: list.words.slice(0, selectedSessionSize === 'All' ? list.words.length : selectedSessionSize),
      };
    },
  };
  const practice = overrides.practice || {
    createPracticeStateMachine(sessionValue) {
      const words = sessionValue.words.slice();
      const state = {
        phase: 'question',
        currentIndex: 0,
        currentPosition: 1,
        totalWords: words.length,
        answer: '',
        feedback: null,
        summary: null,
      };
      return {
        start() {},
        getState() {
          return state;
        },
        setAnswer(value) {
          state.answer = value;
          state.phase = 'answering';
        },
        submitAnswer(value) {
          state.phase = 'submitted';
          state.feedback = {
            isCorrect: value.trim().toLowerCase() === words[0].toLowerCase(),
            submittedAnswer: value,
            correctAnswer: words[0],
          };
          return { feedback: state.feedback };
        },
        showFeedback() {
          state.phase = 'feedback';
        },
        next() {
          state.phase = 'complete';
          state.summary = {
            correctCount: 1,
            totalAttempted: 1,
            needsMorePracticeCount: 0,
            missedWords: [],
          };
        },
      };
    },
    shouldShowPracticeMistakesAction() {
      return false;
    },
  };
  const persistence = overrides.persistence || {
    createPersistence() {
      return {
        loadWordLists() {
          return [
            {
              id: 'animals',
              name: 'Animals',
              words: ['ant'],
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ];
        },
        loadActiveMistakes() {
          return [];
        },
        saveWordList() {},
        saveActiveMistake() {},
        deleteActiveMistake() {},
      };
    },
  };
  const mistake = overrides.mistake || {
    summarizeActiveMistakes() {
      return { count: 0, words: [], emptyState: '当前没有需要额外练习的单词。' };
    },
    createMistake() {
      return {};
    },
    createPracticeMistakesSession() {
      return { words: [] };
    },
    applyPracticeMistakeSubmission() {
      return { removed: false };
    },
  };
  const wordList = overrides.wordList || {
    createWordList(value) {
      return value;
    },
    createId() {
      return 'word-list-1';
    },
  };

  const sandbox = {
    Array,
    Boolean,
    Date,
    Error,
    JSON,
    Math,
    Object,
    Promise,
    RegExp,
    String,
    clearImmediate,
    clearTimeout,
    console,
    document,
    setImmediate,
    setTimeout,
    SpellingBeastAudio: audio,
    SpellingBeastMistake: mistake,
    SpellingBeastPersistence: persistence,
    SpellingBeastPractice: practice,
    SpellingBeastSession: session,
    SpellingBeastWordList: wordList,
    window: null,
  };
  sandbox.window = sandbox;

  const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  vm.runInNewContext(source, sandbox, { filename: 'app.js' });

  return {
    audio,
    document,
    playWordCalls,
    sandbox,
  };
}

async function testPlayWordRequiresExplicitUserClick() {
  const { document, playWordCalls } = loadAppSandbox();

  assert.equal(playWordCalls.length, 0);

  const listButton = document.querySelectorAll('.practice-list')[0];
  await listButton.click();
  const allButton = document.querySelectorAll('[data-size]').find((button) => button.dataset.size === 'All');
  await allButton.click();
  await document.getElementById('start-practice').click();

  assert.equal(playWordCalls.length, 0);

  await document.getElementById('play-word').click();

  assert.deepEqual(playWordCalls, ['ant']);
}

async function testPlayWordFailureIsVisibleToTheChild() {
  const failureMessage = '朗读功能暂时不可用。请再试一次。';
  const { document, playWordCalls } = loadAppSandbox({
    audio: {
      async playWord() {
        throw Object.assign(new Error('boom'), { code: 'speech-synthesis-unavailable' });
      },
      describeSpeechSynthesisFailure() {
        return failureMessage;
      },
    },
  });

  await document.querySelectorAll('.practice-list')[0].click();
  await document.querySelectorAll('[data-size]').find((button) => button.dataset.size === 'All').click();
  await document.getElementById('start-practice').click();
  await document.getElementById('play-word').click();

  assert.deepEqual(playWordCalls, ['ant']);
  assert.equal(document.getElementById('app').innerHTML.includes(failureMessage), true);
}

async function run() {
  await testPlayWordRequiresExplicitUserClick();
  await testPlayWordFailureIsVisibleToTheChild();
  console.log('app audio tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
