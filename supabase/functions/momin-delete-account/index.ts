import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://noor-ul-islam-dua.onrender.com",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
]);

function corsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin)
    ? origin
    : "https://noor-ul-islam-dua.onrender.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}

function reply(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);

  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return reply({ error: "Authentication required" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceKey) {
    return reply({ error: "Account deletion service is not configured." }, 500, origin);
  }

  try {
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return reply({ error: "Your session is invalid or expired." }, 401, origin);

    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Supabase Auth refuses to delete a user while that user still owns Storage objects.
    // Remove only the authenticated user's own avatar folder and complaint attachments.
    const { data: avatarFiles, error: avatarListError } = await admin.storage
      .from("avatars").list(userId, { limit: 1000 });
    if (avatarListError) throw avatarListError;
    const avatarPaths = (avatarFiles || [])
      .filter((file) => file && file.name && file.id)
      .map((file) => userId + "/" + file.name);
    if (avatarPaths.length) {
      const { error } = await admin.storage.from("avatars").remove(avatarPaths);
      if (error) throw error;
    }

    const { data: complaints, error: complaintError } = await admin
      .from("momin_complaints").select("id,attachment_path").eq("user_id", userId);
    if (complaintError) throw complaintError;
    const complaintIds = (complaints || []).map((row) => row.id).filter(Boolean);
    const complaintPaths = (complaints || [])
      .map((row) => row.attachment_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);
    if (complaintPaths.length) {
      const { error } = await admin.storage.from("momin-complaint-attachments").remove(complaintPaths);
      if (error) throw error;
    }

    // This schema intentionally has no auth.users foreign-key cascades. Remove
    // user-owned application data explicitly before hard-deleting the Auth row.
    // Retain the financial ledger but detach it from the deleted account.
    if (complaintIds.length) {
      const { error } = await admin.from("momin_complaint_replies").delete().in("complaint_id", complaintIds);
      if (error) throw error;
    }
    const { error: authoredRepliesError } = await admin
      .from("momin_complaint_replies").delete().eq("author_user_id", userId);
    if (authoredRepliesError) throw authoredRepliesError;

    const userOwnedTables = [
      "momin_complaints",
      "momin_user_notifications",
      "momin_fcm_deliveries",
      "momin_push_deliveries",
      "momin_fcm_tokens",
      "momin_push_subscriptions",
      "momin_devices",
    ];
    for (const table of userOwnedTables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    }

    const { error: contributionsError } = await admin
      .from("momin_contributions").update({ user_id: null }).eq("user_id", userId);
    if (contributionsError) throw contributionsError;

    const { error: profileError } = await admin.from("momin_profiles").delete().eq("user_id", userId);
    if (profileError) throw profileError;

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
    if (deleteError) throw deleteError;

    return reply({ success: true, message: "Your MOMIN account and profile have been permanently deleted." }, 200, origin);
  } catch (error) {
    console.error("MOMIN account deletion failed:", error);
    return reply({ error: error instanceof Error ? error.message : "Account deletion failed." }, 500, origin);
  }
});
