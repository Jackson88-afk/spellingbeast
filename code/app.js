function initApp() {
  window.__appInitRan = true;
  const app = document.getElementById('app');
  const persistence = SpellingBeastPersistence.createPersistence();
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
  let pendingFocusSelector = '';

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
    const eyebrow = canQuery ? document.querySelector('.hero .eyebrow') : null;
    const heroTitle = canQuery ? document.querySelector('.hero h1') : null;
    const heroLead = canQuery ? document.querySelector('.hero .lead') : null;
    const footerBrand = canQuery ? document.querySelector('.footer span') : null;
    const footerTagline = typeof document.getElementById === 'function'
      ? document.getElementById('footer-tagline')
      : null;
    const languageButton = typeof document.getElementById === 'function'
      ? document.getElementById('language-toggle')
      : null;
    if (eyebrow) eyebrow.textContent = t('hero.brand');
    if (heroTitle) heroTitle.textContent = t('hero.title');
    if (heroLead) heroLead.textContent = t('hero.lead');
    if (footerBrand) footerBrand.textContent = t('footer.brand');
    if (footerTagline) footerTagline.textContent = t('footer.tagline');
    if (languageButton) {
      languageButton.textContent = t('language.button');
      languageButton.setAttribute('aria-label', t('language.ariaLabel'));
    }
  }

  const languageButton = typeof document.getElementById === 'function'
    ? document.getElementById('language-toggle')
    : null;
  if (languageButton) {
    languageButton.addEventListener('click', () => {
      localization.setLocale(localization.getLocale() === 'en' ? 'zh' : 'en');
    });
  }
  localization.onChange(() => {
    applyLocalization();
    render();
  });

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

    if (view === 'mistakes') {
      renderMistakes(mistakeSummary);
      return;
    }

    renderHome(lists, mistakeSummary);
    focusPendingTarget();
  }

  function renderHome(lists, mistakeSummary) {
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
              <button type="button" class="practice-list" data-list-id="${escapeHtml(list.id)}">${t('setup.startButton')}</button>
            </li>`).join('')}</ul>` : `<p class="empty-state home-empty-state">${t('home.emptyState')}</p>`}
        </div>
        <p class="status home-message" id="home-message"${message ? '' : ' hidden'} role="status">${escapeHtml(message)}</p>
      </section>`;

    document.getElementById('add-list').addEventListener('click', () => {
      queueFocus('#list-name');
      view = 'import';
      message = '';
      render();
    });
    document.getElementById('mistakes').addEventListener('click', () => openMistakes());
    document.querySelectorAll('.practice-list').forEach((button) => {
      button.addEventListener('click', () => openPracticeSetup(button.dataset.listId));
    });
    focusPendingTarget();
  }

  function renderMistakes(mistakeSummary) {
    const hasMistakes = mistakeSummary.count > 0;

    app.innerHTML = `
      <section class="card mistakes-screen">
        <div class="section-heading mistakes-screen__heading">
          <div class="mistakes-screen__heading-copy">
            <p class="eyebrow mistakes-screen__eyebrow">${t('mistakes.title')}</p>
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
          <ul class="mistake-list">
            ${mistakeSummary.words.map((mistake) => `
              <li class="mistake-item">
                <div class="mistake-item__copy">
                  <div class="mistake-item__row">
                    <span class="mistake-item__label">${t('practice.missedWord')}</span>
                    <strong class="mistake-item__value">${escapeHtml(mistake.word)}</strong>
                  </div>
                  <div class="mistake-item__row">
                    <span class="mistake-item__label">${t('practice.correctSpelling')}</span>
                    <strong class="mistake-item__value">${escapeHtml(mistake.word)}</strong>
                  </div>
                </div>
                ${mistake.wordListName ? `<span class="mistake-item__meta">${t('mistakes.fromList')} ${escapeHtml(mistake.wordListName)}</span>` : ''}
              </li>`).join('')}
          </ul>
          <div class="action-row action-row--spaced mistakes-screen__actions">
            <button type="button" id="practice-mistakes">${t('mistakes.practiceButton')}</button>
          </div>
          ${message ? `<p class="status" id="mistakes-message" role="status">${escapeHtml(message)}</p>` : ''}
        ` : `
          <div class="mistakes-empty" aria-live="polite">
            <p class="mistakes-empty__eyebrow">${t('mistakes.emptyEyebrow')}</p>
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

    if (hasMistakes) {
      document.getElementById('practice-mistakes').addEventListener('click', () => {
        startPracticeMistakes();
      });
    }
    focusPendingTarget();
  }

  function renderImport() {
    app.innerHTML = `
      <section class="card import-screen">
        <div class="import-header">
          <p class="eyebrow">${t('hero.brand')}</p>
          <h2>${t('import.title')}</h2>
          <p class="lead">${t('import.headerLead')}</p>
        </div>
        <form id="import-form" class="import-form">
          <div class="import-field">
            <label for="list-name">${t('import.nameLabel')}</label>
            <p class="import-field__hint" id="list-name-hint">${t('import.nameHint')}</p>
            <input id="list-name" name="name" required maxlength="80" placeholder="${t('import.namePlaceholder')}" aria-describedby="list-name-hint import-message" />
          </div>
          <div class="import-field">
            <label for="words">${t('import.wordsLabel')}</label>
            <p class="import-field__hint" id="words-hint">${t('import.wordsHint')}</p>
            <textarea id="words" name="words" rows="10" placeholder="${t('import.wordsPlaceholder')}" aria-describedby="words-hint import-message"></textarea>
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
            <button type="submit">${t('import.saveButton')}</button>
          </div>
        </form>
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      queueFocus('#add-list');
      view = 'home';
      render();
    });
    document.getElementById('import-form').addEventListener('submit', saveImport);
    focusPendingTarget();
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
          <p class="status practice-setup__status" role="status">${t('setup.title')}</p>
        </div>
        <div class="practice-setup__summary">
          <p class="eyebrow practice-setup__eyebrow">${t('setup.title')}</p>
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
            <p class="eyebrow practice-summary__eyebrow">${t('practice.summaryTitle')}</p>
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
          startPracticeMistakes();
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
          <h2>${escapeHtml(practiceMode === 'mistakes' ? t('mistakes.practiceSessionName') : practiceList.name)}</h2>
          <p class="practice-prompt">${t('practice.prompt')}</p>
        </div>
        <div class="practice-panel">
          <div class="practice-actions">
            <button type="button" id="play-word">${t('practice.playButton')}</button>
            <span class="assistive-text">${t('practice.playHint')}</span>
          </div>
          ${audioMessage ? `<p class="status status--error practice-audio-message" role="alert">${escapeHtml(audioMessage)}</p>` : ''}
          <form id="practice-form" class="practice-form">
            <label for="answer">${t('practice.answerLabel')}</label>
            <input id="answer" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${t('practice.answerPlaceholder')}" value="${escapeHtml(answerValue)}" ${canEditAnswer ? '' : 'disabled'} />
            <div class="action-row action-row--spaced practice-submit-row">
              <button type="submit" id="submit-answer"${canEditAnswer ? '' : ' hidden'}>${t('practice.submitButton')}</button>
              <button type="button" id="next-word"${canShowFeedback ? '' : ' hidden'}>${nextLabel}</button>
            </div>
          </form>
          <div class="${feedbackClass} practice-feedback" id="feedback"${feedback ? '' : ' hidden'} aria-live="polite">
            ${renderFeedback(feedback)}
          </div>
        </div>
      </section>`;

    document.getElementById('practice-back').addEventListener('click', () => {
      practice = null;
      practiceList = null;
      practiceMode = 'normal';
      audioMessage = '';
      queueFocus('#add-list');
      view = 'home';
      render();
    });

    const answerInput = document.getElementById('answer');
    answerInput.addEventListener('input', (event) => {
      practice.setAnswer(event.target.value);
      audioMessage = '';
    });
    queuePracticeAnswerFocus();

    document.getElementById('practice-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const submitted = practice.submitAnswer(answerInput.value);
      practice.showFeedback();
      if (practiceMode === 'normal' && !submitted.feedback.isCorrect) {
        persistence.saveActiveMistake(SpellingBeastMistake.createMistake({
          wordListId: practiceList.id,
          wordListName: practiceList.name,
          word: currentWord,
        }));
      }
      if (practiceMode === 'mistakes') {
        const activeMistake = practiceList.mistakes && practiceList.mistakes[state.currentIndex];
        SpellingBeastMistake.applyPracticeMistakeSubmission({
          practiceMode,
          isCorrect: submitted.feedback.isCorrect,
          activeMistake,
          persistence,
        });
      }
      render();
    });

    document.getElementById('next-word').addEventListener('click', () => {
      const nextState = practice.next();
      audioMessage = '';
      if (nextState.phase === 'complete') {
        if (SpellingBeastPractice.shouldShowPracticeMistakesAction(nextState.summary)) {
          queueFocus('#practice-mistakes-summary');
        } else if (practiceMode === 'mistakes' || nextState.summary.needsMorePracticeCount > 0) {
          queueFocus('#summary-mistakes');
        } else {
          queueFocus('#practice-home');
        }
      }
      render();
    });

    document.getElementById('play-word').addEventListener('click', async () => {
      audioMessage = '';
      render();
      try {
        await SpellingBeastAudio.playWord(currentWord);
      } catch (error) {
        audioMessage = getAudioFailureMessage(error);
        render();
      }
    });
    focusPendingTarget();
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
    view = 'practice';
    render();
  }

  function startPracticeMistakes() {
    const activeMistakes = persistence.loadActiveMistakes();
    if (!activeMistakes.length) {
      view = 'mistakes';
      practice = null;
      practiceList = null;
      practiceMode = 'mistakes';
      audioMessage = '';
      queueFocus('#back-home');
      render();
      return;
    }

    const session = SpellingBeastMistake.createPracticeMistakesSession(activeMistakes);
    practice = SpellingBeastPractice.createPracticeStateMachine(session);
    practice.start();
    practiceList = session;
    practiceMode = 'mistakes';
    audioMessage = '';
    view = 'practice';
    render();
  }

  function returnToMistakesFromPractice() {
    practice = null;
    practiceList = null;
    practiceMode = 'normal';
    audioMessage = '';
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
    const saveWords = (result) => {
      if (!result.valid) {
        const errorKey = result.error === 'Add at least one word, with one word on each line.'
          ? 'import.emptyWords'
          : 'import.unsupportedFileType';
        messageNode.hidden = false;
        messageNode.textContent = t(errorKey);
        return;
      }
      queueFocus('#add-list');
      persistence.saveWordList(SpellingBeastWordList.createWordList({
        id: SpellingBeastWordList.createId(),
        name: form.elements.name.value.trim(),
        words: result.words,
      }));
      view = 'home';
      message = t('home.savedMessage');
      render();
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

  applyLocalization();
  render();
}

initApp();
