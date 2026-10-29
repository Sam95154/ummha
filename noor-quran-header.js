/* Noor — swaps the Quran reader's green banner for a themed surah title plate. */
(function(){
  if(typeof quranPage!=='function')return;
  var prev=quranPage;
  var MOSQUE='<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M18 51V39c0-8 6-14.500 14-14.500S46 31 46 39v12"/><path d="M32 24.500V19"/><path d="M9 51V28l3-6.500 3 6.500v23"/><path d="M49 51V28l3-6.500 3 6.500v23"/><path d="M5 51h54"/><path d="M27.500 51v-7a4.500 4.500 0 0 1 9 0v7"/><path d="M9 33h6M49 33h6"/></g><path d="M32.500 10.500a4.600 4.600 0 1 0 3.600 7.500 3.700 3.700 0 1 1-3.600-7.500z" fill="currentColor"/><circle cx="12" cy="18" r="1.100" fill="currentColor"/><circle cx="52" cy="18" r="1.100" fill="currentColor"/></svg>';
  var CRESCENT='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M26 6a18 18 0 1 0 15 27.500A14.500 14.500 0 0 1 26 6z" fill="currentColor"/><path d="M37 11l1.900 4.600 5 .4-3.800 3.300 1.200 4.900L37 21.600l-4.300 2.600 1.200-4.900-3.800-3.300 5-.4z" fill="currentColor"/></svg>';
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  quranPage=function(){
    var html=prev.apply(this,arguments);
    if(html.indexOf('class="surah-banner"')<0)return html;
    var c={};try{c=readerChapter()||{}}catch(e){}
    var bits=[];
    if(c.englishNameTranslation)bits.push('<span>'+esc(c.englishNameTranslation)+'</span>');
    if(c.revelationType)bits.push('<span>'+esc(c.revelationType)+'</span>');
    if(c.numberOfAyahs)bits.push('<span><b>'+c.numberOfAyahs+'</b> Ayahs</span>');
    var plate='<div class="surah-plate"><span class="sp-c a"></span><span class="sp-c b"></span><span class="sp-c c"></span><span class="sp-c d"></span>'+
      '<span class="sp-badge">'+CRESCENT+'</span><div class="sp-orn">'+MOSQUE+'</div><div class="sp-mid"><div class="sp-no">Surah '+(c.number||'')+'</div><div class="sp-ar" lang="ar">'+esc(c.name||'سُورَةُ الْفَاتِحَةِ')+'</div>'+
      '<div class="sp-meta">'+bits.join('<i></i>')+'</div></div><div class="sp-orn">'+MOSQUE+'</div><span class="sp-arches"></span></div>';
    html=html.replace(/<div class="surah-banner">[\s\S]*?<\/div>/,plate);
    var pct=0;try{pct=Math.min(100,Math.round(Math.floor(readingSeconds/60)/readingGoalMinutes*100))}catch(e){}
    html=html.replace('<i class="goal-ring"></i>','<i class="goal-ring" style="--p:'+pct+'%"></i>');
    return html;
  };
  if(typeof render==='function'&&page==='quran')render();
})();