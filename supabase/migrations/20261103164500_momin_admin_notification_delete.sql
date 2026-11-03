-- Retain Admin notification history for audit while ensuring deleted
-- messages disappear from all MOMIN in-app notification inboxes.

alter table public.momin_admin_notifications
  add column if not exists deleted_at timestamptz;

create index if not exists momin_admin_notifications_active_created_idx
  on public.momin_admin_notifications(created_at desc)
  where deleted_at is null;

create or replace function public.momin_cleanup_deleted_admin_notification_inbox()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    delete from public.momin_user_notifications where notification_id = new.id;
    delete from public.momin_push_deliveries where event_key like 'admin:' || new.id::text || ':%';
  end if;
  return new;
end;
$$;

drop trigger if exists momin_admin_notification_cleanup_deleted_inbox on public.momin_admin_notifications;
create trigger momin_admin_notification_cleanup_deleted_inbox
after update of deleted_at on public.momin_admin_notifications
for each row execute function public.momin_cleanup_deleted_admin_notification_inbox();

create or replace function public.momin_prevent_user_notification_for_deleted_announcement()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.notification_id is not null and not exists (
    select 1 from public.momin_admin_notifications
    where id = new.notification_id and deleted_at is null
  ) then
    raise exception 'This MOMIN Admin notification has been deleted.';
  end if;
  return new;
end;
$$;

drop trigger if exists momin_user_notifications_active_admin_announcement on public.momin_user_notifications;
create trigger momin_user_notifications_active_admin_announcement
before insert or update of notification_id on public.momin_user_notifications
for each row execute function public.momin_prevent_user_notification_for_deleted_announcement();

create or replace function public.momin_prevent_push_delivery_for_deleted_announcement()
returns trigger language plpgsql set search_path = '' as $$
declare notification_id uuid;
begin
  if new.event_key ~ '^admin:[0-9a-fA-F-]{36}:' then
    notification_id := split_part(new.event_key, ':', 2)::uuid;
    if not exists (
      select 1 from public.momin_admin_notifications
      where id = notification_id and deleted_at is null
    ) then
      raise exception 'This MOMIN Admin notification has been deleted.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists momin_push_deliveries_active_admin_announcement on public.momin_push_deliveries;
create trigger momin_push_deliveries_active_admin_announcement
before insert or update of event_key on public.momin_push_deliveries
for each row execute function public.momin_prevent_push_delivery_for_deleted_announcement();
