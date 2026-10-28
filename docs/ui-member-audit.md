# Member interface audit — 29/10/2026

The member pass preserves the API data model and green Trọ Ơi brand. Scoped presentation is in `src/styles/member-pages.css`; the application entry imports it after the incumbent stylesheet.

| Routes | Work completed | Validation / limits |
| --- | --- | --- |
| `/dang-nhap`, `/admin/dang-nhap` | Simplified sign-in, removed role picker ignored by member login API, removed default admin-email prefill, demo quick-fill only in demo mode; consistent 52px password field and autofill background | Browser: empty submit shows validation without sending request. Parent handles valid fixture login. |
| `/dang-ky` | Email and telephone share a logical row, email/telephone input types, readable code-request action, implementation jargon removed; prevent submit while code is sending | Browser: empty email code request shows validation and does not send mail. Real SMTP/OTP delivery intentionally not triggered by this pass. |
| `/quen-mat-khau`, `/dat-lai-mat-khau` | Shared auth treatment and request pending guard / disabled submit | Password reset was not executed; requires user-controlled OTP and credentials. |
| `/tai-khoan/ho-so`, `/tai-khoan/doi-mat-khau`, admin account aliases | Quiet account sidebar/form, readable shortcuts; keyboard-operable avatar trigger, dialog focus trap, password autocomplete; prevent duplicate saving | Typecheck passed; actual profile writes/password changes not performed by this pass. |
| `/yeu-thich` | Clear heading/count/empty state and consistent responsive listing layout | Uses existing FavoritesContext and RoomCard; parent checks API favorite mutation. |
| `/bao-cao-cua-toi` | Status-first report feed, readable reason, resolution and timestamp | Uses persisted report records; no fake reports created. |
| `/thong-bao`, `/admin/thong-bao` | Consistent feed and filters, explicit read/delete controls, pending disabling and visible API action errors; invalid-date fallback | No notifications deleted. Filter state and styling reviewed in code; parent tests fixture mutations. |
| `/dien-dan`, `/bai-viet/:id` | Clear page heading, quieter feed, composer, images and comments; actual image-file upload through existing API with 3MB limit; async edit/delete/like/share errors, pending guards | Browser: guest feed loads persisted posts and photo previews. Publishing/like/comment backend exercise performed separately by parent fixture checks. |
| `/tim-ban-be`, `/thanh-vien` | Aligned connections hub, tabs, member rows and empty/search states; removed unsupported online indicators and trust claims | Existing API handlers preserved; authenticated network actions need fixture login. |
| `/trang-ca-nhan`, `/nguoi-dung/:id` | Same brand font/palette, cleaner profile/listings/posts; no invented area or default location, no status=online claim; clipboard success awaits actual copy; reports target an existing room, never an account id mislabeled as a room | Remote profile loading/error/retry preserved. Image lightbox traps/restores focus. |
| `/tin-nhan` | Responsive conversation panes, clearer messages/composer/contact details; pending guards, retains draft edits during send, awaits mute success, catches read-refresh errors; schedule and contact dialogs trap focus | No real messages sent by this pass. Parent runs a two-user disposable conversation fixture. |

## Removed misleading behavior

- `StoriesBar` previously manufactured reels, view/like counts and local-only publishing even in API mode. It now renders image previews from active persisted posts and links to those posts. Existing localStorage entries are left untouched.
- Comment likes previously existed only in component state, so they were removed until the data model/API actually supports them. Post likes remain real API actions.
- Chat no longer invents a 5.0 rating, verification status, minimum one listing or 25m² area.
- Fake always-online member dots and unsupported video-composer actions were removed. Photo attachment uses the actual upload API.

## Checks

- `pnpm exec tsc --noEmit` passed during integration (29/10/2026).
- Browser reviewed the desktop sign-in form, autofill, registration field grouping/validation, guest forum loading/content, persisted photo strip and API-free invalid form submissions.
- Parent owns final 360/390/768/1024/1440 captures, API fixture flows, whole-application build and shared component review. Those results must not be inferred from this focused pass.
- No account credentials were read from `.env`; no real OTP email, password change, data deletion, commit, push or deployment was performed.
