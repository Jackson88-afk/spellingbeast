---
version: alpha
name: SpellingBeast
description: Warm, centered, child-friendly spelling practice with cream surfaces and a calm orange primary action.
colors:
  background: "#FFF8EA"
  surface: "#FFFFFF"
  surfaceAlt: "#FFFCF3"
  text: "#1F2937"
  muted: "#4B5563"
  primary: "#B45309"
  primaryHover: "#92400E"
  onPrimary: "#FFFFFF"
  success: "#166534"
  successSurface: "#DCFCE7"
  warning: "#92400E"
  warningSurface: "#FEF3C7"
  error: "#991B1B"
  errorSurface: "#FEE2E2"
  info: "#1E3A8A"
  infoSurface: "#DBEAFE"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  heading1:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  heading2:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
  heading3:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  bodySmall:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  button:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 0.9375rem
    fontWeight: 700
    lineHeight: 1.1
  eyebrow:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: 0.75rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 48px
  pageGutter: 16px
rounded:
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  pill: 9999px
components:
  layout-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    width: "min(100%, 72rem)"
  layout-content:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    width: "min(100%, 42rem)"
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  surface-compact:
    backgroundColor: "{colors.surfaceAlt}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primaryHover}"
    textColor: "{colors.onPrimary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  form-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
    width: "100%"
  form-textarea:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 160px
    width: "100%"
  form-select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
    width: "100%"
  status-success:
    backgroundColor: "{colors.successSurface}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
    padding: "{spacing.lg}"
  status-warning:
    backgroundColor: "{colors.warningSurface}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: "{spacing.lg}"
  status-error:
    backgroundColor: "{colors.errorSurface}"
    textColor: "{colors.error}"
    rounded: "{rounded.sm}"
    padding: "{spacing.lg}"
  status-info:
    backgroundColor: "{colors.infoSurface}"
    textColor: "{colors.info}"
    rounded: "{rounded.sm}"
    padding: "{spacing.lg}"
---

## Overview

SpellingBeast should feel warm, calm, and easy to trust. The visual direction is
built for children 6-12 and for the adults who may help set things up, so the UI
must be simple, centered, and obvious rather than playful through ornament.

The page should use a warm cream canvas, white rounded surfaces, restrained
shadows, and a single strong orange action color. The result should feel like a
focused learning tool: friendly enough for kids, but not noisy or game-like.
Keep the existing product behavior and native HTML/CSS/JS implementation intact.

## Colors

- `colors.background = #FFF8EA`: warm cream page background that softens the
  interface and keeps the app from feeling clinical.
- `colors.surface = #FFFFFF`: the default card and panel color. White surfaces
  create clear separation from the cream background without heavy borders.
- `colors.surfaceAlt = #FFFCF3`: a barely warmer alternate surface for subtle
  grouping when a second level of white is needed.
- `colors.text = #1F2937`: the primary charcoal text color. It is dark enough
  for readability while staying softer than pure black.
- `colors.muted = #4B5563`: secondary text for hints, metadata, and supportive
  labels.
- Thin, low-contrast separators should use an alpha charcoal treatment around
  `rgba(31, 41, 55, 0.12)` so structure stays visible without making the UI
  feel boxed-in.
- `colors.primary = #B45309`: the only high-emphasis action color. Use it for
  the main button and other deliberate forward actions.
- `colors.primaryHover = #92400E`: a deeper orange-brown for hover and pressed
  states so the action still feels warm but becomes clearly active.
- `colors.onPrimary = #FFFFFF`: white text on the primary action for maximum
  legibility.
- `colors.success`, `colors.warning`, `colors.error`, and `colors.info` are
  reserved for status feedback only; they should not compete with the primary
  action color.

## Typography

Typography should stay highly legible and low-friction. Inter is the preferred
face because it reads cleanly at small and medium sizes, has strong numeral and
UI clarity, and remains neutral enough for a child-focused utility.

Use weight, size, and spacing to communicate hierarchy rather than decorative
fonts or excessive styling.

- `typography.display` and `typography.heading1` are for the landing hero and
  the highest-level page title only.
- `typography.heading2` and `typography.heading3` handle section titles and
  panel headings.
- `typography.body` is the default reading size for explanations, prompts, and
  instructions.
- `typography.bodySmall` is for helper text and compact metadata.
- `typography.label` is for form labels and short control captions.
- `typography.button` keeps actions bold but not oversized.
- `typography.eyebrow` is for small all-caps or near-all-caps branding labels.

The hierarchy should stay calm: no condensed faces, no script fonts, and no
strong decorative letterforms.

## Layout

The app should be centered and single-column first. The primary content column
should remain narrow enough to read comfortably, but flexible enough to fill the
screen on smaller devices.

