# Spelling Bee — Product Specification v2

**Status:** Ready for Development  
**Supersedes:** v1.1 for v2 implementation  
**Primary users:** Children approximately 6–12 years old

# Goal

Upgrade the existing SpellingBeast web app with durable Neon PostgreSQL storage, simple user registration/login, and a quieter, premium, Google-like minimalist interface. Preserve the complete v1.1 learning loop and bilingual UI while allowing a user to recover the same word library across browsers and devices.

# Scope

- Persist word lists and active mistakes in Neon PostgreSQL through a Render-hosted backend API.
- Use Neon Managed Better Auth with verified email/password registration, login, logout, session restoration, and password reset.
- Migrate existing `localStorage` word lists and active mistakes into the authenticated account without data loss.
- Deploy the static frontend and API as one Render Web Service using same-origin `/api/v2/*` routes.
- Redesign all existing screens with a consistent minimalist visual system.
- Keep the previously approved UI requirements unchanged; add only the minimum account screens and Log Out control required by authentication.
- Preserve v1.1 import, practice, feedback, mistake lifecycle, localization, pronunciation, responsive behavior, and accessibility.

# Requirements

## Account and backend persistence

**R1.** The app must provide minimal bilingual account screens for Sign Up, Verify Email, Log In, Forgot Password, Reset Password, and Log Out. Registration requires only a parent/guardian-controlled email address and password; do not request the child’s name, birth date, school, profile photo, or other profile data. If the auth provider requires a name field internally, supply a fixed non-identifying value rather than asking the user. Users must authenticate before entering the word-list application.

**R2.** Neon PostgreSQL is the canonical store for:

- Neon Managed Better Auth data in the managed `neon_auth` schema.
- `word_lists`: `id`, `owner_id`, `name`, `created_at`, `updated_at`
- `word_list_words`: `id`, `word_list_id`, `position`, `word`, `normalized_word`
- `active_mistakes`: `id`, `owner_id`, `word_list_id`, `word`, `normalized_word`, `created_at`, `updated_at`

`owner_id` must reference the authenticated Neon Auth user ID. Word order must be preserved. Database constraints must prevent duplicate words within a list and duplicate active mistakes case-insensitively.

**R3.** The Render backend must expose same-origin JSON endpoints under `/api/v2` for:

- Loading the authenticated user’s word lists and active mistakes.
- Creating and updating a word list.
- Adding an active mistake.
- Removing an active mistake after a correct Practice Mistakes answer.
- Performing the one-time local-data migration.

Existing domain behavior must depend on an application persistence interface, not Neon driver response objects.

**R4.** Neon Managed Better Auth must enable email/password sign-up, require email verification, and provide password reset. Sign-up verification must use a numeric email code that expires after 15 minutes, supports resend, and prevents login before verification. Auth errors must be short, localized, and must not reveal whether an unrelated email address has an account.

**R5.** Every protected Render API request must include the current Neon Auth access token. The backend must verify its signature against the configured Neon Auth JWKS, validate expiration and issuer, and derive `owner_id` only from the verified token subject. It must never accept an owner ID supplied by the browser. All reads and writes must include owner scoping so changing a resource ID cannot expose another account’s data.

**R6.** Neon database credentials and Auth server secrets must exist only as Render secrets. Runtime application traffic must use `DATABASE_URL`, configured with Neon’s pooled connection string and required TLS. Schema migrations must use `DATABASE_URL_UNPOOLED`, configured with the direct connection string. Only the public Neon Auth client URL/configuration required by the browser may appear in frontend assets.

**R7.** API validation must preserve the current import and correctness rules: trim surrounding whitespace, ignore blank lines, deduplicate words case-insensitively while retaining the first spelling, and reject lists with no usable words. The server must not trust client-only validation.

**R8.** Writes must use PostgreSQL transactions and be atomic. A failed word-list save must not create a partial list, partial set of words, or inconsistent mistakes. Repeating the same request or migration must not create duplicates.

**R9.** After the first successful login, the app must detect existing `spellingbeast:word-lists` and `spellingbeast:active-mistakes` data and migrate it into that account once. Migration must upsert by stable IDs, preserve timestamps when valid, and be idempotent. Local migration data may be marked complete or removed only after server acknowledgement.

**R10.** After migration, Neon is the source of truth. Language selection may remain in local storage. Authenticated sessions must restore after refresh and browser restart until they expire or the user logs out. During auth/data loading, including a Neon Free-plan cold start, show a quiet loading state. If loading or saving fails, show a short localized error with Retry; do not report success until the backend confirms it.

**R11.** The backend and deployment must provide:

- Account data that remains available after logout/login, password reset, browser change, Render restart/redeploy, and Neon compute suspend/resume.
- `GET /health` for process health without a database query; configure this as Render’s health-check path.
- `GET /ready` for an explicit Neon connectivity check; do not configure continuous Render health probes against this route because they would prevent Neon Free-plan scale-to-zero.
- A bounded retry for an initial transient Neon connection/cold-start failure, followed by a clear failure response.
- Structured, non-sensitive error logging.
- Request size limits, same-origin `Origin` validation, and rate limiting on write endpoints.
- Consistent JSON error codes without internal stack traces.
- A committed `render.yaml` or equivalent documented Render configuration for one Node.js Web Service.
- A reproducible `npm ci` build, `npm start` runtime command, and `npm run migrate` schema command.
- Render secret variables `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `APP_ORIGIN`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_JWKS_URL`; repository examples must contain names/placeholders only.
- A Neon project/branch in a region supported by Managed Better Auth and an email provider configured and tested before production release.
- A migration step that completes successfully before production traffic reaches code requiring the new schema; a failed migration must stop the release.

