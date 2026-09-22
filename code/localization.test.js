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
assert.strictEqual(localization.translate('en', 'list.deleteConfirm', { name: 'Animals' }), 'Delete “Animals” and its mistakes? This cannot be undone.');
assert.strictEqual(localization.translate('zh', 'list.saveChanges'), '保存更改');
assert.strictEqual(localization.translate('en', 'mistakes.groupCount', { count: 3 }), '3 active mistakes');
assert.strictEqual(localization.translate('en', 'adventure.nextLevel'), 'Next Level');
assert.strictEqual(localization.translate('zh', 'adventure.nextLevel'), '下一关');
assert.strictEqual(localization.translate('en', 'list.savedProgressReset').includes('progress was reset'), true);
assert.strictEqual(localization.translate('zh', 'list.savedProgressReset').includes('进度已重置'), true);
for (const key of Object.keys(localization.getDictionary('en')).filter((entry) => entry.startsWith('adventure.'))) {
  assert.notStrictEqual(localization.translate('zh', key), key, `missing Chinese translation for ${key}`);
}

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
