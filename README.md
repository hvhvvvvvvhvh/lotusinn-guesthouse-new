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

The server supports `LOTUS_STORAGE_DRIVER=supabase` for persistent hosting. Follow [SUPABASE-SETUP.md](SUPABASE-SETUP.md) to create the database schema, import existing content without overwriting database records, configure server secrets, and check the connection. All seven datasets use private, versioned Postgres JSONB documents. Database transactions reject stale versions and retry record updates across application instances.

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
