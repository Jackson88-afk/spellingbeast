(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpellingBeastLocalization = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_LOCALE = 'en';
  const SUPPORTED_LOCALES = ['en', 'zh'];
  const LOCALE_STORAGE_KEY = 'spellingbeast:locale';

  const STRINGS = {
    en: {
      'home.title': 'My Word Lists',
      'home.mistakesButton': 'Mistakes ({count})',
      'home.addListButton': 'Add Word List',
      'home.wordCount': '{count} words',
      'home.emptyState': 'No word lists yet. Add one to get started!',
      'home.savedMessage': 'Word list saved.',

      'hero.brand': 'SpellingBeast',
      'hero.title': 'Spelling Practice',
      'hero.lead': 'Add your own words, then start practicing.',
      'footer.brand': 'SpellingBeast',
      'footer.tagline': 'Local-first static scaffold',
      'language.button': 'Language: EN',
      'language.ariaLabel': 'Switch language to Chinese',
      'common.all': 'All',


      'mistakes.backButton': '← Back',
      'mistakes.status': 'You have {count} mistakes',
      'mistakes.title': 'Mistakes',
      'mistakes.lead': 'Practice the words you missed.',
      'mistakes.practiceButton': 'Practice Mistakes',
      'mistakes.fromList': 'From',
      'mistakes.emptyEyebrow': 'All Caught Up',
      'mistakes.emptyTitle': 'Great job!',
      'mistakes.emptyText': 'There are no words needing extra practice right now.',
      'mistakes.emptyHint': 'Go back home and practice another list.',
      'mistakes.practiceSessionName': 'Mistakes Practice',
      'mistakes.practiceSessionWordListName': 'Mistakes Practice',

      'import.backButton': '← Back',
      'import.title': 'Add Word List',
      'import.headerLead': 'Create one list by typing words or uploading TXT / CSV.',
      'import.nameLabel': 'Word list name',
      'import.nameHint': 'This name appears on Home and in Practice.',
      'import.namePlaceholder': 'e.g. Weekly words',
      'import.wordsLabel': 'Write one word per line',
      'import.wordsHint': 'Paste the words you want to practice.',
      'import.wordsPlaceholder': 'apple\nbeautiful\ncalendar',
      'import.fileLabel': 'Or upload TXT / CSV',
      'import.fileHint': 'TXT uses one word per line. CSV uses the first column.',
      'import.cancelButton': 'Cancel',
      'import.saveButton': 'Save Word List',
      'import.readError': 'Unable to read this file. Please try again.',
      'import.savedMessage': 'Word list saved.',
      'import.emptyWords': 'Add at least one word, with one word on each line.',
      'import.unsupportedFileType': 'Please choose a TXT or CSV file.',


      'setup.backButton': '← Back',
      'setup.title': 'Start Practice',
      'setup.lead': '{name} · {count} words',
      'setup.label': 'Choose how many words to practice',
      'setup.groupLabel': 'Choose session size',
      'setup.startButton': 'Start Practice',

      'practice.completeTitle': 'Practice Complete',
      'practice.completeLead': 'You finished this set of words. Here are the results.',
      'practice.progressLabel': 'Progress',
      'practice.questionStatus': 'Word {current} of {total}',
      'practice.prompt': 'Listen first, then spell it.',
      'practice.playButton': 'Play Word',
      'practice.playHint': 'Tap Play first, then spell.',
      'practice.answerLabel': 'Type the spelling',
      'practice.answerPlaceholder': 'Type here',
      'practice.submitButton': 'Submit',
      'practice.nextButton': 'Next',
      'practice.doneButton': 'Done',
      'practice.summaryTitle': 'Session Results',
      'practice.summaryLead': 'Here is how this practice went.',
      'practice.correctCount': 'Correct count: {count}',
      'practice.totalAttempted': 'Total attempted: {count}',
      'practice.needsMorePracticeCount': 'Needs more practice: {count}',
      'practice.missedTitle': 'Missed Words',
      'practice.noMissed': 'No words were missed this time.',
      'practice.missedWord': 'Word:',
      'practice.correctSpelling': 'Correct spelling:',
      'practice.practiceMistakesButton': 'Practice Mistakes',
      'practice.mistakesButton': 'Mistakes',
      'practice.homeButton': 'Home',
      'practice.correctFeedback': 'Great job! Spelling correct.',
      'practice.tryAgain': 'Try again.',
      'practice.yourAnswer': 'Your answer:',
      'practice.correctAnswer': 'Correct spelling:',
      'audio.failure': 'Unable to play this word. Please try again.',
    },
    zh: {
      'home.title': '我的单词表',
      'home.mistakesButton': '错题本 ({count})',
      'home.addListButton': '添加单词表',
      'home.wordCount': '{count} 个单词',
      'home.emptyState': '还没有单词表。先添加一个吧！',
      'home.savedMessage': '单词表已保存。',

      'hero.brand': 'SpellingBeast',
      'hero.title': '拼写练习',
      'hero.lead': '添加自己的单词，然后开始练习。',
      'footer.brand': 'SpellingBeast',
      'footer.tagline': '本地优先的静态应用',
      'language.button': '语言：中文',
      'language.ariaLabel': '切换语言到英文',
      'common.all': '全部',


      'mistakes.backButton': '← 返回',
      'mistakes.status': '当前有 {count} 个错题',
      'mistakes.title': '错题本',
      'mistakes.lead': '把还没拼对的单词集中练习。',
      'mistakes.practiceButton': '开始练习错题',
      'mistakes.fromList': '来自',
      'mistakes.emptyEyebrow': 'All Caught Up',
      'mistakes.emptyTitle': '做得很棒！',
      'mistakes.emptyText': '当前没有需要额外练习的单词。',
      'mistakes.emptyHint': '可以回到首页，继续练习别的单词表。',
      'mistakes.practiceSessionName': '错题练习',
      'mistakes.practiceSessionWordListName': '错题练习',

      'import.backButton': '← 返回',
      'import.title': '添加单词表',
      'import.headerLead': '可以直接输入单词，也可以上传 TXT / CSV 文件。',
      'import.nameLabel': '单词表名称',
      'import.nameHint': '这个名称会显示在首页和练习页。',
      'import.namePlaceholder': '例如：本周单词',
      'import.wordsLabel': '每行写一个单词',
      'import.wordsHint': '把要练习的单词粘贴到这里。',
      'import.wordsPlaceholder': 'apple\nbeautiful\ncalendar',
      'import.fileLabel': '或上传 TXT / CSV',
      'import.fileHint': 'TXT 按每行一个单词处理。CSV 使用第一列。',
      'import.cancelButton': '取消',
      'import.saveButton': '保存单词表',
      'import.readError': '无法读取这个文件。请再试一次。',
      'import.savedMessage': '单词表已保存。',
      'import.emptyWords': '请至少添加一个单词，并且每行只写一个单词。',
      'import.unsupportedFileType': '请选择 TXT 或 CSV 文件。',


      'setup.backButton': '← 返回',
      'setup.title': '开始练习',
      'setup.lead': '{name} · {count} 个单词',
      'setup.label': '选择本次练习数量',
      'setup.groupLabel': '选择练习数量',
      'setup.startButton': '开始练习',

      'practice.completeTitle': '练习完成',
      'practice.completeLead': '今天这组单词已经练完了。下面是这次练习的结果。',
      'practice.progressLabel': '进度',
      'practice.questionStatus': '第 {current} / {total} 题',
      'practice.prompt': '听一听，再拼写。',
      'practice.playButton': '播放单词',
      'practice.playHint': '请先点播放，再拼写。',
      'practice.answerLabel': '请输入拼写',
      'practice.answerPlaceholder': '在这里输入',
      'practice.submitButton': '提交',
      'practice.nextButton': '下一个',
      'practice.doneButton': '完成',
      'practice.summaryTitle': '本次练习结果',
      'practice.summaryLead': '下面是这次练习的结果。',
      'practice.correctCount': '正确数量：{count}',
      'practice.totalAttempted': '总答题数：{count}',
      'practice.needsMorePracticeCount': '需要继续练习的数量：{count}',
      'practice.missedTitle': '答错单词',
      'practice.noMissed': '这次没有答错单词。',
      'practice.missedWord': '单词：',
      'practice.correctSpelling': '正确拼写：',
      'practice.practiceMistakesButton': '练习错题',
      'practice.mistakesButton': '错题本',
      'practice.homeButton': '回到首页',
      'practice.correctFeedback': '太棒了！拼写正确。',
      'practice.tryAgain': '再看一次。',
      'practice.yourAnswer': '你的答案：',
      'practice.correctAnswer': '正确拼写：',
      'audio.failure': '无法播放这个单词，请再试一次。',
    },
  };

  function normalizeLocale(locale) {
    const value = String(locale || '').trim().toLowerCase();
    if (value.startsWith('zh')) {
      return 'zh';
    }
    return DEFAULT_LOCALE;
  }

  function getDictionary(locale) {
    return STRINGS[normalizeLocale(locale)] || STRINGS.en;
  }

  function formatMessage(template, values) {
    const params = values || {};
    return String(template).replace(/\{([^}]+)\}/g, (_, key) => {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        return String(params[key]);
      }
      return '';
    });
  }

  function translate(locale, key, values) {
    const dictionary = getDictionary(locale);
    const template = dictionary[key] || STRINGS.en[key] || key;
    return formatMessage(template, values);
  }

  function readStoredLocale(storage) {
    if (!storage || typeof storage.getItem !== 'function') {
      return DEFAULT_LOCALE;
    }

    try {
      return normalizeLocale(storage.getItem(LOCALE_STORAGE_KEY));
    } catch (_error) {
      return DEFAULT_LOCALE;
    }
  }

  function persistLocale(storage, locale) {
    if (!storage || typeof storage.setItem !== 'function') {
      return;
    }

    try {
      storage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
    } catch (_error) {
      // Ignore storage write failures so the app can keep running.
    }
  }

  function createLocalization(initialLocale = DEFAULT_LOCALE, options = {}) {
    const storage = options.storage;
    let locale = normalizeLocale(initialLocale);
    if (options.readFromStorage !== false) {
      locale = readStoredLocale(storage);
    }
    const listeners = new Set();

    function notify() {
      listeners.forEach((listener) => {
        try {
          listener(locale);
        } catch (_error) {
          // Ignore listener failures so localization state stays usable.
        }
      });
    }

    function setLocale(nextLocale) {
      const normalized = normalizeLocale(nextLocale);
      if (normalized !== locale) {
        locale = normalized;
        persistLocale(storage, locale);
        notify();
      }
      return locale;
    }

    function t(key, values) {
      return translate(locale, key, values);
    }

    return {
      getLocale() {
        return locale;
      },
      getState() {
        return { locale };
      },
      setLocale,
      t,
      translate: t,
      getStrings() {
        return { ...getDictionary(locale) };
      },
      onChange(listener) {
        if (typeof listener !== 'function') {
          return () => {};
        }
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  }

  return {
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    createLocalization,
    getDictionary,
    normalizeLocale,
    translate,
  };
});
