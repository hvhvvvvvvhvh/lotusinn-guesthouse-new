# Debugging report

## Fixed

- Guest booking and contact forms were calling protected admin routes and received HTTP 401. Added public, POST-only submission endpoints with server-side validation while keeping record listing and management private.
- Booking edits, status/payment changes and deletes previously existed only in React state. Added persistent API changes, visible errors and saving states. Removed fabricated bookings and arrival/stay counts.
- Expense saves/deletes ignored HTTP errors and changed the screen before persistence succeeded. The interface now updates only after a successful response.
- Admin access relied solely on middleware and used a permanent deterministic token plus public fallback credentials in production. Added API/page authentication, origin checks, signed expiring sessions, and production configuration requirements.
- Updated Next.js from 14.2.15 to 15.5.28, patched transitive dependencies, and kept a single npm lockfile.
- Concurrent JSON read/modify/write operations could overwrite one another; direct writes could expose incomplete files. Added a process-wide update queue and atomic file replacement. This remains a single-process filesystem solution.
- CMS endpoints now validate field types, author references, unique author/blog slugs, dates, statuses, content blocks and safe URLs. Blog and room image uploads now have the same explicit 50 MB request limit as the author editor.
- Public article summaries no longer serialize full article bodies. Uploaded blog/author images are served separately through a media endpoint; images from draft posts remain private.
- Room edits now retain galleries, facilities, amenities and reviews. Duplicate/invalid room slugs are rejected. Booking prefill and room detail prices use the managed room listing rather than query-string prices or conflicting copies.
- Homepage room cards and blog links now reflect managed records. The availability form carries dates/guest count into booking. The `5+` guest option now submits a valid numeric value.
- Availability now checks exact room identity and the current booking dates. Old and future reservations no longer block a room today. Manual maintenance/hold states remain visible.
- Amenities edits retain unedited fields and correctly move items between sections. Guest messages now display their message bodies.
- Gallery overlays respond to clicks and keyboard activation; Escape closes the lightbox. Missing room URLs return HTTP 404. Removed a missing CSS image reference and a misplaced viewport meta tag.
- Dashboard chart and pending counts now use actual bookings. Admin search filters page links; fabricated notifications were replaced with useful shortcuts. Added sidebar scrolling and improved narrow-screen layout.

## Verification

- Production build: passed with Next.js 15.5.28.
- Regression tests: all 12 passed. `npm test` covers sessions, direct server authorization, concurrent writes, validation, availability, pricing, public-content projection and the Supabase adapter.
- Integration tests: all 103 checks passed. `npm run test:integration` starts an isolated production server and checks page responses, authentication, public submissions, concurrent guest/admin writes, persisted booking edits/deletion, expenses, room uploads, CMS publishing, media visibility and public data access.
- Dependency audit: `npm audit` reports zero vulnerabilities in the checked dependency tree.
- Browser checks: admin login/dashboard/page search, gallery open/Escape, canonical room selection/pricing and homepage-to-booking navigation.
- Integration tests use disposable copies of private and public data. Browser testing did not submit guest requests or send external WhatsApp/email messages.
- Supabase follow-up: imported all seven datasets into the selected real project, verified server-only table/function access and rejection of stale writes, and passed read-only HTTP checks against the database-backed application. The server key is kept in the ignored environment file.

## Deployment requirements and limits

Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` before production use. Supabase support has since been added for all seven datasets, including database version checks and a non-overwriting importer. Follow `SUPABASE-SETUP.md` and run `supabase:check` against the selected project before enabling it on the host. The original JSON mode still requires a persistent writable disk and a single Node process.

WhatsApp/email buttons save a request and open a composer. They do not send messages automatically or confirm room inventory. External delivery, a real Supabase migration, hosting and every responsive viewport were not tested.

Existing uploaded images remain embedded in the selected JSON/JSONB storage and may be large. A dedicated upload/object-storage service would further reduce editor and room-data payloads.

Run the checks and startup commands in `README.md` to reproduce the results.
