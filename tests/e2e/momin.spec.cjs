const { test, expect } = require("@playwright/test");

async function installSupabaseMock(page, options) {
  const settings = Object.assign({
    authenticated: true,
    verified: true,
    profileComplete: true
  }, options || {});

  await page.route("**/supabase-js@2*", (route) => route.abort());
  await page.addInitScript((config) => {
    const user = {
      id: "momin-qa-user",
      email: "qa-user@example.test",
      email_confirmed_at: config.verified ? "2026-10-31T12:00:00.000Z" : null,
      confirmed_at: config.verified ? "2026-10-31T12:00:00.000Z" : null,
      user_metadata: {
        email_verified: !!config.verified,
        full_name: "MOMIN QA User"
      },
      app_metadata: { provider: "email" }
    };
    const session = config.authenticated ? {
      access_token: "qa-access-token",
      refresh_token: "qa-refresh-token",
      token_type: "bearer",
      user
    } : null;

    function queryBuilder(table) {
      const profile = table === "momin_profiles"
        ? {
            user_id: user.id,
            display_name: "MOMIN QA User",
            email: user.email,
            profile_completed: !!config.profileComplete,
            email_verified: !!config.verified
          }
        : null;
      const response = { data: profile ? [profile] : [], error: null, count: 0 };
      const builder = {
        select() { return builder; },
        insert() { return builder; },
        upsert() { return builder; },
        update() { return builder; },
        delete() { return builder; },
        eq() { return builder; },
        neq() { return builder; },
        is() { return builder; },
        in() { return builder; },
        match() { return builder; },
        order() { return builder; },
        limit() { return builder; },
        range() { return builder; },
        gte() { return builder; },
        lte() { return builder; },
        filter() { return builder; },
        maybeSingle: async () => ({ data: profile, error: null }),
        single: async () => ({ data: profile, error: null }),
        then(resolve, reject) {
          return Promise.resolve(response).then(resolve, reject);
        }
      };
      return builder;
    }

    const client = {
      auth: {
        getSession: async () => ({ data: { session }, error: null }),
        getUser: async () => ({ data: { user: config.authenticated ? user : null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe() {} } }
        }),
        signOut: async () => ({ error: null }),
        refreshSession: async () => ({ data: { session }, error: null })
      },
      from: (table) => queryBuilder(table),
      functions: {
        invoke: async () => ({ data: {}, error: null })
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: {}, error: null }),
          remove: async () => ({ data: [], error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } })
        })
      }
    };

    window.supabase = { createClient: () => client };
    window.mominSupabase = client;
  }, settings);
}

async function openAuthenticatedApp(page) {
  await installSupabaseMock(page);
  await page.goto("/index.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toHaveClass(/momin-app-shell-active/);
  await expect(page.locator("#momin-shared-bottom-nav-v1")).toBeVisible();
  expect(await page.locator("#view").evaluate((element) => element.childElementCount)).toBeGreaterThan(0);
}

async function getOverflow(page) {
  return page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    overflow: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    ) - document.documentElement.clientWidth
  }));
}

test.describe("MOMIN authentication gate", () => {
  test("redirects visitors without a session to sign-in", async ({ page }) => {
    await installSupabaseMock(page, {
      authenticated: false,
      verified: false,
      profileComplete: false
    });
    await page.goto("/index.html");
    await expect(page).toHaveURL(/\/login\.html/);
  });

  test("requires a completed profile after email verification", async ({ page }) => {
    await installSupabaseMock(page, {
      authenticated: true,
      verified: true,
      profileComplete: false
    });
    await page.goto("/index.html");
    await expect(page).toHaveURL(/\/profile-complete\.html/);
  });
});

