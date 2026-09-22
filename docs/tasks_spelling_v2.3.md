# SpellingBeast v2.3 — Developer Tasks

Source of truth: `docs/spec_spelling_v2.3.md`  
Branch: `feat/adventure-map-v2.3`

```text
TASK-230 — Visual primitives
- Create reusable local SVG/CSS primitives for bee, cloud, hill, leaf/flower, flag, lock, speaker, pencil, check, retry, arrow, and stars.
- Decorative instances must be aria-hidden and pointer-events:none; control icons must inherit accessible button names.
Done when: no external asset/dependency is added and primitives render in both themes/locales.

TASK-231 — Winding journey map
- Replace the level grid with one ascending DOM list on a connected left/center/right visual path.
- Render completed, recommended, available, and locked node states; start unlocked nodes directly.
- Show stars, bee marker, lock, finish flag, and localized accessible state text.
Done when: 1/3/10/30-level fixtures render in order with no missing nodes or interactive locked nodes.

TASK-232 — Map positioning and navigation
- Compute the recommended level from confirmed progress and bring it into view on entry/return without stealing focus.
- Preserve replay access and ascending keyboard order.
Done when: newly unlocked level is visible after completion and keyboard behavior remains predictable.

TASK-233 — Illustrated Adventure practice
- Add the compact scene, visual progress steps, and speaker/pencil/check/retry/arrow primitives.
- Preserve Progress → Play → Type → Submit → Feedback → Next and all answer/audio behavior.
- Keep visible concise labels for primary actions.
Done when: no extra step is introduced and existing practice state tests still pass.

TASK-234 — Completion hierarchy and motion
- Center earned-star feedback and enforce one primary action: Next Level, else Retry Level; keep Level Map secondary and Retry Save dominant on save failure.
- Add only the allowed <=1.2s motion and full reduced-motion overrides.
Done when: every completion/save state has one unambiguous next action.

TASK-235 — Responsive, localization, accessibility
- Validate English/Chinese at 320×568, 390×844, and desktop.
- Prevent overflow/overlap; maintain >=48px nodes/primary controls, focus rings, contrast, semantic labels, and decorative isolation.
Done when: keyboard and DOM accessibility checks pass in both locales.

TASK-236 — Regression and release evidence
- Extend Adventure unit/DOM/browser tests for map state, order, positioning, locales, responsive widths, icon names, decorative isolation, and reduced motion.
- Run npm test and all UI E2E scripts; update implementation/progress docs with real evidence.
- Commit and push only `feat/adventure-map-v2.3`; do not merge main or auto-merge a PR.
Done when: all runnable tests pass and local/remote branch SHAs match.
```
