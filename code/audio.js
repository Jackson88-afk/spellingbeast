(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastAudio = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const FAILURE_MESSAGES = {
    en: {
      unsupported: 'This browser does not support speech playback. Please try a different browser.',
      unavailable: 'Speech playback is temporarily unavailable. Please try again.',
      error: 'Speech playback failed. Please try again.',
      fallback: 'Unable to play this word. Please try again.',
    },
    zh: {
      unsupported: '这个浏览器不支持朗读功能。请换个浏览器再试一次。',
      unavailable: '朗读功能暂时不可用。请再试一次。',
      error: '朗读失败了。请再试一次。',
      fallback: '无法播放这个单词，请再试一次。',
    },
  };

  function createSpeechSynthesisError(code, message, cause) {
    const error = new Error(message);
    error.name = 'SpeechSynthesisError';
    error.code = code;
    if (cause) {
      error.cause = cause;
    }
    return error;
  }

  function isSpeechSynthesisSupported(env = globalThis) {
    return !!(
      env
      && env.speechSynthesis
      && typeof env.speechSynthesis.speak === 'function'
      && typeof env.SpeechSynthesisUtterance === 'function'
    );
  }

  function normalizeLocale(locale) {
    const value = String(locale || '').trim().toLowerCase();
    return value.startsWith('zh') ? 'zh' : 'en';
  }

  function getFailureMessages(locale) {
    return FAILURE_MESSAGES[normalizeLocale(locale)] || FAILURE_MESSAGES.en;
  }

  function describeSpeechSynthesisFailure(error, locale = 'en') {
    const messages = getFailureMessages(locale);

    if (error && error.code === 'speech-synthesis-unsupported') {
      return messages.unsupported;
    }

    if (error && error.code === 'speech-synthesis-unavailable') {
      return messages.unavailable;
    }

    if (error && error.code === 'speech-synthesis-error') {
      return messages.error;
    }

    return messages.fallback;
  }

  function playWord(word, options = {}) {
    const env = options.env || globalThis;
    const speechSynthesis = options.speechSynthesis || env.speechSynthesis;
    const Utterance = options.Utterance || env.SpeechSynthesisUtterance;

    if (!speechSynthesis) {
      return Promise.reject(createSpeechSynthesisError(
        'speech-synthesis-unsupported',
        FAILURE_MESSAGES.en.unsupported,
      ));
    }

    if (typeof speechSynthesis.speak !== 'function' || typeof Utterance !== 'function') {
      return Promise.reject(createSpeechSynthesisError(
        'speech-synthesis-unavailable',
        FAILURE_MESSAGES.en.unavailable,
      ));
    }

    return new Promise((resolve, reject) => {
      let utterance;
      try {
        utterance = new Utterance(String(word));
        try {
          utterance.lang = 'en-US';
        } catch (error) {
          // Use the browser default when the utterance does not expose lang.
        }

        if (typeof speechSynthesis.getVoices === 'function') {
          let voices = [];
          try {
            voices = speechSynthesis.getVoices() || [];
          } catch (error) {
            voices = [];
          }
          const englishVoices = Array.from(voices).filter((voice) => (
            voice && typeof voice.lang === 'string' && voice.lang.toLowerCase().startsWith('en')
          ));
          const preferredVoice = englishVoices.find((voice) => voice.lang.toLowerCase() === 'en-us')
            || englishVoices[0];
          if (preferredVoice) {
            try {
              utterance.voice = preferredVoice;
            } catch (error) {
              // Use the browser's selected voice when voice assignment is unavailable.
            }
          }
        }

        utterance.onend = () => resolve(utterance);
        utterance.onerror = (event) => {
          reject(createSpeechSynthesisError(
            'speech-synthesis-error',
            FAILURE_MESSAGES.en.error,
            event && event.error,
          ));
        };
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(createSpeechSynthesisError(
          'speech-synthesis-error',
          FAILURE_MESSAGES.en.error,
          error,
        ));
      }
    });
  }

  return {
    describeSpeechSynthesisFailure,
    isSpeechSynthesisSupported,
    playWord,
  };
});