test.describe("MOMIN authenticated app", () => {
  test("renders the app and all four shared tabs navigate to the correct route", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openAuthenticatedApp(page);

    const nav = page.locator("#momin-shared-bottom-nav-v1");
    const routeNames = ["home", "prayers", "quran", "journey"];
    for (const route of routeNames) {
      await nav.locator('button[data-shell-route="' + route + '"]').click();
      await expect.poll(() => page.evaluate(() => window.MominSharedShellV1.currentRoute())).toBe(route);
      await expect(nav.locator('button[data-shell-route="' + route + '"]')).toHaveAttribute("aria-current", "page");
      await expect(page.locator("#view")).not.toBeEmpty();
    }
    expect(pageErrors, "Uncaught browser errors while using the main tabs").toEqual([]);
  });

  test("renders the feature routes without throwing or showing a blank page", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openAuthenticatedApp(page);

    const routes = [
      "home", "prayers", "quran", "qibla", "duas", "giving",
      "tasbeeh", "calendar", "inspiration", "settings",
      "profile", "notifications", "founder", "mosques", "journey"
    ];
    const homeMarkup = await page.locator("#view").innerHTML();

    for (const route of routes) {
      await page.evaluate((target) => window.go(target), route);
      await expect.poll(() => page.evaluate(() => window.MominSharedShellV1.currentRoute())).toBe(route);
      const markup = await page.locator("#view").innerHTML();
      expect(markup.trim().length, route + " route should render content").toBeGreaterThan(0);
      if (route !== "home") {
        expect(markup, route + " must not silently reuse the home page").not.toBe(homeMarkup);
      }
    }
    expect(pageErrors, "Uncaught browser errors while rendering feature routes").toEqual([]);
  });

  test("documents the intentional legacy route aliases", async ({ page }) => {
    await openAuthenticatedApp(page);

    await page.evaluate(() => window.go("aideen"));
    await expect.poll(() => page.evaluate(() => window.MominSharedShellV1.currentRoute())).toBe("quran");
    await expect(page.locator("#toast")).toContainText("Quran search is available from the Quran section");

    await page.evaluate(() => window.go("ummah"));
    await expect.poll(() => page.evaluate(() => window.MominSharedShellV1.currentRoute())).toBe("journey");
    expect(await page.locator("#view").evaluate((element) => element.childElementCount)).toBeGreaterThan(0);
  });

  test("does not create horizontal overflow at phone, tablet and desktop widths", async ({ page }) => {
    await openAuthenticatedApp(page);
    const sizes = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 600, height: 900 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 900 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      const metrics = await getOverflow(page);
      expect(
        metrics.overflow,
        "Home page overflow at " + size.width + "px: " + JSON.stringify(metrics)
      ).toBeLessThanOrEqual(1);
      await expect(page.locator("#momin-shared-bottom-nav-v1")).toBeVisible();
    }
  });

  test("keeps the Inspiration verse list as a readable single column on tablet and desktop", async ({ page }) => {
    await openAuthenticatedApp(page);
    await page.evaluate(() => window.go("inspiration"));
    const frame = page.frameLocator("#momin-inspiration-page-v1-frame");
    await expect(frame.locator(".app .list")).toBeVisible();

    for (const width of [768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await frame.locator(".app .list").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          display: style.display,
          columns: style.gridTemplateColumns,
          direction: style.flexDirection
        };
      });
      expect(layout.display, "Inspiration list display at " + width + "px").toBe("flex");
      expect(layout.direction, "Inspiration list direction at " + width + "px").toBe("column");
    }
  });

  test("keeps the top-level app and feature iframes within the viewport on common layouts", async ({ page }) => {
    await openAuthenticatedApp(page);
    const routes = ["prayers", "mosques", "journey", "inspiration", "founder", "calendar"];

    for (const route of routes) {
      await page.evaluate((target) => window.go(target), route);
      await expect.poll(() => page.evaluate(() => window.MominSharedShellV1.currentRoute())).toBe(route);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150);
      const parent = await getOverflow(page);
      expect(parent.overflow, route + " parent-page overflow").toBeLessThanOrEqual(1);

      const frames = page.frames().filter((frame) => frame !== page.mainFrame() && frame.url().startsWith("http://127.0.0.1:4173/"));
      for (const frame of frames) {
        const childMetrics = await frame.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        })).catch(() => null);
        if (childMetrics) {
          expect(
            childMetrics.overflow,
            route + " iframe overflow in " + frame.url() + ": " + JSON.stringify(childMetrics)
          ).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
