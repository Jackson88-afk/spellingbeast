Spelling Bee - Product Specification
Version: 1.1

Status: Approved for Development

Product Type: Child-first web application

Primary Users: Children approximately 6-12 years old

Persistence: Browser-local only for v1

## 1. Product Goal

Build a simple, child-friendly web app that helps children approximately ages 6-12 practice spelling words from their own word lists.

The core learning loop is:

Word List -> Practice -> Spell -> Feedback -> Mistakes -> Practice Mistakes

The child should be able to use the application independently without requiring an adult dashboard, account, or cloud service.

The MVP should prioritize a clear and reliable spelling-practice experience over gamification or advanced learning analytics.

## 2. Target Users

### 2.1 Primary User

Children approximately 6-12 years old.

The UX should prioritize:

- Large and obvious controls
    
- Minimal text
    
- Clear visual feedback
    
- One focused task at a time
    
- Simple navigation
    
- Minimal configuration
    
- Responsive and mobile-friendly layout
    
- Keyboard-friendly interaction
    

### 2.2 Secondary Users

Parents and teachers may use the application indirectly.

However, the following are explicitly outside v1:

- Parent dashboard
    
- Teacher dashboard
    
- Child account management
    
- Teacher analytics
    
- Administrative controls
    

## 3. MVP Scope

The v1 MVP must support:

1. Creating and importing custom word lists.
    
2. Importing TXT word lists.
    
3. Importing simple CSV word lists.
    
4. Pasting words into a textarea.
    
5. Saving word lists locally in the browser.
    
6. Selecting a word list for practice.
    
7. Selecting a practice session size:
    
    - 5
        
    - 10
        
    - 20
        
    - All
        
8. Practicing one word at a time.
    
9. Explicitly playing a word using the browser Web Speech API.
    
10. Typing the spelling.
    
11. Submitting an answer.
    
12. Exact spelling evaluation after normalization.
    
13. Correct and incorrect feedback.
    
14. Automatically collecting incorrect words into an active Mistakes collection.
    
15. Not immediately retrying a missed word during the same normal session.
    
16. Showing a session summary.
    
17. Showing missed words in the session summary.
    
18. Practicing active mistakes through a dedicated Practice Mistakes flow.
    
19. Removing a mistake from the active Mistakes collection after it is answered correctly during Practice Mistakes.
    
20. Persisting word lists and active mistakes locally in the browser.
    

## 4. Explicit Non-Goals for v1

The following must not be implemented as part of the v1 MVP unless the product scope is explicitly changed:

- User accounts
    
- Login
    
- Cloud synchronization
    
- Backend database
    
- Parent dashboard
    
- Teacher dashboard
    
- Multiple-choice questions
    
- Fuzzy spelling matching
    
- Partial credit
    
- Phonetic matching
    
- Definitions
    
- Example sentences
    
- Phonetic hints
    
- Session history
    
- Daily streaks
    
- XP
    
- Coins
    
- Badges
    
- Leaderboards
    
- Avatars
    
- Lives or hearts
    
- Complex animations
    
- Mastered-word list
    
- Automatic re-injection of mistakes into normal sessions
    
- AI-generated word lists
    
- AI grading
    

## 5. Core User Flows

### 5.1 Flow A - Create or Import Word List

1. User opens the application.
    
2. User chooses to create or import a word list.
    
3. User chooses one of:
    
    - Paste words into textarea
        
    - Upload TXT
        
    - Upload CSV
        
4. Application parses the input.
    
5. Application validates the resulting words.
    
6. Application asks for or derives a list name.
    
7. Application saves the list locally.
    
8. User can select the list for practice.
    

### 5.2 Flow B - Normal Practice

1. User selects a word list.
    
2. User chooses a session size:
    
    - 5
        
    - 10
        
    - 20
        
    - All
        
3. User starts the session.
    
4. Application presents one spelling challenge.
    
5. Target spelling is not displayed.
    
6. User presses Play Word.
    
7. Browser SpeechSynthesis speaks the word.
    
8. User types the spelling.
    
9. User presses Submit.
    
10. Application evaluates the answer.
    
11. Application shows correct or incorrect feedback.
    
12. If incorrect:
    

- Add the word to active Mistakes.
    
- Do not immediately repeat the word.
    

13. User proceeds to the next word.
    
