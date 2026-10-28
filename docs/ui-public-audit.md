# Public UI audit — Trọ Ơi

Reviewed scope: `/`, `/tim-phong`, `/phong/:id`, the lazy Leaflet room map. Existing brand, room/photo datasets and API permissions are preserved. No database seed, deletion or data mutation was performed for this audit.

| Route | Purpose / primary action | Problems found and implemented changes | State coverage |
| --- | --- | --- | --- |
| `/` | Discover rooms and search | Consistent green/photo layout, contained filter labels with 14px top padding, truthful city groups/counts from loaded active listings, role-aware posting CTA, interactive 4-slide promotional campaign banner carousel with touch swipe, hover pause, dot indicators, and quick links. | Loading skeleton, API failure, no rooms, empty forum, responsive content and keyboard-operated price/area menus. |
| `/tim-phong` | Apply filters, compare rooms, view map | HCM formerly bypassed city filtering. API repro: all 32 vs HCM 12; 20 results were outside HCM. Now sends canonical city filter and shows 12 correct rooms. Supports header `?q=` free text nationwide, preserves search/filter state in URL, validates price bounds, exposes request error and retry, fixes duplicate mobile/desktop field IDs, focuses/traps mobile filter sheet. Map uses first valid result instead of a fixed HCM center and explains missing coordinates. | Initial/load-more loading, validation error, API error/retry, no matches, no map locations, desktop filters and mobile sheet. |
| `/phong/:id` | View photos/details, save or contact | Stable two-column facts and rent unit, expandable photo viewer with image navigation and Escape/focus restoration, photo thumbnails, readable description, truthful owner text rather than fabricated online status. Prevents duplicate favorite/contact/review operations, awaits true success before review-deletion toast, shows errors locally, formats review dates, uses SVG stars and tolerates malformed IDs/failed owner avatar. Removed residual transfer-specific display logic. | Loading separate from unavailable listing, error/unavailable, absent photos/owner/amenities/coordinates, pending/error contact and reviews; related listings remain scored by location/type/price. |
| Room map | Show approximate listing location | Validates center shape and coordinate values; error boundary isolates Leaflet failures; tile-error message/retry; disables accidental wheel zoom while page scrolling. | Missing coordinates, tile failures, render failure. |

## Checks performed

- `pnpm build`: passed during implementation.
- `pnpm exec tsc --noEmit`: passed after the other agent resolved an unrelated duplicate attribute in PublicProfilePage.
- Read-only API comparison: `/api/listings?limit=60` yielded total 32; `/api/listings?limit=60&location=Hồ Chí Minh` yielded 12 and zero outside-HCM records.
- Browser: HCM URL displayed exactly 12 listings. Opened first real listing, opened image viewer, navigated from image 1 to image 2 of 5, and verified Escape removes the dialog.
- Browser header keyword `Hà Nội` navigated to `/tim-phong?q=Hà+Nội`; result displayed 11 rooms, all visible location fields in Hà Nội. No browser error log entries at that point.
- Final responsive screenshots and shared-style integration are performed by the parent agent after loading `src/styles/public-pages.css`.

## Limits

- Authenticated save/contact/review writes were not executed by this sub-agent. Server checks remain in place; parent validates authenticated workflows and shared context error propagation.
- Network tile outage and Leaflet render failure were hardened in code; a real external tile outage was not induced.
- Dynamic home counts describe currently loaded active listings. They are not invented traffic or total-market statistics.
