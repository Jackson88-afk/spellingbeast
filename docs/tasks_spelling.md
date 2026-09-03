# Spelling Bee - Developer Task Plan

Specification: spec_spelling.md

Decision Log: decisions_spelling.md

Status: Ready for Development

## 1. Purpose

This document converts the product specification into an implementation-oriented task plan.

The Developer should implement the application incrementally and verify each phase before moving to the next.

The Developer must follow spec_spelling.md as the product source of truth.

Do not expand the v1 scope without explicit product approval.

# Phase 0 - Project Foundation

## TASK-001 - Inspect Repository

Inspect the existing repository before making major changes.

Determine:

- Framework
    
- Dependencies
    
- Application entry point
    
- Existing components
    
- Routing
    
- Styling system
    
- State management
    
- Persistence approach
    
- Testing setup
    
- Build system
    
- Development commands
    
- Deployment configuration
    

Do not replace the existing technology stack unless there is a strong technical reason.

Expected result:

The Developer understands the current project structure and can explain the proposed implementation approach.

## TASK-002 - Confirm Application Structure

Establish or confirm the application structure.

Identify:

- Application entry point
    
- Main routes or screens
    
- Component structure
    
- Domain logic location
    
- Persistence layer
    
- Test structure
    

Prefer a simple architecture appropriate for a small local-first application.

Expected result:

There is a clear structure for implementing the MVP.

## TASK-003 - Persistence Layer

Implement a browser-local persistence abstraction.

It should support:

- Saving word lists
    
- Loading word lists
    
- Updating word lists
    
- Saving active mistakes
    
- Loading active mistakes
    
- Removing mistakes
    

The persistence implementation should be isolated from UI components where practical.

Expected result:

Persistent application data can survive browser refresh.

# Phase 1 - Word Lists

## TASK-010 - Word List Model

Implement the WordList domain model.

Minimum conceptual fields:

- id
    
- name
    
- words
    
- createdAt
    
- updatedAt
    

The exact implementation structure may vary.

Do not add definitions, phonetic hints, or other semantic fields in v1.

## TASK-011 - Textarea Import

Implement pasted word-list input.

Requirements:

- One word per line.
    
- Trim surrounding whitespace.
    
- Ignore blank lines.
    
- Validate usable words.
    
- Handle duplicates deterministically.
    
- Prevent creation of an empty list.
    

## TASK-012 - TXT Import

Implement TXT file import.

Requirements:

- Interpret each line as one word.
    
- Trim surrounding whitespace.
    
- Ignore blank lines.
    
- Apply the same normalization rules as textarea input.
    
- Handle empty or invalid files clearly.
    

## TASK-013 - CSV Import

Implement simple CSV import.

Requirements:

- The word is stored in the first column.
    
- A header named word may be recognized and ignored.
    
- Blank rows are ignored.
    
- Empty or unusable input is rejected or clearly reported.
    

Do not implement:

- Definitions
    
- Examples
    
- Phonetics
    
- Parts of speech
    
- Other semantic fields
    

## TASK-014 - Word List Validation

Implement validation for:

- Empty input
    
- Unsupported file type
    
- Empty TXT file
    
- Empty CSV file
    
- CSV with no usable first-column values
    
- Blank lines
    
- Surrounding whitespace
    
- Duplicate words
    

Validation errors should be understandable to the intended user.

## TASK-015 - Persist Word Lists

Ensure saved word lists survive:

- Page refresh
    
- Browser restart where browser storage permits
    

No server persistence is required.

## TASK-016 - Word Lists UI

Build the child-friendly Word Lists screen.

It should provide:

- Existing word lists
    
- Create or import word list
    
- Practice action
    
- Mistakes entry point
    

The UI should avoid adult-oriented analytics or configuration complexity.

# Phase 2 - Practice Engine

## TASK-020 - Practice Session Creation

Implement session creation for:

- 5 words
    
- 10 words
    
- 20 words
    
- All words
    

If the selected number is larger than the available number of words, use all available words.

The Developer should decide whether words are randomized.

If randomization is implemented, it must not change the meaning of correctness or mistake tracking.

## TASK-021 - Practice State Machine

Implement the normal practice lifecycle.

Conceptually:

ready

question

answering

submitted

feedback

next

complete

The exact internal state representation may differ.

The target spelling must never be exposed before submission.

## TASK-022 - Answer Normalization

Implement answer normalization:

1. Trim leading whitespace.
    
2. Trim trailing whitespace.
    
3. Compare case-insensitively.
    
4. Require exact string equality.
    

Do not implement fuzzy matching.

## TASK-023 - Answer Submission

Implement:

- Answer input
    
- Submit action
    
- Correctness evaluation
    
- Correct feedback
    
- Incorrect feedback
    
- Next action
    

After submission, the user must be able to understand whether the answer was correct.

## TASK-024 - Audio

Implement Play Word using the browser Web Speech API and SpeechSynthesis.

Requirements:

- Audio starts only after explicit user interaction.
    
- The word is spoken using browser speech synthesis.
    
- No external audio service is required.
    

