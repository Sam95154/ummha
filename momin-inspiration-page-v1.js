/* MOMIN Inspiration Page V1 — supplied Inspiration page in the shared app shell. */
(function () {
  "use strict";
  if (window.MominInspirationPageV1 && window.MominInspirationPageV1.initialized) return;

  var FRAME_ID = "momin-inspiration-page-v1-frame";
  var PAGE_URL = "./inspiration-page-v1.html?embed=1&v=20261103-device-responsive-v1";

  function frameHeight() {
    return Math.max(360, Math.min(1200, window.innerHeight - 190));
  }

  function pageMarkup() {
    var wrap = document.createElement("div");
    wrap.className = "momin-inspiration-frame-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "480px";
    wrap.style.margin = "0 auto";
    wrap.style.overflow = "visible";

    var frame = document.createElement("iframe");
    frame.id = FRAME_ID;
    frame.title = "MOMIN Inspiration";
    frame.src = PAGE_URL;
    frame.loading = "eager";
    frame.scrolling = "yes";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.style.display = "block";
    frame.style.width = "100%";
    frame.style.height = frameHeight() + "px";
    frame.style.border = "0";
    frame.style.background = "#0f0d0a";
    frame.style.overflow = "auto";
    wrap.appendChild(frame);
    return wrap.outerHTML;
  }

  function navigate(target) {
    target = String(target || "home");
    if (typeof window.go === "function") {
      window.go(target);
      return true;
    }
    return false;
  }

  window.MominInspirationBridgeV1 = { navigate: navigate };
  window.inspirationPage = function () { return pageMarkup(); };

  function resizeFrame() {
    var frame = document.getElementById(FRAME_ID);
    if (frame) frame.style.height = frameHeight() + "px";
  }
  window.addEventListener("resize", resizeFrame);

  window.MominInspirationPageV1 = {
    initialized: true,
    render: window.inspirationPage,
    bridge: window.MominInspirationBridgeV1
  };
})();
