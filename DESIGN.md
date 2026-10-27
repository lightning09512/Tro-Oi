# Trọ Ơi interface direction

Trọ Ơi should feel like a calm, trustworthy Vietnamese rental marketplace: warm enough to feel human, structured enough to make high-stakes housing decisions easy. Public discovery surfaces are editorial and image-led. Account, landlord, messaging, and admin surfaces are quieter and task-led.

## Brand foundations

- Primary: `#2f7a4b`; dark action/ink green: `#245f3b`; soft green: `#eaf4ec`.
- Text: `#27362c`; secondary text: `#657168`; line: `#dfe7e1`; page: `#f5f8f5`.
- Display type: Lora, medium weight, compact tracking. UI and body type: Be Vietnam Pro.
- Use real room photography as the main visual material. Avoid decorative illustration, fake statistics, and invented trust claims.

## Hierarchy and composition

- The primary public journey is home → search/filter → room detail → save or contact.
- Each screen has one obvious next action. Search and contact actions receive the strongest green treatment.
- Public pages use generous section spacing, clear display headings, and photo-forward cards.
- Product pages use flatter surfaces, denser information, and stable control placement.
- Cards use either a quiet tonal fill or elevation, not both a border and shadow. Radius stays between 12–16px; pills are reserved for compact status and filter controls.

## Interaction

- All interactive targets are at least 44px where practical and have visible keyboard focus.
- Hover feedback is subtle and never required to understand state. Pressed feedback may use a small scale change.
- Motion is brief and purposeful: one composed home-page entrance, image zoom on listing hover, and clear menu/control transitions. Respect `prefers-reduced-motion`.
- Empty, loading, error, disabled, selected, and saved states must remain explicit in Vietnamese.

## Responsive behavior

- Phone gutters are 20px. Dense desktop grids collapse to a single readable listing column.
- Search controls stack without truncating the selected value; the primary search action spans the available width.
- Bottom navigation remains available on phones and must retain accessible contrast.
- No essential action depends on hover, and no content should create horizontal page overflow.

## Content rules

- Keep copy direct and factual. Do not invent review counts, occupancy, verification, discounts, availability, or promotion terms.
- Price, location, area, listing status, owner identity, and contact path should be scannable in that order.
- Avoid uppercase eyebrow labels above headings and avoid emoji or Unicode characters as interface icons; use the shared SVG `Icon` component.
