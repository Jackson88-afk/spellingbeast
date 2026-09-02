# SpellingBeast

SpellingBeast is a child-friendly, browser-local spelling-practice application. It currently lets a child create a word list by pasting words or importing a TXT/CSV file, saves lists in browser localStorage, and displays saved lists with actions for practice and mistakes.

## Requirements

- A modern browser with JavaScript enabled.
- Node.js to run the automated unit tests.
- Python 3 to serve the static files locally.
- `agent-browser` only for the optional browser E2E check.

No npm packages, backend, database, build step, or deployment configuration are required.

## Run locally

```bash
cd /Users/wukongsun/ai_project/spellingbeast/code
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/ in a browser.

## Test

Run the domain and persistence tests:

```bash
cd /Users/wukongsun/ai_project/spellingbeast/code
node wordlist.test.js
node import.test.js
node persistence.test.js
```

With the static server above running, run the Word Lists browser E2E check:

```bash
cd /Users/wukongsun/ai_project/spellingbeast/code
sh wordlists-ui.e2e.sh
```

## Build and deployment

This is a static application: there is no build command. No deployment configuration exists yet; any static-file host can serve the contents of this directory when deployment is added.
