function initApp() {
  window.__appInitRan = true;
  const app = document.getElementById('app');
  const persistence = SpellingBeastPersistence.createPersistence();
  let view = 'home';
  let message = '';
  let selectedListId = null;
  let selectedSessionSize = 5;
  let practice = null;
  let practiceList = null;
  let practiceMode = 'normal';
  let audioMessage = '';

  function getAudioFailureMessage(error) {
    if (typeof SpellingBeastAudio !== 'undefined' && typeof SpellingBeastAudio.describeSpeechSynthesisFailure === 'function') {
      return SpellingBeastAudio.describeSpeechSynthesisFailure(error);
    }

    return error && error.message ? error.message : '无法播放这个单词，请再试一次。';
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
        emptyState: '当前没有需要额外练习的单词。',
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
          <h2>我的单词表</h2>
          <div class="action-row">
            <button type="button" id="mistakes">错题本 (${mistakeSummary.count})</button>
            <button type="button" id="add-list">添加单词表</button>
          </div>
        </div>
        ${lists.length ? `<ul class="word-list-items">${lists.map((list) => `
          <li class="word-list-item">
            <div>
              <strong>${escapeHtml(list.name)}</strong><br />
              <span>${list.words.length} 个单词</span>
            </div>
            <button type="button" class="practice-list" data-list-id="${escapeHtml(list.id)}">开始练习</button>
          </li>`).join('')}</ul>` : '<p class="empty-state">还没有单词表。先添加一个吧！</p>'}
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
          <button type="button" class="link-button" id="back-home">← 返回</button>
          <p class="status" role="status">当前有 ${mistakeSummary.count} 个错题</p>
        </div>
        <h2>错题本</h2>
        <p class="lead">把还没拼对的单词集中练习。</p>
        ${hasMistakes ? `
          <ul class="mistake-list">
            ${mistakeSummary.words.map((mistake) => `
              <li class="mistake-item">
                <strong>${escapeHtml(mistake.word)}</strong>
                ${mistake.wordListName ? `<span>来自 ${escapeHtml(mistake.wordListName)}</span>` : ''}
              </li>`).join('')}
          </ul>
          <div class="action-row action-row--spaced">
            <button type="button" id="practice-mistakes">开始练习错题</button>
          </div>
          ${message ? `<p class="status" id="mistakes-message" role="status">${escapeHtml(message)}</p>` : ''}
        ` : `
          <div class="mistakes-empty" aria-live="polite">
            <p class="mistakes-empty__eyebrow">All Caught Up</p>
            <h3>做得很棒！</h3>
            <p class="mistakes-empty__text">${escapeHtml(mistakeSummary.emptyState)}</p>
            <p class="mistakes-empty__text">可以回到首页，继续练习别的单词表。</p>
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
        <button type="button" class="link-button" id="back-home">← 返回</button>
        <h2>添加单词表</h2>
        <form id="import-form">
          <label for="list-name">单词表名称</label>
          <input id="list-name" name="name" required maxlength="80" placeholder="例如：本周单词" />
          <label for="words">每行写一个单词</label>
          <textarea id="words" name="words" rows="10" placeholder="apple&#10;beautiful&#10;calendar"></textarea>
          <label for="word-file">或上传 TXT / CSV</label>
          <input id="word-file" name="file" type="file" accept=".txt,.csv,text/plain,text/csv" />
          <p class="status" id="import-message" role="alert"></p>
          <button type="submit">保存单词表</button>
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
        <button type="button" class="link-button" id="back-home">← 返回</button>
        <h2>开始练习</h2>
        <p class="lead">${escapeHtml(list.name)} · ${list.words.length} 个单词</p>
        <p class="setup-label">选择本次练习数量</p>
        <div class="pill-row" role="group" aria-label="选择练习数量">
          ${sizes.map((size) => `
            <button type="button" class="pill ${selectedSessionSize === size ? 'pill--active' : ''}" data-size="${escapeHtml(String(size))}">${escapeHtml(String(size))}</button>
          `).join('')}
        </div>
        <p class="status" id="setup-message"${message ? '' : ' hidden'} role="status">${escapeHtml(message)}</p>
        <div class="action-row action-row--spaced">
          <button type="button" id="start-practice">开始练习</button>
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
          <h2>练习完成</h2>
          <p class="lead">今天这组单词已经练完了。下面是这次练习的结果。</p>
          <div class="summary-stats" aria-label="本次练习结果">
            <p>正确数量：${summary.correctCount}</p>
            <p>总答题数：${summary.totalAttempted}</p>
            <p>需要继续练习的数量：${summary.needsMorePracticeCount}</p>
          </div>
          <div class="summary-missed">
            <h3>答错单词</h3>
            ${summary.missedWords.length ? `
              <ul class="summary-missed__list">
                ${summary.missedWords.map((item) => `
                  <li class="summary-missed__item">
                    <p>单词：<strong>${escapeHtml(item.word)}</strong></p>
                    <p>正确拼写：${escapeHtml(item.correctSpelling)}</p>
                  </li>`).join('')}
              </ul>
            ` : '<p class="empty-state">这次没有答错单词。</p>'}
          </div>
          <div class="action-row action-row--spaced">
            ${showPracticeMistakesAction ? '<button type="button" id="practice-mistakes-summary">练习错题</button>' : ''}
            ${showMistakesScreenAction ? '<button type="button" id="summary-mistakes">错题本</button>' : ''}
            <button type="button" id="practice-home">回到首页</button>
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
    const nextLabel = state.currentIndex + 1 >= state.totalWords ? '完成' : '下一个';

    app.innerHTML = `
      <section class="card practice-screen">
        <div class="practice-header">
          <button type="button" class="link-button" id="practice-back">← 返回</button>
          <div class="practice-progress" aria-label="练习进度">
            <div class="practice-progress__label-row">
              <p class="practice-progress__label">进度</p>
              <p class="status" aria-live="polite">第 ${state.currentPosition} / ${state.totalWords} 题</p>
            </div>
            <div class="practice-progress__track" aria-hidden="true">
              <div class="practice-progress__fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        </div>
        <h2>${escapeHtml(practiceList.name)}</h2>
        <p class="practice-prompt">听一听，再拼写。</p>
        <div class="practice-panel">
          <div class="practice-actions">
            <button type="button" id="play-word">播放单词</button>
            <span class="assistive-text">请先点播放，再拼写。</span>
          </div>
          ${audioMessage ? `<p class="status status--error" role="alert">${escapeHtml(audioMessage)}</p>` : ''}
          <form id="practice-form">
            <label for="answer">请输入拼写</label>
            <input id="answer" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="在这里输入" value="${escapeHtml(answerValue)}" ${canEditAnswer ? '' : 'disabled'} />
            <div class="action-row action-row--spaced">
              <button type="submit" id="submit-answer"${canEditAnswer ? '' : ' hidden'}>提交</button>
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
      return '<p>太棒了！拼写正确。</p>';
    }

    return `
      <p>再看一次。</p>
      <p>你的答案：${escapeHtml(feedback.submittedAnswer)}</p>
      <p>正确拼写：${escapeHtml(feedback.correctAnswer)}</p>`;
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
        messageNode.textContent = result.error;
        return;
      }
      persistence.saveWordList(SpellingBeastWordList.createWordList({
        id: SpellingBeastWordList.createId(),
        name: form.elements.name.value.trim(),
        words: result.words,
      }));
      view = 'home';
      message = '单词表已保存。';
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
      messageNode.textContent = '无法读取这个文件。请再试一次。';
    };
    reader.onload = () => saveWords(SpellingBeastImport.parseImportInput(type, reader.result));
    reader.readAsText(file);
  }

  function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  render();
}

initApp();