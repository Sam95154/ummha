/* MOMIN Journey Route Fix — capture Journey selections before legacy handlers. */
(function () {
  "use strict";
  if (window.MominJourneyRouteFixV1 && window.MominJourneyRouteFixV1.initialized) return;

  function mountJourney() {
    if (typeof window.journeyPageV1 !== "function") {
      console.error("MOMIN Journey page renderer is not loaded.");
      return false;
    }
    try { page = "journey"; } catch (_) {}
    var view = document.getElementById("view");
    if (!view) return false;

    view.innerHTML = window.journeyPageV1();
    try {
      if (window.MominSharedShellV1 && typeof window.MominSharedShellV1.sync === "function") {
        window.MominSharedShellV1.sync();
      }
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: "auto" });
    document.body.setAttribute("data-momin-active-page", "journey-v1");
    return true;
  }

  document.addEventListener("click", function (event) {
    var node = event.target && event.target.closest
      ? event.target.closest("button,a,[role='button']")
      : null;
    if (!node) return;

    var route = node.getAttribute("data-shell-route") || "";
    var inline = node.getAttribute("onclick") || "";
    var label = String(node.textContent || "").trim().toLowerCase();
    var inAppNav = !!(node.closest("#momin-shared-bottom-nav-v1") ||
      node.closest("#mobileNav") || node.closest("#sideNav"));
    var isJourney = route === "journey" ||
      /go\s*\(\s*['"]journey['"]\s*\)/i.test(inline) ||
      (label === "journey" && inAppNav);
    if (!isJourney) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    mountJourney();
  }, true);

  var previousGo = window.go;
  window.go = function (target) {
    if (String(target) === "journey") return mountJourney();
    if (typeof previousGo === "function") return previousGo.apply(this, arguments);
  };

  window.MominJourneyRouteFixV1 = {
    initialized: true,
    mount: mountJourney
  };
  if (typeof page !== "undefined" && page === "journey") mountJourney();
})();
