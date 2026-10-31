/* MOMIN Settings Center V1 — functional preferences layered over existing app handlers. */
(function(){
  "use strict";
  var PRAYERS=[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","Asr"],["maghrib","Maghrib"],["isha","Isha"]];
  function get(key,fallback){try{var v=localStorage.getItem(key);return v===null?fallback:v}catch(_){return fallback}}
  function put(key,value){try{localStorage.setItem(key,String(value));return true}catch(_){return false}}
  function notify(message){if(typeof window.toast==="function")window.toast(message);else alert(message)}
  function themeValue(){return get("noor-theme-preference",get("noor-theme","Dark"))}
  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function storeObject(){try{if(window.API_STORE)return window.API_STORE}catch(_){}try{if(typeof API_STORE!=="undefined")return API_STORE}catch(_){}return null}
  function locationLabel(){var s=storeObject(),city=s&&s.city||get("noor-city",""),country=s&&s.country||get("noor-country","");if(city&&country)return String(city)+", "+String(country);if(city)return String(city);return "Not set yet"}
  function languageOptions(){var options=[["en","English"],["as","অসমীয়া — Assamese"],["bn","বাংলা — Bengali"],["brx","बड़ो — Bodo"],["doi","डोगरी — Dogri"],["gu","ગુજરાતી — Gujarati"],["hi","हिन्दी — Hindi"],["kn","ಕನ್ನಡ — Kannada"],["ks","کٲشُر — Kashmiri"],["kok","कोंकणी — Konkani"],["mai","मैथिली — Maithili"],["ml","മലയാളം — Malayalam"],["mni","মৈতৈলোন্ — Manipuri (Meitei)"],["mr","मराठी — Marathi"],["ne","नेपाली — Nepali"],["or","ଓଡ଼ିଆ — Odia"],["pa","ਪੰਜਾਬੀ — Punjabi"],["sa","संस्कृतम् — Sanskrit"],["sat","ᱥᱟᱱᱛᱟᱲᱤ — Santali"],["sd","سنڌي — Sindhi"],["ta","தமிழ் — Tamil"],["te","తెలుగు — Telugu"],["ur","اردو — Urdu"],["ar","العربية — Arabic"]],current=get("noor-language","en");return options.map(function(x){return '<option value="'+esc(x[0])+'" '+(x[0]===current?"selected":"")+'>'+esc(x[1])+'</option>'}).join("")}
  function methodOptions(){var map=window.PRAYER_METHODS;try{if(!map&&typeof PRAYER_METHODS!=="undefined")map=PRAYER_METHODS}catch(_){}if(!map)return '<option value="3">Muslim World League</option>';var s=storeObject(),selected=String(s&&s.method||get("noor-method","3")),manual=get("noor-method-mode","auto")==="manual";return Object.keys(map).map(function(name){var id=String(map[name]);return '<option value="'+esc(id)+'" '+(manual&&id===selected?"selected":"")+'>'+esc(name)+'</option>'}).join("")}
  function quranTranslationOptions(){try{if(typeof window.quranTranslationOptionsV5==="function")return window.quranTranslationOptionsV5()}catch(_){}var current=get("noor-quran-edition","en.sahih");return [["en.sahih","English — Saheeh International"],["en.yusufali","English — Yusuf Ali"],["ur.jalandhry","Urdu — Fateh Muhammad Jalandhry"],["hi.hindi","Hindi"],["ta.tamil","Tamil"]].map(function(x){return '<option value="'+x[0]+'" '+(current===x[0]?"selected":"")+'>'+x[1]+'</option>'}).join("")}
  function icon(name){var paths={profile:"♙",appearance:"◐",location:"⌖",notifications:"♧",quran:"۞",duas:"♡",tasbih:"◉",qibla:"⌁",calendar:"▦",language:"文",privacy:"◇",storage:"▤",help:"?"};if(name==="quran")return '<span class="momin-sc-icon momin-sc-icon--brand" aria-hidden="true"><img src="./momin-mark.svg?v=islamic-logo-v3" alt=""></span>';return '<span class="momin-sc-icon" aria-hidden="true">'+(paths[name]||"•")+'</span>'}
  function row(label,description,control){return '<div class="momin-sc-row"><div class="momin-sc-copy"><b>'+label+'</b><small>'+description+'</small></div><div class="momin-sc-control">'+control+'</div></div>'}
  function group(id,title,subtitle,body,open){return '<details class="momin-sc-group" id="momin-sc-'+id+'" '+(open?"open":"")+'><summary>'+icon(id)+'<span class="momin-sc-summary-copy"><b>'+title+'</b><small>'+subtitle+'</small></span><span class="momin-sc-chevron" aria-hidden="true">⌄</span></summary><div class="momin-sc-body">'+body+'</div></details>'}
  function switchControl(id,checked,extra){return '<label class="momin-sc-switch"><input type="checkbox" id="'+id+'" '+(checked?"checked":"")+(extra?' '+extra:"")+'><span></span></label>'}
  function button(label,onclick,kind){return '<button type="button" class="momin-sc-btn '+(kind||"")+'" onclick="'+onclick+'">'+label+'</button>'}
  function ensureMominAboutStylesV1(){
    if(document.getElementById("momin-about-style-v1"))return;
    var style=document.createElement("style");
    style.id="momin-about-style-v1";
    style.textContent=
      '.momin-about-v1{padding:8px 0 4px;color:var(--ink)}'+
      '.momin-about-identity{display:flex;align-items:center;gap:16px;padding:18px;margin:4px 0 14px;border:1px solid rgba(197,160,82,.38);border-radius:18px;background:radial-gradient(120% 130% at 100% 0%,rgba(220,185,104,.18),transparent 65%),linear-gradient(135deg,var(--paper),var(--bg))}'+
      '.momin-about-identity>img{display:block;width:76px;height:76px;flex:0 0 76px;object-fit:contain;padding:5px;border:1px solid rgba(197,160,82,.48);border-radius:18px;background:#f7f3e8}'+
      '.momin-about-kicker{margin:0 0 4px;font-size:9px;font-weight:800;letter-spacing:.15em;color:var(--accent)}'+
      '.momin-about-identity h3{margin:0;color:var(--ink);font:700 25px Georgia,serif;letter-spacing:.12em}'+
      '.momin-about-identity .momin-about-tagline{margin:4px 0 8px;color:var(--muted);font-size:12px}'+
      '.momin-about-version{display:inline-block;padding:5px 8px;border:1px solid var(--line);border-radius:20px;color:var(--muted);font-size:10px}'+
      '.momin-about-intro,.momin-about-transparency{padding:14px 15px;margin:12px 0;border:1px solid var(--line);border-radius:15px;background:var(--bg)}'+
      '.momin-about-v1 h4{margin:0 0 7px;font-size:13px;color:var(--ink)}'+
      '.momin-about-v1 p{margin:0;color:var(--muted);font-size:11px;line-height:1.7}'+
      '.momin-about-section-title{margin:16px 0 9px!important}'+
      '.momin-about-features{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}'+
      '.momin-about-feature{display:flex;align-items:flex-start;gap:10px;min-width:0;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}'+
      '.momin-about-feature>span{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-size:18px}'+
      '.momin-about-feature b{display:block;margin:1px 0 5px;font-size:11px;line-height:1.35;color:var(--ink)}'+
      '.momin-about-feature p{font-size:10px;line-height:1.55}'+
      '.momin-about-transparency{border-color:rgba(197,160,82,.3)}'+
      '.momin-about-transparency p+p{margin-top:8px}'+
      '.momin-about-footer{padding:10px 0 3px;text-align:center;font-size:10px!important;font-style:italic}'+
      '@media(max-width:600px){.momin-about-identity{gap:12px;padding:14px;border-radius:15px}.momin-about-identity>img{width:60px;height:60px;flex-basis:60px;border-radius:14px}.momin-about-identity h3{font-size:22px}.momin-about-features{grid-template-columns:1fr}.momin-about-feature{padding:11px}.momin-about-v1 p{font-size:11px}}';
    style.textContent +=
      '.momin-founder-entry{display:flex;align-items:center;gap:14px;margin:16px 0 4px;padding:15px;border:1px solid rgba(197,160,82,.46);border-radius:18px;background:radial-gradient(120% 120% at 100% 0%,rgba(220,185,104,.15),transparent 65%),linear-gradient(135deg,var(--paper),var(--bg))}'+
      '.momin-founder-entry-icon{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border:1px solid rgba(197,160,82,.5);border-radius:14px;background:#f7f3e8}'+
      '.momin-founder-entry-icon img{display:block;width:40px;height:40px;object-fit:contain}'+
      '.momin-founder-entry-copy{flex:1;min-width:0}.momin-founder-entry-copy .momin-about-kicker{margin:0 0 4px}.momin-founder-entry-copy h3{margin:0 0 5px;font:700 16px Georgia,serif;color:var(--ink)}.momin-founder-entry-copy p:last-child{margin:0;font-size:11px;line-height:1.5;color:var(--muted)}'+
      '.momin-founder-entry>.momin-sc-btn{flex:0 0 auto}'+
      '.momin-founder-direct-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;white-space:nowrap;cursor:pointer}'+
      '.momin-founder-page{max-width:940px;margin:0 auto 36px;color:var(--ink)}'+
      '.momin-founder-back{display:inline-flex;align-items:center;gap:8px;margin:0 0 14px;padding:10px 13px;border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink);font:600 12px var(--sans);cursor:pointer}'+
      '.momin-founder-page-card{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(250px,.86fr) minmax(0,1.14fr);gap:22px;align-items:center;padding:24px;border:1px solid rgba(197,160,82,.55);border-radius:24px;background:radial-gradient(120% 100% at 100% 0%,rgba(220,185,104,.17),transparent 68%),linear-gradient(135deg,var(--paper),var(--bg));box-shadow:var(--shadow)}'+
      '.momin-founder-page-ornament{position:absolute;top:18px;right:22px;width:92px;height:92px;display:grid;place-items:center;color:rgba(220,177,82,.32);pointer-events:none;z-index:0}'+
      '.momin-founder-page-ornament img{display:block;width:100%;height:100%;object-fit:contain}'+
      '.momin-founder-page-heading{grid-column:1/-1;position:relative;z-index:1;padding:0 0 2px;border-bottom:1px solid rgba(197,160,82,.45)}'+
      '.momin-founder-page-heading .momin-about-kicker{font-size:10px}.momin-founder-page-heading h2{margin:0 0 7px;font:700 clamp(24px,4vw,34px) Georgia,serif;line-height:1.16;color:var(--ink)}'+
      '.momin-founder-page-heading p:last-child{margin:0 0 14px;font-size:12px;line-height:1.6;color:var(--muted)}'+
      '.momin-founder-page-photo-wrap{overflow:hidden;width:100%;aspect-ratio:3/4;border:1px solid rgba(197,160,82,.56);border-radius:18px;background:#f7f3e8;box-shadow:0 10px 24px rgba(73,48,14,.12)}'+
      '.momin-founder-page-photo{display:block;width:100%;height:100%;object-fit:cover;object-position:center 24%}'+
      '.momin-founder-page-bio{position:relative;z-index:1;min-width:0}.momin-founder-page-bio h3{margin:0 0 10px;font:700 clamp(22px,3vw,29px) Georgia,serif;color:var(--ink)}'+
      '.momin-founder-page-bio>p:not(.momin-founder-page-role){margin:13px 0;color:var(--muted);font-size:13px;line-height:1.8}'+
      '.momin-founder-page-role{display:inline-flex;align-items:center;gap:8px;margin:0;padding:10px 12px;border:1px solid rgba(197,160,82,.38);border-radius:13px;background:var(--accent-soft);font-size:12px;font-weight:750;line-height:1.5;color:var(--ink)}'+
      '.momin-founder-page-role span{font-size:17px;color:var(--accent)}'+
      '.momin-founder-signature{margin-top:18px;padding-top:13px;border-top:1px solid var(--line);font:italic 16px Georgia,serif;color:var(--accent)}'+
      '.momin-founder-page-actions{display:flex;justify-content:flex-end;margin-top:14px}'+
      'body:has(.momin-founder-page) .top{display:none!important}'+
      '@media(max-width:650px){.momin-founder-entry{align-items:flex-start;flex-wrap:wrap;padding:13px}.momin-founder-entry>.momin-sc-btn{width:100%}.momin-founder-page-card{grid-template-columns:minmax(0,1fr);gap:16px;padding:15px;border-radius:19px}.momin-founder-page-heading{grid-column:auto}.momin-founder-page-photo-wrap{width:min(100%,430px);aspect-ratio:3/4;margin:0 auto}.momin-founder-page-bio h3{font-size:25px}.momin-founder-page-bio>p:not(.momin-founder-page-role){font-size:12px}.momin-founder-page-ornament{width:66px;height:66px;right:8px;top:8px}}';
    document.head.appendChild(style);
  }
  function detailsPage(){
    ensureMominAboutStylesV1();
    var mode=get("noor-method-mode","auto")==="manual"?"manual":"auto",theme=themeValue(),master=get("noor-notifications","true")!=="false";
    var s=storeObject(),city=s&&s.city||get("noor-city",""),country=s&&s.country||get("noor-country","");
    var quranSize=get("noor-quran-arabic-size","48"),duaSize=get("noor-dua-prototype-text-size","30");
    var tsb={};try{tsb=JSON.parse(get("noor-tsb-v2","{}"))||{}}catch(_){}
    var keepAwake=get("noor-keep-awake-v8",get("noor-keep-awake","false"))==="true";
    var translation=get("noor-quran-show-translation-v8","true")!=="false",translit=get("noor-quran-show-transliteration-v8","false")==="true";
    var repeat=get("noor-quran-repeat-v8","false")==="true",autoNext=get("noor-quran-auto-next-v8","false")==="true";
    var speed=get("noor-quran-audio-speed-v8","1"),reciter=get("noor-quran-reciter-v8","ar.alafasy"),lang=get("noor-language","en");
    var used=0,appStoredKeys=0;try{for(var n=0;n<localStorage.length;n++){var k=localStorage.key(n)||"";if(k.indexOf("noor-")===0||k.indexOf("momin")===0){used+=k.length+(localStorage.getItem(k)||"").length;appStoredKeys++}}}catch(_){}
    var methodSelect='<select id="settingsMethodInput" aria-label="Prayer calculation method" onchange="window.settingsMethodModeDraftV6=this.value===\'auto\'?\'auto\':\'manual\'"><option value="auto" '+(mode==="auto"?"selected":"")+'>Auto-detect for location</option>'+methodOptions()+'</select>';
    var profile='<div class="momin-sc-current"><span>Session type</span><b>Guest · this browser</b></div><div class="momin-sc-note">Sign-in and cloud sync are not enabled in this build. You can use MOMIN without creating an account; feature data is kept in this browser.</div>';
    var appearance='<div class="momin-sc-note">Current theme: <b>'+esc(theme)+'</b>. The selected appearance is shared with the calendar and feature pages.</div>'+row("Display mode","Choose how MOMIN looks",'<select id="settingsTheme" onchange="saveSettingsThemeV1(this.value)"><option value="System" '+(theme==="System"?"selected":"")+'>System default</option><option value="Light" '+(theme==="Light"?"selected":"")+'>Light</option><option value="Dark" '+(theme==="Dark"?"selected":"")+'>Dark</option><option value="Sepia" '+(theme==="Sepia"?"selected":"")+'>Sepia</option></select>')+row("Reduce animations","Prefer less movement",switchControl("settingsReduceMotionV1",get("noor-reduce-motion","false")==="true"))+row("High contrast","Increase borders and text contrast",switchControl("settingsHighContrastV1",get("noor-high-contrast","false")==="true"))+'<div class="momin-sc-actions">'+button("Save appearance","saveAppearancePrefsV1()","primary")+'</div>';
    var prayer='<div class="momin-sc-current"><span>Current location</span><b id="settingsLocationSummaryV1">'+esc(locationLabel())+'</b></div>'+row("City","Enter a city for prayer calculations",'<input id="settingsCityV1" type="text" placeholder="e.g. Hyderabad" value="'+esc(city)+'" autocomplete="address-level2">')+row("Country","Enter the country for this city",'<input id="settingsCountryV1" type="text" placeholder="e.g. India" value="'+esc(country)+'" autocomplete="country-name">')+'<div class="momin-sc-actions">'+button("Save location","saveSettingsLocationV1()","primary")+button("Use current GPS","useSettingsGpsV1()")+'</div>'+row("Calculation method","Automatic by location or select a method",methodSelect)+row("Asr calculation","Choose your juristic method",'<select id="settingsAsrMethod"><option value="standard" '+(get("noor-asr-method","standard")==="standard"?"selected":"")+'>Standard (Shafi’i / Maliki / Hanbali)</option><option value="hanafi" '+(get("noor-asr-method","standard")==="hanafi"?"selected":"")+'>Hanafi</option></select>')+row("Prayer-time sound","Makkah Azan ringtone; audio plays inside MOMIN while the app is open.", '<select id="settingsAdhanSound"><option value="azan" '+(get("noor-adhan-sound","azan")==="azan"?"selected":"")+'>Makkah Azan ringtone</option><option value="chime" '+(get("noor-adhan-sound","azan")==="chime"?"selected":"")+'>Gentle chime while app is open</option><option value="system" '+(get("noor-adhan-sound","azan")==="system"?"selected":"")+'>System notification sound</option><option value="silent" '+(get("noor-adhan-sound","azan")==="silent"?"selected":"")+'>No extra sound</option></select>')+'<p class="momin-sc-help">Prayer times can vary by calculation method and local mosque. Confirm important timings locally.</p><div class="momin-sc-actions">'+button("Save prayer settings","savePrayerBasicsV1()","primary")+'</div>';
    var notifications='<div class="momin-sc-note">Makkah Azan plays inside MOMIN when prayer reminders are due while the app is open. Web notifications may use the device system sound; background delivery is not guaranteed.</div>'+row("Enable notifications","Master notifications preference",switchControl("settingsPrayerNotificationsV1",master))+PRAYERS.map(function(p){return row(p[1],"Reminder preference",switchControl("settingsNotify-"+p[0],get("noor-notify-"+p[0],master?"true":"false")!=="false"))}).join("")+row("Advance reminder","Preferred lead time before prayer",'<select id="settingsReminderMinutesV1"><option value="0" '+(get("noor-prayer-reminder-minutes","0")==="0"?"selected":"")+'>At prayer time</option><option value="5" '+(get("noor-prayer-reminder-minutes","0")==="5"?"selected":"")+'>5 minutes before</option><option value="10" '+(get("noor-prayer-reminder-minutes","0")==="10"?"selected":"")+'>10 minutes before</option><option value="15" '+(get("noor-prayer-reminder-minutes","0")==="15"?"selected":"")+'>15 minutes before</option><option value="30" '+(get("noor-prayer-reminder-minutes","0")==="30"?"selected":"")+'>30 minutes before</option></select>')+'<div class="momin-sc-actions">'+button("Save notifications","saveNotificationPrefsV1()","primary")+button("Send test notification","testMominNotificationV1()")+button("Preview Makkah Azan","previewMominAzanV1()")+'</div>';
    var quran='<div class="momin-sc-note">These set defaults for Quran reading. The Quran reader still has quick controls for the same options.</div>'+row("Default translation","Used when opening a surah",'<select id="settingsQuranTranslation">'+quranTranslationOptions()+'</select>')+row("Arabic text size","Default verse text size",'<select id="settingsQuranArabicSizeV1"><option value="34" '+(quranSize==="34"?"selected":"")+'>Small</option><option value="40" '+(quranSize==="40"?"selected":"")+'>Medium</option><option value="48" '+(quranSize==="48"?"selected":"")+'>Large</option><option value="54" '+(quranSize==="54"?"selected":"")+'>Extra large</option><option value="58" '+(quranSize==="58"?"selected":"")+'>Maximum</option></select>')+row("Show translation","Display translated meaning",switchControl("settingsQuranMeaningV1",translation))+row("Show transliteration","Display Latin pronunciation guide",switchControl("settingsQuranTranslitV1",translit))+row("Reading layout","Verse list or page-like view",'<select id="settingsQuranModeV1"><option value="list" '+(get("noor-quran-reading-mode-v8","list")==="list"?"selected":"")+'>Verse list</option><option value="page" '+(get("noor-quran-reading-mode-v8","list")==="page"?"selected":"")+'>Page view</option></select>')+row("Reciter","Default recitation voice",'<select id="settingsReciterV1"><option value="ar.alafasy" '+(reciter==="ar.alafasy"?"selected":"")+'>Mishary Rashid Alafasy</option><option value="ar.abdurrahmaansudais" '+(reciter==="ar.abdurrahmaansudais"?"selected":"")+'>Abdurrahman As-Sudais</option><option value="ar.husary" '+(reciter==="ar.husary"?"selected":"")+'>Mahmoud Khalil Al-Husary</option><option value="ar.minshawi" '+(reciter==="ar.minshawi"?"selected":"")+'>Mohamed Siddiq Al-Minshawi</option><option value="ar.mahermuaiqly" '+(reciter==="ar.mahermuaiqly"?"selected":"")+'>Maher Al-Muaiqly</option><option value="ar.shaatree" '+(reciter==="ar.shaatree"?"selected":"")+'>Abu Bakr Ash-Shaatree</option></select>')+row("Playback speed","Default Quran audio speed",'<select id="settingsQuranSpeedV1"><option value="0.75" '+(speed==="0.75"?"selected":"")+'>0.75×</option><option value="1" '+(speed==="1"?"selected":"")+'>1×</option><option value="1.25" '+(speed==="1.25"?"selected":"")+'>1.25×</option><option value="1.5" '+(speed==="1.5"?"selected":"")+'>1.5×</option></select>')+row("Repeat current surah","Repeat recitation preference",switchControl("settingsQuranRepeatV1",repeat))+row("Auto-play next surah","Continue to the next surah",switchControl("settingsQuranNextV1",autoNext))+row("Keep screen awake","When supported while reading",switchControl("settingsKeepAwake",keepAwake))+row("Quran reader theme","Separate from app-wide theme",'<select id="settingsQuranReaderThemeV1"><option value="night" '+(get("noor-quran-theme","night")==="night"?"selected":"")+'>Dark reading page</option><option value="paper" '+(get("noor-quran-theme","night")==="paper"?"selected":"")+'>Warm paper</option><option value="white" '+(get("noor-quran-theme","night")==="white"?"selected":"")+'>White page</option></select>')+'<div class="momin-sc-actions">'+button("Save Quran defaults","saveQuranDefaultsV1()","primary")+button("Open Quran","go(\'quran\')")+'</div>';
    var language='<div class="momin-sc-note">Language preference is saved. Some screens may remain in English until translation coverage is added.</div>'+row("App language","Choose a preferred language",'<select id="settingsAppLanguage">'+languageOptions()+'</select>')+row("Larger interface text","Improve readability",'<select id="settingsInterfaceScaleV1"><option value="normal" '+(get("noor-interface-scale","normal")==="normal"?"selected":"")+'>Standard</option><option value="large" '+(get("noor-interface-scale","normal")==="large"?"selected":"")+'>Large</option><option value="larger" '+(get("noor-interface-scale","normal")==="larger"?"selected":"")+'>Extra large</option></select>')+row("Reduce motion","Use fewer animations",switchControl("settingsReduceMotionLangV1",get("noor-reduce-motion","false")==="true"))+'<div class="momin-sc-actions">'+button("Save language & accessibility","saveLanguageAccessibilityV1()","primary")+'</div>';
    var duas='<div class="momin-sc-note">Dua text size is saved locally. Tasbeeh sound and vibration preferences apply to the active counter.</div>'+row("Dua Arabic text size","Text size in supplication details",'<select id="settingsDuaArabicSizeV1"><option value="24" '+(duaSize==="24"?"selected":"")+'>Small</option><option value="28" '+(duaSize==="28"?"selected":"")+'>Medium</option><option value="30" '+(duaSize==="30"?"selected":"")+'>Large</option><option value="34" '+(duaSize==="34"?"selected":"")+'>Extra large</option><option value="40" '+(duaSize==="40"?"selected":"")+'>Maximum</option></select>')+row("Tasbeeh click sound","Saved in Tasbeeh preferences",switchControl("settingsTasbihSoundV1",!!tsb.sound))+row("Tasbeeh vibration","Uses device vibration when supported",switchControl("settingsTasbihHapticV1",tsb.haptic!==false))+'<div class="momin-sc-actions">'+button("Save Duas & Tasbeeh","saveDuaTasbihPrefsV1()","primary")+button("Open Duas","go(\'duas\')")+button("Open Tasbeeh","go(\'tasbeeh\')")+'</div>';
    var qibla='<div class="momin-sc-note">Qibla and nearby mosque features use the location selected above.</div>'+row("Distance units","Preferred display for distance",'<select id="settingsDistanceUnitV1"><option value="km" '+(get("noor-distance-unit","km")==="km"?"selected":"")+'>Kilometres</option><option value="mi" '+(get("noor-distance-unit","km")==="mi"?"selected":"")+'>Miles</option></select>')+'<div class="momin-sc-actions">'+button("Save distance units","saveDistanceUnitV1()","primary")+button("Open Qibla Finder","go(\'qibla\')")+button("Nearby Mosques","go(\'mosques\')")+'</div>';
    var hijriAdj=get("noor-hijri-adjustment","0");
    var calendar='<div class="momin-sc-note">Hijri dates can vary by local moon sighting. Confirm important dates with a trusted local mosque.</div>'+
      row("Hijri date adjustment","Shift displayed Hijri dates by one day if needed",'<select id="settingsHijriAdjustmentV1"><option value="-1" '+(hijriAdj==="-1"?"selected":"")+'>−1 day</option><option value="0" '+(hijriAdj==="0"?"selected":"")+'>No adjustment</option><option value="1" '+(hijriAdj==="1"?"selected":"")+'>+1 day</option></select>')+
      row("Islamic calendar","View Gregorian and Hijri dates",button("Open Calendar","go(\\'calendar\\')"))+
      row("Islamic occasion reminders","Preference only; not scheduled in background yet",switchControl("settingsIslamicEventsV1",get("noor-islamic-event-reminders","false")==="true"))+
      '<div class="momin-sc-actions">'+button("Save calendar preferences","saveCalendarPrefsV1()","primary")+'</div>';
    var privacy='<div class="momin-sc-note">MOMIN keeps its saved preferences and worship records in this browser. This build has no MOMIN account or cloud sync. Online features may contact the providers described in Privacy details.</div>'+
      '<div class="momin-sc-current"><span>MOMIN data stored in this browser</span><b>'+appStoredKeys+' entries · '+(used/1024).toFixed(1)+' KB</b></div>'+
      row("Online interface translation","When enabled, untranslated interface text snippets and your selected language may be sent to the translation provider.",switchControl("settingsOnlineTranslationV1",get("momin-privacy-online-translation","true")!=="false"))+
      '<div class="momin-sc-actions">'+button("Save privacy preferences","savePrivacyPrefsV1()","primary")+'</div>'+
      row("Import a backup","Merge a MOMIN JSON backup into this browser; matching keys are overwritten after confirmation.",button("Choose backup","document.getElementById('mominImportFileV1').click()"))+
      '<input type="file" id="mominImportFileV1" accept=".json,application/json" style="display:none" onchange="importMominDataV1(this.files&&this.files[0],this)">'+
      row("Reset settings only","Restore preferences while keeping bookmarks, worship records and reading history.",button("Reset settings","resetMominSettingsV1()","danger"))+
      row("Delete MOMIN local data","Permanently remove MOMIN data stored by this browser profile.",button("Delete local data","deleteMominLocalDataV1()","danger"))+
      row("Privacy details","Review what stays on this device and what online features send to external services.",button("View details","showMominPrivacySummaryV1()")); 
    var storage='<div class="momin-sc-current"><span>Estimated MOMIN browser storage in use</span><b>'+(used/1024).toFixed(1)+' KB · '+appStoredKeys+' entries</b></div><p class="momin-sc-help">This estimate covers MOMIN-namespaced localStorage text data only, not audio downloads, browser cache, or files.</p>'+row("Offline content","Download manager is not available in this web build",'<span class="momin-sc-muted">Not available yet</span>');
    var help='<section class="momin-about-v1" aria-label="About MOMIN">'+
      '<div class="momin-about-identity"><img src="./momin-mark.svg?v=islamic-logo-v3" alt="MOMIN Islamic logo"><div><p class="momin-about-kicker">YOUR ISLAMIC DAILY COMPANION</p><h3>MOMIN</h3><p class="momin-about-tagline">Where Faith Meets Devotion</p><span class="momin-about-version">Version 1.1 · Web Companion</span></div></div>'+
      '<div class="momin-about-intro"><h4>Our purpose</h4><p>MOMIN brings useful Islamic worship tools together in one place, supporting your daily prayers, Quran reading, supplications and remembrance of Allah. It is designed to make these everyday practices easier to access from your device.</p></div>'+
      '<h4 class="momin-about-section-title">Explore MOMIN</h4><div class="momin-about-features">'+
      '<article class="momin-about-feature"><span aria-hidden="true">◷</span><div><b>Prayer Times & Adhan</b><p>Check prayer timings using your selected location and calculation preferences, with reminder options while MOMIN is open.</p></div></article>'+
      '<article class="momin-about-feature"><span aria-hidden="true">۞</span><div><b>Holy Quran</b><p>Read Quran verses, choose available translations, and use supported recitation and reading preferences.</p></div></article>'+
      '<article class="momin-about-feature"><span aria-hidden="true">♡</span><div><b>Duas & Tasbeeh</b><p>Explore supplications and keep track of remembrance with the available Tasbeeh tools.</p></div></article>'+
      '<article class="momin-about-feature"><span aria-hidden="true">⌁</span><div><b>Qibla & Nearby Mosques</b><p>Access Qibla direction tools and explore nearby mosque information using location-based features.</p></div></article>'+
      '<article class="momin-about-feature"><span aria-hidden="true">▦</span><div><b>Islamic Calendar</b><p>View Hijri date information and explore Islamic calendar features and occasion preferences.</p></div></article>'+
      '<article class="momin-about-feature"><span aria-hidden="true">文</span><div><b>Personalization & Accessibility</b><p>Adjust appearance, language preference, text size and other supported reading settings.</p></div></article></div>'+
      '<div class="momin-about-transparency"><h4>Privacy & transparency</h4><p>This version runs in guest mode and does not provide an MOMIN account or cloud sync. Supported preferences and activity records are stored in your browser. Some features use external online services, and background notifications are not guaranteed.</p><p>Prayer timings can vary by calculation method. Hijri dates can vary with local moon-sighting practices, so confirm important timings and dates with a trusted local mosque.</p></div>'+
      '<p class="momin-about-footer">Made to support your daily journey of faith.</p>'+
      '</section>'+
      row("Share MOMIN","Share the app link",button("Share MOMIN","shareMominV1()","primary"))+
      row("Privacy & Data","Learn what is stored on this device and what online features may share.",button("View privacy details","showMominPrivacySummaryV1()"));
    var titleHtml=typeof window.title==="function"?window.title("Settings","Your preferences, all in one place","Saved on this device"):'<div class="page-title"><h1>Settings</h1><p>Your preferences, all in one place</p></div>';
    return titleHtml+'<div class="momin-settings-center-v1"><div class="momin-sc-hero"><div class="momin-sc-hero-mark"><img src="./momin-mark.svg?v=islamic-logo-v3" alt="MOMIN Islamic logo"></div><div><p class="momin-sc-eyebrow">MOMIN PREFERENCES</p><h2>Make MOMIN yours</h2><p>Your settings stay on this device unless a feature says otherwise.</p></div></div><div class="momin-sc-groups">'+group("profile","Profile & Account","Guest mode · local preferences",profile,false)+group("appearance","Appearance & Personalization","Theme, contrast, movement",appearance,true)+group("location","Location & Prayer Times",locationLabel()+" · Calculation and Asr preferences",prayer,true)+group("notifications","Notifications & Adhan","Prayer-by-prayer preferences",notifications,false)+group("quran","Quran Reading & Audio","Translation, text size, reciter and playback",quran,false)+group("duas","Duas & Tasbeeh","Arabic size, sound and vibration",duas,false)+group("qibla","Qibla & Nearby Mosques","Location-based tools and distance units",qibla,false)+group("calendar","Islamic Calendar & Events","Hijri dates and occasion preferences",calendar,false)+group("language","Language & Accessibility","Language, text size and motion",language,false)+group("privacy","Privacy & Data","Export and reset preferences",privacy,false)+group("storage","Storage & Offline","Local storage use and availability",storage,false)+group("help","Help & About","Application information",help,false)+'</div><section class="momin-founder-entry" aria-label="About the Founder"><div class="momin-founder-entry-icon"><img src="./momin-mark.svg?v=islamic-logo-v3" alt=""></div><div class="momin-founder-entry-copy"><p class="momin-about-kicker">MEET THE CREATOR</p><h3>About the Founder</h3><p>Learn about the person behind MOMIN and the idea that inspired this Islamic companion.</p></div>'+'<a class="momin-sc-btn primary momin-founder-direct-link" href="/founder.html">Meet the Founder</a>'+'</section><p class="momin-sc-footer-note">Some capabilities—such as cloud sync and reliable background notifications—need additional app infrastructure and are not enabled just by changing a preference.</p></div>';
  }
  window.settingsPage=detailsPage;
  window.mominFounderPageV1=function(){
    ensureMominAboutStylesV1();
    return '<main class="momin-founder-page" aria-labelledby="momin-founder-page-title">'+
      '<button type="button" class="momin-founder-back" onclick="go(&quot;settings&quot;)"><span aria-hidden="true">←</span> Back to Settings</button>'+
      '<section class="momin-founder-page-card">'+
      '<div class="momin-founder-page-ornament" aria-hidden="true"><img src="./momin-mark.svg?v=islamic-logo-v4" alt="MOMIN app logo"></div>'+
      '<div class="momin-founder-page-heading"><p class="momin-about-kicker">THE PERSON BEHIND MOMIN</p><h2 id="momin-founder-page-title">About the Founder</h2><p>Faith, thoughtful design, and technology brought together in one Islamic companion.</p></div>'+
      '<div class="momin-founder-page-photo-wrap"><img class="momin-founder-page-photo" src="./momin-founder-original.png.png?v=20261031-founder-photo-original-v1" alt="Shaik Sameer Basha, founder of MOMIN" fetchpriority="high" decoding="async"></div>'+
      '<div class="momin-founder-page-bio"><h3>Shaik Sameer Basha</h3><p class="momin-founder-page-role"><span aria-hidden="true">✦</span> Artificial Intelligence and Data Science Engineer</p><p>I’m Shaik Sameer Basha, the creator of MOMIN. I built MOMIN with the aim of bringing everyday Islamic tools together in one accessible place, combining my interest in technology with a commitment to making faith-supporting features easier to use.</p><p>My vision for MOMIN is to provide a calm, approachable experience where Muslims can reach useful worship tools, Quran reading, supplications and Islamic information without unnecessary complexity.</p><div class="momin-founder-signature">Where Faith Meets Devotion</div></div>'+
      '</section></main>';
  };
  window.openMominFounderPageV1=function(){
    try{
      if(typeof window.openMominFounderRouteV1==="function"){window.openMominFounderRouteV1();return}
      notify("Founder page navigation is not ready. Refresh MOMIN and try again.");
    }catch(e){
      notify("Unable to open the Founder page. Please refresh MOMIN and try again.");
    }
  };
  window.saveSettingsLocationV1=function(){
    var ce=document.getElementById("settingsCityV1"),co=document.getElementById("settingsCountryV1"),city=ce?ce.value.trim():"",country=co?co.value.trim():"",store=storeObject();
    if(!city||!country){notify("Enter both city and country, or use current GPS location.");return}
    if(!store){notify("Prayer location module is not available. Open Prayer Times to set your location.");return}
    var oldCity=String(store.city||"").trim().toLowerCase(),oldCountry=String(store.country||"").trim().toLowerCase();
    if(city.toLowerCase()!==oldCity||country.toLowerCase()!==oldCountry){store.latitude=null;store.longitude=null;store.city=city;store.country=country}
    put("noor-city",city);put("noor-country",country);
    try{if(typeof persistLocationV5==="function")persistLocationV5()}catch(_){}
    try{if(typeof syncLocationLabels==="function")syncLocationLabels()}catch(_){}
    var summary=document.getElementById("settingsLocationSummaryV1");if(summary)summary.textContent=city+", "+country;
    try{if(typeof loadPrayerData==="function")loadPrayerData()}catch(_){}
    notify("Location saved. Refreshing prayer timings for "+city+", "+country+".");
  };
  window.useSettingsGpsV1=function(){try{if(typeof useCurrentLocationV5==="function")useCurrentLocationV5();else if(typeof setLocation==="function")setLocation();else notify("GPS setup is available from Prayer Times on this build.")}catch(_){notify("Unable to open location permission. Try setting the city manually.")}};
  window.savePrayerBasicsV1=function(){var asr=document.getElementById("settingsAsrMethod");if(asr)put("noor-asr-method",asr.value);var adhanSound=document.getElementById("settingsAdhanSound");if(adhanSound)put("noor-adhan-sound",adhanSound.value);var select=document.getElementById("settingsMethodInput");if(select)window.settingsMethodModeDraftV6=select.value==="auto"?"auto":"manual";if(typeof window.savePrayerSettingsV6==="function")window.savePrayerSettingsV6();else{if(select&&typeof window.setPrayerMethodV5==="function")window.setPrayerMethodV5(select.value);notify("Prayer preferences saved.")}};

  var MominAzanAudioV1=null;
  try{if(get("noor-adhan-sound","")==="")put("noor-adhan-sound","azan")}catch(_){}
  function playMominAzanV1(){
    return new Promise(function(resolve,reject){
      try{
        if(!MominAzanAudioV1){MominAzanAudioV1=new Audio("./makkah-azan-notification.mp3?v=1");MominAzanAudioV1.preload="none";MominAzanAudioV1.loop=false}
        try{MominAzanAudioV1.pause();MominAzanAudioV1.currentTime=0}catch(_){}
        var result=MominAzanAudioV1.play();
        if(result&&typeof result.then==="function")result.then(function(){resolve(true)}).catch(function(error){reject(error)});else resolve(true)
      }catch(error){reject(error)}
    });
  }
  window.previewMominAzanV1=function(){
    playMominAzanV1().then(function(){notify("Makkah Azan playback started. Keep MOMIN open while it plays.")}).catch(function(){notify("Azan file could not be played. Check the uploaded MP3 and browser audio permissions.")});
  };
  /* Open-tab prayer reminder scheduler. It deliberately does not claim background delivery. */
  function localDayKeyV1(date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0")}
  function currentPrayerDataV1(){
    try{if(typeof livePrayer!=="undefined"&&livePrayer&&livePrayer.timings)return {timings:livePrayer.timings,timezone:livePrayer.meta&&livePrayer.meta.timezone}}catch(_){}
    try{if(window.livePrayer&&window.livePrayer.timings)return {timings:window.livePrayer.timings,timezone:window.livePrayer.meta&&window.livePrayer.meta.timezone}}catch(_){}
    try{var cached=JSON.parse(get("noor-prayer-cache","null"));if(cached&&cached.data&&cached.data.timings)return {timings:cached.data.timings,timezone:cached.data.meta&&cached.data.meta.timezone}}catch(_){}
    return null
  }
  function playGentlePrayerChimeV1(){
    try{
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      var ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(880,ctx.currentTime);
      gain.gain.setValueAtTime(0.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.06,ctx.currentTime+0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.7);
      osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.72);
      window.setTimeout(function(){try{ctx.close()}catch(_){}},950);
    }catch(_){}
  }
  window.checkMominPrayerRemindersV1=function(){
    if(get("noor-notifications","true")==="false"||!("Notification" in window)||Notification.permission!=="granted")return;
    var data=currentPrayerDataV1();if(!data)return;
    var now=new Date(),timezone=data.timezone||"",parts={},day;
    try{
      var fmt=new Intl.DateTimeFormat("en-CA",{timeZone:timezone||undefined,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
      fmt.formatToParts(now).forEach(function(x){parts[x.type]=x.value});
      day=parts.year+"-"+parts.month+"-"+parts.day;
    }catch(_){day=localDayKeyV1(now);parts.hour=String(now.getHours()).padStart(2,"0");parts.minute=String(now.getMinutes()).padStart(2,"0")}
    var nowMinute=(Number(parts.hour)||0)*60+(Number(parts.minute)||0);
    var lead=Math.max(0,Math.min(60,Number(get("noor-prayer-reminder-minutes","0"))||0));
    var names=[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","Asr"],["maghrib","Maghrib"],["isha","Isha"]];
    names.forEach(function(p){
      if(get("noor-notify-"+p[0],"true")==="false")return;
      var raw=String(data.timings[p[1]]||data.timings[p[1].toLowerCase()]||"");
      var match=raw.match(/(\d{1,2}):(\d{2})/);if(!match)return;
      var prayerMinute=Number(match[1])*60+Number(match[2]);
      var targetMinute=(prayerMinute-lead+1440)%1440;
      var elapsed=(nowMinute-targetMinute+1440)%1440,key="noor-prayer-reminder-sent-"+day+"-"+p[0];
      if(elapsed>2||get(key,"")==="true")return;
      var sound=get("noor-adhan-sound","azan");
      try{
        new Notification(lead>0?"MOMIN · "+p[1]+" reminder":"MOMIN · "+p[1]+" time",{
          body:lead>0?p[1]+" is coming up in "+lead+" minutes.":"It is time for "+p[1]+".",
          tag:"momin-prayer-"+day+"-"+p[0],
          icon:"/momin-mark.svg"
        });
        put(key,"true");
        if(sound==="chime")playGentlePrayerChimeV1();else if(sound==="azan")playMominAzanV1().catch(function(){notify("Makkah Azan file is missing. Upload makkah-azan-notification.mp3 to the repository root.")});
      }catch(_){}
    });
  };
  window.setInterval(window.checkMominPrayerRemindersV1,30000);
  window.addEventListener("focus",window.checkMominPrayerRemindersV1);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)window.checkMominPrayerRemindersV1()});

  window.saveNotificationPrefsV1=async function(){var master=document.getElementById("settingsPrayerNotificationsV1"),main=document.getElementById("settingsPrayerNotifications"),enabled=master?master.checked:(main?main.checked:false);if(enabled&&"Notification" in window&&Notification.permission==="default"){try{await Notification.requestPermission()}catch(_){}}put("noor-notifications",enabled?"true":"false");PRAYERS.forEach(function(p){var el=document.getElementById("settingsNotify-"+p[0]);if(el)put("noor-notify-"+p[0],el.checked?"true":"false")});var minutes=document.getElementById("settingsReminderMinutesV1");if(minutes)put("noor-prayer-reminder-minutes",minutes.value);if(enabled&&"Notification" in window&&Notification.permission!=="granted")notify("Preferences saved, but notifications are not permitted by this browser. Enable this site in browser settings.");else notify("Notification preferences saved. Prayer reminders can be checked while MOMIN is open; browser background delivery is not guaranteed.");if(typeof window.checkMominPrayerRemindersV1==="function")window.checkMominPrayerRemindersV1()};
  window.testMominNotificationV1=async function(){if(!("Notification" in window)){notify("This browser does not support web notifications.");return}var permission=Notification.permission;if(permission==="default"){try{permission=await Notification.requestPermission()}catch(_){permission="denied"}}if(permission!=="granted"){notify("Notifications are not permitted. Check this site's browser permission.");return}try{new Notification("MOMIN notification test",{body:"Test only. Azan audio plays within MOMIN while this page is active."});var sound=(document.getElementById("settingsAdhanSound")||{}).value||get("noor-adhan-sound","azan");if(sound==="azan")playMominAzanV1().then(function(){notify("Test notification sent; Azan playback started.")}).catch(function(){notify("Notification sent, but the Azan file could not be played.")});else if(sound==="chime"){playGentlePrayerChimeV1();notify("Test notification sent with the in-app chime.")}else notify("Test notification sent. Your device may use its system sound.")}catch(_){notify("The browser could not display a notification.")}};
  window.saveQuranDefaultsV1=function(){
    var edition=document.getElementById("settingsQuranTranslation"),size=document.getElementById("settingsQuranArabicSizeV1"),meaning=document.getElementById("settingsQuranMeaningV1"),translit=document.getElementById("settingsQuranTranslitV1"),mode=document.getElementById("settingsQuranModeV1"),reciter=document.getElementById("settingsReciterV1"),speed=document.getElementById("settingsQuranSpeedV1"),repeat=document.getElementById("settingsQuranRepeatV1"),next=document.getElementById("settingsQuranNextV1"),theme=document.getElementById("settingsQuranReaderThemeV1"),awake=document.getElementById("settingsKeepAwake");
    if(edition){put("noor-quran-edition",edition.value);var opts=window.quranTranslationsV5||[],selected=opts.find?opts.find(function(x){return x.id===edition.value}):null;if(selected&&selected.language)put("noor-quran-edition-language",selected.language)}
    if(size){put("noor-quran-arabic-size",size.value);try{if(typeof setQuranArabicSize==="function")setQuranArabicSize(Number(size.value))}catch(_){}}
    if(meaning&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.showMeaning(meaning.checked);
    if(translit&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.showTranslit(translit.checked);
    if(mode&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.mode(mode.value);else if(mode)put("noor-quran-reading-mode-v8",mode.value);
    if(reciter&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.reciter(reciter.value);else if(reciter)put("noor-quran-reciter-v8",reciter.value);
    if(speed&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.speed(speed.value);else if(speed)put("noor-quran-audio-speed-v8",speed.value);
    if(repeat&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.repeat(repeat.checked);else if(repeat)put("noor-quran-repeat-v8",repeat.checked);
    if(next&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.next(next.checked);else if(next)put("noor-quran-auto-next-v8",next.checked);
    if(theme&&window.MominQuranSettingsV8)window.MominQuranSettingsV8.theme(theme.value);else if(theme)put("noor-quran-theme",theme.value);
    if(awake){put("noor-keep-awake-v8",awake.checked?"true":"false");if(window.MominQuranSettingsV8)window.MominQuranSettingsV8.keepAwake(awake.checked)}
    
    notify("Quran defaults saved for future reading sessions.");
  };
  function applyAccessibility(){var root=document.documentElement;root.classList.toggle("momin-reduce-motion",get("noor-reduce-motion","false")==="true");root.classList.toggle("momin-high-contrast",get("noor-high-contrast","false")==="true");root.classList.remove("momin-scale-large","momin-scale-larger");var scale=get("noor-interface-scale","normal");if(scale==="large"||scale==="larger")root.classList.add("momin-scale-"+scale)}

  function effectiveThemePreferenceV1(value){
    if(value==="Light"||value==="Sepia")return value;if(value==="Dark")return "Dark";
    try{return window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"Light":"Dark"}catch(_){return "Dark"}
  }
  window.saveSettingsThemeV1=function(value){
    var pref=["System","Light","Dark","Sepia"].indexOf(value)>=0?value:"Dark";
    put("noor-theme-preference",pref);
    var resolved=effectiveThemePreferenceV1(pref);
    if(typeof window.setTheme==="function")window.setTheme(resolved);
    document.documentElement.setAttribute("data-theme",resolved.toLowerCase());
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",resolved==="Dark"?"#0d0c0a":resolved==="Sepia"?"#eee4cf":"#f5f1e7");
    return resolved;
  };
  function syncSystemThemePreferenceV1(){
    if(get("noor-theme-preference","")!=="System")return;
    window.saveSettingsThemeV1("System");
  }
  try{
    var systemThemeMediaV1=window.matchMedia("(prefers-color-scheme: light)");
    if(systemThemeMediaV1.addEventListener)systemThemeMediaV1.addEventListener("change",syncSystemThemePreferenceV1);
    else if(systemThemeMediaV1.addListener)systemThemeMediaV1.addListener(syncSystemThemePreferenceV1);
  }catch(_){}
  syncSystemThemePreferenceV1();

  window.saveAppearancePrefsV1=function(){var theme=document.getElementById("settingsTheme");if(theme)window.saveSettingsThemeV1(theme.value);var reduce=document.getElementById("settingsReduceMotionV1"),contrast=document.getElementById("settingsHighContrastV1");if(reduce)put("noor-reduce-motion",reduce.checked);if(contrast)put("noor-high-contrast",contrast.checked);applyAccessibility();notify("Appearance preferences saved.")};
  window.saveLanguageAccessibilityV1=function(){var language=document.getElementById("settingsAppLanguage"),scale=document.getElementById("settingsInterfaceScaleV1"),reduce=document.getElementById("settingsReduceMotionLangV1");if(language){put("noor-language",language.value);document.documentElement.lang=language.value;if(typeof window.setMominLanguageV1==="function")window.setMominLanguageV1(language.value)}if(scale)put("noor-interface-scale",scale.value);if(reduce)put("noor-reduce-motion",reduce.checked);applyAccessibility();notify("Language and accessibility preferences saved. Interface translation may require an internet connection.")};
  window.saveDuaTasbihPrefsV1=function(){var size=document.getElementById("settingsDuaArabicSizeV1");if(size){put("noor-dua-prototype-text-size",size.value);if(window.MominDuasSettingsV1)window.MominDuasSettingsV1.setArabicSize(size.value)}var sound=document.getElementById("settingsTasbihSoundV1"),haptic=document.getElementById("settingsTasbihHapticV1"),state={};try{state=JSON.parse(get("noor-tsb-v2","{}"))||{}}catch(_){}if(sound)state.sound=sound.checked;if(haptic)state.haptic=haptic.checked;put("noor-tsb-v2",JSON.stringify(state));if(window.MominTasbihSettingsV1)window.MominTasbihSettingsV1.setPreferences({sound:!!state.sound,haptic:!!state.haptic});notify("Duas and Tasbeeh preferences saved on this device.")};
  window.saveDistanceUnitV1=function(){var x=document.getElementById("settingsDistanceUnitV1");if(x)put("noor-distance-unit",x.value);notify("Distance preference saved.")};
  window.saveCalendarPrefsV1=function(){var x=document.getElementById("settingsIslamicEventsV1"),adj=document.getElementById("settingsHijriAdjustmentV1");if(x)put("noor-islamic-event-reminders",x.checked);if(adj){var n=Number(adj.value);if(n!==-1&&n!==0&&n!==1)n=0;put("noor-hijri-adjustment",n)}notify("Calendar preferences saved. Reopen the Calendar if it does not refresh immediately. Background event reminders are not scheduled in this web build.")};
  window.exportMominDataV1=function(){try{var data={app:"MOMIN",schemaVersion:1,exportedAt:new Date().toISOString(),note:"Backup of MOMIN-namespaced browser storage only. Import only into a MOMIN instance you trust.",localStorage:{}};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i)||"";if(k.indexOf("noor-")===0||k.indexOf("momin")===0)data.localStorage[k]=localStorage.getItem(k)}data.entryCount=Object.keys(data.localStorage).length;var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="momin-local-data-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);notify("Your MOMIN local data export is ready.")}catch(_){notify("Could not export browser data in this environment.")}};
  window.savePrivacyPrefsV1=function(){
    var toggle=document.getElementById("settingsOnlineTranslationV1");
    if(toggle){
      put("momin-privacy-online-translation",toggle.checked?"true":"false");
      if(typeof window.setMominLanguageV1==="function")window.setMominLanguageV1(get("noor-language","en"));
    }
    notify(toggle&&!toggle.checked?"Privacy preferences saved. Online interface translation is disabled; cached translations may still be used.":"Privacy preferences saved. Online interface translation is enabled.");
  };
  window.importMominDataV1=function(file,input){
    if(input)input.value="";
    if(!file)return;
    if(file.size>4*1024*1024){notify("Backup is larger than 4 MB. Choose a smaller MOMIN export.");return;}
    var read=file.text?file.text():new Promise(function(resolve,reject){
      var reader=new FileReader();
      reader.onload=function(){resolve(String(reader.result||""));};
      reader.onerror=reject;
      reader.readAsText(file);
    });
    read.then(function(text){
      var backup;
      try{backup=JSON.parse(text)}catch(_){throw new Error("This file is not valid JSON.");}
      if(!backup||backup.app!=="MOMIN"||!backup.localStorage||typeof backup.localStorage!=="object"||Array.isArray(backup.localStorage))throw new Error("This is not a supported MOMIN data backup.");
      var incoming=backup.localStorage,keys=Object.keys(incoming),accepted=[],skipped=0,total=0;
      if(keys.length>1500)throw new Error("This backup contains too many entries to import safely.");
      keys.forEach(function(key){
        var value=incoming[key],appKey=key.indexOf("noor-")===0||key.indexOf("momin")===0;
        if(!appKey){skipped++;return;}
        if(typeof value!=="string"||key.length>200||value.length>500000)throw new Error("The backup contains an unsupported or oversized value.");
        total+=key.length+value.length;
        if(total>3*1024*1024)throw new Error("The MOMIN data in this backup exceeds the 3 MB safety limit.");
        accepted.push([key,value]);
      });
      if(!accepted.length)throw new Error("No supported MOMIN data keys were found in this backup.");
      if(!confirm("Import "+accepted.length+" MOMIN entries? Existing values with matching keys will be overwritten. Export a backup of this browser first if you may need the current data."))return;
      var previous=[];
      try{
        accepted.forEach(function(pair){
          var exists=localStorage.getItem(pair[0]);
          previous.push([pair[0],exists!==null,exists]);
          localStorage.setItem(pair[0],pair[1]);
        });
      }catch(error){
        for(var i=previous.length-1;i>=0;i--){try{if(previous[i][1])localStorage.setItem(previous[i][0],previous[i][2]);else localStorage.removeItem(previous[i][0]);}catch(_){}}
        throw new Error("The browser could not store the full backup. Existing data was restored where possible.");
      }
      try{if(typeof window.setMominLanguageV1==="function")window.setMominLanguageV1(get("noor-language","en"));}catch(_){}
      try{applyAccessibility();}catch(_){}
      try{if(typeof window.render==="function")window.render();}catch(_){}
      notify("Imported "+accepted.length+" MOMIN entries."+(skipped?" Ignored "+skipped+" unrelated entries.":""));
    }).catch(function(error){notify(error&&error.message?error.message:"Could not import this backup.");});
  };
  window.deleteMominLocalDataV1=function(){
    if(!confirm("Permanently delete MOMIN data saved in this browser? This removes preferences, prayer check-ins, bookmarks, favorites, local reflections, history and cached translations. It cannot erase files you previously downloaded or data already sent to third-party services."))return;
    var keys=[];
    try{for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i)||"";if(key.indexOf("noor-")===0||key.indexOf("momin")===0)keys.push(key);}}catch(_){}
    try{keys.forEach(function(key){localStorage.removeItem(key);});}catch(_){notify("Some local data could not be removed. Check browser storage permissions.");return;}
    try{var sessionKeys=[];for(var j=0;j<sessionStorage.length;j++){var sessionKey=sessionStorage.key(j)||"";if(sessionKey.indexOf("noor-")===0||sessionKey.indexOf("momin")===0)sessionKeys.push(sessionKey)}sessionKeys.forEach(function(key){sessionStorage.removeItem(key);});}catch(_){}
    document.documentElement.lang="en";document.documentElement.dir="ltr";
    notify("MOMIN local data deleted. Reloading with default settings.");
    window.setTimeout(function(){window.location.reload();},900);
  };
  window.resetMominSettingsV1=function(){if(!confirm("Reset MOMIN settings only? Quran/Dua bookmarks, Tasbeeh counts and reading history will be kept."))return;["noor-theme","noor-theme-preference","noor-language","noor-interface-scale","noor-reduce-motion","noor-high-contrast","noor-method-mode","noor-method","noor-asr-method","noor-notifications","noor-adhan-sound","noor-prayer-reminder-minutes","noor-quran-edition","noor-quran-edition-language","noor-quran-arabic-size","noor-quran-show-translation-v8","noor-quran-show-transliteration-v8","noor-quran-reading-mode-v8","noor-quran-reciter-v8","noor-quran-audio-speed-v8","noor-quran-repeat-v8","noor-quran-auto-next-v8","noor-quran-theme","noor-keep-awake-v8","noor-distance-unit","noor-hijri-adjustment","noor-islamic-event-reminders","noor-dua-prototype-text-size","noor-keep-awake","momin-privacy-online-translation"].forEach(function(k){try{localStorage.removeItem(k)}catch(_){}});PRAYERS.forEach(function(p){try{localStorage.removeItem("noor-notify-"+p[0])}catch(_){}});try{var reminderKeys=[];for(var r=0;r<localStorage.length;r++){var rk=localStorage.key(r);if(rk&&rk.indexOf("noor-prayer-reminder-sent-")===0)reminderKeys.push(rk)}reminderKeys.forEach(function(rk){localStorage.removeItem(rk)})}catch(_){}try{if(typeof window.setTheme==="function")window.setTheme("Dark")}catch(_){}try{if(typeof window.render==="function")window.render()}catch(_){}notify("Settings reset. Bookmarks, reading history and Tasbeeh counts were kept.")};
  window.showMominPrivacySummaryV1=function(){
    var existing=document.getElementById("mominPrivacyDetailsDialogV1");if(existing){if(!existing.open)existing.showModal();return;}
    var dialog=document.createElement("dialog");
    dialog.id="mominPrivacyDetailsDialogV1";
    dialog.setAttribute("aria-labelledby","mominPrivacyTitleV1");
    dialog.innerHTML='<form method="dialog" class="momin-privacy-dialog-form">'+
      '<div class="momin-privacy-dialog-head"><div><p class="momin-privacy-eyebrow">YOUR DATA, YOUR CHOICE</p><h2 id="mominPrivacyTitleV1">Privacy & Data</h2></div><button class="momin-privacy-close" aria-label="Close privacy details" value="close">×</button></div>'+
      '<p class="momin-privacy-intro">MOMIN stores preferences and many reading and worship records on this device. When you sign in, your profile and device-management details are handled by the MOMIN account service. This does not mean every app feature is cloud-synchronised.</p>'+
      '<section><h3>Saved on this device</h3><ul><li>Preferences such as theme, language, prayer calculation method and accessibility settings.</li><li>Prayer check-ins, Tasbeeh totals, saved Duas, Quran bookmarks and recent reading records when those features save them.</li><li>Location preferences and cached interface translations used to make the app work faster.</li></ul></section>'+
      '<section><h3>When online services are used</h3><ul><li>Prayer-time requests may send the selected city/country or coordinates and date to the AlAdhan service.</li><li>When online interface translation is enabled, text snippets that need translating and the selected target language are sent to the translation provider. Turn the setting off to stop new online translation requests; translations already cached on this device can still be used.</li><li>Mosque search or directions can open third-party map services, which receive the search area or destination you choose.</li></ul></section>'+
      '<section><h3>Import and deletion</h3><p>Import accepts compatible MOMIN JSON backups and only restores keys prefixed with <code>noor-</code> or <code>momin</code>. Delete local data removes MOMIN-namespaced browser storage and cached translations for this browser profile; it cannot erase files already downloaded or information previously received by external providers.</p></section>'+
      '<p class="momin-privacy-foot">Your browser can retain local data until you remove it. If you have an older MOMIN backup file, keep it private because it may contain activity and preferences.</p>'+
      '<div class="momin-privacy-actions"><button class="momin-privacy-done" value="close">Done</button></div>'+
      '</form>';
    var style=document.createElement("style");style.textContent=
      '#mominPrivacyDetailsDialogV1{width:min(690px,calc(100vw - 28px));max-height:86vh;overflow:auto;padding:0;border:1px solid var(--line);border-radius:22px;background:var(--paper);color:var(--ink);box-shadow:0 24px 90px #0005}'+
      '#mominPrivacyDetailsDialogV1::backdrop{background:#07110ed1;backdrop-filter:blur(4px)}'+
      '.momin-privacy-dialog-form{padding:22px}.momin-privacy-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);padding-bottom:14px}.momin-privacy-eyebrow{font-size:10px;font-weight:700;letter-spacing:.14em;color:var(--gold);margin:0 0 7px}.momin-privacy-dialog-head h2{margin:0;font:600 26px var(--serif)}.momin-privacy-close{border:1px solid var(--line);background:transparent;border-radius:11px;width:38px;height:38px;font-size:25px}.momin-privacy-intro{line-height:1.65;color:var(--muted);font-size:13px}.momin-privacy-dialog-form section{padding:12px 0;border-bottom:1px solid var(--line)}.momin-privacy-dialog-form section h3{font-size:15px;margin:0 0 8px}.momin-privacy-dialog-form ul,.momin-privacy-dialog-form p{line-height:1.65;font-size:13px}.momin-privacy-dialog-form ul{padding-left:20px}.momin-privacy-dialog-form li{margin:7px 0}.momin-privacy-foot{color:var(--muted)}.momin-privacy-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}.momin-privacy-actions button{border:1px solid var(--line);padding:10px 14px;border-radius:10px;background:var(--paper);color:var(--ink);font:600 12px var(--sans)}.momin-privacy-actions .momin-privacy-export{background:var(--green);color:#fff;border-color:var(--green)}';
    dialog.appendChild(style);document.body.appendChild(dialog);
    dialog.addEventListener("close",function(){dialog.remove();},{once:true});
    dialog.showModal();
  };
  window.showMominAboutV1=function(){notify("MOMIN — Where Faith Meets Devotion. This web companion includes prayer tools, Quran, Duas, Tasbeeh, Qibla, Mosques and an Islamic calendar. Some background and sync features are not yet available.")};
  window.shareMominV1=async function(){var data={title:"MOMIN — Where Faith Meets Devotion",text:"Explore MOMIN, your Islamic daily companion.",url:location.origin+location.pathname};try{if(navigator.share){await navigator.share(data);return}if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(data.url);notify("MOMIN link copied.");return}}catch(_){return}notify("Open the app URL in your browser to share MOMIN.")};
  document.addEventListener("change",function(e){if(e.target&&e.target.id==="settingsTheme")window.saveAppearancePrefsV1()});
  applyAccessibility();
})();
