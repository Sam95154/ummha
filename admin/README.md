# MOMIN Admin Control Centre — Phase 2

Separate administration route: `/admin/`

## Connected in Phase 2

- Supabase Auth sign-in with Google or email/password.
- Email verification and required profile completion before admin access.
- TOTP authenticator enrollment and challenge; admin Edge Function requires an AAL2 session.
- Server-validated staff membership and permission keys; Founder bootstrap is server-side only.
- User list, search, filters, pagination, masked email for roles without PII, current profile status, provider, last sign-in, devices and announcement opt-in.
- Admin membership is preflight-checked before MFA enrolment; normal MOMIN accounts are not prompted to create an admin authenticator.
- Notification Managers receive a recipient-only search action over users who explicitly opted into App Announcements; they do not need broad User Management access.
- Individual user detail, device revocation, account suspension/reactivation with reason and audit record.
- Notification templates and campaigns, individual/selected/all opted-in audience, country, recent users, push-enabled and Android/iOS/Web device targeting.
- Notification image upload (JPG/PNG/WebP, max 2 MB), live mobile preview, destination, action label, test to the administrator's current push device, save draft, schedule and send-now workflow.
- App Announcements preference in the user Notifications page, explicitly separate from prayer reminders and defaulted off.
- In-app campaign inbox and push deliveries, per-recipient reports, scheduled campaigns, expiry, approval for broadcasts above 1,000 recipients.
- Scheduled campaign processing added to the existing once-per-minute push scheduler without replacing prayer reminder processing.
- Server-side RLS-denied client access for admin tables, service-role only access, immutable audit rows.

## Important boundaries

- No broadcast was sent during deployment or testing.
- Staff role lookup is server-side. A Notification Manager can search only eligible opted-in recipients; the Founder remains the only role with high-volume broadcast approval permission.
- Campaigns are created as drafts and only queued after an explicit administrator action. Future campaigns are processed at the scheduled time.
- Campaign targeting re-checks App Announcements opt-in at delivery. Prayer reminders are not treated as announcement consent.
- Push provider acceptance is not a confirmed device delivery.
- Language audience targeting is not enabled because the current MOMIN profile schema does not contain a reliable language field.
- Giving/Zakat/Finance, Content Studio, CMS, Support, Moderation, Mosque/Learning modules remain planned phases. The navigation is present, but those pages are not yet production controls.
- No service-role key is placed in the browser. Admin operations go through the `momin-admin-api` Edge Function.
- The Admin Panel uses the existing authenticated MOMIN identity. Only an account present in `admin_staff` and with an active status is admitted. TOTP AAL2 is required.

## Supabase resources

- Edge Function: `momin-admin-api` (JWT verification enabled)
- Existing Edge Function extended: `momin-push-register`
- Existing Edge Function extended: `momin-push-scheduler`
- New tables include `admin_staff`, `admin_role_permissions`, `admin_audit_logs`, `admin_approvals`, `admin_notification_campaigns`, `admin_notification_recipients`, `admin_notification_templates`, `admin_notification_inbox`, `admin_notification_push_deliveries`.
- All admin tables have RLS enabled, deny-all policies for anon/authenticated, and service-role grants only.

## Founder first login

1. Open `/admin/`.
2. Sign in using the existing Founder MOMIN account.
3. Complete profile setup first if MOMIN requests it.
4. Enroll an authenticator app on first admin entry and verify the current six-digit TOTP.
5. Only after the server returns the active Founder role and AAL2 assurance will the dashboard open.

## Deployment

This directory is static content served by the existing Render static site. No build command is required. Keep this Admin Panel isolated from the user-facing MOMIN application.
