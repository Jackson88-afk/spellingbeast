function initApp() {
  window.__appInitRan = true;
  const app = document.getElementById('app');
  const localPersistence = SpellingBeastPersistence.createPersistence();
  const apiClient = typeof SpellingBeastApi !== 'undefined'
    ? SpellingBeastApi.createApiClient()
    : null;
  const localOnly = typeof window.location !== 'undefined' && new URLSearchParams(window.location.search || '').get('local') === '1';
  const persistence = typeof SpellingBeastRemotePersistence !== 'undefined' && apiClient && !localOnly
    ? SpellingBeastRemotePersistence.createRemotePersistence({
      apiClient,
      localPersistence,
      storage: window.localStorage,
    })
    : localPersistence;
  const localization = typeof SpellingBeastLocalization !== 'undefined'
    ? SpellingBeastLocalization.createLocalization('en', { storage: window.localStorage })
    : {
      getLocale: () => 'en',
      translate: (key) => key,
      setLocale: () => 'en',
      onChange: () => () => {},
    };
  let view = 'home';
  let message = '';
  let selectedListId = null;
  let selectedSessionSize = 5;
  let practice = null;
  let practiceList = null;
  let practiceMode = 'normal';
  let audioMessage = '';
  let audioPlaying = false;
  let syncError = '';
  let retrySync = null;
  let pendingFocusSelector = '';
  let authUser = null;
  let authMode = 'login';
  let authEmail = '';
  let authMessage = '';
  let editingListId = null;
  let deletingListId = null;
  let deleteError = '';
  let deletingList = false;
  let adventureLevelNumber = null;
  let adventureAttemptStars = null;
  let adventureSavePending = null;
  let adventureSaving = false;

  function t(key, values) {
    return localization.translate(key, values);
  }

  function queueFocus(selector) {
    pendingFocusSelector = selector;
  }

  function focusPendingTarget() {
    if (!pendingFocusSelector) {
      return;
    }

    const canQuery = typeof document.querySelector === 'function';
    const target = canQuery ? document.querySelector(pendingFocusSelector) : null;
    pendingFocusSelector = '';
    if (target && typeof target.focus === 'function') {
      try {
        target.focus({ preventScroll: true });
      } catch (_error) {
        target.focus();
      }
    }
  }

  function focusPracticeAnswer() {
    const answerInput = typeof document.getElementById === 'function'
      ? document.getElementById('answer')
      : null;

    if (!answerInput || answerInput.disabled || typeof answerInput.focus !== 'function') {
      return;
    }

    try {
      answerInput.focus({ preventScroll: true });
    } catch (_error) {
      answerInput.focus();
    }
  }

  function queuePracticeAnswerFocus() {
    if (typeof window.setTimeout === 'function') {
      window.setTimeout(focusPracticeAnswer, 0);
      return;
    }

    focusPracticeAnswer();
  }

  function applyLocalization() {
    if (document.documentElement) {
      document.documentElement.lang = localization.getLocale();
    }
    const canQuery = typeof document.querySelector === 'function';
    const footerBrand = canQuery ? document.querySelector('.footer span') : null;
    const footerTagline = typeof document.getElementById === 'function'
      ? document.getElementById('footer-tagline')
      : null;
    const languageButton = typeof document.getElementById === 'function'
      ? document.getElementById('language-toggle')
      : null;
    const logoutButton = typeof document.getElementById === 'function'
      ? document.getElementById('logout-button')
      : null;
    if (footerBrand) footerBrand.textContent = t('footer.brand');
    if (footerTagline) footerTagline.textContent = t('footer.tagline');
    if (languageButton) {
      languageButton.textContent = t('language.button');
      languageButton.setAttribute('aria-label', t('language.ariaLabel'));
    }
    if (logoutButton) logoutButton.textContent = t('auth.logout');
  }

  const languageButton = typeof document.getElementById === 'function'
    ? document.getElementById('language-toggle')
    : null;
  if (languageButton) {
    languageButton.addEventListener('click', () => {
      localization.setLocale(localization.getLocale() === 'en' ? 'zh' : 'en');
    });
  }
  const logoutButton = typeof document.getElementById === 'function'
    ? document.getElementById('logout-button')
    : null;
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      try { if (apiClient) await apiClient.signOut(); } catch (_error) {}
      authUser = null;
      authMode = 'login';
      authMessage = '';
      logoutButton.hidden = true;
      renderAuth();
    });
  }
  localization.onChange(() => {
    applyLocalization();
    if (apiClient && !localOnly && !authUser) renderAuth();
    else render();
  });

  function setAuthenticatedHeader(authenticated) {
    if (logoutButton) {
      logoutButton.hidden = !authenticated;
      logoutButton.disabled = false;
    }
  }

  function authErrorKey(mode, error) {
    const code = String(error?.code || '').toUpperCase();
    const detail = `${code} ${error?.message || ''}`;
    if (mode === 'login' && /EMAIL.*VERIF|VERIF.*EMAIL/i.test(detail)) return 'auth.emailNotVerified';
    if (/TOO_MANY|RATE/i.test(detail)) return 'auth.tooManyAttempts';
    if (mode === 'verify') return 'auth.invalidCode';
    if (mode === 'forgot') return 'auth.resetRequestFailed';
    if (mode === 'reset') return 'auth.resetFailed';
    if (mode === 'signup') return 'auth.signupFailed';
    return 'auth.invalidCredentials';
  }

  function authFormContent() {
    const emailValue = escapeHtml(authEmail);
    if (authMode === 'verify') return `
      <h2>${t('auth.verifyTitle')}</h2>
      <p class="auth-note">${t('auth.verifyNote')}</p>
      <form class="auth-form" id="auth-form">
        <label>${t('auth.emailLabel')}<input name="email" type="email" autocomplete="email" value="${emailValue}" required /></label>
        <label>${t('auth.codeLabel')}<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required /></label>
        <button type="submit">${t('auth.verifyButton')}</button>
      </form>
      <div class="auth-links"><button type="button" class="link-button" id="resend-code">${t('auth.resend')}</button><button type="button" class="link-button" data-auth-mode="login">${t('auth.backLogin')}</button></div>`;
    if (authMode === 'forgot') return `
      <h2>${t('auth.forgotTitle')}</h2>
      <form class="auth-form" id="auth-form">
        <label>${t('auth.emailLabel')}<input name="email" type="email" autocomplete="email" value="${emailValue}" required /></label>
        <button type="submit">${t('auth.sendReset')}</button>
      </form>
      <div class="auth-links"><button type="button" class="link-button" data-auth-mode="login">${t('auth.backLogin')}</button></div>`;
    if (authMode === 'reset') return `
      <h2>${t('auth.resetTitle')}</h2>
      <form class="auth-form" id="auth-form">
        <label>${t('auth.emailLabel')}<input name="email" type="email" autocomplete="email" value="${emailValue}" required /></label>
        <label>${t('auth.codeLabel')}<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required /></label>
        <label>${t('auth.newPasswordLabel')}<input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required /></label>
        <button type="submit">${t('auth.resetButton')}</button>
      </form>
      <div class="auth-links"><button type="button" class="link-button" data-auth-mode="login">${t('auth.backLogin')}</button></div>`;
    const signup = authMode === 'signup';
    return `
      <h2>${t(signup ? 'auth.signupTitle' : 'auth.loginTitle')}</h2>
      <form class="auth-form" id="auth-form">
        <label>${t('auth.emailLabel')}<input name="email" type="email" autocomplete="email" value="${emailValue}" required /></label>
        <label>${t('auth.passwordLabel')}<input name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" required /></label>
        <button type="submit">${t(signup ? 'auth.signupButton' : 'auth.loginButton')}</button>
      </form>
      <div class="auth-links">
        <button type="button" class="link-button" data-auth-mode="${signup ? 'login' : 'signup'}">${t(signup ? 'auth.haveAccount' : 'auth.needAccount')}</button>
        ${signup ? '' : `<button type="button" class="link-button" data-auth-mode="forgot">${t('auth.forgotPassword')}</button>`}
      </div>`;
  }

  function renderAuth() {
    setAuthenticatedHeader(false);
    app.innerHTML = `<section class="card auth-screen">${authFormContent()}<p class="status auth-message" role="status"${authMessage ? '' : ' hidden'}>${escapeHtml(authMessage)}</p></section>`;
    document.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => {
      authMode = button.dataset.authMode;
      authMessage = '';
      renderAuth();
    }));
    const resend = document.getElementById('resend-code');
    if (resend) resend.addEventListener('click', async () => {
      resend.disabled = true;
      try {
        const email = document.querySelector('#auth-form [name="email"]').value.trim();
        await apiClient.resendVerification(email);
        authEmail = email;
        authMessage = t('auth.codeSent');
      } catch (error) {
        authMessage = t(authErrorKey('verify', error));
      }
      renderAuth();
    });
    const form = document.getElementById('auth-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      authMessage = '';
      const email = form.elements.email.value.trim();
      authEmail = email;
      try {
        if (authMode === 'signup') {
          await apiClient.signUp(email, form.elements.password.value);
          authMode = 'verify';
          authMessage = t('auth.codeSent');
        } else if (authMode === 'verify') {
          await apiClient.verifyEmail(email, form.elements.code.value.trim());
          const signedIn = await finishAuthentication(true);
          if (!signedIn) {
            authMode = 'login';
            authMessage = t('auth.emailVerified');
            renderAuth();
          }
          return;
        } else if (authMode === 'forgot') {
          await apiClient.requestPasswordReset(email);
          authMode = 'reset';
          authMessage = t('auth.resetCodeSent');
        } else if (authMode === 'reset') {
          await apiClient.resetPassword(email, form.elements.code.value.trim(), form.elements.password.value);
          authMode = 'login';
          authMessage = t('auth.passwordReset');
        } else {
          await apiClient.signIn(email, form.elements.password.value);
          await finishAuthentication();
          return;
        }
      } catch (error) {
        const key = authErrorKey(authMode, error);
        if (key === 'auth.emailNotVerified') authMode = 'verify';
        authMessage = t(key);
      }
      renderAuth();
    });
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  async function finishAuthentication(allowMissingSession = false) {
    renderLoading(null);
    const current = await apiClient.getSession();
    if (!current?.user) {
      if (allowMissingSession) return false;
      throw Object.assign(new Error('Authentication required.'), { code: 'unauthorized' });
    }
    authUser = current.user;
    setAuthenticatedHeader(true);
    try {
      await persistence.initialize();
      view = 'home';
      render();
    } catch (error) {
      renderLoading(error);
    }
    return true;
  }

  function getAudioFailureMessage(error) {
    if (typeof SpellingBeastAudio !== 'undefined' && typeof SpellingBeastAudio.describeSpeechSynthesisFailure === 'function') {
      return SpellingBeastAudio.describeSpeechSynthesisFailure(error, localization.getLocale());
    }

    return error && error.message ? error.message : t('audio.failure');
  }

  function render() {
    window.__renderRan = true;
    const lists = persistence.loadWordLists();
    const activeMistakes = persistence.loadActiveMistakes();
    const mistakeSummary = typeof SpellingBeastMistake.summarizeActiveMistakes === 'function'
      ? SpellingBeastMistake.summarizeActiveMistakes(activeMistakes)
      : {
        count: activeMistakes.length,
        words: activeMistakes,
        emptyState: t('mistakes.emptyText'),
      };

    if (view === 'import') {
      renderImport();
      return;
    }

    if (view === 'setup') {
      renderSetup(lists);
      return;
    }

    if (view === 'practice') {
      renderPractice();
      return;
    }

    if (view === 'adventure') {
      renderAdventureMap(lists);
      return;
    }

    if (view === 'mistakes') {
      renderMistakes(mistakeSummary);
      return;
    }

    renderHome(lists, mistakeSummary);
    focusPendingTarget();
  }

  function renderHome(lists, mistakeSummary) {
    const deletingListRecord = lists.find((list) => list.id === deletingListId);
    app.innerHTML = `
      <section class="card home-screen">
        <div class="section-heading home-heading">
          <h2>${t('home.title')}</h2>
          <div class="action-row home-actions">
            <button type="button" id="add-list">${t('home.addListButton')}</button>
            <button type="button" id="mistakes">${t('home.mistakesButton', { count: mistakeSummary.count })}</button>
          </div>
        </div>
        <div class="home-content">
          ${lists.length ? `<ul class="word-list-items home-list-items">${lists.map((list) => `
            <li class="word-list-item">
              <div class="word-list-item__copy">
                <strong>${escapeHtml(list.name)}</strong>
                <span>${t('home.wordCount', { count: list.words.length })}</span>
              </div>
              <div class="word-list-item__actions">
                <button type="button" class="practice-list" data-list-id="${escapeHtml(list.id)}">${t('setup.startButton')}</button>
                <button type="button" class="adventure-list secondary-button" data-list-id="${escapeHtml(list.id)}">${t('adventure.action')}</button>
                <button type="button" class="edit-list secondary-button" data-list-id="${escapeHtml(list.id)}">${t('list.edit')}</button>
                <button type="button" class="delete-list danger-button" data-list-id="${escapeHtml(list.id)}">${t('list.delete')}</button>
              </div>
            </li>`).join('')}</ul>` : `<p class="empty-state home-empty-state">${t('home.emptyState')}</p>`}
        </div>
        <p class="status home-message" id="home-message"${message ? '' : ' hidden'} role="status">${escapeHtml(message)}</p>
      </section>
      ${deletingListRecord ? `
        <dialog class="confirm-dialog" id="delete-dialog" open aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
          <h2 id="delete-dialog-title">${t('list.deleteTitle')}</h2>
          <p id="delete-dialog-description">${t('list.deleteConfirm', { name: escapeHtml(deletingListRecord.name) })}</p>
          ${deleteError ? `<p class="status status--error" role="alert">${t('list.deleteError')}</p>` : ''}
          <div class="action-row confirm-dialog__actions">
            <button type="button" class="link-button" id="cancel-delete"${deletingList ? ' disabled' : ''}>${t('list.cancel')}</button>
            <button type="button" class="danger-button" id="confirm-delete"${deletingList ? ' disabled' : ''}>${deleteError ? t('app.retry') : t('list.confirmDelete')}</button>
          </div>
        </dialog>` : ''}`;

    document.getElementById('add-list').addEventListener('click', () => {
      editingListId = null;
      queueFocus('#list-name');
      view = 'import';
      message = '';
      render();
    });
    document.getElementById('mistakes').addEventListener('click', () => openMistakes());
    document.querySelectorAll('.practice-list').forEach((button) => {
      button.addEventListener('click', () => openPracticeSetup(button.dataset.listId));
    });
    document.querySelectorAll('.adventure-list').forEach((button) => {
      button.addEventListener('click', () => openAdventure(button.dataset.listId));
    });
    document.querySelectorAll('.edit-list').forEach((button) => {
      button.addEventListener('click', () => {
        editingListId = button.dataset.listId;
        message = '';
        queueFocus('#list-name');
        view = 'import';
        render();
      });
    });
    document.querySelectorAll('.delete-list').forEach((button) => {
      button.addEventListener('click', () => {
        deletingListId = button.dataset.listId;
        deleteError = '';
        render();
        queueFocus('#cancel-delete');
        focusPendingTarget();
      });
    });
    const deleteDialog = document.getElementById('delete-dialog');
    if (deleteDialog && typeof deleteDialog.showModal === 'function') {
      deleteDialog.removeAttribute('open');
      deleteDialog.showModal();
      deleteDialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        if (!deletingList) {
          deletingListId = null;
          deleteError = '';
          render();
        }
      });
    }
    const cancelDelete = document.getElementById('cancel-delete');
    if (cancelDelete) cancelDelete.addEventListener('click', () => {
      deletingListId = null;
      deleteError = '';
      render();
    });
    const confirmDelete = document.getElementById('confirm-delete');
    if (confirmDelete) confirmDelete.addEventListener('click', async () => {
      deletingList = true;
      deleteError = '';
      render();
      try {
        await persistence.deleteWordList(deletingListId);
        deletingListId = null;
        message = t('list.deleted');
      } catch (_error) {
        deleteError = 'failed';
      } finally {
        deletingList = false;
        render();
      }
    });
    focusPendingTarget();
  }

  function renderMistakes(mistakeSummary) {
    const groups = SpellingBeastMistake.groupActiveMistakes(persistence.loadActiveMistakes());
    const hasMistakes = groups.length > 0;

    app.innerHTML = `
      <section class="card mistakes-screen">
        <div class="section-heading mistakes-screen__heading">
          <div class="mistakes-screen__heading-copy">
            <h2>${t('mistakes.title')}</h2>
            <p class="lead mistakes-screen__lead">${t('mistakes.lead')}</p>
          </div>
          <div class="mistakes-screen__controls">
            <button type="button" class="link-button" id="back-home">${t('mistakes.backButton')}</button>
            <button type="button" class="link-button" id="mistakes-home">${t('practice.homeButton')}</button>
          </div>
        </div>
        <p class="status mistakes-screen__status" role="status">${t('mistakes.status', { count: mistakeSummary.count })}</p>
        ${hasMistakes ? `
          <div class="mistake-groups">
            ${groups.map((group) => `
              <section class="mistake-group" aria-labelledby="mistake-group-${escapeHtml(group.wordListId)}">
                <div class="mistake-group__heading">
                  <div>
                    <h3 id="mistake-group-${escapeHtml(group.wordListId)}">${escapeHtml(group.wordListName)}</h3>
                    <p>${t('mistakes.groupCount', { count: group.count })}</p>
                  </div>
                  <button type="button" class="practice-mistakes-group" data-list-id="${escapeHtml(group.wordListId)}">${t('mistakes.practiceGroup')}</button>
                </div>
                <ul class="mistake-list">
                  ${group.mistakes.map((mistake) => `<li class="mistake-item"><strong class="mistake-item__value">${escapeHtml(mistake.word)}</strong></li>`).join('')}
                </ul>
              </section>`).join('')}
          </div>
          ${message ? `<p class="status" id="mistakes-message" role="status">${escapeHtml(message)}</p>` : ''}
        ` : `
          <div class="mistakes-empty" aria-live="polite">
            <h3>${t('mistakes.emptyTitle')}</h3>
            <p class="mistakes-empty__text">${t('mistakes.emptyText')}</p>
          </div>
        `}
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      message = '';
      queueFocus('#add-list');
      view = 'home';
      render();
    });
    document.getElementById('mistakes-home').addEventListener('click', () => {
      message = '';
      queueFocus('#add-list');
      view = 'home';
      render();
    });
    document.querySelectorAll('.practice-mistakes-group').forEach((button) => {
      button.addEventListener('click', () => startPracticeMistakes(button.dataset.listId));
    });
    focusPendingTarget();
  }

  function renderImport() {
    const editingList = editingListId
      ? persistence.loadWordLists().find((list) => list.id === editingListId)
      : null;
    if (editingListId && !editingList) {
      editingListId = null;
      view = 'home';
      render();
      return;
    }
    app.innerHTML = `
      <section class="card import-screen">
        <div class="import-header">
          <h2>${t(editingList ? 'list.editTitle' : 'import.title')}</h2>
          <p class="lead">${t(editingList ? 'list.editLead' : 'import.headerLead')}</p>
        </div>
        <form id="import-form" class="import-form">
          <div class="import-field">
            <label for="list-name">${t('import.nameLabel')}</label>
            <p class="import-field__hint" id="list-name-hint">${t('import.nameHint')}</p>
            <input id="list-name" name="name" required maxlength="80" value="${editingList ? escapeHtml(editingList.name) : ''}" placeholder="${t('import.namePlaceholder')}" aria-describedby="list-name-hint import-message" />
          </div>
          <div class="import-field">
            <label for="words">${t('import.wordsLabel')}</label>
            <p class="import-field__hint" id="words-hint">${t('import.wordsHint')}</p>
            <textarea id="words" name="words" rows="10" placeholder="${t('import.wordsPlaceholder')}" aria-describedby="words-hint import-message">${editingList ? escapeHtml(editingList.words.join('\n')) : ''}</textarea>
          </div>
          <div class="import-upload">
            <div class="import-upload__header">
              <label for="word-file">${t('import.fileLabel')}</label>
              <p class="import-field__hint" id="word-file-hint">${t('import.fileHint')}</p>
            </div>
            <input id="word-file" name="file" type="file" accept=".txt,.csv,text/plain,text/csv" aria-describedby="word-file-hint import-message" />
          </div>
          <p class="status import-message" id="import-message" role="alert" hidden></p>
          <div class="action-row action-row--spaced import-actions">
            <button type="button" class="link-button" id="back-home">${t('import.cancelButton')}</button>
            <button type="submit">${t(editingList ? 'list.saveChanges' : 'import.saveButton')}</button>
          </div>
        </form>
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      editingListId = null;
      queueFocus('#add-list');
      view = 'home';
      render();
    });
    document.getElementById('import-form').addEventListener('submit', saveImport);
    focusPendingTarget();
  }

  function renderAdventureMap(lists) {
    const list = lists.find((entry) => entry.id === selectedListId);
    if (!list) {
      view = 'home';
      render();
      return;
    }
    const levels = SpellingBeastAdventure.createLevels(list.words);
    const allProgress = typeof persistence.loadLevelProgress === 'function' ? persistence.loadLevelProgress() : [];
    const progress = SpellingBeastAdventure.progressForList(allProgress, list.id);
    const total = SpellingBeastAdventure.totalStars(levels, progress);
    app.innerHTML = `
      <section class="card adventure-map">
        <header class="adventure-header">
          <button type="button" class="link-button" id="adventure-home">${t('adventure.back')}</button>
          <div><p class="eyebrow">${t('adventure.title')}</p><h2>${escapeHtml(list.name)}</h2></div>
          <p class="adventure-total" aria-label="${t('adventure.totalStarsLabel', { count: total })}">${t('adventure.totalStars', { count: total })}</p>
        </header>
        <ol class="level-grid" aria-label="${t('adventure.levelsLabel')}">
          ${levels.map((level) => {
            const stars = Number(progress[level.number] || 0);
            const unlocked = SpellingBeastAdventure.isLevelUnlocked(level.number, progress);
            const label = unlocked
              ? t('adventure.levelAria', { level: level.number, stars })
              : t('adventure.lockedAria', { level: level.number });
            return `<li class="level-card ${unlocked ? 'level-card--unlocked' : 'level-card--locked'}">
              <button type="button" class="level-button" data-level="${level.number}" aria-label="${label}" ${unlocked ? '' : `disabled title="${t('adventure.lockHint')}"`}>
                <span class="level-card__number">${t('adventure.level', { level: level.number })}</span>
                ${renderStars(stars, 'adventure.bestStars')}
                <span class="level-card__status">${t(unlocked ? 'adventure.unlocked' : 'adventure.locked')}</span>
              </button>
              ${unlocked ? '' : `<p class="level-card__hint">${t('adventure.lockHint')}</p>`}
            </li>`;
          }).join('')}
        </ol>
      </section>`;
    document.getElementById('adventure-home').addEventListener('click', () => {
      view = 'home';
      queueFocus(`.adventure-list[data-list-id="${selectedListId}"]`);
      render();
    });
    document.querySelectorAll('.level-button:not(:disabled)').forEach((button) => {
      button.addEventListener('click', () => startAdventureLevel(Number(button.dataset.level)));
    });
    focusPendingTarget();
  }

  function renderStars(stars, labelKey) {
    const count = Number(stars || 0);
    return `<span class="star-result" role="img" aria-label="${t(labelKey, { count })}"><span aria-hidden="true">${'★'.repeat(count)}${'☆'.repeat(3 - count)}</span><span class="star-result__text">${t('adventure.starsOutOfThree', { count })}</span></span>`;
  }

  function renderSetup(lists) {
    const list = lists.find((entry) => entry.id === selectedListId);
    if (!list) {
      queueFocus('#add-list');
      view = 'home';
      render();
      return;
    }

    const sizes = [5, 10, 20, 'All'];

    app.innerHTML = `
      <section class="card practice-setup">
        <div class="practice-setup__topbar">
          <button type="button" class="link-button practice-setup__back" id="back-home">${t('setup.backButton')}</button>
        </div>
        <div class="practice-setup__summary">
          <h2>${escapeHtml(list.name)}</h2>
          <p class="lead practice-setup__lead">${t('setup.lead', { name: escapeHtml(list.name), count: list.words.length })}</p>
        </div>
        <div class="practice-setup__panel">
          <p class="setup-label">${t('setup.label')}</p>
          <div class="pill-row practice-setup__sizes" role="group" aria-label="${t('setup.groupLabel')}">
          ${sizes.map((size) => `
            <button type="button" class="pill ${selectedSessionSize === size ? 'pill--active' : ''}" data-size="${escapeHtml(String(size))}" aria-pressed="${selectedSessionSize === size ? 'true' : 'false'}">${size === 'All' ? t('common.all') : escapeHtml(String(size))}</button>
          `).join('')}
          </div>
        </div>
        <p class="status" id="setup-message"${message ? '' : ' hidden'} role="status">${escapeHtml(message)}</p>
        <button type="button" id="start-practice">${t('setup.startButton')}</button>
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      queueFocus('#add-list');
      view = 'home';
      render();
    });
    document.querySelectorAll('[data-size]').forEach((button) => {
      button.addEventListener('click', () => {
        const size = button.dataset.size === 'All' ? 'All' : Number(button.dataset.size);
        selectedSessionSize = size;
        queueFocus(`[data-size="${button.dataset.size}"]`);
        render();
      });
    });
    document.getElementById('start-practice').addEventListener('click', startPractice);
    focusPendingTarget();
  }

  function renderPractice() {
    const state = practice.getState();
    const progressPercent = state.totalWords > 0 ? Math.round((state.currentPosition / state.totalWords) * 100) : 0;

    if (state.phase === 'complete') {
      if (practiceMode === 'adventure') {
        renderAdventureCompletion(state.summary);
        return;
      }
      const summary = state.summary || {
        correctCount: 0,
        totalAttempted: 0,
        needsMorePracticeCount: 0,
        missedWords: [],
      };
      const showPracticeMistakesAction = typeof SpellingBeastPractice.shouldShowPracticeMistakesAction === 'function'
        ? SpellingBeastPractice.shouldShowPracticeMistakesAction(summary)
        : summary.needsMorePracticeCount > 0;
      const showMistakesScreenAction = practiceMode === 'mistakes' || summary.needsMorePracticeCount > 0;

      app.innerHTML = `
        <section class="card practice-screen practice-summary" data-phase="${state.phase}">
          <header class="practice-summary__hero">
            <div class="practice-summary__hero-copy">
              <h2>${t('practice.completeTitle')}</h2>
              <p class="lead">${t('practice.completeLead')}</p>
            </div>
          </header>
          <section class="practice-summary__results" aria-labelledby="practice-summary-results-title">
            <div class="practice-summary__section-heading">
              <h3 id="practice-summary-results-title">${t('practice.summaryTitle')}</h3>
            </div>
            <div class="summary-stats practice-summary__stats" role="list">
              <p role="listitem" class="summary-stats__item summary-stats__item--correct">${t('practice.correctCount', { count: summary.correctCount })}</p>
              <p role="listitem" class="summary-stats__item summary-stats__item--attempted">${t('practice.totalAttempted', { count: summary.totalAttempted })}</p>
              <p role="listitem" class="summary-stats__item summary-stats__item--review">${t('practice.needsMorePracticeCount', { count: summary.needsMorePracticeCount })}</p>
            </div>
          </section>
          <section class="summary-missed practice-summary__review" aria-labelledby="practice-summary-missed-title">
            <div class="practice-summary__section-heading">
              <h3 id="practice-summary-missed-title">${t('practice.missedTitle')}</h3>
            </div>
            ${summary.missedWords.length ? `
              <ol class="summary-missed__list">
                ${summary.missedWords.map((item, index) => `
                  <li class="summary-missed__item">
                    <span class="summary-missed__number">${index + 1}</span>
                    <div class="summary-missed__copy">
                      <p class="summary-missed__word">${escapeHtml(item.word)}</p>
                      <p class="summary-missed__spelling">${t('practice.correctSpelling')} <strong>${escapeHtml(item.correctSpelling)}</strong></p>
                    </div>
                  </li>`).join('')}
              </ol>
            ` : `<p class="empty-state summary-missed__empty">${t('practice.noMissed')}</p>`}
          </section>
          <div class="action-row action-row--spaced practice-summary__actions">
            ${showPracticeMistakesAction ? `<button type="button" id="practice-mistakes-summary" class="practice-summary__primary-action">${t('practice.practiceMistakesButton')}</button>` : ''}
            <div class="practice-summary__secondary-actions">
              ${showMistakesScreenAction ? `<button type="button" id="summary-mistakes">${t('practice.mistakesButton')}</button>` : ''}
              <button type="button" id="practice-home">${t('practice.homeButton')}</button>
            </div>
          </div>
        </section>`;
      if (showPracticeMistakesAction) {
        document.getElementById('practice-mistakes-summary').addEventListener('click', () => {
          queueFocus('#practice-mistakes');
          startPracticeMistakes(practiceMode === 'mistakes' ? practiceList.wordListId : practiceList.id);
        });
      }
      if (showMistakesScreenAction) {
        document.getElementById('summary-mistakes').addEventListener('click', () => {
          queueFocus('#back-home');
          returnToMistakesFromPractice();
        });
      }
      document.getElementById('practice-home').addEventListener('click', () => {
        practice = null;
        practiceList = null;
        practiceMode = 'normal';
        audioMessage = '';
        queueFocus('#add-list');
        view = 'home';
        render();
      });
      focusPendingTarget();
      return;
    }

    const currentWord = practiceList.words[state.currentIndex] || '';
    const answerValue = state.answer || '';
    const canEditAnswer = state.phase === 'question' || state.phase === 'answering';
    const canShowFeedback = state.phase === 'submitted' || state.phase === 'feedback';
    const feedback = state.feedback || null;
    const isCorrect = feedback ? feedback.isCorrect : false;
    const feedbackClass = feedback ? (isCorrect ? 'feedback feedback--correct' : 'feedback feedback--incorrect') : 'feedback';
    const nextLabel = state.currentIndex + 1 >= state.totalWords ? t('practice.doneButton') : t('practice.nextButton');

    app.innerHTML = `
      <section class="card practice-screen" data-phase="${state.phase}">
        <div class="practice-header">
          <button type="button" class="link-button practice-back" id="practice-back">${t('setup.backButton')}</button>
          <p class="status practice-status" aria-live="polite">${t('practice.progressLabel')}</p>
        </div>
        <div class="practice-progress" aria-label="${t('practice.progressLabel')}">
          <div class="practice-progress__label-row">
            <p class="practice-progress__label">${t('practice.progressLabel')}</p>
            <p class="practice-progress__value status" aria-live="polite">${t('practice.questionStatus', { current: state.currentPosition, total: state.totalWords })}</p>
          </div>
          <div class="practice-progress__track" aria-hidden="true">
            <div class="practice-progress__fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>
        <div class="practice-question">
          <h2>${escapeHtml(practiceMode === 'mistakes' ? `${t('mistakes.practiceSessionName')}: ${practiceList.wordListName}` : practiceMode === 'adventure' ? `${practiceList.wordListName} · ${t('adventure.level', { level: adventureLevelNumber })}` : practiceList.name)}</h2>
          <p class="practice-prompt">${t('practice.prompt')}</p>
        </div>
        <div class="practice-panel">
          <div class="practice-actions">
            <button type="button" id="play-word" data-playing="${audioPlaying ? 'true' : 'false'}" aria-busy="${audioPlaying ? 'true' : 'false'}" ${audioPlaying ? 'disabled' : ''}>
              <span class="play-icon" aria-hidden="true">
                <span class="play-icon__body"></span>
                <span class="play-icon__wave play-icon__wave--one"></span>
                <span class="play-icon__wave play-icon__wave--two"></span>
                <span class="play-icon__wave play-icon__wave--three"></span>
              </span>
              <span class="play-label">${t('practice.playButton')}</span>
              ${audioPlaying ? '<span class="play-status" aria-hidden="true"></span>' : ''}
            </button>
            <span class="assistive-text">${t('practice.playHint')}</span>
          </div>
          ${audioMessage ? `<p class="status status--error practice-audio-message" role="alert">${escapeHtml(audioMessage)}</p>` : ''}
          ${syncError ? `<div class="sync-error" role="alert"><span>${escapeHtml(syncError)}</span><button type="button" id="retry-sync">${t('app.retry')}</button></div>` : ''}
          <form id="practice-form" class="practice-form">
            <label for="answer">${t('practice.answerLabel')}</label>
            <input id="answer" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${t('practice.answerPlaceholder')}" value="${escapeHtml(answerValue)}" ${canEditAnswer ? '' : 'disabled'} />
            <div class="action-row action-row--spaced practice-submit-row">
              <button type="submit" id="submit-answer"${canEditAnswer ? '' : ' hidden'}>${t('practice.submitButton')}</button>
              <button type="button" id="next-word"${canShowFeedback ? '' : ' hidden'}${syncError ? ' disabled' : ''}>${nextLabel}</button>
            </div>
          </form>
          <div class="${feedbackClass} practice-feedback" id="feedback"${feedback ? '' : ' hidden'} aria-live="polite">
            ${renderFeedback(feedback)}
          </div>
        </div>
      </section>`;

    document.getElementById('practice-back').addEventListener('click', () => {
      const wasMistakePractice = practiceMode === 'mistakes';
      const wasAdventure = practiceMode === 'adventure';
      practice = null;
      practiceList = null;
      practiceMode = 'normal';
      audioMessage = '';
      queueFocus(wasMistakePractice ? '#back-home' : wasAdventure ? `[data-level="${adventureLevelNumber}"]` : '#add-list');
      view = wasMistakePractice ? 'mistakes' : wasAdventure ? 'adventure' : 'home';
      render();
    });

    const answerInput = document.getElementById('answer');
    answerInput.addEventListener('input', (event) => {
      practice.setAnswer(event.target.value);
      audioMessage = '';
    });
    queuePracticeAnswerFocus();

    document.getElementById('practice-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitted = practice.submitAnswer(answerInput.value);
      practice.showFeedback();
      let persistenceAction = null;
      if (practiceMode === 'normal' && !submitted.feedback.isCorrect) {
        const mistake = SpellingBeastMistake.createMistake({
          wordListId: practiceList.id,
          wordListName: practiceList.name,
          word: currentWord,
        });
        persistenceAction = () => persistence.saveActiveMistake(mistake);
      }
      if (practiceMode === 'mistakes') {
        const activeMistake = practiceList.mistakes && practiceList.mistakes[state.currentIndex];
        if (activeMistake) {
          persistenceAction = submitted.feedback.isCorrect
            ? () => persistence.deleteActiveMistake(activeMistake)
            : null;
        }
      }
      syncError = '';
      retrySync = null;
      if (persistenceAction) {
        try {
          await persistenceAction();
        } catch (_error) {
          syncError = t('app.syncError');
          retrySync = persistenceAction;
        }
      }
      render();
    });

    document.getElementById('next-word').addEventListener('click', async () => {
      const nextState = practice.next();
      audioMessage = '';
      if (nextState.phase === 'complete') {
        if (practiceMode === 'adventure') {
          adventureAttemptStars = SpellingBeastAdventure.scoreStars(nextState.summary.correctCount, nextState.summary.totalAttempted);
          adventureSavePending = { wordListId: selectedListId, levelNumber: adventureLevelNumber, bestStars: adventureAttemptStars };
          await saveAdventureResult();
        } else if (SpellingBeastPractice.shouldShowPracticeMistakesAction(nextState.summary)) {
          queueFocus('#practice-mistakes-summary');
        } else if (practiceMode === 'mistakes' || nextState.summary.needsMorePracticeCount > 0) {
          queueFocus('#summary-mistakes');
        } else {
          queueFocus('#practice-home');
        }
      }
      render();
    });

    const retrySyncButton = document.getElementById('retry-sync');
    if (retrySyncButton && retrySync) {
      retrySyncButton.addEventListener('click', async () => {
        retrySyncButton.disabled = true;
        try {
          await retrySync();
          syncError = '';
          retrySync = null;
        } catch (_error) {
          syncError = t('app.syncError');
        }
        render();
      });
    }

    document.getElementById('play-word').addEventListener('click', async () => {
      if (audioPlaying) {
        return;
      }
      audioMessage = '';
      audioPlaying = true;
      render();
      try {
        await SpellingBeastAudio.playWord(currentWord);
      } catch (error) {
        audioMessage = getAudioFailureMessage(error);
      } finally {
        audioPlaying = false;
        render();
      }
    });
    focusPendingTarget();
  }

  function renderAdventureCompletion(summary) {
    const result = summary || { correctCount: 0, totalAttempted: 0 };
    const allProgress = typeof persistence.loadLevelProgress === 'function' ? persistence.loadLevelProgress() : [];
    const progress = SpellingBeastAdventure.progressForList(allProgress, selectedListId);
    const bestStars = Number(progress[adventureLevelNumber] || 0);
    const levels = SpellingBeastAdventure.createLevels(persistence.loadWordLists().find((entry) => entry.id === selectedListId)?.words || []);
    const nextLevel = adventureLevelNumber + 1;
    const canContinue = nextLevel <= levels.length && SpellingBeastAdventure.isLevelUnlocked(nextLevel, progress);
    const passed = Number(adventureAttemptStars || 0) > 0;
    app.innerHTML = `
      <section class="card adventure-complete" data-save-state="${adventureSaving ? 'saving' : adventureSavePending ? 'error' : 'saved'}">
        <header class="adventure-complete__hero">
          <p class="eyebrow">${t('adventure.levelComplete', { level: adventureLevelNumber })}</p>
          <h2>${t(passed ? 'adventure.passTitle' : 'adventure.retryTitle')}</h2>
          <p class="lead">${t(passed ? 'adventure.passMessage' : 'adventure.retryMessage')}</p>
        </header>
        <div class="adventure-results ${passed ? 'star-reveal' : ''}" aria-live="polite">
          <div><h3>${t('adventure.attemptStars')}</h3>${renderStars(adventureAttemptStars, 'adventure.attemptStarsLabel')}</div>
          <div><h3>${t('adventure.best')}</h3>${renderStars(bestStars, 'adventure.bestStars')}</div>
          <p class="adventure-score">${t('adventure.score', { correct: result.correctCount, total: result.totalAttempted })}</p>
        </div>
        ${adventureSaving ? `<p class="status" role="status">${t('adventure.saving')}</p>` : ''}
        ${adventureSavePending && !adventureSaving ? `<div class="sync-error" role="alert"><span>${t('adventure.saveError')}</span><button type="button" id="retry-adventure-save">${t('adventure.retrySave')}</button></div>` : ''}
        <div class="action-row adventure-complete__actions">
          <button type="button" id="retry-level">${t('adventure.retryLevel')}</button>
          <button type="button" id="level-map" class="secondary-button">${t('adventure.levelMap')}</button>
          ${canContinue ? `<button type="button" id="next-level">${t('adventure.nextLevel')}</button>` : ''}
        </div>
      </section>`;
    const retrySave = document.getElementById('retry-adventure-save');
    if (retrySave) retrySave.addEventListener('click', async () => {
      await saveAdventureResult();
      render();
    });
    document.getElementById('retry-level').addEventListener('click', () => startAdventureLevel(adventureLevelNumber));
    document.getElementById('level-map').addEventListener('click', () => {
      practice = null;
      practiceList = null;
      practiceMode = 'normal';
      view = 'adventure';
      queueFocus(`[data-level="${adventureLevelNumber}"]`);
      render();
    });
    const next = document.getElementById('next-level');
    if (next) next.addEventListener('click', () => startAdventureLevel(nextLevel));
    focusPendingTarget();
  }

  async function saveAdventureResult() {
    if (!adventureSavePending || adventureSaving) return;
    adventureSaving = true;
    render();
    try {
      await persistence.saveLevelProgress(adventureSavePending);
      adventureSavePending = null;
    } catch (_error) {
      // Keep the exact pending write for Retry Save; answers are not submitted again.
    } finally {
      adventureSaving = false;
    }
  }

  function renderFeedback(feedback) {
    if (!feedback) {
      return '';
    }

    if (feedback.isCorrect) {
      return `<p class="practice-feedback__title">${t('practice.correctFeedback')}</p>`;
    }

    return `
      <p class="practice-feedback__title">${t('practice.tryAgain')}</p>
      <dl class="feedback__details">
        <div class="feedback__detail">
          <dt class="feedback__label">${t('practice.yourAnswer')}</dt>
          <dd class="feedback__value">${escapeHtml(feedback.submittedAnswer)}</dd>
        </div>
        <div class="feedback__detail">
          <dt class="feedback__label">${t('practice.correctAnswer')}</dt>
          <dd class="feedback__value">${escapeHtml(feedback.correctAnswer)}</dd>
        </div>
      </dl>`;
  }

  function showHomeMessage(text) {
    message = text;
    queueFocus('#add-list');
    view = 'home';
    render();
  }

  function openMistakes() {
    message = '';
    queueFocus('#back-home');
    view = 'mistakes';
    render();
  }

  function openAdventure(listId) {
    selectedListId = listId;
    adventureLevelNumber = null;
    adventureAttemptStars = null;
    adventureSavePending = null;
    message = '';
    view = 'adventure';
    queueFocus('[data-level="1"]');
    render();
  }

  function startAdventureLevel(levelNumber) {
    const list = persistence.loadWordLists().find((entry) => entry.id === selectedListId);
    if (!list) return openAdventure(selectedListId);
    const progress = SpellingBeastAdventure.progressForList(
      typeof persistence.loadLevelProgress === 'function' ? persistence.loadLevelProgress() : [],
      list.id,
    );
    if (!SpellingBeastAdventure.isLevelUnlocked(levelNumber, progress)) return;
    const session = SpellingBeastAdventure.createLevelSession(list, levelNumber);
    practice = SpellingBeastPractice.createPracticeStateMachine(session);
    practice.start();
    practiceList = session;
    practiceMode = 'adventure';
    adventureLevelNumber = levelNumber;
    adventureAttemptStars = null;
    adventureSavePending = null;
    adventureSaving = false;
    audioMessage = '';
    audioPlaying = false;
    syncError = '';
    retrySync = null;
    view = 'practice';
    render();
  }

  function openPracticeSetup(listId) {
    selectedListId = listId;
    selectedSessionSize = 5;
    message = '';
    queueFocus('[data-size="5"]');
    view = 'setup';
    render();
  }

  function startPractice() {
    const lists = persistence.loadWordLists();
    const list = lists.find((entry) => entry.id === selectedListId);
    if (!list) {
      queueFocus('#add-list');
      view = 'home';
      render();
      return;
    }

    const session = SpellingBeastSession.createPracticeSession(list, selectedSessionSize);
    practice = SpellingBeastPractice.createPracticeStateMachine(session);
    practice.start();
    practiceList = list;
    practiceMode = 'normal';
    audioMessage = '';
    audioPlaying = false;
    syncError = '';
    retrySync = null;
    view = 'practice';
    render();
  }

  function startPracticeMistakes(wordListId) {
    const activeMistakes = persistence.loadActiveMistakes();
    const selectedMistakes = activeMistakes.filter((mistake) => mistake.wordListId === wordListId);
    if (!selectedMistakes.length) {
      view = 'mistakes';
      practice = null;
      practiceList = null;
      practiceMode = 'mistakes';
      audioMessage = '';
      audioPlaying = false;
      queueFocus('#back-home');
      render();
      return;
    }

    const session = SpellingBeastMistake.createPracticeMistakesSession(activeMistakes, wordListId);
    practice = SpellingBeastPractice.createPracticeStateMachine(session);
    practice.start();
    practiceList = session;
    practiceMode = 'mistakes';
    audioMessage = '';
    audioPlaying = false;
    syncError = '';
    retrySync = null;
    view = 'practice';
    render();
  }

  function returnToMistakesFromPractice() {
    practice = null;
    practiceList = null;
    practiceMode = 'normal';
    audioMessage = '';
    audioPlaying = false;
    queueFocus('#back-home');
    openMistakes();
  }

  function saveImport(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const messageNode = document.getElementById('import-message');
    const file = form.elements.file.files[0];
    messageNode.hidden = true;
    messageNode.textContent = '';
    const saveWords = async (result) => {
      if (!result.valid) {
        const errorKey = result.error === 'Add at least one word, with one word on each line.'
          ? 'import.emptyWords'
          : 'import.unsupportedFileType';
        messageNode.hidden = false;
        messageNode.textContent = t(errorKey);
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = t('app.saving');
      try {
        const existing = editingListId
          ? persistence.loadWordLists().find((list) => list.id === editingListId)
          : null;
        const normalizeSequence = (words) => words.map((word) => String(word).trim().toLocaleLowerCase('en-US'));
        const oldSequence = normalizeSequence(existing?.words || []);
        const newSequence = normalizeSequence(result.words);
        const progressWasReset = Boolean(existing && (oldSequence.length !== newSequence.length || oldSequence.some((word, index) => word !== newSequence[index])));
        await persistence.saveWordList(SpellingBeastWordList.createWordList({
          id: existing?.id || SpellingBeastWordList.createId(),
          name: form.elements.name.value.trim(),
          words: result.words,
          createdAt: existing?.createdAt,
          updatedAt: new Date().toISOString(),
        }));
        editingListId = null;
        queueFocus('#add-list');
        view = 'home';
        message = t(progressWasReset ? 'list.savedProgressReset' : 'home.savedMessage');
        render();
      } catch (_error) {
        submitButton.disabled = false;
        submitButton.textContent = t('app.retry');
        messageNode.hidden = false;
        messageNode.textContent = t('app.saveError');
      }
    };

    if (!file) {
      saveWords(SpellingBeastImport.parseTextareaWords(form.elements.words.value));
      return;
    }

    const type = file.name.toLowerCase().endsWith('.txt') ? 'txt' : file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'unsupported';
    if (type === 'unsupported') {
      saveWords(SpellingBeastImport.parseImportInput(type, ''));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      messageNode.hidden = false;
      messageNode.textContent = t('import.readError');
    };
    reader.onload = () => saveWords(SpellingBeastImport.parseImportInput(type, reader.result));
    reader.readAsText(file);
  }

  function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  function renderLoading(error) {
    app.innerHTML = `
      <section class="card loading-screen" aria-live="polite">
        <p class="loading-screen__message">${t(error ? 'app.loadError' : 'app.loading')}</p>
        ${error ? `<button type="button" id="retry-load">${t('app.retry')}</button>` : '<span class="loading-line" aria-hidden="true"></span>'}
      </section>`;
    if (error) {
      document.getElementById('retry-load').addEventListener('click', initializeRemote);
    }
  }

  async function initializeRemote() {
    renderLoading(null);
    try {
      if (apiClient) {
        await apiClient.initialize();
        const current = await apiClient.getSession();
        if (!current?.user) {
          authUser = null;
          renderAuth();
          return;
        }
        authUser = current.user;
        setAuthenticatedHeader(true);
      }
      await persistence.initialize();
      render();
    } catch (_error) {
      renderLoading(_error);
    }
  }

  applyLocalization();
  if (typeof persistence.initialize === 'function') {
    initializeRemote();
  } else {
    render();
  }
}

initApp();