14. After the final word, application shows the session summary.
    

### 5.3 Flow C - Practice Mistakes

1. User opens Mistakes.
    
2. User sees active mistake words.
    
3. User selects Practice Mistakes.
    
4. Application starts a mistake-practice session.
    
5. User listens to each word.
    
6. User types the spelling.
    
7. User submits the answer.
    
8. If correct:
    
    - Remove the word from active Mistakes.
        
9. If incorrect:
    
    - Keep the word in active Mistakes.
        
10. Continue until the mistake session is complete.
    
11. If there are no remaining active mistakes, show an All Caught Up state.
    

## 6. Screen and Page Map

### 6.1 Home and Word Lists

Purpose: application starting point.

Should provide:

- Existing word lists
    
- Create or import word list
    
- Practice action
    
- Mistakes entry point
    

The screen should not behave like an adult analytics dashboard.

### 6.2 Create and Import Word List

Provide:

- Textarea for pasted words
    
- TXT upload
    
- CSV upload
    
- Validation feedback
    
- Error states
    
- Save or Create action
    

### 6.3 Practice Setup

Provide:

- Selected word list name
    
- Session size choices:
    
    - 5
        
    - 10
        
    - 20
        
    - All
        
- Start button
    

If a list contains fewer words than the selected number, use all available words.

For example, if a list contains 7 words and the child selects 10, the application practices 7 words.

### 6.4 Practice Screen

The practice screen should focus on one task.

It should provide:

- Progress indicator
    
- Play Word button
    
- Answer input
    
- Submit button
    
- Feedback
    
- Next action
    

The target spelling must not be visible before submission.

### 6.5 Session Summary

Show:

- Score
    
- Total attempted
    
- Number needing more practice
    
- Missed words
    
- Correct spelling for each missed word
    
- Practice Mistakes action when mistakes exist
    
- Return Home action
    

### 6.6 Mistakes Screen

Show:

- Number of active mistakes
    
- Active mistake words
    
- Practice Mistakes action
    
- Empty state
    

The empty state should clearly communicate that there are no words currently needing additional practice.

## 7. Word List Import Rules

### 7.1 Canonical Representation

The canonical word-list representation is one word per line.

Example:

apple  
beautiful  
calendar  
dictionary  
environment

### 7.2 Textarea Input

Textarea should accept one word per line.

Rules:

- Trim leading and trailing whitespace from each line.
    
- Ignore blank lines.
    
- Each remaining line represents one word.
    

### 7.3 TXT Input

A TXT file is interpreted as one word per line.

Rules are the same as textarea input:

- Trim surrounding whitespace.
    
- Ignore blank lines.
    
- Each remaining line represents one word.
    

### 7.4 CSV Input

v1 supports a simple CSV format.

The word is stored in the first column.

A CSV header named "word" may be recognized and ignored.

Additional semantic fields are not required for v1.

Definitions, descriptions, examples, phonetics, and parts of speech are not part of the v1 word model.

### 7.5 Validation

The application must:

- Reject unsupported file types.
    
- Handle empty input.
    
- Ignore blank lines.
    
- Trim surrounding whitespace.
    
- Avoid creating an empty word list.
    
- Show a clear error when no usable words are found.
    

### 7.6 Duplicate Words

Duplicate handling must be deterministic.

Recommended v1 behavior:

1. Trim whitespace.
    
2. Compare duplicate candidates case-insensitively.
    
3. Keep one canonical entry.
    
4. Do not create duplicate words in the same list.
    

For example, the following should result in one word:

Apple

apple

apple

## 8. Practice Behavior

Each practice item represents one target word.

The target spelling must not be displayed before submission.

The child may request pronunciation by pressing Play Word.

After submission:

Correct answer:

Show clear positive feedback.

Incorrect answer:

Show:

- Child's submitted answer
    
- Correct spelling
    

Then allow the child to continue.

A missed word is not immediately repeated in the same normal session.

## 9. Audio Requirements

Audio is a core part of the spelling-practice loop.

### 9.1 Technology

Use the browser Web Speech API and SpeechSynthesis.

No external audio service is required.

### 9.2 Interaction

Provide an explicit Play Word button.

Do not automatically play audio when a practice question appears.

### 9.3 Audio Failure

If speech synthesis is unavailable or fails:

- Show a visible error or failure state.
    
