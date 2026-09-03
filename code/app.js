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

  function t(key, values) {
    return localization.translate(key, values);
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
  }

  function renderHome(lists, mistakeSummary) {
    app.innerHTML = `
      <section class="card">
        <div class="section-heading">
          <h2>${t('home.title')}</h2>
          <div class="action-row">
            <button type="button" id="mistakes">${t('home.mistakesButton', { count: mistakeSummary.count })}</button>
            <button type="button" id="add-list">${t('home.addListButton')}</button>
          </div>
        </div>
        ${lists.length ? `<ul class="word-list-items">${lists.map((list) => `
          <li class="word-list-item">
            <div>
              <strong>${escapeHtml(list.name)}</strong><br />
              <span>${t('home.wordCount', { count: list.words.length })}</span>
            </div>
            <button type="button" class="practice-list" data-list-id="${escapeHtml(list.id)}">${t('setup.startButton')}</button>
          </li>`).join('')}</ul>` : `<p class="empty-state">${t('home.emptyState')}</p>`}
        <p class="status" id="home-message"${message ? '' : ' hidden'} role="status">${escapeHtml(message)}</p>
      </section>`;

    document.getElementById('add-list').addEventListener('click', () => {
      view = 'import';
      message = '';
      render();
    });
    document.getElementById('mistakes').addEventListener('click', () => openMistakes());
    document.querySelectorAll('.practice-list').forEach((button) => {
      button.addEventListener('click', () => openPracticeSetup(button.dataset.listId));
    });
  }

  function renderMistakes(mistakeSummary) {
    const hasMistakes = mistakeSummary.count > 0;

    app.innerHTML = `
      <section class="card mistakes-screen">
        <div class="section-heading">
          <button type="button" class="link-button" id="back-home">${t('mistakes.backButton')}</button>
          <p class="status" role="status">${t('mistakes.status', { count: mistakeSummary.count })}</p>
        </div>
        <h2>${t('mistakes.title')}</h2>
        <p class="lead">${t('mistakes.lead')}</p>
        ${hasMistakes ? `
          <ul class="mistake-list">
            ${mistakeSummary.words.map((mistake) => `
              <li class="mistake-item">
                <strong>${escapeHtml(mistake.word)}</strong>
                ${mistake.wordListName ? `<span>${t('mistakes.fromList')} ${escapeHtml(mistake.wordListName)}</span>` : ''}
              </li>`).join('')}
          </ul>
          <div class="action-row action-row--spaced">
            <button type="button" id="practice-mistakes">${t('mistakes.practiceButton')}</button>
          </div>
          ${message ? `<p class="status" id="mistakes-message" role="status">${escapeHtml(message)}</p>` : ''}
        ` : `
          <div class="mistakes-empty" aria-live="polite">
            <p class="mistakes-empty__eyebrow">${t('mistakes.emptyEyebrow')}</p>
            <h3>${t('mistakes.emptyTitle')}</h3>
            <p class="mistakes-empty__text">${t('mistakes.emptyText')}</p>
            <p class="mistakes-empty__text">${t('mistakes.emptyHint')}</p>
          </div>
        `}
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      message = '';
      view = 'home';
      render();
    });

    if (hasMistakes) {
      document.getElementById('practice-mistakes').addEventListener('click', () => {
        startPracticeMistakes();
      });
    }
  }

  function renderImport() {
    app.innerHTML = `
      <section class="card">
        <button type="button" class="link-button" id="back-home">${t('import.backButton')}</button>
        <h2>${t('import.title')}</h2>
        <form id="import-form">
          <label for="list-name">${t('import.nameLabel')}</label>
          <input id="list-name" name="name" required maxlength="80" placeholder="${t('import.namePlaceholder')}" />
          <label for="words">${t('import.wordsLabel')}</label>
          <textarea id="words" name="words" rows="10" placeholder="${t('import.wordsPlaceholder')}"></textarea>
          <label for="word-file">${t('import.fileLabel')}</label>
          <input id="word-file" name="file" type="file" accept=".txt,.csv,text/plain,text/csv" />
          <p class="status" id="import-message" role="alert"></p>
          <button type="submit">${t('import.saveButton')}</button>
        </form>
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      view = 'home';
      render();
    });
    document.getElementById('import-form').addEventListener('submit', saveImport);
  }

  function renderSetup(lists) {
    const list = lists.find((entry) => entry.id === selectedListId);
    if (!list) {
      view = 'home';
      render();
      return;
    }

    const sizes = [5, 10, 20, 'All'];

    app.innerHTML = `
      <section class="card practice-setup">
        <button type="button" class="link-button" id="back-home">${t('setup.backButton')}</button>
        <h2>${t('setup.title')}</h2>
        <p class="lead">${escapeHtml(list.name)} · ${t('home.wordCount', { count: list.words.length })}</p>
        <p class="setup-label">${t('setup.label')}</p>
        <div class="pill-row" role="group" aria-label="${t('setup.groupLabel')}">
          ${sizes.map((size) => `
            <button type="button" class="pill ${selectedSessionSize === size ? 'pill--active' : ''}" data-size="${escapeHtml(String(size))}">${size === 'All' ? t('common.all') : escapeHtml(String(size))}</button>
          `).join('')}
        </div>
        <p class="status" id="setup-message"${message ? '' : ' hidden'} role="status">${escapeHtml(message)}</p>
        <div class="action-row action-row--spaced">
          <button type="button" id="start-practice">${t('setup.startButton')}</button>
        </div>
      </section>`;

    document.getElementById('back-home').addEventListener('click', () => {
      view = 'home';
      render();
    });
    document.querySelectorAll('[data-size]').forEach((button) => {
      button.addEventListener('click', () => {
        const size = button.dataset.size === 'All' ? 'All' : Number(button.dataset.size);
        selectedSessionSize = size;
        render();
      });
    });
    document.getElementById('start-practice').addEventListener('click', startPractice);
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
        <section class="card practice-screen">
          <h2>${t('practice.completeTitle')}</h2>
          <p class="lead">${t('practice.completeLead')}</p>
          <div class="summary-stats" aria-label="${t('practice.summaryTitle')}">
            <p>${t('practice.correctCount', { count: summary.correctCount })}</p>
            <p>${t('practice.totalAttempted', { count: summary.totalAttempted })}</p>
            <p>${t('practice.needsMorePracticeCount', { count: summary.needsMorePracticeCount })}</p>
          </div>
          <div class="summary-missed">
            <h3>${t('practice.missedTitle')}</h3>
            ${summary.missedWords.length ? `
              <ul class="summary-missed__list">
                ${summary.missedWords.map((item) => `
                  <li class="summary-missed__item">
                    <p>${t('practice.missedWord')} <strong>${escapeHtml(item.word)}</strong></p>
                    <p>${t('practice.correctSpelling')} ${escapeHtml(item.correctSpelling)}</p>
                  </li>`).join('')}
              </ul>
            ` : `<p class="empty-state">${t('practice.noMissed')}</p>`}
          </div>
          <div class="action-row action-row--spaced">
            ${showPracticeMistakesAction ? `<button type="button" id="practice-mistakes-summary">${t('practice.practiceMistakesButton')}</button>` : ''}
            ${showMistakesScreenAction ? `<button type="button" id="summary-mistakes">${t('practice.mistakesButton')}</button>` : ''}
            <button type="button" id="practice-home">${t('practice.homeButton')}</button>
          </div>
        </section>`;
      if (showPracticeMistakesAction) {
        document.getElementById('practice-mistakes-summary').addEventListener('click', () => {
          startPracticeMistakes();
        });
      }
      if (showMistakesScreenAction) {
        document.getElementById('summary-mistakes').addEventListener('click', () => {
          returnToMistakesFromPractice();
        });
      }
      document.getElementById('practice-home').addEventListener('click', () => {
        practice = null;
        practiceList = null;
        practiceMode = 'normal';
        audioMessage = '';
        view = 'home';
        render();
      });
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
      <section class="card practice-screen">
        <div class="practice-header">
          <button type="button" class="link-button" id="practice-back">${t('setup.backButton')}</button>
          <div class="practice-progress" aria-label="${t('practice.progressLabel')}">
            <div class="practice-progress__label-row">
            <p class="practice-progress__label">${t('practice.progressLabel')}</p>
            <p class="status" aria-live="polite">${t('practice.questionStatus', { current: state.currentPosition, total: state.totalWords })}</p>
            </div>
            <div class="practice-progress__track" aria-hidden="true">
              <div class="practice-progress__fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        </div>
        <h2>${escapeHtml(practiceMode === 'mistakes' ? t('mistakes.practiceSessionName') : practiceList.name)}</h2>
        <p class="practice-prompt">${t('practice.prompt')}</p>
        <div class="practice-panel">
          <div class="practice-actions">
            <button type="button" id="play-word">${t('practice.playButton')}</button>
            <span class="assistive-text">${t('practice.playHint')}</span>
          </div>
          ${audioMessage ? `<p class="status status--error" role="alert">${escapeHtml(audioMessage)}</p>` : ''}
          <form id="practice-form">
            <label for="answer">${t('practice.answerLabel')}</label>
            <input id="answer" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${t('practice.answerPlaceholder')}" value="${escapeHtml(answerValue)}" ${canEditAnswer ? '' : 'disabled'} />
            <div class="action-row action-row--spaced">
              <button type="submit" id="submit-answer"${canEditAnswer ? '' : ' hidden'}>${t('practice.submitButton')}</button>
              <button type="button" id="next-word"${canShowFeedback ? '' : ' hidden'}>${nextLabel}</button>
            </div>
          </form>
          <div class="${feedbackClass}" id="feedback"${feedback ? '' : ' hidden'} aria-live="polite">
            ${renderFeedback(feedback)}
          </div>
        </div>
      </section>`;

    document.getElementById('practice-back').addEventListener('click', () => {
      practice = null;
      practiceList = null;
      practiceMode = 'normal';
      audioMessage = '';
      view = 'home';
      render();
    });

    const answerInput = document.getElementById('answer');
    answerInput.addEventListener('input', (event) => {
      practice.setAnswer(event.target.value);
      audioMessage = '';
    });
    answerInput.focus();

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
      practice.next();
      audioMessage = '';
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
  }

  function renderFeedback(feedback) {
    if (!feedback) {
      return '';
    }

    if (feedback.isCorrect) {
      return `<p>${t('practice.correctFeedback')}</p>`;
    }

    return `
      <p>${t('practice.tryAgain')}</p>
      <p>${t('practice.yourAnswer')} ${escapeHtml(feedback.submittedAnswer)}</p>
      <p>${t('practice.correctAnswer')} ${escapeHtml(feedback.correctAnswer)}</p>`;
  }

  function showHomeMessage(text) {
    message = text;
    view = 'home';
    render();
  }

  function openMistakes() {
    message = '';
    view = 'mistakes';
    render();
  }

  function openPracticeSetup(listId) {
    selectedListId = listId;
    selectedSessionSize = 5;
    message = '';
    view = 'setup';
    render();
  }

  function startPractice() {
    const lists = persistence.loadWordLists();
    const list = lists.find((entry) => entry.id === selectedListId);
    if (!list) {
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
    openMistakes();
  }

  function saveImport(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const messageNode = document.getElementById('import-message');
    const file = form.elements.file.files[0];
    const saveWords = (result) => {
      if (!result.valid) {
        const errorKey = result.error === 'Add at least one word, with one word on each line.'
          ? 'import.emptyWords'
          : 'import.unsupportedFileType';
        messageNode.textContent = t(errorKey);
        return;
      }
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
