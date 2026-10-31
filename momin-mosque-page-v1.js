/* MOMIN Mosques Page V1 — supplied page inside the shared app shell. */
(function () {
  "use strict";
  if (window.MominMosquePageV1 && window.MominMosquePageV1.initialized) return;

  var FRAME_ID = "momin-mosques-page-v1-frame";
  var PAGE_URL = "./mosques-page-v1.html?embed=1&v=20261031-mosques-v1";

  function appState() {
    var latitude = null, longitude = null, city = "", country = "", label = "";
    try {
      if (typeof API_STORE !== "undefined") {
        latitude = API_STORE.latitude == null ? null : Number(API_STORE.latitude);
        longitude = API_STORE.longitude == null ? null : Number(API_STORE.longitude);
        city = String(API_STORE.city || "");
        country = String(API_STORE.country || "");
      }
    } catch (_) {}
    try {
      if (typeof currentLocationLabelV5 === "function") label = currentLocationLabelV5();
    } catch (_) {}
    if (!label) label = [city, country].filter(Boolean).join(", ") || "Choose your location";
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      latitude = null; longitude = null;
    }
    return { latitude: latitude, longitude: longitude, city: city, country: country, label: label };
  }

  async function updateCurrentLocation(latitude, longitude, accuracy) {
    latitude = Number(latitude);
    longitude = Number(longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error("The device returned invalid location coordinates.");
    }
    if (typeof API_STORE === "undefined") throw new Error("MOMIN location settings are unavailable.");

    API_STORE.latitude = latitude;
    API_STORE.longitude = longitude;
    API_STORE.city = "Current location";
    API_STORE.country = "";
    API_STORE.methodMode = "auto";

    var place = null;
    if (typeof reverseGeocodeLocationV5 === "function") {
      try { place = await reverseGeocodeLocationV5(latitude, longitude); } catch (_) {}
    }
    if (place && place.city && place.country) {
      API_STORE.city = place.city;
      API_STORE.country = place.country;
    }
    if (typeof applyAutoMethodV6 === "function") applyAutoMethodV6();
    if (typeof persistLocationV5 === "function") persistLocationV5();
    if (typeof syncLocationLabels === "function") syncLocationLabels();
    if (typeof loadPrayerData === "function") {
      try { await loadPrayerData(); } catch (_) {}
    }
    return appState();
  }

  function openPrayerSettings() {
    if (typeof window.go === "function") window.go("prayers");
  }

  window.MominMosqueBridgeV1 = {
    getState: appState,
    updateCurrentLocation: updateCurrentLocation,
    openPrayerSettings: openPrayerSettings
  };

  window.mosquesPage = function () {
    return '<div class="momin-mosque-page-frame-wrap" style="width:100%;max-width:520px;margin:0 auto;overflow:visible">' +
      '<iframe id="' + FRAME_ID + '" title="MOMIN Mosques near me" src="' + PAGE_URL + '" ' +
      'allow="geolocation" loading="eager" scrolling="no" ' +
      'style="display:block;width:100%;height:1200px;border:0;background:#0c0a07" ' +
      'referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
  };

  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin) return;
    var frame = document.getElementById(FRAME_ID);
    if (!frame || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.type === "momin-mosques-height-v1" && Number.isFinite(Number(data.height))) {
      frame.style.height = Math.max(650, Math.min(10000, Math.ceil(Number(data.height)))) + "px";
    }
  });

  window.MominMosquePageV1 = { initialized: true, render: window.mosquesPage, bridge: window.MominMosqueBridgeV1 };
})();
