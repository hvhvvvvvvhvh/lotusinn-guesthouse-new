# Lotus Inn Guest House

Next.js Pages Router website with guest booking/contact requests and a protected admin CMS.

## Run locally

Use Node.js 22.18 or newer and npm:

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. Admin sign-in is at `/admin/login`.
The development-only fallback password is documented in `ADMIN-LOGIN-SETUP.txt`.

## Production

Copy `.env.example` to `.env.local` and set a strong `ADMIN_PASSWORD` and a random `ADMIN_SESSION_SECRET`. Production sign-in stays disabled until both are set. Then run:

```powershell
npm run build
npm start
```

Guest forms save locally before opening WhatsApp or an email composer. Guests must send the prepared message in that app. A saved request is pending, rather than a confirmed reservation.

## Supabase storage

The server supports `LOTUS_STORAGE_DRIVER=supabase` for persistent hosting. Follow [SUPABASE-SETUP.md](SUPABASE-SETUP.md) to install both schema migrations, import existing content, configure server secrets, and check the connection. Site/room configuration uses versioned JSONB documents. Bookings, messages, expenses, blogs and authors use indexed individual rows in `lotus_records`, with atomic record mutations and paginated admin queries.

Public content is served through `/api/site-data`, with only the `site` and `rooms` datasets available. Guest records and unpublished blog content stay behind the existing server authorization checks. The Supabase secret key stays on the server; there is no direct browser database access.

For offline development, `LOTUS_STORAGE_DRIVER=json` retains the original JSON files in `data/` and `public/data/`. JSON mode needs a persistent writable disk and one Node process. `LOTUS_DATA_DIR` and `LOTUS_PUBLIC_DATA_DIR` relocate those files. JSON files remain backups/import sources after enabling Supabase. The older `migrate:blogs` utility is retained for legacy tables; use `supabase:migrate` for the running application.

## Checks

```powershell
npm test
npm run build
npm run test:integration
npm audit
```

Integration checks require a current production build. They launch a temporary local server, use disposable copies of the data, exercise public/admin routes and API changes, then stop the server and clean up. No external WhatsApp or email messages are sent.

See `DEBUG-REPORT.md` for the fixes and verification results.

## Loading performance

Admin routes contain a static shell; authenticated data comes from `/api/admin/page`. The shell stays mounted during navigation. Private data is held only in browser memory for 30 seconds, cleared on logout/unmount, and invalidated across tabs after successful writes. Pagination loads 50 records at a time; the lower search box searches all records, while existing table filters narrow the current page.

`vercel.json` places functions in Sydney beside this project's Supabase database. Verify the database region before reusing that configuration for another project. The admin data API exposes auth/data/total `Server-Timing` measurements. Serverless cold starts remain possible; the shared endpoint and static shell reduce their impact.

Production Vercel builds also collect Core Web Vitals in the project's Speed Insights dashboard. Metric URLs omit query strings and fragments, and routes use framework patterns rather than record IDs. Local builds and preview deployments do not send these metrics.

The build prepares separate scoped public/admin styles, local Latin WOFF2 fonts and the SVG icons used in source/data. Uploaded images have stored 480/960-pixel variants and immutable browser/CDN caching. Vercel content saves schedule targeted regeneration with `waitUntil`; the public ISR interval remains the fallback, so public updates may take up to the next revalidation rather than appearing synchronously with Save.
