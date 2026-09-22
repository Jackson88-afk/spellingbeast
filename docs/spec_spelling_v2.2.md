# SpellingBeast — Product Specification v2.2

**Status:** Approved for Development  
**Base specification:** `spec_spelling_v2.1.md`  
**Release theme:** Adventure Levels

# Goal

Add a lightweight level-based adventure that gives children a visible path, achievable rewards, and a reason to retry, while preserving free practice, exact spelling rules, word-list ownership, and the calm bilingual experience.

# Scope

- Add an Adventure entry point and level map for each word list.
- Build deterministic levels from the saved word order, with up to 5 words per level.
- Unlock levels sequentially based on performance.
- Award 0–3 stars, retain each level’s best result, and sync progress across devices.
- Add focused completion feedback and restrained celebration.
- Keep existing normal practice and mistake practice unchanged.

# Requirements

**R1. Adventure entry.** Each word-list card must show an Adventure action in addition to existing free Practice. Adventure opens that list’s level map and displays the list name, total earned stars, and one numbered level card per level.

**R2. Level generation.** Levels are generated from the list’s persisted word order in consecutive groups of 5. The final level may contain 1–4 words. Each word appears in exactly one level. Level numbering starts at 1. Starting a level shuffles only that level’s words using the existing injectable shuffle seam and never mutates saved order.

**R3. Unlock rules.** Level 1 is always unlocked. A later level unlocks only after the immediately preceding level earns at least 1 star. Locked levels are visibly marked, cannot be started by keyboard or pointer, and explain that the previous level must be passed.

**R4. Stars.** At completion, stars are based on first submitted answers: 3 stars for 100% correct, 2 stars for at least 80%, 1 star for at least 60%, and 0 stars below 60%. Use integer comparison so small levels are scored consistently. A 0-star result does not unlock the next level.

**R5. Best result.** Children may replay any unlocked level. Persist the higher of the previous and new star result; replaying can never reduce saved stars. The completion screen shows stars earned this attempt, best stars, correct count, total words, Retry Level, Level Map, and Next Level when unlocked and available.

**R6. Feedback and celebration.** A passed level shows a short positive bilingual message and a restrained star reveal. A 0-star result uses encouraging retry language and no failure/shame language. Animation must be non-blocking, last no more than 1.2 seconds, and be disabled under `prefers-reduced-motion`.

**R7. Progress persistence.** Adventure progress is account-owned and stored in Neon by `wordListId` and `levelNumber`. `GET /api/v2/state` returns level progress. An authenticated owner-scoped upsert records only valid levels and only improves `bestStars`; forged ownership or invalid stars/levels are rejected without revealing other users’ data.

**R8. List changes.** Renaming a list preserves its level progress. Any saved change to the list’s normalized word sequence resets all Adventure progress for that list atomically. Deleting a list deletes its Adventure progress through the existing relationship. The edit confirmation or success message must state when progress was reset.

**R9. Offline/error behavior.** Do not show a newly earned best result or unlock the next level until the server confirms the progress write. On failure, keep the completion screen and offer Retry Save; retry repeats only the pending progress write and never re-submits answers.

**R10. Localization and accessibility.** All Adventure, level, lock, star, result, reset, and retry text must exist in English and Chinese. Level cards and star results need semantic labels, visible focus, 44×44 px targets, keyboard operation, sufficient contrast, and mobile support. Do not rely on color, animation, or star icons alone.

# Constraints

- Keep the current native HTML/CSS/JS client, Express API, Neon PostgreSQL, Better Auth, Render deployment, `/api/v2` authorization, and visual tokens.
- Create a new migration; do not edit the applied `001_spellingbeast_v2.sql` migration.
- Adventure results must use the existing exact, case-insensitive, trimmed spelling evaluation and existing audio behavior.
- Do not add third-party game, animation, analytics, or audio dependencies.
- Implement on branch `feat/gamified-levels-v2.2`; do not modify or merge `main`.

# Acceptance Criteria

**AC1.** Lists of 1, 5, 6, and 12 words produce 1, 1, 2, and 3 levels, respectively, with no missing or duplicated words.

**AC2.** Only Level 1 starts initially; earning at least 1 star unlocks exactly the next level, while 0 stars does not.

**AC3.** Automated boundary tests verify 0/1/2/3-star scoring, including small final levels, without floating-point ambiguity.

**AC4.** Replaying a level cannot reduce its saved best stars; progress survives refresh and a second authenticated browser.

**AC5.** Rename preserves progress; a changed normalized word sequence resets only that list’s progress; delete removes its progress; another account cannot read or write it.

**AC6.** A failed progress save shows Retry Save, does not display the next level as unlocked, and retry performs one progress write without changing the completed answers.

**AC7.** Free Practice and Practice Mistakes behavior and all v2.1 tests remain unchanged.

**AC8.** New unit/API/browser tests cover level generation, shuffle isolation, scoring boundaries, unlocks, best-result upsert, edit reset, delete cascade, ownership, localization, keyboard use, mobile layout, and reduced motion.

# Out of Scope

- XP, coins, lives/hearts, streaks, daily quests, avatars, badges, leaderboards, stores, ads, social sharing, or parent/teacher dashboards.
- Timers, speed bonuses, penalties, multiple-choice mode, hints, changed spelling rules, or AI-generated content.
- Cross-list adventures, global levels, seasonal content, or manually authored level maps.
