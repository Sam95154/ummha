-- Native Firebase Cloud Messaging token storage for MOMIN Android.
-- Client devices cannot read or write tokens directly; only Edge Functions using
-- the service-role client may register devices or send notifications.

create table if not exists public.momin_fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key text not null,
  fcm_token text not null unique,
  platform text not null default 'android' check (platform = 'android'),
  app_id text not null default 'com.momin.noorulislam',
  announcements_enabled boolean not null default false,
  is_active boolean not null default true,
  token_updated_at timestamptz not null default now(),
  last_successful_push_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists momin_fcm_tokens_one_active_per_device
  on public.momin_fcm_tokens(user_id, device_key)
  where is_active = true;

create index if not exists momin_fcm_tokens_active_user_idx
  on public.momin_fcm_tokens(user_id, updated_at desc)
  where is_active = true;

create table if not exists public.momin_fcm_deliveries (
  id uuid primary key default gen_random_uuid(),
  admin_notification_id uuid references public.momin_admin_notifications(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token_id uuid references public.momin_fcm_tokens(id) on delete set null,
  title text not null,
  message text not null,
  route text not null default 'home',
  status text not null check (status in ('accepted', 'failed')),
  fcm_message_name text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists momin_fcm_deliveries_notification_idx
  on public.momin_fcm_deliveries(admin_notification_id, created_at desc);

create index if not exists momin_fcm_deliveries_user_idx
  on public.momin_fcm_deliveries(user_id, created_at desc);

alter table public.momin_fcm_tokens enable row level security;
alter table public.momin_fcm_deliveries enable row level security;

revoke all on public.momin_fcm_tokens from anon, authenticated;
revoke all on public.momin_fcm_deliveries from anon, authenticated;
grant all on public.momin_fcm_tokens to service_role;
grant all on public.momin_fcm_deliveries to service_role;

comment on table public.momin_fcm_tokens is
  'Private native Android FCM device tokens. Accessible only to trusted Edge Functions.';
comment on table public.momin_fcm_deliveries is
  'Server-side audit of FCM send acceptance or failures; accepted does not mean device delivery.';
