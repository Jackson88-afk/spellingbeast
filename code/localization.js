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
      'app.loading': 'Loading your word lists...',
      'app.loadError': 'We could not load your word lists.',
      'app.saveError': 'We could not save this word list. Try again.',
      'app.syncError': 'This change was not saved. Try again.',
      'app.saving': 'Saving...',
      'app.retry': 'Retry',
      'auth.loginTitle': 'Log In',
      'auth.signupTitle': 'Create Account',
      'auth.verifyTitle': 'Verify Email',
      'auth.forgotTitle': 'Forgot Password',
      'auth.resetTitle': 'Reset Password',
      'auth.emailLabel': 'Parent or guardian email',
      'auth.passwordLabel': 'Password',
      'auth.newPasswordLabel': 'New password',
      'auth.codeLabel': '6-digit code',
      'auth.loginButton': 'Log In',
      'auth.signupButton': 'Create Account',
      'auth.verifyButton': 'Verify Email',
      'auth.resetButton': 'Reset Password',
      'auth.sendReset': 'Send Reset Code',
      'auth.needAccount': 'Create an account',
      'auth.haveAccount': 'Already have an account? Log in',
      'auth.forgotPassword': 'Forgot password?',
      'auth.backLogin': 'Back to Log In',
      'auth.resend': 'Resend Code',
      'auth.logout': 'Log Out',
      'auth.verifyNote': 'Enter the code sent to your email. It expires in 15 minutes.',
      'auth.codeSent': 'A verification code was sent. Check your email.',
      'auth.resetCodeSent': 'If the email can be used, a reset code was sent.',
      'auth.passwordReset': 'Password reset. You can now log in.',
      'auth.emailVerified': 'Email verified. You can now log in.',
      'auth.invalidCredentials': 'Email or password is incorrect.',
      'auth.emailNotVerified': 'Verify your email before logging in.',
      'auth.invalidCode': 'The code is invalid or expired. Request a new code.',
      'auth.resetFailed': 'Password reset failed. Request a new code.',
      'auth.resetRequestFailed': 'Unable to send a reset code. Try again.',
      'auth.signupFailed': 'Unable to create the account. Check the details and try again.',
      'auth.tooManyAttempts': 'Too many attempts. Wait a moment and try again.',
      'home.title': 'Word Lists',
      'home.mistakesButton': 'Mistakes ({count})',
      'home.addListButton': 'Add Word List',
      'home.wordCount': '{count} words',
      'home.emptyState': 'No word lists yet. Add one to begin.',
      'home.savedMessage': 'Word list saved.',
      'list.edit': 'Edit',
      'list.delete': 'Delete',
      'list.editTitle': 'Edit Word List',
      'list.editLead': 'Update the name or words, then save your changes.',
      'list.saveChanges': 'Save Changes',
      'list.deleteTitle': 'Delete Word List?',
      'list.deleteConfirm': 'Delete “{name}” and its mistakes? This cannot be undone.',
      'list.cancel': 'Cancel',
      'list.confirmDelete': 'Delete',
      'list.deleteError': 'We could not delete this word list.',
      'list.deleted': 'Word list deleted.',
      'list.savedProgressReset': 'Word list saved. Adventure progress was reset because the words changed.',
      'adventure.action': 'Adventure',
      'adventure.title': 'Adventure',
      'adventure.back': '← Word Lists',
      'adventure.totalStars': '{count} total stars',
      'adventure.totalStarsLabel': '{count} total Adventure stars earned',
      'adventure.levelsLabel': 'Adventure levels',
      'adventure.level': 'Level {level}',
      'adventure.levelAria': 'Level {level}, unlocked, best {stars} of 3 stars',
      'adventure.lockedAria': 'Level {level}, locked. Pass the previous level to unlock it.',
      'adventure.unlocked': 'Ready to play',
      'adventure.locked': 'Locked',
      'adventure.lockHint': 'Pass the previous level to unlock this level.',
      'adventure.bestStars': 'Best result: {count} of 3 stars',
      'adventure.starsOutOfThree': '{count} / 3 stars',
      'adventure.levelComplete': 'Level {level} complete',
      'adventure.passTitle': 'You did it!',
      'adventure.passMessage': 'Nice work—your next adventure is getting closer.',
      'adventure.retryTitle': 'Keep going!',
      'adventure.retryMessage': 'You are learning. Try this level again when you are ready.',
      'adventure.attemptStars': 'This attempt',
      'adventure.attemptStarsLabel': 'This attempt earned {count} of 3 stars',
      'adventure.best': 'Best result',
      'adventure.score': '{correct} of {total} words correct',
      'adventure.saving': 'Saving your stars...',
      'adventure.saveError': 'Your stars were not saved yet.',
      'adventure.retrySave': 'Retry Save',
      'adventure.retryLevel': 'Retry Level',
      'adventure.levelMap': 'Level Map',
      'adventure.nextLevel': 'Next Level',

      'hero.brand': 'SpellingBeast',
      'hero.title': 'Word practice',
      'hero.lead': 'Build a list, listen once, spell it out.',
      'footer.brand': 'SpellingBeast',
      'footer.tagline': 'Local-first static app',
      'language.button': 'Language: EN',
      'language.ariaLabel': 'Switch language to Chinese',
      'common.all': 'All',


      'mistakes.backButton': '← Back',
      'mistakes.status': 'You have {count} mistakes',
      'mistakes.title': 'Mistakes',
      'mistakes.lead': 'Practice the words you missed.',
      'mistakes.practiceButton': 'Practice Mistakes',
      'mistakes.groupCount': '{count} active mistakes',
      'mistakes.practiceGroup': 'Practice This List',
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
      'practice.playing': 'Playing',
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
      'app.loading': '正在加载单词表...',
      'app.loadError': '暂时无法加载单词表。',
      'app.saveError': '单词表没有保存成功，请重试。',
      'app.syncError': '这次更改没有保存，请重试。',
      'app.saving': '正在保存...',
      'app.retry': '重试',
      'auth.loginTitle': '登录',
      'auth.signupTitle': '创建账号',
      'auth.verifyTitle': '验证邮箱',
      'auth.forgotTitle': '忘记密码',
      'auth.resetTitle': '重置密码',
      'auth.emailLabel': '家长或监护人邮箱',
      'auth.passwordLabel': '密码',
      'auth.newPasswordLabel': '新密码',
      'auth.codeLabel': '6 位验证码',
      'auth.loginButton': '登录',
      'auth.signupButton': '创建账号',
      'auth.verifyButton': '验证邮箱',
      'auth.resetButton': '重置密码',
      'auth.sendReset': '发送重置验证码',
      'auth.needAccount': '创建账号',
      'auth.haveAccount': '已有账号？登录',
      'auth.forgotPassword': '忘记密码？',
      'auth.backLogin': '返回登录',
      'auth.resend': '重新发送验证码',
      'auth.logout': '退出登录',
      'auth.verifyNote': '请输入邮件中的验证码，验证码将在 15 分钟后过期。',
      'auth.codeSent': '验证码已发送，请查看邮箱。',
      'auth.resetCodeSent': '如果该邮箱可以使用，重置验证码已发送。',
      'auth.passwordReset': '密码已重置，现在可以登录。',
      'auth.emailVerified': '邮箱已验证，现在可以登录。',
      'auth.invalidCredentials': '邮箱或密码不正确。',
      'auth.emailNotVerified': '请先验证邮箱，再登录。',
      'auth.invalidCode': '验证码无效或已过期，请重新获取。',
      'auth.resetFailed': '密码重置失败，请重新获取验证码。',
      'auth.resetRequestFailed': '无法发送重置验证码，请重试。',
      'auth.signupFailed': '无法创建账号，请检查信息后重试。',
      'auth.tooManyAttempts': '尝试次数过多，请稍后再试。',
      'home.title': '单词表',
      'home.mistakesButton': '错题本 ({count})',
      'home.addListButton': '添加单词表',
      'home.wordCount': '{count} 个单词',
      'home.emptyState': '还没有单词表，先添加一个。',
      'home.savedMessage': '单词表已保存。',
      'list.edit': '编辑',
      'list.delete': '删除',
      'list.editTitle': '编辑单词表',
      'list.editLead': '修改名称或单词，然后保存更改。',
      'list.saveChanges': '保存更改',
      'list.deleteTitle': '删除单词表？',
      'list.deleteConfirm': '确定删除“{name}”及其错题吗？此操作无法撤销。',
      'list.cancel': '取消',
      'list.confirmDelete': '删除',
      'list.deleteError': '暂时无法删除这个单词表。',
      'list.deleted': '单词表已删除。',
      'list.savedProgressReset': '单词表已保存。因为单词发生变化，冒险进度已重置。',
      'adventure.action': '冒险',
      'adventure.title': '冒险',
      'adventure.back': '← 单词表',
      'adventure.totalStars': '共 {count} 颗星',
      'adventure.totalStarsLabel': '冒险共获得 {count} 颗星',
      'adventure.levelsLabel': '冒险关卡',
      'adventure.level': '第 {level} 关',
      'adventure.levelAria': '第 {level} 关，已解锁，最佳成绩 3 星中的 {stars} 星',
      'adventure.lockedAria': '第 {level} 关，已锁定。通过上一关即可解锁。',
      'adventure.unlocked': '可以开始',
      'adventure.locked': '已锁定',
      'adventure.lockHint': '通过上一关即可解锁这一关。',
      'adventure.bestStars': '最佳成绩：3 星中的 {count} 星',
      'adventure.starsOutOfThree': '{count} / 3 星',
      'adventure.levelComplete': '第 {level} 关完成',
      'adventure.passTitle': '你做到了！',
      'adventure.passMessage': '做得好，下一段冒险离你更近了。',
      'adventure.retryTitle': '继续加油！',
      'adventure.retryMessage': '你正在进步，准备好后再试一次这一关。',
      'adventure.attemptStars': '本次成绩',
      'adventure.attemptStarsLabel': '本次获得 3 星中的 {count} 星',
      'adventure.best': '最佳成绩',
      'adventure.score': '答对 {correct} / {total} 个单词',
      'adventure.saving': '正在保存星星...',
      'adventure.saveError': '星星还没有保存成功。',
      'adventure.retrySave': '重新保存',
      'adventure.retryLevel': '再试本关',
      'adventure.levelMap': '关卡地图',
      'adventure.nextLevel': '下一关',

      'hero.brand': 'SpellingBeast',
      'hero.title': '单词练习',
      'hero.lead': '建立单词表，听一遍，然后慢慢拼。',
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
      'mistakes.groupCount': '{count} 个待练错题',
      'mistakes.practiceGroup': '练习这个单词表',
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
      'practice.playing': '播放中',
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
