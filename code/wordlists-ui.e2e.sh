#!/bin/sh
set -eu

SESSION="wordlists-ui-e2e-$$"
cleanup() {
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

agent-browser --session "$SESSION" open http://127.0.0.1:8765/
agent-browser --session "$SESSION" wait --load domcontentloaded
agent-browser --session "$SESSION" eval "localStorage.setItem('spellingbeast:word-lists', JSON.stringify([{id:'animals',name:'Animals',words:['cat','dog','bird'],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}])); location.reload(); 'seeded'" >/dev/null
agent-browser --session "$SESSION" wait --load domcontentloaded

body="$(agent-browser --session "$SESSION" get text body)"
printf '%s' "$body" | grep -F 'Animals'
printf '%s' "$body" | grep -F '3 words'
agent-browser --session "$SESSION" get count '.practice-list' | grep -x '1'
agent-browser --session "$SESSION" get count '.practice-list[data-list-id="animals"]' | grep -x '1'
agent-browser --session "$SESSION" get count '#mistakes' | grep -x '1'

echo 'word lists UI E2E test passed'
