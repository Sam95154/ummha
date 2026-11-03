-- MOMIN Admin secure, one-time password recovery tokens.
begin;

create table if not exists public.momin_admin_password_reset_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  admin_id uuid not null references public.momin_admin_accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  constraint momin_admin_password_reset_expiry_check check (expires_at > created_at)
);
create index if not exists momin_admin_password_reset_admin_recent_idx
  on public.momin_admin_password_reset_tokens(admin_id, created_at desc);

alter table public.momin_admin_password_reset_tokens enable row level security;
drop policy if exists deny_browser_access on public.momin_admin_password_reset_tokens;
create policy deny_browser_access
  on public.momin_admin_password_reset_tokens
  for all to anon, authenticated
  using (false) with check (false);

revoke all on public.momin_admin_password_reset_tokens from anon, authenticated;
grant all on public.momin_admin_password_reset_tokens to service_role;

commit;
