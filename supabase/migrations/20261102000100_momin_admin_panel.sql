-- MOMIN Admin Panel foundation
-- Safe additive migration. Apply to the dedicated development database first.
begin;

alter table public.momin_profiles
  add column if not exists public_user_id text;
alter table public.momin_profiles
  add column if not exists account_status text not null default 'Active'
  check (account_status in ('Active','Inactive'));

update public.momin_profiles
set public_user_id = 'MOM-' || upper(substr(replace(user_id::text, '-', ''), 1, 10))
where public_user_id is null;

alter table public.momin_profiles
  alter column public_user_id set default ('MOM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));

alter table public.momin_profiles
  alter column public_user_id set not null;

create unique index if not exists momin_profiles_public_user_id_uidx
  on public.momin_profiles(public_user_id);

create table if not exists public.momin_admin_accounts (
  id uuid primary key default gen_random_uuid(),
  login_id text not null unique check (login_id = lower(login_id) and char_length(login_id) between 3 and 60),
  display_name text not null default 'MOMIN Owner',
  password_salt text not null,
  password_hash text not null,
  password_iterations integer not null default 310000 check (password_iterations >= 200000),
  force_password_change boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Only the PBKDF2 hash and salt are stored. The initial password is never written to this migration.
insert into public.momin_admin_accounts
  (login_id, display_name, password_salt, password_hash, password_iterations, force_password_change)
values
  ('owner', 'MOMIN Owner', 'L+a/IDz/Fshx79ZMzDNiGA==', 'CUdcOCubITZxkjDnsf7pLztuzs0lTE2vGEx+eq1LQXc=', 310000, true)
on conflict (login_id) do nothing;

create table if not exists public.momin_admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references public.momin_admin_accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists momin_admin_sessions_admin_idx on public.momin_admin_sessions(admin_id, expires_at);

create table if not exists public.momin_admin_login_attempts (
  id bigint generated always as identity primary key,
  login_id text not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists momin_admin_login_attempts_recent_idx
  on public.momin_admin_login_attempts(login_id, created_at desc);

create table if not exists public.momin_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  message text not null check (char_length(message) between 1 and 1000),
  audience_type text not null check (audience_type in ('all','selected','individual')),
  route text not null default 'home' check (route in ('home','prayers','quran','duas','calendar','notifications','settings','journey','giving','complaints')),
  image_url text,
  status text not null default 'queued' check (status in ('queued','sending','sent','partial','failed')),
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references public.momin_admin_accounts(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists momin_admin_notifications_created_idx
  on public.momin_admin_notifications(created_at desc);

create table if not exists public.momin_user_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.momin_admin_notifications(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  route text not null default 'home',
  image_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists momin_user_notifications_user_idx
  on public.momin_user_notifications(user_id, created_at desc);
create unique index if not exists momin_user_notifications_notification_user_uidx
  on public.momin_user_notifications(notification_id, user_id)
  where notification_id is not null;

create table if not exists public.momin_giving_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (category in ('Zakat','Sadaqah','Charity','Other approved')),
  description text not null default '',
  image_url text,
  target_amount numeric(14,2) not null check (target_amount > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  starts_at date,
  ends_at date,
  donation_instructions text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Active','Paused','Completed')),
  created_by uuid references public.momin_admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint momin_giving_dates_check check (starts_at is null or ends_at is null or ends_at >= starts_at)
);
create index if not exists momin_giving_campaigns_status_idx on public.momin_giving_campaigns(status, created_at desc);

create table if not exists public.momin_contributions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.momin_giving_campaigns(id),
  user_id uuid references auth.users(id) on delete set null,
  transaction_ref text not null unique,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  fund_category text not null check (fund_category in ('Zakat','Sadaqah','Charity','Other approved')),
  payment_status text not null default 'pending' check (payment_status in ('pending','verified','failed','refunded')),
  receipt_status text not null default 'not_issued' check (receipt_status in ('not_issued','issued','failed')),
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index if not exists momin_contributions_campaign_idx on public.momin_contributions(campaign_id, created_at desc);
create index if not exists momin_contributions_user_idx on public.momin_contributions(user_id, created_at desc);
create index if not exists momin_contributions_fund_idx on public.momin_contributions(fund_category, payment_status);

create table if not exists public.momin_complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null unique default ('MOM-C-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  subject text not null check (char_length(subject) between 2 and 120),
  description text not null check (char_length(description) between 10 and 5000),
  priority text not null default 'Normal' check (priority in ('Low','Normal','High')),
  status text not null default 'Open' check (status in ('Open','Pending','In Progress','Resolved','Closed')),
  attachment_path text,
  created_by_admin uuid references public.momin_admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz
);
create index if not exists momin_complaints_user_idx on public.momin_complaints(user_id, created_at desc);
create index if not exists momin_complaints_status_idx on public.momin_complaints(status, updated_at desc);

create table if not exists public.momin_complaint_replies (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.momin_complaints(id) on delete cascade,
  author_type text not null check (author_type in ('admin','user')),
  author_user_id uuid references auth.users(id) on delete set null,
  admin_id uuid references public.momin_admin_accounts(id),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists momin_complaint_replies_complaint_idx
  on public.momin_complaint_replies(complaint_id, created_at);

create table if not exists public.momin_admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.momin_admin_accounts(id),
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists momin_admin_audit_recent_idx on public.momin_admin_audit_log(created_at desc);

alter table public.momin_admin_accounts enable row level security;
alter table public.momin_admin_sessions enable row level security;
alter table public.momin_admin_login_attempts enable row level security;
alter table public.momin_admin_notifications enable row level security;
alter table public.momin_user_notifications enable row level security;
alter table public.momin_giving_campaigns enable row level security;
alter table public.momin_contributions enable row level security;
alter table public.momin_complaints enable row level security;
alter table public.momin_complaint_replies enable row level security;
alter table public.momin_admin_audit_log enable row level security;

-- Explicitly prevent browser clients from accessing privileged administration data.
do $$
declare t text;
begin
  foreach t in array array[
    'momin_admin_accounts','momin_admin_sessions','momin_admin_login_attempts',
    'momin_admin_notifications','momin_giving_campaigns','momin_contributions',
    'momin_admin_audit_log'
  ] loop
    execute format('drop policy if exists deny_browser_access on public.%I', t);
    execute format('create policy deny_browser_access on public.%I for all to anon, authenticated using (false) with check (false)', t);
  end loop;
end $$;

-- Users may read their own notifications and update only the read timestamp.
revoke all on public.momin_user_notifications from anon, authenticated;
grant select on public.momin_user_notifications to authenticated;
grant update (read_at) on public.momin_user_notifications to authenticated;

-- User IDs and account status are server-managed immutable/protected fields.
create or replace function public.momin_protect_admin_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if new.public_user_id is distinct from old.public_user_id then
      raise exception 'User ID is permanent and cannot be changed.';
    end if;
    if new.account_status is distinct from old.account_status then
      raise exception 'Account status can only be changed by MOMIN Admin.';
    end if;
  end if;
  return new;
end;
$;

drop trigger if exists momin_protect_admin_profile_fields on public.momin_profiles;
create trigger momin_protect_admin_profile_fields
before update on public.momin_profiles
for each row execute function public.momin_protect_admin_profile_fields();

grant select on public.momin_giving_campaigns to authenticated;
grant select on public.momin_contributions to authenticated;
grant select, insert on public.momin_complaints to authenticated;
grant select on public.momin_complaint_replies to authenticated;

drop policy if exists user_reads_own_notifications on public.momin_user_notifications;
create policy user_reads_own_notifications
  on public.momin_user_notifications for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists user_marks_own_notifications_read on public.momin_user_notifications;
create policy user_marks_own_notifications_read
  on public.momin_user_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists users_read_active_giving_campaigns on public.momin_giving_campaigns;
create policy users_read_active_giving_campaigns
  on public.momin_giving_campaigns for select to authenticated
  using (status = 'Active');

drop policy if exists users_read_own_contributions on public.momin_contributions;
create policy users_read_own_contributions
  on public.momin_contributions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists users_read_own_complaints on public.momin_complaints;
create policy users_read_own_complaints
  on public.momin_complaints for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists users_create_own_complaints on public.momin_complaints;
create policy users_create_own_complaints
  on public.momin_complaints for insert to authenticated
  with check ((select auth.uid()) = user_id and created_by_admin is null and status = 'Open');

drop policy if exists users_read_replies_to_own_complaints on public.momin_complaint_replies;
create policy users_read_replies_to_own_complaints
  on public.momin_complaint_replies for select to authenticated
  using (exists (
    select 1 from public.momin_complaints c
    where c.id = complaint_id and c.user_id = (select auth.uid())
  ));

-- Public campaign art is readable, but uploads/writes are service-role only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('momin-admin-media','momin-admin-media',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Complaint files are private; end-user writes are restricted to their own UUID path.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('momin-complaint-attachments','momin-complaint-attachments',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists users_upload_own_complaint_attachments on storage.objects;
create policy users_upload_own_complaint_attachments
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'momin-complaint-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists users_read_own_complaint_attachments on storage.objects;
create policy users_read_own_complaint_attachments
  on storage.objects for select to authenticated
  using (
    bucket_id = 'momin-complaint-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Privileged tables are used only through the server-side Edge Function/service role.
revoke all on public.momin_admin_accounts, public.momin_admin_sessions,
  public.momin_admin_login_attempts, public.momin_admin_notifications,
  public.momin_giving_campaigns, public.momin_contributions,
  public.momin_admin_audit_log from anon, authenticated;

commit;