- Do not silently pretend the word was spoken.
    
- Allow the user to retry when practical.
    
- Keep the rest of the UI understandable.
    

Voice selection is not a v1 feature.

## 10. Correctness Rules

Correctness is intentionally strict.

Before comparing the answer:

1. Trim leading and trailing whitespace.
    
2. Compare case-insensitively.
    
3. Require exact string equality.
    

Examples:

Apple versus apple: Correct

apple with surrounding whitespace versus apple: Correct

APPLE versus apple: Correct

aple versus apple: Incorrect

appel versus apple: Incorrect

appple versus apple: Incorrect

Do not implement:

- Fuzzy matching
    
- Levenshtein distance
    
- Partial credit
    
- Common misspelling correction
    
- Phonetic matching
    
- Sound-alike matching
    

## 11. Mistakes Lifecycle

An active Mistake is a word that needs focused additional practice.

### 11.1 Adding Mistakes

When a child answers incorrectly during any practice session:

- Add the word to active Mistakes.
    
- Do not create duplicate active mistake entries.
    

### 11.2 Practice Mistakes

When practicing an active mistake:

Correct answer:

Remove the word from active Mistakes.

Incorrect answer:

Keep the word in active Mistakes.

### 11.3 Mastered State

v1 does not maintain a separate Mastered list.

Removing a word from active Mistakes means that it no longer requires active mistake practice.

It does not mean that the application permanently considers the word mastered.

Future versions may introduce more sophisticated mastery or spaced-repetition behavior.

## 12. Session Summary

After a normal practice session, show:

- Number correct
    
- Total number attempted
    
- Number needing more practice
    
- Words missed during the session
    
- Correct spelling for each missed word
    

When mistakes exist, provide a Practice Mistakes action.

No persistent session history is required.

## 13. Progress and Motivation

v1 uses lightweight progress information only.

During a session, show the current position, for example:

Word 4 of 10

At completion, show the score, for example:

You got 8 of 10 correct.

Do not implement:

- Streak counter
    
- XP
    
- Points
    
- Coins
    
- Badges
    
- Leaderboards
    
- Lives
    
- Hearts
    
- Reward systems
    
- Competitive ranking
    

The product should remain learning-first.

## 14. Persistence

All persistent application data is local to the browser.

No account is required.

No backend is required.

No cloud synchronization is required.

### 14.1 Word List

Conceptual structure:

WordList

- id
    
- name
    
- words
    
- createdAt
    
- updatedAt
    

The exact implementation structure may vary.

### 14.2 Mistake

Conceptual structure:

Mistake

- id or deterministic word/list key
    
- wordListId
    
- word
    
- active
    
- optional timestamps
    

The implementation may simplify this structure as appropriate.

### 14.3 Practice Session

Practice session state only needs to exist while the session is active.

Permanent session-history persistence is not required in v1.

## 15. Recommended Technical Direction

These are implementation recommendations, not product requirements.

### 15.1 Persistence

IndexedDB is recommended if the data model grows.

localStorage is acceptable if it produces a simpler and reliable implementation.

### 15.2 Architecture

Keep product logic separated from UI where practical.

Important domain logic should be independently testable where practical:

- Word parsing
    
- Normalization
    
- Correctness checking
    
- Session generation
    
- Mistake lifecycle
    
- Persistence
    

## 16. UX Principles

The application should be:

- Child-first
    
- Calm
    
- Focused
    
- Simple
    
- Obvious
    
- Responsive
    
- Keyboard-friendly
    
- Accessible
    

The practice screen should emphasize:

Listen -> Spell -> Submit -> Feedback -> Next

Avoid unnecessary menus and settings.

## 17. Edge Cases

The implementation must consider:

1. Empty word list.
    
2. Unsupported file type.
    
3. Empty TXT file.
    
4. Empty CSV file.
    
5. CSV with no usable first-column values.
    
6. Blank lines.
    
7. Duplicate words.
    
8. List smaller than requested session size.
    
9. Empty submitted answer.
    
10. Browser TTS unavailable.
    
11. Browser TTS error.
    
12. No active mistakes.
    
13. Refresh or navigation during an active session.
    

For behavior not explicitly defined by this document:

- Choose the simplest behavior consistent with the product goals.
    
- Do not silently introduce new product requirements.
    
- Document meaningful implementation decisions.
    

