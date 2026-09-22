# SpellingBeast — Product Specification v2.3

**Status:** Approved for Development  
**Base specification:** `spec_spelling_v2.2.md`  
**Release theme:** Illustrated Adventure Journey

# Goal

Make Adventure feel like a simple children’s game through a winding level journey, friendly illustrations, and clearer visual feedback. Preserve the existing one-step-at-a-time learning flow so a child always knows what to tap next.

# Scope

- Replace the Adventure level grid with a vertically winding journey map.
- Add lightweight decorative scenes and familiar icons to Adventure practice and completion.
- Strengthen visual distinction among completed, current, available, and locked levels.
- Keep all v2.2 game rules, progress, persistence, bilingual behavior, and free/mistake practice unchanged.

# Requirements

**R1. Journey map.** Render levels as a single vertical path that gently alternates left, center, and right. Level 1 appears first and reading/tab order always follows ascending level number. A visible trail connects consecutive nodes without becoming an interactive control.

**R2. Level nodes.** Each level is represented by a large circular node containing its number. Completed nodes show 1–3 visible stars; the recommended next level shows a small bee marker and one clear Start cue; later unlocked nodes appear available; locked nodes show a lock symbol. Status must also be available as localized accessible text.

**R3. Direct interaction.** Selecting any unlocked node starts that level immediately. Locked nodes are disabled and cannot receive focus. The map must not add dialogs, inventory, lives, currencies, or extra setup steps. Only the recommended next level receives primary visual emphasis.

**R4. Map orientation.** On entry, the map positions the recommended next level within the viewport without moving keyboard focus unexpectedly. Returning from a completed level shows the newly unlocked node. Children can still scroll to replay earlier completed levels.

**R5. Illustrated world.** Add a calm, reusable illustration layer using local inline SVG and/or CSS shapes only: bee mascot, clouds, flowers/leaves, hills, and a finish flag. Decorations must remain behind content, use the existing warm palette, avoid visual noise, never capture pointer events, and never carry required information.

**R6. Adventure practice scene.** Adventure practice keeps the sequence Progress → Play Word → Type → Submit → Feedback → Next. Add a compact scene/mascot, visual progress steps, and familiar speaker, pencil, check, retry, and arrow symbols where relevant. Primary controls retain short visible labels; icons may replace repeated explanatory text but must not replace accessible names.

**R7. Feedback and completion.** Correct and incorrect feedback use distinct positive illustrations plus concise text. Completion visually centers earned stars and offers exactly one primary next action: Next Level when available and saved, otherwise Retry Level. Level Map remains secondary. Save failure continues to prioritize Retry Save and must not expose an unlocked next level.

**R8. Motion.** Permitted motion is limited to a subtle recommended-node pulse, bee arrival, and star reveal, each non-blocking and no longer than 1.2 seconds. Disable all nonessential motion under `prefers-reduced-motion`.

**R9. Responsive behavior.** The path must work from 320px mobile width through desktop without horizontal page scrolling. Decorative density reduces on small screens. Nodes and primary controls remain at least 48×48 px and must not overlap labels, trails, or decorations.

**R10. Localization and accessibility.** English and Chinese layouts must support the same states. Preserve semantic headings, logical DOM/tab order, visible focus, contrast, screen-reader names, and text equivalents for stars, lock state, correctness, and progress. Do not use color, position, icon, or motion as the only indicator.

# Constraints

- Keep the native HTML/CSS/JS stack and current visual tokens; add no UI, animation, game, font, or image dependency.
- Prefer reusable inline SVG symbols and CSS classes over repeated markup or emoji whose appearance varies by platform.
- Do not change scoring, unlocking, shuffle, spelling correctness, audio, persistence, API, database, authentication, or migration behavior.
- Implement on `feat/adventure-map-v2.3`; do not modify or merge `main`.

# Acceptance Criteria

**AC1.** Lists producing 1, 3, 10, and 30 levels render an ascending, connected, alternating journey with no missing or duplicated nodes.

**AC2.** Completed, recommended, later-unlocked, and locked states are visually distinct and have accurate English/Chinese accessible labels; only unlocked levels can start.

**AC3.** Entering and returning to the map brings the recommended node into view, preserves logical focus behavior, and permits replay of completed levels.

**AC4.** Adventure practice and completion show the specified illustrations/icons while retaining one obvious primary next action and the existing answer/audio/save lifecycle.

**AC5.** At 320×568, 390×844, and desktop viewports, there is no horizontal overflow, node overlap, clipped focus ring, or obscured control.

**AC6.** Keyboard-only operation can enter Adventure, traverse unlocked nodes in level order, complete a level, and return to the map. Screen-reader names contain level number and state.

**AC7.** Reduced-motion mode disables the node, bee, and star animations. Decorations are ignored by assistive technology and do not intercept clicks.

**AC8.** `npm test` and all existing UI E2E tests pass; new browser coverage verifies map states, ascending tab order, auto-positioning, both locales, responsive widths, icon accessibility, and reduced motion.

# Out of Scope

- New rewards or rules: lives, hearts, coins, XP, streaks, boosters, timers, shops, avatars, badges, or leaderboards.
- Dragging, branching paths, world selection, map editing, animated characters, particle systems, sound effects, or external artwork.
- Redesign of Home, list management, Free Practice, Mistakes, authentication, backend, or data models.
