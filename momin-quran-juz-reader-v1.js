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
  var surahCounts = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
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
      return {surah:next[0]-1,ayah:Number(surahCounts[next[0]-2])};
    }
    return {surah:114,ayah:6};
  }
  function globalNumber(surah,ayah) {
    var total=Number(ayah);
    for(var i=0;i<Number(surah)-1;i+=1) {
      if(!surahCounts[i]) throw new Error('Surah count table is incomplete.');
      total+=surahCounts[i];
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
        surahArabicName:a.surah.name||'',page:Number(a.page||0),juz:number
      };
    });
    if(verses[0].surahNo!==meta.start.surah||verses[0].numberInSurah!==meta.start.ayah||
       verses[verses.length-1].surahNo!==meta.end.surah||
       verses[verses.length-1].numberInSurah!==meta.end.ayah)
      throw new Error('Juz '+number+' start/end references did not match the Quran index.');
    return {number:number,meta:meta,edition:selectedEdition,ayahs:verses};
  }

  function readerSettingsHTML() {
    return typeof window.MominQuranSettingsV8RenderModalForJuz==='function'
      ? window.MominQuranSettingsV8RenderModalForJuz()
      : '<div class="reader-settings" id="readerSettings" hidden><p>Quran Settings are loading…</p></div>';
  }
  function verseHTML(verse) {
    var showRoman=localStorage.getItem('noor-quran-show-transliteration-v8')==='true';
    var showTajweed=localStorage.getItem('noor-quran-show-tajweed-v8')==='true';
    var roman=String(verse.transliteration||'');
    var trans=showRoman&&roman?'<div class="ayah-transliteration" lang="en" data-roman="'+esc(roman)+'">'+esc(roman)+'</div>':'';
    var arabic=showTajweed&&verse.tajweedHtmlV8&&typeof window.MominQuranSettingsV8SanitizeTajweed==='function'
      ?window.MominQuranSettingsV8SanitizeTajweed(verse.tajweedHtmlV8):esc(verse.text);
    return '<article class="ayah-block qv-juz-ayah" data-global-ayah="'+verse.number+'" data-mushaf-page="'+Number(verse.page||0)+'">'+
      '<div class="ayah-tools"><button class="ayah-marker" onclick="bookmarkVerse(&quot;'+verse.number+'&quot;)">Juz '+state.number+' · '+verse.surahNo+':'+verse.numberInSurah+' <span>♡</span></button></div>'+
      '<div class="ayah-arabic-row"><div class="ayah-rosette"><span>'+verse.numberInSurah+'</span></div><div class="arabic" lang="ar" dir="rtl">'+arabic+'</div></div>'+
      trans+'<div class="ayah-translation" lang="'+esc(language())+'" dir="'+esc(direction())+'">'+esc(verse.translation)+'</div>'+
      '<div class="ayah-bookmark"><button onclick="bookmarkVerse(&quot;'+verse.number+'&quot;)">♡ Save ayah</button></div></article>';
  }
  function juzAyahsHTML(verseRows) {
    if(!state.data)return '';
    var rows=Array.isArray(verseRows)?verseRows:state.data.ayahs;
    var html='',previousSurah=0;
    rows.forEach(function(verse){
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
  function juzPages(){
    if(!state.data)return [];
    return Array.from(new Set(state.data.ayahs.map(function(v){return Number(v.page||0)}).filter(Boolean))).sort(function(a,b){return a-b});
  }
  function juzCurrentPage(){
    var pages=juzPages();if(!pages.length)return 0;
    var key='momin-quran-current-page-v1-'+state.number,stored=Number(localStorage.getItem(key)||0);
    return pages.indexOf(stored)>=0?stored:pages[0];
  }
  function juzPageNav(pages,current){
    if(!pages.length)return '';
    var i=pages.indexOf(current);if(i<0)i=0;
    return '<div class="momin-quran-page-nav-v8"><button type="button" '+(i===0?'disabled':'')+' onclick="window.mominMoveJuzPageV1(-1)">← Previous page</button><span>Page '+(i+1)+' of '+pages.length+' · Mushaf '+current+'</span><button type="button" '+(i===pages.length-1?'disabled':'')+' onclick="window.mominMoveJuzPageV1(1)">Next page →</button></div>';
  }
  function readerHTML() {
    var meta=state.data?state.data.meta:juzMeta(state.number),range=rangeLabel(meta),juzName=mominJuzNamesV1[state.number-1];
    var readMode=localStorage.getItem('noor-quran-reading-mode-v8')||'list';
    var pages=juzPages(),currentPage=juzCurrentPage();
    var visibleRows=readMode==='page'&&currentPage?state.data&&state.data.ayahs.filter(function(v){return Number(v.page)===currentPage}):state.data&&state.data.ayahs;
    var body=state.loading
      ?'<div class="reader-loadstatus" role="status">Loading Arabic, transliteration and translation for Juz '+state.number+'…</div>'
      :state.error
        ?'<div class="qv-juz-error" role="alert"><b>Juz '+state.number+' could not be loaded.</b><p>'+esc(state.error)+'</p><button type="button" onclick="mominOpenQuranJuzV1('+state.number+')">Try again</button></div>'
        :'<div class="reader-loadstatus">Arabic · '+(localStorage.getItem('noor-quran-show-transliteration-v8')==='true'?'Transliteration · ':'')+esc(state.data.edition)+' · '+state.data.ayahs.length+' Ayahs</div>'+
         (readMode==='page'?'<div class="momin-quran-mushaf-page-v8" data-mushaf-page="'+currentPage+'"><div class="momin-quran-mushaf-page-head"><span>Juz '+state.number+' · '+esc(juzName[0])+'</span><span>Mushaf page '+currentPage+'</span></div><div class="ayah-list" id="mominJuzAyahList">'+juzAyahsHTML(visibleRows)+'</div></div>'+juzPageNav(pages,currentPage):'<div class="ayah-list" id="mominJuzAyahList">'+juzAyahsHTML(visibleRows)+'</div>');
    return '<section class="quran-reader qv-juz-reader '+themeClass()+' '+translationClass()+'" style="--quran-arabic-size:'+Number(arabicSize())+'px">'+
      '<div class="quran-toolbar"><button class="reader-icon" aria-label="Back to Quran library" onclick="mominReturnToQuranLibraryV1()">←</button>'+
      '<div class="reader-title-group"><strong class="qv-juz-reader-title">Juz '+state.number+' · '+esc(juzName[0])+'</strong><span class="reader-subtitle" lang="ar" dir="rtl">'+esc(juzName[1])+'</span><span class="reader-subtitle">'+esc(range)+'</span></div>'+
      '<button class="reader-icon-button" aria-label="Juz information" onclick="toast(&quot;Juz '+state.number+' · Complete reading range&quot;)">ⓘ</button>'+
      '<button class="reader-icon-button" aria-label="Reader settings" onclick="toggleReaderSettings()">⚙</button></div>'+
      readerSettingsHTML()+
      '<div class="reading-goal"><strong>Juz '+state.number+' · '+esc(juzName[0])+' <span class="qv-juz-count">'+(state.data?'· '+state.data.ayahs.length+' Ayahs':'')+'</span></strong><span class="qv-juz-range">'+esc(range)+'</span></div>'+
      body+
      (!state.loading&&!state.error?'<div class="qv-juz-pagination"><button type="button" '+(state.number===1?'disabled':'')+' onclick="mominOpenQuranJuzV1('+(state.number-1)+')">← Previous Juz</button><span>Juz '+state.number+' of 30</span><button type="button" '+(state.number===30?'disabled':'')+' onclick="mominOpenQuranJuzV1('+(state.number+1)+')">Next Juz →</button></div>':'')+
      '</section>';
  }

  var mominJuzNamesV1=[["Alif Lam Meem","الم"],["Sayaqool","سَيَقُولُ"],["Tilkal Rusul","تِلْكَ الرُّسُلُ"],["Lan Tana Loo","لَنْ تَنَالُوا"],["Wal Muhsanat","وَالْمُحْصَنَاتُ"],["La Yuhibbullah","لَا يُحِبُّ اللَّهُ"],["Wa Iza Samiu","وَإِذَا سَمِعُوا"],["Wa Lau Annana","وَلَوْ أَنَّنَا"],["Qalal Malao","قَالَ الْمَلَأُ"],["Wa A'lamu","وَاعْلَمُوا"],["Ya'taziroon","يَعْتَذِرُونَ"],["Wa Ma Min Da'abah","وَمَا مِنْ دَابَّةٍ"],["Wa Ma Ubarri'u","وَمَا أُبَرِّئُ"],["Rubama","رُبَمَا"],["Subhanallazi","سُبْحَانَ الَّذِي"],["Qala Alam","قَالَ أَلَمْ"],["Iqtaraba","اقْتَرَبَ"],["Qad Aflaha","قَدْ أَفْلَحَ"],["Wa Qalallazina","وَقَالَ الَّذِينَ"],["Amman Khalaqa","أَمَّنْ خَلَقَ"],["Utlu Ma Oohiya","اتْلُ مَا أُوحِيَ"],["Wa Man Yaqnut","وَمَنْ يَقْنُتْ"],["Wa Mali","وَمَا لِيَ"],["Faman Azlamu","فَمَنْ أَظْلَمُ"],["Ilaihi Yuraddu","إِلَيْهِ يُرَدُّ"],["Ha Meem","حم"],["Qala Fama Khatbukum","قَالَ فَمَا خَطْبُكُمْ"],["Qad Sami Allah","قَدْ سَمِعَ اللَّهُ"],["Tabarakalladhi","تَبَارَكَ الَّذِي"],["Amma","عَمَّ"]];
  window.mominQuranJuzMetaV1=function(number){
    number=Math.max(1,Math.min(30,Number(number)||1));
    var meta=juzMeta(number),name=mominJuzNamesV1[number-1];
    return {number:number,name:name[0],arabicName:name[1],start:meta.start,end:meta.end,startLabel:refLabel(meta.start),endLabel:refLabel(meta.end),ayahCount:meta.globalEnd-meta.globalStart+1};
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
  var previousTranslationSetterV1=window.setQuranTranslationEditionV5;
  window.setQuranTranslationEditionV5=function(value){
    if(state.active){window.mominSetJuzEditionV1(value);return}
    if(typeof previousTranslationSetterV1==='function')return previousTranslationSetterV1.apply(this,arguments);
  };
  var oldQuranPage=window.quranPage;
  window.quranPage=function(){return state.active?readerHTML():oldQuranPage.apply(this,arguments)};
  var oldGo=window.go;
  window.go=function(target){
    state.request+=1;state.active=false;state.loading=false;state.error='';state.data=null;
    return oldGo.apply(this,arguments);
  };
  var oldOpenSurah=window.mominOpenQuranAtV1;
  if(typeof oldOpenSurah==='function'){
    window.mominOpenQuranAtV1=function(){state.request+=1;state.active=false;state.loading=false;state.error='';state.data=null;return oldOpenSurah.apply(this,arguments)};
  }
  window.addEventListener('scroll',function(){
    if(!state.active||!state.data||page!=='quran')return;
    var rows=document.querySelectorAll('.qv-juz-ayah[data-global-ayah]');if(!rows.length)return;
    var current=rows[0];
    for(var i=0;i<rows.length;i+=1){if(rows[i].getBoundingClientRect().bottom>140){current=rows[i];break}}
    var globalNo=Number(current.getAttribute('data-global-ayah'));
    if(globalNo)try{localStorage.setItem('momin-quran-last-juz-v1',String(state.number));localStorage.setItem('momin-quran-last-juz-ayah-v1',String(globalNo))}catch(_){}
  },{passive:true});
  window.MominQuranJuzReaderV1={
    get state(){return{active:state.active,number:state.number,loading:state.loading,ayahs:state.data?state.data.ayahs.length:0}},
    get verses(){return state.data?state.data.ayahs:[]},
    refresh:window.mominRefreshJuzReaderV1,
    open:window.mominOpenQuranJuzV1,returnToLibrary:window.mominReturnToQuranLibraryV1
  };
})();