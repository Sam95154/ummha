/* MOMIN Quran reader settings V8 — Display / Text / Audio */
(function(){
"use strict";
var settingsOpen=false, translationPickerOpen=false, textEditionCache=Object.create(null), wakeLock=null;
var languageItems=[
["as","Assamese","অসমীয়া","as"],["bn","Bengali","বাংলা","bn"],["brx","Bodo","बड़ो","hi"],["doi","Dogri","डोगरी","hi"],
["gu","Gujarati","ગુજરાતી","gu"],["hi","Hindi","हिन्दी","hi"],["kn","Kannada","ಕನ್ನಡ","kn"],["ks","Kashmiri","کٲشُر","ur"],
["kok","Konkani","कोंकणी","hi"],["mai","Maithili","मैथिली","hi"],["ml","Malayalam","മലയാളം","ml"],["mni","Manipuri (Meitei)","মৈতৈলোন্","bn"],
["mr","Marathi","मराठी","mr"],["ne","Nepali","नेपाली","ne"],["or","Odia","ଓଡ଼ିଆ","or"],["pa","Punjabi","ਪੰਜਾਬੀ","pa"],
["sa","Sanskrit","संस्कृतम्","hi"],["sat","Santali","ᱥᱟᱱᱛᱟᲛ","bn"],["sd","Sindhi","سنڌي","ur"],["ta","Tamil","தமிழ்","ta"],
["te","Telugu","తెలుగు","te"],["ur","Urdu","اردو","ur"]
];
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function saved(key,fallback){var v=localStorage.getItem(key);return v===null?fallback:v}
function currentTranslationId(){return localStorage.getItem("noor-quran-edition")||"en.sahih"}
function safeReaderOptions(html){
 var m=html.match(/<select aria-label="Quran translation language"[\s\S]*?<\/select>/);
 return m?m[0].replace(/^<select[^>]*>/,"").replace(/<\/select>$/,""):'<option value="en.sahih" selected>English — Saheeh International</option>';
}
function safeTranslitOptions(html){
 var m=html.match(/<select id="readerTranslitLanguageV7"[\s\S]*?<\/select>/);
 return m?m[0].replace(/^<select[^>]*>/,"").replace(/<\/select>$/,""):languageItems.map(function(x){return '<option value="'+x[0]+'">'+x[1]+' — '+x[2]+'</option>'}).join("");
}
function transLabel(id,optsHtml){
 var box=document.createElement("select");box.innerHTML=optsHtml;
 var option=Array.prototype.find.call(box.options,function(o){return o.value===id});
 return option?option.textContent:"English — Saheeh International";
}
function mode(){return saved("noor-quran-reading-mode-v8","list")}
function theme(){
 var value=String(saved("noor-quran-theme","paper")).toLowerCase();
 if(value==="dark")value="night";
 if(value==="light")value="white";
 if(value==="sepia")value="paper";
 if(["paper","white","night"].indexOf(value)<0)value="paper";
 return value;
}
function toggleRow(label,id,checked,handler){return '<div class="momin-quran-switch-row"><span>'+label+'</span><label class="momin-quran-switch"><input id="'+id+'" type="checkbox" '+(checked?'checked':'')+' onchange="'+handler+'(this.checked)"><span class="momin-quran-switch-track"></span></label></div>'}
function buildModal(oldHtml){
 var tab=saved("noor-quran-settings-tab-v8","display"),tm=theme(),script=saved("noor-quran-script-v8","uthmani");
 var showMeaning=saved("noor-quran-show-translation-v8",saved("noor-quran-translation","true"))!=="false";
 var showTranslit=saved("noor-quran-show-transliteration-v8","false")==="true";
 var showTajweed=saved("noor-quran-show-tajweed-v8","false")==="true";
 var awake=saved("noor-keep-awake-v8","false")==="true",translit=saved("noor-quran-translit-language","en");
 var transOptions=safeReaderOptions(oldHtml),translitOptions=safeTranslitOptions(oldHtml);
 var transLabelText=transLabel(currentTranslationId(),transOptions);
 var reciter=saved("noor-quran-reciter-v8",window.readerAudioEdition||"ar.alafasy");
 var validReciters=["ar.alafasy","ar.abdurrahmaansudais","ar.husary","ar.minshawi","ar.mahermuaiqly","ar.shaatree"];
 if(validReciters.indexOf(reciter)<0)reciter="ar.alafasy";
 localStorage.setItem("noor-quran-reciter-v8",reciter);
 window.readerAudioEdition=reciter;
 window.readerAudioReciter=({"ar.alafasy":"Mishary Rashid Alafasy","ar.abdurrahmaansudais":"Abdurrahman As-Sudais","ar.husary":"Mahmoud Khalil Al-Husary","ar.minshawi":"Mohamed Siddiq Al-Minshawi","ar.mahermuaiqly":"Maher Al-Muaiqly","ar.shaatree":"Abu Bakr Ash-Shaatree"})[reciter];
 var speed=Number(saved("noor-quran-audio-speed-v8",window.readerSpeed||1));
 var repeat=saved("noor-quran-repeat-v8","false")==="true",autoNext=saved("noor-quran-auto-next-v8","false")==="true";
 var themes=
 '<button class="momin-quran-theme-card '+(tm==="white"?"selected":"")+'" data-theme-v8="white" type="button" onclick="window.MominQuranSettingsV8.theme(&quot;white&quot;)"><span class="momin-quran-theme-ar" lang="ar" dir="rtl">بِسْمِ اللَّهِ</span><span>Modern</span></button>'+
 '<button class="momin-quran-theme-card paper '+(tm==="paper"?"selected":"")+'" data-theme-v8="paper" type="button" onclick="window.MominQuranSettingsV8.theme(&quot;paper&quot;)"><span class="momin-quran-theme-ar" lang="ar" dir="rtl">بِسْمِ اللَّهِ</span><span>Paper</span></button>'+
 '<button class="momin-quran-theme-card dark '+(tm==="night"?"selected":"")+'" data-theme-v8="night" type="button" onclick="window.MominQuranSettingsV8.theme(&quot;night&quot;)"><span class="momin-quran-theme-ar" lang="ar" dir="rtl">بِسْمِ اللَّهِ</span><span>Dark</span></button>';
 var scripts=[["uthmani","بِسْمِ اللَّهِ","Uthmani"],["indopak","بِسْمِ الله","IndoPak"],["simple","بسم الله","No diacritics or symbols"],["mushaf","بِسْمِ اللَّهِ","Mushaf Al-Qur’an S."]];
 var scriptCards=scripts.map(function(x){return '<button type="button" class="momin-quran-script-card '+(script===x[0]?"selected":"")+'" data-script-v8="'+x[0]+'" aria-pressed="'+(script===x[0])+'" onclick="window.MominQuranSettingsV8.script(&quot;'+x[0]+'&quot;)"><span class="momin-quran-script-sample" lang="ar" dir="rtl">'+x[1]+'</span><span>'+x[2]+'</span></button>'}).join("");
 var reciters=[["ar.alafasy","Mishary Rashid Alafasy"],["ar.abdurrahmaansudais","Abdurrahman As-Sudais"],["ar.husary","Mahmoud Khalil Al-Husary"],["ar.minshawi","Mohamed Siddiq Al-Minshawi"],["ar.mahermuaiqly","Maher Al-Muaiqly"],["ar.shaatree","Abu Bakr Ash-Shaatree"]];
 var reciterOptions=reciters.map(function(x){return '<option value="'+x[0]+'" '+(reciter===x[0]?"selected":"")+'>'+x[1]+'</option>'}).join("");
 var speedOptions=[0.75,1,1.25,1.5].map(function(x){return '<option value="'+x+'" '+(speed===x?"selected":"")+'>'+x+'×</option>'}).join("");
 return '<div class="reader-settings momin-reader-settings-v8 momin-settings-'+(tm==="night"?"night":tm==="white"?"white":"paper")+'-v8" id="readerSettings" '+(settingsOpen?"":"hidden")+'>'+
 '<div class="momin-quran-settings-header"><strong>Settings</strong><button type="button" class="momin-quran-settings-close" aria-label="Close settings" onclick="window.MominQuranSettingsV8.close()">×</button></div>'+
 '<div class="momin-quran-settings-tabs" role="tablist" aria-label="Quran settings">'+
 '<button type="button" role="tab" data-tab-v8="display" aria-selected="'+(tab==="display")+'" class="'+(tab==="display"?"active":"")+'" onclick="window.MominQuranSettingsV8.tab(&quot;display&quot;)">Display</button>'+
 '<button type="button" role="tab" data-tab-v8="text" aria-selected="'+(tab==="text")+'" class="'+(tab==="text"?"active":"")+'" onclick="window.MominQuranSettingsV8.tab(&quot;text&quot;)">Text</button>'+
 '<button type="button" role="tab" data-tab-v8="audio" aria-selected="'+(tab==="audio")+'" class="'+(tab==="audio"?"active":"")+'" onclick="window.MominQuranSettingsV8.tab(&quot;audio&quot;)">Audio</button></div>'+
 '<section class="momin-quran-settings-pane" data-pane-v8="display" '+(tab!=="display"?"hidden":"")+'>'+
 '<h3>Themes</h3><div class="momin-quran-themes">'+themes+'</div>'+
 '<h3>Text Size</h3><div class="momin-quran-range-card"><span>A</span><input aria-label="Arabic text size" type="range" min="34" max="58" step="1" value="'+(window.readerArabicSize?readerArabicSize():48)+'" oninput="setQuranArabicSize(this.value);document.getElementById(&quot;quranTextSizeValueV8&quot;).textContent=this.value"><span>A</span><output id="quranTextSizeValueV8">'+(window.readerArabicSize?readerArabicSize():48)+'</output></div>'+
 '<h3>Reading mode</h3><div class="momin-quran-reading-modes"><button type="button" data-mode-v8="list" class="'+(mode()==="list"?"selected":"")+'" aria-pressed="'+(mode()==="list")+'" onclick="window.MominQuranSettingsV8.mode(&quot;list&quot;)"><span aria-hidden="true">☷</span><span>List</span></button><button type="button" data-mode-v8="page" class="'+(mode()==="page"?"selected":"")+'" aria-pressed="'+(mode()==="page")+'" onclick="window.MominQuranSettingsV8.mode(&quot;page&quot;)"><span aria-hidden="true">▤</span><span>Page</span></button></div>'+
 toggleRow("Keep screen on while reading","mominKeepAwakeV8",awake,"window.MominQuranSettingsV8.keepAwake")+
 '</section>'+
 '<section class="momin-quran-settings-pane" data-pane-v8="text" '+(tab!=="text"?"hidden":"")+'>'+
 '<h3>Script option <span class="momin-quran-info" title="Script editions are loaded when available.">ⓘ</span></h3><div class="momin-quran-script-options">'+scriptCards+'</div>'+
 toggleRow("Show Tajweed colours","mominTajweedV8",showTajweed,"window.MominQuranSettingsV8.tajweed")+
 '<h3 class="momin-quran-subhead">Translation</h3>'+toggleRow("Show translation","mominShowTranslationV8",showMeaning,"window.MominQuranSettingsV8.showMeaning")+
 '<button type="button" class="momin-quran-selected-translation" onclick="window.MominQuranSettingsV8.toggleTranslationPicker()" aria-expanded="'+translationPickerOpen+'"><span><strong>Selected translation</strong><small id="mominSelectedTranslationLabelV8">'+esc(transLabelText)+'</small></span><span class="momin-quran-chevron">›</span></button>'+
 '<div id="mominTranslationPickerV8" class="momin-quran-translation-picker" '+(translationPickerOpen?"":"hidden")+'><input type="search" id="mominTranslationSearchV8" placeholder="Search translations and Indian languages" oninput="window.MominQuranSettingsV8.search(this.value)"><select id="quranTranslationSelectV8" aria-label="Quran translation language" size="7" onchange="window.MominQuranSettingsV8.translation(this.value)">'+transOptions+'</select><p class="momin-quran-settings-hint">All 22 scheduled Indian languages are represented. Editions without a connected Quran translation are disabled.</p></div>'+
 '<h3 class="momin-quran-subhead">Transliteration</h3>'+toggleRow("Show transliteration","mominShowTransliterationV8",showTranslit,"window.MominQuranSettingsV8.showTranslit")+
 '<label class="momin-quran-field"><span>Transliteration language</span><select id="readerTranslitLanguageV8" aria-label="Arabic transliteration language" onchange="window.MominQuranSettingsV8.translit(this.value)">'+translitOptions+'</select></label>'+
 '<p class="momin-quran-settings-hint" id="readerTranslitNoteV7">Transliteration is pronunciation written in another script, not a translation of the ayah meaning.</p>'+
 '</section>'+
 '<section class="momin-quran-settings-pane" data-pane-v8="audio" '+(tab!=="audio"?"hidden":"")+'>'+
 '<h3>Recitation</h3><label class="momin-quran-field"><span>Reciter</span><select id="mominQuranReciterV8" onchange="window.MominQuranSettingsV8.reciter(this.value)">'+reciterOptions+'</select></label>'+
 '<h3>Playback</h3><label class="momin-quran-field"><span>Playback speed</span><select id="mominQuranSpeedV8" onchange="window.MominQuranSettingsV8.speed(this.value)">'+speedOptions+'</select></label>'+
 toggleRow("Repeat surah","mominRepeatSurahV8",repeat,"window.MominQuranSettingsV8.repeat")+
 toggleRow("Play next surah automatically","mominAutoNextV8",autoNext,"window.MominQuranSettingsV8.next")+
 '<p class="momin-quran-settings-hint">Audio options apply to the Quran reader’s recitation player. Reciter availability depends on the connection.</p>'+
 '</section><div class="momin-quran-settings-footer"><button type="button" class="momin-quran-reset-button" onclick="window.MominQuranSettingsV8.reset()">↺ <span>Reset to default</span></button><button type="button" class="momin-quran-save-button" onclick="window.MominQuranSettingsV8.save()">✓ <span>Save settings</span></button></div></div>';
}
var priorReaderSettingsV8=quranReaderPageV2;
quranReaderPageV2=function(){
 var html=priorReaderSettingsV8();
 var start=html.indexOf('<div class="reader-settings" id="readerSettings" hidden>');
 if(start<0)start=html.indexOf('<div class="reader-settings" id="readerSettings"');
 var end=start>=0?html.indexOf('<div class="reading-goal">',start):-1;
 if(start<0||end<0)return html;
 return html.slice(0,start)+buildModal(html)+html.slice(end);
};
function applyReaderSettingsV8(){
 var root=document.querySelector(".quran-reader");
 if(root){
  root.classList.remove("reader-translations-hidden");
  var meaning=saved("noor-quran-show-translation-v8",saved("noor-quran-translation","true"))!=="false";
  var translit=saved("noor-quran-show-transliteration-v8","false")==="true";
  var activeTheme=theme(),arabicSize=Math.max(34,Math.min(58,Number(saved("noor-quran-arabic-size","48"))||48));
  root.classList.toggle("reader-night",activeTheme==="night");
  root.classList.toggle("reader-white",activeTheme==="white");
  root.classList.toggle("reader-meaning-hidden",!meaning);
  root.classList.toggle("reader-translit-hidden",!translit);
  root.classList.toggle("reader-page-mode",mode()==="page");
  root.classList.toggle("reader-tajweed-enabled",saved("noor-quran-show-tajweed-v8","false")==="true");
  root.style.setProperty("--quran-arabic-size",arabicSize+"px");
 }
 var panel=document.getElementById("readerSettings");
 if(panel){
  panel.hidden=!settingsOpen;
  panel.querySelectorAll("[data-tab-v8]").forEach(function(b){var on=b.getAttribute("data-tab-v8")===saved("noor-quran-settings-tab-v8","display");b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on))});
  panel.querySelectorAll("[data-pane-v8]").forEach(function(p){p.hidden=p.getAttribute("data-pane-v8")!==saved("noor-quran-settings-tab-v8","display")});
  panel.querySelectorAll("[data-theme-v8]").forEach(function(b){var on=b.getAttribute("data-theme-v8")===theme();b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on))});
  panel.querySelectorAll("[data-script-v8]").forEach(function(b){var on=b.getAttribute("data-script-v8")===saved("noor-quran-script-v8","uthmani");b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on))});
  function check(id,key,fallback){var el=document.getElementById(id);if(el)el.checked=saved(key,fallback)==="true"}
  check("mominKeepAwakeV8","noor-keep-awake-v8","false");
  check("mominShowTranslationV8","noor-quran-show-translation-v8",saved("noor-quran-translation","true"));
  check("mominShowTransliterationV8","noor-quran-show-transliteration-v8","false");
  check("mominTajweedV8","noor-quran-show-tajweed-v8","false");
  check("mominRepeatSurahV8","noor-quran-repeat-v8","false");
  check("mominAutoNextV8","noor-quran-auto-next-v8","false");
  var tr=document.getElementById("readerTranslitLanguageV8");if(tr){var savedTranslit=saved("noor-quran-translit-language","en");tr.value=savedTranslit;if(tr.selectedIndex<0){tr.value="en";localStorage.setItem("noor-quran-translit-language","en")}}
  var pick=document.getElementById("quranTranslationSelectV8");if(pick)pick.value=currentTranslationId();
  var label=document.getElementById("mominSelectedTranslationLabelV8");
  if(label&&pick){var sel=Array.prototype.find.call(pick.options,function(o){return o.value===currentTranslationId()});if(sel)label.textContent=sel.textContent}
  var rec=document.getElementById("mominQuranReciterV8");if(rec)rec.value=saved("noor-quran-reciter-v8",window.readerAudioEdition||"ar.alafasy");
  var sp=document.getElementById("mominQuranSpeedV8");if(sp)sp.value=saved("noor-quran-audio-speed-v8",window.readerSpeed||1);
  updateTranslitNoteV8();
 }
 bindAudioEndV8();
}
function updateTranslitNoteV8(){
 var note=document.getElementById("readerTranslitNoteV7");if(!note)return;
 var lang=saved("noor-quran-translit-language","en"),item=languageItems.find(function(x){return x[0]===lang});
 note.textContent=!item||lang==="en"?"Shows the Roman pronunciation. Transliteration is not a translation of the ayah meaning.":(["brx","doi","ks","kok","mai","mni","sa","sat","sd"].indexOf(lang)>=0?"This option uses a related supported script as a fallback; it is pronunciation, not a meaning translation.":"Renders the Roman pronunciation in "+item[1]+" script. It is not a translation of the ayah meaning.");
}
function bindAudioEndV8(){
 var audio=document.getElementById("quranAudio");if(!audio||audio.dataset.settingsEndV8)return;
 audio.dataset.settingsEndV8="1";
 audio.addEventListener("ended",function(){
  if(window.MominQuranJuzReaderV1&&window.MominQuranJuzReaderV1.state.active&&typeof window.mominHandleJuzAudioEndedV1==="function"){window.mominHandleJuzAudioEndedV1();return}
  if(saved("noor-quran-repeat-v8","false")==="true"){audio.currentTime=0;audio.play().catch(function(){});}
  else if(saved("noor-quran-auto-next-v8","false")==="true"&&typeof changeReaderSurah==="function")changeReaderSurah(1,true);
 });
}
function getJuzReaderV8(){
 var api=window.MominQuranJuzReaderV1;
 return api&&api.state&&api.state.active?api:null;
}
function refreshArabicHtmlV8(){
 var juz=getJuzReaderV8();
 if(juz){juz.refresh();if(typeof scheduleArabicTransliterationV7==="function")scheduleArabicTransliterationV7();return}
 if(typeof verseMarkup!=="function")return;
 var area=document.getElementById("readingArea");if(area)area.innerHTML=verseMarkup();
 if(typeof scheduleArabicTransliterationV7==="function")scheduleArabicTransliterationV7();
}
function getVerseRowsV8(){
 var juz=getJuzReaderV8();
 if(juz&&Array.isArray(juz.verses))return juz.verses;
 return typeof currentVerses!=="undefined"?currentVerses:[];
}
async function fetchArabicStyleRowsV8(chapter){
 if(textEditionCache[chapter])return textEditionCache[chapter];
 var fields="text_uthmani,text_indopak_nastaleeq,text_uthmani_simple,text_qpc_hafs,text_uthmani_tajweed";
 var base="https://api.quran.com/api/v4/verses/by_chapter/"+chapter+"?fields="+encodeURIComponent(fields)+"&per_page=50&page=";
 var first=await getJSON(base+"1"),all=first.verses||[],pages=Number(first.pagination&&first.pagination.total_pages)||1;
 for(var p=2;p<=Math.min(pages,10);p++){var next=await getJSON(base+p);all=all.concat(next.verses||[])}
 var mapping={};all.forEach(function(v){mapping[Number(v.verse_number)]=v});
 textEditionCache[chapter]=mapping;return mapping;
}
async function applyArabicStyleToRowsV8(verses,script,taj){
 var unique=Array.from(new Set(verses.map(function(v){return Number(v.surahNo||v.surahNumber||0)}).filter(Boolean)));
 var maps={};
 if(script!=="uthmani"||taj)await Promise.all(unique.map(async function(ch){maps[ch]=await fetchArabicStyleRowsV8(ch)}));
 verses.forEach(function(v){
  var ch=Number(v.surahNo||v.surahNumber||0),row=maps[ch]&&maps[ch][Number(v.numberInSurah)];
  if(v.sourceArabicV8===undefined)v.sourceArabicV8=v.text;
  v.tajweedHtmlV8=row&&row.text_uthmani_tajweed||"";
  if(script==="uthmani")v.text=v.sourceArabicV8;
  else if(script==="simple")v.text=String(row&&(row.text_uthmani_simple||row.text_uthmani)||v.sourceArabicV8).normalize("NFD").replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g,"").replace(/\u0640/g,"").normalize("NFC");
  else if(script==="indopak"){if(!row||!row.text_indopak_nastaleeq)throw Error("IndoPak edition unavailable for Surah "+ch);v.text=row.text_indopak_nastaleeq}
  else if(script==="mushaf"){if(!row||!row.text_qpc_hafs)throw Error("Mushaf edition unavailable for Surah "+ch);v.text=row.text_qpc_hafs}
  if(taj&&!v.tajweedHtmlV8)throw Error("Tajweed edition unavailable for Surah "+ch);
 });
}
async function applyCurrentArabicTextV8(){
 var verses=getVerseRowsV8();if(!verses.length)return;
 var script=saved("noor-quran-script-v8","uthmani"),taj=saved("noor-quran-show-tajweed-v8","false")==="true";
 await applyArabicStyleToRowsV8(verses,script,taj);
 refreshArabicHtmlV8();
}
function sanitizeTajweedHtmlV8(raw){
 var box=document.createElement("div");box.innerHTML=String(raw||"");
 function serialize(n){if(n.nodeType===3)return esc(n.nodeValue||"");if(n.nodeType!==1)return "";var inside=Array.prototype.map.call(n.childNodes,serialize).join("");if(n.tagName.toLowerCase()!=="tajweed")return inside;var cl=String(n.getAttribute("class")||"").split(/\s+/).filter(function(x){return /^[a-zA-Z0-9_-]+$/.test(x)}).join(" ");return '<span class="momin-tajweed '+cl+'">'+inside+'</span>'}
 return Array.prototype.map.call(box.childNodes,serialize).join("");
}
var selectedSurahPageV8=0;
function surahPagesV8(rows){return Array.from(new Set(rows.map(function(v){return Number(v.page)||0}).filter(Boolean))).sort(function(a,b){return a-b})}
function pageNavigationV8(pages,current){
 if(!pages.length)return "";
 var i=pages.indexOf(current),pos=i<0?0:i;
 return '<div class="momin-quran-page-nav-v8"><button type="button" '+(pos===0?'disabled':'')+' onclick="window.MominQuranSettingsV8.page(-1)">← Previous page</button><span>Page '+(pos+1)+' of '+pages.length+' · Mushaf '+pages[pos]+'</span><button type="button" '+(pos===pages.length-1?'disabled':'')+' onclick="window.MominQuranSettingsV8.page(1)">Next page →</button></div>';
}
var oldVerseMarkupSettingsV8=verseMarkup;
verseMarkup=function(){
 var juz=getJuzReaderV8(),all=getVerseRowsV8(),rows=all,pages=[],current=0;
 if(!juz&&mode()==="page"&&all.length&&all.some(function(v){return Number(v.page)>0})){
  pages=surahPagesV8(all);
  var key="noor-quran-current-page-v8-"+(Number(localStorage.getItem("noor-surah-number")||1));
  var stored=Number(localStorage.getItem(key)||0);
  current=pages.indexOf(stored)>=0?stored:pages[0];
  selectedSurahPageV8=current;
  rows=all.filter(function(v){return Number(v.page)===current});
  var prior=currentVerses;currentVerses=rows;
  var pageHtml=oldVerseMarkupSettingsV8();
  currentVerses=prior;
  if(saved("noor-quran-show-tajweed-v8","false")==="true"){
   var index=0;pageHtml=pageHtml.replace(/<div class="arabic" lang="ar">[\s\S]*?<\/div>/g,function(old){var v=rows[index++];return v&&v.tajweedHtmlV8?'<div class="arabic" lang="ar">'+sanitizeTajweedHtmlV8(v.tajweedHtmlV8)+'</div>':old});
  }
  return '<div class="momin-quran-mushaf-page-v8" data-mushaf-page="'+current+'">'+pageHtml+'</div>'+pageNavigationV8(pages,current);
 }
 var html=oldVerseMarkupSettingsV8(),verses=all;
 if(saved("noor-quran-show-tajweed-v8","false")!=="true")return html;
 var i=0;
 return html.replace(/<div class="arabic" lang="ar">[\s\S]*?<\/div>/g,function(old){var v=verses[i++];return v&&v.tajweedHtmlV8?'<div class="arabic" lang="ar">'+sanitizeTajweedHtmlV8(v.tajweedHtmlV8)+'</div>':old});
};
function modalSourceForJuzV8(){
 var tr=typeof quranTranslationOptionsV5==="function"?quranTranslationOptionsV5():'<option value="en.sahih" selected>English — Saheeh International</option>';
 var roman='<option value="en">English — Roman transliteration</option>'+languageItems.map(function(x){return '<option value="'+x[0]+'">'+x[1]+' — '+x[2]+'</option>'}).join("");
 return '<select aria-label="Quran translation language">'+tr+'</select><select id="readerTranslitLanguageV7">'+roman+'</select>';
}
window.MominQuranSettingsV8RenderModalForJuz=function(){
 var html=buildModal(modalSourceForJuzV8());
 var tabAt=html.indexOf('data-tab-v8="audio"');
 if(tabAt>=0){var tabStart=html.lastIndexOf("<button",tabAt),tabEnd=html.indexOf("</button>",tabAt);if(tabStart>=0&&tabEnd>=0)html=html.slice(0,tabStart)+html.slice(tabEnd+9);}
 var paneAt=html.indexOf('data-pane-v8="audio"');
 if(paneAt>=0){var paneStart=html.lastIndexOf("<section",paneAt),paneEnd=html.indexOf("</section>",paneAt);if(paneStart>=0&&paneEnd>=0)html=html.slice(0,paneStart)+html.slice(paneEnd+10);}
 html=html.replace('class="reader-settings momin-reader-settings-v8 ','class="reader-settings momin-reader-settings-v8 momin-juz-settings-v1 ');
 if(saved("noor-quran-settings-tab-v8","display")==="audio")localStorage.setItem("noor-quran-settings-tab-v8","display");
 return html;
};
window.MominQuranSettingsV8SanitizeTajweed=sanitizeTajweedHtmlV8;
function commitSettingsSnapshotV8(){
 var panel=document.getElementById("readerSettings"),snapshot={};
 if(!panel)return snapshot;
 function put(key,value){if(value!==undefined&&value!==null){value=String(value);localStorage.setItem(key,value);snapshot[key]=value}}
 var themeButton=panel.querySelector("[data-theme-v8].selected");
 if(themeButton)put("noor-quran-theme",themeButton.getAttribute("data-theme-v8"));
 var modeButton=panel.querySelector("[data-mode-v8].selected");
 if(modeButton)put("noor-quran-reading-mode-v8",modeButton.getAttribute("data-mode-v8"));
 var size=panel.querySelector('input[type="range"][aria-label="Arabic text size"]');
 if(size)put("noor-quran-arabic-size",Math.max(34,Math.min(58,Number(size.value)||48)));
 var script=panel.querySelector("[data-script-v8].selected");
 if(script)put("noor-quran-script-v8",script.getAttribute("data-script-v8"));
 [["mominKeepAwakeV8","noor-keep-awake-v8"],["mominShowTranslationV8","noor-quran-show-translation-v8"],["mominShowTransliterationV8","noor-quran-show-transliteration-v8"],["mominTajweedV8","noor-quran-show-tajweed-v8"],["mominRepeatSurahV8","noor-quran-repeat-v8"],["mominAutoNextV8","noor-quran-auto-next-v8"]].forEach(function(pair){
  var input=panel.querySelector("#"+pair[0]);if(input)put(pair[1],input.checked?"true":"false");
 });
 if(snapshot["noor-quran-show-translation-v8"]!==undefined)put("noor-quran-translation",snapshot["noor-quran-show-translation-v8"]);
 var translation=panel.querySelector("#quranTranslationSelectV8");
 if(translation&&translation.value&&translation.options[translation.selectedIndex]&&!translation.options[translation.selectedIndex].disabled)put("noor-quran-edition",translation.value);
 var translit=panel.querySelector("#readerTranslitLanguageV8")||panel.querySelector("#readerTranslitLanguageV7");
 if(translit&&translit.value)put("noor-quran-translit-language",translit.value);
 var reciter=panel.querySelector("#mominQuranReciterV8");
 var valid=["ar.alafasy","ar.abdurrahmaansudais","ar.husary","ar.minshawi","ar.mahermuaiqly","ar.shaatree"];
 if(reciter)put("noor-quran-reciter-v8",valid.indexOf(reciter.value)>=0?reciter.value:"ar.alafasy");
 var speed=panel.querySelector("#mominQuranSpeedV8");
 if(speed)put("noor-quran-audio-speed-v8",[0.75,1,1.25,1.5].indexOf(Number(speed.value))>=0?speed.value:"1");
 put("noor-quran-settings-last-saved-v8","true");
 snapshot.savedAt=new Date().toISOString();
 localStorage.setItem("noor-quran-settings-snapshot-v8",JSON.stringify(snapshot));
 return snapshot;
}
window.MominQuranSettingsV8={
 close:function(){settingsOpen=false;applyReaderSettingsV8()},
 save:async function(){
  var snapshot=commitSettingsSnapshotV8();
  var juzApi=window.MominQuranJuzReaderV1;
  var isJuz=!!(juzApi&&juzApi.state&&juzApi.state.active);
  if(isJuz){
   snapshot.context="juz";
   snapshot.juzNumber=juzApi.state.number;
   snapshot.savedAt=new Date().toISOString();
   localStorage.setItem("momin-quran-juz-settings-v1",JSON.stringify(snapshot));
   localStorage.setItem("momin-quran-juz-settings-saved-v1","true");
  }else{
   snapshot.context="surah";
   snapshot.savedAt=new Date().toISOString();
   localStorage.setItem("momin-quran-surah-settings-v1",JSON.stringify(snapshot));
  }
  settingsOpen=false;
  var chosenTheme=snapshot["noor-quran-theme"]||theme();
  if(typeof setQuranTheme==="function")setQuranTheme(chosenTheme);
  if(snapshot["noor-quran-arabic-size"]&&typeof setQuranArabicSize==="function")setQuranArabicSize(snapshot["noor-quran-arabic-size"]);
  if(isJuz){
   if(typeof juzApi.refresh==="function")juzApi.refresh();
  }else{
   if(typeof applyCurrentArabicTextV8==="function")await applyCurrentArabicTextV8().catch(function(){});
   if(typeof render==="function")render();
  }
  applyReaderSettingsV8();
  if(typeof toast==="function")toast(isJuz?"Juz "+juzApi.state.number+" settings saved on this device.":"Surah reading settings saved on this device.");
 },
 reset:function(){if(typeof confirm==="function"&&!confirm("Reset Quran reading settings to their defaults?"))return;["noor-quran-settings-tab-v8","noor-quran-theme","noor-quran-reading-mode-v8","noor-quran-arabic-size","noor-keep-awake-v8","noor-quran-script-v8","noor-quran-show-tajweed-v8","noor-quran-show-translation-v8","noor-quran-translation","noor-quran-show-transliteration-v8","noor-quran-translit-language","noor-quran-repeat-v8","noor-quran-auto-next-v8","noor-quran-audio-speed-v8","noor-quran-reciter-v8","noor-quran-edition","noor-quran-edition-language","noor-quran-settings-last-saved-v8"].forEach(function(k){localStorage.removeItem(k)});localStorage.setItem("noor-quran-theme","night");localStorage.setItem("noor-quran-reading-mode-v8","list");localStorage.setItem("noor-quran-arabic-size","48");localStorage.setItem("noor-quran-show-translation-v8","true");localStorage.setItem("noor-quran-show-transliteration-v8","false");localStorage.setItem("noor-quran-show-tajweed-v8","false");localStorage.setItem("noor-quran-translit-language","en");localStorage.setItem("noor-quran-reciter-v8","ar.alafasy");localStorage.setItem("noor-quran-audio-speed-v8","1");localStorage.setItem("noor-quran-settings-tab-v8","display");settingsOpen=true;translationPickerOpen=false;if(typeof setQuranTheme==="function")setQuranTheme("night");if(typeof setQuranArabicSize==="function")setQuranArabicSize(48);applyReaderSettingsV8();if(typeof render==="function")render();if(typeof toast==="function")toast("Quran reading settings reset to defaults.")},
 tab:function(t){if(["display","text","audio"].indexOf(t)<0)return;localStorage.setItem("noor-quran-settings-tab-v8",t);applyReaderSettingsV8()},
 theme:function(t){if(["white","paper","night"].indexOf(t)<0)return;localStorage.setItem("noor-quran-theme",t);if(typeof setQuranTheme==="function")setQuranTheme(t);if(typeof render==="function")render();applyReaderSettingsV8()},
 mode:function(m){if(["list","page"].indexOf(m)<0)return;localStorage.setItem("noor-quran-reading-mode-v8",m);if(typeof render==="function")render();applyReaderSettingsV8()},
 page:function(direction){var api=getJuzReaderV8();if(api){if(typeof window.mominMoveJuzPageV1==="function")window.mominMoveJuzPageV1(direction);return}var rows=getVerseRowsV8(),pages=surahPagesV8(rows);if(!pages.length)return;var key="noor-quran-current-page-v8-"+(Number(localStorage.getItem("noor-surah-number")||1)),current=Number(localStorage.getItem(key)||pages[0]),i=pages.indexOf(current);if(i<0)i=0;i=Math.max(0,Math.min(pages.length-1,i+Number(direction||0)));localStorage.setItem(key,String(pages[i]));if(typeof render==="function")render();applyReaderSettingsV8()},
 toggleTranslationPicker:function(){translationPickerOpen=!translationPickerOpen;var e=document.getElementById("mominTranslationPickerV8");if(e)e.hidden=!translationPickerOpen;var b=document.querySelector(".momin-quran-selected-translation");if(b)b.setAttribute("aria-expanded",String(translationPickerOpen))},
 search:function(q){var s=document.getElementById("quranTranslationSelectV8");if(!s)return;q=String(q||"").toLowerCase().trim();Array.prototype.forEach.call(s.options,function(o){o.hidden=!!q&&o.textContent.toLowerCase().indexOf(q)<0});Array.prototype.forEach.call(s.querySelectorAll("optgroup"),function(g){g.hidden=!Array.prototype.some.call(g.options,function(o){return !o.hidden})})},
 translation:function(id){if(String(id).indexOf("unavailable:")===0)return;var s=document.getElementById("quranTranslationSelectV8");if(!s||!Array.prototype.some.call(s.options,function(o){return o.value===id&&!o.disabled}))return;localStorage.setItem("noor-quran-edition",id);translationPickerOpen=false;var opt=Array.prototype.find.call(s.options,function(o){return o.value===id}),label=document.getElementById("mominSelectedTranslationLabelV8");if(label&&opt)label.textContent=opt.textContent;if(typeof setQuranTranslationEditionV5==="function")setQuranTranslationEditionV5(id);else if(typeof readSurah==="function")readSurah(readerChapter().number||1);applyReaderSettingsV8()},
 showMeaning:function(on){localStorage.setItem("noor-quran-show-translation-v8",on?"true":"false");localStorage.setItem("noor-quran-translation",on?"true":"false");applyReaderSettingsV8()},
 showTranslit:function(on){localStorage.setItem("noor-quran-show-transliteration-v8",on?"true":"false");if(typeof render==="function")render();applyReaderSettingsV8()},
 translit:function(code){if(typeof setArabicTransliterationLanguageV7==="function")setArabicTransliterationLanguageV7(code);else localStorage.setItem("noor-quran-translit-language",code);updateTranslitNoteV8();if(window.MominQuranJuzReaderV1&&window.MominQuranJuzReaderV1.state.active)window.MominQuranJuzReaderV1.refresh();applyReaderSettingsV8()},
 tajweed:function(on){localStorage.setItem("noor-quran-show-tajweed-v8",on?"true":"false");applyCurrentArabicTextV8().then(applyReaderSettingsV8).catch(function(){localStorage.setItem("noor-quran-show-tajweed-v8","false");applyReaderSettingsV8();toast("Tajweed colours could not be loaded for this Quran section.")})},
 keepAwake:async function(on){localStorage.setItem("noor-keep-awake-v8",on?"true":"false");if(!on){if(wakeLock){try{await wakeLock.release()}catch(_){}wakeLock=null}return}if(!navigator.wakeLock||!navigator.wakeLock.request){toast("Keep screen awake is not supported in this browser.");return}try{wakeLock=await navigator.wakeLock.request("screen")}catch(_){toast("The browser could not keep the screen awake.")}},
 repeat:function(on){localStorage.setItem("noor-quran-repeat-v8",on?"true":"false")},next:function(on){localStorage.setItem("noor-quran-auto-next-v8",on?"true":"false")},
 speed:function(v){var n=Number(v);if([0.75,1,1.25,1.5].indexOf(n)<0)return;localStorage.setItem("noor-quran-audio-speed-v8",String(n));window.readerSpeed=n;var a=document.getElementById("quranAudio");if(a)a.playbackRate=n;var l=document.getElementById("audioSpeed");if(l)l.textContent=n+"×"},
 reciter:function(id){var names={"ar.alafasy":"Mishary Rashid Alafasy","ar.abdurrahmaansudais":"Abdurrahman As-Sudais","ar.husary":"Mahmoud Khalil Al-Husary","ar.minshawi":"Mohamed Siddiq Al-Minshawi","ar.mahermuaiqly":"Maher Al-Muaiqly","ar.shaatree":"Abu Bakr Ash-Shaatree"};if(!names[id])return;localStorage.setItem("noor-quran-reciter-v8",id);window.readerAudioEdition=id;window.readerAudioReciter=names[id];var a=document.getElementById("quranAudio");if(a){a.pause();a.dataset.surah="";}if(window.MominQuranJuzReaderV1&&window.MominQuranJuzReaderV1.state.active&&typeof window.mominPrepareJuzAudioV1==="function")window.mominPrepareJuzAudioV1();var label=document.getElementById("audioReciter");if(label)label.textContent=names[id]},
 script:async function(s){if(["uthmani","indopak","simple","mushaf"].indexOf(s)<0)return;var prior=saved("noor-quran-script-v8","uthmani");localStorage.setItem("noor-quran-script-v8",s);try{await applyCurrentArabicTextV8();applyReaderSettingsV8()}catch(_){localStorage.setItem("noor-quran-script-v8",prior);await applyCurrentArabicTextV8().catch(function(){});applyReaderSettingsV8();toast("This script edition is unavailable for this Surah. The previous script has been restored.")}}
};
window.toggleReaderSettings=function(){settingsOpen=!settingsOpen;applyReaderSettingsV8()};
var readerPageBeforeSettingsV8=quranReaderPageV2;
quranReaderPageV2=function(){var old=readerPageBeforeSettingsV8(),start=old.indexOf('<div class="reader-settings" id="readerSettings" hidden>');if(start<0)start=old.indexOf('<div class="reader-settings" id="readerSettings"');var end=start>=0?old.indexOf('<div class="reading-goal">',start):-1;if(start<0||end<0)return old;return old.slice(0,start)+buildModal(old)+old.slice(end)};
var oldRenderSettingsV8=render;
render=function(){oldRenderSettingsV8();applyReaderSettingsV8()};
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&saved("noor-keep-awake-v8","false")==="true"&&navigator.wakeLock&&navigator.wakeLock.request)navigator.wakeLock.request("screen").then(function(l){wakeLock=l}).catch(function(){})});
})();