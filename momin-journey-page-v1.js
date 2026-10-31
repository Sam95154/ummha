/* MOMIN Journey Page V1 — live private activity dashboard in the shared shell. */
(function () {
  "use strict";
  if (window.MominJourneyPageV1 && window.MominJourneyPageV1.initialized) return;

  var FRAME_ID = "momin-journey-page-v1-frame";
  var PAGE_URL = "./journey-page-v1.html?embed=1&v=20261101-journey-v1";

  function localDayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function savePrayerHistorySnapshot() {
    try {
      var day = localDayKey();
      var map = {};
      try {
        if (typeof done !== "undefined" && done && typeof done === "object") map = done;
        else map = JSON.parse(localStorage.getItem("noor-prayers") || "{}") || {};
      } catch (_) {
        map = JSON.parse(localStorage.getItem("noor-prayers") || "{}") || {};
      }

      var names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      var completed = names.map(function (name, index) {
        return map[name] || map[index] || map[String(index)] ? index : -1;
      }).filter(function (index) { return index >= 0; });

      var history = {};
      try { history = JSON.parse(localStorage.getItem("noor-prayer-history-v1") || "{}") || {}; }
      catch (_) { history = {}; }
      if (!history || typeof history !== "object" || Array.isArray(history)) history = {};
      history[day] = completed;

      var keys = Object.keys(history).sort();
      while (keys.length > 180) delete history[keys.shift()];
      localStorage.setItem("noor-prayer-history-v1", JSON.stringify(history));
    } catch (_) {}
  }

  function getData() {
    savePrayerHistorySnapshot();
    var names = [];
    try {
      if (typeof chapters !== "undefined" && Array.isArray(chapters)) names = chapters.slice(0, 114);
      else if (typeof surahs !== "undefined" && Array.isArray(surahs)) {
        names = surahs.map(function (name) { return { englishName: String(name) }; });
      }
    } catch (_) {}
    return { surahs: names, date: localDayKey() };
  }

  function navigate(target) {
    target = String(target || "home");
    try {
      if (window.MominSharedShellV1 && typeof window.MominSharedShellV1.navigate === "function") {
        window.MominSharedShellV1.navigate(target);
        return;
      }
    } catch (_) {}
    try { if (typeof window.go === "function") window.go(target); } catch (_) {}
  }

  function pageMarkup() {
    var wrap = document.createElement("div");
    wrap.className = "momin-journey-frame-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "480px";
    wrap.style.margin = "0 auto";
    wrap.style.overflow = "visible";

    var frame = document.createElement("iframe");
    frame.id = FRAME_ID;
    frame.title = "MOMIN My Journey";
    frame.src = PAGE_URL;
    frame.loading = "eager";
    frame.scrolling = "no";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.style.display = "block";
    frame.style.width = "100%";
    frame.style.height = "2200px";
    frame.style.border = "0";
    frame.style.background = "#0c0a07";
    wrap.appendChild(frame);
    return wrap.outerHTML;
  }

  try {
    var prayerBridge = window.MominPrayerBridgeV1;
    if (prayerBridge && typeof prayerBridge.setCompletions === "function" &&
        !prayerBridge.setCompletions.__mominJourneyWrapped) {
      var baseSetCompletions = prayerBridge.setCompletions;
      var wrappedSetCompletions = function () {
        var result = baseSetCompletions.apply(this, arguments);
        savePrayerHistorySnapshot();
        return result;
      };
      wrappedSetCompletions.__mominJourneyWrapped = true;
      prayerBridge.setCompletions = wrappedSetCompletions;
    }
  } catch (_) {}

  window.addEventListener("storage", function (event) {
    if (event.key === "noor-prayers" || event.key === "noor-prayer-date") {
      savePrayerHistorySnapshot();
    }
  });

  var oldTogglePrayer = window.togglePrayer;
  if (typeof oldTogglePrayer === "function") {
    window.togglePrayer = function () {
      var result = oldTogglePrayer.apply(this, arguments);
      savePrayerHistorySnapshot();
      return result;
    };
  }
  savePrayerHistorySnapshot();

  window.MominJourneyBridgeV1 = {
    getData: getData,
    navigate: navigate,
    savePrayerHistorySnapshot: savePrayerHistorySnapshot
  };
  window.journeyPageV1 = function () { return pageMarkup(); };

  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin) return;
    var frame = document.getElementById(FRAME_ID);
    if (!frame || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.type === "momin-journey-height-v1" && Number.isFinite(Number(data.height))) {
      frame.style.height = Math.max(1000, Math.min(12000, Math.ceil(Number(data.height)))) + "px";
    }
  });

  window.MominJourneyPageV1 = {
    initialized: true,
    bridge: window.MominJourneyBridgeV1,
    render: window.journeyPageV1
  };
})();
