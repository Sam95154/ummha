/* MOMIN Prayer Page V1 — embeds the supplied prayer design inside the shared app shell. */
(function () {
  "use strict";
  if (window.MominPrayerPageV1 && window.MominPrayerPageV1.initialized) return;

  var PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  var FRAME_ID = "momin-prayer-page-v1-frame";

  function todayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function currentData() {
    try {
      return typeof livePrayer !== "undefined" && livePrayer && livePrayer.timings ? livePrayer : null;
    } catch (_) {
      return null;
    }
  }

  function appState() {
    var data = currentData();
    return {
      timings: data ? data.timings : null,
      date: data && data.date ? data.date : null,
      city: typeof API_STORE !== "undefined" ? (API_STORE.city || "") : "",
      country: typeof API_STORE !== "undefined" ? (API_STORE.country || "") : "",
      method: typeof API_STORE !== "undefined" ? String(API_STORE.method || "3") : "3",
      methodMode: typeof API_STORE !== "undefined" ? (API_STORE.methodMode || "auto") : "auto"
    };
  }

  function currentMethodAndSchool() {
    var method = typeof API_STORE !== "undefined" ? String(API_STORE.method || "3") : "3";
    var school = "0";
    try { school = localStorage.getItem("noor-asr-method") === "hanafi" ? "1" : "0"; } catch (_) {}
    return { method: method, school: school };
  }

  function formatApiDate(date) {
    return String(date.getDate()).padStart(2, "0") + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" + date.getFullYear();
  }

  async function fetchPrayerDataForDate(date) {
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    if (todayKey(target) === todayKey(new Date())) return currentData();

    var hasCoords = typeof API_STORE !== "undefined" &&
      API_STORE.latitude !== null && API_STORE.latitude !== undefined &&
      API_STORE.longitude !== null && API_STORE.longitude !== undefined &&
      Number.isFinite(Number(API_STORE.latitude)) && Number.isFinite(Number(API_STORE.longitude));
    var city = typeof API_STORE !== "undefined" ? String(API_STORE.city || "").trim() : "";
    var country = typeof API_STORE !== "undefined" ? String(API_STORE.country || "").trim() : "";
    if (!hasCoords && (!city || !country)) return null;

    var method = currentMethodAndSchool();
    var datePart = formatApiDate(target);
    var url = hasCoords
      ? "https://api.aladhan.com/v1/timings/" + datePart +
        "?latitude=" + encodeURIComponent(API_STORE.latitude) +
        "&longitude=" + encodeURIComponent(API_STORE.longitude) +
        "&method=" + encodeURIComponent(method.method) +
        "&school=" + encodeURIComponent(method.school)
      : "https://api.aladhan.com/v1/timingsByCity/" + datePart +
        "?city=" + encodeURIComponent(city) +
        "&country=" + encodeURIComponent(country) +
        "&method=" + encodeURIComponent(method.method) +
        "&school=" + encodeURIComponent(method.school);

    var response = typeof getJSON === "function"
      ? await getJSON(url)
      : await (await fetch(url)).json();
    if (!response || !response.data || !response.data.timings) {
      throw new Error("Prayer timings were not returned for this date.");
    }
    return response.data;
  }

  async function updateLocation(city, country, method) {
    city = String(city || "").trim();
    country = String(country || "").trim();
    if (!city || !country) throw new Error("Enter both city and country.");

    API_STORE.city = city;
    API_STORE.country = country;
    API_STORE.latitude = null;
    API_STORE.longitude = null;
    API_STORE.methodMode = method === "auto" ? "auto" : "manual";

    try {
      localStorage.removeItem("noor-latitude");
      localStorage.removeItem("noor-longitude");
      localStorage.setItem("noor-method-mode", API_STORE.methodMode);
      localStorage.setItem("noor-city", city);
      localStorage.setItem("noor-country", country);
    } catch (_) {}

    if (API_STORE.methodMode === "auto") {
      if (typeof applyAutoMethodV6 === "function") applyAutoMethodV6();
      else API_STORE.method = country.toLowerCase() === "india" ? "1" : "3";
    } else {
      API_STORE.method = String(method);
      try { localStorage.setItem("noor-method", API_STORE.method); } catch (_) {}
    }

    if (typeof persistLocationV5 === "function") persistLocationV5();
    if (typeof syncLocationLabels === "function") syncLocationLabels();
    if (typeof loadPrayerData === "function") await loadPrayerData();
    return appState();
  }

  function requestLocation() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error("This browser does not support GPS location."));
        return;
      }
      if (!window.isSecureContext && location.hostname !== "localhost") {
        reject(new Error("GPS location requires a secure HTTPS connection."));
        return;
      }

      navigator.geolocation.getCurrentPosition(async function (position) {
        try {
          var lat = Number(position.coords.latitude);
          var lon = Number(position.coords.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new Error("The device returned invalid coordinates.");
          }

          API_STORE.latitude = lat;
          API_STORE.longitude = lon;
          API_STORE.city = "Current location";
          API_STORE.country = "";
          API_STORE.methodMode = "auto";

          if (typeof reverseGeocodeLocationV5 === "function") {
            try {
              var place = await reverseGeocodeLocationV5(lat, lon);
              if (place && place.city && place.country) {
                API_STORE.city = place.city;
                API_STORE.country = place.country;
              }
            } catch (_) {}
          }
          if (typeof applyAutoMethodV6 === "function") applyAutoMethodV6();
          if (typeof persistLocationV5 === "function") persistLocationV5();
          if (typeof syncLocationLabels === "function") syncLocationLabels();
          if (typeof loadPrayerData === "function") await loadPrayerData();
          resolve(appState());
        } catch (error) {
          reject(error);
        }
      }, function (error) {
        reject(error || new Error("Location permission was not granted."));
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    });
  }

  function getCompletions() {
    try {
      var recordedDate = localStorage.getItem("noor-prayer-date");
      if (recordedDate && recordedDate !== todayKey(new Date())) return [];
      var map = JSON.parse(localStorage.getItem("noor-prayers") || "{}") || {};
      return PRAYERS.map(function (name, index) { return map[name] ? index : -1; }).filter(function (index) { return index >= 0; });
    } catch (_) {
      return [];
    }
  }

  function setCompletions(indices) {
    var map = {};
    (Array.isArray(indices) ? indices : []).forEach(function (index) {
      var name = PRAYERS[Number(index)];
      if (name) map[name] = true;
    });
    try {
      localStorage.setItem("noor-prayers", JSON.stringify(map));
      localStorage.setItem("noor-prayer-date", todayKey(new Date()));
    } catch (_) {}
    try {
      if (typeof done !== "undefined") done = map;
    } catch (_) {}
    return map;
  }

  window.MominPrayerBridgeV1 = {
    getState: appState,
    getPrayerDataForDate: fetchPrayerDataForDate,
    updateLocation: updateLocation,
    requestLocation: requestLocation,
    getCompletions: getCompletions,
    setCompletions: setCompletions
  };

  window.prayersPage = function () {
    return '<div class="momin-prayer-page-frame-wrap" style="width:100%;max-width:520px;margin:0 auto;overflow:visible">' +
      '<iframe id="' + FRAME_ID + '" title="MOMIN Prayer Times" src="./prayers-page-v1.html?embed=1&amp;v=20261031-1" ' +
      'allow="geolocation" loading="eager" scrolling="no" ' +
      'style="display:block;width:100%;height:1100px;border:0;background:#0c0a07" ' +
      'referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
  };

  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin) return;
    var frame = document.getElementById(FRAME_ID);
    if (!frame || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.type === "momin-prayers-height-v1" && Number.isFinite(Number(data.height))) {
      frame.style.height = Math.max(700, Math.min(10000, Math.ceil(Number(data.height)))) + "px";
    }
  });

  window.MominPrayerPageV1 = { initialized: true, bridge: window.MominPrayerBridgeV1 };
})();
