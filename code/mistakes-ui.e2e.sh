#!/bin/sh
set -eu

SESSION="mistakes-ui-e2e-$$"
cleanup() {
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

agent-browser --session "$SESSION" open http://127.0.0.1:8765/
agent-browser --session "$SESSION" wait 500
agent-browser --session "$SESSION" eval "localStorage.setItem('spellingbeast:word-lists', JSON.stringify([{id:'animals',name:'Animals',words:['ant'],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}])); localStorage.removeItem('spellingbeast:active-mistakes'); location.reload(); 'seeded'" >/dev/null
agent-browser --session "$SESSION" wait 500

agent-browser --session "$SESSION" click 'button[data-list-id="animals"]'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click 'button[data-size="All"]'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click '#start-practice'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" fill '#answer' 'antt'
agent-browser --session "$SESSION" click '#submit-answer'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click '#practice-back'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get text '#mistakes' | grep -F 'Mistakes (1)'

agent-browser --session "$SESSION" click '#mistakes'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click '#practice-mistakes'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" fill '#answer' 'ant'
agent-browser --session "$SESSION" click '#submit-answer'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click '#next-word'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get text body | grep -F 'Practice Complete'
agent-browser --session "$SESSION" eval "document.querySelector('#practice-home').click(); 'home'"
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" eval "document.querySelector('#mistakes').click(); 'mistakes'"
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get text body | grep -F 'ALL CAUGHT UP'

echo 'mistakes UI E2E test passed'
