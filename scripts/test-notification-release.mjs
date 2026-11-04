import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const admin = read("supabase/functions/momin-admin-api/index.ts");
const pushRegister = read("supabase/functions/momin-push-register/index.ts");
const fcmRegister = read("supabase/functions/momin-fcm-register/index.ts");
const settings = read("momin-settings-design-v2.js");
const mandatoryMigration = read("supabase/migrations/20261103160000_momin_admin_announcements_always_on.sql");
const deleteMigration = read("supabase/migrations/20261103164500_momin_admin_notification_delete.sql");
const serviceWorker = read("momin-sw.js");
const migration = read("supabase/migrations/20261102183000_momin_notification_release_readiness.sql");
const fcmMigration = read("supabase/migrations/20261102183500_momin_fcm_delivery_idempotency.sql");
const shell = read("momin-shared-shell-v1.js");
const bridge = read("momin-notifications-admin-inbox-v1.js");
const auth = read("momin-auth-v1.js");
const native = read("src/native/momin-capacitor-bridge.js");
const page = read("notifications.html");
const androidWorkflow = read(".github/workflows/android-build.yml");
const nativeQa = read(".github/workflows/native-fcm-qa.yml");
const signingHelper = read("scripts/configure-android-signing.mjs");

function has(source, value, label) {
  assert.ok(source.includes(value), label + " missing: " + value);
}
function notHas(source, value, label) {
  assert.ok(!source.includes(value), label + " must not contain: " + value);
}

new vm.Script(shell, { filename: "momin-shared-shell-v1.js" });
new vm.Script(bridge, { filename: "momin-notifications-admin-inbox-v1.js" });
new vm.Script(auth, { filename: "momin-auth-v1.js" });
new vm.Script(settings, { filename: "momin-settings-design-v2.js" });
console.log("PASS: Notification client-side JavaScript parses.");

// Global unread badge on the home notification bell.
has(shell, "momin-shell-unread-badge", "Home notification badge");
has(shell, "notificationUnreadCount()", "Shared-shell unread counter");
has(shell, "api.unreadCount()", "Shared-shell uses the canonical unread count");
has(shell, 'count>99?"99+"', "Unread badge caps large counts");
has(shell, 'momin:notifications-updated', "Badge refresh event");
has(shell, 'momin:app-resumed', "Badge refresh after Android app resume");
has(shell, 'momin:auth-state-changed', "Badge refresh after authentication changes");
console.log("PASS: Top bell renders and refreshes the numeric unread badge.");

// Persistent inbox read state, authentication scoping and cross-device sync.
has(bridge, "unreadCount:unreadCount", "Bridge unread count export");
has(bridge, "markInboxRead:function", "Single notification read action");
has(bridge, 'pushApi("mark_read"', "Server-persisted reminder read action");
has(bridge, 'from("momin_user_notifications")', "Server-persisted Admin inbox read action");
has(bridge, "markAllInboxRead:async function()", "Mark all read action");
has(bridge, 'pushApi("mark_all_read"', "Server-persisted mark all reminder reads");
has(bridge, "refreshInboxForLifecycle(true)", "Inbox refresh on app lifecycle");
has(bridge, 'loading Admin inbox independently', "Admin inbox is not blocked by unavailable mobile push inbox");
has(bridge, 'client.from("momin_user_notifications")', "Admin inbox is queried independently of Web Push");

has(bridge, "momin:auth-state-changed", "Inbox refresh on sign-in");
has(bridge, "read_at:item.read_at||null", "Push delivery read timestamp");
has(pushRegister, 'if (action === "mark_all_read")', "Authenticated mark-all read endpoint");
has(pushRegister, 'if (action === "mark_read")', "Authenticated single-read endpoint");
has(pushRegister, '.eq("user_id", user.id)', "Push read endpoint scopes updates to the signed-in user");
has(pushRegister, "read_at", "Push inbox reads return durable read timestamps");
has(page, 'root.classList.add("momin-notifications-embedded")', "Embedded Notifications route is detected from trusted MOMIN parent");
has(page, 'html.momin-notifications-embedded body>nav[aria-label="Main"]{display:none!important}', "Embedded Notifications hides its duplicate bottom navigation");
has(page, 'html.momin-notifications-embedded body{padding-bottom:24px!important}', "Embedded Notifications does not reserve space for the hidden navigation");
has(page, '<nav aria-label="Main">', "Standalone Notifications keeps its own bottom navigation");
has(page, "Mark all read", "Notification page action label");
has(page, "b.markAllInboxRead()", "Notification page invokes persistent mark all");
notHas(page, "b.clearInbox()", "Mark all read handler must not delete inbox entries");
console.log("PASS: Single and bulk notification read state persists on the server.");

