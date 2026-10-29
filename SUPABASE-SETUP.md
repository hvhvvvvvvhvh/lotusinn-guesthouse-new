# Connect Lotus Inn to Supabase

## 1. Select the correct project

Sign in at https://supabase.com/dashboard and open the intended project. If creating a new project, choose the organization and region and enter its database password yourself. The application uses the HTTPS Data API and does not need the database password.

## 2. Install the schema

Open the project's SQL Editor and run `supabase/migrations/202610260001_lotus_storage.sql`.

This adds `public.lotus_documents` and `public.lotus_compare_and_set`. It preserves existing tables, enables Row Level Security and denies anonymous/authenticated browser access. Only the server's secret/service-role credentials can read or change application datasets.

The seven import dataset keys are `site`, `rooms`, `bookings`, `messages`, `expenses`, `blogs`, and `authors`. Site and room documents retain atomic version checks. After importing, run `supabase/migrations/202610290001_record_queries.sql` to copy the five collections into indexed individual rows. It retains original documents and installs private record-mutation and aggregate functions; only service-role requests can use them.

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
```

The importer inserts missing datasets only. Existing `lotus_documents` rows are left unchanged. If the old `lotus_blog_posts`/`lotus_blog_authors` tables exist, their records are preserved and take precedence over local records with the same ID. Other tables and the local files are retained. Re-running the migration does not overwrite database content.

Before deploying this version, run the second SQL migration in the SQL Editor **after** the import, then `npm run supabase:check`. Back up both tables first when upgrading an existing deployment. `scripts/backup-record-migration.mjs ABSOLUTE_BACKUP_DIRECTORY` captures the legacy documents before conversion; `scripts/verify-record-migration.mjs` checks every copied value/order and totals immediately after conversion. That comparison is for migration time: legacy collection documents stop being authoritative once the new app writes individual records. Do not roll back to an older app without first synchronizing those documents from current records.

The connection checker reads all seven datasets and verifies that an intentionally stale write is rejected. It does not modify records. Once verified, use the admin interface to check saving and refresh the public pages to check visibility.

## 5. Verify and deploy

```powershell
npm test
npm run build
npm run test:integration
```

The automated integration suite forces JSON mode with disposable data, even when `.env.local` points to a real database. Use `supabase:check` to validate the selected real database. Never run destructive test flows against live guest records.

New editor uploads are compressed into the private `lotus-website-images` Storage bucket and served through the immutable image endpoint. Database backups should include `lotus_documents`, `lotus_records`, and the image bucket. Legacy embedded images remain supported.

## Troubleshooting

- Missing schema or `PGRST...` errors: run the supplied SQL in the selected project, then wait for the API schema cache to refresh.
- HTTP 401/403: check that the URL and server secret key belong to the same project, and that the key is a secret/service-role key.
- Empty database: run `supabase:migrate`; the app does not silently fall back to local files in Supabase mode.
- `PT409`: another request changed the document first. The server retries ordinary record updates automatically; refresh and retry a conflicting editor save.
- Local JSON mode: set `LOTUS_STORAGE_DRIVER=json` and restart the app.
