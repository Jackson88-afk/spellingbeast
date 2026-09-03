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

async function testPlayWordRequestsAmericanEnglishVoice() {
  const voices = [
    { lang: 'en-GB', name: 'English UK' },
    { lang: 'EN-us', name: 'English US' },
  ];
  let spokenUtterance;
  const speechSynthesis = {
    getVoices() {
      return voices;
    },
    speak(utterance) {
      spokenUtterance = utterance;
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

  await playWord('apple', { speechSynthesis, Utterance: FakeUtterance });

  assert.equal(spokenUtterance.lang, 'en-US');
  assert.equal(spokenUtterance.voice, voices[1]);
}

async function testPlayWordFallsBackToEnglishVoice() {
  const englishVoice = { lang: 'en-AU' };
  let spokenUtterance;
  const speechSynthesis = {
    getVoices() {
      return [{ lang: 'fr-FR' }, englishVoice];
    },
    speak(utterance) {
      spokenUtterance = utterance;
      setImmediate(() => utterance.onend && utterance.onend());
    },
  };

  class FakeUtterance {
    constructor() {
      this.onend = null;
      this.onerror = null;
    }
  }

  await playWord('apple', { speechSynthesis, Utterance: FakeUtterance });

  assert.equal(spokenUtterance.voice, englishVoice);
}

async function testPlayWordDoesNotAssignVoiceWhenNoEnglishVoiceExists() {
  let spokenUtterance;
  const speechSynthesis = {
    getVoices() {
      return [{ lang: 'fr-FR' }, { lang: 'de-DE' }];
    },
    speak(utterance) {
      spokenUtterance = utterance;
      setImmediate(() => utterance.onend && utterance.onend());
    },
  };

  class FakeUtterance {
    constructor() {
      this.voice = null;
      this.onend = null;
      this.onerror = null;
    }
  }

  await playWord('apple', { speechSynthesis, Utterance: FakeUtterance });

  assert.equal(spokenUtterance.voice, null);
}

async function testPlayWordRejectsWhenSpeechSynthesisIsUnavailable() {
  await assert.rejects(
    () => playWord('apple', { speechSynthesis: null, Utterance: null }),
    (error) => {
      assert.equal(error.code, 'speech-synthesis-unsupported');
      assert.equal(error.message, 'This browser does not support speech playback. Please try a different browser.');
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
      assert.equal(error.message, 'Speech playback failed. Please try again.');
      return true;
    },
  );
}

function testDescribeSpeechSynthesisFailure() {
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-unsupported' }),
    'This browser does not support speech playback. Please try a different browser.',
  );
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-unavailable' }),
    'Speech playback is temporarily unavailable. Please try again.',
  );
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-error' }),
    'Speech playback failed. Please try again.',
  );
  assert.equal(
    describeSpeechSynthesisFailure({ code: 'speech-synthesis-error' }, 'zh-CN'),
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
  await testPlayWordRequestsAmericanEnglishVoice();
  await testPlayWordFallsBackToEnglishVoice();
  await testPlayWordDoesNotAssignVoiceWhenNoEnglishVoiceExists();
  await testPlayWordRejectsWhenSpeechSynthesisIsUnavailable();
  await testPlayWordRejectsWhenSpeechSynthesisCannotSpeak();
  console.log('audio tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
