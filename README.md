# APB Detailing

React + Vite + Tailwind website for a fixed-location detailing business in Selby, with Supabase-managed content and Cloudflare Pages Functions.

## Delivery status

The implementation and database migration are provided. **It is not deployed or connected to live accounts.** No real customer vehicle photographs or business contact details were supplied, so the portfolio starts empty and unconfigured contact buttons are hidden. The original supplied APB logo is preserved; the old poster was not used.

The delivery environment blocked dependency downloads. TypeScript/JSX syntax transpilation and the included server-validation/embedded-Postgres tests were run using existing local tools. A full Vite build, full TypeScript type check, Cloudflare Function bundle, browser checks and real Supabase end-to-end checks must be completed once dependencies and accounts are available. See `VERIFICATION.md` for the precise boundaries.

## Included

- Public homepage with five editable services, future pricing, vehicle portfolio, individual vehicle pages and before/after slider.
- Private `/admin` owner area: showcase, services, pricing, enquiry inbox and business settings.
- Client-side phone photo resizing and WebP compression, sequential uploads and visible progress.
- Database-enforced 10-photo limit, private Storage bucket, RLS and server-side upload checks.
- Quote form with server validation, Turnstile, exact-origin checks and atomic per-IP rate limiting.
- WhatsApp click-to-chat and click-to-call when configured.
- Dynamic sitemap, basic SEO, server-generated showcase metadata and privacy page.
- Supabase migration, account setup helper, environment template, GitHub checks, deployment and owner guides.

## Start locally

Use Node 22.12+ (or Node 24 LTS) and npm. In this folder:

```sh
npm install
cp .env.example .env
npm run dev
```

On Windows, copy `.env.example` to `.env` in File Explorer or PowerShell. Fill in the **VITE_** values for the frontend. Without them, the public layout still displays and the form explains that enquiries are not open.

`npm run dev` previews the frontend only. Use `npm run build` followed by `npm run pages:dev` for the full site, including `/api` Functions. Put server-side secrets in `.dev.vars`, and set `SITE_URL` to the exact local origin printed by Wrangler. Use Cloudflare's documented Turnstile test keys for local testing only. Do not deploy those keys.

```sh
npm run check
npm test
npm run build
npx wrangler pages functions build functions --outdir .pages-check
```

The first permitted `npm install` will generate `package-lock.json`. Commit it to GitHub and then use `npm ci` in CI for reproducible installs. No lockfile was fabricated in the restricted delivery environment.

## Guides

- [Deployment and account setup](docs/DEPLOYMENT.md)
- [Owner guide](docs/OWNER-GUIDE.md)
- [Security and maintenance](docs/SECURITY.md)
- [Verification status and launch checks](VERIFICATION.md)

The separate `APB-design-preview.html` is a static, self-contained design review copy. It has no live form, login, editing or data connection. It is **not** the deployable production bundle. Deploy this source project through Cloudflare Pages.
