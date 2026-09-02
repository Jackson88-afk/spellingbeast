#!/bin/sh
set -eu

SESSION="practice-ui-e2e-$$"
cleanup() {
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

agent-browser --session "$SESSION" open http://127.0.0.1:8765/
agent-browser --session "$SESSION" wait 500
agent-browser --session "$SESSION" eval "localStorage.setItem('spellingbeast:word-lists', JSON.stringify([{id:'animals',name:'Animals',words:['ant','bear'],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}])); location.reload(); 'seeded'" >/dev/null
agent-browser --session "$SESSION" wait 500

agent-browser --session "$SESSION" click 'button[data-list-id="animals"]'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click 'button[data-size="All"]'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click '#start-practice'
agent-browser --session "$SESSION" wait 200

agent-browser --session "$SESSION" fill '#answer' 'ant'
agent-browser --session "$SESSION" click '#submit-answer'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get text '#feedback' | grep -F '太棒了'
agent-browser --session "$SESSION" click '#next-word'
agent-browser --session "$SESSION" wait 200

agent-browser --session "$SESSION" fill '#answer' 'bear'
agent-browser --session "$SESSION" click '#submit-answer'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" click '#next-word'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get text body | grep -F '练习完成'

echo 'practice UI E2E test passed'
