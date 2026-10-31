/* MOMIN Duas Page V1 — iframe host for the supplied design, using DOM construction. */
(function () {
  "use strict";
  if (window.MominDuasPageV1 && window.MominDuasPageV1.initialized) return;

  var FRAME_ID = "momin-duas-page-v1-frame";
  var PAGE_URL = "./duas-page-v1.html?embed=1&v=20261101-duas-v2";
  var DETAIL_IDS = {
    m1: "morning-01",
    m2: "morning-02",
    f1: "morning-03",
    s1: "sleep-01",
    s2: "sleep-02",
    q1: "prayer-01",
    q2: "prayer-02",
    j1: "prayer-03"
  };
  var originalGo = window.go;
  var originalRender = window.render;

  function frameMarkup() {
    var wrap = document.createElement("div");
    wrap.className = "momin-duas-frame-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "520px";
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
    frame.style.height = "1500px";
    frame.style.border = "0";
    frame.style.background = "var(--momin-bg,#0d120f)";
    wrap.appendChild(frame);
    return wrap.outerHTML;
  }

  function renderRoot() {
    try { page = "duas"; } catch (_) {}
    document.body.classList.remove("dua-app-mode");
    document.body.dataset.route = "duas";
    var view = document.getElementById("view");
    if (view) view.innerHTML = frameMarkup();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openDua(shortId) {
    var id = DETAIL_IDS[String(shortId || "")];
    if (!id) {
      if (typeof window.toast === "function") window.toast("This supplication is not linked yet.");
      return;
    }
    try { page = "duas"; } catch (_) {}
    document.body.classList.add("dua-app-mode");
    location.hash = "#/dua-detail/" + encodeURIComponent(id);
  }

  function navigate(target) {
    if (typeof window.go === "function") window.go(String(target || "home"));
  }

  window.MominDuasBridgeV1 = {
    openDua: openDua,
    navigate: navigate,
    renderRoot: renderRoot
  };

  window.duasPage = function () { return frameMarkup(); };
  window.render = function () {
    var rootHash = location.hash === "#/duas" || location.hash === "" || location.hash === "#";
    if (page === "duas" && rootHash) {
      renderRoot();
      return;
    }
    return originalRender.apply(this, arguments);
  };

  window.go = function (target) {
    if (target === "duas") {
      try { page = "duas"; } catch (_) {}
      document.body.classList.remove("dua-app-mode");
      if (location.hash !== "#/duas") location.hash = "#/duas";
      renderRoot();
      return;
    }
    if (location.hash && location.hash.indexOf("#/") === 0) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    document.body.classList.remove("dua-app-mode");
    return originalGo.apply(this, arguments);
  };

  window.addEventListener("hashchange", function () {
    if (location.hash === "#/duas") renderRoot();
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

  window.MominDuasPageV1 = {
    initialized: true,
    bridge: window.MominDuasBridgeV1,
    openDua: openDua
  };
})();
