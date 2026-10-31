/* MOMIN Web Push service worker. Handles push while the web app is closed. */
"use strict";

self.addEventListener("install", function(event) {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function(event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data ? event.data.text() : "" };
  }
  var title = String(payload.title || "MOMIN reminder");
  var body = String(payload.body || "A reminder from MOMIN.");
  var route = String(payload.route || "home");
  var allowed = ["home","prayers","quran","duas","calendar","notifications","settings","journey"];
  if (allowed.indexOf(route) < 0) route = "home";
  var options = {
    body: body,
    icon: "/momin-mark.svg?v=islamic-logo-v3",
    badge: "/momin-mark.svg?v=islamic-logo-v3",
    tag: String(payload.tag || "momin-reminder"),
    renotify: false,
    requireInteraction: false,
    vibrate: [180, 90, 180],
    data: { route: route, url: "/?mominPushRoute=" + encodeURIComponent(route) }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var route = event.notification.data && event.notification.data.route || "home";
  var allowed = ["home","prayers","quran","duas","calendar","notifications","settings","journey"];
  if (allowed.indexOf(route) < 0) route = "home";
  var target = new URL("/?mominPushRoute=" + encodeURIComponent(route), self.location.origin).href;
  event.waitUntil((async function() {
    var windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (var i = 0; i < windows.length; i++) {
      var client = windows[i];
      if (new URL(client.url).origin !== self.location.origin) continue;
      try {
        await client.navigate(target);
        await client.focus();
        return;
      } catch (_) {
        try { await client.focus(); client.postMessage({ type: "MOMIN_PUSH_OPEN", route: route }); return; } catch (_) {}
      }
    }
    await self.clients.openWindow(target);
  })());
});

self.addEventListener("pushsubscriptionchange", function(event) {
  /* Browsers may rotate a subscription. The next signed-in app visit re-registers it. */
  event.waitUntil(Promise.resolve());
});