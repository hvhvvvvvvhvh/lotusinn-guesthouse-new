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

## Storage

Private records are JSON files in `data/`. Public room and site content are in `public/data/`. JSON updates are atomic and serialized within one Node process. Back up these directories and run a single application process on a persistent, writable disk. Multiple processes/replicas and serverless deployments need a shared database; filesystem storage is not a persistent Vercel backend.

`LOTUS_DATA_DIR` and `LOTUS_PUBLIC_DATA_DIR` optionally relocate server-side storage. If relocating public JSON, configure the web server to serve that directory at `/data/`, because public pages also fetch these files.

Supabase is currently used only by the optional migration script. Setting Supabase variables does not switch the running app to database storage. To migrate after provisioning the expected tables, configure `.env.local` and run `npm run migrate:blogs`.

## Checks

```powershell
npm test
npm run build
npm run test:integration
npm audit
```

Integration checks require a current production build. They launch a temporary local server, use disposable copies of the data, exercise public/admin routes and API changes, then stop the server and clean up. No external WhatsApp or email messages are sent.

See `DEBUG-REPORT.md` for the fixes and verification results.
