-- MOMIN Admin policy cleanup and supporting foreign-key indexes.
-- Giving campaigns remain readable only when Active. Contribution records remain
-- readable only by their own authenticated user. Neither table allows user writes.

drop policy if exists deny_browser_access on public.momin_contributions;
drop policy if exists deny_browser_access on public.momin_giving_campaigns;

create index if not exists momin_admin_audit_log_admin_idx
  on public.momin_admin_audit_log(admin_id);
create index if not exists momin_admin_notifications_created_by_idx
  on public.momin_admin_notifications(created_by);
create index if not exists momin_complaint_replies_admin_idx
  on public.momin_complaint_replies(admin_id);
create index if not exists momin_complaint_replies_author_user_idx
  on public.momin_complaint_replies(author_user_id);
create index if not exists momin_complaints_created_by_admin_idx
  on public.momin_complaints(created_by_admin);
create index if not exists momin_giving_campaigns_created_by_idx
  on public.momin_giving_campaigns(created_by);
