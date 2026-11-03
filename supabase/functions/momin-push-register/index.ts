import { createClient } from "npm:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const APP_ORIGIN = "https://noor-ul-islam-dua.onrender.com";
// Capacitor's Android WebView uses https://localhost by default. Keep these
// exact origins allowlisted and continue requiring a valid Supabase user JWT.
const ALLOWED_ORIGINS = new Set([
  APP_ORIGIN,
  "https://localhost",
  "capacitor://localhost",
]);
function corsHeadersFor(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

function response(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeadersFor(origin), "Content-Type": "application/json" },
  });
}

function allowedEndpoint(value: string): boolean {
  try {
    const url = new globalThis.URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return false;
    return host === "fcm.googleapis.com" ||
      host === "web.push.apple.com" ||
      host.endsWith(".push.services.mozilla.com") ||
      host === "updates.push.services.mozilla.com" ||
      host.endsWith(".notify.windows.com") ||
      host === "push.yandex.ru";
  } catch { return false; }
}

async function loadPushServer() {
  const { data, error } = await admin.rpc("momin_get_webpush_config");
  if (error || !data?.vapid_keys) throw new Error("Web Push signing keys are not configured.");
  const vapidKeys = await webpush.importVapidKeys(data.vapid_keys);
  return await webpush.ApplicationServer.new({
    contactInformation: "mailto:supportmominsupport0@gmail.com",
    vapidKeys,
  });
}