## TASK-025 - Audio Failure Handling

Handle:

- Unsupported browser
    
- Speech synthesis unavailable
    
- Speech synthesis error
    

Show a visible failure state.

Do not silently pretend that audio played.

Where practical, allow the child to retry.

## TASK-026 - Practice UI

Build the child-focused practice screen.

Required elements:

- Progress indicator
    
- Play Word button
    
- Answer input
    
- Submit button
    
- Feedback
    
- Next action
    

The interface should focus on one spelling task at a time.

# Phase 3 - Mistakes

## TASK-030 - Mistake Model

Implement active Mistakes.

A mistake should contain enough information to identify the relevant word and its word list.

The exact data model may vary.

Do not create a separate Mastered list.

## TASK-031 - Add Mistake

When an answer is incorrect:

- Add the word to active Mistakes.
    
- Prevent duplicate active mistake entries.
    
- Associate the mistake with the relevant word list.
    

## TASK-032 - Persist Mistakes

Active Mistakes must survive browser refresh.

Changes to the active Mistakes collection must be persisted.

## TASK-033 - Mistakes UI

Build the Mistakes screen.

Show:

- Active mistake count
    
- Active mistake words
    
- Practice Mistakes action
    
- Empty state
    

The empty state should clearly communicate that there are no current mistakes.

## TASK-034 - Practice Mistakes

Implement a focused Practice Mistakes session.

The interaction should use the same basic practice loop:

Play Word -> Type -> Submit -> Feedback -> Next

The target spelling must remain hidden until submission.

## TASK-035 - Remove Correct Mistake

During Practice Mistakes:

If the answer is correct:

- Remove the word from active Mistakes.
    
- Persist the updated state.
    

## TASK-036 - Keep Incorrect Mistake

During Practice Mistakes:

If the answer is incorrect:

- Keep the word active.
    
- Show the correct spelling after submission.
    
- Continue the session.
    

## TASK-037 - All Caught Up State

When there are no remaining active mistakes:

Show a clear All Caught Up state.

The user should be able to return to the main application flow.

# Phase 4 - Session Summary and Integration

## TASK-040 - Session Summary

Build the session summary screen.

Show:

- Correct count
    
- Total attempted
    
- Number needing more practice
    
- Missed words
    
- Correct spelling for missed words
    

## TASK-041 - Missed Word Details

For every missed word, show:

- Word
    
- Correct spelling
    

The correct spelling must only be revealed after the answer has been submitted.

## TASK-042 - Practice Mistakes Action

When a session contains mistakes:

Provide a Practice Mistakes action.

When there are no mistakes, do not require the user to enter the Mistakes flow.

## TASK-043 - Navigation Integration

Implement the complete primary flow:

Home

Word List

Practice Setup

Practice

Session Summary

Mistakes

Practice Mistakes

# Phase 5 - Testing

## TASK-050 - Correctness Tests

Test:

- Case-insensitive matches
    
- Leading whitespace
    
- Trailing whitespace
    
- Exact matches
    
- Incorrect spellings
    
- Empty answers
    

Required examples:

Apple versus apple should be correct.

apple with surrounding whitespace versus apple should be correct.

APPLE versus apple should be correct.

aple versus apple should be incorrect.

appel versus apple should be incorrect.

appple versus apple should be incorrect.

## TASK-051 - Import Tests

Test:

- Textarea input
    
- TXT import
    
- CSV import
    
- Blank lines
    
- Surrounding whitespace
    
- Duplicate words
    
- Empty input
    
- Invalid input
    
- Unsupported file types
    

## TASK-052 - Session Tests

Test:

- Session size 5
    
- Session size 10
    
- Session size 20
    
- Session size All
    
- Word list smaller than selected session size
    
- Correct answers
    
- Incorrect answers
    
- Missed words not immediately retried during normal practice
    

## TASK-053 - Mistake Lifecycle Tests

Test the following flow:

Normal Practice

Incorrect answer

Active Mistake

Practice Mistakes

Correct answer

Mistake removed

Also test:

Practice Mistakes

Incorrect answer

Mistake remains active

## TASK-054 - Persistence Tests

Verify:

- Word lists survive refresh.
    
- Mistakes survive refresh.
    
- Removing a mistake persists.
    
- Duplicate mistakes are prevented.
    

## TASK-055 - Audio Tests

Verify:

- Play Word invokes speech synthesis.
    
- Audio is not automatically triggered when the question appears.
    
- Speech synthesis errors are handled.
    
- Unsupported audio capability produces a visible failure state.
    

If browser automation cannot reliably verify actual audio output, test the application-level speech invocation and error handling.

# Phase 6 - UX and Quality

## TASK-060 - Responsive Review

Test the application on:

- Desktop viewport
    
- Tablet-sized viewport
    
- Mobile-sized viewport
    

The core practice experience should remain usable at all supported sizes.

## TASK-061 - Accessibility Review

Check:

- Keyboard navigation
    
- Focus states
    
- Input labels
    
- Button labels
    
- Semantic HTML where appropriate
    
- Accessible error messaging
    
