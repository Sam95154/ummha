/* MOMIN Duas Page V2 — redesigned standalone Duas UI inside the shared MOMIN shell. */
(function () {
  "use strict";
  if (window.MominDuasPageV2 && window.MominDuasPageV2.initialized) return;

  var FRAME_ID = "momin-duas-page-v2-frame";
  var PAGE_URL = "./duas-page-v2.html?embed=1&v=20261101-duas-redesign-v2";
  var previousRender = window.render;
  var previousGo = window.go;

  function isNativeReaderRoute() {
    return /^#\/dua-(?:category|chapter|detail|special)(?:\/|$)/.test(location.hash || "");
  }

  function pageMarkup() {
    var wrap = document.createElement("div");
    wrap.className = "momin-duas-page-v2-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "480px";
    wrap.style.margin = "0 auto";
    wrap.style.overflow = "visible";

    var frame = document.createElement("iframe");
    frame.id = FRAME_ID;
    frame.title = "MOMIN Duas";
    frame.src = PAGE_URL;
    frame.loading = "eager";
    frame.scrolling = "no";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.style.display = "block";
    frame.style.width = "100%";
    frame.style.height = Math.max(1100, Math.floor((window.innerHeight || 800) * 1.35)) + "px";
    frame.style.border = "0";
    frame.style.background = "#0c0a07";
    frame.style.overflow = "hidden";
    wrap.appendChild(frame);
    return wrap.outerHTML;
  }

  function clearNativeDuaHash() {
    if (location.hash && location.hash.indexOf("#/") === 0) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function renderRoot() {
    try { page = "duas"; } catch (_) {}
    document.body.classList.remove("dua-app-mode");
    document.body.dataset.route = "duas";
    clearNativeDuaHash();
    var view = document.getElementById("view");
    if (!view) return false;
    view.innerHTML = pageMarkup();
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function navigate(target) {
    target = String(target || "home");
    if (typeof window.go === "function") {
      window.go(target);
      return true;
    }
    return false;
  }

  function syncState(saved, seen) {
    saved = Array.isArray(saved) ? saved.map(String) : [];
    seen = Array.isArray(seen) ? seen.map(String) : [];
    try {
      localStorage.setItem("duas-saved", JSON.stringify(saved));
      localStorage.setItem("duas-seen", JSON.stringify(seen));
      localStorage.setItem("noor-dua-prototype-bookmarks", JSON.stringify(
        saved.map(function (id) { return "d:" + id; })
      ));
      localStorage.setItem("noor-dua-prototype-recents", JSON.stringify(seen));
    } catch (_) {}
    if (window.MominDuasNativeV1 && typeof window.MominDuasNativeV1.syncState === "function") {
      window.MominDuasNativeV1.syncState(saved, seen);
    }
  }

  function openDua(id) {
    var native = window.MominDuasNativeV1;
    if (native && typeof native.openDua === "function" && native.openDua(id)) return true;
    if (typeof window.toast === "function") window.toast("This supplication is not available right now.");
    return false;
  }

  window.MominDuasBridgeV1 = {
    openDua: openDua,
    navigate: navigate,
    syncState: syncState,
    renderRoot: renderRoot
  };
  window.duasPage = pageMarkup;

  window.render = function () {
    if (page === "duas" && !isNativeReaderRoute()) {
      renderRoot();
      return;
    }
    return previousRender.apply(this, arguments);
  };

  window.go = function (target) {
    if (String(target) === "duas") {
      renderRoot();
      return true;
    }
    if (document.body.classList.contains("dua-app-mode") || isNativeReaderRoute()) {
      document.body.classList.remove("dua-app-mode");
      clearNativeDuaHash();
    }
    return previousGo.apply(this, arguments);
  };

  window.addEventListener("hashchange", function () {
    if (location.hash === "#/duas" && page === "duas") renderRoot();
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin) return;
    var frame = document.getElementById(FRAME_ID);
    if (!frame || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.type === "momin-duas-height-v1" && Number.isFinite(Number(data.height))) {
      frame.style.height = Math.max(700, Math.min(12000, Math.ceil(Number(data.height)))) + "px";
    }
  });

  window.addEventListener("resize", function () {
    var frame = document.getElementById(FRAME_ID);
    if (frame && !frame.dataset.measured) {
      frame.style.height = Math.max(1100, Math.floor((window.innerHeight || 800) * 1.35)) + "px";
    }
  });

  window.MominDuasPageV2 = {
    initialized: true,
    bridge: window.MominDuasBridgeV1,
    render: pageMarkup,
    openDua: openDua
  };
})();
