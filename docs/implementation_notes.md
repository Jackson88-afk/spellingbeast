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

## v2.3 Illustrated Adventure Journey

- The Adventure map remains one ascending semantic `<ol>`, but each level now follows a repeating left/center/right/center visual route. Decorative inline SVG trail segments connect every consecutive pair; 1, 3, 10, and 30-level domain fixtures verify stable order and position assignment.
- `index.html` contains one local SVG symbol sprite for the bee, cloud, hill, flower/leaf scene, flag, lock, speaker, pencil, check, retry, arrow, and star primitives. Every rendered icon references those symbols; scenery and trails are `aria-hidden`, unfocusable, and pointer-inert.
- Confirmed progress derives the recommended level. Entry and completion return use `scrollIntoView({block: 'center'})` after render without assigning focus. Completed, recommended, available, and locked styles include localized text states; only native enabled buttons can start levels.
- Adventure practice adds a compact bee scene and Listen/Type/Check steps while preserving the existing state machine and audio/answer lifecycle. Adventure feedback adds check/retry illustrations without changing Free Practice or Mistakes rendering.
- Completion has one `.primary-action`: confirmed unlocked continuation uses Next Level, a terminal/failed attempt uses Retry Level, and a failed save uses Retry Save while Next Level remains absent. Level Map and non-primary retry controls remain secondary.
- Adventure-only motion is bounded to a 1.1 s recommended-node pulse, 520 ms bee arrival, and 700 ms star reveal. Explicit reduced-motion rules set all three to `animation: none`.
- The journey uses 76 px nodes, responsive three-column path geometry, mobile decoration reduction, and local SVG connectors. Browser checks cover 320×568, 390×844, and 1280×800 without horizontal overflow and with nodes above 48×48 px.

### v2.3 verification (2026-09-21)

- `npm test`: passed (24 server/client TAP tests, 13 Adventure TAP tests, 2 API client TAP tests, 6 remote-persistence TAP tests, plus all existing direct code suites).
- Real-server UI E2E at `http://127.0.0.1:8765/?local=1`: `wordlists-ui.e2e.sh`, `practice-ui.e2e.sh`, `mistakes-ui.e2e.sh`, and expanded `adventure-ui.e2e.sh` all passed.
- Adventure browser coverage verifies a 30-node/29-connector path, ascending DOM and enabled-node order, 20 completed/1 recommended/9 locked states, keyboard activation, failed-save gating and retry, exactly one primary completion action, non-regressing replay, automatic recommended-node positioning without focus theft, English/Chinese labels, decorative isolation, icon accessibility, reduced motion, and all required viewport widths.
- A captured 320×568 real-browser visual review confirmed the curved dashed trail visibly meets consecutive circular nodes without clipping or overlap.

The v2.2 live Neon/auth limitation remains: no Neon credentials were available, so production account sync was not rerun. v2.3 changed no API, database, authentication, scoring, unlock, or persistence behavior.
