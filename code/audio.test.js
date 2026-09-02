const assert = require('node:assert/strict');
const { describeSpeechSynthesisFailure, isSpeechSynthesisSupported, playWord } = require('./audio.js');

async function testPlayWordInvokesSpeechSynthesis() {
  const spoken = [];
  const utterances = [];
  let externalAudioServiceUsed = false;
  const env = {
    fetch() {
      externalAudioServiceUsed = true;
      throw new Error('external audio service should not be used');
    },
  };
  const speechSynthesis = {
    speak(utterance) {
      utterances.push(utterance);
      spoken.push(utterance.text);
      setImmediate(() => utterance.onend && utterance.onend());
    },
  };

  class FakeUtterance {
    constructor(text) {
      this.text = text;
      this.onend = null;
      this.onerror = null;
    }
  }

  await playWord('apple', { env, speechSynthesis, Utterance: FakeUtterance });

  assert.deepEqual(spoken, ['apple']);
  assert.equal(utterances[0].text, 'apple');
  assert.equal(externalAudioServiceUsed, false);
}

async function testPlayWordRejectsWhenSpeechSynthesisIsUnavailable() {
  await assert.rejects(
    () => playWord('apple', { speechSynthesis: null, Utterance: null }),
    (error) => {
      assert.equal(error.code, 'speech-synthesis-unsupported');
      assert.equal(error.message, '这个浏览器不支持朗读功能。请换个浏览器再试一次。');
      return true;
    },
  );
}

async function testPlayWordRejectsWhenSpeechSynthesisCannotSpeak() {
  const speechSynthesis = {
    speak() {
      throw new Error('boom');
    },
  };

  class FakeUtterance {
    constructor(text) {
      this.text = text;
      this.onend = null;
      this.onerror = null;
    }
  }

  await assert.rejects(
    () => playWord('apple', { speechSynthesis, Utterance: FakeUtterance }),
    (error) => {
      assert.equal(error.code, 'speech-synthesis-error');
      assert.equal(error.message, '朗读失败了。请再试一次。');
      return true;
    },
  );
}

function testDescribeSpeechSynthesisFailure() {
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-unsupported' }),
    '这个浏览器不支持朗读功能。请换个浏览器再试一次。',
  );
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-unavailable' }),
    '朗读功能暂时不可用。请再试一次。',
  );
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-error' }),
    '朗读失败了。请再试一次。',
  );
}

function testIsSpeechSynthesisSupported() {
  assert.equal(isSpeechSynthesisSupported({ speechSynthesis: { speak() {} }, SpeechSynthesisUtterance: function () {} }), true);
  assert.equal(isSpeechSynthesisSupported({ speechSynthesis: null, SpeechSynthesisUtterance: function () {} }), false);
}

async function run() {
  testIsSpeechSynthesisSupported();
  testDescribeSpeechSynthesisFailure();
  await testPlayWordInvokesSpeechSynthesis();
  await testPlayWordRejectsWhenSpeechSynthesisIsUnavailable();
  await testPlayWordRejectsWhenSpeechSynthesisCannotSpeak();
  console.log('audio tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
