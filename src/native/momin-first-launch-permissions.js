import { Capacitor } from "@capacitor/core";

const FLAG = "momin-first-launch-permissions-v1-complete";
const NATIVE = Capacitor.isNativePlatform();

if (NATIVE) {
  function isComplete() {
    try { return localStorage.getItem(FLAG) === "true"; } catch (_) { return false; }
  }

  function render() {
    if (isComplete() || document.getElementById("momin-first-launch-permissions")) return;
    const root = document.createElement("div");
    root.id = "momin-first-launch-permissions";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "momin-permissions-title");
    root.innerHTML = '<style>' +
      '#momin-first-launch-permissions{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;overflow:auto;padding:22px 16px;background:radial-gradient(120% 90% at 50% 0%,rgba(194,151,65,.18),transparent 60%),linear-gradient(155deg,#090806,#171208 65%,#0b0906);color:#f8f0dc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '#momin-first-launch-permissions *{box-sizing:border-box}' +
      '#momin-first-launch-permissions .mlp-panel{width:min(100%,520px);margin:auto;padding:24px 20px;border:1px solid rgba(213,174,95,.4);border-radius:24px;background:linear-gradient(160deg,rgba(37,30,17,.98),rgba(16,13,9,.98));box-shadow:0 22px 70px rgba(0,0,0,.48)}' +
      '#momin-first-launch-permissions .mlp-mark{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 12px;border:1px solid rgba(220,184,109,.55);border-radius:18px;background:rgba(208,169,88,.1);color:#e5c37f;font-size:26px}' +
      '#momin-first-launch-permissions h1{margin:0;text-align:center;font:700 27px Georgia,serif;letter-spacing:.03em}' +
      '#momin-first-launch-permissions .mlp-intro{margin:10px 0 18px;text-align:center;color:#c6b995;font-size:13px;line-height:1.65}' +
      '#momin-first-launch-permissions .mlp-step{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px 0;border-top:1px solid rgba(226,203,157,.14)}' +
      '#momin-first-launch-permissions .mlp-step b{display:block;margin-bottom:4px;color:#f7e9c7;font-size:13px}' +
      '#momin-first-launch-permissions .mlp-step small{display:block;color:#b6aa8c;font-size:11px;line-height:1.5}' +
      '#momin-first-launch-permissions .mlp-status{display:block;margin-top:5px;color:#d6b875;font-size:10px;font-weight:700}' +
      '#momin-first-launch-permissions button{border:1px solid rgba(218,178,99,.48);border-radius:11px;padding:9px 12px;background:rgba(209,166,76,.12);color:#f5dfaa;font-size:11px;font-weight:750;white-space:nowrap;cursor:pointer}' +
      '#momin-first-launch-permissions button:disabled{opacity:.48;cursor:default}' +
      '#momin-first-launch-permissions .mlp-actions{display:grid;gap:9px;margin-top:18px}' +
      '#momin-first-launch-permissions .mlp-continue{width:100%;padding:13px 16px;background:linear-gradient(135deg,#e7c77f,#b78a37);border:0;color:#1a1308;font-size:13px}' +
      '#momin-first-launch-permissions .mlp-note{margin:0;text-align:center;color:#aa9d7e;font-size:10px;line-height:1.6}' +
      '#momin-first-launch-permissions .mlp-skip{width:100%;background:transparent;border-color:rgba(220,200,160,.18);color:#c8b996}' +
      '#momin-first-launch-permissions .mlp-error{min-height:16px;text-align:center;color:#e5b2a1;font-size:11px}' +
      '@media(max-width:380px){#momin-first-launch-permissions .mlp-panel{padding:20px 15px}#momin-first-launch-permissions .mlp-step{grid-template-columns:1fr}#momin-first-launch-permissions .mlp-step button{width:100%}}' +
      '</style>' +
      '<div class="mlp-panel"><div class="mlp-mark" aria-hidden="true">۞</div>' +
      '<h1 id="momin-permissions-title">Welcome to MOMIN</h1>' +
      '<p class="mlp-intro">Set up your phone so prayer times and reminders work correctly. Android will ask separately for each permission.</p>' +
      '<div class="mlp-step"><div><b>Location access</b><small>Used while MOMIN is open to find your city, calculate prayer times and show Qibla direction.</small><span class="mlp-status" id="mlp-location-status">Checking…</span></div><button type="button" id="mlp-location">Allow location</button></div>' +
      '<div class="mlp-step"><div><b>Notifications</b><small>Allows prayer alerts, Islamic festival reminders and admin announcements to appear on your phone.</small><span class="mlp-status" id="mlp-notification-status">Checking…</span></div><button type="button" id="mlp-notification">Enable notifications</button></div>' +
      '<div class="mlp-step"><div><b>Precise prayer alarms</b><small>Allows MOMIN to trigger the actual prayer-time alert accurately, including when the phone is idle. The full Azan is played only at prayer time.</small><span class="mlp-status" id="mlp-exact-status">Checking…</span></div><button type="button" id="mlp-exact">Enable precise alarms</button></div>' +
      '<div class="mlp-actions"><div class="mlp-error" id="mlp-error" aria-live="polite"></div><button class="mlp-continue" type="button" id="mlp-continue">Continue to MOMIN</button><button class="mlp-skip" type="button" id="mlp-later">Set these up later</button><p class="mlp-note">You can change these permissions at any time in Android Settings. Location and precise alarms are not required to browse the Quran or Duas.</p></div></div>';
    document.body.appendChild(root);

    const api = () => window.MominNativePrayerAlarm;
    async function refreshStatus() {
      try {
        const status = await api().getStatus();
        const entries = [
          ["mlp-location-status", status.locationGranted, "Allowed", "Not allowed yet"],
          ["mlp-notification-status", status.notificationsEnabled, "Allowed", "Not allowed yet"],
          ["mlp-exact-status", status.exactAlarmAllowed, "Enabled", "Not enabled yet"]
        ];
        entries.forEach(([id, granted, yes, no]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = granted ? yes : no;
        });
        const l = document.getElementById("mlp-location");
        const n = document.getElementById("mlp-notification");
        const e = document.getElementById("mlp-exact");
        if (l) { l.textContent = status.locationGranted ? "Allowed" : "Allow location"; l.disabled = !!status.locationGranted; }
        if (n) { n.textContent = status.notificationsEnabled ? "Allowed" : "Enable notifications"; n.disabled = !!status.notificationsEnabled; }
        if (e) { e.textContent = status.exactAlarmAllowed ? "Enabled" : "Enable precise alarms"; e.disabled = !!status.exactAlarmAllowed; }
      } catch (error) {
        const el = document.getElementById("mlp-error");
        if (el) el.textContent = error.message || "Could not read Android permission status.";
      }
    }

    document.getElementById("mlp-location").addEventListener("click", async () => {
      try {
        const result = await api().requestLocationPermission();
        await refreshStatus();
        if (!result.locationGranted) document.getElementById("mlp-error").textContent = "Location was not allowed. You can enter your city manually later.";
      } catch (error) { document.getElementById("mlp-error").textContent = error.message || "Location permission could not be requested."; }
    });
    document.getElementById("mlp-notification").addEventListener("click", async () => {
      try { await api().requestNotificationPermission(); await refreshStatus(); }
      catch (error) { document.getElementById("mlp-error").textContent = error.message || "Notification permission could not be requested."; }
    });
    document.getElementById("mlp-exact").addEventListener("click", async () => {
      try {
        await api().openExactAlarmSettings();
        document.getElementById("mlp-error").textContent = "Enable MOMIN under Alarms & reminders, then return to this screen.";
        window.setTimeout(refreshStatus, 900);
      } catch (error) { document.getElementById("mlp-error").textContent = error.message || "Could not open Alarms & reminders settings."; }
    });
    const complete = () => {
      try { localStorage.setItem(FLAG, "true"); } catch (_) {}
      window.removeEventListener("focus", refreshStatus);
      root.remove();
      window.dispatchEvent(new CustomEvent("momin:first-launch-permissions-complete"));
    };
    document.getElementById("mlp-continue").addEventListener("click", complete);
    document.getElementById("mlp-later").addEventListener("click", complete);
    window.addEventListener("focus", refreshStatus);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshStatus(); });
    refreshStatus();
  }

  window.MominFirstLaunchPermissionsV1 = { isComplete };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
}