- The outer shell should cap at `min(100%, 72rem)`.
- The preferred centered content column should cap at `min(100%, 42rem)`.
- Shorter forms, summaries, and confirmation states should use
  `min(100%, 32rem)`.
- Long instructions should stay within a `65ch` measure.
- Use a page gutter of `16px` on mobile and `24px` on larger screens.
- The main breakpoints should be `480px`, `768px`, and `1024px`.

Responsive rules:

- Stack content vertically at every size; do not introduce multi-column desktop
  layouts.
- Allow panels to grow fluidly instead of fixing widths that could overflow on
  phones.
- Keep text blocks centered and limit line length for reading comfort.
- Ensure no horizontal scrolling is ever required.

## Elevation & Depth

Depth should be restrained and supportive. Surfaces should look lifted, but only
slightly, so the interface remains calm and grounded.

- The default card shadow should stay restrained, using a light layer such as
  `0 1px 2px rgba(31, 41, 55, 0.05), 0 8px 24px rgba(31, 41, 55, 0.06)`.
- Hover lift may deepen slightly, but should remain subtle, such as
  `0 2px 4px rgba(31, 41, 55, 0.06), 0 12px 28px rgba(31, 41, 55, 0.08)`.
- Avoid stacked shadows, neon glows, and heavy floating effects.

## Shapes

Rounded corners are an important part of the visual tone. The surfaces should
feel friendly and soft, but still tidy and structured.

- `12px` corners work well for inputs and smaller controls.
- `16px` corners suit intermediate cards and status surfaces.
- `24px` corners suit primary cards, panels, and hero surfaces.
- `32px` corners can be used for the largest display containers when extra
  softness is needed.
- `9999px` is reserved for chips and pill-style status badges.

Controls must maintain a minimum 44px touch target, even when the corner radius
is large.

## Components

### Buttons

Buttons should be obvious, readable, and touch-friendly.

- Primary buttons use `#B45309` with white text and a `44px` minimum height.
- Hover and pressed states use `#92400E` to communicate that the action is
  active.
- Secondary buttons stay neutral with a white surface, charcoal text, and the
  same `44px` minimum height.
- Keep button labels short and direct; avoid multiple competing primary actions
  on the same screen.

### Forms

Forms should feel friendly and forgiving while still being compact.

- Inputs, textareas, and selects use white surfaces with charcoal text.
- Field height should be `44px` minimum for touch comfort.
- Use `12px` padding and enough vertical gap between label, control, and helper
  text to prevent crowding.
- Form elements should stretch to `100%` width inside the centered column.
- Textareas may grow taller, but they must still fit within the mobile viewport
  without causing horizontal overflow.

### Status states

Status feedback should be calm, explicit, and readable.

- Success states use a pale green surface with dark green text.
- Warning states use a pale amber surface with deep brown text.
- Error states use a pale red surface with dark red text.
- Info states use a pale blue surface with deep blue text.
- Do not rely on color alone; always pair state color with text or an icon when
  the meaning matters.

### Surfaces

White rounded surfaces are the default building block for cards, sheets, and
summary panels.

- Use `surface-card` for major content containers.
- Use `surface-compact` for short grouped content or inline summary blocks.
- Keep separators subtle and shadows restrained so the page still feels warm
  and open.

## Do's and Don'ts

Do:

- Keep the interface centered and vertically stacked.
- Keep all important controls at least 44px tall and easy to tap.
- Preserve the existing product behavior, native HTML/CSS/JS stack, and current
  flow.
- Use semantic HTML, visible labels, and concise helper text.
- Make focus visible on every interactive element.
- Keep motion subtle and non-essential.

Don't:

- Don't introduce sidebars, dashboards, split panes, or multi-column practice
  layouts.
- Don't create horizontal scrolling, hidden overflow hacks, or fixed widths that
  break on mobile.
- Don't use flashy gradients, glassmorphism, loud shadows, or animated chrome
  that distracts from practice.
- Don't use icon-only controls for primary actions.
- Don't remove native keyboard support or replace it with pointer-only
  interactions.
- Don't change the app's behavior, flow, or data model in this design file.

Accessibility requirements:

- Use a `3px` focus ring with a `2px` offset and a warm orange focus color
  around `rgba(180, 83, 9, 0.28)` for focus visibility.
- Preserve the browser's logical tab order and use `:focus-visible` rather than
  hiding outlines.
- Provide visible labels for all inputs and announce errors in text, not color
  alone.
- Respect `prefers-reduced-motion` by avoiding decorative or looped motion.
- Keep touch targets at or above `44px`.

Explicit exclusions:

- No login, accounts, cloud sync, analytics dashboards, or admin UI.
- No change to the existing learning flow, answer grading behavior, or browser
  storage approach.
- No multiple-choice, fuzzy matching, phonetic hints, or gamification layers.
- No visual treatment that depends on horizontal scrolling or oversized fixed
  desktop layouts.
