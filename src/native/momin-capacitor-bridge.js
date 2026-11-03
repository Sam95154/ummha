import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { PushNotifications } from "@capacitor/push-notifications";
import "./momin-native-prayer-alarm.js";
// Ask for Android permissions only when the user enables the feature that needs them.

const AUTH_REDIRECT = "com.momin.noorulislam://auth/callback";
const AUTH_RECOVERY_REDIRECT = "com.momin.noorulislam://auth/recovery";

const FCM_APP_ID = "com.momin.noorulislam";
const FCM_ROUTE_ALLOWLIST = new Set([
  "home", "prayers", "quran", "duas", "calendar",
  "notifications", "settings", "journey", "giving", "complaints"
]);
let fcmTokenRegistration = Promise.resolve();
let lastFcmToken = "";
let fcmRegistrationWaiters = [];
let fcmRegisterPromise = null;

function currentFcmDeviceKey() {
  try {
    let key = localStorage.getItem("momin-device-key-v1");
    if (!key) {
      key = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : "momin-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      localStorage.setItem("momin-device-key-v1", key);
    }
    return key;
  } catch (_) {
    throw new Error("MOMIN could not access this device's registration ID.");
  }
}

async function getFcmSupabaseClient() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const client = window.mominSupabase;
    if (client && client.auth && client.functions) return client;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  throw new Error("MOMIN sign-in has not finished. Please try enabling notifications again.");
}

async function saveFcmToken(token) {
  const client = await getFcmSupabaseClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in to MOMIN before registering notifications.");
  const enabled = localStorage.getItem("momin-push-enabled") === "true";
  const announcements = true;
  try { localStorage.setItem("momin-announcements-enabled", "true"); } catch (_) {}
  if (!enabled) return { skipped: true };
  const { data, error } = await client.functions.invoke("momin-fcm-register", {
    body: {
      action: "register",
      fcm_token: token,
      device_key: currentFcmDeviceKey(),
      device_name: "MOMIN Android",
      app_id: FCM_APP_ID,
      announcements_enabled: true
    }
  });
  if (error) throw error;
  if (!data || data.success !== true) throw new Error((data && data.error) || "MOMIN could not save this Firebase token.");
  return data;
}

async function handleFcmRegistration(tokenObject) {
  const token = tokenObject && String(tokenObject.value || "").trim();
  if (!token) throw new Error("Firebase returned an empty device token.");
  fcmTokenRegistration = fcmTokenRegistration.catch(() => {}).then(async () => {
    const saved = await saveFcmToken(token);
    lastFcmToken = token;
    const pending = fcmRegistrationWaiters.splice(0);
    pending.forEach((waiter) => waiter.resolve(saved));
    window.dispatchEvent(new CustomEvent("momin:fcm-token-registered", { detail: { success: true } }));
    return saved;
  }).catch((error) => {
    const pending = fcmRegistrationWaiters.splice(0);
    pending.forEach((waiter) => waiter.reject(error));
    console.error("MOMIN FCM registration:", error);
    window.dispatchEvent(new CustomEvent("momin:fcm-token-registration-error", {
      detail: { message: error && error.message ? error.message : "FCM registration failed." }
    }));
    throw error;
  });
  return fcmTokenRegistration;
}

function openMominNotificationRoute(rawRoute) {
  const route = FCM_ROUTE_ALLOWLIST.has(String(rawRoute || "")) ? String(rawRoute) : "notifications";
  let attempts = 0;
  const open = () => {
    attempts += 1;
    const bridge = window.MominNotificationsBridgeV1;
    if (bridge && typeof bridge.navigate === "function") {
      bridge.navigate(route);
      if (typeof bridge.refreshInbox === "function") bridge.refreshInbox().catch((error) => {
        console.warn("MOMIN notification inbox refresh:", error);
      });
      return;
    }
    if (typeof window.go === "function") {
      window.go(route);
      return;
    }
    if (attempts < 40) window.setTimeout(open, 150);
  };
  open();
}

