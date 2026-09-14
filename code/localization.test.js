const assert = require('assert');
const localization = require('./localization.js');

assert.strictEqual(localization.DEFAULT_LOCALE, 'en');
assert.deepStrictEqual(localization.SUPPORTED_LOCALES, ['en', 'zh']);
assert.strictEqual(localization.translate('en', 'home.title'), 'Word Lists');
assert.strictEqual(localization.translate('zh', 'home.title'), '单词表');
assert.strictEqual(localization.translate('en', 'home.wordCount', { count: 3 }), '3 words');
assert.strictEqual(localization.translate('en', 'auth.loginTitle'), 'Log In');
assert.strictEqual(localization.translate('zh', 'auth.verifyTitle'), '验证邮箱');
assert.strictEqual(localization.translate('zh', 'auth.resetFailed'), '密码重置失败，请重新获取验证码。');

const state = localization.createLocalization();
assert.strictEqual(state.getLocale(), 'en');
assert.deepStrictEqual(state.getState(), { locale: 'en' });
assert.strictEqual(state.translate('practice.playButton'), 'Play Word');
assert.strictEqual(state.translate('practice.playing'), 'Playing');
assert.strictEqual(state.setLocale('zh-CN'), 'zh');
assert.strictEqual(state.getLocale(), 'zh');
assert.strictEqual(state.t('practice.playButton'), '播放单词');
assert.deepStrictEqual(state.getStrings(), localization.getDictionary('zh'));

console.log('localization tests passed');
