# SpellingBeast v2.2 — Developer Tasks

Source of truth: `docs/spec_spelling_v2.2.md`  
Branch: `feat/gamified-levels-v2.2`

```text
TASK-220 — Domain rules and unit tests
- Add pure helpers for 5-word level generation, star scoring, unlock state, and best-star merging.
- Reuse injected Fisher–Yates shuffle for a selected level.
- Cover 1/5/6/12-word lists and every score threshold, including small final levels.
Done when: deterministic unit tests pass and no saved list array is mutated.

TASK-221 — Neon schema and repository
- Add a new repeatable migration for owner/list/level progress with 0–3 star validation, uniqueness, timestamps, and list-delete cascade.
- Add owner-scoped load/upsert operations; upsert must never lower bestStars.
- Reset one list’s progress atomically only when its normalized word sequence changes; rename-only edits preserve progress.
Done when: repository tests prove best-result merge, reset, cascade, rollback, and account isolation.

TASK-222 — API and remote persistence
- Extend GET /api/v2/state with level progress.
- Add authenticated, origin-protected progress upsert with strict stars/level validation and non-leaking not-found behavior.
- Extend remote cache/persistence without making optimistic unlocks visible.
Done when: API/client tests cover success, invalid payloads, ownership, save failure, and retry.

TASK-223 — Adventure level map
- Add Adventure to each word-list card.
- Render list title, total stars, numbered level cards, best stars, unlocked/locked state, and concise lock explanation.
- Support keyboard, visible focus, semantic labels, 44px targets, mobile layout, English, and Chinese.
Done when: only eligible levels are startable and browser checks pass in both locales.

TASK-224 — Level practice and completion
- Start a session from only the selected level’s shuffled words using the existing practice/audio/correctness loop.
- Score first submissions and save progress before showing a new best/unlock.
- Render attempt stars, best stars, score, Retry Level, Level Map, conditional Next Level, and Retry Save on failure.
Done when: retry save repeats only the write and free/mistake practice behavior is unchanged.

TASK-225 — Celebration and polish
- Add encouraging pass/retry copy and a restrained <=1.2s star reveal.
- Disable nonessential motion under prefers-reduced-motion; do not use color/icon alone.
Done when: reduced-motion and accessibility browser checks pass.

TASK-226 — Regression and release evidence
- Run npm test plus existing UI E2E scripts.
- Add Adventure browser coverage for unlock, persistence, replay non-regression, save retry, locale, keyboard, and mobile.
- Update implementation/progress docs with verified evidence and any deviations.
Done when: full suite passes and the branch is pushed to GitHub; do not merge or open an auto-merge PR.
```