async function initializeMominFcm() {
  try {
    await App.addListener("appStateChange", (state) => {
      if (state && state.isActive) {
        window.dispatchEvent(new CustomEvent("momin:app-resumed"));
      }
    });
  } catch (error) {
    console.warn("MOMIN app foreground listener:", error);
  }
  PushNotifications.addListener("registration", (token) => {
    handleFcmRegistration(token).catch(() => {});
  });
  PushNotifications.addListener("registrationError", (error) => {
    const message = error && error.message ? error.message : "Firebase could not register this device.";
    const pending = fcmRegistrationWaiters.splice(0);
    pending.forEach((waiter) => waiter.reject(new Error(message)));
    console.error("MOMIN FCM registration error:", error);
    window.dispatchEvent(new CustomEvent("momin:fcm-token-registration-error", { detail: { message } }));
  });
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    window.dispatchEvent(new CustomEvent("momin:fcm-notification-received", { detail: notification }));
    const bridge = window.MominNotificationsBridgeV1;
    if (bridge && typeof bridge.refreshInbox === "function") {
      bridge.refreshInbox().catch((error) => console.warn("MOMIN inbox refresh:", error));
    }
    if (typeof window.toast === "function" && notification) {
      window.toast((notification.title || "MOMIN") + (notification.body ? ": " + notification.body : ""));
    }
  });
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const data = action && action.notification && action.notification.data || {};
    openMominNotificationRoute(data.route);
  });

  try {
    await PushNotifications.createChannel({
      id: "momin-announcements",
      name: "MOMIN announcements",
      description: "Announcements and important updates from MOMIN",
      importance: 5,
      visibility: 1,
      sound: "default"
    });
  } catch (error) {
    console.warn("MOMIN notification channel:", error);
  }

  window.MominNativePush = {
    isNative: true,
    register: async function () {
      if (fcmRegisterPromise) return await fcmRegisterPromise;
      fcmRegisterPromise = (async function () {
        const permissions = await PushNotifications.checkPermissions();
        let receive = permissions.receive;
        if (receive === "prompt" || receive === "prompt-with-rationale") {
          const asked = await PushNotifications.requestPermissions();
          receive = asked.receive;
        }
        if (receive !== "granted") {
          throw new Error("Allow notifications for MOMIN in Android settings.");
        }
        return await new Promise(async (resolve, reject) => {
          const waiter = { resolve, reject };
          fcmRegistrationWaiters.push(waiter);
          const timer = window.setTimeout(() => {
            const index = fcmRegistrationWaiters.indexOf(waiter);
            if (index >= 0) fcmRegistrationWaiters.splice(index, 1);
            reject(new Error("Firebase registration timed out. Check your internet connection and Firebase app configuration."));
          }, 20000);
          const done = (fn) => (value) => { window.clearTimeout(timer); fn(value); };
          waiter.resolve = done(resolve);
          waiter.reject = done(reject);
          try {
            await PushNotifications.register();
          } catch (error) {
            const index = fcmRegistrationWaiters.indexOf(waiter);
            if (index >= 0) fcmRegistrationWaiters.splice(index, 1);
            window.clearTimeout(timer);
            reject(error);
          }
        });
      })();
      try { return await fcmRegisterPromise; }
      finally { fcmRegisterPromise = null; }
    },
    disable: async function () {
      const client = await getFcmSupabaseClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth || !auth.user) return { success: true, skipped: true };
      const { data, error } = await client.functions.invoke("momin-fcm-register", {
        body: { action: "disable", device_key: currentFcmDeviceKey(), app_id: FCM_APP_ID }
      });
      if (error) throw error;
      if (!data || data.success !== true) throw new Error((data && data.error) || "Could not disable MOMIN push notifications.");
      return data;
    },
    syncIfEnabled: async function () {
      if (localStorage.getItem("momin-push-enabled") !== "true") return { skipped: true };
      return await this.register();
    },
    getLastTokenRegistered: function () { return lastFcmToken ? true : false; }
  };
}

if (Capacitor.isNativePlatform()) {
  initializeMominFcm().catch((error) => console.warn("MOMIN FCM initialization:", error));
  window.MominNative = {
    isNative: true,
    authRedirectUrl: AUTH_REDIRECT,
    openOAuth: async function (url) {
      if (!url || !/^https:\/\//i.test(url)) {
        throw new Error("MOMIN received an invalid sign-in URL.");
      }
      await Browser.open({ url: url });
    }
  };

  async function waitForSupabaseClient() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const client = window.mominSupabase;
      if (client && client.auth && typeof client.auth.exchangeCodeForSession === "function") {
        return client;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    throw new Error("MOMIN sign-in callback timed out while starting the app.");
  }

  async function handleAuthReturn(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl.startsWith(AUTH_REDIRECT)) return;

    try {
      const callback = new URL(rawUrl);
      const authError = callback.searchParams.get("error_description") || callback.searchParams.get("error");
      if (authError) {
        throw new Error(authError);
      }

      const code = callback.searchParams.get("code");
      if (!code) {
        throw new Error("The sign-in provider did not return an authorization code.");
      }

      const client = await waitForSupabaseClient();
      const result = await client.auth.exchangeCodeForSession(code);
      if (result.error) throw result.error;

      try { await Browser.close(); } catch (_) {}

      if (window.location.pathname.endsWith("/login.html")) {
        const requestedNext = new URLSearchParams(window.location.search).get("next") || "/";
        let safeNext = "/";
        try {
          const destination = new URL(requestedNext, window.location.origin);
          if (destination.origin === window.location.origin &&
              destination.pathname !== "/profile-complete.html") {
            safeNext = destination.pathname + destination.search + destination.hash;
          }
        } catch (_) {}
        const profileUrl = "/profile-complete.html?next=" + encodeURIComponent(safeNext);
        window.location.replace(profileUrl);
      }
    } catch (error) {
      console.error("MOMIN native sign-in:", error);
      try { await Browser.close(); } catch (_) {}
      const message = error && error.message ? error.message : "Google sign-in could not be completed.";
      window.setTimeout(() => window.alert(message), 250);
    }
  }

  App.addListener("appUrlOpen", ({ url }) => {
    handleAuthReturn(url);
  });

  App.getLaunchUrl().then((launch) => {
    if (launch && launch.url) handleAuthReturn(launch.url);
  }).catch((error) => {
    console.warn("MOMIN launch URL check:", error);
  });

  const originalWindowOpen = window.open.bind(window);
  window.open = function (url, target, features) {
    try {
      const parsed = new URL(String(url), window.location.href);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        Browser.open({ url: parsed.href }).catch((error) => console.warn("MOMIN external link:", error));
        return null;
      }
    } catch (_) {}
    return originalWindowOpen(url, target, features);
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor) return;
    let destination;
    try {
      destination = new URL(anchor.href, window.location.href);
    } catch (_) {
      return;
    }
    if ((destination.protocol === "https:" || destination.protocol === "http:") &&
        destination.origin !== window.location.origin) {
      event.preventDefault();
      Browser.open({ url: destination.href }).catch((error) => {
        console.warn("MOMIN external link:", error);
      });
    }
  }, true);
}
