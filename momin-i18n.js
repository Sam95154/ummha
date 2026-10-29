/* MOMIN app-wide interface localization.
   Uses the saved language preference, an online translation endpoint, local cache,
   live-render observation, and RTL support. Quran/Dua sacred text and user-entered content are preserved. */
(function () {
  "use strict";
  var STORAGE_KEY = "noor-language";
  var CACHE_KEY = "momin-i18n-cache-v1";
  var RTL = { ar: true, ks: true, sd: true, ur: true };
  var SUPPORTED = [
    "en","as","bn","brx","doi","gu","hi","kn","ks","kok","mai","ml","mni",
    "mr","ne","or","pa","sa","sat","sd","ta","te","ur","ar"
  ];
  var epoch = 0, queue = [], running = 0, scanTimer = 0, scanPending = false;
  var cache = readCache(), pending = Object.create(null);
  var touchedNodes = new Set(), touchedAttributes = new Set();
  var FALLBACK = {
    hi: { "Home":"होम","Prayers":"नमाज़","Quran":"क़ुरआन","My Journey":"मेरी यात्रा","Qibla":"क़िबला","Duas":"दुआएँ","Mosques":"मस्जिदें","Giving":"दान","Tasbeeh":"तस्बीह","Inspiration":"प्रेरणा","Calendar":"कैलेंडर","Settings":"सेटिंग्स","Language":"भाषा","App language":"ऐप की भाषा","Accessibility":"सुलभता","Standard":"सामान्य","Large":"बड़ा","Extra large":"बहुत बड़ा","Reduce motion":"गतिशीलता कम करें","High contrast":"उच्च कंट्रास्ट","About MOMIN":"MOMIN के बारे में" },
    te: { "Home":"హోమ్","Prayers":"నమాజ్‌లు","Quran":"ఖుర్‌ఆన్","My Journey":"నా ప్రయాణం","Qibla":"ఖిబ్లా","Duas":"దువాలు","Mosques":"మసీదులు","Giving":"దానం","Tasbeeh":"తస్బీహ్","Inspiration":"ప్రేరణ","Calendar":"క్యాలెండర్","Settings":"సెట్టింగ్‌లు","Language":"భాష","App language":"యాప్ భాష","Accessibility":"అందుబాటు సౌలభ్యం","Standard":"సాధారణం","Large":"పెద్దది","Extra large":"చాలా పెద్దది","Reduce motion":"యానిమేషన్ తగ్గించు","High contrast":"అధిక కాంట్రాస్ట్","About MOMIN":"MOMIN గురించి" },
    ta: { "Home":"முகப்பு","Prayers":"தொழுகைகள்","Quran":"குர்ஆன்","My Journey":"எனது பயணம்","Qibla":"கிப்லா","Duas":"துஆக்கள்","Mosques":"மசூதிகள்","Giving":"நன்கொடை","Tasbeeh":"தஸ்பீஹ்","Inspiration":"உத்வேகம்","Calendar":"நாட்காட்டி","Settings":"அமைப்புகள்","Language":"மொழி","App language":"செயலி மொழி","Accessibility":"அணுகல்தன்மை","Standard":"இயல்பானது","Large":"பெரியது","Extra large":"மிகப் பெரியது","Reduce motion":"அசைவுகளைக் குறை","High contrast":"உயர் மாறுபாடு","About MOMIN":"MOMIN பற்றி" },
    ur: { "Home":"ہوم","Prayers":"نمازیں","Quran":"قرآن","My Journey":"میرا سفر","Qibla":"قبلہ","Duas":"دعائیں","Mosques":"مساجد","Giving":"عطیہ","Tasbeeh":"تسبیح","Inspiration":"ترغیب","Calendar":"کیلنڈر","Settings":"ترتیبات","Language":"زبان","App language":"ایپ کی زبان","Accessibility":"رسائی کی سہولت","Standard":"معیاری","Large":"بڑا","Extra large":"بہت بڑا","Reduce motion":"حرکت کم کریں","High contrast":"زیادہ تضاد","About MOMIN":"MOMIN کے بارے میں" },
    bn: { "Home":"হোম","Prayers":"নামাজ","Quran":"কুরআন","My Journey":"আমার যাত্রা","Qibla":"কিবলা","Duas":"দোয়া","Mosques":"মসজিদ","Giving":"দান","Tasbeeh":"তাসবিহ","Inspiration":"অনুপ্রেরণা","Calendar":"ক্যালেন্ডার","Settings":"সেটিংস","Language":"ভাষা","App language":"অ্যাপের ভাষা","Accessibility":"অ্যাক্সেসিবিলিটি","Standard":"স্বাভাবিক","Large":"বড়","Extra large":"আরও বড়","Reduce motion":"অ্যানিমেশন কমান","High contrast":"উচ্চ কনট্রাস্ট","About MOMIN":"MOMIN সম্পর্কে" },
    ml: { "Home":"ഹോം","Prayers":"നമസ്കാരങ്ങൾ","Quran":"ഖുർആൻ","My Journey":"എന്റെ യാത്ര","Qibla":"ഖിബ്‌ല","Duas":"ദുആകൾ","Mosques":"പള്ളികൾ","Giving":"ദാനം","Tasbeeh":"തസ്ബീഹ്","Inspiration":"പ്രചോദനം","Calendar":"കലണ്ടർ","Settings":"ക്രമീകരണങ്ങൾ","Language":"ഭാഷ","App language":"ആപ്പിന്റെ ഭാഷ","Accessibility":"പ്രവേശനക്ഷമത","Standard":"സാധാരണം","Large":"വലുത്","Extra large":"വളരെ വലുത്","Reduce motion":"ചലനങ്ങൾ കുറയ്ക്കുക","High contrast":"ഉയർന്ന കോൺട്രാസ്റ്റ്","About MOMIN":"MOMIN-നെക്കുറിച്ച്" },
    kn: { "Home":"ಮುಖಪುಟ","Prayers":"ನಮಾಜ್‌ಗಳು","Quran":"ಕುರಾನ್","My Journey":"ನನ್ನ ಪ್ರಯಾಣ","Qibla":"ಕಿಬ್ಲಾ","Duas":"ದುಆಗಳು","Mosques":"ಮಸೀದಿಗಳು","Giving":"ದಾನ","Tasbeeh":"ತಸ್ಬೀಹ್","Inspiration":"ಸ್ಫೂರ್ತಿ","Calendar":"ಕ್ಯಾಲೆಂಡರ್","Settings":"ಸೆಟ್ಟಿಂಗ್‌ಗಳು","Language":"ಭಾಷೆ","App language":"ಆ್ಯಪ್ ಭಾಷೆ","Accessibility":"ಪ್ರವೇಶಸಾಧ್ಯತೆ","Standard":"ಸಾಮಾನ್ಯ","Large":"ದೊಡ್ಡದು","Extra large":"ಬಹಳ ದೊಡ್ಡದು","Reduce motion":"ಚಲನೆ ಕಡಿಮೆ ಮಾಡಿ","High contrast":"ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್","About MOMIN":"MOMIN ಬಗ್ಗೆ" },
    mr: { "Home":"मुख्यपृष्ठ","Prayers":"नमाज","Quran":"कुरआन","My Journey":"माझा प्रवास","Qibla":"किब्ला","Duas":"दुआ","Mosques":"मशिदी","Giving":"दान","Tasbeeh":"तसबिह","Inspiration":"प्रेरणा","Calendar":"दिनदर्शिका","Settings":"सेटिंग्ज","Language":"भाषा","App language":"अॅपची भाषा","Accessibility":"प्रवेशयोग्यता","Standard":"सामान्य","Large":"मोठा","Extra large":"अतिमोठा","Reduce motion":"हालचाल कमी करा","High contrast":"उच्च कॉन्ट्रास्ट","About MOMIN":"MOMIN विषयी" },
    gu: { "Home":"હોમ","Prayers":"નમાઝ","Quran":"કુરઆન","My Journey":"મારી સફર","Qibla":"કિબલા","Duas":"દુઆઓ","Mosques":"મસ્જિદો","Giving":"દાન","Tasbeeh":"તસ્બીહ","Inspiration":"પ્રેરણા","Calendar":"કૅલેન્ડર","Settings":"સેટિંગ્સ","Language":"ભાષા","App language":"ઍપની ભાષા","Accessibility":"સુલભતા","Standard":"સામાન્ય","Large":"મોટું","Extra large":"ખૂબ મોટું","Reduce motion":"હલનચલન ઘટાડો","High contrast":"વધુ કોન્ટ્રાસ્ટ","About MOMIN":"MOMIN વિશે" },
    pa: { "Home":"ਮੁੱਖ ਪੰਨਾ","Prayers":"ਨਮਾਜ਼ਾਂ","Quran":"ਕੁਰਆਨ","My Journey":"ਮੇਰਾ ਸਫ਼ਰ","Qibla":"ਕਿਬਲਾ","Duas":"ਦੁਆਵਾਂ","Mosques":"ਮਸਜਿਦਾਂ","Giving":"ਦਾਨ","Tasbeeh":"ਤਸਬੀਹ","Inspiration":"ਪ੍ਰੇਰਣਾ","Calendar":"ਕੈਲੰਡਰ","Settings":"ਸੈਟਿੰਗਾਂ","Language":"ਭਾਸ਼ਾ","App language":"ਐਪ ਦੀ ਭਾਸ਼ਾ","Accessibility":"ਪਹੁੰਚਯੋਗਤਾ","Standard":"ਮਿਆਰੀ","Large":"ਵੱਡਾ","Extra large":"ਬਹੁਤ ਵੱਡਾ","Reduce motion":"ਹਿਲਜੁਲ ਘਟਾਓ","High contrast":"ਉੱਚ ਕੰਟ੍ਰਾਸਟ","About MOMIN":"MOMIN ਬਾਰੇ" }
  };

  function get(key, fallback) { try { var value = localStorage.getItem(key); return value == null ? fallback : value; } catch (_) { return fallback; } }
  function put(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function locale() { var value = get(STORAGE_KEY, "en"); return SUPPORTED.indexOf(value) >= 0 ? value : "en"; }
  function readCache() { try { var value = JSON.parse(get(CACHE_KEY, "{}")); return value && typeof value === "object" ? value : {}; } catch (_) { return {}; } }
  function persistCache() {
    try {
      var keys = Object.keys(cache);
      if (keys.length > 1400) keys.slice(0, keys.length - 1100).forEach(function (key) { delete cache[key]; });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (_) {}
  }
  function escape(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]; }); }
  function shouldSkip(element) {
    if (!element || element.nodeType !== 1) return true;
    if (element.closest("script,style,noscript,svg,code,pre,textarea,input,[contenteditable='true'],[data-momin-i18n-skip='true'],.arabic,.translation,.transliteration,.ayah-arabic,.ayah-transliteration,.ayah-translation,.quran-arabic,.quran-translation,.reader-verse-text,.dua-arabic,.dua-translation,.dua-transliteration,.surah-ar,.surah-arabic,.momin-sc-brand,.momin-topbar-logo,#settingsAppLanguage,.quran-reader .arabic")) return true;
    return false;
  }
  function sourceOf(node) { return node.__mominI18nOriginal !== undefined ? node.__mominI18nOriginal : (node.nodeValue || ""); }
  function padding(source, value) { return (source.match(/^\s*/) || [""])[0] + value.trim() + (source.match(/\s*$/) || [""])[0]; }
  function fallback(source, lang) { return FALLBACK[lang] && FALLBACK[lang][source] || source; }

  function requestTranslation(source, lang) {
    var key = lang + "|" + source;
    if (lang === "en") return Promise.resolve(source);
    if (cache[key]) return Promise.resolve(cache[key]);
    if (pending[key]) return pending[key];
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + encodeURIComponent(lang) + "&dt=t&q=" + encodeURIComponent(source);
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeout = controller ? window.setTimeout(function () { controller.abort(); }, 9000) : 0;
    pending[key] = fetch(url, { method: "GET", mode: "cors", credentials: "omit", cache: "force-cache", signal: controller ? controller.signal : undefined })
      .then(function (response) { if (!response.ok) throw new Error("Translation unavailable"); return response.json(); })
      .then(function (data) {
        var segments = data && Array.isArray(data[0]) ? data[0] : [];
        var translated = segments.map(function (part) { return part && part[0] ? part[0] : ""; }).join("").trim();
        if (!translated) throw new Error("Empty translation");
        cache[key] = translated;
        persistCache();
        return translated;
      })
      .catch(function () { return fallback(source, lang); })
      .finally(function () { if (timeout) window.clearTimeout(timeout); delete pending[key]; });
    return pending[key];
  }

  function enqueueText(node, lang, currentEpoch) {
    if (!node || !node.parentElement || shouldSkip(node.parentElement)) return;
    if (node.__mominI18nOriginal === undefined) node.__mominI18nOriginal = node.nodeValue || "";
    var raw = String(node.__mominI18nOriginal);
    var source = raw.trim();
    if (source.length < 2 || source.length > 420 || !/[A-Za-z]/.test(source) || /^[\d\s.,:;/%()+\-–—]+$/.test(source)) return;
    if (node.__mominI18nLocale === lang && node.nodeValue === node.__mominI18nTranslated) return;
    if (node.__mominI18nPending === lang) return;
    node.__mominI18nPending = lang;
    touchedNodes.add(node);
    queue.push({ node: node, raw: raw, source: source, lang: lang, epoch: currentEpoch });
    pump();
  }

  function enqueueAttribute(element, attribute, lang, currentEpoch) {
    if (shouldSkip(element)) return;
    var keyName = "__mominI18nOriginal_" + attribute;
    var translatedName = "__mominI18nTranslated_" + attribute;
    if (element[keyName] === undefined) element[keyName] = element.getAttribute(attribute) || "";
    var source = String(element[keyName] || "").trim();
    if (source.length < 2 || source.length > 220 || !/[A-Za-z]/.test(source)) return;
    if (element["__mominI18nLocale_" + attribute] === lang && element.getAttribute(attribute) === element[translatedName]) return;
    if (element["__mominI18nPending_" + attribute] === lang) return;
    element["__mominI18nPending_" + attribute] = lang;
    touchedAttributes.add(element);
    queue.push({ element: element, attribute: attribute, source: source, lang: lang, epoch: currentEpoch });
    pump();
  }

  function pump() {
    while (running < 3 && queue.length) {
      (function (job) {
        queue.shift(); running++;
        requestTranslation(job.source, job.lang).then(function (translated) {
          if (job.epoch !== epoch || job.lang !== locale()) return;
          if (job.node) {
            if (!job.node.isConnected) return;
            var translatedValue = padding(job.raw, translated);
            job.node.nodeValue = translatedValue;
            job.node.__mominI18nLocale = job.lang;
            job.node.__mominI18nTranslated = translatedValue;
          } else if (job.element && job.element.isConnected) {
            var target = translated.trim();
            job.element.setAttribute(job.attribute, target);
            job.element["__mominI18nTranslated_" + job.attribute] = target;
            job.element["__mominI18nLocale_" + job.attribute] = job.lang;
          }
        }).catch(function () {}).finally(function () {
          if (job.node && job.node.__mominI18nPending === job.lang) job.node.__mominI18nPending = "";
          if (job.element) job.element["__mominI18nPending_" + job.attribute] = "";
          running--;
          if (queue.length) pump();
        });
      })(queue[0]);
    }
  }

  function restoreEnglish() {
    touchedNodes.forEach(function (node) {
      if (node.isConnected && node.__mominI18nOriginal !== undefined) {
        node.nodeValue = node.__mominI18nOriginal;
        node.__mominI18nLocale = "en";
        node.__mominI18nTranslated = node.nodeValue;
        node.__mominI18nPending = "";
      }
    });
    touchedAttributes.forEach(function (element) {
      if (!element.isConnected) return;
      ["aria-label", "title", "placeholder", "alt"].forEach(function (attribute) {
        var keyName = "__mominI18nOriginal_" + attribute;
        if (element[keyName] !== undefined && element.hasAttribute(attribute)) element.setAttribute(attribute, element[keyName]);
      });
    });
    queue = [];
  }

  function applyDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL[lang] ? "rtl" : "ltr";
    document.documentElement.toggleAttribute("data-momin-rtl", !!RTL[lang]);
  }

  function scan() {
    scanPending = false;
    var lang = locale();
    applyDirection(lang);
    if (lang === "en") { restoreEnglish(); return; }
    var currentEpoch = epoch;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) enqueueText(node, lang, currentEpoch);
    document.body.querySelectorAll("[aria-label],[title],[placeholder],[alt]").forEach(function (element) {
      ["aria-label", "title", "placeholder", "alt"].forEach(function (attribute) {
        if (element.hasAttribute(attribute)) enqueueAttribute(element, attribute, lang, currentEpoch);
      });
    });
  }

  function schedule() {
    if (scanPending) return;
    scanPending = true;
    if (scanTimer) window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(scan, 90);
  }

  window.setMominLanguageV1 = function (lang) {
    if (SUPPORTED.indexOf(lang) < 0) lang = "en";
    put(STORAGE_KEY, lang);
    epoch++;
    queue = [];
    applyDirection(lang);
    if (typeof window.render === "function") {
      try { window.render(); } catch (_) { schedule(); }
    }
    schedule();
  };

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      epoch++; queue = []; applyDirection(locale());
      if (typeof window.render === "function") window.render();
      schedule();
    }
  });

  var styles = document.createElement("style");
  styles.id = "momin-i18n-rtl-style";
  styles.textContent =
    'html[dir="rtl"] .sidebar{border-right:0;border-left:1px solid var(--line)}' +
    'html[dir="rtl"] .nav button{text-align:right;direction:rtl}' +
    'html[dir="rtl"] .setting,html[dir="rtl"] .momin-sc-row,html[dir="rtl"] .momin-sc-copy{text-align:right;direction:rtl}' +
    'html[dir="rtl"] .momin-sc-control{direction:rtl}' +
    'html[data-momin-rtl] .quran-reader,html[data-momin-rtl] .arabic{direction:rtl}' +
    'html[dir="rtl"] .top,html[dir="rtl"] .page-title,html[dir="rtl"] .sectionhead{direction:rtl}' +
    'html[dir="rtl"] .momin-sc-group>summary{direction:rtl}';
  document.head.appendChild(styles);

  var observer = new MutationObserver(function (mutations) {
    if (mutations.some(function (m) { return m.type === "childList" && (m.addedNodes.length || m.removedNodes.length); })) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  var previousRender = window.render;
  if (typeof previousRender === "function") {
    window.render = function () {
      var result = previousRender.apply(this, arguments);
      applyDirection(locale());
      schedule();
      return result;
    };
  }
  applyDirection(locale());
  window.setTimeout(schedule, 0);
})();