/* Noor app-wide language and accessibility layer.
   Locale selection is saved locally. UI strings are translated online and cached in this browser.
   Quran Arabic, selected Quran translations, transliteration, and private reflection text are preserved. */
(function () {
  'use strict';

  var LANGUAGES = [
    { code: 'as', native: 'অসমীয়া', english: 'Assamese' },
    { code: 'bn', native: 'বাংলা', english: 'Bengali' },
    { code: 'brx', native: 'बड़ो', english: 'Bodo' },
    { code: 'doi', native: 'डोगरी', english: 'Dogri' },
    { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
    { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
    { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
    { code: 'ks', native: 'کٲشُر', english: 'Kashmiri' },
    { code: 'gom', native: 'कोंकणी', english: 'Konkani' },
    { code: 'mai', native: 'मैथिली', english: 'Maithili' },
    { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
    { code: 'mni-Mtei', native: 'মৈতৈলোন্', english: 'Manipuri (Meitei)' },
    { code: 'mr', native: 'मराठी', english: 'Marathi' },
    { code: 'ne', native: 'नेपाली', english: 'Nepali' },
    { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia' },
    { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
    { code: 'sa', native: 'संस्कृतम्', english: 'Sanskrit' },
    { code: 'sat', native: 'ᱥᱟᱱᱛᱟᱲᱤ', english: 'Santali' },
    { code: 'sd', native: 'سنڌي', english: 'Sindhi' },
    { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
    { code: 'te', native: 'తెలుగు', english: 'Telugu' },
    { code: 'ur', native: 'اردو', english: 'Urdu' },
    { code: 'en', native: 'English', english: 'English' },
    { code: 'ar', native: 'العربية', english: 'Arabic' }
  ];

  var RTL_LANGUAGES = { ar: true, ks: true, sd: true, ur: true };
  var STORAGE_LANGUAGE = 'noor-app-language';
  var STORAGE_CACHE = 'noor-i18n-cache-v1';
  var STORAGE_ACCESSIBILITY = 'noor-accessibility-v1';
  var activeLanguage = 'en';
  var languageEpoch = 0;
  var translationQueue = [];
  var activeRequests = 0;
  var queuedRootsTimer = null;
  var touchedTextNodes = new Set();
  var touchedAttributeElements = new Set();
  var translationCache = readCache();
  var failuresThisPass = 0;
  var translatedThisPass = 0;
  var scanScheduled = false;

  /* A small offline fallback for core navigation and settings labels. Other UI text is
     translated on demand and cached, so returning to a screen does not retranslate it. */
  var FALLBACK = {
    hi: {
      'Home':'होम','Prayers':'नमाज़','Quran':'क़ुरआन','My Journey':'मेरी यात्रा','Qibla':'क़िबला',
      'Duas':'दुआएँ','Mosques':'मस्जिदें','Giving':'दान','Tasbeeh':'तस्बीह','Inspiration':'प्रेरणा',
      'Calendar':'कैलेंडर','Settings':'सेटिंग्स','Profile':'प्रोफ़ाइल','Notifications':'सूचनाएँ',
      'Language':'भाषा','App language':'ऐप की भाषा','App display language':'ऐप की भाषा',
      'Accessibility':'सुलभता','Text size':'पाठ का आकार','Standard':'सामान्य','Large':'बड़ा',
      'Extra large':'बहुत बड़ा','High contrast':'उच्च कंट्रास्ट','Reduce motion':'गतिशीलता कम करें',
      'About Noor':'नूर के बारे में','Prayer settings':'नमाज़ सेटिंग्स','Location':'स्थान','Appearance':'रूप'
    },
    te: {
      'Home':'హోమ్','Prayers':'నమాజ్‌లు','Quran':'ఖుర్‌ఆన్','My Journey':'నా ప్రయాణం','Qibla':'ఖిబ్లా',
      'Duas':'దువాలు','Mosques':'మసీదులు','Giving':'దానం','Tasbeeh':'తస్బీహ్','Inspiration':'ప్రేరణ',
      'Calendar':'క్యాలెండర్','Settings':'సెట్టింగ్‌లు','Profile':'ప్రొఫైల్','Notifications':'నోటిఫికేషన్‌లు',
      'Language':'భాష','App language':'యాప్ భాష','App display language':'యాప్ భాష',
      'Accessibility':'అందుబాటు సౌలభ్యం','Text size':'వచన పరిమాణం','Standard':'సాధారణం','Large':'పెద్దది',
      'Extra large':'చాలా పెద్దది','High contrast':'అధిక కాంట్రాస్ట్','Reduce motion':'యానిమేషన్ తగ్గించు',
      'About Noor':'నూర్ గురించి','Prayer settings':'నమాజ్ సెట్టింగ్‌లు','Location':'స్థానం','Appearance':'రూపం'
    },
    ta: {
      'Home':'முகப்பு','Prayers':'தொழுகைகள்','Quran':'குர்ஆன்','My Journey':'எனது பயணம்','Qibla':'கிப்லா',
      'Duas':'துஆக்கள்','Mosques':'மசூதிகள்','Giving':'நன்கொடை','Tasbeeh':'தஸ்பீஹ்','Inspiration':'உத்வேகம்',
      'Calendar':'நாட்காட்டி','Settings':'அமைப்புகள்','Profile':'சுயவிவரம்','Notifications':'அறிவிப்புகள்',
      'Language':'மொழி','App language':'செயலி மொழி','App display language':'செயலி மொழி',
      'Accessibility':'அணுகல்தன்மை','Text size':'எழுத்து அளவு','Standard':'இயல்பானது','Large':'பெரியது',
      'Extra large':'மிகப் பெரியது','High contrast':'உயர் மாறுபாடு','Reduce motion':'அசைவுகளைக் குறை',
      'About Noor':'நூர் பற்றி','Prayer settings':'தொழுகை அமைப்புகள்','Location':'இடம்','Appearance':'தோற்றம்'
    },
    ur: {
      'Home':'ہوم','Prayers':'نمازیں','Quran':'قرآن','My Journey':'میرا سفر','Qibla':'قبلہ',
      'Duas':'دعائیں','Mosques':'مساجد','Giving':'عطیہ','Tasbeeh':'تسبیح','Inspiration':'ترغیب',
      'Calendar':'کیلنڈر','Settings':'ترتیبات','Profile':'پروفائل','Notifications':'اطلاعات',
      'Language':'زبان','App language':'ایپ کی زبان','App display language':'ایپ کی زبان',
      'Accessibility':'رسائی کی سہولت','Text size':'متن کا سائز','Standard':'معیاری','Large':'بڑا',
      'Extra large':'بہت بڑا','High contrast':'زیادہ تضاد','Reduce motion':'حرکت کم کریں',
      'About Noor':'نور کے بارے میں','Prayer settings':'نماز کی ترتیبات','Location':'مقام','Appearance':'ظاہری شکل'
    },
    bn: {
      'Home':'হোম','Prayers':'নামাজ','Quran':'কুরআন','My Journey':'আমার যাত্রা','Qibla':'কিবলা',
      'Duas':'দোয়া','Mosques':'মসজিদ','Giving':'দান','Tasbeeh':'তাসবিহ','Inspiration':'অনুপ্রেরণা',
      'Calendar':'ক্যালেন্ডার','Settings':'সেটিংস','Profile':'প্রোফাইল','Notifications':'বিজ্ঞপ্তি',
      'Language':'ভাষা','App language':'অ্যাপের ভাষা','App display language':'অ্যাপের ভাষা',
      'Accessibility':'অ্যাক্সেসিবিলিটি','Text size':'লেখার আকার','Standard':'স্বাভাবিক','Large':'বড়',
      'Extra large':'আরও বড়','High contrast':'উচ্চ কনট্রাস্ট','Reduce motion':'অ্যানিমেশন কমান',
      'About Noor':'নূর সম্পর্কে','Prayer settings':'নামাজের সেটিংস','Location':'অবস্থান','Appearance':'চেহারা'
    },
    ml: {
      'Home':'ഹോം','Prayers':'നമസ്കാരങ്ങൾ','Quran':'ഖുർആൻ','My Journey':'എന്റെ യാത്ര','Qibla':'ഖിബ്‌ല',
      'Duas':'ദുആകൾ','Mosques':'പള്ളികൾ','Giving':'ദാനം','Tasbeeh':'തസ്ബീഹ്','Inspiration':'പ്രചോദനം',
      'Calendar':'കലണ്ടർ','Settings':'ക്രമീകരണങ്ങൾ','Profile':'പ്രൊഫൈൽ','Notifications':'അറിയിപ്പുകൾ',
      'Language':'ഭാഷ','App language':'ആപ്പിന്റെ ഭാഷ','App display language':'ആപ്പിന്റെ ഭാഷ',
      'Accessibility':'പ്രവേശനക്ഷമത','Text size':'അക്ഷര വലുപ്പം','Standard':'സാധാരണം','Large':'വലുത്',
      'Extra large':'വളരെ വലുത്','High contrast':'ഉയർന്ന കോൺട്രാസ്റ്റ്','Reduce motion':'ചലനങ്ങൾ കുറയ്ക്കുക',
      'About Noor':'നൂറിനെക്കുറിച്ച്','Prayer settings':'നമസ്കാര ക്രമീകരണങ്ങൾ','Location':'സ്ഥലം','Appearance':'രൂപം'
    },
    kn: {
      'Home':'ಮುಖಪುಟ','Prayers':'ನಮಾಜ್‌ಗಳು','Quran':'ಕುರಾನ್','My Journey':'ನನ್ನ ಪ್ರಯಾಣ','Qibla':'ಕಿಬ್ಲಾ',
      'Duas':'ದುಆಗಳು','Mosques':'ಮಸೀದಿಗಳು','Giving':'ದಾನ','Tasbeeh':'ತಸ್ಬೀಹ್','Inspiration':'ಸ್ಫೂರ್ತಿ',
      'Calendar':'ಕ್ಯಾಲೆಂಡರ್','Settings':'ಸೆಟ್ಟಿಂಗ್‌ಗಳು','Profile':'ಪ್ರೊಫೈಲ್','Notifications':'ಅಧಿಸೂಚನೆಗಳು',
      'Language':'ಭಾಷೆ','App language':'ಆ್ಯಪ್ ಭಾಷೆ','App display language':'ಆ್ಯಪ್ ಭಾಷೆ',
      'Accessibility':'ಪ್ರವೇಶಸಾಧ್ಯತೆ','Text size':'ಪಠ್ಯದ ಗಾತ್ರ','Standard':'ಸಾಮಾನ್ಯ','Large':'ದೊಡ್ಡದು',
      'Extra large':'ಬಹಳ ದೊಡ್ಡದು','High contrast':'ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್','Reduce motion':'ಚಲನೆ ಕಡಿಮೆ ಮಾಡಿ',
      'About Noor':'ನೂರ್ ಬಗ್ಗೆ','Prayer settings':'ನಮಾಜ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು','Location':'ಸ್ಥಳ','Appearance':'ರೂಪ'
    },
    mr: {
      'Home':'मुख्यपृष्ठ','Prayers':'नमाज','Quran':'कुरआन','My Journey':'माझा प्रवास','Qibla':'किब्ला',
      'Duas':'दुआ','Mosques':'मशिदी','Giving':'दान','Tasbeeh':'तसबिह','Inspiration':'प्रेरणा',
      'Calendar':'दिनदर्शिका','Settings':'सेटिंग्ज','Profile':'प्रोफाइल','Notifications':'सूचना',
      'Language':'भाषा','App language':'अॅपची भाषा','App display language':'अॅपची भाषा',
      'Accessibility':'प्रवेशयोग्यता','Text size':'मजकूर आकार','Standard':'सामान्य','Large':'मोठा',
      'Extra large':'अतिमोठा','High contrast':'उच्च कॉन्ट्रास्ट','Reduce motion':'हालचाल कमी करा',
      'About Noor':'नूर विषयी','Prayer settings':'नमाज सेटिंग्ज','Location':'स्थान','Appearance':'स्वरूप'
    },
    gu: {
      'Home':'હોમ','Prayers':'નમાઝ','Quran':'કુરઆન','My Journey':'મારી સફર','Qibla':'કિબલા',
      'Duas':'દુઆઓ','Mosques':'મસ્જિદો','Giving':'દાન','Tasbeeh':'તસ્બીહ','Inspiration':'પ્રેરણા',
      'Calendar':'કૅલેન્ડર','Settings':'સેટિંગ્સ','Profile':'પ્રોફાઇલ','Notifications':'સૂચનાઓ',
      'Language':'ભાષા','App language':'ઍપની ભાષા','App display language':'ઍપની ભાષા',
      'Accessibility':'સુલભતા','Text size':'લખાણનું કદ','Standard':'સામાન્ય','Large':'મોટું',
      'Extra large':'ખૂબ મોટું','High contrast':'વધુ કોન્ટ્રાસ્ટ','Reduce motion':'હલનચલન ઘટાડો',
      'About Noor':'નૂર વિશે','Prayer settings':'નમાઝ સેટિંગ્સ','Location':'સ્થાન','Appearance':'દેખાવ'
    },
    pa: {
      'Home':'ਮੁੱਖ ਪੰਨਾ','Prayers':'ਨਮਾਜ਼ਾਂ','Quran':'ਕੁਰਆਨ','My Journey':'ਮੇਰਾ ਸਫ਼ਰ','Qibla':'ਕਿਬਲਾ',
      'Duas':'ਦੁਆਵਾਂ','Mosques':'ਮਸਜਿਦਾਂ','Giving':'ਦਾਨ','Tasbeeh':'ਤਸਬੀਹ','Inspiration':'ਪ੍ਰੇਰਣਾ',
      'Calendar':'ਕੈਲੰਡਰ','Settings':'ਸੈਟਿੰਗਾਂ','Profile':'ਪ੍ਰੋਫ਼ਾਈਲ','Notifications':'ਸੂਚਨਾਵਾਂ',
      'Language':'ਭਾਸ਼ਾ','App language':'ਐਪ ਦੀ ਭਾਸ਼ਾ','App display language':'ਐਪ ਦੀ ਭਾਸ਼ਾ',
      'Accessibility':'ਪਹੁੰਚਯੋਗਤਾ','Text size':'ਲਿਖਤ ਦਾ ਆਕਾਰ','Standard':'ਮਿਆਰੀ','Large':'ਵੱਡਾ',
      'Extra large':'ਬਹੁਤ ਵੱਡਾ','High contrast':'ਉੱਚ ਕੰਟ੍ਰਾਸਟ','Reduce motion':'ਹਿਲਜੁਲ ਘਟਾਓ',
      'About Noor':'ਨੂਰ ਬਾਰੇ','Prayer settings':'ਨਮਾਜ਼ ਸੈਟਿੰਗਾਂ','Location':'ਟਿਕਾਣਾ','Appearance':'ਦਿੱਖ'
    }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function safeStorageGet(key, fallback) {
    try { var value = localStorage.getItem(key); return value == null ? fallback : value; }
    catch (e) { return fallback; }
  }

  function readCache() {
    try {
      var cache = JSON.parse(safeStorageGet(STORAGE_CACHE, '{}'));
      return cache && typeof cache === 'object' ? cache : {};
    } catch (e) { return {}; }
  }

  function persistCache() {
    try {
      var keys = Object.keys(translationCache);
      if (keys.length > 1800) {
        keys.slice(0, keys.length - 1400).forEach(function (key) { delete translationCache[key]; });
      }
      localStorage.setItem(STORAGE_CACHE, JSON.stringify(translationCache));
    } catch (e) { /* App must remain usable if storage is full or disabled. */ }
  }

  function readAccessibility() {
    try {
      var value = JSON.parse(safeStorageGet(STORAGE_ACCESSIBILITY, '{}'));
      value = value && typeof value === 'object' ? value : {};
      return {
        textSize: ['normal', 'large', 'xlarge'].indexOf(value.textSize) >= 0 ? value.textSize : 'normal',
        highContrast: value.highContrast === true,
        reduceMotion: value.reduceMotion === true
      };
    } catch (e) {
      return { textSize: 'normal', highContrast: false, reduceMotion: false };
    }
  }

  var accessibility = readAccessibility();

  function currentLanguage() {
    var saved = safeStorageGet(STORAGE_LANGUAGE, 'en');
    return LANGUAGES.some(function (language) { return language.code === saved; }) ? saved : 'en';
  }

  function languageOptions() {
    var selected = currentLanguage();
    return LANGUAGES.map(function (language) {
      var label = language.code === 'en' ? 'English' : language.native + ' — ' + language.english;
      return '<option value="' + escapeHtml(language.code) + '"' + (selected === language.code ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }

  function accessibilityCard() {
    var textSize = accessibility.textSize;
    return '<div class="card" style="margin-top:16px" id="noorAccessibilitySettings">' +
      '<h3>Accessibility</h3><p class="sub">Adjust the app to make reading and navigation more comfortable.</p>' +
      '<div class="setting"><div><b>Text size</b><small>Make interface text easier to read</small></div>' +
      '<select id="noorTextSize" aria-label="Text size" onchange="setAppAccessibilityV5(\'textSize\',this.value)">' +
      '<option value="normal"' + (textSize === 'normal' ? ' selected' : '') + '>Standard</option>' +
      '<option value="large"' + (textSize === 'large' ? ' selected' : '') + '>Large</option>' +
      '<option value="xlarge"' + (textSize === 'xlarge' ? ' selected' : '') + '>Extra large</option></select></div>' +
      '<div class="setting"><div><b>High contrast</b><small>Increase text and border contrast</small></div>' +
      '<input class="toggle" type="checkbox" id="noorHighContrast" aria-label="High contrast" ' + (accessibility.highContrast ? 'checked ' : '') +
      'onchange="setAppAccessibilityV5(\'highContrast\',this.checked)"></div>' +
      '<div class="setting"><div><b>Reduce motion</b><small>Reduce animations and transitions</small></div>' +
      '<input class="toggle" type="checkbox" id="noorReduceMotion" aria-label="Reduce motion" ' + (accessibility.reduceMotion ? 'checked ' : '') +
      'onchange="setAppAccessibilityV5(\'reduceMotion\',this.checked)"></div></div>';
  }

  if (typeof window.settingsPage === 'function') {
    var originalSettingsPage = window.settingsPage;
    window.settingsPage = function () {
      var html = originalSettingsPage();
      var replacement = '<div class="setting noor-language-setting"><div><b>App language</b><small>Translate the app interface</small></div>' +
        '<select id="noorAppLanguage" aria-label="App display language" onchange="setAppLanguageV5(this.value)">' + languageOptions() + '</select></div>' +
        '<p id="noorLanguageStatus" class="sub" role="status" aria-live="polite" style="margin:0 0 8px">Your language choice is saved on this device.</p>';
      html = html.replace(/<div class="setting"><div><b>Language<\/b><small>App display language<\/small><\/div><select>[\s\S]*?<\/select><\/div>/, replacement);
      html = html.replace('<div class="card" style="margin-top:16px"><h3>About Noor</h3>', accessibilityCard() + '<div class="card" style="margin-top:16px"><h3>About Noor</h3>');
      return html;
    };
  }

  var style = document.createElement('style');
  style.id = 'noor-i18n-accessibility-styles';
  style.textContent =
    'html[dir="rtl"] .sidebar{border-right:0;border-left:1px solid var(--line)}' +
    'html[dir="rtl"] .nav button{text-align:right}' +
    'html[dir="rtl"] .setting{text-align:right}' +
    'html[dir="rtl"] .page-title,html[dir="rtl"] .sectionhead,html[dir="rtl"] .top{direction:rtl}' +
    'body.noor-high-contrast{--muted:#f0f4f1!important;--line:#ffffff!important}' +
    'body.noor-high-contrast .sub,body.noor-high-contrast small,body.noor-high-contrast .crumb{color:#ffffff!important}' +
    'body.noor-high-contrast .card,body.noor-high-contrast button,body.noor-high-contrast input,body.noor-high-contrast select,body.noor-high-contrast textarea{border-color:#ffffff!important}' +
    'body.noor-text-large :is(p,button,a,label,small,input,select,textarea,li,.sub,.crumb,.setting small,.nav button,.quick b,.quick span){font-size:max(1em,16px)!important}' +
    'body.noor-text-xlarge :is(p,button,a,label,small,input,select,textarea,li,.sub,.crumb,.setting small,.nav button,.quick b,.quick span){font-size:max(1em,18px)!important}' +
    'body.noor-reduce-motion *,body.noor-reduce-motion *::before,body.noor-reduce-motion *::after{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;scroll-behavior:auto!important}' +
    '#noorLanguageStatus{line-height:1.5}';
  document.head.appendChild(style);

  function applyAccessibility() {
    document.body.classList.toggle('noor-text-large', accessibility.textSize === 'large');
    document.body.classList.toggle('noor-text-xlarge', accessibility.textSize === 'xlarge');
    document.body.classList.toggle('noor-high-contrast', accessibility.highContrast);
    document.body.classList.toggle('noor-reduce-motion', accessibility.reduceMotion);
    try { localStorage.setItem(STORAGE_ACCESSIBILITY, JSON.stringify(accessibility)); } catch (e) {}
  }

  window.setAppAccessibilityV5 = function (key, value) {
    if (key === 'textSize' && ['normal', 'large', 'xlarge'].indexOf(value) >= 0) accessibility.textSize = value;
    if (key === 'highContrast') accessibility.highContrast = value === true;
    if (key === 'reduceMotion') accessibility.reduceMotion = value === true;
    applyAccessibility();
    if (typeof window.toast === 'function') window.toast('Accessibility preference saved');
  };

  function setDocumentLanguage(language) {
    activeLanguage = language;
    var info = LANGUAGES.find(function (entry) { return entry.code === language; }) || LANGUAGES.filter(function (entry) { return entry.code === 'en'; })[0];
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES[language] ? 'rtl' : 'ltr';
    document.body.classList.toggle('noor-rtl', !!RTL_LANGUAGES[language]);
    document.documentElement.setAttribute('data-noor-language', language);
    document.title = language === 'en' ? 'Noor — Muslim daily companion' : document.title;
    var selector = document.getElementById('noorAppLanguage');
    if (selector) selector.value = language;
    return info;
  }

  window.setAppLanguageV5 = function (language) {
    if (!LANGUAGES.some(function (entry) { return entry.code === language; })) language = 'en';
    if (language === activeLanguage && language === currentLanguage()) {
      if (typeof window.render === 'function') window.render();
      return;
    }
    try { localStorage.setItem(STORAGE_LANGUAGE, language); } catch (e) {}
    languageEpoch += 1;
    translationQueue = [];
    setDocumentLanguage(language);
    if (typeof window.render === 'function') window.render();
    else scheduleScan();
    updateLanguageStatus('Applying language…');
  };

  function shouldSkipElement(element) {
    if (!element || element.nodeType !== 1) return true;
    if (element.closest('#noorAppLanguage,[data-noor-i18n-skip],script,style,noscript,svg,code,pre,[contenteditable="true"],.arabic,.translation,.transliteration,.ayah-arabic,.quran-arabic,.quran-translation,.reader-verse-text,.dua-arabic,.dua-transliteration,.dua-translation,.toast')) return true;
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') return true;
    var privateReflection = safeStorageGet('noor-reflection', '');
    if (privateReflection && element.textContent && element.textContent.trim() === privateReflection.trim()) return true;
    return false;
  }

  function getTextSource(node) {
    if (node.__noorI18nOriginal !== undefined) return node.__noorI18nOriginal;
    return node.nodeValue || '';
  }

  function trimPadding(original, translated) {
    var start = (original.match(/^\s*/) || [''])[0];
    var end = (original.match(/\s*$/) || [''])[0];
    return start + translated.trim() + end;
  }

  function fallbackTranslation(text, language) {
    var dictionary = FALLBACK[language];
    return dictionary && dictionary[text] ? dictionary[text] : text;
  }

  async function onlineTranslate(text, language) {
    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
      encodeURIComponent(language) + '&dt=t&q=' + encodeURIComponent(text);
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeout = controller ? window.setTimeout(function () { controller.abort(); }, 9000) : null;
    try {
      var response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache',
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) throw new Error('Translation service returned ' + response.status);
      var payload = await response.json();
      var segments = payload && Array.isArray(payload[0]) ? payload[0] : [];
      var result = segments.map(function (segment) { return segment && segment[0] ? segment[0] : ''; }).join('');
      if (!result || !result.trim()) throw new Error('Empty translation');
      return result;
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  var pendingTranslations = new Map();

  function translateText(source, language) {
    var key = language + '|' + source;
    if (language === 'en') return Promise.resolve(source);
    if (translationCache[key]) return Promise.resolve(translationCache[key]);
    if (pendingTranslations.has(key)) return pendingTranslations.get(key);
    var task = onlineTranslate(source, language).then(function (translated) {
      if (translated && translated.trim() && translated.trim() !== source.trim()) {
        translationCache[key] = translated.trim();
        persistCache();
        return translated.trim();
      }
      var fallback = fallbackTranslation(source, language);
      if (fallback !== source) return fallback;
      return source;
    }).catch(function () {
      var fallback = fallbackTranslation(source, language);
      if (fallback === source) failuresThisPass += 1;
      return fallback;
    }).finally(function () {
      pendingTranslations.delete(key);
    });
    pendingTranslations.set(key, task);
    return task;
  }

  function translateTextNode(node, language, epoch) {
    if (!node || !node.parentElement || shouldSkipElement(node.parentElement)) return;
    var rawSource = getTextSource(node);
    var source = String(rawSource).trim();
    if (source.length < 2 || source.length > 450 || !/[A-Za-z]/.test(source)) return;
    if (/^[\d\s.,:;/%()+\-–—]+$/.test(source)) return;
    if (node.__noorI18nLocale === language && node.nodeValue === node.__noorI18nTranslated) return;
    if (node.__noorI18nPending === language) return;
    node.__noorI18nOriginal = rawSource;
    touchedTextNodes.add(node);
    node.__noorI18nPending = language;
    translationQueue.push({ type: 'text', node: node, source: source, original: rawSource, language: language, epoch: epoch });
    pumpQueue();
  }

  function translateAttribute(element, attribute, language, epoch) {
    if (shouldSkipElement(element)) return;
    var keyName = '__noorOriginalAttribute_' + attribute.replace(/[^a-z]/gi, '');
    if (!element[keyName]) element[keyName] = element.getAttribute(attribute) || '';
    var source = String(element[keyName] || '').trim();
    if (source.length < 2 || source.length > 250 || !/[A-Za-z]/.test(source)) return;
    var translatedKeyName = '__noorTranslatedAttribute_' + attribute.replace(/[^a-z]/gi, '');
    if (element[translatedKeyName] && element.getAttribute(attribute) === element[translatedKeyName] && element['__noorAttributeLocale_' + attribute] === language) return;
    if (element['__noorAttributePending_' + attribute] === language) return;
    touchedAttributeElements.add(element);
    element['__noorAttributePending_' + attribute] = language;
    translationQueue.push({ type: 'attribute', element: element, attribute: attribute, source: source, keyName: keyName, translatedKeyName: translatedKeyName, language: language, epoch: epoch });
    pumpQueue();
  }

  function scanDocument() {
    scanScheduled = false;
    var language = currentLanguage();
    setDocumentLanguage(language);
    if (language === 'en') {
      restoreEnglish();
      updateLanguageStatus('English selected.');
      return;
    }
    var epoch = languageEpoch;
    failuresThisPass = 0;
    translatedThisPass = 0;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) translateTextNode(node, language, epoch);
    var elements = document.body.querySelectorAll('[aria-label],[title],[placeholder],[alt]');
    elements.forEach(function (element) {
      ['aria-label', 'title', 'placeholder', 'alt'].forEach(function (attribute) {
        if (element.hasAttribute(attribute)) translateAttribute(element, attribute, language, epoch);
      });
    });
    pruneTouchedNodes();
    if (!translationQueue.length && activeRequests === 0) finishTranslationPass(language, epoch);
  }

  function pruneTouchedNodes() {
    touchedTextNodes.forEach(function (node) { if (!node.parentNode) touchedTextNodes.delete(node); });
    touchedAttributeElements.forEach(function (element) { if (!element.isConnected) touchedAttributeElements.delete(element); });
  }

  function restoreEnglish() {
    touchedTextNodes.forEach(function (node) {
      if (node.parentNode && node.__noorI18nOriginal !== undefined) {
        node.nodeValue = node.__noorI18nOriginal;
        node.__noorI18nLocale = 'en';
        node.__noorI18nPending = '';
        node.__noorI18nTranslated = node.nodeValue;
      }
    });
    touchedAttributeElements.forEach(function (element) {
      if (!element.isConnected) return;
      ['aria-label', 'title', 'placeholder', 'alt'].forEach(function (attribute) {
        var keyName = '__noorOriginalAttribute_' + attribute.replace(/[^a-z]/gi, '');
        if (element[keyName] !== undefined && element.hasAttribute(attribute)) element.setAttribute(attribute, element[keyName]);
      });
    });
    translationQueue = [];
  }

  function pumpQueue() {
    while (activeRequests < 2 && translationQueue.length) {
      (function (job) {
        translationQueue.shift();
        activeRequests += 1;
        var wait = new Promise(function (resolve) { window.setTimeout(resolve, 65); });
        wait.then(function () { return translateText(job.source, job.language); }).then(function (translated) {
          if (job.epoch !== languageEpoch || job.language !== currentLanguage()) return;
          if (job.type === 'text') {
            if (!job.node.parentNode) return;
            var value = trimPadding(job.original, translated);
            job.node.nodeValue = value;
            job.node.__noorI18nLocale = job.language;
            job.node.__noorI18nTranslated = value;
            job.node.__noorI18nPending = '';
            if (translated !== job.source) translatedThisPass += 1;
          } else {
            if (!job.element.isConnected) return;
            var translatedValue = translated;
            job.element.setAttribute(job.attribute, translatedValue);
            job.element[job.translatedKeyName] = translatedValue;
            job.element['__noorAttributeLocale_' + job.attribute] = job.language;
            job.element['__noorAttributePending_' + job.attribute] = '';
            if (translated !== job.source) translatedThisPass += 1;
          }
        }).catch(function () {
          if (job.type === 'text' && job.node) job.node.__noorI18nPending = '';
          if (job.type === 'attribute' && job.element) job.element['__noorAttributePending_' + job.attribute] = '';
        }).finally(function () {
          activeRequests -= 1;
          if (translationQueue.length) pumpQueue();
          if (!translationQueue.length && activeRequests === 0) finishTranslationPass(currentLanguage(), languageEpoch);
        });
      })(translationQueue[0]);
    }
  }

  function updateLanguageStatus(source) {
    var element = document.getElementById('noorLanguageStatus');
    if (!element) return;
    var language = currentLanguage();
    if (language === 'en') {
      element.textContent = source;
      return;
    }
    translateText(source, language).then(function (translated) {
      if (language === currentLanguage() && element.isConnected) element.textContent = translated;
    });
  }

  function finishTranslationPass(language, epoch) {
    if (epoch !== languageEpoch || language !== currentLanguage()) return;
    var status = document.getElementById('noorLanguageStatus');
    if (status && activeRequests === 0 && translationQueue.length === 0) {
      if (failuresThisPass > 0) {
        updateLanguageStatus('Language saved. Connect to the internet to translate any remaining text.');
      } else {
        updateLanguageStatus('Language updated.');
      }
    }
  }

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    if (queuedRootsTimer) window.clearTimeout(queuedRootsTimer);
    queuedRootsTimer = window.setTimeout(scanDocument, 100);
  }

  /* Rerendering a screen (including Quran, Duas, Mosques and Calendar) always retriggers
     localization. The observer also covers lists that update without a full app render. */
  if (typeof window.render === 'function') {
    var originalRender = window.render;
    window.render = function () {
      var result = originalRender.apply(this, arguments);
      setDocumentLanguage(currentLanguage());
      scheduleScan();
      return result;
    };
  }

  var observer = new MutationObserver(function (mutations) {
    if (mutations.some(function (mutation) {
      return mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0);
    })) scheduleScan();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  /* Preserve the app's sacred source text and avoid machine-translating user-entered values. */
  function protectContent() {
    document.querySelectorAll('.arabic,.translation,.transliteration,.ayah-arabic,.quran-arabic,.quran-translation,.reader-verse-text,.dua-arabic,.dua-transliteration,.dua-translation').forEach(function (element) {
      element.setAttribute('data-noor-i18n-skip', 'true');
    });
  }

  setDocumentLanguage(currentLanguage());
  applyAccessibility();
  protectContent();
  window.setTimeout(function () {
    if (typeof window.render === 'function') window.render();
    scheduleScan();
  }, 0);
})();