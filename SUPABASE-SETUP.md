# Connect Lotus Inn to Supabase

## 1. Select the correct project

Sign in at https://supabase.com/dashboard and open the intended project. If creating a new project, choose the organization and region and enter its database password yourself. The application uses the HTTPS Data API and does not need the database password.

## 2. Install the schema

Open the project's SQL Editor and run `supabase/migrations/202610260001_lotus_storage.sql`.

This adds `public.lotus_documents` and `public.lotus_compare_and_set`. It preserves existing tables, enables Row Level Security and denies anonymous/authenticated browser access. Only the server's secret/service-role credentials can read or change application datasets.

The seven dataset keys are `site`, `rooms`, `bookings`, `messages`, `expenses`, `blogs`, and `authors`. Each row contains the original JSON shape plus a version. Atomic version checks protect read/modify/write operations across application instances. Full-document editor saves intentionally replace that document, like the existing editor behavior; simultaneous admins should refresh before saving the same room/expense document.

## 3. Configure the server privately

In the ignored `.env.local`, set:

```dotenv
LOTUS_STORAGE_DRIVER=supabase
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
ADMIN_SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET
```

Get the project URL and server secret key from the project's Connect/API settings. A new `sb_secret_...` key or the legacy `service_role` key works. A publishable/anon key is not sufficient. Never prefix the secret key with `NEXT_PUBLIC_`, commit `.env.local`, or paste the secret into chat. See [Supabase's API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

Restart the app after changing environment variables. For a hosted website, add these same five variables to the hosting project's server environment and redeploy; local variables do not configure the hosted deployment.

## 4. Import existing content

```powershell
npm run supabase:migrate
npm run supabase:check
```

The importer inserts missing datasets only. Existing `lotus_documents` rows are left unchanged. If the old `lotus_blog_posts`/`lotus_blog_authors` tables exist, their records are preserved and take precedence over local records with the same ID. Other tables and the local files are retained. Re-running the migration does not overwrite database content.

The connection checker reads all seven datasets and verifies that an intentionally stale write is rejected. It does not modify records. Once verified, use the admin interface to check saving and refresh the public pages to check visibility.

## 5. Verify and deploy

```powershell
npm test
npm run build
npm run test:integration
```

The automated integration suite forces JSON mode with disposable data, even when `.env.local` points to a real database. Use `supabase:check` to validate the selected real database. Never run destructive test flows against live guest records.

Embedded editor uploads remain in JSONB for compatibility; local stock images remain in `public/images`. A dedicated image-storage migration can be added separately. Database backups should include `lotus_documents`.

## Troubleshooting

- Missing schema or `PGRST...` errors: run the supplied SQL in the selected project, then wait for the API schema cache to refresh.
- HTTP 401/403: check that the URL and server secret key belong to the same project, and that the key is a secret/service-role key.
- Empty database: run `supabase:migrate`; the app does not silently fall back to local files in Supabase mode.
- `PT409`: another request changed the document first. The server retries ordinary record updates automatically; refresh and retry a conflicting editor save.
- Local JSON mode: set `LOTUS_STORAGE_DRIVER=json` and restart the app.
