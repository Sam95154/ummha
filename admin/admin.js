/* MOMIN Admin frontend. This is a separate browser app; authentication is verified by the server Edge Function. */
(function () {
  "use strict";
  const API_URL = "https://qzwqpiquvhpjwqgaxorp.supabase.co/functions/v1/momin-admin-api";
  const PUBLISHABLE_KEY = "sb_publishable_SAHjdts8xtuQSXE_lPa1cw_V6J3PjQt";
  const root = document.getElementById("root");
  const state = {
    token: null, admin: null, page: "login", theme: localStorage.getItem("momin-admin-theme") || "dark",
    busy: false, error: "", toastTimer: null, menu: false, notifTab: "create", givingTab: "campaigns",
    dashboard: null, users: [], editCampaign: null, userQuery: "", userStatus: "all", notifications: [],
    campaigns: [], contributions: [], complaints: [], profile: null, selectedComplaint: null,
    notificationImage: null, campaignImage: null
  };
  document.documentElement.dataset.theme = state.theme;

  const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const money = (n, currency = "INR") => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(n || 0)); }
    catch (_) { return String(n || 0); }
  };
  const date = value => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const badge = status => {
    const s = String(status || "");
    const cls = ["Active","Verified","Resolved","Completed","sent"].includes(s) ? "success" :
      ["Pending","In Progress","Paused","queued","sending","partial"].includes(s) ? "warning" :
      ["Inactive","Closed","Draft","failed","Failed","Open"].includes(s) ? "danger-text" : "muted";
    return '<span class="badge ' + cls + '">' + escapeHtml(s) + "</span>";
  };
  function toast(message, error = false) {
    const host = document.getElementById("toast-root");
    if (!host) return;
    host.innerHTML = '<div class="toast ' + (error ? "error" : "") + '">' + escapeHtml(message) + "</div>";
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { host.innerHTML = ""; }, 4200);
  }
  async function api(action, params = {}) {
    const headers = { "Content-Type": "application/json", "apikey": PUBLISHABLE_KEY };
    if (state.token) headers.Authorization = "Bearer " + state.token;
    const response = await fetch(API_URL, {
      method: "POST", headers, cache: "no-store",
      body: JSON.stringify({ action, ...params })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) throw new Error(data.error || ("Request failed (" + response.status + ")"));
    return data;
  }
  async function upload(file, kind) {
    const form = new FormData();
    form.append("action", "upload_media");
    form.append("kind", kind);
    form.append("file", file);
    const headers = { apikey: PUBLISHABLE_KEY, Authorization: "Bearer " + state.token };
    const response = await fetch(API_URL, { method: "POST", headers, body: form, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) throw new Error(data.error || "Image upload failed.");
    return data;
  }
  function heading(title, description, right = "") {
    return '<div class="page-heading"><div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + "</p></div>" + right + "</div>";
  }
  function button(text, action, cls = "", extra = "") {
    return '<button type="button" class="btn ' + cls + '" data-action="' + escapeHtml(action) + '" ' + extra + ">" + text + "</button>";
  }
  function field(label, name, value = "", type = "text", required = false, extra = "") {
    return '<div class="field"><label for="' + escapeHtml(name) + '">' + escapeHtml(label) + (required ? " *" : "") +
      '</label><input class="control" id="' + escapeHtml(name) + '" name="' + escapeHtml(name) + '" type="' + escapeHtml(type) +
      '" value="' + escapeHtml(value) + '" ' + (required ? "required" : "") + " " + extra + "></div>";
  }
  function selectField(label, name, options, value = "", required = false, extra = "") {
    return '<div class="field"><label for="' + escapeHtml(name) + '">' + escapeHtml(label) + (required ? " *" : "") +
      '</label><select class="control" id="' + escapeHtml(name) + '" name="' + escapeHtml(name) + '" ' +
      (required ? "required" : "") + " " + extra + ">" + options.map(o =>
        '<option value="' + escapeHtml(o.value) + '" ' + (o.value === value ? "selected" : "") + ">" + escapeHtml(o.label) + "</option>"
      ).join("") + "</select></div>";
  }
  function metric(label, value, note = "") {
    return '<article class="card metric"><small>' + escapeHtml(label) + '</small><strong>' + escapeHtml(value) +
      '</strong>' + (note ? '<small class="muted">' + escapeHtml(note) + "</small>" : "") + "</article>";
  }
  function table(headers, rows, empty = "No records found.") {
    return '<div class="table-wrap"><table><thead><tr>' + headers.map(x => "<th>" + escapeHtml(x) + "</th>").join("") +
      "</tr></thead><tbody>" + (rows.length ? rows.join("") :
        '<tr><td colspan="' + headers.length + '" class="empty">' + escapeHtml(empty) + "</td></tr>") +
      "</tbody></table></div>";
  }
  function chart(rows) {
    const max = Math.max(1, ...rows.map(x => Number(x.value || 0)));
    return '<div class="status-list">' + rows.map(x =>
      '<div><div class="status-row"><span>' + escapeHtml(x.label) + '</span><b>' + escapeHtml(x.value) +
      '</b></div><div class="progress"><i style="width:' + Math.round(Number(x.value || 0) / max * 100) + '%"></i></div></div>'
    ).join("") + "</div>";
  }
  function loading() { return '<div class="card"><div class="skeleton"></div><div class="skeleton mt"></div><div class="skeleton mt"></div></div>'; }
  function renderLogin() {
    root.innerHTML = '<section class="login-screen"><form class="login-card" data-form="login">' +
      '<div class="brand"><strong>MOMIN</strong><h1>Welcome to MOMIN Admin</h1><p>Secure administration portal</p></div>' +
      '<div class="field"><label for="login-id">Admin ID</label><input class="control" id="login-id" name="login_id" value="owner" autocomplete="username" required></div>' +
      '<div class="field"><label for="login-password">Password</label><input class="control" id="login-password" name="password" type="password" autocomplete="current-password" required></div>' +
      '<label class="checkline"><input type="checkbox" data-action="toggle-password"> Show password</label>' +
      '<p class="error" id="login-error">' + escapeHtml(state.error) + '</p><button class="btn primary full" type="submit" ' +
      (state.busy ? "disabled" : "") + ">" + (state.busy ? "Signing in…" : "Log in") + '</button>' +
      '<p class="hint" style="text-align:center;margin:14px 0 0">Admin access is separate from MOMIN User sign-in.</p>' +
      '<p style="text-align:center;margin:12px 0 0"><button class="link-btn" type="button" data-action="forgot-login">Forgot password?</button></p>' +
      "</form></section>";
  }
  const nav = [
    ["dash","Dashboard","▦"],["users","Users","♙"],["notif","Notifications","♧"],
    ["giving","Giving Management","♡"],["complaints","Complaints","✉"],["profile","Admin Profile","⚙"],["settings","Settings / Theme","◐"]
  ];
  function renderShell(content) {
    root.innerHTML = '<div class="shell ' + (state.menu ? "menu-open" : "") + '">' +
      '<div class="mobile-scrim" data-action="close-menu"></div><aside class="sidebar"><div class="side-brand"><strong>MOMIN</strong><span>ADMIN CONSOLE</span></div>' +
      '<nav class="nav" aria-label="Admin navigation">' + nav.map(([id,label,ico]) =>
        '<button type="button" data-go="' + id + '" class="' + (state.page === id ? "active" : "") +
        '"><span class="nav-ico">' + ico + "</span>" + label + "</button>"
      ).join("") + '<button type="button" data-action="logout"><span class="nav-ico">⎋</span>Logout</button></nav>' +
      '<div class="sidebar-bottom">MOMIN Admin<br><span>Protected administration area</span></div></aside>' +
      '<section class="workspace"><header class="topbar"><button class="icon-btn menu-toggle" type="button" data-action="toggle-menu" aria-label="Toggle navigation">☰</button>' +
      '<span class="muted">Administration</span><span class="spacer"></span><span class="top-admin">' + escapeHtml(state.admin?.display_name || "MOMIN Owner") +
      '</span><button class="icon-btn" type="button" data-action="theme" aria-label="Switch theme">' + (state.theme === "dark" ? "☀" : "☾") +
      '</button></header><main class="content">' + content + "</main></section></div>";
  }
  function renderPasswordRequired() {
    const content = heading("Secure your Admin account", "Set a new password before accessing the dashboard.") +
      '<div class="card" style="max-width:560px"><h3>Change initial password</h3><p class="muted">The initial password must be replaced before continuing.</p>' +
      '<form data-form="password"><div class="field"><label>Current password</label><input class="control" name="current_password" type="password" autocomplete="current-password" required></div>' +
      '<div class="field"><label>New password</label><input class="control" name="new_password" type="password" minlength="12" autocomplete="new-password" required></div>' +
      '<div class="field"><label>Confirm new password</label><input class="control" name="confirm_password" type="password" minlength="12" autocomplete="new-password" required></div>' +
      '<p class="hint">At least 12 characters, including uppercase, lowercase, a number, and a symbol.</p><p class="error" id="password-error"></p>' +
      '<button class="btn primary" type="submit">Update password</button></form></div>';
    renderShell(content);
  }
  function renderDashboard() {
    if (!state.dashboard) return loading();
    const m = state.dashboard.metrics || {};
    const cards = [
      ["Total users", m.total_users || 0], ["Active users", m.active_users || 0],
      ["Inactive users", m.inactive_users || 0], ["New registrations", m.new_registrations || 0],
      ["Notifications", m.notifications_sent || 0], ["Active campaigns", m.active_campaigns || 0],
      ["Verified contributions", money(m.contributions_total || 0)], ["Open complaints", m.open_complaints || 0],
      ["Resolved complaints", m.resolved_complaints || 0]
    ];
    return heading("Dashboard", "Live overview of MOMIN administration") +
      '<div class="grid grid-4">' + cards.map(c => metric(c[0], c[1])).join("") + "</div>" +
      '<div class="grid grid-2 mt"><section class="card"><h3>Complaint status</h3>' +
      chart((state.dashboard.complaint_status || []).map(x => ({ label: x.status, value: x.count }))) +
      '</section><section class="card"><h3>Giving campaigns</h3>' +
      (state.dashboard.campaigns || []).slice(0, 6).map(c => '<div class="status-row"><span>' + escapeHtml(c.name) +
        '</span>' + badge(c.status) + "</div>").join("") + "</section>" +
      '<section class="card"><h3>Recent registrations</h3>' +
      table(["User ID","Name","Registered"], (state.dashboard.recent_users || []).map(u =>
        "<tr><td>" + escapeHtml(u.public_user_id || "—") + "</td><td>" + escapeHtml(u.display_name || "MOMIN User") +
        "</td><td>" + date(u.created_at) + "</td></tr>")) + "</section>" +
      '<section class="card"><h3>Account overview</h3><p class="muted">Statistics are calculated from current MOMIN backend records. No demonstration figures are substituted.</p>' +
      '<p>All registered users: <b>' + escapeHtml(m.total_users || 0) + "</b></p><p>Active accounts: <b>" +
      escapeHtml(m.active_users || 0) + "</b></p></section></div>";
  }
  function renderUsers() {
    const rows = state.users.map(u => '<tr><td><b>' + escapeHtml(u.user_id) + '</b></td><td>' + escapeHtml(u.name) +
      '</td><td>' + escapeHtml(u.email || "—") + '</td><td>' + date(u.registered_at) + '</td><td>' + badge(u.status) +
      '</td><td><button type="button" class="btn small" data-action="view-user" data-id="' + escapeHtml(u.id) + '">Details</button> ' +
      '<button type="button" class="btn small" data-action="edit-user" data-id="' + escapeHtml(u.id) + '">Edit name</button> ' +
      '<button type="button" class="btn small ' + (u.status === "Active" ? "danger" : "") + '" data-action="user-status" data-id="' +
      escapeHtml(u.id) + '" data-status="' + (u.status === "Active" ? "Inactive" : "Active") + '">' +
      (u.status === "Active" ? "Deactivate" : "Activate") + "</button></td></tr>");
    return heading("Users", "Search and manage registered MOMIN accounts") +
      '<section class="card"><form class="toolbar" data-form="user-search"><input class="control search" name="q" placeholder="Search name, unique User ID, email or phone" value="' +
      escapeHtml(state.userQuery) + '"><select class="control" name="status"><option value="all">All statuses</option><option value="Active" ' +
      (state.userStatus === "Active" ? "selected" : "") + '>Active</option><option value="Inactive" ' +
      (state.userStatus === "Inactive" ? "selected" : "") + '>Inactive</option></select><button class="btn primary">Search</button></form>' +
      table(["Unique User ID","Name","Email","Registered","Status","Actions"], rows) +
      '<p class="hint">User IDs are permanent identifiers. Editing a display name never changes the User ID.</p></section>';
  }
  function renderNotifications() {
    if (state.notifTab === "history") {
      const rows = state.notifications.map(n => "<tr><td>" + escapeHtml(n.title) + "</td><td>" + escapeHtml(n.audience_type) +
        "</td><td>" + date(n.created_at) + "</td><td>" + (n.image_url ? "Image" : "Text only") + "</td><td>" +
        badge(n.status) + "</td><td>" + escapeHtml(n.recipient_count || 0) + "</td><td>" + escapeHtml(n.sent_count || 0) + "</td></tr>");
      return heading("Notifications", "Notification delivery and history") +
        '<div class="tabs"><button data-action="notif-tab" data-tab="create">Create</button><button class="active" data-action="notif-tab" data-tab="history">History</button></div>' +
        '<section class="card">' + table(["Title","Audience","Created","Media","Status","Recipients","Push sent"], rows) + "</section>";
    }
    const userOptions = state.users.map(u => '<option value="' + escapeHtml(u.id) + '">' + escapeHtml(u.user_id + " · " + u.name) + "</option>").join("");
    return heading("Notifications", "Send to all MOMIN users, selected users, or one individual") +
      '<div class="tabs"><button class="active" data-action="notif-tab" data-tab="create">Create</button><button data-action="notif-tab" data-tab="history">History</button></div>' +
      '<div class="split"><section class="card"><form data-form="notification">' +
      selectField("Audience","audience",[{value:"all",label:"All MOMIN users"},{value:"selected",label:"Selected users"},{value:"individual",label:"One particular user"}],"all",true,'data-audience') +
      '<div class="field" id="recipient-field" hidden><label for="user-ids">Select user(s)</label><select class="control" id="user-ids" name="user_ids" multiple size="6">' + userOptions +
      '</select><small class="hint">Use Ctrl (Windows) or Command (Mac) to select multiple users.</small></div>' +
      field("Notification title","title","", "text", true, 'maxlength="80"') +
      '<div class="field"><label for="message">Message *</label><textarea class="control" id="message" name="message" maxlength="1000" required></textarea></div>' +
      selectField("Open in MOMIN","route",["home","prayers","quran","duas","calendar","notifications","settings","journey","giving","complaints"].map(x=>({value:x,label:x[0].toUpperCase()+x.slice(1)})),"home",true) +
      '<div class="field"><label for="notification-image">Image (optional · JPG/PNG/WebP · max 2 MB)</label><input class="control" id="notification-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"><small class="hint">Skip this field to send a text-only notification.</small></div>' +
      '<div id="notification-image-preview"></div><div class="field"><button class="btn primary" type="submit">Send notification</button></div></form></section>' +
      '<section class="card"><h3>Preview in MOMIN</h3><div class="preview-phone"><div class="preview-item"><b style="color:var(--gold)">MOMIN</b> · now<br><b id="notice-preview-title">Notification title</b><p id="notice-preview-message">Your message will appear here.</p><div id="notice-preview-image"></div></div></div></section></div>';
  }
  function renderGiving() {
    const rows = state.campaigns.map(c => '<tr><td><b>' + escapeHtml(c.name) + '</b></td><td>' + badge(c.category) +
      '</td><td>' + money(c.target_amount, c.currency) + '</td><td>' + money(c.received_amount, c.currency) +
      '</td><td><div class="progress" style="min-width:90px"><i style="width:' + (c.progress || 0) + '%"></i></div>' +
      '<small>' + escapeHtml(c.progress || 0) + '%</small></td><td>' + badge(c.status) + '</td><td>' +
      '<button class="btn small" data-action="edit-campaign" data-id="' + escapeHtml(c.id) + '">Edit</button> ' +
      '<button class="btn small" data-action="campaign-status" data-id="' + escapeHtml(c.id) + '" data-status="' +
      (c.status === "Active" ? "Paused" : "Active") + '">' + (c.status === "Active" ? "Pause" : "Activate") + "</button></td></tr>");
    if (state.givingTab === "contributions") {
      const tx = state.contributions.map(c => "<tr><td>" + escapeHtml(c.transaction_ref) + "</td><td>" +
        escapeHtml(c.user_public_id || "Anonymous") + "</td><td>" + escapeHtml(c.user_name) + "</td><td>" +
        escapeHtml(c.fund_category) + "</td><td>" + money(c.amount,c.currency) + "</td><td>" +
        badge(c.payment_status) + "</td><td>" + badge(c.receipt_status) + "</td></tr>");
      return heading("Giving Management", "Verified contribution records · Zakat tracked separately") +
        '<div class="tabs"><button data-action="giving-tab" data-tab="campaigns">Campaigns</button><button data-action="giving-tab" data-tab="create">Create campaign</button><button class="active" data-action="giving-tab" data-tab="contributions">Contributions</button></div>' +
        '<section class="card">' + table(["Transaction","User ID","Contributor","Fund","Amount","Payment","Receipt"], tx) + "</section>";
    }
    if (state.givingTab === "create") return heading("Giving Management", "Create and publish a Zakat, Sadaqah, or Charity campaign") +
      '<div class="tabs"><button data-action="giving-tab" data-tab="campaigns">Campaigns</button><button class="active" data-action="giving-tab" data-tab="create">Create campaign</button><button data-action="giving-tab" data-tab="contributions">Contributions</button></div>' +
      '<div class="split"><section class="card"><form data-form="campaign">' +
      field("Campaign name","name",state.editCampaign?.name || "","text",true,'maxlength="120"') +
      selectField("Category","category",["Zakat","Sadaqah","Charity","Other approved"].map(x=>({value:x,label:x})),state.editCampaign?.category || "Sadaqah",true) +
      '<div class="field wide"><label>Description</label><textarea class="control" name="description" maxlength="5000">' + escapeHtml(state.editCampaign?.description || "") + '</textarea></div>' +
      field("Target amount","target_amount",state.editCampaign?.target_amount || "","number",true,'min="1" step="0.01"') +
      selectField("Currency","currency",[{value:"INR",label:"INR – Indian Rupee"},{value:"AED",label:"AED – UAE Dirham"},{value:"USD",label:"USD – US Dollar"},{value:"GBP",label:"GBP – Pound Sterling"}],"INR") +
      field("Start date","starts_at",state.editCampaign?.starts_at || "","date") + field("End date","ends_at",state.editCampaign?.ends_at || "","date") +
      '<div class="field wide"><label>Donation instructions</label><textarea class="control" name="donation_instructions" maxlength="2000">' + escapeHtml(state.editCampaign?.donation_instructions || "") + '</textarea></div>' +
      '<div class="field wide"><label>Cover image (optional)</label><input class="control" type="file" name="image" accept="image/jpeg,image/png,image/webp"><input type="hidden" name="existing_image_url" value="' + escapeHtml(state.editCampaign?.image_url || "") + '"><small class="hint">JPG, PNG or WebP · max 2 MB. Upload a new file to replace it.</small>' + (state.editCampaign?.image_url ? '<img src="' + escapeHtml(state.editCampaign.image_url) + '" alt="" style="max-width:180px;border-radius:9px;margin-top:8px">' : '') + '<div id="campaign-image-preview"></div></div>' +
      selectField("Publish status","status",[{value:"Draft",label:"Save as Draft"},{value:"Active",label:"Publish as Active"}], "Draft") +
      '<input type="hidden" name="id" value="' + escapeHtml(state.editCampaign?.id || "") + '">' +
      '<div class="field wide"><button class="btn primary" type="submit">' + (state.editCampaign ? "Save campaign changes" : "Save campaign") + '</button> ' +
      (state.editCampaign ? '<button class="btn" type="button" data-action="cancel-campaign-edit">Cancel</button>' : '') + '</div></form></section>' +
      '<section class="card"><h3>Fund separation</h3><p class="muted">Zakat, Sadaqah, and Charity are separately categorized in campaign and contribution records. Only verified contributions count toward totals.</p></section></div>';
    return heading("Giving Management", "Manage campaigns and monitor verified contributions") +
      '<div class="tabs"><button class="active" data-action="giving-tab" data-tab="campaigns">Campaigns</button><button data-action="giving-tab" data-tab="create">Create campaign</button><button data-action="giving-tab" data-tab="contributions">Contributions</button></div>' +
      '<div class="card"><div class="toolbar"><span class="muted">Campaign list</span><span class="spacer"></span>' +
      button("+ Create campaign","giving-tab","primary",'data-tab="create"') + "</div>" + table(["Campaign","Fund","Target","Verified received","Progress","Status","Action"], rows) + "</div>";
  }
  function renderComplaints() {
    const rows = state.complaints.map(c => '<tr data-open="complaint" data-id="' + escapeHtml(c.id) + '"><td><b>' +
      escapeHtml(c.ticket_id) + '</b></td><td>' + escapeHtml(c.user_name) + '<br><small class="muted">' +
      escapeHtml(c.user_public_id) + '</small></td><td>' + escapeHtml(c.category) + '</td><td>' +
      escapeHtml(c.subject) + '</td><td>' + badge(c.priority) + '</td><td>' + badge(c.status) +
      '</td><td>' + date(c.updated_at) + '</td></tr>');
    return heading("Complaints", "Review tickets and respond to MOMIN users",
      button("+ Create for user","new-complaint","primary")) +
      '<section class="card"><div class="toolbar"><span class="muted">Select a complaint to view its timeline and respond.</span></div>' +
      table(["Ticket ID","User","Category","Subject","Priority","Status","Updated"], rows) + "</section>";
  }
  function renderProfile() {
    const p = state.profile || {};
    return heading("Admin Profile", "Manage your owner account") +
      '<div class="grid grid-2"><section class="card"><h3>Account details</h3><p>Display name: <b>' +
      escapeHtml(p.display_name || state.admin?.display_name || "MOMIN Owner") + '</b></p><p>Admin ID: <b>owner</b></p>' +
      '<form data-form="profile"><div class="field"><label>Change display name</label><input class="control" name="display_name" value="' +
      escapeHtml(p.display_name || state.admin?.display_name || "MOMIN Owner") + '" minlength="2" maxlength="80" required></div>' +
      '<button class="btn primary">Save profile</button></form><p class="hint mt">The Admin ID stays owner and is not editable.</p>' +
      '<hr style="border-color:var(--border);margin:20px 0"><button class="btn danger" data-action="logout">Logout</button></section>' +
      '<section class="card"><h3>Change password</h3><form data-form="password">' +
      '<div class="field"><label>Current password</label><input class="control" name="current_password" type="password" autocomplete="current-password" required></div>' +
      '<div class="field"><label>New password</label><input class="control" name="new_password" type="password" minlength="12" autocomplete="new-password" required></div>' +
      '<div class="field"><label>Confirm new password</label><input class="control" name="confirm_password" type="password" minlength="12" autocomplete="new-password" required></div>' +
      '<p class="hint">Minimum 12 characters with uppercase, lowercase, number and symbol.</p><button class="btn primary">Update password</button></form>' +
      '<hr style="border-color:var(--border);margin:20px 0"><h3>Password recovery</h3><p class="hint">A secure email recovery contact has not yet been configured. Recovery cannot be completed until an approved contact method is set up.</p>' +
      '<button class="btn" data-action="forgot-password">Forgot / reset password</button></section></div>';
  }
  function renderSettings() {
    return heading("Settings / Theme", "Admin Panel appearance") +
      '<section class="card"><h3>Display mode</h3><p class="muted">Choose the theme for this browser.</p>' +
      '<div class="pill-row"><button class="btn ' + (state.theme === "dark" ? "primary" : "") + '" data-action="set-theme" data-theme="dark">Dark mode</button>' +
      '<button class="btn ' + (state.theme === "light" ? "primary" : "") + '" data-action="set-theme" data-theme="light">Light mode</button></div></section>';
  }
  function renderComplaintDetail(c, replies) {
    return '<div class="modal-backdrop" data-action="modal-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="complaint-title">' +
      '<h2 id="complaint-title">' + escapeHtml(c.ticket_id) + " · " + escapeHtml(c.subject) + '</h2><p class="muted">' +
      escapeHtml(c.user_name) + " · " + escapeHtml(c.category) + " · " + escapeHtml(c.priority) + "</p><p>" +
      escapeHtml(c.description) + "</p><div class="timeline">" +
      '<div class="timeline-item"><b>Submitted</b><small>' + date(c.created_at) + "</small></div>" +
      '<div class="timeline-item"><b>Current status: ' + escapeHtml(c.status) + "</b><small>" + date(c.updated_at) + "</small></div>" +
      (replies || []).map(r => '<div class="timeline-item"><b>' + (r.author_type === "admin" ? "Admin response" : "User message") +
        '</b><p>' + escapeHtml(r.message) + "</p><small>" + date(r.created_at) + "</small></div>").join("") +
      '</div><form data-form="complaint-update" data-id="' + escapeHtml(c.id) + '">' +
      selectField("Update status","status",["Open","Pending","In Progress","Resolved","Closed"].map(x=>({value:x,label:x})),c.status) +
      '<div class="field"><label>Admin response (optional)</label><textarea class="control" name="message" maxlength="5000"></textarea></div>' +
      '<div class="modal-actions"><button type="button" class="btn" data-action="modal-close">Close</button><button class="btn primary">Save update</button></div></form></section></div>';
  }
  function render() {
    if (!state.token) return renderLogin();
    if (state.admin?.force_password_change) return renderPasswordRequired();
    let content = "";
    switch (state.page) {
      case "dash": content = renderDashboard(); break;
      case "users": content = renderUsers(); break;
      case "notif": content = renderNotifications(); break;
      case "giving": content = renderGiving(); break;
      case "complaints": content = renderComplaints(); break;
      case "profile": content = renderProfile(); break;
      case "settings": content = renderSettings(); break;
      default: content = renderDashboard();
    }
    renderShell(content);
  }
  async function goto(page) {
    state.page = page; state.menu = false; state.error = ""; render();
    try {
      if (page === "dash") state.dashboard = await api("dashboard");
      if (page === "users") {
        const result = await api("users", { q: state.userQuery, status: state.userStatus });
        state.users = result.users || [];
      }
      if (page === "notif") {
        const [users, history] = await Promise.all([
          api("users", { q: "", status: "Active" }), api("notifications_history")
        ]);
        state.users = users.users || []; state.notifications = history.notifications || [];
      }
      if (page === "giving") {
        if (state.givingTab === "contributions") state.contributions = (await api("contributions")).contributions || [];
        else state.campaigns = (await api("campaigns")).campaigns || [];
      }
      if (page === "complaints") state.complaints = (await api("complaints")).complaints || [];
      if (page === "profile") state.profile = (await api("me")).admin;
    } catch (error) {
      state.error = error.message;
    }
    render();
    if (state.error) toast(state.error, true);
  }
  async function doLogin(form) {
    state.busy = true; state.error = ""; renderLogin();
    try {
      const data = await api("login", {
        login_id: form.elements.login_id.value.trim(),
        password: form.elements.password.value
      });
      state.token = data.token; state.admin = { ...data.admin, force_password_change: data.force_password_change };
      if (data.force_password_change) render();
      else await goto("dash");
    } catch (error) { state.error = error.message; renderLogin(); }
    finally { state.busy = false; }
  }
  async function logout() {
    try { await api("logout"); } catch (_) {}
    state.token = null; state.admin = null; state.page = "login"; state.dashboard = null; state.users = [];
    render(); toast("You have been signed out.");
  }
  async function savePassword(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    if (values.new_password !== values.confirm_password) throw new Error("New passwords do not match.");
    await api("change_password", values);
    state.admin.force_password_change = false;
    toast("Admin password updated.");
    await goto("dash");
  }
  function userDetailsHtml(data) {
    const u = data.user || {};
    const noteRows = (data.notifications || []).map(n => "<tr><td>" + escapeHtml(n.title) + "</td><td>" +
      escapeHtml(n.route) + "</td><td>" + date(n.created_at) + "</td><td>" + (n.read_at ? "Read" : "Unread") + "</td></tr>");
    const givingRows = (data.contributions || []).map(x => "<tr><td>" + escapeHtml(x.transaction_ref) + "</td><td>" +
      escapeHtml(x.fund_category) + "</td><td>" + money(x.amount, x.currency) + "</td><td>" + badge(x.payment_status) + "</td></tr>");
    const complaintRows = (data.complaints || []).map(x => "<tr><td>" + escapeHtml(x.ticket_id) + "</td><td>" +
      escapeHtml(x.subject) + "</td><td>" + badge(x.status) + "</td></tr>");
    return '<h2>User details</h2><p class="muted">Permanent User ID: <b>' + escapeHtml(u.user_id) + '</b></p>' +
      '<div class="grid grid-2"><div><b>Name</b><p>' + escapeHtml(u.name) + '</p><b>Email</b><p>' + escapeHtml(u.email || "—") +
      '</p><b>Phone</b><p>' + escapeHtml(u.phone || "—") + '</p></div><div><b>Account status</b><p>' + badge(u.status) +
      '</p><b>Registered</b><p>' + date(u.registered_at) + '</p><b>Last active</b><p>' + date(u.last_active) +
      '</p></div></div><h3>Recent notifications</h3>' + table(["Title","Destination","Created","Read"], noteRows, "No notifications recorded.") +
      '<h3 class="mt">Giving history</h3>' + table(["Reference","Fund","Amount","Payment"], givingRows, "No contributions recorded.") +
      '<h3 class="mt">Complaints</h3>' + table(["Ticket","Subject","Status"], complaintRows, "No complaints recorded.") +
      '<div class="modal-actions"><button type="button" class="btn" data-action="modal-close">Close</button></div>';
  }
  async function editUser(id) {
    const user = state.users.find(x => x.id === id);
    if (!user) return;
    showModal('<h2>Edit user name</h2><p class="muted">Permanent User ID: <b>' + escapeHtml(user.user_id) +
      '</b></p><form data-form="edit-user" data-id="' + escapeHtml(id) + '"><div class="field"><label>User name</label><input class="control" name="name" value="' +
      escapeHtml(user.name) + '" minlength="2" maxlength="80" required></div><div class="modal-actions">' +
      '<button type="button" class="btn" data-action="modal-close">Cancel</button><button class="btn primary">Save name</button></div></form>');
  }
  function showModal(html) {
    const node = document.getElementById("modal-root");
    node.innerHTML = '<div class="modal-backdrop" data-action="modal-close"><section class="modal">' + html + "</section></div>";
  }
  function closeModal() { document.getElementById("modal-root").innerHTML = ""; }
  async function openComplaint(id) {
    const data = await api("complaint_detail", { id });
    showModal(complaintModalHtml(data.complaint, data.replies || []));
  }
  function complaintModalHtml(c, replies) {
    return '<h2>' + escapeHtml(c.ticket_id) + " · " + escapeHtml(c.subject) + '</h2><p class="muted">' +
      escapeHtml(c.user_name || "MOMIN User") + " · " + escapeHtml(c.category) + " · " + escapeHtml(c.priority) + "</p><p>" +
      escapeHtml(c.description) + '</p><div class="timeline"><div class="timeline-item"><b>Submitted</b><small>' +
      date(c.created_at) + "</small></div><div class="timeline-item"><b>Current status: " + escapeHtml(c.status) +
      "</b><small>" + date(c.updated_at) + "</small></div>" + replies.map(r =>
        '<div class="timeline-item"><b>' + (r.author_type === "admin" ? "Admin response" : "User message") +
        '</b><p>' + escapeHtml(r.message) + "</p><small>" + date(r.created_at) + "</small></div>").join("") +
      '</div><form data-form="complaint-update" data-id="' + escapeHtml(c.id) + '">' +
      selectField("Update status","status",["Open","Pending","In Progress","Resolved","Closed"].map(x=>({value:x,label:x})),c.status) +
      '<div class="field"><label>Admin response (optional)</label><textarea class="control" name="message" maxlength="5000"></textarea></div>' +
      '<div class="modal-actions"><button type="button" class="btn" data-action="modal-close">Close</button><button class="btn primary">Save update</button></div></form>';
  }
  async function sendNotification(form) {
    const data = new FormData(form);
    const audience = data.get("audience");
    const selected = Array.from(form.elements.user_ids?.selectedOptions || []).map(o => o.value);
    if (audience !== "all" && !selected.length) throw new Error("Select at least one user.");
    let imageUrl = null;
    const image = data.get("image");
    if (image instanceof File && image.size) imageUrl = (await upload(image, "notification")).public_url;
    const result = await api("send_notification", {
      title: data.get("title"), message: data.get("message"), audience,
      route: data.get("route"), user_ids: selected, image_url: imageUrl
    });
    toast("Notification processed. " + result.recipient_count + " user inbox record(s); push sent to " + result.push_sent + " device(s).");
    state.notifTab = "history"; await goto("notif");
  }
  async function saveCampaign(form) {
    const data = new FormData(form);
    let imageUrl = data.get("existing_image_url") || null;
    const image = data.get("image");
    if (image instanceof File && image.size) imageUrl = (await upload(image, "giving")).public_url;
    await api("save_campaign", {
      id: data.get("id") || null,
      name: data.get("name"), category: data.get("category"), description: data.get("description"),
      target_amount: data.get("target_amount"), currency: data.get("currency"), starts_at: data.get("starts_at") || null,
      ends_at: data.get("ends_at") || null, donation_instructions: data.get("donation_instructions"),
      status: data.get("status"), image_url: imageUrl
    });
    toast("Campaign saved.");
    state.givingTab = "campaigns"; await goto("giving");
  }
  function updateNotificationPreview(form) {
    const title = form.elements.title?.value || "Notification title";
    const message = form.elements.message?.value || "Your message will appear here.";
    const t = document.getElementById("notice-preview-title");
    const m = document.getElementById("notice-preview-message");
    if (t) t.textContent = title;
    if (m) m.textContent = message;
    const preview = document.getElementById("notice-preview-image");
    const file = form.elements.image?.files?.[0];
    if (preview) preview.innerHTML = file ? '<img alt="Notification image preview" style="width:100%;border-radius:9px;margin-top:8px" src="' + URL.createObjectURL(file) + '">' : "";
  }
  root.addEventListener("submit", async event => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.form;
    try {
      if (type === "login") return await doLogin(form);
      if (type === "password") return await savePassword(form);
      if (type === "user-search") {
        state.userQuery = form.elements.q.value.trim(); state.userStatus = form.elements.status.value;
        return await goto("users");
      }
      if (type === "edit-user") {
        await api("update_user", { id: form.dataset.id, name: form.elements.name.value.trim() });
        closeModal(); toast("User name updated. Permanent User ID unchanged."); return await goto("users");
      }
      if (type === "notification") return await sendNotification(form);
      if (type === "campaign") return await saveCampaign(form);
      if (type === "complaint-update") {
        await api("update_complaint", { id: form.dataset.id, status: form.elements.status.value, message: form.elements.message.value.trim() });
        closeModal(); toast("Complaint updated. The user inbox was notified."); return await goto("complaints");
      }
      if (type === "profile") {
        const result = await api("profile_update", { display_name: form.elements.display_name.value.trim() });
        state.profile.display_name = result.display_name; state.admin.display_name = result.display_name;
        toast("Admin profile updated."); return render();
      }
    } catch (error) { toast(error.message, true); }
  });
  root.addEventListener("input", event => {
    if (event.target.closest('form[data-form="notification"]')) updateNotificationPreview(event.target.form);
  });
  root.addEventListener("change", event => {
    if (event.target.matches("[data-audience]")) {
      const box = document.getElementById("recipient-field");
      if (box) box.hidden = event.target.value === "all";
      const select = document.getElementById("user-ids");
      if (select) select.multiple = event.target.value === "selected";
    }
    if (event.target.matches("#notification-image")) updateNotificationPreview(event.target.form);
  });
  root.addEventListener("click", async event => {
    const navButton = event.target.closest("[data-go]");
    if (navButton) return await goto(navButton.dataset.go);
    const tr = event.target.closest('tr[data-open="complaint"]');
    if (tr) { try { await openComplaint(tr.dataset.id); } catch (e) { toast(e.message, true); } return; }
    const el = event.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    try {
      if (action === "logout") return await logout();
      if (action === "toggle-menu") { state.menu = !state.menu; return render(); }
      if (action === "close-menu") { state.menu = false; return render(); }
      if (action === "theme") { state.theme = state.theme === "dark" ? "light" : "dark"; localStorage.setItem("momin-admin-theme", state.theme); document.documentElement.dataset.theme = state.theme; return render(); }
      if (action === "set-theme") { state.theme = el.dataset.theme; localStorage.setItem("momin-admin-theme", state.theme); document.documentElement.dataset.theme = state.theme; return render(); }
      if (action === "toggle-password") { const input = document.getElementById("login-password"); if (input) input.type = el.checked ? "text" : "password"; return; }
      if (action === "forgot-login" || action === "forgot-password") { const data = await api("forgot_password"); toast(data.message || "Password recovery is not configured.", true); return; }
      if (action === "modal-close" && (event.target === el || el.classList.contains("btn"))) return closeModal();
      if (action === "view-user") {
        const detail = await api("user_detail", { id: el.dataset.id });
        showModal(userDetailsHtml(detail)); return;
      }
      if (action === "edit-user") return editUser(el.dataset.id);
      if (action === "user-status") {
        if (!confirm("Change this user's account status to " + el.dataset.status + "?")) return;
        await api("set_user_status", { id: el.dataset.id, status: el.dataset.status });
        toast("User status changed."); return await goto("users");
      }
      if (action === "notif-tab") { state.notifTab = el.dataset.tab; return await goto("notif"); }
      if (action === "giving-tab") { state.givingTab = el.dataset.tab; return await goto("giving"); }
      if (action === "edit-campaign") {
        state.editCampaign = state.campaigns.find(x => x.id === el.dataset.id) || null;
        state.givingTab = "create"; return await goto("giving");
      }
      if (action === "cancel-campaign-edit") {
        state.editCampaign = null; state.givingTab = "campaigns"; return await goto("giving");
      }
      if (action === "campaign-status") {
        if (!confirm("Set campaign status to " + el.dataset.status + "?")) return;
        await api("campaign_status", { id: el.dataset.id, status: el.dataset.status });
        toast("Campaign status updated."); return await goto("giving");
      }
      if (action === "new-complaint") {
        const users = await api("users", { q: "", status: "all" });
        showModal('<h2>Create complaint for a user</h2><form data-form="create-complaint">' +
          selectField("MOMIN user","user_id",(users.users || []).map(u=>({value:u.id,label:u.user_id+" · "+u.name})),"",true) +
          selectField("Category","category",["Login","Notifications","Giving","Quran","Prayer Times","Account","Other"].map(x=>({value:x,label:x})),"Other",true) +
          selectField("Priority","priority",["Low","Normal","High"].map(x=>({value:x,label:x})),"Normal") +
          '<div class="field"><label>Subject</label><input class="control" name="subject" maxlength="120" required></div>' +
          '<div class="field"><label>Description</label><textarea class="control" name="description" minlength="10" maxlength="5000" required></textarea></div>' +
          '<div class="modal-actions"><button type="button" class="btn" data-action="modal-close">Cancel</button><button class="btn primary">Create complaint</button></div></form>');
        return;
      }
    } catch (error) { toast(error.message, true); }
  });
  const modalRoot = document.getElementById("modal-root");
  modalRoot.addEventListener("click", event => {
    const close = event.target.closest('[data-action="modal-close"]');
    if (close && (event.target === close || close.classList.contains("btn"))) closeModal();
  });
  modalRoot.addEventListener("submit", async event => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    try {
      if (form.dataset.form === "create-complaint") {
        const result = await api("create_complaint", {
          user_id: form.elements.user_id.value, category: form.elements.category.value,
          priority: form.elements.priority.value, subject: form.elements.subject.value.trim(),
          description: form.elements.description.value.trim()
        });
        closeModal(); toast("Complaint created: " + result.ticket_id); await goto("complaints");
      } else if (form.dataset.form === "edit-user") {
        await api("update_user", { id: form.dataset.id, name: form.elements.name.value.trim() });
        closeModal(); toast("User name updated. Permanent User ID unchanged."); await goto("users");
      } else if (form.dataset.form === "complaint-update") {
        await api("update_complaint", { id: form.dataset.id, status: form.elements.status.value, message: form.elements.message.value.trim() });
        closeModal(); toast("Complaint updated. The user inbox was notified."); await goto("complaints");
      }
    } catch (error) { toast(error.message, true); }
  });
  // Never persist the Admin bearer token in localStorage/sessionStorage.
  renderLogin();
})();
