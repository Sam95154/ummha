const { test, expect } = require("@playwright/test");

const API = "https://qzwqpiquvhpjwqgaxorp.supabase.co/functions/v1/momin-admin-api";
const userId = "11111111-2222-4333-8444-555555555555";

function makeState() {
  return {
    calls: [],
    complaint: {
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      ticket_id: "MOM-C-ABC123",
      user_id: userId, user_name: "Aisha Rahman", user_public_id: "MOM-ABC1234567",
      category: "Notifications", subject: "Push alerts missing",
      description: "Notifications have not arrived for two days.",
      priority: "Normal", status: "Open",
      created_at: "2026-10-31T08:00:00Z", updated_at: "2026-10-31T08:00:00Z"
    },
    user: {
      id: userId, user_id: "MOM-ABC1234567", name: "Aisha Rahman",
      email: "aisha@example.test", phone: "+91 90000 00001",
      registered_at: "2026-01-12T08:30:00Z", last_active: "2026-11-02T08:00:00Z", status: "Active"
    }
  };
}
async function mockAdminApi(page, state) {
  await page.route(API, async route => {
    const req = route.request();
    if (req.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
          "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        }
      });
      return;
    }
    const body = req.postDataJSON ? (req.postDataJSON() || {}) : {};
    state.calls.push({ action: body.action, body });
    let data = {};
    switch (body.action) {
      case "login":
        data = { success: true, token: "qa-admin-session-token-not-real", expires_at: "2026-11-02T18:00:00Z",
          admin: { login_id: "owner", display_name: "MOMIN Owner" }, force_password_change: false };
        break;
      case "dashboard":
        data = { metrics: { total_users: 2, active_users: 2, inactive_users: 0, new_registrations: 1,
          notifications_sent: 3, active_campaigns: 1, contributions_total: 5000, open_complaints: 1, resolved_complaints: 2 },
          campaigns: [], complaint_status: [], recent_users: [] };
        break;
      case "users": {
        const query = String(body.q || "").trim().toLowerCase();
        const similarUser = {
          id: "ffffffff-1111-4222-8333-444444444444", user_id: "MOM-XYZ9876543",
          name: "Aisha Khan", email: "aisha.khan@example.test", phone: "+91 90000 00002", status: "Active"
        };
        const matches = [state.user, similarUser].filter(user =>
          [user.name, user.email, user.user_id, user.id, user.phone]
            .some(value => String(value || "").toLowerCase().includes(query))
        );
        data = { users: matches, page: 1, page_size: 50, total: matches.length, has_more: false };
        break;
      }
      case "create_complaint":
        data = { success: true, id: "complaint-created-id", ticket_id: "MOM-C-QA123" };
        break;
      case "user_detail":
        data = { user: state.user, notifications: [], contributions: [], complaints: [] };
        break;
      case "update_user":
        state.user = { ...state.user, name: body.name };
        data = { success: true };
        break;
      case "set_user_status":
        state.user = { ...state.user, status: body.status };
        data = { success: true, status: body.status };
        break;
      case "notifications_history":
        data = { notifications: [] };
        break;
      case "send_notification":
        data = { success: true, id: "notification-test-id", recipient_count: 2, push_sent: 0, push_failed: 0, status: "sent" };
        break;
      case "campaigns":
        data = { campaigns: [] };
        break;
      case "save_campaign":
        data = { success: true, id: "campaign-test-id" };
        break;
      case "campaign_status":
        data = { success: true };
        break;
      case "contributions":
        data = { contributions: [] };
        break;
      case "complaints":
        data = { complaints: [state.complaint] };
        break;
      case "complaint_detail":
        data = { complaint: state.complaint, replies: [] };
        break;
      case "update_complaint":
        state.complaint = { ...state.complaint, status: body.status };
        data = { success: true };
        break;
      case "change_password":
        data = { success: true };
        break;
      case "me":
        data = { admin: { login_id: "owner", display_name: "MOMIN Owner", force_password_change: false } };
        break;
      case "logout":
        data = { success: true };
        break;
      default:
        data = { success: true };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "http://127.0.0.1:4173", "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
      body: JSON.stringify(data)
    });
  });
}
async function login(page, state) {
  await mockAdminApi(page, state);
  await page.goto("/admin/");
  await expect(page.getByRole("heading", { name: "Welcome to MOMIN Admin" })).toBeVisible();
  await expect(page.locator("#login-id")).toHaveValue("owner");
  await page.locator("#login-password").fill("test-only-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("MOMIN Admin Panel", () => {
  test("owner login opens dashboard and user name editing preserves the User ID", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    await page.getByRole("button", { name: "Users" }).click();
    await expect(page.getByText("MOM-ABC1234567")).toBeVisible();

    await page.getByRole("button", { name: "Details" }).click();
    await expect(page.getByRole("heading", { name: "User details" })).toBeVisible();
    await expect(page.locator("#modal-root").getByText("MOM-ABC1234567")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Edit name" }).click();
    await expect(page.getByRole("heading", { name: "Edit user name" })).toBeVisible();
    await page.locator('#modal-root input[name="name"]').fill("Aisha Basha");
    await page.locator("#modal-root").getByRole("button", { name: "Save name" }).click();
    await expect(page.getByText("Aisha Basha")).toBeVisible();
    expect(state.user.user_id).toBe("MOM-ABC1234567");
    expect(state.calls.some(x => x.action === "update_user" && x.body.name === "Aisha Basha")).toBeTruthy();
  });

  test("Admin can send a text-only notification without selecting an image", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await page.locator("#title").fill("Jumu'ah Mubarak");
    await page.locator("#message").fill("May your Friday be filled with peace and blessings.");
    await expect(page.locator("#notification-image")).toHaveValue("");
    await page.getByRole("button", { name: "Send notification" }).click();
    await expect(page.getByRole("button", { name: "History" })).toBeVisible();
    const sent = state.calls.find(x => x.action === "send_notification");
    expect(sent).toBeTruthy();
    expect(sent.body.title).toBe("Jumu'ah Mubarak");
    expect(sent.body.image_url).toBeNull();
  });

  test("Admin can create a Giving campaign as a Draft", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    await page.getByRole("button", { name: "Giving Management" }).click();
    await expect(page.getByRole("heading", { name: "Giving Management" })).toBeVisible();
    await page.locator(".tabs").getByRole("button", { name: "Create campaign" }).click();
    const form = page.locator('form[data-form="campaign"]');
    await form.locator('[name="name"]').fill("Community Water Project");
    await form.locator('[name="category"]').selectOption("Sadaqah");
    await form.locator('[name="target_amount"]').fill("250000");
    await form.locator('[name="currency"]').selectOption("INR");
    await form.locator('[name="status"]').selectOption("Draft");
    await form.getByRole("button", { name: "Save campaign" }).click();
    await expect(page.getByRole("heading", { name: "Giving Management" })).toBeVisible();
    const saved = state.calls.find(x => x.action === "save_campaign");
    expect(saved).toBeTruthy();
    expect(saved.body.name).toBe("Community Water Project");
    expect(saved.body.category).toBe("Sadaqah");
    expect(saved.body.status).toBe("Draft");
  });

  test("Admin gets live complaint-user suggestions and can select by name, email, or MOMIN User ID", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    await page.getByRole("button", { name: "Complaints" }).click();
    await page.getByRole("button", { name: "Create for user" }).click();

    const modal = page.locator("#modal-root");
    const search = modal.locator("#complaint-user-search");
    const form = modal.locator('form[data-form="create-complaint"]');
    const selectedUser = form.locator('input[name="user_id"]');
    const suggestions = modal.locator("#complaint-user-suggestions");

    await expect(modal.getByRole("heading", { name: "Create complaint for a user" })).toBeVisible();
    await expect(modal.locator("#complaint-user-search-status")).toContainText("Type at least 2 characters");

    await search.fill("Aish");
    await expect(suggestions.getByRole("option")).toHaveCount(2);
    await expect(suggestions).toContainText("Aisha Rahman");
    await expect(suggestions).toContainText("Aisha Khan");
    await suggestions.getByRole("option", { name: /Aisha Rahman/ }).click();
    await expect(selectedUser).toHaveValue(userId);
    await expect(modal.locator("#complaint-user-selection")).toContainText("aisha@example.test");

    await search.fill("aisha@example.test");
    await expect(suggestions.getByRole("option")).toHaveCount(1);
    await search.press("Enter");
    await expect(selectedUser).toHaveValue(userId);

    await search.fill("MOM-ABC1234567");
    await expect(suggestions.getByRole("option")).toHaveCount(1);
    await suggestions.getByRole("option").click();
    await expect(selectedUser).toHaveValue(userId);

    await form.locator('[name="category"]').selectOption("Notifications");
    await form.locator('[name="priority"]').selectOption("High");
    await form.locator('[name="subject"]').fill("Notification issue reported by support");
    await form.locator('[name="description"]').fill("The user reported that prayer notifications are not arriving on their device.");
    await form.getByRole("button", { name: "Create complaint" }).click();

    const lookups = state.calls.filter(call => call.action === "users").map(call => call.body.q);
    expect(lookups).toContain("Aish");
    expect(lookups).toContain("aisha@example.test");
    expect(lookups).toContain("MOM-ABC1234567");
    const created = state.calls.find(call => call.action === "create_complaint");
    expect(created).toBeTruthy();
    expect(created.body.user_id).toBe(userId);
    expect(created.body.priority).toBe("High");
  });

  test("Admin can respond to a complaint and change its status", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    await page.getByRole("button", { name: "Complaints" }).click();
    await expect(page.getByText("MOM-C-ABC123")).toBeVisible();
    await page.locator('tr[data-open="complaint"]').click();
    await expect(page.getByRole("heading", { name: "MOM-C-ABC123 · Push alerts missing" })).toBeVisible();
    const form = page.locator('#modal-root form[data-form="complaint-update"]');
    await form.locator('[name="status"]').selectOption("In Progress");
    await form.locator('[name="message"]').fill("We are investigating the notification delivery issue.");
    await form.getByRole("button", { name: "Save update" }).click();
    const update = state.calls.find(x => x.action === "update_complaint");
    expect(update).toBeTruthy();
    expect(update.body.status).toBe("In Progress");
    expect(update.body.message).toContain("investigating");
  });

  test("Admin profile can change the current password", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    await page.getByRole("button", { name: "Admin Profile" }).click();
    const form = page.locator('form[data-form="password"]');
    await form.locator('[name="current_password"]').fill("OldPassword!123");
    await form.locator('[name="new_password"]').fill("NewPassword!456");
    await form.locator('[name="confirm_password"]').fill("NewPassword!456");
    await form.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const update = state.calls.find(x => x.action === "change_password");
    expect(update).toBeTruthy();
    expect(update.body.new_password).toBe("NewPassword!456");
  });

  test("Admin login and shell remain within phone, tablet and desktop viewport widths", async ({ page }) => {
    const state = makeState();
    await login(page, state);
    for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      const size = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));
      expect(Math.max(size.document, size.body), "No horizontal overflow at " + viewport.width).toBeLessThanOrEqual(size.viewport);
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    }
  });
});
