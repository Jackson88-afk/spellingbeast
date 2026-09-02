(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastAudio = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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

  function describeSpeechSynthesisFailure(error) {
    if (error && error.code === 'speech-synthesis-unsupported') {
      return '这个浏览器不支持朗读功能。请换个浏览器再试一次。';
    }

    if (error && error.code === 'speech-synthesis-unavailable') {
      return '朗读功能暂时不可用。请再试一次。';
    }

    if (error && error.code === 'speech-synthesis-error') {
      return '朗读失败了。请再试一次。';
    }

    return '无法播放这个单词，请再试一次。';
  }

  function playWord(word, options = {}) {
    const env = options.env || globalThis;
    const speechSynthesis = options.speechSynthesis || env.speechSynthesis;
    const Utterance = options.Utterance || env.SpeechSynthesisUtterance;

    if (!speechSynthesis) {
      return Promise.reject(createSpeechSynthesisError(
        'speech-synthesis-unsupported',
        '这个浏览器不支持朗读功能。请换个浏览器再试一次。',
      ));
    }

    if (typeof speechSynthesis.speak !== 'function' || typeof Utterance !== 'function') {
      return Promise.reject(createSpeechSynthesisError(
        'speech-synthesis-unavailable',
        '朗读功能暂时不可用。请再试一次。',
      ));
    }

    return new Promise((resolve, reject) => {
      let utterance;
      try {
        utterance = new Utterance(String(word));
        utterance.onend = () => resolve(utterance);
        utterance.onerror = (event) => {
          reject(createSpeechSynthesisError(
            'speech-synthesis-error',
            '朗读失败了。请再试一次。',
            event && event.error,
          ));
        };
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(createSpeechSynthesisError(
          'speech-synthesis-error',
          '朗读失败了。请再试一次。',
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
