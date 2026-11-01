# MOMIN Admin Control Centre — Phase 1

Isolated, static Admin Control Centre foundation preview.

## Included
- Separate `/admin/` route and design system.
- Responsive sidebar with all specification navigation groups.
- Demo login and MFA design previews only.
- Dashboard with 13 labelled demonstration metrics, illustrative charts, activity, distributions, approvals and quick actions.
- Role catalogue and proposed permission matrix.
- Audit-log preview with local search/filter.
- System Health, staff, approvals, security and future-module design previews.
- Search, grouped navigation, modal previews, responsive layout and demo-only actions.

## Safety boundary
This is a UI-only Phase 1 preview. It does not authenticate administrators, connect to Supabase, access real users, send notifications, create campaigns, modify content, process payments or change production configuration. The login form is not a security boundary. Do not enter real credentials.

No existing MOMIN application files or Supabase objects are modified by Phase 1.

## Preview
Open `/admin/` from the repository root in a static web server.

## Next phase
After Founder review, proceed to the separately approved secured admin authentication, founder bootstrap, MFA, RLS, server-enforced permissions and audit logging phase. Then connect User Management and Notification Centre.