// Charity / Giving campaign announcement lifecycle.
has(admin, "async function announceGivingCampaign", "Campaign announcement helper");
has(admin, "momin_giving_campaign_announcements", "Durable campaign announcement state");
has(admin, 'route: "giving"', "Campaign push deep-link route");
has(admin, 'status === "Active" && (!previous || previous.status !== "Active")', "Publish on new or newly activated campaign");
has(admin, 'status === "Active" && previous.status !== "Active"', "Publish on status transition");
has(admin, 'givingCampaignId: string | null = null', "Stable campaign sender identity");
has(admin, 'onConflict: "notification_id,user_id"', "Deduplicated in-app inbox insert");
has(admin, 'onConflict: "event_key"', "Deduplicated Web Push delivery audit");
notHas(admin, 'item.preferences?.announcements === true', "Web Push must not require announcement opt-in");
notHas(admin, '.eq("announcements_enabled", true)', "FCM must not require announcement opt-in");
has(settings, "admin:true,", "Admin announcements default to ON");
has(settings, 'settingsAdminNotificationsV1",true)', "Admin announcement setting is locked");
has(settings, 'if(k==="admin")v=true;', "User cannot turn Admin announcements off");
has(bridge, "base.announcements=true;", "Bridge always stores Admin announcements as ON");
has(bridge, 'put("momin-announcements-enabled","true")', "Local setting is forced ON");
has(pushRegister, "announcements: true,", "Web Push registration forces announcements ON");
has(fcmRegister, "announcements_enabled: true,", "FCM registration forces announcements ON");
has(native, "announcements_enabled: true", "Android FCM registration forces announcements ON");
has(page, 'disabled aria-disabled="true"', "Notifications page Admin setting is locked");
has(mandatoryMigration, "momin_profiles_admin_announcements_on", "Profile always-on database trigger");
has(mandatoryMigration, "momin_push_subscriptions_admin_announcements_on", "Web Push always-on database trigger");
has(mandatoryMigration, "momin_fcm_tokens_admin_announcements_on", "FCM token always-on database trigger");
has(deleteMigration, "deleted_at", "Admin notifications support soft deletion");
has(deleteMigration, "momin_cleanup_deleted_admin_notification_inbox", "Deleted announcements remove User inbox copies");
has(deleteMigration, "momin_prevent_user_notification_for_deleted_announcement", "Deleted announcements cannot be reinserted in User inbox");
has(deleteMigration, "momin_prevent_push_delivery_for_deleted_announcement", "Deleted announcements cannot be reinserted in push inbox");
has(admin, 'case "delete_notification"', "Admin API exposes authenticated notification deletion");
has(admin, '.is("deleted_at", null)', "Deleted announcements are hidden from Admin history");
has(admin, 'action: "dismiss"', "Admin API sends best-effort Web Push dismissal");
has(serviceWorker, 'payload.action === "dismiss"', "Service worker closes visible browser push messages");
has(bridge, "MOMIN_ADMIN_NOTIFICATION_DELETED", "Open User app refreshes inbox after deletion");
has(mandatoryMigration, "set announcements_enabled = true", "Existing profiles and tokens are enabled");
has(admin, 'eq("status", "accepted")', "Previously accepted FCM sends are not repeated");
has(admin, 'onConflict: "admin_notification_id,fcm_token_id"', "Idempotent FCM delivery audit");
has(migration, "momin_giving_campaign_announcements", "Campaign announcement schema");
has(migration, "unique index if not exists momin_admin_notifications_giving_campaign_uidx", "One Admin notification per campaign");
has(migration, "momin_push_deliveries(user_id, created_at desc)", "Unread reminder inbox index");
has(migration, "momin_user_notifications(notification_id, user_id)", "Unique in-app campaign inbox rows");
has(migration, "enable row level security", "Campaign announcement RLS");
has(migration, "revoke all on public.momin_giving_campaign_announcements from anon, authenticated", "Campaign announcement server-only policy");
has(fcmMigration, "momin_fcm_deliveries_notification_device_uidx", "Unique FCM campaign/device delivery index");
console.log("PASS: New Zakat, Sadaqah, Charity, and Other campaigns announce once with durable, retry-safe inbox delivery.");

// Native app lifecycle, foreground receipt and tap routing.
has(native, 'addListener("pushNotificationReceived"', "Native foreground push handling");
has(native, 'addListener("pushNotificationActionPerformed"', "Native notification tap handling");
has(native, 'openMominNotificationRoute(data.route)', "Native deep-link routing");
has(native, 'addListener("appStateChange"', "Native app foreground tracking");
has(native, 'momin:app-resumed', "Native app-resume notification event");
has(auth, "momin:auth-state-changed", "Authenticated user notification lifecycle event");
console.log("PASS: Android foreground, tap, app-resume and authentication events are wired.");

// Release build guard: placeholder Firebase config may build a debug preview only.
has(androidWorkflow, "MOMIN_GOOGLE_SERVICES_JSON", "Production Firebase app configuration secret");
has(androidWorkflow, "real_config=false", "Placeholder Firebase configuration is identified");
has(androidWorkflow, "if: steps.firebase-config.outputs.real_config == 'true'", "Production release AAB requires real Firebase configuration");
has(androidWorkflow, "Prepare Android upload key (optional)", "Android upload key preparation step");
has(androidWorkflow, "MOMIN_UPLOAD_KEYSTORE_BASE64", "Play Store upload keystore secret");
has(androidWorkflow, "Build signed Play Store AAB", "Signed Play Store app bundle build");
has(signingHelper, "MOMIN_UPLOAD_KEYSTORE_PATH", "Release signing helper reads upload key safely");
has(signingHelper, "signingConfig signingConfigs.release", "Release signing helper attaches the upload signature");
has(androidWorkflow, "targetSdkVersion", "Android build enforces Play Store target API level");
has(androidWorkflow, "steps.release-signing.outputs.ready == 'true'", "Signed Play Store AAB requires upload key and real Firebase config");
has(nativeQa, "npm run test:notifications", "Notification regression suite runs in CI");
has(nativeQa, "deno check --node-modules-dir=auto --no-lock supabase/functions/momin-push-register/index.ts", "Push registration function type-checks in CI");
console.log("PASS: Release Firebase guard and notification QA CI are present.");

console.log("MOMIN Notification Release QA passed.");
