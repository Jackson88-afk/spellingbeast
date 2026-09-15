# Spelling Bee — Product Specification v2.1

**Status:** Ready for Development  
**Base specification:** `spec_spelling_v2.md`  
**Release type:** Backward-compatible feature and bug-fix release

# Goal

Improve management and practice of saved word lists without changing the v2 Neon + Render architecture, authentication, visual direction, or core spelling rules. Users must be able to edit and delete lists, receive a newly randomized question order for every practice session, and practice mistakes separately for each source word list without the current failed-save retry loop.

# Scope

- Add Edit and Delete actions for each owned word list.
- Randomize question order when starting normal and mistake-practice sessions.
- Fix incorrect-answer handling during Practice Mistakes.
- Group active mistakes by their source word list and provide per-list practice.
- Extend the existing Render API, Neon repository, tests, and bilingual UI only where required.
- All requirements from v2 remain unchanged unless explicitly overridden below.

# Requirements

**R1. Word-list editing.** Each word-list card must provide an Edit action. Edit opens the existing Create/Import form populated with the current list name and words. The user can change the name, add words, remove words, reorder words, then Save or Cancel. Save must use the existing `PUT /api/v2/word-lists/:id` contract, preserve the list ID and `createdAt`, update `updatedAt`, and refresh the displayed state only after server confirmation.

**R2. Edit validation.** Edited lists must follow existing v2 validation: name is required and no longer than 80 characters; at least one usable word is required; whitespace is trimmed; blank lines are ignored; case-insensitive duplicates retain the first occurrence. Failed saves must keep the unsaved form content visible and offer Retry without replacing the last confirmed server state.

**R3. Mistake reconciliation after edit.** Saving an edited list must atomically remove active mistakes whose normalized word no longer exists in that list. Mistakes for unchanged words must remain. Renaming a list must not create, duplicate, or detach mistakes; the new name must appear wherever that list’s mistakes are shown.

**R4. Word-list deletion.** Each word-list card must provide a Delete action that opens a bilingual confirmation identifying the selected list. Cancel makes no change. Confirm calls `DELETE /api/v2/word-lists/:id`. Successful deletion must remove the list and all of its associated active mistakes through the existing database relationship. A user must never be able to delete another account’s list by changing the ID.

**R5. Delete failure.** The UI must not remove the list before server confirmation. If deletion fails, keep the list and its mistakes visible and show a short localized error with Retry. Repeating a confirmed delete request must be safe and must not delete unrelated data.

**R6. Random normal practice.** Starting a normal practice session must shuffle a copy of the complete selected list, then select the first 5, 10, 20, or All words from that shuffled copy. Each selected word appears at most once in the session. The saved list order must not be changed. Starting another session must perform a new shuffle rather than reuse the previous session order.

**R7. Random mistake practice.** Starting Practice Mistakes for a selected word list must shuffle only that list’s current active mistakes. Each active mistake appears at most once in that session. Mistakes from other lists must not be included.

**R8. Testable randomization.** Randomization must use an unbiased shuffle such as Fisher–Yates and allow an injected/random-source seam for deterministic automated tests. Tests must not assert that two real random sessions are always different, because identical random orders are possible.

**R9. Fix incorrect mistake-practice submission.** When a word is answered incorrectly during Practice Mistakes, it already exists as an active mistake and must remain unchanged. The client must not issue a redundant create/upsert request for that mistake. The user must receive normal incorrect feedback and be able to continue immediately; the message “This change was not saved. Try again.” and blocking Retry state must not appear for this case.

**R10. Correct mistake-practice submission.** When a word is answered correctly during Practice Mistakes, remove that exact active mistake through the existing delete endpoint. Continue only after the delete succeeds. If deletion genuinely fails, retain the mistake and show the existing Retry state; Retry must repeat only the pending delete and must not resubmit the spelling answer.

**R11. Mistakes grouped by source list.** The Mistakes screen must render one section/card per owned word list that currently has active mistakes. Each group must show the word-list name, active mistake count, mistake words, and a Practice Mistakes action for that group. With Word List 1, 2, and 3, mistakes must remain independently associated and independently practiceable as Mistake groups 1, 2, and 3.

**R12. Mistake navigation and states.** A list’s Practice action starts only that group’s session and retains the source `wordListId` throughout the session. When its final mistake is cleared, remove that group from the Mistakes screen. Show the existing All Caught Up state only when no active mistakes remain across any list. Word lists with zero mistakes do not require an empty mistake group.

**R13. API and repository.** Add authenticated `DELETE /api/v2/word-lists/:id`. Delete and edit reconciliation must be owner-scoped and transactional. A missing or non-owned list must return the same not-found behavior without revealing whether another user owns it. `GET /api/v2/state` must continue returning each mistake with its `wordListId` and current `wordListName` so grouping does not rely on names as identifiers.

**R14. Localization and accessibility.** Add English and Chinese labels/messages for Edit, Delete, deletion confirmation, Cancel, Save Changes, and list-specific mistake counts/actions. New controls must retain the v2 visual system, keyboard access, visible focus, minimum 44×44 px targets, semantic dialog behavior, and mobile support.

# Constraints

- Keep Neon PostgreSQL, Neon Managed Better Auth, Render deployment, and existing `/api/v2` authorization model.
- Do not change spelling correctness, pronunciation, session-size choices, authentication, or the approved v2 visual direction.
- Use `wordListId` as the stable relationship key; never group or authorize by list name.
- Do not persist randomized session order or introduce practice history.
- Database changes must use a new repeatable migration if schema changes are required; do not edit an already-applied production migration.

# Acceptance Criteria

**AC1.** A user can edit a list’s name and words; the result persists after refresh and login from another browser.

**AC2.** Removing a word during edit removes only that list’s matching active mistake; unchanged mistakes remain, and a rename updates the displayed group name.

**AC3.** Delete requires confirmation and, after success, removes the selected list and only its associated mistakes from Neon and the UI.

**AC4.** A user cannot edit or delete another account’s list by changing a request ID.

**AC5.** Normal sessions for 5/10/20/All are generated from a fresh shuffled copy, contain no duplicate selection, and do not mutate stored list order.

**AC6.** Mistake practice is started for one selected source list, uses a randomized order, and never includes another list’s mistakes.

**AC7.** An incorrect mistake-practice answer shows normal feedback, remains active, performs no redundant mistake write, and allows Next without a save-error Retry loop.

**AC8.** A correct mistake-practice answer deletes the exact mistake; a genuine delete failure retains it and Retry successfully repeats the delete.

**AC9.** The Mistakes screen groups data by `wordListId`, shows the current list name/count, and independently supports at least three lists with mistakes.

**AC10.** All existing v2 tests pass. New automated tests cover edit reconciliation, delete cascade/ownership, deterministic shuffle behavior, per-list mistake grouping, incorrect-answer no-write behavior, and correct-answer delete retry.

# Out of Scope

- Undo/recycle bin, bulk edit/delete, list sharing, folders, tags, or duplicate-list actions.
- Custom shuffle settings, fixed seeds, manual question ordering, spaced repetition, or practice history.
- Combined practice across multiple selected word lists or combined mistake practice across all lists.
- Any redesign of authentication, deployment, branding, or the established v2 UI system.
