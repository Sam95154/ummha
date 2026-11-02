-- Make the notification/user pair directly inferable by Postgres ON CONFLICT.
-- The earlier unique index was partial (notification_id IS NOT NULL), which does
-- not match upsert(..., onConflict: 'notification_id,user_id') without a predicate.
-- Duplicate non-null pairs were checked before applying this change.
create unique index if not exists momin_user_notifications_notification_user_full_uidx
  on public.momin_user_notifications (notification_id, user_id);

drop index if exists public.momin_user_notifications_notification_user_uidx;
