# Lotus Inn SEO

Primary address: https://www.lotusinnguesthouse.com/

## Implemented

- Server-rendered page titles, descriptions and canonical URLs for public pages.
- Existing blog and author SEO fields remain authoritative for their own pages.
- Open Graph and Twitter previews use the selected CMS image.
- LodgingBusiness, WebSite, WebPage, BreadcrumbList, HotelRoom, BlogPosting and Person JSON-LD where appropriate. Contact information comes from the same CMS fields displayed on the website. No review stars or coordinates are invented.
- `/sitemap.xml` reads current rooms, published articles and authors, deduplicates URLs and uses real article modification dates. CDN cache expires after 60 seconds. Drafts and admin routes are excluded.
- `/robots.txt` advertises the sitemap; admin pages and API responses also carry noindex directives. Authentication remains the actual access control.
- The old production Vercel hostname permanently redirects to the primary domain, preserving paths and query strings. Local development and preview hostnames remain unaffected.
- Room headings and names agree with the room listing; the homepage includes a short location introduction and useful internal links.
- Existing responsive WebP images, preloading and ISR are preserved. Real-user performance collection now recognizes the custom domain too.

## Google Search Console

The primary HTTPS URL-prefix property is being configured under the Google account selected by the owner. Its Google-issued verification meta tag is public by design; keep it in `components/Seo.jsx` to retain verification. It is not an authentication secret. Submit `https://www.lotusinnguesthouse.com/sitemap.xml` after deployment, and inspect the homepage and room URLs. Verification/indexing status must be checked in Search Console; deployment alone does not mean Google has indexed the site.

## Existing Google Business Profile

The owner supplied the existing Lotus Inn Google Travel listing. Its address and landline match this site's contact information. The current Google account manages no Business Profiles, and the owner reports no access. Request access to the existing listing through Google's ownership process; do not create a duplicate listing. Once access is granted, check the website URL, real-world business name, category, address/map pin, telephone, hours and amenities. Confirm check-in, cancellation, meal and pricing policies before publishing any changes; the existing site and Google listing contain details that need owner confirmation.

Keep the real-world business name rather than adding search keywords. Upload genuine property photos and request honest guest reviews without incentives or selecting only satisfied guests. Build relevant local partnerships and directory listings instead of buying ranking links. Review Search Console clicks, queries, indexing and Core Web Vitals regularly. SEO work does not guarantee a ranking or a timeline.

Cloudflare still proxies the domain. Vercel flags this in domain settings; any proxy/cache changes require access to the authoritative Cloudflare account. Do not cache private admin/API responses.
