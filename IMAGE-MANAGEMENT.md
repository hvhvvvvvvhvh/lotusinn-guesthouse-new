# Website images and performance

Open `/admin/images` after signing in. Filter by page, select **Change image**, upload a photo or paste an HTTPS image URL, then **Save image**. A saved image appears on public pages within about a minute. The shared banner is used on Home, About, Rooms, Amenities, Gallery and room detail pages; Contact and Booking have separate banners. Room card and room detail gallery images are separate locations. Home room/blog thumbnails come from the room/blog editors.

Uploads support JPG, PNG, WebP, AVIF and GIF up to 3 MB. The server decodes the file, strips metadata, corrects orientation and saves a WebP no larger than 1600×1600. Animated files become a still image. SVG uploads are rejected. Existing externally hosted SVG links remain supported.

With `LOTUS_STORAGE_DRIVER=supabase`, uploads use the private `lotus-website-images` Storage bucket, created automatically by the server using the existing Supabase server key. No browser Storage policies or extra environment variables are needed. The public `/api/site-image?id=…` endpoint serves only these image objects by content hash. Each changed upload has a different URL and immutable caching. Existing image files and old URLs are retained, so they can be restored by pasting their URL. Unsaved uploads may remain in Storage; there is no destructive cleanup action.

With the JSON driver, uploads use `data/uploads` (ignored by Git), or `LOTUS_MEDIA_DIR`. This mode is for local development; production on Vercel must use Supabase for persistence. Admin image writes update only their chosen field using the existing versioned document store. Other document fields and guest records are preserved. An editor that detects a changed original image asks you to refresh.

`node scripts/optimize-images.mjs` generates tracked responsive 480/960/1600 pixel WebP copies and `lib/optimizedImages.json` from the existing public image originals. Run it again when source images are changed. The initial set is 30.2 MB of originals versus 1.6 MB for the largest WebP variants (95% smaller). This compares photo bytes, not a measured page speed score. The originals remain available for old links.

Public pages render their content and navigation on the server. Public page/content responses use a 30 second CDN cache plus 30 seconds of stale revalidation. Admin responses and booking/contact submissions are never publicly cached. Legacy base64 photos are served separately from public HTML/JSON. Photos below the fold load lazily, responsive variants fit the display size, and hash-named optimized files cache for one year.

Validation: `npm test`, `npm run build`, `npm run test:integration`. Integration checks use disposable local records and image storage. To verify configured storage with an existing public photo without changing its page assignment: `node --env-file=.env.local scripts/check-image-storage.mjs`.
