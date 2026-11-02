-- Ensure one delivery audit record per FCM device and Admin announcement.
-- Existing production rows were checked for duplicate pairs before adding this index.
create unique index if not exists momin_fcm_deliveries_notification_device_uidx
  on public.momin_fcm_deliveries(admin_notification_id, fcm_token_id);
