-- Admin announcements default on for new accounts and newly registered Android devices.
-- Existing false values are intentionally preserved because they may be explicit user opt-outs.
alter table public.momin_profiles
  alter column announcements_enabled set default true;

alter table public.momin_fcm_tokens
  alter column announcements_enabled set default true;

comment on column public.momin_profiles.announcements_enabled is
  'Admin announcement preference. New profiles default on; existing explicit user choices are preserved.';

comment on column public.momin_fcm_tokens.announcements_enabled is
  'Admin announcement preference for this Android device. New registrations default on; existing choices are preserved.';
