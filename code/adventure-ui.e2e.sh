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
agent-browser --session "$SESSION" get count '.level-card--recommended' | grep -x '1'
agent-browser --session "$SESSION" get count '.level-card--locked' | grep -x '1'
agent-browser --session "$SESSION" eval "[...document.querySelectorAll('.level-button')].map(n=>Number(n.dataset.level)).join(',')==='1,2'" | grep -x 'true'
agent-browser --session "$SESSION" eval "document.querySelector('.adventure-scenery').getAttribute('aria-hidden')==='true' && getComputedStyle(document.querySelector('.adventure-scenery')).pointerEvents==='none'" | grep -x 'true'
agent-browser --session "$SESSION" eval "document.activeElement === document.body" | grep -x 'true'
agent-browser --session "$SESSION" get text '.level-card__hint' | grep -F 'Pass the previous level'
agent-browser --session "$SESSION" focus '.level-button[data-level="1"]'
agent-browser --session "$SESSION" press Enter
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get count '.adventure-practice-scene' | grep -x '1'
agent-browser --session "$SESSION" eval "document.querySelector('.adventure-practice-scene').getAttribute('aria-label').length > 0 && [...document.querySelectorAll('.adventure-practice button svg')].every(n=>n.getAttribute('aria-hidden')==='true')" | grep -x 'true'

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
agent-browser --session "$SESSION" get count '.primary-action' | grep -x '1'
agent-browser --session "$SESSION" eval "window.__levelWriteCount" | grep -x '1'
agent-browser --session "$SESSION" eval "Storage.prototype.setItem=window.__originalSetItem; 'online'" >/dev/null
agent-browser --session "$SESSION" click '#retry-adventure-save'
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" get count '#next-level' | grep -x '1'
agent-browser --session "$SESSION" get count '.primary-action' | grep -x '1'
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
agent-browser --session "$SESSION" focus '#language-toggle'
agent-browser --session "$SESSION" press Enter
agent-browser --session "$SESSION" wait 150
agent-browser --session "$SESSION" get text body | grep -F '第 1 关'
agent-browser --session "$SESSION" reload
agent-browser --session "$SESSION" wait 250
agent-browser --session "$SESSION" eval "JSON.parse(localStorage.getItem('spellingbeast:level-progress'))[0].bestStars" | grep -x '3'

# Long-path state, order, positioning, localization, and responsive coverage.
agent-browser --session "$SESSION" eval "localStorage.setItem('spellingbeast:locale','en'); const words=Array.from({length:150},(_,i)=>'word'+(i+1)); localStorage.setItem('spellingbeast:word-lists',JSON.stringify([{id:'long',name:'Long Journey',words,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}])); localStorage.setItem('spellingbeast:level-progress',JSON.stringify(Array.from({length:20},(_,i)=>({wordListId:'long',levelNumber:i+1,bestStars:(i%3)+1})))); location.reload(); 'long-seeded'" >/dev/null
agent-browser --session "$SESSION" wait --load domcontentloaded
agent-browser --session "$SESSION" wait 200
agent-browser --session "$SESSION" eval "document.documentElement.lang==='en'" | grep -x 'true'
agent-browser --session "$SESSION" click '.adventure-list[data-list-id="long"]'
agent-browser --session "$SESSION" wait 300
agent-browser --session "$SESSION" get count '.level-button' | grep -x '30'
agent-browser --session "$SESSION" get count '.level-card--completed' | grep -x '20'
agent-browser --session "$SESSION" get count '.level-card--recommended' | grep -x '1'
agent-browser --session "$SESSION" get count '.level-card--locked' | grep -x '9'
agent-browser --session "$SESSION" get count '.journey-trail' | grep -x '29'
agent-browser --session "$SESSION" eval "[...document.querySelectorAll('.journey-trail')].every(n=>n.getAttribute('aria-hidden')==='true'&&getComputedStyle(n).pointerEvents==='none')" | grep -x 'true'
agent-browser --session "$SESSION" eval "[...document.querySelectorAll('.level-button')].every((node,index)=>Number(node.dataset.level)===index+1)" | grep -x 'true'
agent-browser --session "$SESSION" eval "[...document.querySelectorAll('.level-button:not(:disabled)')].every((node,index)=>Number(node.dataset.level)===index+1)" | grep -x 'true'
agent-browser --session "$SESSION" eval "(()=>{const r=document.querySelector('[data-level=\"21\"]').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&document.activeElement===document.body})()" | grep -x 'true'
agent-browser --session "$SESSION" eval "[...document.querySelectorAll('.level-button:disabled')].every(n=>n.disabled)" | grep -x 'true'
agent-browser --session "$SESSION" eval "getComputedStyle(document.querySelector('.level-card--recommended .level-node')).animationName==='none' && getComputedStyle(document.querySelector('.level-bee')).animationName==='none'" | grep -x 'true'

for viewport in '320 568' '390 844' '1280 800'; do
  set -- $viewport
  agent-browser --session "$SESSION" set viewport "$1" "$2"
  agent-browser --session "$SESSION" wait 100
  agent-browser --session "$SESSION" eval "document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.level-node')].every(n=>{const r=n.getBoundingClientRect();return r.width>=48&&r.height>=48})" | grep -x 'true'
done

agent-browser --session "$SESSION" focus '#language-toggle'
agent-browser --session "$SESSION" press Enter
agent-browser --session "$SESSION" wait 150
agent-browser --session "$SESSION" eval "document.documentElement.lang==='zh' && !document.querySelector('.level-card--recommended .level-button').getAttribute('aria-label').startsWith('Level') && document.querySelector('.level-card--locked .level-button').disabled && document.querySelector('.level-card--recommended .level-card__status').textContent!=='Recommended next level'" | grep -x 'true'

echo 'adventure UI E2E test passed'
