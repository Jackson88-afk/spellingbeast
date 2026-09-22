#!/bin/sh
set -eu

SESSION="adventure-ui-e2e-$$"
cleanup() {
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

agent-browser --session "$SESSION" open 'http://127.0.0.1:8765/?local=1'
agent-browser --session "$SESSION" wait --load domcontentloaded
agent-browser --session "$SESSION" set viewport 390 844
agent-browser --session "$SESSION" set media light reduced-motion
agent-browser --session "$SESSION" eval "localStorage.clear(); localStorage.setItem('spellingbeast:word-lists', JSON.stringify([{id:'quest',name:'Quest Words',words:['cat','cat','cat','cat','cat','dog'],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}])); location.reload(); 'seeded'" >/dev/null
agent-browser --session "$SESSION" wait 400

agent-browser --session "$SESSION" focus '.adventure-list[data-list-id="quest"]'
agent-browser --session "$SESSION" press Enter
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get count '.level-button' | grep -x '2'
agent-browser --session "$SESSION" is enabled '.level-button[data-level="1"]' | grep -x 'true'
agent-browser --session "$SESSION" is enabled '.level-button[data-level="2"]' | grep -x 'false'
agent-browser --session "$SESSION" get text '.level-card__hint' | grep -F 'Pass the previous level'
agent-browser --session "$SESSION" focus '.level-button[data-level="1"]'
agent-browser --session "$SESSION" press Enter
agent-browser --session "$SESSION" wait 200

n=1
while [ "$n" -le 5 ]; do
  agent-browser --session "$SESSION" fill '#answer' 'cat'
  agent-browser --session "$SESSION" click '#submit-answer'
  agent-browser --session "$SESSION" wait 80
  if [ "$n" -eq 5 ]; then
    agent-browser --session "$SESSION" eval "window.__originalSetItem=Storage.prototype.setItem; window.__levelWriteCount=0; Storage.prototype.setItem=function(key,value){if(String(key).includes('level-progress')){window.__levelWriteCount+=1; throw new Error('offline');} return window.__originalSetItem.call(this,key,value);}; 'offline'" >/dev/null
  fi
  agent-browser --session "$SESSION" click '#next-word'
  agent-browser --session "$SESSION" wait 100
  n=$((n + 1))
done

agent-browser --session "$SESSION" get text body | grep -F 'Retry Save'
agent-browser --session "$SESSION" get count '#next-level' | grep -x '0'
agent-browser --session "$SESSION" eval "window.__levelWriteCount" | grep -x '1'
agent-browser --session "$SESSION" eval "Storage.prototype.setItem=window.__originalSetItem; 'online'" >/dev/null
agent-browser --session "$SESSION" click '#retry-adventure-save'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get count '#next-level' | grep -x '1'
agent-browser --session "$SESSION" eval "JSON.parse(localStorage.getItem('spellingbeast:level-progress'))[0].bestStars" | grep -x '3'
agent-browser --session "$SESSION" eval "matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.star-result')).animationName === 'none'" | grep -x 'true'

agent-browser --session "$SESSION" click '#level-map'
agent-browser --session "$SESSION" wait 150
agent-browser --session "$SESSION" is enabled '.level-button[data-level="2"]' | grep -x 'true'
agent-browser --session "$SESSION" eval "document.documentElement.scrollWidth <= 390" | grep -x 'true'

# A lower replay result must not replace the saved three-star best.
agent-browser --session "$SESSION" click '.level-button[data-level="1"]'
agent-browser --session "$SESSION" wait 150
n=1
while [ "$n" -le 5 ]; do
  agent-browser --session "$SESSION" fill '#answer' 'wrong'
  agent-browser --session "$SESSION" click '#submit-answer'
  agent-browser --session "$SESSION" wait 60
  agent-browser --session "$SESSION" click '#next-word'
  agent-browser --session "$SESSION" wait 80
  n=$((n + 1))
done
agent-browser --session "$SESSION" eval "JSON.parse(localStorage.getItem('spellingbeast:level-progress'))[0].bestStars" | grep -x '3'
agent-browser --session "$SESSION" get text body | grep -F '3 / 3 stars'
agent-browser --session "$SESSION" click '#level-map'
agent-browser --session "$SESSION" wait 120
agent-browser --session "$SESSION" click '#language-toggle'
agent-browser --session "$SESSION" wait 150
agent-browser --session "$SESSION" get text body | grep -F '第 1 关'
agent-browser --session "$SESSION" reload
agent-browser --session "$SESSION" wait 250
agent-browser --session "$SESSION" eval "JSON.parse(localStorage.getItem('spellingbeast:level-progress'))[0].bestStars" | grep -x '3'

echo 'adventure UI E2E test passed'
