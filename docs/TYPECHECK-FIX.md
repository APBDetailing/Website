# Type-check correction

This revision fixes the four TypeScript errors reported during deployment:

- Login and password changes now check Supabase Auth's `error` directly, avoiding the generic database helper's incompatible inference for Auth success/error unions.
- Creating a vehicle checks for a missing returned record before accessing its ID.
- The settings query applies `abortSignal` before the terminal `single` call.
- The same call-order issue was also corrected in the server-side vehicle-page query before `maybeSingle`.

For an existing extracted project, replace only these three files from the corrected package:

1. `src/admin.tsx`
2. `src/public.tsx`
3. `functions/work/[id].js`

Keep your own `.env`, `.dev.vars`, `package-lock.json`, installed dependencies and account configuration. No database changes or dependency reinstall are required for these corrections.

Then run:

```sh
npm run check
npm test
npm run build
npx wrangler pages functions build functions --outdir .pages-check
```

Local syntax checks were repeated after the fix. A full check against installed application dependencies remains to be run in the deployment environment; those dependencies are not installed in the restricted delivery workspace.
