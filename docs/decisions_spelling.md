Spelling Bee - Decision Log
Specification: spec_spelling.md

Specification Version: 1.1

Status: Locked for v1.1

## 1. Purpose

This document records the product decisions made during the Product Discovery process.

These decisions are considered locked for v1.

If a future requirement conflicts with one of these decisions, the change should be explicitly discussed and recorded before implementation.

## 2. Product Decisions

### DEC-001 - Primary User

Decision:

The primary user is a child approximately 6-12 years old.

The child should be able to use the application independently.

Status: Locked

### DEC-002 - Adult Users

Decision:

Parents and teachers may use the application indirectly.

No parent dashboard or teacher dashboard is included in v1.

Status: Locked

### DEC-003 - Word List Input

Decision:

v1 supports three ways to create a word list:

- TXT file
    
- Simple CSV file
    
- Textarea paste
    

The canonical representation is one word per line.

Status: Locked

### DEC-004 - Practice Model

Decision:

The core practice interaction is:

Play Word -> Type -> Submit -> Feedback -> Next

Multiple-choice questions are not included.

Status: Locked

### DEC-005 - Audio

Decision:

Audio is a core part of the practice experience.

The application uses the browser Web Speech API and SpeechSynthesis.

Audio is triggered through an explicit Play Word button.

Audio is not automatically played when a question appears.

If audio is unavailable or fails, the application must show a visible failure state.

Status: Locked

### DEC-006 - Correctness

Decision:

Correctness uses the following rules:

1. Trim leading and trailing whitespace.
    
2. Compare case-insensitively.
    
3. Require exact string equality.
    

No fuzzy matching, phonetic matching, or partial credit is used.

Status: Locked

### DEC-007 - Definitions

Decision:

Definitions are not included in v1.

The word data model does not need to contain definitions.

Status: Locked

### DEC-008 - Phonetic Hints

Decision:

Phonetic hints are not included in v1.

Words are represented as plain spelling strings.

Status: Locked

### DEC-009 - Session Size

Decision:

The child can select one of four session sizes:

- 5
    
- 10
    
- 20
    
- All
    

If the selected size is greater than the number of available words, the application uses all available words.

Status: Locked

### DEC-010 - Normal Session Retry

Decision:

A missed word does not immediately repeat during the same normal practice session.

Instead, the word is added to the active Mistakes collection.

Status: Locked

### DEC-011 - Mistake Collection

Decision:

An incorrectly answered word is automatically added to active Mistakes.

Duplicate active mistake entries are not allowed.

Status: Locked

### DEC-012 - Practice Mistakes

Decision:

Practice Mistakes is a separate practice flow.

When a mistake is answered correctly during Practice Mistakes:

The word is removed from active Mistakes.

When a mistake is answered incorrectly:

The word remains in active Mistakes.

Status: Locked

### DEC-013 - Mastered Words

Decision:

v1 does not maintain a separate Mastered list.

Removing a word from active Mistakes means that the word no longer requires active mistake practice.

It does not mean that the application permanently considers the word mastered.

Status: Locked

### DEC-014 - Session Summary

Decision:

The session summary displays:

- Correct count
    
- Total attempted
    
- Number needing more practice
    
- Missed words
    
- Correct spelling for missed words
    

When mistakes exist, the summary provides a Practice Mistakes action.

Status: Locked

### DEC-015 - Progress

Decision:

v1 provides lightweight progress information during a session.

The child should see the current position, such as:

Word 4 of 10

Persistent session history is not included.

Status: Locked

### DEC-016 - Streaks

Decision:

Daily streaks are not included in v1.

Status: Locked

### DEC-017 - Gamification

Decision:

v1 does not include:

- XP
    
- Points
    
- Coins
    
- Badges
    
- Leaderboards
    
- Avatars
    
- Lives
    
- Hearts
    
- Competitive ranking
    
- Reward systems
    

The product should remain learning-first.

Status: Locked

### DEC-018 - Persistence

Decision:

Application data is stored locally in the browser.

No user account is required.

No cloud synchronization is required.

Status: Locked

### DEC-019 - Backend

Decision:

No backend or database service is required for v1.

Status: Locked

### DEC-020 - Interface Language

Decision:

The default interface language is English.

A visible language toggle switches all interface text between English and Chinese.

The selected language is persisted locally in the browser. Word-list content is not translated.

Status: Locked

### DEC-021 - American English Pronunciation

Decision:

Speech playback requests `en-US` and prefers an available American English browser voice.

Because voice availability is controlled by the browser and operating system, an American voice cannot be guaranteed on every device. If unavailable, an English fallback voice may be used and the existing failure state remains required.

No external audio service is introduced.

Status: Locked

## 3. Technical Recommendations

The following are recommendations rather than product requirements.

### REC-001 - Persistence Technology

IndexedDB is recommended if the data model grows or if more sophisticated persistence is required.

localStorage is acceptable if it provides a sufficiently simple and reliable implementation for the MVP.

The Developer may choose the implementation technology as long as the required product behavior is preserved.

### REC-002 - Duplicate Detection

Recommended duplicate handling:

1. Trim surrounding whitespace.
    
2. Compare words case-insensitively.
    
3. Keep one canonical entry.
    

The implementation may use any appropriate technical mechanism to achieve this behavior.

### REC-003 - Domain Logic

Important business logic should be kept independently testable where practical.

This includes:

- Word parsing
    
- Word normalization
    
- Correctness checking
    
- Session generation
    
- Mistake lifecycle
    
- Persistence
    

## 4. Product Scope Rules

The following principles apply to all implementation decisions.

### Rule 1

Do not add product features simply because they are technically easy to implement.

### Rule 2

Do not remove a required feature without explicitly documenting the reason.

### Rule 3

Do not silently change locked product behavior.

### Rule 4

If implementation exposes an ambiguity that affects user-visible behavior, raise it for product decision.

### Rule 5

Technical implementation decisions may be made by the Developer when they do not materially change the product behavior.

## 5. Change Process

If a product decision needs to change:

1. Identify the existing decision.
    
2. Explain why the change is needed.
    
3. Explain the impact on the product.
    
4. Propose the new behavior.
    
5. Obtain explicit approval.
    
6. Add a new decision or update the relevant decision.
    
7. Update spec_spelling.md.
    
8. Update tasks_spelling.md if implementation tasks change.
    
9. Update progress_spelling.md.
    

Until this process is completed, the existing decision remains authoritative.

## 6. Current Decision Status

All v1 product decisions required for development are currently locked.

No open product decisions remain for the initial implementation.