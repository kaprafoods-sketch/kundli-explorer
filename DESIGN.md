# GRAHA Design Contract

## Visual world

GRAHA is a dark observatory and learning instrument: quiet space-black surfaces, parchment text, restrained brass data accents, and precise planetary glyphs. The interface should feel calm, legible, and trustworthy rather than mystical or ornamental.

## Tokens

- Ground: `--bg` / `--ink-1`
- Raised surfaces: `--panel`, `--panel-2`
- Primary text: `--parchment`
- Supporting text: `--sand`, `--muted`
- Primary action and chart data: `--brass`, `--brass-bright`
- Interactive secondary accent: `--accent`
- Error: `--error`; warning/uncertainty: `--weak`
- Typography: Fraunces for display, Hanken Grotesk for UI, IBM Plex Mono for metadata, Tiro Devanagari Sanskrit for Sanskrit text.
- Use the existing spacing scale and a consistent 12px onboarding surface radius.

## Birth-flow composition

- Desktop uses a two-column observatory intake: explanatory narrative on the left, focused form on the right.
- Mobile puts the form first and keeps every control within the viewport width.
- Progress is always visible and states the current task in text; icons are supporting signals, not the only meaning.
- The form asks one decision at a time and explains why precision matters.
- Focus topics personalize the reading but never block chart creation.

## Component states

Every input and control needs default, hover, focus-visible, selected, disabled, loading, error, and reduced-motion behavior where applicable. Focus must be visible against the dark ground. Async results use semantic listbox/option behavior and announce loading or errors.

## Depth and motion

Prefer flat tone changes, borders, and spacing over stacked glass, heavy blur, gradients, or persistent shadows. Motion is short, transform/opacity-based, and removed under `prefers-reduced-motion`. Decorative Three.js motion must remain subordinate to the birth form.

## Do

- Use direct, reassuring copy.
- Keep body text at readable sizes.
- Preserve the educational, non-predictive product position.
- Make uncertainty explicit without making it feel like failure.
- Keep chart-generation behavior and data contracts stable.

## Avoid

- Platform-dependent emoji as the only status indicator.
- Mystery labels such as “Continue” when the action can be named.
- Blocking users on optional personalization.
- Decorative motion that competes with a form.
- New gradients, card stacks, or generic astrology motifs without a product reason.