async function sendOne(subscription: Record<string, unknown>, payload: Record<string, unknown>) {
  const server = await loadPushServer();
  const subscriber = server.subscribe(subscription as unknown as webpush.PushSubscription);
  await subscriber.pushTextMessage(JSON.stringify(payload), {
    urgency: webpush.Urgency.High,
    ttl: 90,
    topic: "momin-test",
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("Origin not allowed", { status: 403 });
    return new Response("ok", { headers: corsHeadersFor(origin) });
  }
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return response({ error: "Origin not allowed" }, 403, null);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return response({ error: "Authentication required" }, 401, origin);

  const userClient = createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return response({ error: "Your MOMIN session is invalid or expired." }, 401, origin);
  const user = authData.user;

  try {
    const body = await request.json();
    const action = String(body.action || "register");

    if (action === "inbox") {
      const { data, error } = await admin.from("momin_push_deliveries")
        .select("id,title,body,icon_key,route,status,created_at,sent_at,image_url,read_at")
        .eq("user_id", user.id).eq("status", "sent")
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return response({ items: data || [] }, 200, origin);
    }

    if (action === "mark_read") {
      const inboxId = String(body.inbox_id || "");
      if (!/^[0-9a-f-]{36}$/i.test(inboxId)) return response({ error: "Invalid inbox item." }, 400, origin);
      const { data, error } = await admin.from("momin_push_deliveries")
        .update({ read_at: new Date().toISOString() })
        .eq("id", inboxId).eq("user_id", user.id).eq("status", "sent")
        .select("id").maybeSingle();
      if (error) throw error;
      if (!data) return response({ error: "Notification was not found." }, 404, origin);
      return response({ success: true }, 200, origin);
    }

    if (action === "mark_all_read") {
      const { data, error } = await admin.from("momin_push_deliveries")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("status", "sent").is("read_at", null)
        .select("id");
      if (error) throw error;
      return response({ success: true, updated: (data || []).length }, 200, origin);
    }

    const deviceKey = String(body.device_key || "").trim();
    if (deviceKey.length < 8 || deviceKey.length > 200) return response({ error: "Invalid MOMIN device identifier." }, 400, origin);
    const { data: device, error: deviceError } = await admin.from("momin_devices")
      .select("id,revoked_at,device_name").eq("user_id", user.id)
      .eq("device_key", deviceKey).maybeSingle();
    if (deviceError) throw deviceError;
    if (!device) return response({ error: "This device is not registered. Please sign in again." }, 403, origin);

    /* The owner can always deactivate a subscription, including after revoking this device. */
    if (action === "unsubscribe") {
      const { error } = await admin.from("momin_push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("device_key", deviceKey);
      if (error) throw error;
      return response({ success: true, subscribed: false }, 200, origin);
    }
    if (device.revoked_at) return response({ error: "This device has been revoked. Please sign in again." }, 403, origin);

    const { data: row, error: rowError } = await admin.from("momin_push_subscriptions")
      .select("id,subscription,latitude,longitude,city,country,timezone,calculation_method,asr_school").eq("user_id", user.id)
      .eq("device_key", deviceKey).eq("is_active", true).maybeSingle();
    if (rowError) throw rowError;

    if (action === "test") {
      if (!row?.subscription) return response({ error: "This device has not enabled background notifications yet." }, 409, origin);
      await sendOne(row.subscription, {
        title: "MOMIN notification test",
        body: "Background notifications are connected to this device.",
        route: "notifications",
        icon: "b",
        tag: "momin-test-" + crypto.randomUUID(),
      });
      const { error } = await admin.from("momin_push_deliveries").insert({
        subscription_id: row.id, user_id: user.id, event_key: "test:" + crypto.randomUUID(),
        title: "MOMIN notification test", body: "Background notifications are connected to this device.",
        icon_key: "b", route: "notifications", status: "sent", sent_at: new Date().toISOString(),
      });
      if (error) throw error;
      return response({ success: true }, 200, origin);
    }

    if (action !== "register") return response({ error: "Unknown action." }, 400, origin);

    const sub = body.subscription;
    if (!sub || typeof sub.endpoint !== "string" || !allowedEndpoint(sub.endpoint) ||
        !sub.keys || typeof sub.keys.p256dh !== "string" || typeof sub.keys.auth !== "string") {
      return response({ error: "The browser returned an invalid push subscription." }, 400, origin);
    }

    const prefs = body.preferences && typeof body.preferences === "object" ? body.preferences : {};
    const times = prefs;
    const allowedTimes = {
      on: times.on !== false,
      lead: Math.max(0, Math.min(60, Number(times.lead) || 0)),
      pr: Array.isArray(times.pr) ? [0,1,2,3,4].map(i => !!times.pr[i]) : [true,true,true,true,true],
      jumuah: times.jumuah !== false,
      adhkar: !!times.adhkar,
      dates: times.dates !== false,
      sound: ["azan","chime","system","silent"].includes(times.sound) ? times.sound : "system",
      announcements: true,
    };
    const hasCoordinateValues = body.latitude !== null && body.latitude !== undefined &&
      body.longitude !== null && body.longitude !== undefined &&
      String(body.latitude) !== "" && String(body.longitude) !== "";
    const lat = hasCoordinateValues ? Number(body.latitude) : NaN;
    const lon = hasCoordinateValues ? Number(body.longitude) : NaN;
    const hasCoords = hasCoordinateValues && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
      Number.isFinite(lon) && lon >= -180 && lon <= 180;
    const city = String(body.city || "").trim().slice(0,120);
    const country = String(body.country || "").trim().slice(0,120);
    const timezone = String(body.timezone || "Asia/Kolkata").slice(0,80);
    const method = Math.max(0,Math.min(25,Number(body.calculation_method) || 3));
    const asrSchool = Number(body.asr_school) === 1 ? 1 : 0;

    const scheduleChanged = !!row && (
      row.latitude !== (hasCoords ? lat : null) ||
      row.longitude !== (hasCoords ? lon : null) ||
      String(row.city || "") !== city ||
      String(row.country || "") !== country ||
      String(row.timezone || "Asia/Kolkata") !== timezone ||
      Number(row.calculation_method || 3) !== method ||
      Number(row.asr_school || 0) !== asrSchool
    );
    const record: Record<string, unknown> = {
      user_id: user.id,
      device_key: deviceKey,
      device_name: String(body.device_name || device.device_name || "MOMIN device").slice(0,120),
      endpoint: sub.endpoint,
      subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      is_active: true,
      preferences: allowedTimes,
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lon : null,
      city: city || null,
      country: country || null,
      timezone,
      calculation_method: method,
      asr_school: asrSchool,
      updated_at: new Date().toISOString(),
      last_error: null,
    };
    if (scheduleChanged) {
      record.prayer_date = null;
      record.prayer_times = null;
      record.hijri_date = null;
    }
    const { data: saved, error: saveError } = await admin.from("momin_push_subscriptions")
      .upsert(record, { onConflict: "user_id,device_key" })
      .select("id").single();
    if (saveError) throw saveError;
    const { error: profileConsentError } = await admin.from("momin_profiles")
      .update({ announcements_enabled: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (profileConsentError) throw profileConsentError;
    return response({
      success: true, subscribed: true, subscription_id: saved.id,
      location_ready: hasCoords || !!(city && country),
      message: hasCoords || (city && country) ? "Background notifications are enabled." : "Notifications are enabled, but add your location in MOMIN for accurate prayer times.",
    }, 200, origin);
  } catch (error) {
    console.error("momin-push-register:", error);
    return response({ error: error instanceof Error ? error.message : "Push registration failed." }, 500, origin);
  }
});