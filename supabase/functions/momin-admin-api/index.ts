import { createClient } from "npm:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ALLOWED_ORIGINS = new Set([
  "https://momin-admin-panel.onrender.com",
  "http://localhost:8000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:8000",
]);
const encoder = new TextEncoder();
const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://momin-admin-panel.onrender.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    ...jsonHeaders,
  };
}
function reply(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}
function b64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromB64(value: string) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return b64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
}
async function derivePassword(password: string, saltText: string, iterations: number) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2", salt: fromB64(saltText), iterations, hash: "SHA-256",
  }, material, 256);
  return b64(new Uint8Array(bits));
}
function constantTimeEqual(a: string, b: string) {
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  const size = Math.max(aa.length, bb.length);
  for (let i = 0; i < size; i++) diff |= (aa[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}
function validText(value: unknown, min: number, max: number) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}
function safeRoute(value: unknown) {
  const allowed = ["home", "prayers", "quran", "duas", "calendar", "notifications", "settings", "journey", "giving", "complaints"];
  return typeof value === "string" && allowed.includes(value) ? value : "home";
}
async function audit(adminId: string, action: string, targetType?: string, targetId?: string, details: Record<string, unknown> = {}) {
  await db.from("momin_admin_audit_log").insert({
    admin_id: adminId, action, target_type: targetType || null, target_id: targetId || null, details,
  });
}
async function requireAdmin(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token.length < 30) return { error: "Admin session required.", status: 401 as const };
  const tokenHash = await sha256(token);
  const { data, error } = await db.from("momin_admin_sessions")
    .select("token_hash,admin_id,expires_at,revoked_at,momin_admin_accounts!inner(id,login_id,display_name,is_active,force_password_change)")
    .eq("token_hash", tokenHash).is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !data || !data.momin_admin_accounts?.is_active) {
    return { error: "Admin session is invalid or expired. Please sign in again.", status: 401 as const };
  }
  await db.from("momin_admin_sessions").update({ last_seen_at: new Date().toISOString() }).eq("token_hash", tokenHash);
  return { tokenHash, adminId: data.admin_id as string, account: data.momin_admin_accounts };
}
async function getAuthUsers(page = 1, perPage = 100) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage });
  if (error) throw error;
  const users = data.users || [];
  const ids = users.map(u => u.id);
  const profilesResult = ids.length
    ? await db.from("momin_profiles").select("user_id,public_user_id,display_name,email,account_status,created_at,updated_at,avatar_url").in("user_id", ids)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profiles = new Map((profilesResult.data || []).map(p => [p.user_id, p]));
  return users.map(u => {
    const p = profiles.get(u.id);
    return {
      id: u.id,
      user_id: p?.public_user_id || ("MOM-" + u.id.replaceAll("-", "").slice(0, 10).toUpperCase()),
      name: p?.display_name || u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split("@")[0] || "MOMIN User",
      email: u.email || "",
      phone: u.phone || "",
      registered_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      status: p?.account_status || "Active",
      avatar_url: p?.avatar_url || null,
    };
  });
}
async function dashboard() {
  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [{ count: totalUsers }, { count: activeUsers }, { count: notifications },
    { count: openComplaints }, { count: resolvedComplaints }, { data: campaigns },
    { data: contributions }, { count: newRegistrationCount }, { data: weeklyProfiles },
    { count: inboxCount }, { count: inboxReadCount }, { data: complaintRows },
    { data: recentProfiles }] = await Promise.all([
    db.from("momin_profiles").select("user_id", { count: "exact", head: true }),
    db.from("momin_profiles").select("user_id", { count: "exact", head: true }).eq("account_status", "Active"),
    db.from("momin_admin_notifications").select("id", { count: "exact", head: true }),
    db.from("momin_complaints").select("id", { count: "exact", head: true }).in("status", ["Open", "Pending", "In Progress"]),
    db.from("momin_complaints").select("id", { count: "exact", head: true }).eq("status", "Resolved"),
    db.from("momin_giving_campaigns").select("id,name,category,target_amount,currency,status,created_at"),
    db.from("momin_contributions").select("campaign_id,fund_category,amount,currency,payment_status"),
    db.from("momin_profiles").select("user_id", { count: "exact", head: true }).gte("created_at", monthAgo.toISOString()),
    db.from("momin_profiles").select("created_at").gte("created_at", weekAgo.toISOString()).order("created_at", { ascending: true }).limit(5000),
    db.from("momin_user_notifications").select("id", { count: "exact", head: true }),
    db.from("momin_user_notifications").select("id", { count: "exact", head: true }).not("read_at", "is", null),
    db.from("momin_complaints").select("status"),
    db.from("momin_profiles").select("user_id,public_user_id,display_name,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const verified = (contributions || []).filter(x => x.payment_status === "verified");
  const amount = verified.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000);
    return day.toISOString().slice(0, 10);
  });
  const registrationsByDay = new Map(sevenDays.map(day => [day, 0]));
  for (const row of weeklyProfiles || []) {
    if (!row.created_at) continue;
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    if (registrationsByDay.has(day)) registrationsByDay.set(day, registrationsByDay.get(day) + 1);
  }
  const givingByFund = ["Zakat", "Sadaqah", "Charity"].map(category => ({
    label: category,
    value: verified.filter(x => x.fund_category === category).reduce((sum, x) => sum + Number(x.amount || 0), 0),
  }));
  const campaignSummary = (campaigns || []).map(c => {
    const campaignTx = verified.filter(x => x.campaign_id === c.id);
    const received = campaignTx.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    return { ...c, received_amount: received, contribution_count: campaignTx.length,
      progress: c.target_amount ? Math.min(100, Math.round(received / Number(c.target_amount) * 100)) : 0 };
  });
  const readRate = (inboxCount || 0) > 0 ? Math.round((inboxReadCount || 0) / inboxCount * 100) : 0;
  return {
    metrics: {
      total_users: totalUsers || 0, active_users: activeUsers || 0,
      inactive_users: Math.max(0, (totalUsers || 0) - (activeUsers || 0)),
      new_registrations: newRegistrationCount || 0,
      notifications_sent: notifications || 0, notification_read_rate: readRate,
      active_campaigns: campaignSummary.filter(x => x.status === "Active").length,
      contributions_total: amount,
      open_complaints: openComplaints || 0, resolved_complaints: resolvedComplaints || 0,
    },
    registrations_series: sevenDays.map(day => ({
      label: new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
      value: registrationsByDay.get(day) || 0,
    })),
    giving_by_fund: givingByFund,
    campaigns: campaignSummary,
    complaint_status: ["Open", "Pending", "In Progress", "Resolved", "Closed"].map(status => ({
      status, count: (complaintRows || []).filter(x => x.status === status).length,
    })),
    recent_users: recentProfiles || [],
  };
}
async function listUsers(body: Record<string, unknown>) {
  const page = Math.max(1, Math.min(10000, Number(body.page || 1)));
  const pageSize = 50;
  const query = String(body.q || "").trim().slice(0, 100);
  const status = String(body.status || "all");
  let request = db.from("momin_profiles")
    .select("user_id,public_user_id,display_name,email,account_status,created_at,avatar_url", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (status === "Active" || status === "Inactive") request = request.eq("account_status", status);
  if (query) {
    const safe = query.replace(/[^\p{L}\p{N}@._+\-\s]/gu, "").trim().split(/\s+/).filter(Boolean).join("%");
    if (safe) request = request.or("public_user_id.ilike.%"+safe+"%,display_name.ilike.%"+safe+"%,email.ilike.%"+safe+"%");
  }
  const { data, error, count } = await request;
  if (error) throw error;
  const users = (data || []).map(p => ({
    id: p.user_id,
    user_id: p.public_user_id,
    name: p.display_name || p.email?.split("@")[0] || "MOMIN User",
    email: p.email || "",
    phone: "",
    registered_at: p.created_at,
    last_sign_in_at: null,
    status: p.account_status || "Active",
    avatar_url: p.avatar_url || null,
  }));
  return { users, page, page_size: pageSize, total: count || 0, has_more: page * pageSize < (count || 0) };
}
async function updateUser(body: Record<string, unknown>, adminId: string) {
  const id = String(body.id || "");
  const name = String(body.name || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !validText(name, 2, 80)) throw new Error("Enter a valid user and a name between 2 and 80 characters.");
  const { data: authData, error: authError } = await db.auth.admin.getUserById(id);
  if (authError || !authData.user) throw new Error("MOMIN user was not found.");
  const meta = { ...(authData.user.user_metadata || {}), display_name: name, full_name: name };
  const { error: updateAuthError } = await db.auth.admin.updateUserById(id, { user_metadata: meta });
  if (updateAuthError) throw updateAuthError;
  const { error } = await db.from("momin_profiles").upsert({
    user_id: id, display_name: name, email: authData.user.email || null, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
  await audit(adminId, "user.name_updated", "user", id, { display_name: name });
  return { success: true };
}
async function setUserStatus(body: Record<string, unknown>, adminId: string) {
  const id = String(body.id || "");
  const status = body.status === "Inactive" ? "Inactive" : "Active";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid user ID.");
  const { error } = await db.from("momin_profiles").update({ account_status: status, updated_at: new Date().toISOString() }).eq("user_id", id);
  if (error) throw error;
  if (status === "Inactive") {
    const { error: banError } = await db.auth.admin.updateUserById(id, { ban_duration: "876000h" });
    if (banError) throw banError;
  } else {
    const { error: unbanError } = await db.auth.admin.updateUserById(id, { ban_duration: "none" });
    if (unbanError) throw unbanError;
  }
  await audit(adminId, "user.status_updated", "user", id, { status });
  return { success: true, status };
}
async function loadVapidServer() {
  const { data, error } = await db.rpc("momin_get_webpush_config");
  if (error || !data?.vapid_keys) throw new Error("MOMIN push signing keys are not configured.");
  const vapidKeys = await webpush.importVapidKeys(data.vapid_keys);
  return webpush.ApplicationServer.new({ contactInformation: "mailto:support@noor-ul-islam-dua.onrender.com", vapidKeys });
}
function normalizeAdminMediaUrl(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Invalid media URL.");
  const prefix = SUPABASE_URL.replace(/\\/$/, "") + "/storage/v1/object/public/momin-admin-media/";
  if (!value.startsWith(prefix) || value.length > 2048) throw new Error("Media must be uploaded to MOMIN Admin storage.");
  return value;
}
async function activeRecipientIds(audience: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (audience !== "all") {
    if (!unique.length || (audience === "individual" && unique.length !== 1)) throw new Error("Select the intended MOMIN user or users.");
    if (unique.some(id => !/^[0-9a-f-]{36}$/i.test(id))) throw new Error("Invalid selected User ID.");
    const active = new Set<string>();
    for (let i = 0; i < unique.length; i += 500) {
      const { data, error } = await db.from("momin_profiles").select("user_id")
        .eq("account_status", "Active").in("user_id", unique.slice(i, i + 500));
      if (error) throw error;
      (data || []).forEach(row => active.add(row.user_id));
    }
    if (active.size !== unique.length) throw new Error("One or more selected MOMIN accounts are inactive or unavailable.");
    return unique;
  }
  const recipients: string[] = [];
  const pageSize = 500;
  for (let offset = 0; offset < 500000; offset += pageSize) {
    const { data, error } = await db.from("momin_profiles").select("user_id")
      .eq("account_status", "Active").order("created_at", { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    const batch = data || [];
    recipients.push(...batch.map(row => row.user_id));
    if (batch.length < pageSize) break;
  }
  return recipients;
}
async function sendNotification(body: Record<string, unknown>, adminId: string) {
  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();
  const audience = String(body.audience || "all");
  const route = safeRoute(body.route);
  const ids = Array.isArray(body.user_ids) ? body.user_ids.map(String) : [];
  if (!validText(title, 1, 80) || !validText(message, 1, 1000)) throw new Error("Enter a title and message.");
  if (!["all", "selected", "individual"].includes(audience)) throw new Error("Invalid audience.");
  if (audience !== "all" && (ids.length === 0 || (audience === "individual" && ids.length !== 1))) throw new Error("Select the intended MOMIN user or users.");
  const recipients = await activeRecipientIds(audience, ids);
  if (!recipients.length) throw new Error("No active MOMIN users were found.");
  const imageUrl = normalizeAdminMediaUrl(body.image_url);
  const { data: campaign, error: campaignError } = await db.from("momin_admin_notifications").insert({
    title, message, audience_type: audience, route, image_url: imageUrl, status: "sending",
    recipient_count: recipients.length, created_by: adminId,
  }).select("id").single();
  if (campaignError) throw campaignError;
  const inboxRows = recipients.map(user_id => ({ notification_id: campaign.id, user_id, title, message, route, image_url: imageUrl }));
  for (let i = 0; i < inboxRows.length; i += 500) {
    const { error } = await db.from("momin_user_notifications").insert(inboxRows.slice(i, i + 500));
    if (error) throw error;
  }
  let sent = 0, failed = 0;
  let server: webpush.ApplicationServer | null = null;
  try { server = await loadVapidServer(); } catch (_) { server = null; }
  for (let start = 0; start < recipients.length; start += 100) {
    const userBatch = recipients.slice(start, start + 100);
    const { data: subscriptions, error: subError } = await db.from("momin_push_subscriptions")
      .select("id,user_id,device_key,subscription,is_active")
      .in("user_id", userBatch).eq("is_active", true);
    if (subError) throw subError;
    for (const row of subscriptions || []) {
    const eventKey = "admin:" + campaign.id + ":" + row.id;
    let status = "failed", errorText: string | null = null;
    if (server) {
      try {
        const subscriber = server.subscribe(row.subscription as webpush.PushSubscription);
        await subscriber.pushTextMessage(JSON.stringify({
          title, body: message, route, icon: "b", image_url: imageUrl || undefined,
          tag: "momin-admin-" + campaign.id,
        }), { urgency: webpush.Urgency.High, ttl: 86400, topic: "momin-admin-" + campaign.id });
        status = "sent"; sent++;
      } catch (error) {
        errorText = String(error).slice(0, 500); failed++;
      }
    } else { errorText = "Push signing keys are unavailable."; failed++; }
    await db.from("momin_push_deliveries").insert({
      subscription_id: row.id, user_id: row.user_id, event_key, title, body: message,
      icon_key: "b", route, image_url: imageUrl, status,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      error: errorText,
    });
    }
  }
  const overall = failed === 0 ? "sent" : sent > 0 ? "partial" : "failed";
  await db.from("momin_admin_notifications").update({
    status: overall, sent_count: sent, failed_count: failed, completed_at: new Date().toISOString(),
  }).eq("id", campaign.id);
  await audit(adminId, "notification.sent", "notification", campaign.id, { audience, recipient_count: recipients.length, sent, failed });
  return { success: true, id: campaign.id, recipient_count: recipients.length, push_sent: sent, push_failed: failed, status: overall };
}
async function uploadMedia(request: Request, session: { adminId: string }) {
  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "notification");
  if (!(file instanceof File)) throw new Error("Choose an image to upload.");
  if (!["notification", "giving"].includes(kind)) throw new Error("Unsupported upload category.");
  if (file.size < 1 || file.size > 2 * 1024 * 1024) throw new Error("Image must be 2 MB or smaller.");
  const mime = file.type.toLowerCase();
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  if (!extensions[mime]) throw new Error("Only JPG, PNG, or WebP images are supported.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = mime === "image/jpeg" && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = mime === "image/png" && bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = mime === "image/webp" && bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  if (!(isJpeg || isPng || isWebp)) throw new Error("Image contents do not match the selected JPG, PNG, or WebP file type.");
  const folder = kind === "giving" ? "giving" : "notifications";
  const path = folder + "/" + new Date().toISOString().slice(0, 10) + "/" + crypto.randomUUID() + "." + extensions[mime];
  const { error } = await db.storage.from("momin-admin-media").upload(path, bytes, {
    contentType: mime, upsert: false, cacheControl: "3600",
  });
  if (error) throw error;
  const { data } = db.storage.from("momin-admin-media").getPublicUrl(path);
  await audit(session.adminId, "media.uploaded", kind, path, { size: file.size, content_type: mime });
  return { success: true, path, public_url: data.publicUrl };
}
async function listCampaigns() {
  const { data, error } = await db.from("momin_giving_campaigns").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const { data: tx, error: txError } = await db.from("momin_contributions").select("campaign_id,amount,payment_status");
  if (txError) throw txError;
  return (data || []).map(c => {
    const rows = (tx || []).filter(t => t.campaign_id === c.id && t.payment_status === "verified");
    const raised = rows.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { ...c, received_amount: raised, contribution_count: rows.length, progress: Math.min(100, Math.round(raised / Number(c.target_amount) * 100)) };
  });
}
async function saveCampaign(body: Record<string, unknown>, adminId: string) {
  const id = typeof body.id === "string" ? body.id : null;
  const name = String(body.name || "").trim();
  const category = String(body.category || "");
  const target = Number(body.target_amount);
  const currency = String(body.currency || "INR").toUpperCase();
  if (!validText(name, 2, 120) || !["Zakat", "Sadaqah", "Charity", "Other approved"].includes(category) || !Number.isFinite(target) || target <= 0 || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Complete the campaign name, category, target amount, and currency.");
  }
  const payload = {
    name, category, description: String(body.description || "").slice(0, 5000),
    image_url: normalizeAdminMediaUrl(body.image_url),
    target_amount: target, currency, starts_at: body.starts_at || null, ends_at: body.ends_at || null,
    donation_instructions: String(body.donation_instructions || "").slice(0, 2000),
    status: ["Draft", "Active", "Paused", "Completed"].includes(String(body.status)) ? String(body.status) : "Draft",
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await db.from("momin_giving_campaigns").update(payload).eq("id", id).select("id").single()
    : await db.from("momin_giving_campaigns").insert({ ...payload, created_by: adminId }).select("id").single();
  if (result.error) throw result.error;
  await audit(adminId, id ? "giving.updated" : "giving.created", "campaign", result.data.id, { name, category, status: payload.status });
  return { success: true, id: result.data.id };
}
async function setCampaignStatus(body: Record<string, unknown>, adminId: string) {
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["Active", "Paused", "Completed", "Draft"].includes(status)) throw new Error("Invalid campaign status.");
  const { error } = await db.from("momin_giving_campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  await audit(adminId, "giving.status_updated", "campaign", id, { status });
  return { success: true };
}
async function getContributions() {
  const { data, error } = await db.from("momin_contributions").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw error;
  const ids = [...new Set((data || []).map(x => x.user_id).filter(Boolean))];
  const names = ids.length ? await db.from("momin_profiles").select("user_id,display_name,public_user_id").in("user_id", ids) : { data: [], error: null };
  if (names.error) throw names.error;
  const byId = new Map((names.data || []).map(x => [x.user_id, x]));
  return { contributions: (data || []).map(x => ({ ...x, user_name: byId.get(x.user_id)?.display_name || "Anonymous", user_public_id: byId.get(x.user_id)?.public_user_id || "—" })) };
}
async function getComplaints() {
  const { data, error } = await db.from("momin_complaints").select("*").order("updated_at", { ascending: false }).limit(500);
  if (error) throw error;
  const ids = [...new Set((data || []).map(x => x.user_id))];
  const profiles = ids.length ? await db.from("momin_profiles").select("user_id,display_name,public_user_id,email").in("user_id", ids) : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const map = new Map((profiles.data || []).map(x => [x.user_id, x]));
  return { complaints: (data || []).map(c => ({ ...c, user_name: map.get(c.user_id)?.display_name || "MOMIN User", user_public_id: map.get(c.user_id)?.public_user_id || "" })) };
}
async function saveComplaint(body: Record<string, unknown>, adminId: string) {
  const id = String(body.id || "");
  const status = String(body.status || "");
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["Open", "Pending", "In Progress", "Resolved", "Closed"].includes(status)) throw new Error("Invalid complaint or status.");
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "Resolved") patch.resolved_at = new Date().toISOString();
  if (status === "Closed") patch.closed_at = new Date().toISOString();
  const { error } = await db.from("momin_complaints").update(patch).eq("id", id);
  if (error) throw error;
  if (message) {
    if (message.length > 5000) throw new Error("Response is too long.");
    const { error: replyError } = await db.from("momin_complaint_replies").insert({
      complaint_id: id, author_type: "admin", admin_id: adminId, message,
    });
    if (replyError) throw replyError;
  }
  const { data: complaint } = await db.from("momin_complaints").select("user_id,ticket_id,subject").eq("id", id).maybeSingle();
  if (complaint) {
    await db.from("momin_user_notifications").insert({
      user_id: complaint.user_id, title: "Complaint update: " + complaint.ticket_id,
      message: message || ("Your complaint status is now " + status + "."),
      route: "complaints",
    });
  }
  await audit(adminId, "complaint.updated", "complaint", id, { status, response_added: !!message });
  return { success: true };
}
async function adminProfile(adminId: string) {
  const { data, error } = await db.from("momin_admin_accounts").select("login_id,display_name,force_password_change,last_login_at,created_at").eq("id", adminId).single();
  if (error) throw error;
  return data;
}
async function changePassword(body: Record<string, unknown>, session: { adminId: string; tokenHash: string }) {
  const current = String(body.current_password || "");
  const next = String(body.new_password || "");
  if (!validText(next, 12, 128) || !/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/\d/.test(next) || !/[^A-Za-z0-9]/.test(next)) {
    throw new Error("Use at least 12 characters with uppercase, lowercase, a number, and a symbol.");
  }
  const { data: row, error } = await db.from("momin_admin_accounts").select("password_salt,password_hash,password_iterations").eq("id", session.adminId).single();
  if (error || !row) throw new Error("Admin account unavailable.");
  const check = await derivePassword(current, row.password_salt, row.password_iterations);
  if (!constantTimeEqual(check, row.password_hash)) throw new Error("Current password is incorrect.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltText = b64(salt);
  const hash = await derivePassword(next, saltText, 310000);
  const { error: updateError } = await db.from("momin_admin_accounts").update({
    password_salt: saltText, password_hash: hash, password_iterations: 310000,
    force_password_change: false, updated_at: new Date().toISOString(),
  }).eq("id", session.adminId);
  if (updateError) throw updateError;
  await db.from("momin_admin_sessions").update({ revoked_at: new Date().toISOString() })
    .eq("admin_id", session.adminId).neq("token_hash", session.tokenHash).is("revoked_at", null);
  await audit(session.adminId, "admin.password_changed", "admin", session.adminId);
  return { success: true };
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply({ error: "Origin not allowed." }, 403, origin);

  try {
    const contentType = request.headers.get("content-type") || "";
    const form = contentType.includes("multipart/form-data") ? await request.formData() : null;
    const body = form
      ? Object.fromEntries([...form.entries()].filter(([k]) => k !== "file"))
      : await request.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "login") {
      const loginId = String(body.login_id || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (loginId !== "owner" || password.length < 1 || password.length > 128) return reply({ error: "Admin ID or password is incorrect." }, 401, origin);
      const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const attempts = await db.from("momin_admin_login_attempts").select("id", { count: "exact", head: true })
        .eq("login_id", loginId).eq("succeeded", false).gte("created_at", cutoff);
      if ((attempts.count || 0) >= 8) return reply({ error: "Too many unsuccessful attempts. Try again in 15 minutes." }, 429, origin);
      const { data: account, error } = await db.from("momin_admin_accounts")
        .select("id,login_id,display_name,password_salt,password_hash,password_iterations,force_password_change,is_active")
        .eq("login_id", loginId).maybeSingle();
      if (error || !account || !account.is_active) {
        await db.from("momin_admin_login_attempts").insert({ login_id: loginId, succeeded: false });
        return reply({ error: "Admin ID or password is incorrect." }, 401, origin);
      }
      const computed = await derivePassword(password, account.password_salt, account.password_iterations);
      if (!constantTimeEqual(computed, account.password_hash)) {
        await db.from("momin_admin_login_attempts").insert({ login_id: loginId, succeeded: false });
        return reply({ error: "Admin ID or password is incorrect." }, 401, origin);
      }
      await db.from("momin_admin_login_attempts").insert({ login_id: loginId, succeeded: true });
      const token = randomToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const { error: sessionError } = await db.from("momin_admin_sessions").insert({
        token_hash: tokenHash, admin_id: account.id, expires_at: expiresAt,
      });
      if (sessionError) throw sessionError;
      await db.from("momin_admin_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", account.id);
      await audit(account.id, "admin.login", "admin", account.id);
      return reply({
        success: true, token, expires_at: expiresAt,
        admin: { login_id: account.login_id, display_name: account.display_name },
        force_password_change: account.force_password_change,
      }, 200, origin);
    }

    const session = await requireAdmin(request);
    if ("error" in session) return reply({ error: session.error }, session.status, origin);
    if (form) {
      if (action !== "upload_media") return reply({ error: "Unsupported upload action." }, 400, origin);
      const file = form.get("file");
      if (!(file instanceof File)) return reply({ error: "Choose an image." }, 400, origin);
      const fakeRequest = new Request(request.url, { method: "POST", body: form });
      const uploaded = await uploadMedia(fakeRequest, session);
      return reply(uploaded, 200, origin);
    }

    switch (action) {
      case "me": return reply({ success: true, admin: await adminProfile(session.adminId) }, 200, origin);
      case "logout":
        await db.from("momin_admin_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", session.tokenHash);
        await audit(session.adminId, "admin.logout", "admin", session.adminId);
        return reply({ success: true }, 200, origin);
      case "change_password": return reply(await changePassword(body, session), 200, origin);
      case "forgot_password": return reply({ error: "Secure recovery is not configured yet. Use your authenticated Admin Profile to change the password, or ask the database owner to perform a verified recovery." }, 501, origin);
      case "dashboard": return reply(await dashboard(), 200, origin);
      case "users": return reply(await listUsers(body), 200, origin);
      case "user_detail": {
        const id = String(body.id || "");
        if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid User ID.");
        const [{ data: authData, error: authError }, { data: profile, error: profileError },
          { data: inbox, error: inboxError }, { data: contributions, error: contributionError },
          { data: complaints, error: complaintsError }] = await Promise.all([
          db.auth.admin.getUserById(id),
          db.from("momin_profiles").select("user_id,public_user_id,display_name,email,avatar_url,account_status,created_at,updated_at,profile_completed").eq("user_id", id).maybeSingle(),
          db.from("momin_user_notifications").select("id,title,message,route,read_at,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
          db.from("momin_contributions").select("transaction_ref,campaign_id,amount,currency,fund_category,payment_status,receipt_status,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
          db.from("momin_complaints").select("id,ticket_id,category,subject,priority,status,created_at,updated_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
        ]);
        if (authError || !authData.user) throw new Error("MOMIN user was not found.");
        if (profileError || inboxError || contributionError || complaintsError) throw new Error("Unable to load all user detail records.");
        return reply({
          user: {
            id, user_id: profile?.public_user_id || "MOM-" + id.replaceAll("-", "").slice(0,10).toUpperCase(),
            name: profile?.display_name || authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "MOMIN User",
            email: authData.user.email || "", phone: authData.user.phone || "",
            registered_at: authData.user.created_at, last_active: authData.user.last_sign_in_at || null,
            status: profile?.account_status || "Active", avatar_url: profile?.avatar_url || null,
            profile_completed: !!profile?.profile_completed,
          },
          notifications: inbox || [], contributions: contributions || [], complaints: complaints || [],
        }, 200, origin);
      }
      case "update_user": return reply(await updateUser(body, session.adminId), 200, origin);
      case "set_user_status": return reply(await setUserStatus(body, session.adminId), 200, origin);
      case "notifications_history": {
        const { data, error } = await db.from("momin_admin_notifications").select("*").order("created_at", { ascending: false }).limit(200);
        if (error) throw error;
        const ids = (data || []).map(x => x.id);
        const stats = ids.length ? await db.from("momin_admin_notification_stats")
          .select("notification_id,recipient_count,read_count").in("notification_id", ids) : { data: [], error: null };
        if (stats.error) throw stats.error;
        const byId = new Map((stats.data || []).map(x => [x.notification_id, x]));
        return reply({ notifications: (data || []).map(x => {
          const stat = byId.get(x.id);
          const recipients = stat?.recipient_count ?? x.recipient_count ?? 0;
          const read = stat?.read_count ?? 0;
          return { ...x, read_count: read, read_rate: recipients ? Math.round(read / recipients * 100) : 0 };
        }) }, 200, origin);
      }
      case "send_notification": return reply(await sendNotification(body, session.adminId), 200, origin);
      case "campaigns": return reply({ campaigns: await listCampaigns() }, 200, origin);
      case "save_campaign": return reply(await saveCampaign(body, session.adminId), 200, origin);
      case "campaign_status": return reply(await setCampaignStatus(body, session.adminId), 200, origin);
      case "contributions": return reply(await getContributions(), 200, origin);
      case "complaints": return reply(await getComplaints(), 200, origin);
      case "complaint_detail": {
        const id = String(body.id || "");
        if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid complaint ID.");
        const { data: complaint, error } = await db.from("momin_complaints").select("*").eq("id", id).single();
        if (error) throw error;
        const { data: profile } = await db.from("momin_profiles").select("display_name,public_user_id").eq("user_id", complaint.user_id).maybeSingle();
        const { data: replies, error: replyError } = await db.from("momin_complaint_replies").select("id,author_type,message,created_at").eq("complaint_id", id).order("created_at", { ascending: true });
        if (replyError) throw replyError;
        let attachmentUrl: string | null = null;
        if (complaint.attachment_path) {
          const signed = await db.storage.from("momin-complaint-attachments").createSignedUrl(complaint.attachment_path, 3600);
          if (!signed.error) attachmentUrl = signed.data.signedUrl;
        }
        return reply({ complaint: { ...complaint, attachment_url: attachmentUrl, user_name: profile?.display_name || "MOMIN User", user_public_id: profile?.public_user_id || "" }, replies: replies || [] }, 200, origin);
      }
      case "update_complaint": return reply(await saveComplaint(body, session.adminId), 200, origin);
      case "create_complaint": {
        const userId = String(body.user_id || "");
        const subject = String(body.subject || "").trim();
        const description = String(body.description || "").trim();
        if (!/^[0-9a-f-]{36}$/i.test(userId) || !validText(subject, 2, 120) || !validText(description, 10, 5000)) throw new Error("Select a user and enter a subject and description.");
        const { data, error } = await db.from("momin_complaints").insert({
          user_id: userId, category: String(body.category || "Other"), subject, description,
          priority: ["Low", "Normal", "High"].includes(String(body.priority)) ? String(body.priority) : "Normal",
          created_by_admin: session.adminId,
        }).select("id,ticket_id").single();
        if (error) throw error;
        await audit(session.adminId, "complaint.created_for_user", "complaint", data.id, { user_id: userId });
        return reply({ success: true, ...data }, 200, origin);
      }
      case "profile_update": {
        const name = String(body.display_name || "").trim();
        if (!validText(name, 2, 80)) throw new Error("Display name must be between 2 and 80 characters.");
        const { error } = await db.from("momin_admin_accounts").update({ display_name: name, updated_at: new Date().toISOString() }).eq("id", session.adminId);
        if (error) throw error;
        await audit(session.adminId, "admin.profile_updated", "admin", session.adminId);
        return reply({ success: true, display_name: name }, 200, origin);
      }
      default: return reply({ error: "Unknown Admin API action." }, 400, origin);
    }
  } catch (error) {
    console.error("momin-admin-api:", error);
    return reply({ error: error instanceof Error ? error.message : "Unexpected Admin API error." }, 500, origin);
  }
});
