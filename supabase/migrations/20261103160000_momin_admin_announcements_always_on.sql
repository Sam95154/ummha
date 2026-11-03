-- Admin announcements are mandatory for every MOMIN account and device.
-- This keeps old clients and direct preference writes from disabling Admin updates.

alter table public.momin_profiles alter column announcements_enabled set default true;
alter table public.momin_fcm_tokens alter column announcements_enabled set default true;
alter table public.momin_push_subscriptions alter column preferences set default
  '{"on":true,"pr":[true,true,true,true,true],"lead":0,"dates":true,"sound":"azan","adhkar":false,"jumuah":true,"announcements":true}'::jsonb;

create or replace function public.momin_enforce_admin_announcements_on()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.announcements_enabled := true;
  return new;
end;
$$;

drop trigger if exists momin_profiles_admin_announcements_on on public.momin_profiles;
create trigger momin_profiles_admin_announcements_on
before insert or update of announcements_enabled on public.momin_profiles
for each row execute function public.momin_enforce_admin_announcements_on();

drop trigger if exists momin_fcm_tokens_admin_announcements_on on public.momin_fcm_tokens;
create trigger momin_fcm_tokens_admin_announcements_on
before insert or update of announcements_enabled on public.momin_fcm_tokens
for each row execute function public.momin_enforce_admin_announcements_on();

create or replace function public.momin_enforce_push_admin_announcements_on()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.preferences := jsonb_set(coalesce(new.preferences, '{}'::jsonb), '{announcements}', 'true'::jsonb, true);
  return new;
end;
$$;

drop trigger if exists momin_push_subscriptions_admin_announcements_on on public.momin_push_subscriptions;
create trigger momin_push_subscriptions_admin_announcements_on
before insert or update of preferences on public.momin_push_subscriptions
for each row execute function public.momin_enforce_push_admin_announcements_on();

update public.momin_profiles set announcements_enabled = true
where announcements_enabled is distinct from true;
update public.momin_fcm_tokens set announcements_enabled = true
where announcements_enabled is distinct from true;
update public.momin_push_subscriptions
set preferences = jsonb_set(coalesce(preferences, '{}'::jsonb), '{announcements}', 'true'::jsonb, true)
where coalesce(preferences->>'announcements', 'false') <> 'true';
