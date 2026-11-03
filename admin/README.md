# MOMIN Admin Panel

The Admin Panel is a separate browser application under `/admin/`. It shares MOMIN's existing Supabase project and user records.

## Live Admin Panel

- URL: https://momin-admin-panel.onrender.com/
- Render service: `srv-dbjp9r49v7es73apinb0`
- Render publish directory: `admin/`
- Deploy source branch: `feature/momin-admin-panel`
- Supabase Edge Function: `momin-admin-api` (deployed version 25)
- Supabase Edge Function Verify JWT: `false`, because this endpoint performs its own opaque Admin bearer-session validation. Do not change this without redesigning authentication.

## Source branch and files

- Branch: `feature/momin-admin-panel`
- Base: `responsive-layout`
- Entry page: `admin/index.html`
- Styles: `admin/admin.css`
- Browser application: `admin/admin.js`
- Admin API source: `supabase/functions/momin-admin-api/index.ts`
- Database migrations:
  - `supabase/migrations/20261102000100_momin_admin_panel.sql`
  - `supabase/migrations/20261102000200_momin_giving_public_aggregate_table.sql`
  - `supabase/migrations/20261102000300_momin_admin_policy_cleanup.sql`

Do not merge this branch into `main`, `responsive-layout`, or `noor-ul-islam-live` without explicit approval.

## Current production database state

The Admin schema has been applied to the connected MOMIN Supabase production project. It adds Admin accounts and opaque sessions, login attempts, Admin notifications and per-user inbox rows, Giving campaigns, contribution records, complaint tickets/replies, audit history, permanent User IDs, and the two media buckets.

The owner account is seeded as `owner`; its initial password is stored only as a PBKDF2-SHA-256 hash and salt. The initial password hash was checked against the requested initial password. The first successful login is forced to change that password.

The User-facing Giving aggregate is stored separately in `momin_giving_totals_public` and refreshed by a database trigger. It contains only category/currency campaign totals and contribution counts, not donor-level contribution records. The compatibility view `momin_public_giving_totals` is configured with `security_invoker = true`.

The Admin migration changes were executed directly against the project database and verified by SQL queries. They were not recorded by the Supabase migration runner in `schema_migrations`; before running a future `supabase db push` or replaying these files, reconcile the remote migration history and inspect the live schema to avoid applying changes twice.

## Authentication and secret handling

- Login ID: `owner`
- Initial password: the value supplied by the project owner. Never put it in source code, HTML, JavaScript, logs, or commits.
- Passwords are verified server-side using PBKDF2-SHA-256.
- Opaque session tokens are stored only in browser memory; the database stores only SHA-256 token hashes with expiry and revocation state.
- The first successful login must change the initial password. New passwords require at least 12 characters including uppercase, lowercase, a number, and a symbol.
- The Admin API requires a valid opaque Admin session for all protected operations.
- Keep `SUPABASE_SERVICE_ROLE_KEY` in the server-side Edge Function environment only. Never expose it in browser HTML, JavaScript, source maps, or build variables.

## User application integration status

The Admin Panel is live as a separate site. The corresponding User-side Giving/Complaints module and Admin-announcement inbox changes are on `feature/momin-admin-panel`, but the existing User app Render service still deploys from `noor-ul-islam-live`. That original User app service and branch have not been changed or replaced.

At the last production check there were zero active rows in `momin_push_subscriptions`. Do not assume push alerts are reaching devices. Users need the updated User app and active push subscriptions for end-to-end delivery. Until the User app integration is released, do not send real announcement campaigns expecting them to appear in the current production User app inbox.

## Known limitations

- Online Giving checkout is not activated because no verified payment-provider configuration has been confirmed. Campaign management and verified contribution reporting are available; the User page must not simulate successful payments.
- Forgot-password email recovery is not activated because a verified Admin recovery contact and mail-delivery configuration have not been confirmed. Admins can change their password while authenticated.
- The static Admin page has been verified live. CI browser flows use mocked API responses; they do not constitute a real production credential login or real database-write test.
- The existing MOMIN User app has not been redeployed from this feature branch. Keep its production service unchanged until a separate User-app release is approved.

## Local preview

From the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/admin/`.

## QA

Run:

```bash
npm run qa:responsive
npm run qa:admin
npm run qa:e2e
```

The CI workflow runs static checks, Admin source/security checks, and Chromium Playwright journeys. The browser tests mock the Admin API, so they verify frontend workflows but not real database writes, actual push delivery, or payment processing.