## 18. Acceptance Criteria

### 18.1 Word Lists

- User can paste one word per line.
    
- User can import TXT.
    
- User can import simple CSV.
    
- Blank lines are ignored.
    
- Surrounding whitespace is ignored.
    
- Empty or invalid input produces a clear error.
    
- Duplicate words do not create duplicate entries.
    
- Saved word lists survive browser refresh.
    

### 18.2 Practice

- User can select a word list.
    
- User can select 5, 10, 20, or All.
    
- If fewer words exist than the selected size, all available words are used.
    
- Target spelling is hidden before submission.
    
- Play Word is explicitly triggered by the user.
    
- Browser speech synthesis is used.
    
- Audio failure is visibly communicated.
    
- User can type and submit an answer.
    
- Surrounding whitespace is ignored.
    
- Case differences are ignored.
    
- Other spelling differences are incorrect.
    
- Incorrect words enter active Mistakes.
    
- Missed words are not immediately retried during the same normal session.
    

### 18.3 Feedback

- Correct submissions show positive feedback.
    
- Incorrect submissions show the submitted answer.
    
- Incorrect submissions show the correct spelling.
    
- User can continue after feedback.
    

### 18.4 Summary

- Summary shows correct and total.
    
- Summary shows number needing more practice.
    
- Summary shows missed words.
    
- Summary shows correct spelling for missed words.
    
- Practice Mistakes is available when mistakes exist.
    

### 18.5 Mistakes

- Active mistakes are visible.
    
- Practice Mistakes starts a focused mistake session.
    
- Correctly answering a mistake removes it from active Mistakes.
    
- Incorrectly answering a mistake keeps it active.
    
- Duplicate active mistake entries are prevented.
    
- Empty Mistakes state communicates that the user is caught up.
    

### 18.6 Persistence

- Word lists persist after refresh.
    
- Active mistakes persist after refresh.
    
- No account is required.
    
- No cloud backend is required.
    

## 19. Definition of Done

The MVP is complete when:

1. All acceptance criteria pass.
    
2. The complete core loop works:
    

Import -> Select -> Practice -> Mistake -> Summary -> Practice Mistakes -> Clear Mistakes

3. Word lists survive browser refresh.
    
4. Active mistakes survive browser refresh.
    
5. Audio works on supported browsers.
    
6. Audio failure is visibly communicated when unsupported or unavailable.
    
7. Critical correctness logic is tested.
    
8. Import logic is tested.
    
9. Mistake lifecycle is tested.
    
10. Persistence behavior is tested.
    
11. Application works on desktop and a mobile-sized viewport.
    
12. No explicitly excluded v1 feature is required to use the core application.
    

## 20. Future Considerations

Potential future features include:

- Parent dashboard
    
- Teacher dashboard
    
- User accounts
    
- Cloud synchronization
    
- Session history
    
- Daily streaks
    
- Spaced repetition
    
- Mastered words
    
- Definitions
    
- Example sentences
    
- Phonetic hints
    
- Advanced pronunciation controls
    
- More import formats
    
- AI-assisted word lists
    
- Lightweight gamification
    
- PWA and offline enhancements
    

These are future considerations only.

They must not be implemented as part of v1 without explicit scope approval.

## 21. v1.1 Localization and Pronunciation

### 21.1 Language

The default interface language is English.

A visible language button allows the user to switch the complete interface to Chinese and back to English.

The selected interface language is persisted in browser-local storage.

Word-list content is not translated.

### 21.2 American English Pronunciation

When the user presses Play Word, the application requests American English pronunciation using the browser Web Speech API and `en-US`.

When an `en-US` voice is available, it is preferred. If the browser does not provide an American English voice, the application may use the browser's available English fallback voice and must preserve the existing visible failure handling.

No external audio service is required.

## 22. Developer Governance

This document is the product source of truth.

If implementation reveals a product ambiguity:

1. Do not silently change the requirement.
    
2. Explain the ambiguity.
    
3. Explain its implementation impact.
    
4. Propose options if useful.
    
5. Request a product decision when necessary.
    
6. Record approved decisions in decisions_spelling.md.
    
7. Update this specification when the approved decision changes product behavior.
    

Technical implementation choices that do not change product behavior may be made by the Developer.

The Developer must not expand product scope merely because a feature is technically easy to implement.