## Existing product behavior

**R12.** Preserve the v1.1 core loop without behavioral regression:

`Import → Select → Practice → Feedback → Summary → Practice Mistakes → Clear Mistakes`

**R13.** Preserve TXT, simple CSV, and textarea import; session sizes 5/10/20/All; explicit Web Speech API playback with `en-US` preference; strict case-insensitive exact matching; and the existing English/Chinese language toggle.

**R14.** Practice-session progress remains temporary and need not survive refresh. Persistent session history, analytics, streaks, and mastered-word tracking are not introduced in v2.

## UI upgrade

**R15.** The interface must use a Google-like minimalist direction without copying Google branding, logo, proprietary assets, or exact page composition. The visual system must use:

- Generous whitespace and one clear focal action per screen.
- A restrained neutral palette with one warm honey/amber accent.
- High-contrast text, subtle dividers, minimal shadows, and limited border radii.
- Refined typography with deliberate size, weight, line-height, and spacing hierarchy.
- Consistent spacing and control sizing across desktop and mobile.

**R16.** The top of the web app must show one concise main title with a simple bee mark beside it, symbolizing a spelling bee. The mark must be a lightweight original SVG or CSS icon, visually secondary to the title, accessible by label or decorative treatment as appropriate, and must not use an emoji or detailed mascot illustration.

**R17.** Remove non-essential explanatory copy, including the current eyebrow label and descriptive hero sentence. Keep only text required to identify a screen, label an action, explain an error, or provide essential feedback. Do not replace removed copy with tooltips or additional onboarding panels.

**R18.** The header must be compact rather than a large card. It contains the bee mark, product title, and a visually quiet language toggle. It must not dominate the first viewport.

**R19.** Home must prioritize saved word lists and one clear Add Word List action. Practice screens must visually prioritize Play Word, answer input, and the current primary action. Summary and Mistakes screens must prioritize results and the next useful action rather than decorative messaging.

**R20.** Buttons and fields must remain child-usable and accessible: minimum 44×44 px targets, visible keyboard focus, semantic labels, sufficient contrast, and clear disabled/loading states. Minimalism must not remove required labels, error feedback, progress, or screen-reader semantics.

**R21.** Motion must be restrained and functional. Respect `prefers-reduced-motion`. No celebratory animation, parallax, complex page transitions, or attention-seeking decorative effects are allowed.

**R22.** Layout must work without horizontal scrolling at desktop and a 390×844 mobile viewport. Long list names, words, localized labels, error messages, and unbroken strings must not break containers.

# Constraints

- Retain the current plain HTML/CSS/JavaScript domain modules unless a change is required for the API boundary; a framework migration is not part of v2.
- Use Neon PostgreSQL and one Render Node.js Web Service for the production frontend/API; no browser-to-Neon connection is allowed.
- The Render service must bind to `0.0.0.0` on the provided `PORT`, serve the existing static frontend, and expose same-origin `/api/v2/*` routes.
- Runtime database access must use the pooled Neon connection; migrations must use the direct connection.
- Database migrations must be committed and repeatable.
- Production must use HTTPS and same-origin API access.
- Existing local-only data must not be silently discarded.
- Account email is used only for authentication, verification, and password recovery. No child name, birth date, school information, profile, or free-form personal data may be collected.

# Acceptance Criteria

**AC1.** A user can register with email/password, verify the email, log in, log out, log back in, and complete password reset using both English and Chinese interfaces.

**AC2.** An authenticated user can create a word list; the same list is available after refresh, logout/login, and login from a second supported browser.

**AC3.** An incorrect answer creates one active mistake in Neon; a correct Practice Mistakes answer removes it; both changes remain correct after logout/login.

**AC4.** Two registered accounts cannot read or modify each other’s word lists or mistakes, including by changing resource IDs or submitting another user’s ID.

**AC5.** Existing v1.1 local word lists and mistakes migrate into the first authenticated account successfully; running migration twice produces no duplicates or data loss.

**AC6.** Invalid credentials, unverified email, expired verification, expired session, password-reset failure, and database/API failure show localized actionable feedback without false success or account enumeration.

**AC7.** Data remains available after a verified Render service restart/redeploy and after Neon compute suspends and resumes.

**AC8.** Neon connection strings, Auth server secrets, passwords, and access tokens are absent from frontend assets, API responses, logs, and committed files; invalid or expired tokens are rejected.

**AC9.** All screens use the compact header, original simple bee mark, reduced copy, refined typography, restrained palette, and consistent minimalist component styling.

**AC10.** The full core loop is operable by keyboard and at a 390×844 viewport with no horizontal overflow; focus, loading, disabled, success, and error states remain visible.

**AC11.** English/Chinese switching and `en-US` pronunciation behavior remain unchanged.

**AC12.** `GET /health` returns 200 without querying Neon while the API process is healthy; `GET /ready` returns 200 after a successful database query and non-200 when Neon is unavailable.

**AC13.** All existing automated domain, import, practice, mistake, persistence, audio, and localization tests pass, with new tests covering registration/login, email verification, password reset, token validation, account isolation, database persistence, transaction rollback, idempotent migration, cold-start retry, and failure handling.

# Out of Scope

- Social login, phone login, passkeys, multi-factor authentication, named child profiles, parent dashboards, and multiple children under one account.
- Parent or teacher dashboards, administration, classroom sharing, or collaboration.
- Persistent session history, analytics, streaks, spaced repetition, mastered words, gamification, or leaderboards.
- Definitions, example sentences, phonetic hints, AI word generation, or AI grading.
- Offline-first conflict resolution, PWA work, push notifications, and external audio services.
- Complex branding, mascot illustration, dark mode, themes, or decorative animation.
