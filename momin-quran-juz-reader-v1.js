/* MOMIN Quran complete-Juz reader V1.
   Extends the current live Quran hub without replacing the MOMIN app routes. */
(function () {
  'use strict';
  if (window.__mominQuranJuzReaderV1) return;
  window.__mominQuranJuzReaderV1 = true;

  var starts = [
    [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
    [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
    [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
  ];
  var state = {active:false,number:1,loading:false,error:'',data:null,request:0};

  function chaptersListV1() {
    return typeof chapters !== 'undefined' && Array.isArray(chapters) ? chapters : [];
  }
  function esc(value) {
    return typeof window.escapeAppHtmlV5 === 'function'
      ? window.escapeAppHtmlV5(value)
      : String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
          return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
        });
  }
  function ensureFullCatalog() {
    if (chaptersListV1().length === 114) return Promise.resolve(chaptersListV1());
    if (typeof window.loadChapters !== 'function') return Promise.reject(new Error('Quran catalogue service is unavailable.'));
    return Promise.resolve(window.loadChapters()).then(function () {
      if (chaptersListV1().length !== 114) throw new Error('The complete 114-Surah index is not available yet.');
      return chaptersListV1();
    });
  }
  function pointForEnd(number) {
    if (number < 30) {
      var next = starts[number];
      if (next[1] > 1) return {surah:next[0],ayah:next[1]-1};
      var previous = chaptersListV1()[next[0]-2];
      if (!previous) throw new Error('Surah metadata is incomplete.');
      return {surah:next[0]-1,ayah:Number(previous.numberOfAyahs)};
    }
    return {surah:114,ayah:6};
  }
  function globalNumber(surah,ayah) {
    var list=chaptersListV1(),total=Number(ayah);
    for(var i=0;i<Number(surah)-1;i+=1) {
      if(!list[i]||!Number(list[i].numberOfAyahs)) throw new Error('Surah metadata is incomplete.');
      total+=Number(list[i].numberOfAyahs);
    }
    return total;
  }
  function juzMeta(number) {
    var start={surah:starts[number-1][0],ayah:starts[number-1][1]},end=pointForEnd(number);
    return {number:number,start:start,end:end,globalStart:globalNumber(start.surah,start.ayah),globalEnd:globalNumber(end.surah,end.ayah)};
  }
  function refLabel(point) {
    var c=chaptersListV1()[point.surah-1];
    return (c?c.englishName:'Surah '+point.surah)+' '+point.surah+':'+point.ayah;
  }
  function rangeLabel(meta) { return refLabel(meta.start)+' – '+refLabel(meta.end); }
  function edition() {
    return typeof window.quranTranslationEditionV5==='function'
      ? window.quranTranslationEditionV5()
      : (localStorage.getItem('noor-quran-edition')||'en.sahih');
  }
  function themeClass() { return typeof window.readerThemeClass==='function'?window.readerThemeClass():''; }
  function translationClass() { return typeof window.readerTranslationClass==='function'?window.readerTranslationClass():''; }
  function arabicSize() { return typeof window.readerArabicSize==='function'?window.readerArabicSize():48; }
  function direction() { return typeof window.translationDirectionV5==='function'?window.translationDirectionV5():'ltr'; }
  function language() { return edition().split('.')[0]||'en'; }
  function translationOptions() {
    return typeof window.quranTranslationOptionsV5==='function'
      ? window.quranTranslationOptionsV5()
      : '<option value="en.sahih" selected>English — Saheeh International</option>';
  }

  async function loadJuz(number,request) {
    await ensureFullCatalog();
    var meta=juzMeta(number),base='https://api.alquran.cloud/v1/juz/'+number+'/',selectedEdition=edition();
    var result=await Promise.all([
      window.getJSON(base+'quran-uthmani'),
      window.getJSON(base+selectedEdition),
      window.getJSON(base+'en.transliteration').catch(function(){return null;})
    ]);
    if(request!==state.request)return null;
    var ar=result[0]&&result[0].data,tr=result[1]&&result[1].data,roman=result[2]&&result[2].data;
    if(!ar||!tr||!Array.isArray(ar.ayahs)||!Array.isArray(tr.ayahs))
      throw new Error('Arabic Quran text or the selected translation could not be loaded.');
    var expectedCount=meta.globalEnd-meta.globalStart+1;
    if(ar.ayahs.length!==expectedCount||tr.ayahs.length!==expectedCount)
      throw new Error('Incomplete Juz response. Expected '+expectedCount+' Ayahs, received '+ar.ayahs.length+' Arabic and '+tr.ayahs.length+' translation records.');
    var romanRows=roman&&Array.isArray(roman.ayahs)?roman.ayahs:[];
    var romanByNumber=new Map(romanRows.map(function(row){return[Number(row.number),String(row.text||'')]}));
    var verses=ar.ayahs.map(function(a,i){
      var t=tr.ayahs[i],expectedNumber=meta.globalStart+i,surahNo=Number(a.surah&&a.surah.number);
      if(!t||Number(a.number)!==expectedNumber||Number(t.number)!==expectedNumber||
        Number(a.numberInSurah)!==Number(t.numberInSurah)||
        surahNo!==Number(t.surah&&t.surah.number)||
        !String(a.text||'').trim()||!String(t.text||'').trim())
        throw new Error('Juz '+number+' Arabic/translation alignment failed at Ayah '+(i+1)+'.');
      var arabicText=String(a.text);
      if(Number(a.numberInSurah)===1&&surahNo!==1&&surahNo!==9&&typeof window.stripOpeningBismillahV5==='function')
        arabicText=window.stripOpeningBismillahV5(arabicText);
      return {
        number:expectedNumber,numberInSurah:Number(a.numberInSurah),text:arabicText,
        translation:String(t.text),transliteration:romanByNumber.get(expectedNumber)||'',
        surahNo:surahNo,surahName:a.surah.englishName||('Surah '+surahNo),
        surahArabicName:a.surah.name||'',juz:number
      };
    });
    if(verses[0].surahNo!==meta.start.surah||verses[0].numberInSurah!==meta.start.ayah||
       verses[verses.length-1].surahNo!==meta.end.surah||
       verses[verses.length-1].numberInSurah!==meta.end.ayah)
      throw new Error('Juz '+number+' start/end references did not match the Quran index.');
    return {number:number,meta:meta,edition:selectedEdition,ayahs:verses};
  }

  function readerSettingsHTML() {
    return '<div class="reader-settings qv-juz-settings" id="mominJuzSettingsV1" hidden>'+
      '<label class="reader-setting"><span>Translation</span><select aria-label="Quran translation language" onchange="mominSetJuzEditionV1(this.value)">'+translationOptions()+'</select></label>'+
      '<label class="reader-setting"><span>Arabic text size</span><input type="range" min="34" max="58" value="'+Number(arabicSize())+'" oninput="setQuranArabicSize(this.value)"></label>'+
      '<label class="reader-setting"><span>Theme</span><select aria-label="Reader theme" onchange="setQuranTheme(this.value)"><option value="paper">Warm parchment</option><option value="white">White</option><option value="night">Night</option></select></label>'+
      '<p class="sub">Your Quran reading preferences are saved on this device.</p></div>';
  }
  function verseHTML(verse) {
    var roman=String(verse.transliteration||'');
    var trans=roman?'<div class="ayah-transliteration" lang="en" data-roman="'+esc(roman)+'">'+esc(roman)+'</div>':'';
    return '<article class="ayah-block qv-juz-ayah" data-global-ayah="'+verse.number+'">'+
      '<div class="ayah-tools"><button class="ayah-marker" onclick="bookmarkVerse(&quot;'+verse.number+'&quot;)">Juz '+state.number+' · '+verse.surahNo+':'+verse.numberInSurah+' <span>♡</span></button></div>'+
      '<div class="ayah-arabic-row"><div class="ayah-rosette"><span>'+verse.numberInSurah+'</span></div><div class="arabic" lang="ar" dir="rtl">'+esc(verse.text)+'</div></div>'+
      trans+'<div class="ayah-translation" lang="'+esc(language())+'" dir="'+esc(direction())+'">'+esc(verse.translation)+'</div>'+
      '<div class="ayah-bookmark"><button onclick="bookmarkVerse(&quot;'+verse.number+'&quot;)">♡ Save ayah</button></div></article>';
  }
  function juzAyahsHTML() {
    if(!state.data)return '';
    var html='',previousSurah=0;
    state.data.ayahs.forEach(function(verse){
      if(verse.surahNo!==previousSurah){
        if(previousSurah)html+='<div class="qv-juz-surah-break"></div>';
        html+='<div class="qv-juz-surah-title"><span class="qv-juz-surah-ar" lang="ar" dir="rtl">'+esc(verse.surahArabicName)+'</span><b>'+esc(verse.surahName)+'</b><small>Surah '+verse.surahNo+'</small></div>';
        if(verse.numberInSurah===1&&verse.surahNo!==1&&verse.surahNo!==9)
          html+='<div class="qv-juz-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
        previousSurah=verse.surahNo;
      }
      html+=verseHTML(verse);
    });
    return html;
  }
  function readerHTML() {
    var meta=state.data?state.data.meta:juzMeta(state.number),range=rangeLabel(meta);
    var body=state.loading
      ?'<div class="reader-loadstatus" role="status">Loading Arabic, transliteration and translation for Juz '+state.number+'…</div>'
      :state.error
        ?'<div class="qv-juz-error" role="alert"><b>Juz '+state.number+' could not be loaded.</b><p>'+esc(state.error)+'</p><button type="button" onclick="mominOpenQuranJuzV1('+state.number+')">Try again</button></div>'
        :'<div class="reader-loadstatus">Arabic · Transliteration · '+esc(state.data.edition)+' · '+state.data.ayahs.length+' Ayahs</div><div class="ayah-list" id="mominJuzAyahList">'+juzAyahsHTML()+'</div>';
    return '<section class="quran-reader qv-juz-reader '+themeClass()+' '+translationClass()+'" style="--quran-arabic-size:'+Number(arabicSize())+'px">'+
      '<div class="quran-toolbar"><button class="reader-icon" aria-label="Back to Quran library" onclick="mominReturnToQuranLibraryV1()">←</button>'+
      '<div class="reader-title-group"><strong class="qv-juz-reader-title">Juz '+state.number+'</strong><span class="reader-subtitle">'+esc(range)+'</span></div>'+
      '<button class="reader-icon-button" aria-label="Juz information" onclick="toast(&quot;Juz '+state.number+' · Complete reading range&quot;)">ⓘ</button>'+
      '<button class="reader-icon-button" aria-label="Reader settings" onclick="mominToggleJuzSettingsV1()">⚙</button></div>'+
      readerSettingsHTML()+
      '<div class="reading-goal"><strong>Juz '+state.number+' <span class="qv-juz-count">'+(state.data?'· '+state.data.ayahs.length+' Ayahs':'')+'</span></strong><span class="qv-juz-range">'+esc(range)+'</span></div>'+
      body+
      (!state.loading&&!state.error?'<div class="qv-juz-pagination"><button type="button" '+(state.number===1?'disabled':'')+' onclick="mominOpenQuranJuzV1('+(state.number-1)+')">← Previous Juz</button><span>Juz '+state.number+' of 30</span><button type="button" '+(state.number===30?'disabled':'')+' onclick="mominOpenQuranJuzV1('+(state.number+1)+')">Next Juz →</button></div>':'')+
      '</section>';
  }

  window.mominQuranJuzMetaV1=function(number){
    number=Math.max(1,Math.min(30,Number(number)||1));
    var meta=juzMeta(number);
    return {number:number,start:meta.start,end:meta.end,startLabel:refLabel(meta.start),endLabel:refLabel(meta.end),ayahCount:meta.globalEnd-meta.globalStart+1};
  };
  window.mominRetryQuranIndexV1=function(){
    if(typeof window.loadChapters==='function')Promise.resolve(window.loadChapters()).then(function(){
      if(page==='quran'&&!state.active)window.render();
    });
  };
  window.mominOpenQuranJuzV1=async function(number){
    var n=Math.max(1,Math.min(30,Number(number)||1)),request=++state.request;
    state.active=true;state.number=n;state.loading=true;state.error='';state.data=null;
    page='quran';quranView='reader';
    if(typeof window.stopAudio==='function')window.stopAudio();
    try{localStorage.setItem('momin-quran-last-juz-v1',String(n))}catch(_){}
    window.render();window.scrollTo(0,0);
    try{
      var data=await loadJuz(n,request);
      if(request!==state.request||!data)return;
      state.data=data;state.loading=false;window.render();window.scrollTo(0,0);
      window.setTimeout(function(){if(typeof window.scheduleArabicTransliterationV7==='function')window.scheduleArabicTransliterationV7()},0);
    }catch(error){
      if(request!==state.request)return;
      state.loading=false;state.error=error&&error.message?error.message:'Check your internet connection and try again.';
      window.render();
    }
  };
  window.mominReturnToQuranLibraryV1=function(){
    state.request+=1;state.active=false;state.loading=false;state.error='';state.data=null;
    quranView='library';page='quran';
    if(typeof window.stopAudio==='function')window.stopAudio();
    window.render();window.scrollTo(0,0);
  };
  window.mominSetJuzEditionV1=function(value){
    var allowed=Array.isArray(window.quranTranslationsV5)&&window.quranTranslationsV5.some(function(item){return item.id===value;});
    if(!allowed)return;
    localStorage.setItem('noor-quran-edition',value);window.mominOpenQuranJuzV1(state.number);
  };
  window.mominToggleJuzSettingsV1=function(){
    var panel=document.getElementById('mominJuzSettingsV1');if(panel)panel.hidden=!panel.hidden;
  };
  var oldQuranPage=window.quranPage;
  window.quranPage=function(){return state.active?readerHTML():oldQuranPage.apply(this,arguments)};
  var oldGo=window.go;
  window.go=function(target){
    if(target!=='quran'){state.request+=1;state.active=false;state.loading=false;state.error='';state.data=null}
    return oldGo.apply(this,arguments);
  };
  var oldOpenSurah=window.mominOpenQuranAtV1;
  if(typeof oldOpenSurah==='function'){
    window.mominOpenQuranAtV1=function(){state.request+=1;state.active=false;state.loading=false;state.error='';state.data=null;return oldOpenSurah.apply(this,arguments)};
  }
  window.addEventListener('scroll',function(){
    if(!state.active||!state.data)return;
    var rows=document.querySelectorAll('.qv-juz-ayah[data-global-ayah]');if(!rows.length)return;
    var current=rows[0];
    for(var i=0;i<rows.length;i+=1){if(rows[i].getBoundingClientRect().bottom>140){current=rows[i];break}}
    var globalNo=Number(current.getAttribute('data-global-ayah'));
    if(globalNo)try{localStorage.setItem('momin-quran-last-juz-v1',String(state.number));localStorage.setItem('momin-quran-last-juz-ayah-v1',String(globalNo))}catch(_){}
  },{passive:true});
  window.MominQuranJuzReaderV1={
    get state(){return{active:state.active,number:state.number,loading:state.loading,ayahs:state.data?state.data.ayahs.length:0}},
    open:window.mominOpenQuranJuzV1,returnToLibrary:window.mominReturnToQuranLibraryV1
  };
})();