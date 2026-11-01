# MOMIN Admin Panel

The Admin Panel is a separate browser application under `/admin/`. It shares MOMIN's existing Supabase project and user records.

## Current feature branch

- Branch: `feature/momin-admin-panel`
- Base: `responsive-layout`
- Entry page: `admin/index.html`
- Styles: `admin/admin.css`
- Browser application: `admin/admin.js`
- Admin API source: `supabase/functions/momin-admin-api/index.ts`
- Database migration: `supabase/migrations/20261102000100_momin_admin_panel.sql`

Do not merge this branch into `main`, `responsive-layout`, or `noor-ul-islam-live` without explicit approval.

## Local UI

From the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/admin/`.

The Admin UI uses the Supabase project configured for MOMIN. Until the Admin migration and replacement Edge Function are installed in a dedicated development database, the real owner login and data-backed modules are not available. Do not enable a mock or client-side password bypass.

## Supabase deployment requirements

1. Apply `supabase/migrations/20261102000100_momin_admin_panel.sql` to an isolated development database first.
2. Deploy `supabase/functions/momin-admin-api/index.ts` as the `momin-admin-api` Edge Function.
3. Set **Verify JWT** to **false** for this Edge Function. The Admin API uses a custom opaque bearer session, not a Supabase User JWT. The function validates the token hash against `momin_admin_sessions` and checks its expiry/revocation and linked Admin account on every protected request.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` in the server-side Edge Function environment only. It must never be exposed in browser HTML, JavaScript, source maps, or build variables.
5. Keep the Admin origin in `ALLOWED_ORIGINS` and remove any unused origins before release.
6. Run database security and performance advisors after applying the migration.

The migrations create additive tables/columns/policies and two storage buckets. User-facing campaign progress is served from an aggregate-only table maintained by a contribution trigger, not by exposing donor records. It backfills stable User IDs for existing Auth accounts. The profile trigger preserves User IDs during the existing User app's profile upsert and prevents ordinary Users from changing User IDs or Admin-managed account status.

## Initial Admin account

The migration seeds the Admin ID `owner` with a PBKDF2-SHA-256 hash and salt for the requested initial password. The plaintext password is intentionally absent from this repository. The first successful login must change the initial password. Only the hash and salt are stored in the database.

The Admin session token is opaque, stored only in browser memory, and persisted server-side as a SHA-256 token hash with an eight-hour expiry. Logout revokes the current token.

## Current integration limitations

- Online Giving checkout is not activated because no verified payment-provider configuration has been confirmed. Campaigns and verified contribution reporting are implemented; the User page must not simulate successful payments.
- Forgot-password recovery is not activated because a verified Admin recovery contact and mail-delivery configuration have not been confirmed. Admins can change their password while authenticated.
- Production migration, Edge Function replacement, Render deployment, and branch merging have not been performed as part of this feature-branch work.

## QA

Run:

```bash
npm run qa:responsive
npm run qa:admin
npm run qa:e2e
```

CI also runs the Admin browser flows. The tests use mocked API responses; they verify client workflows and do not perform real database writes, notification delivery, or payment processing.
