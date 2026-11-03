import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_ORIGIN = "https://noor-ul-islam-dua.onrender.com";
const ALLOWED_ORIGINS = new Set([
  APP_ORIGIN,
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
]);

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function headers(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}

function reply(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply({ error: "Origin not allowed." }, 403, origin);

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Sign in to MOMIN first." }, 401, origin);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return reply({ error: "Your MOMIN session is invalid or expired." }, 401, origin);

  try {
    const body = await request.json();
    const action = String(body.action || "register");
    const deviceKey = String(body.device_key || "").trim();
    if (deviceKey.length < 8 || deviceKey.length > 200) {
      return reply({ error: "Invalid MOMIN device identifier." }, 400, origin);
    }

    const { data: device, error: deviceError } = await admin.from("momin_devices")
      .select("id,device_name,revoked_at")
      .eq("user_id", auth.user.id)
      .eq("device_key", deviceKey)
      .maybeSingle();
    if (deviceError) throw deviceError;
    if (!device || device.revoked_at) {
      return reply({ error: "This device is not registered or has been revoked. Sign in again." }, 403, origin);
    }

    if (action === "disable") {
      const { error } = await admin.from("momin_fcm_tokens")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", auth.user.id)
        .eq("device_key", deviceKey);
      if (error) throw error;
      return reply({ success: true, registered: false }, 200, origin);
    }

    if (action !== "register") return reply({ error: "Unknown FCM registration action." }, 400, origin);
    const token = String(body.fcm_token || "").trim();
    if (token.length < 40 || token.length > 8192 || /\s/.test(token)) {
      return reply({ error: "Firebase returned an invalid device token." }, 400, origin);
    }
    const appId = String(body.app_id || "com.momin.noorulislam");
    if (appId !== "com.momin.noorulislam") {
      return reply({ error: "This Firebase token belongs to an unexpected MOMIN app ID." }, 400, origin);
    }

    const { error: deactivateError } = await admin.from("momin_fcm_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", auth.user.id)
      .eq("device_key", deviceKey)
      .eq("is_active", true);
    if (deactivateError) throw deactivateError;

    const { data: saved, error: saveError } = await admin.from("momin_fcm_tokens").upsert({
      user_id: auth.user.id,
      device_key: deviceKey,
      fcm_token: token,
      platform: "android",
      app_id: appId,
      announcements_enabled: true,
      is_active: true,
      token_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    }, { onConflict: "fcm_token" }).select("id").single();
    if (saveError) throw saveError;

    return reply({ success: true, registered: true, platform: "android", token_id: saved.id }, 200, origin);
  } catch (error) {
    console.error("momin-fcm-register:", error);
    return reply({ error: error instanceof Error ? error.message : "FCM registration failed." }, 500, origin);
  }
});