- Screen-reader understandable controls
    

## TASK-062 - Child UX Review

Review the application from the perspective of a 6-12 year old.

Check that:

- Primary actions are obvious.
    
- Text is concise.
    
- Instructions are easy to understand.
    
- Practice is visually focused.
    
- Feedback is easy to understand.
    
- Navigation is simple.
    
- Technical terminology is not exposed to the child.
    

## TASK-063 - Final Acceptance Review

Verify every acceptance criterion in spec_spelling.md.

Do not declare the MVP complete until all required criteria pass.

# Phase 7 - Documentation

## TASK-070 - README

Document:

- What the application does
    
- How to install dependencies
    
- How to run locally
    
- How to test
    
- How to build
    
- How to deploy, if deployment configuration exists
    

## TASK-071 - Implementation Notes

Document important technical decisions that materially affect maintainability.

Examples:

- Persistence technology
    
- Data model decisions
    
- Browser compatibility decisions
    
- Testing approach
    

## TASK-072 - Progress Update

Update progress_spelling.md with:

- Completed tasks
    
- Current task
    
- Blockers
    
- Deviations from specification
    
- Important implementation notes
    

# Phase 8 - Localization

## TASK-080 - Localization Specification Update

Update the approved specification and decision log for English default, Chinese toggle, local language preference, and untranslated word-list content.

## TASK-081 - Localization Model

Implement a small UI translation dictionary and locale state for all user-facing interface text.

## TASK-082 - Language Toggle

Add a visible language button that switches the complete interface between English and Chinese and persists the preference locally.

## TASK-083 - Localization Tests and Acceptance

Test both locales, default English behavior, persistence after refresh, complete UI coverage, and browser interaction.

# Phase 9 - American English Pronunciation

## TASK-090 - en-US Speech Request

Request `en-US` pronunciation and prefer an available `en-US` browser voice while preserving explicit user-triggered playback.

## TASK-091 - Pronunciation Tests

Test the `en-US` utterance/voice preference and existing unsupported, unavailable, and synthesis-error handling.

## TASK-092 - Pronunciation Browser Acceptance

Verify the browser receives the intended `en-US` speech configuration and the visible failure state remains usable.

# Phase 10 - UI Redesign

UI redesign follows `DESIGN.md` and the approved direction: simple modern rounded surfaces, centered single-column compositions, minimal scrolling, clear child-friendly hierarchy, and no change to product behavior.

## TASK-100 - Visual Design Contract

Create and validate the project-level `DESIGN.md` with approved colors, typography, spacing, radii, widths, button hierarchy, responsive rules, accessibility rules, and explicit v1 exclusions.

## TASK-101 - Shared Visual Foundation

Apply the approved design tokens and shared layout, typography, controls, focus, status, and responsive styles without changing selectors or product behavior.

## TASK-102 - Home / Word Lists UI

Redesign only the home and Word Lists presentation: centered composition, clear Add Word List primary action, readable saved-list rows, secondary Mistakes entry point, and concise empty state.

## TASK-103 - Create / Import Word List UI

Redesign only the create/import screen as a focused single-page form with clear grouping, validation placement, and Save/Cancel hierarchy.

## TASK-104 - Practice Setup UI

Redesign only list and session-size selection, making the selected size and Start action obvious and accessible without adding options.

## TASK-105 - Active Practice UI

Redesign only the active practice presentation around the sequence Progress -> Play -> Type -> Submit -> Feedback -> Next while preserving the state machine.

## TASK-106 - Session Summary UI

Redesign only the completion summary and missed-word presentation, including a clear result hierarchy and Practice Mistakes action when applicable.

## TASK-107 - Mistakes UI

Redesign only the Mistakes screen, active mistake list, empty state, and All Caught Up state.

## TASK-108 - Accessibility and Responsive Hardening

Verify and fix cross-page target sizes, focus order, selected semantics, focus after view changes, contrast, reduced motion, and overflow.

## TASK-109 - Full Regression and Visual Acceptance

Run all tests and coordinator browser checks against the product specification across desktop, mobile, keyboard, localization, audio, empty, error, and completion states.

# Developer Working Rules

1. Read spec_spelling.md before implementation.
    
2. Read decisions_spelling.md before making product-impacting decisions.
    
3. Follow tasks_spelling.md incrementally.
    
4. Do not silently change product behavior.
    
5. Do not add excluded v1 features.
    
6. Technical implementation choices are allowed when they do not change product behavior.
    
7. If a product ambiguity blocks implementation, report it rather than guessing.
    
8. Run relevant tests before claiming completion.
    
9. Keep progress_spelling.md updated.
    
10. Clearly report any deviation from the specification.
    
11. Keep implementation changes focused and avoid unnecessary refactoring.
    
12. Do not replace working project infrastructure without a clear reason.
    

# Recommended First Action

Start with TASK-001.

Inspect the existing repository and understand the current technology stack.

Before implementing major functionality, report:

- Current project structure
    
- Relevant existing infrastructure
    
- Proposed implementation approach
    
- Any genuine blockers
    

Do not start by rewriting the repository.