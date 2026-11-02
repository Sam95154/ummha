-- Allow signed-in MOMIN users to read only Admin-published giving campaigns.
-- Campaign writes remain restricted to the server-side service role.
-- Public aggregate totals contain no donor-level information.

revoke all privileges on table public.momin_giving_campaigns from anon, authenticated;
grant select on table public.momin_giving_campaigns to authenticated;

revoke all privileges on table public.momin_giving_totals_public from anon, authenticated;
grant select on table public.momin_giving_totals_public to authenticated;

-- Keep the existing RLS policies in force:
--   momin_giving_campaigns: authenticated users can SELECT Active campaigns only.
--   momin_giving_totals_public: authenticated users can SELECT aggregate totals.
-- No INSERT, UPDATE, or DELETE policy is added for browser users.
