import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

const AUTH_REDIRECT = "com.momin.noorulislam://auth/callback";

if (Capacitor.isNativePlatform()) {
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
