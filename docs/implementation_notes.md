# SpellingBeast - Implementation Notes

## Scope

This document records technical decisions for the implemented project foundation and Word Lists phase. Product behavior remains governed by `spec_spelling.md` and `decisions_spelling.md`.

## Application structure

The application is a dependency-free static frontend under `code/`:

- `index.html` loads the application and domain modules in dependency order.
- `app.js` renders the current UI and coordinates import and persistence.
- `wordlist.js`, `import.js`, and `persistence.js` are UMD-style modules so they work directly in a browser and under Node.js tests.
- `styles.css` contains the responsive child-first visual rules.

There is no backend, account system, or build step.

## Persistence

`persistence.js` provides an isolated localStorage abstraction using the `spellingbeast` namespace:

- `spellingbeast:word-lists`
- `spellingbeast:active-mistakes`

The abstraction is independently testable because it accepts an injected storage implementation. Browser-local storage was selected because it fulfills v1's local-only persistence requirement with no additional dependency or infrastructure.

## Word-list import and data model

A word list has `id`, `name`, `words`, `createdAt`, and `updatedAt`. Textarea and TXT input use one word per line. CSV import reads the first column and skips a first usable `word` header. Import normalizes surrounding whitespace, ignores blank input, and de-duplicates words case-insensitively while keeping the first spelling.

## UI and accessibility

The Word Lists home screen uses semantic headings, labelled import controls, native buttons, a visible keyboard focus indicator, `role="alert"` for import errors, and `role="status"` for home-screen responses. Controls use a minimum 44px height. On narrow screens, each saved-list card changes to a single-column layout.

The per-list Practice and Mistakes entry controls are intentionally limited to visible, responsive entry-point feedback until their respective workflow tasks are implemented. They do not create a session or expose a Mistakes screen before the related Phase 2 and Phase 3 tasks are complete.

## Testing approach

Node.js tests cover the independently testable word-list, import, and persistence modules. `wordlists-ui.e2e.sh` uses an independent `agent-browser` session to seed one saved list, assert its name/count, and assert the required practice and mistakes entry controls. Real browser refresh persistence is also verified with `agent-browser` against a local Python static server.

## Browser compatibility

The implemented UI requires a modern browser with localStorage and standard HTML/CSS/JavaScript support. The later Web Speech API requirement has not been implemented and therefore has not yet established a compatibility policy.

## v2.2 Adventure Levels

- `code/adventure.js` is the pure domain boundary. It chunks persisted order into consecutive groups of five, shuffles only a copied selected level through `session.js`, scores with integer comparisons, derives sequential unlocks, and merges best stars monotonically.
- `migrations/002_adventure_level_progress.sql` adds account-owned `(owner_id, word_list_id, level_number)` progress with composite owner/list referential integrity, 0–3 checks, timestamps, uniqueness, and list/account delete cascades. Migration 001 remains unchanged.
- `server/repository.js` loads progress with account state and validates list ownership and generated level bounds before a `greatest(existing, attempted)` upsert. Word edits compare the ordered normalized sequence before replacement; changed sequences delete only that list's progress in the same transaction, while renames preserve it.
- `PUT /api/v2/word-lists/:id/levels/:level/progress` uses existing authentication, origin protection, and write limiting. Invalid values return `invalid_level_progress`; a foreign or missing list returns the same owner-scoped 404.
- `code/remote-persistence.js` does not mutate its progress cache until the API confirms a write. The completion controller retains one pending write after failure, and Retry Save repeats that write without re-submitting answers.
- The Adventure map and completion UI use native buttons, disabled locked levels, visible explanations, text plus icon star results, 44 px or larger targets, responsive single-column rules, visible focus inherited from the shared tokens, and complete English/Chinese strings.
- Celebration is a 700 ms CSS reveal only under `prefers-reduced-motion: no-preference`; the existing reduce rule disables animation and transitions.
- `?local=1` is an explicit browser-test adapter that keeps production remote persistence as the default while allowing deterministic static-server E2E coverage.

### v2.2 verification

`npm test` covers domain, persistence, remote cache, repository, API, localization, and all prior regressions. `code/adventure-ui.e2e.sh` covers locked/unlocked behavior, keyboard activation, confirmed-write gating, Retry Save, best-result non-regression, refresh, Chinese copy, mobile overflow, and reduced motion. Existing word-list, practice, and mistake E2Es remain runnable with the local test adapter.

No live Neon credentials are available in the development environment, so applying migration 002 and exercising account sync in two authenticated browsers remain deployment verification items.
