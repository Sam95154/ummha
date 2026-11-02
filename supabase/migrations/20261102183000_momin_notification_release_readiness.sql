-- MOMIN notification release readiness
-- Persist web-push inbox read state and ensure each Giving campaign has one announcement.

alter table public.momin_push_deliveries
  add column if not exists read_at timestamptz;

create index if not exists momin_push_deliveries_unread_user_idx
  on public.momin_push_deliveries(user_id, created_at desc)
  where read_at is null;

create unique index if not exists momin_user_notifications_notification_user_uidx
  on public.momin_user_notifications(notification_id, user_id);

create unique index if not exists momin_push_deliveries_event_key_uidx
  on public.momin_push_deliveries(event_key);

alter table public.momin_admin_notifications
  add column if not exists giving_campaign_id uuid
  references public.momin_giving_campaigns(id) on delete set null;

create unique index if not exists momin_admin_notifications_giving_campaign_uidx
  on public.momin_admin_notifications(giving_campaign_id);

create table if not exists public.momin_giving_campaign_announcements (
  campaign_id uuid primary key references public.momin_giving_campaigns(id) on delete cascade,
  notification_id uuid references public.momin_admin_notifications(id) on delete set null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  recipient_count integer not null default 0,
  push_sent integer not null default 0,
  push_failed integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists momin_giving_campaign_announcements_status_idx
  on public.momin_giving_campaign_announcements(status, updated_at desc);

alter table public.momin_giving_campaign_announcements enable row level security;
revoke all on public.momin_giving_campaign_announcements from anon, authenticated;
grant all on public.momin_giving_campaign_announcements to service_role;

create index if not exists momin_fcm_deliveries_token_id_idx
  on public.momin_fcm_deliveries(fcm_token_id);
