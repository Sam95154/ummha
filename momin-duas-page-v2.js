/* MOMIN Duas Page V2 — redesigned standalone Duas UI inside the shared MOMIN shell. */
(function () {
  "use strict";
  if (window.MominDuasPageV2 && window.MominDuasPageV2.initialized) return;

  var FRAME_ID = "momin-duas-page-v2-frame";
  var PAGE_URL = "./duas-page-v2.html?embed=1&v=20261104-dua-navigation-layout-v1";
  var previousRender = window.render;
  var previousGo = window.go;

  function isNativeReaderRoute() {
    return /^#\/dua-(?:category|chapter|detail|special)(?:\/|$)/.test(location.hash || "");
  }

  var catalogueReturnRoute = "home";
  var catalogueStack = ["home"];
  function cleanCatalogueRoute(route) {
    route = String(route || "home").replace(/^#/, "");
    if (route === "home" || route === "collections" || route === "saved" || route === "recent" || route === "daily") return route;
    if (/^c-[a-z0-9-]+$/.test(route)) return route;
    return "home";
  }

  function pageMarkup(route, routeStack) {
    var targetRoute = cleanCatalogueRoute(route || catalogueReturnRoute);
    var stackQuery = Array.isArray(routeStack) && routeStack.length
      ? "&routeStack=" + encodeURIComponent(routeStack.slice(-20).join(","))
      : "";
    var wrap = document.createElement("div");
    wrap.className = "momin-duas-page-v2-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "480px";
    wrap.style.margin = "0 auto";
    wrap.style.overflow = "visible";

    var frame = document.createElement("iframe");
    frame.id = FRAME_ID;
    frame.title = "MOMIN Duas";
    frame.src = PAGE_URL + stackQuery + (targetRoute === "home" ? "" : "#" + targetRoute);
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

  function renderRoot(route, routeStack) {
    catalogueReturnRoute = cleanCatalogueRoute(route || "home");
    if (Array.isArray(routeStack) && routeStack.length) {
      catalogueStack = routeStack.map(cleanCatalogueRoute).filter(Boolean).slice(-20);
      if (catalogueStack[catalogueStack.length - 1] !== catalogueReturnRoute) catalogueStack = [catalogueReturnRoute];
    } else {
      catalogueStack = [catalogueReturnRoute];
    }
    try { page = "duas"; } catch (_) {}
    document.body.classList.remove("dua-app-mode");
    document.body.dataset.route = "duas";
    clearNativeDuaHash();
    var view = document.getElementById("view");
    if (!view) return false;
    view.innerHTML = pageMarkup(catalogueReturnRoute, catalogueStack);
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function returnToCatalogue() {
    return renderRoot(catalogueReturnRoute, catalogueStack);
  }

  function navigate(target) {
    target = String(target || "home");
    if (target === "home" && window.MominSharedShellV1 && typeof window.MominSharedShellV1.back === "function") {
      return window.MominSharedShellV1.back();
    }
    if (window.MominSharedShellV1 && typeof window.MominSharedShellV1.navigate === "function") {
      window.MominSharedShellV1.navigate(target);
      return true;
    }
    if (typeof window.go === "function") {
      window.go(target);
      return true;
    }
    return false;
  }

  function unique(list) {
    return list.filter(function(value,index,array){return value && array.indexOf(value)===index;});
  }

  function syncState(saved, seen, mergeExisting) {
    saved = Array.isArray(saved) ? saved.map(String) : [];
    seen = Array.isArray(seen) ? seen.map(String) : [];
    if (mergeExisting) {
      var existing = null;
      try {
        if (window.MominDuasNativeV1 && typeof window.MominDuasNativeV1.getState === "function") {
          existing = window.MominDuasNativeV1.getState();
        }
      } catch (_) {}
      if (!existing) {
        try {
          var nativeSaved = JSON.parse(localStorage.getItem("noor-dua-prototype-bookmarks") || "[]");
          var nativeSeen = JSON.parse(localStorage.getItem("noor-dua-prototype-recents") || "[]");
          existing = {
            saved: Array.isArray(nativeSaved) ? nativeSaved.map(function(id){return String(id).replace(/^d:/,"");}) : [],
            seen: Array.isArray(nativeSeen) ? nativeSeen.slice().reverse() : []
          };
        } catch (_) { existing = {saved:[],seen:[]}; }
      }
      saved = unique((existing.saved || []).concat(saved));
      seen = unique((existing.seen || []).concat(seen)).slice(-30);
    }
    var state = {saved:saved,seen:seen};
    try {
      localStorage.setItem("duas-saved", JSON.stringify(state.saved));
      localStorage.setItem("duas-seen", JSON.stringify(state.seen));
    } catch (_) {}
    if (window.MominDuasNativeV1 && typeof window.MominDuasNativeV1.syncState === "function") {
      var synced = window.MominDuasNativeV1.syncState(state.saved, state.seen);
      if (synced && Array.isArray(synced.saved) && Array.isArray(synced.seen)) state = synced;
    }
    try {
      localStorage.setItem("duas-saved", JSON.stringify(state.saved));
      localStorage.setItem("duas-seen", JSON.stringify(state.seen));
    } catch (_) {}
    return state;
  }

  function resetParentScrollTop(){
    function reset(){
      try{
        window.scrollTo(0,0);
        var root=document.scrollingElement||document.documentElement;
        if(root)root.scrollTop=0;
        document.documentElement.scrollTop=0;
        if(document.body)document.body.scrollTop=0;
        var view=document.getElementById("view");
        if(view)view.scrollTop=0;
      }catch(_){}
    }
    reset();
    var frames=0;
    function afterLayout(){
      reset();
      frames++;
      if(frames<3)window.requestAnimationFrame(afterLayout);
    }
    window.requestAnimationFrame(afterLayout);
    window.setTimeout(reset,80);
    window.setTimeout(reset,180);
  }

  function openDua(id, returnRoute) {
    catalogueReturnRoute = cleanCatalogueRoute(returnRoute || catalogueReturnRoute);
    var index = catalogueStack.lastIndexOf(catalogueReturnRoute);
    if (index >= 0) catalogueStack = catalogueStack.slice(0,index+1);
    else catalogueStack = catalogueStack.concat([catalogueReturnRoute]).slice(-20);
    var native = window.MominDuasNativeV1;
    if (native && typeof native.openDua === "function" && native.openDua(id)) {
      resetParentScrollTop();
      return true;
    }
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
      renderRoot(catalogueReturnRoute, catalogueStack);
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
    if (data.type === "momin-duas-height-v1") {
      if (Number.isFinite(Number(data.height))) {
        frame.style.height = Math.max(700, Math.min(12000, Math.ceil(Number(data.height)))) + "px";
      }
      if (Array.isArray(data.routeStack)) {
        catalogueStack = data.routeStack.map(cleanCatalogueRoute).filter(Boolean).slice(-20);
      }
      if (data.route) catalogueReturnRoute = cleanCatalogueRoute(data.route);
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
    openDua: openDua,
    returnToCatalogue: returnToCatalogue,
    getReturnRoute: function () { return catalogueReturnRoute; }
  };
})();
