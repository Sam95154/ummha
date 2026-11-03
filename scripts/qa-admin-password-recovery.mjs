import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const api = fs.readFileSync(new URL("../supabase/functions/momin-admin-api/index.ts", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("../admin/admin.js", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../supabase/migrations/20261103180000_momin_admin_password_recovery.sql", import.meta.url), "utf8");

function has(source, fragment, label) {
  assert.ok(source.includes(fragment), "Missing " + label + ": " + fragment);
}
function before(source, first, second, label) {
  assert.ok(source.indexOf(first) >= 0 && source.indexOf(first) < source.indexOf(second), label);
}

new vm.Script(admin, { filename: "admin/admin.js" });
console.log("PASS: Admin recovery UI JavaScript parses.");

before(api, 'if (action === "forgot_password")', "const session = await requireAdmin(request);", "Forgot-password request must be unauthenticated.");
before(api, 'if (action === "reset_password")', "const session = await requireAdmin(request);", "Reset-token completion must be unauthenticated.");
has(api, "MOMIN_ADMIN_RECOVERY_EMAIL", "configured verified recovery mailbox");
has(api, "MOMIN_ADMIN_RECOVERY_FROM", "verified sender identity");
has(api, "RESEND_API_KEY", "server-only mail API key");
has(api, "api.resend.com/emails", "email provider send request");
has(api, "expires_at", "reset expiry validation");
has(api, '.is("used_at", null)', "single-use token guard");
has(api, "password_iterations: 310000", "PBKDF2 password hashing");
has(api, "admin.password_reset", "password reset audit entry");
has(admin, 'api("forgot_password")', "forgot-password UI action");
has(admin, 'api("reset_password"', "reset form API action");
has(admin, 'get("reset")', "email reset link token handling");
has(migration, "momin_admin_password_reset_tokens", "private recovery token table");
has(migration, "token_hash text primary key", "hashed token storage");
has(migration, "enable row level security", "recovery token RLS");
has(migration, "grant all on public.momin_admin_password_reset_tokens to service_role", "service-role-only token access");

console.log("PASS: Admin password recovery security and UI checks.");
