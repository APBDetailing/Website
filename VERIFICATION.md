# Verification record

## Completed in this delivery environment

- Parsed/transpiled all frontend TypeScript and JSX with an already-installed TypeScript compiler. This checks syntax, **not** full type correctness against installed package typings.
- Ran the included Node server-validation tests: required fields, email/phone/consent/token validation, honeypot rejection, exact-origin checks, streamed body limits, WebP dimensions, animation rejection and misleading container headers.
- Applied the full SQL migration to an already-installed PGlite (embedded PostgreSQL) database with test Supabase Auth/Storage schemas and roles.
- Exercised public service reads, private address masking, private enquiry boundaries, non-admin write denial, owner access, publishing requirements, ten successful reservations with overflow rejection, duplicate/out-of-range slots, unpublished Storage access, photo removal, deletion-state upload rejection and rate-limit counts.
- Produced a static design preview directly from the public components with default data. No fictional customer work was added.

## Not yet verified

- `npm install`, full `npm run check`, production Vite build and Cloudflare Functions bundling: dependency download was blocked by session permissions. The production build was attempted but Vite was unavailable.
- Desktop/mobile browser rendering and interactive accessibility: the browser policy blocked opening the local design-preview file. No screenshot or browser pass is claimed.
- Real Supabase Auth, Storage HTTP behaviour and concurrent requests across multiple live PostgreSQL connections: the embedded test validates SQL/RLS/constraints, not the provider's entire service.
- Turnstile, real quote submission, owner login, photo compression on phones, live uploads and before/after touch operation.
- GitHub repository creation, Cloudflare deployment and actual free subdomain: no account connections or credentials were provided.

## Required launch checks

Run `npm install`, commit the resulting lockfile, then `npm run check`, `npm test`, `npm run build` and `npx wrangler pages functions build functions --outdir .pages-check`. Resolve any reported issue before publishing.

After setting up a **test** Supabase project and Pages environment:

1. Verify all five starting services; no invented prices/contact details; private address not present in the public view or HTML. Save real contact details and confirm WhatsApp/call links.
2. Log in as the owner. A separate non-allowlisted user must not read enquiries, edit any content, write Storage objects or call reservation RPCs.
3. Add a draft vehicle. Upload actual JPEG/WebP/PNG phone photos, including a rotated photo and a large 8K image. Confirm longest edge ≤1920, output ≤500 KB, visible detail and original file unchanged. Unsupported/failed images must not upload.
4. Open two owner tabs at nine photos and upload concurrently. Only one additional reservation can succeed. Direct API attempts must not create an eleventh slot or bypass Storage writes. Delete one photo and confirm a replacement can be added.
5. Set a cover, reorder photos and create one before/after pair. Publish. Check desktop and mobile, keyboard and touch comparison, full gallery and descriptive alt text. Unpublish and verify fresh anonymous image requests are denied.
6. Delete a vehicle and confirm its Storage objects are gone. Test retry behaviour if a storage request is interrupted. Use test data only.
7. Edit service text, visibility, image and each price mode. Check public price switches and inactive services in the form.
8. Submit a real test quote with production-like Turnstile. Verify the success message and private inbox entry. Try invalid/expired tokens, cross-origin requests, missing acknowledgements and repeated requests; ensure they fail and do not create enquiries.
9. Temporarily use an unreachable test backend. Confirm public services remain readable, the portfolio explains the problem, the form shows an error and no submission reports false success.
10. Check 360px, 768px and desktop layouts, keyboard navigation, visible focus, 200% text zoom and reduced-motion behaviour. No clipped controls or horizontal overflow.
11. Check page titles, descriptions, canonical URLs, individual showcase metadata, `/robots.txt`, dynamic `/sitemap.xml`, `/privacy` and `/admin` noindex. Confirm the privacy notice and contact details reflect the real business.
12. Complete a successful Cloudflare production deployment and verify the actual assigned URL. Only then mark the site live.
