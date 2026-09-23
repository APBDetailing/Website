# Security and maintenance notes

## Access boundaries

All application tables have RLS enabled. Public users can read active services and published, non-deleting vehicles with ready photos. The settings base table is admin-only; a deliberately masked, read-only view exposes public fields and removes a hidden address. This view is owned by the migration owner so that it can read the protected base table, and has `security_barrier=true` and an explicit column list.

`admin_users` is a allowlist tied to Supabase Auth user IDs. An authenticated user can read only their own allowlist row and cannot add themselves. `is_admin()` is a fixed-search-path security-definer function. The frontend gate is convenience; RLS, restricted column grants, checked Functions and disabled provider signups enforce access.

Browser clients cannot insert enquiries. The same-origin `/api/enquiry` handler validates the streamed request size and fields, requires a valid Turnstile token with the expected action and hostname, enforces five attempts per IP per 15 minutes with an atomic database upsert, and only then writes an enquiry with a server key. It verifies that the selected service is still active. Database outages fail closed: there is no false success.

## Photo ceiling and storage

Every photo has a slot between 1 and 10 with a unique `(entry_id, slot)` constraint. `reserve_photo` locks the parent row before choosing a free slot. Even direct duplicate or out-of-range inserts fail. The browser cannot create/delete image records or change their parent, path, status or slot. Only the checked server endpoint can reserve a slot and upload.

The private Storage bucket has no browser write/delete policies, including for administrators. Browser reads are limited by publication state, or authorised admin access. Public image proxy requests use the anon key and recheck Storage policies; responses are not cached, so unpublishing revokes new public reads. An owner-preview signed URL lasts five minutes; already issued signed URLs and downloaded copies cannot be recalled.

Phone images are decoded with orientation, resized without upscaling and re-encoded to WebP. Compression is sequential and adaptive; originals are never uploaded as a fallback. The server enforces file size, MIME/container, dimensions and a single still image. The bucket provides an additional size/type boundary. The decoder is still browser-dependent: unsupported HEIC or memory-heavy files show a helpful error.

Vehicle deletion first marks the entry as deleting/unpublished, blocking new reservations. Objects are removed through the Storage API before rows are removed. A racing upload must finalise against a non-deleting parent; otherwise it removes its object. Failed cleanups keep a pending row so the owner can retry. Service photos use a single deterministic object path per service to avoid accumulating replacements.

If an edge process is terminated at exactly the boundary between object upload and database finalisation, inspect pending uploads in the admin and Storage dashboard. Do not delete `storage.objects` rows directly: use the Storage API/dashboard so files are actually removed. After service interruptions, check Storage for any unreferenced objects and remove them via the supported API. Keep a backup before manual repairs.

## Operations

- Never commit `.env`, `.dev.vars`, owner passwords or service-role secrets. Never prefix server secrets with `VITE_`.
- Use HTTPS and exact production origins. CORS is not opened to other origins.
- Use a separate Supabase project for untrusted previews. Production database secrets do not belong in pull-request builds.
- Review Cloudflare and Supabase free-tier usage and current limits. Photos can total about 5 MB per full ten-photo car, plus Storage overhead. There is no paid email API, analytics or keep-alive traffic.
- Check the enquiry inbox routinely. There is no mail-delivery dependency for quote enquiries.
- Back up the database and bucket; GitHub does not contain managed content.
- Review and remove old enquiry data regularly. Confirm the published contact route and privacy notice match the business's actual retention practices before launch. The included privacy text is a starting notice, not a substitute for the owner's factual choices.
- Remove an owner's allowlist row promptly if access should be revoked. RLS and server checks consult that list on each request.
- Review failed GitHub checks before deploying changes. Complete the live launch checks after account setup.

## Dependency policy

The app has only React, React DOM and Supabase as runtime packages. Vite, Tailwind, TypeScript, Wrangler and PGlite are development tools. The delivery environment did not permit downloading them; generate and commit the lockfile during the first permitted install. Review dependency updates rather than silently replacing locked versions.
