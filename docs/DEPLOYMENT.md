# Setup and deployment

For the short deployment sequence, start with `START-HERE.md` at the root of the handover ZIP. The ZIP contains source code rather than an already-built `dist` release.

Local configuration templates: `.env.example` documents frontend and deployment values; `.dev.vars.example` is the server-only template for local Pages Functions. Copy templates to `.env` and `.dev.vars` privately as needed. The actual filenames are ignored by Git.

## What requires account access

Everything needed to prepare the code is included. To publish, the site maintainer needs access to the intended GitHub repository, a free Cloudflare account and a free Supabase project. The owner also needs an email address and a password for the website's private workspace. Do not put passwords or privileged keys into chat, GitHub files or frontend settings.

No paid resources, email service or purchased domain are required by this implementation. Stay on the free plans and within their quotas; review the providers' current limits. Free services are not an uptime guarantee.

## 1. GitHub

1. Create a repository, for example `apb-detailing`, in the intended owner's account.
2. Upload the contents of this project folder, including `functions`, `public`, `src`, `supabase`, `scripts` and `.github`. Do not upload `.env`, `.dev.vars`, `node_modules`, `.pages-check` or `dist`.
3. Install dependencies on a permitted machine and commit the generated `package-lock.json`. Change the workflow install step to `npm ci` once that lockfile exists.
4. Run the checks described in `VERIFICATION.md`. GitHub checks also build the frontend and compile the Pages Functions without requiring production secrets.

## 2. Supabase

1. Create a **Free** project in an appropriate region. Save its database password securely.
2. In the SQL editor, run `supabase/migrations/001_apb.sql` once, in this new project. It creates the tables, policies, five services, default settings and the private `apb-media` bucket.
3. Check that `apb-media` is **private**, permits only `image/webp`, and has a 512,000-byte file-size limit. Do not add public upload policies or change the bucket to public.
4. Under Authentication configuration, **disable new user signups**. Keep email/password sign-in enabled. There is no registration screen on the website, but the provider setting must also be disabled.
5. Copy the Project URL, the anon/publishable browser key and the service-role key into the appropriate local/Cloudflare settings. The service-role key is privileged and must never use a `VITE_` prefix.
6. After the Pages URL is known, set Supabase Auth's Site URL to that origin and allow the exact `https://YOUR-PROJECT.pages.dev/admin` redirect.

## 3. First owner account

Preferred dashboard route:

1. In Supabase Authentication → Users, manually add the owner's user with their real email and a strong password. Use auto-confirm for this manually verified owner account. Do not enable public signup.
2. Copy the created user's ID. In the SQL editor, replace the placeholder and run:

```sql
insert into public.admin_users (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID');
```

3. The owner can now use email/password login at `/admin`. Other authenticated accounts still have no editing or enquiry-reading rights.

Alternatively, the maintainer can use `scripts/owner-account.mjs` locally, with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APB_OWNER_EMAIL` and `APB_OWNER_PASSWORD` supplied as private environment variables. Run `node scripts/owner-account.mjs`. It creates an email-confirmed user and adds that user's ID to the allowlist. No credentials are printed. Clear the private environment variables afterwards. Never deploy this helper as an endpoint.

Password recovery: Supabase's default email sender is restricted to project-team addresses and is best-effort. The site's reset-link option only works where Auth email delivery is configured for the owner. For a zero-additional-service fallback, the maintainer can reset the authorised user's password with `node scripts/owner-account.mjs --reset`, supplying `APB_OWNER_USER_ID` and a new `APB_OWNER_PASSWORD` privately. A successful normal email/password login does not require outbound email.

## 4. Cloudflare Pages and Turnstile

1. In Cloudflare, create a **Pages** project connected to the GitHub repository. Choose the free plan. Suggested project name: `apb-detailing` (availability is not assumed).
2. Build command: `npm run build`. Output directory: `dist`. Root directory: the repository root. Choose a current supported Node release, at least 22.12; Node 24 is suitable.
3. The Pages project automatically compiles the top-level `functions` directory. Do not deploy `dist` alone with a static drag-and-drop workflow: that would omit the server endpoints.
4. Note the actual free `*.pages.dev` production URL assigned by Cloudflare.
5. Create a free Turnstile widget. Add that exact production hostname. Use a managed widget; the frontend submits action `quote`, which the server verifies.
6. Configure the variables below for **Production**, then rebuild/redeploy. Preview deployments should use a separate test Supabase project and test widget or keep the form unconfigured. Do not expose production secrets to untrusted preview branches.

| Variable | Where | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Build variable | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Build variable | Browser-safe anon/publishable key |
| `VITE_TURNSTILE_SITE_KEY` | Build variable | Production Turnstile site key |
| `VITE_SITE_URL` | Build variable | Actual HTTPS production origin, no trailing slash |
| `SUPABASE_URL` | Pages Functions variable | Same Project URL |
| `SUPABASE_ANON_KEY` | Pages Functions variable | Same browser-safe key |
| `SUPABASE_SERVICE_ROLE_KEY` | Pages Functions **secret** | Privileged service-role key |
| `TURNSTILE_SECRET_KEY` | Pages Functions **secret** | Turnstile server secret |
| `SITE_URL` | Pages Functions variable | Exact HTTPS production origin, no trailing slash |
| `RATE_LIMIT_SALT` | Pages Functions **secret** | Random secret, at least 32 characters |

Generate the rate-limit secret locally, for example:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The rate-limit secret hashes the request IP before storing a short-lived abuse-prevention counter. Do not use a public or reused password as this value.

7. Confirm Cloudflare reports a successful production deployment. Open its actual URL. Check `/admin`, `/privacy`, `/sitemap.xml`, a published `/work/UUID` page, uploads and a real test enquiry. Run the launch checks in `VERIFICATION.md`.
8. The owner should fill Business Settings, including at least one valid public contact route, and review the privacy notice before accepting live enquiries. Phone and WhatsApp numbers should use international format, for example a UK number beginning `+44`. The public address stays hidden until explicitly enabled.

## Recovering a paused Supabase project

The static homepage and starting service content remain available if Supabase is offline, but the portfolio, editing and form will be unavailable. Do not use keep-alive requests.

1. Sign in to the Supabase dashboard and select the project.
2. Use the dashboard's Restore/Resume action if available; wait for the project to become healthy.
3. Reopen the website, sign in and test the portfolio and a quote enquiry.
4. If the project is no longer directly restorable, follow Supabase's current export/restore instructions. Restore your own backup if required; update project URLs/keys and redeploy when those change.

Keep your own database and Storage backups. A GitHub repository contains code, not customer photos or enquiries.

## Provider references

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions pricing and quotas](https://developers.cloudflare.com/pages/functions/pricing/)
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase free-project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase Auth email restrictions](https://supabase.com/docs/guides/auth/auth-smtp)
- [ICO guidance for small organisations](https://ico.org.uk/for-organisations/advice-for-small-organisations/getting-started-with-gdpr/getting-started-with-data-protection/)
