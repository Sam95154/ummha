/* Noor Quran hub UI V7 — aligned to the supplied dark/gold mobile reference.
   Uses the existing app router and Al Quran Cloud data layer; does not create a separate app. */
(function () {
  'use strict';

  var qv7Mode = localStorage.getItem('noor-quran-view-mode') || 'Sura';
  if (['Sura', 'Juz', 'Revelation'].indexOf(qv7Mode) < 0) qv7Mode = 'Sura';
  var qv7Tab = 'read';
  var qv7SearchOpen = false;
  var qv7Query = '';
  var qv7DropdownOpen = false;
  var qv7CatalogPromise = null;
  var qv7ReadingMode = 'sura';
  var qv7ActiveJuz = 1;
  var qv7JuzData = null;
  var qv7JuzLoading = false;
  var qv7ProgressTimer = null;

  var qv7Juz = [
    {n:1,name:'Alif-Lam-Meem',ar:'الم',ss:1,sa:1,es:2,ea:141},
    {n:2,name:'Sayaqulu',ar:'سَيَقُولُ',ss:2,sa:142,es:2,ea:252},
    {n:3,name:'Tilka Ar-Rusul',ar:'تِلْكَ الرُّسُلُ',ss:2,sa:253,es:3,ea:92},
    {n:4,name:'Lan Tanaalu',ar:'لَنْ تَنَالُوا',ss:3,sa:93,es:4,ea:23},
    {n:5,name:'Wal-Muhsanat',ar:'وَالْمُحْصَنَاتُ',ss:4,sa:24,es:4,ea:147},
    {n:6,name:'La Yuhibbullah',ar:'لَا يُحِبُّ اللَّهُ',ss:4,sa:148,es:5,ea:81},
    {n:7,name:'Wa Idha Samiu',ar:'وَإِذَا سَمِعُوا',ss:5,sa:82,es:6,ea:110},
    {n:8,name:'Wa Law Annana',ar:'وَلَوْ أَنَّنَا',ss:6,sa:111,es:7,ea:87},
    {n:9,name:'Qalal Malau',ar:'قَالَ الْمَلَأُ',ss:7,sa:88,es:8,ea:40},
    {n:10,name:'Waalamu',ar:'وَاعْلَمُوا',ss:8,sa:41,es:9,ea:92},
    {n:11,name:'Yatadhirun',ar:'يَعْتَذِرُونَ',ss:9,sa:93,es:11,ea:5},
    {n:12,name:'Wa Ma Min Dabbah',ar:'وَمَا مِنْ دَابَّةٍ',ss:11,sa:6,es:12,ea:52},
    {n:13,name:'Wa Ma Ubarriu',ar:'وَمَا أُبَرِّئُ',ss:12,sa:53,es:14,ea:52},
    {n:14,name:'Rubama',ar:'رُبَمَا',ss:15,sa:1,es:16,ea:128},
    {n:15,name:'Subhanalladhi',ar:'سُبْحَانَ الَّذِي',ss:17,sa:1,es:18,ea:74},
    {n:16,name:'Qala Alam',ar:'قَالَ أَلَمْ',ss:18,sa:75,es:20,ea:135},
    {n:17,name:'Iqtaraba',ar:'اقْتَرَبَ',ss:21,sa:1,es:22,ea:78},
    {n:18,name:'Qad Aflaha',ar:'قَدْ أَفْلَحَ',ss:23,sa:1,es:25,ea:20},
    {n:19,name:'Wa Qalalladhina',ar:'وَقَالَ الَّذِينَ',ss:25,sa:21,es:27,ea:55},
    {n:20,name:'Amman Khalaq',ar:'أَمَّنْ خَلَقَ',ss:27,sa:56,es:29,ea:45},
    {n:21,name:'Utlu Ma Uhiya',ar:'اتْلُ مَا أُوحِيَ',ss:29,sa:46,es:33,ea:30},
    {n:22,name:'Wa Man Yaqnut',ar:'وَمَنْ يَقْنُتْ',ss:33,sa:31,es:36,ea:27},
    {n:23,name:'Wa Mali',ar:'وَمَالِيَ',ss:36,sa:28,es:39,ea:31},
    {n:24,name:'Faman Azlam',ar:'فَمَنْ أَظْلَمُ',ss:39,sa:32,es:41,ea:46},
    {n:25,name:'Ilayhi Yuraddu',ar:'إِلَيْهِ يُرَدُّ',ss:41,sa:47,es:45,ea:37},
    {n:26,name:'Ha Meem',ar:'حم',ss:46,sa:1,es:51,ea:30},
    {n:27,name:'Qala Fama Khatbukum',ar:'قَالَ فَمَا خَطْبُكُمْ',ss:51,sa:31,es:57,ea:29},
    {n:28,name:'Qad Sami Allah',ar:'قَدْ سَمِعَ اللَّهُ',ss:58,sa:1,es:66,ea:12},
    {n:29,name:'Tabarakalladhi',ar:'تَبَارَكَ الَّذِي',ss:67,sa:1,es:77,ea:50},
    {n:30,name:'Amma',ar:'عَمَّ',ss:78,sa:1,es:114,ea:6}
  ];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function chapterList() {
    return typeof chapters !== 'undefined' && Array.isArray(chapters) ? chapters : [];
  }
  function findChapter(no) {
    return chapterList()[Number(no) - 1] || null;
  }
  function chapterName(no) {
    var c = findChapter(no);
    return c ? c.englishName : 'Surah ' + no;
  }
  function refText(s, a) {
    return chapterName(s) + ' ' + s + ':' + a;
  }
  function rangeText(j) {
    if (j.ss === j.es) return refText(j.ss, j.sa) + ' – ' + j.ea;
    return refText(j.ss, j.sa) + ' – ' + refText(j.es, j.ea);
  }
  function ensureCatalog() {
    if (chapterList().length === 114) return Promise.resolve(chapterList());
    if (qv7CatalogPromise) return qv7CatalogPromise;
    qv7CatalogPromise = Promise.resolve().then(function () {
      if (typeof loadChapters === 'function') return loadChapters();
      if (typeof getJSON === 'function') {
        return getJSON('https://api.alquran.cloud/v1/surah').then(function (r) {
          if (!r || !r.data || r.data.length !== 114) throw new Error('The Surah catalogue did not contain 114 entries.');
          chapters = r.data;
          return chapters;
        });
      }
      throw new Error('Quran catalogue service is unavailable.');
    }).then(function () {
      if (chapterList().length !== 114) throw new Error('The Quran catalogue is incomplete. Expected 114 Surahs.');
      if (typeof page !== 'undefined' && page === 'quran' && quranView !== 'reader') render();
      return chapterList();
    }).catch(function (error) {
      qv7CatalogPromise = null;
      if (typeof page !== 'undefined' && page === 'quran') {
        var status = document.getElementById('qv7-catalog-status');
        if (status) status.textContent = 'Could not load all 114 Surahs. Check your connection and tap Retry.';
      }
      return [];
    });
    return qv7CatalogPromise;
  }
  function readPosition() {
    var recents = [];
    try {
      if (typeof quranRecentEntries === 'function') recents = quranRecentEntries() || [];
      else recents = JSON.parse(localStorage.getItem('noor-quran-recents') || '[]');
    } catch (_) { recents = []; }
    var raw = localStorage.getItem('noor-last-verse') || '';
    var parsed = raw.match(/^(\d+):(\d+)$/);
    var stored = parsed ? {number:Number(parsed[1]), verse:Number(parsed[2])} : null;
    var recent = recents.length ? recents[0] : null;
    if (recent && recent.number) {
      return {number:Number(recent.number), verse:Number(recent.verse || 1)};
    }
    if (stored && stored.number >= 1 && stored.number <= 114) return stored;
    var selected = Number(localStorage.getItem('noor-surah-number') || 1);
    return {number:selected >= 1 && selected <= 114 ? selected : 1, verse:1};
  }
  function saveReadPosition(surahNo, verseNo) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem('noor-quran-recents') || '[]'); } catch (_) { list = []; }
    list = Array.isArray(list) ? list : [];
    list = list.filter(function (x) { return Number(x.number) !== Number(surahNo); });
    list.unshift({number:Number(surahNo), verse:Number(verseNo || 1), at:Date.now()});
    localStorage.setItem('noor-quran-recents', JSON.stringify(list.slice(0, 12)));
    localStorage.setItem('noor-last-verse', Number(surahNo) + ':' + Number(verseNo || 1));
  }
  function currentEdition() {
    return typeof quranTranslationEditionV5 === 'function' ? quranTranslationEditionV5() : (localStorage.getItem('noor-quran-edition') || 'en.sahih');
  }
  function currentLanguage() {
    var x = typeof quranTranslationsV5 !== 'undefined' && quranTranslationsV5.find(function (y) { return y.id === currentEdition(); });
    return x ? {code:x.language, dir:x.dir} : {code:'en', dir:'ltr'};
  }
  function arabicOrdinal(n) {
    var words = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر','السادس عشر','السابع عشر','الثامن عشر','التاسع عشر','العشرون','الحادي والعشرون','الثاني والعشرون','الثالث والعشرون','الرابع والعشرون','الخامس والعشرون','السادس والعشرون','السابع والعشرون','الثامن والعشرون','التاسع والعشرون','الثلاثون'];
    return words[n - 1] || String(n);
  }

  function recentCards() {
    var entries = [];
    try { entries = typeof quranRecentEntries === 'function' ? quranRecentEntries() : JSON.parse(localStorage.getItem('noor-quran-recents') || '[]'); } catch (_) { entries = []; }
    if (!Array.isArray(entries)) entries = [];
    if (!entries.length) entries = [{number:1, verse:1}];
    return entries.slice(0, 8).map(function (entry) {
      var c = findChapter(entry.number);
      var name = c ? c.englishName : 'Surah ' + entry.number;
      var arabic = c ? c.name : 'سُورَة';
      return '<button class="qv7-recent-card" onclick="quranOpenSurahV7(' + Number(entry.number) + ',' + Number(entry.verse || 1) + ')">' +
        '<span class="qv7-recent-ar" lang="ar" dir="rtl">' + esc(arabic) + '</span>' +
        '<span class="qv7-recent-copy"><strong>' + esc(name) + '</strong><small>Aya ' + Number(entry.verse || 1) + '</small><em>Continue reading <b>→</b></em></span></button>';
    }).join('');
  }

  function quranSearchMarkup() {
    if (!qv7SearchOpen) return '';
    return '<label class="qv7-search-wrap"><span aria-hidden="true">⌕</span><input id="qv7-search" value="' + esc(qv7Query) + '" placeholder="Search Surahs or Juz" oninput="quranSearchChangeV7(this.value)"><button type="button" onclick="quranSearchClearV7()" aria-label="Clear search">×</button></label>';
  }
  function dropdownMarkup() {
    var modes = ['Sura','Juz','Revelation'];
    return '<div class="qv7-view-wrap"><button class="qv7-view-button" type="button" aria-haspopup="true" aria-expanded="' + qv7DropdownOpen + '" onclick="quranToggleViewMenuV7()"><span>View: ' + esc(qv7Mode) + '</span><i>' + (qv7DropdownOpen ? '⌃' : '⌄') + '</i></button>' +
      (qv7DropdownOpen ? '<div class="qv7-view-menu" role="menu">' + modes.map(function (m) {
        return '<button type="button" role="menuitem" class="' + (qv7Mode === m ? 'selected' : '') + '" onclick="quranSetViewModeV7(&quot;' + m + '&quot;)"><span>' + m + '</span><b>' + (qv7Mode === m ? '✓' : '') + '</b></button>';
      }).join('') + '</div>' : '') + '</div>';
  }
  function surahRows() {
    var list = chapterList();
    if (list.length !== 114) return '<div class="qv7-list-state" id="qv7-catalog-status">Loading the complete 114-Surah index…</div>';
    var q = qv7Query.trim().toLowerCase();
    var filtered = list.filter(function (c) {
      return [c.number, c.englishName, c.englishNameTranslation, c.name, c.revelationType].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (!filtered.length) return '<div class="qv7-list-state"><strong>No matching Surahs</strong><span>Try a name, number, or meaning.</span></div>';
    return filtered.map(function (c) {
      return '<button class="qv7-list-row" onclick="quranOpenSurahV7(' + Number(c.number) + ',1)"><span class="qv7-list-number">' + Number(c.number) + '</span><span class="qv7-list-ar" lang="ar" dir="rtl">' + esc(c.name || 'سُورَة') + '</span><span class="qv7-list-copy"><strong>' + esc(c.englishName) + '</strong><small>' + esc(c.englishNameTranslation || 'Surah') + ' · ' + Number(c.numberOfAyahs || 0) + ' Ayahs</small></span><span class="qv7-list-meta">' + (c.revelationType === 'Medinan' ? 'Madani' : 'Makki') + ' <b>›</b></span></button>';
    }).join('');
  }
  function juzRows() {
    var q = qv7Query.trim().toLowerCase();
    var filtered = qv7Juz.filter(function (j) {
      return ('juz ' + j.n + ' ' + j.name + ' ' + j.ar + ' ' + rangeText(j)).toLowerCase().indexOf(q) >= 0;
    });
    if (!filtered.length) return '<div class="qv7-list-state"><strong>No matching Juz</strong><span>Try a Juz number or Surah name.</span></div>';
    return filtered.map(function (j) {
      return '<button class="qv7-list-row qv7-juz-row" onclick="quranOpenJuzV7(' + j.n + ')"><span class="qv7-list-number">' + j.n + '</span><span class="qv7-list-ar" lang="ar" dir="rtl">' + esc(j.ar) + '</span><span class="qv7-list-copy"><strong>Juz ' + j.n + ' · ' + esc(j.name) + '</strong><small>' + esc(rangeText(j)) + '</small></span><span class="qv7-list-meta">Read <b>›</b></span></button>';
    }).join('');
  }
  function revelationRows() {
    var list = chapterList();
    if (list.length !== 114) return '<div class="qv7-list-state" id="qv7-catalog-status">Loading revelation details for all 114 Surahs…</div>';
    var q = qv7Query.trim().toLowerCase();
    var groups = [
      {name:'Meccan · Makki',type:'Meccan'},
      {name:'Medinan · Madani',type:'Medinan'}
    ];
    return groups.map(function (g) {
      var rows = list.filter(function (c) {
        return c.revelationType === g.type && [c.number,c.englishName,c.englishNameTranslation,c.name].join(' ').toLowerCase().indexOf(q) >= 0;
      });
      return '<section class="qv7-revelation-group"><div class="qv7-group-head"><strong>' + g.name + '</strong><span>' + rows.length + ' Surahs</span></div>' +
        (rows.length ? rows.map(function (c) {
          return '<button class="qv7-list-row" onclick="quranOpenSurahV7(' + Number(c.number) + ',1)"><span class="qv7-list-number">' + Number(c.number) + '</span><span class="qv7-list-ar" lang="ar" dir="rtl">' + esc(c.name || 'سُورَة') + '</span><span class="qv7-list-copy"><strong>' + esc(c.englishName) + '</strong><small>' + esc(c.englishNameTranslation || 'Surah') + ' · ' + Number(c.numberOfAyahs || 0) + ' Ayahs</small></span><span class="qv7-list-meta">' + g.type + ' <b>›</b></span></button>';
        }).join('') : '<div class="qv7-list-empty">No matching Surahs in this group.</div>') + '</section>';
    }).join('');
  }
  function listContent() {
    if (qv7Mode === 'Juz') return juzRows();
    if (qv7Mode === 'Revelation') return revelationRows();
    return surahRows();
  }

  function learnPanel() {
    return '<section class="qv7-learn-grid">' +
      '<article class="qv7-learn-card"><span>✦</span><small>LEARN & PRACTISE</small><h2>Start with Al-Fatiha</h2><p>Read the opening Surah with Arabic text, transliteration and meaning.</p><button onclick="quranOpenSurahV7(1,1)">Start learning →</button></article>' +
      '<article class="qv7-learn-card"><span>۞</span><small>READING GUIDE</small><h2>Build a steady habit</h2><p>Choose a Surah or Juz, keep your place, and return to your recent reading.</p><button onclick="quranSetTabV7(&quot;read&quot;)">Browse Quran →</button></article>' +
      '<article class="qv7-learn-card"><span>بِسْمِ</span><small>RECITATION</small><h2>Arabic and meaning</h2><p>Use the reader settings to choose an available translation and adjust the Arabic text size.</p><button onclick="quranOpenSurahV7(1,1)">Open reader →</button></article></section>';
  }
  function progressPanel() {
    var position = readPosition();
    var c = findChapter(position.number);
    var bookmarks = [];
    try { bookmarks = JSON.parse(localStorage.getItem('noor-bookmarks') || '[]'); } catch (_) { bookmarks = []; }
    return '<div class="qv7-progress-stats"><article><strong>114</strong><small>Surahs in the Quran</small></article><article><strong>30</strong><small>Juz parts</small></article><article><strong>' + (Array.isArray(bookmarks) ? bookmarks.length : 0) + '</strong><small>Saved Ayahs</small></article></div>' +
      '<article class="qv7-progress-card"><small>LAST READING</small><h2>' + esc(c ? c.englishName : 'Surah ' + position.number) + '</h2><p>Ayah ' + position.verse + ' · ' + esc(c ? c.englishNameTranslation : 'Continue where you left off') + '</p><button onclick="quranContinueV7()">Continue reading →</button></article>' +
      '<div class="qv7-progress-card"><small>RECENTLY OPENED</small><div class="qv7-progress-recents">' + recentCards() + '</div></div>';
  }
  function readPanel() {
    var position = readPosition();
    var c = findChapter(position.number);
    var recents = [];
    try { recents = typeof quranRecentEntries === 'function' ? quranRecentEntries() : []; } catch (_) { recents = []; }
    var recentText = c ? 'Last read · ' + c.englishName + ', Aya ' + position.verse : 'Your latest Surah and Ayah will appear here.';
    return '<article class="qv7-continue-card"><div class="qv7-continue-eyebrow">READ & REFLECT</div><h2>Continue reading</h2><p>Arabic, transliteration, meaning and recitation</p><p class="qv7-last-read">' + esc(recentText) + '</p><button onclick="quranContinueV7()">Continue reading <b>→</b></button></article>' +
      '<section class="qv7-recents-section"><div class="qv7-section-intro"><div><small>YOUR READING JOURNEY</small><h2>Recents</h2></div><button class="qv7-info" aria-label="About recents" onclick="toast(&quot;Your recent Quran readings are saved on this device&quot;)">i</button></div><div class="qv7-recents-rail">' + recentCards() + '</div></section>' +
      '<section class="qv7-list-section"><div class="qv7-list-heading"><h2>' + (qv7Mode === 'Juz' ? 'Juz list' : qv7Mode === 'Revelation' ? 'Revelation' : 'Sura list') + '</h2>' + dropdownMarkup() + '</div>' +
      quranSearchMarkup() +
      '<div class="qv7-list-container" id="qv7-list-container">' + listContent() + '</div></section>';
  }
  function quranHubMarkup() {
    var panel = qv7Tab === 'learn' ? learnPanel() : qv7Tab === 'progress' ? progressPanel() : readPanel();
    return '<section class="quran-library quran-hub-v7"><header class="library-header qv7-header"><button class="qv7-header-back" aria-label="Back to Home" onclick="go(&quot;home&quot;)">←</button><h1>Quran</h1><button class="qv7-header-action" aria-label="My bookmarks and progress" onclick="quranSetTabV7(&quot;progress&quot;)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12v17l-6-3.7-6 3.7z"/></svg></button><button class="qv7-header-action" aria-label="Search Quran" onclick="quranToggleSearchV7()"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.6"/><path d="m15.5 15.5 5.3 5.3"/></svg></button></header><nav class="library-tabs qv7-tabs" aria-label="Quran sections"><button class="' + (qv7Tab === 'read' ? 'active' : '') + '" onclick="quranSetTabV7(&quot;read&quot;)">Read</button><button class="' + (qv7Tab === 'learn' ? 'active' : '') + '" onclick="quranSetTabV7(&quot;learn&quot;)">Learn</button><button class="' + (qv7Tab === 'progress' ? 'active' : '') + '" onclick="quranSetTabV7(&quot;progress&quot;)">My Progress</button></nav><div class="library-content qv7-content">' + panel + '</div></section>';
  }

  function quranJuzReaderMarkup() {
    var meta = qv7Juz.find(function (x) { return x.n === qv7ActiveJuz; }) || qv7Juz[0];
    var language = currentLanguage();
    var top = '<header class="quran-toolbar"><button class="reader-icon" aria-label="Back to Quran" onclick="quranReturnToLibraryV7()">←</button><div class="reader-title-group"><strong class="qv7-reader-title">Juz ' + meta.n + '</strong><span class="reader-subtitle">' + esc(rangeText(meta)) + '</span></div><button class="reader-icon-button" aria-label="Reader information" onclick="toast(&quot;Juz ' + meta.n + ' · ' + (qv7JuzData ? qv7JuzData.ayahs.length : 0) + ' Ayahs&quot;)">ⓘ</button><button class="reader-icon-button" aria-label="Reader settings" onclick="quranToggleJuzSettingsV7()">⚙</button></header>' +
      '<div class="reader-settings qv7-juz-settings" id="qv7-juz-settings" hidden><label class="reader-setting"><span>Translation</span><select aria-label="Quran translation language" onchange="quranSetJuzEditionV7(this.value)">' +
      (typeof quranTranslationOptionsV5 === 'function' ? quranTranslationOptionsV5() : '<option value="en.sahih">English — Saheeh International</option>') +
      '</select></label><label class="reader-setting"><span>Arabic text size</span><input type="range" min="34" max="58" value="' + (typeof readerArabicSize === 'function' ? readerArabicSize() : 48) + '" oninput="setQuranArabicSize(this.value)"></label></div>';

    if (qv7JuzLoading) {
      return '<section class="quran-reader qv7-juz-reader">' + top + '<div class="reader-loadstatus">Loading Arabic, transliteration and translation for Juz ' + meta.n + '…</div></section>';
    }
    if (!qv7JuzData) {
      return '<section class="quran-reader qv7-juz-reader">' + top + '<div class="reader-empty">Select a Juz from the Quran list to begin reading.</div></section>';
    }
    var verses = qv7JuzData.ayahs;
    var html = '';
    var previousSurah = 0;
    verses.forEach(function (v) {
      var sNo = Number(v.surah.number);
      if (sNo !== previousSurah) {
        html += '<div class="qv7-surah-divider"><span lang="ar" dir="rtl">' + esc(v.surah.name || '') + '</span><strong>' + esc(v.surah.englishName || ('Surah ' + sNo)) + '</strong></div>';
        previousSurah = sNo;
      }
      if (Number(v.numberInSurah) === 1 && sNo !== 1 && sNo !== 9) {
        html += '<div class="surah-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
      }
      html += '<article class="ayah-block qv7-juz-ayah" data-global-ayah="' + Number(v.number) + '"><div class="ayah-tools"><button class="ayah-marker" onclick="bookmarkVerse(&quot;' + Number(v.number) + '&quot;)">Juz ' + meta.n + ' · ' + sNo + ':' + Number(v.numberInSurah) + ' <span>♡</span></button></div><div class="ayah-arabic-row"><div class="ayah-rosette"><span>' + Number(v.numberInSurah) + '</span></div><div class="arabic" lang="ar" dir="rtl">' + esc(v.text) + '</div></div>' +
        (v.transliteration ? '<div class="ayah-transliteration" lang="en">' + esc(v.transliteration) + '</div>' : '') +
        '<div class="ayah-translation" lang="' + esc(language.code) + '" dir="' + esc(language.dir) + '">' + esc(v.translation || '') + '</div><div class="ayah-bookmark"><button onclick="bookmarkVerse(&quot;' + Number(v.number) + '&quot;)">♡ Save ayah</button></div></article>';
    });
    var nav = '<div class="qv7-juz-pagination"><button ' + (meta.n === 1 ? 'disabled' : '') + ' onclick="quranOpenJuzV7(' + (meta.n - 1) + ')">← Previous Juz</button><span>Juz ' + meta.n + ' of 30</span><button ' + (meta.n === 30 ? 'disabled' : '') + ' onclick="quranOpenJuzV7(' + (meta.n + 1) + ')">Next Juz →</button></div>';
    return '<section class="quran-reader qv7-juz-reader">' + top + '<div class="reading-goal"><strong>Juz ' + meta.n + ' <span class="qv7-ayah-count">· ' + verses.length + ' Ayahs</span></strong><span class="qv7-juz-range">' + esc(rangeText(meta)) + '</span></div><div class="reader-loadstatus">Arabic · Transliteration · ' + esc(currentEdition()) + '</div><div class="ayah-list">' + html + '</div>' + nav + '</section>';
  }

  async function fetchJuz(number, edition) {
    var base = 'https://api.alquran.cloud/v1/juz/' + number + '/';
    var result = await Promise.all([
      getJSON(base + 'quran-uthmani'),
      getJSON(base + edition),
      getJSON(base + 'en.transliteration').catch(function () { return null; })
    ]);
    var arabic = result[0] && result[0].data;
    var translation = result[1] && result[1].data;
    var transliteration = result[2] && result[2].data;
    if (!arabic || !translation || !Array.isArray(arabic.ayahs) || !Array.isArray(translation.ayahs)) {
      throw new Error('The Juz response is incomplete.');
    }
    if (!arabic.ayahs.length || arabic.ayahs.length !== translation.ayahs.length) {
      throw new Error('Arabic and translation Ayah counts do not match.');
    }
    var transRows = transliteration && Array.isArray(transliteration.ayahs) ? transliteration.ayahs : [];
    var transByNumber = new Map(transRows.map(function (x) { return [Number(x.number), x.text]; }));
    var rows = arabic.ayahs.map(function (a, i) {
      var t = translation.ayahs[i];
      if (!t || Number(a.number) !== Number(t.number) ||
          Number(a.numberInSurah) !== Number(t.numberInSurah) ||
          Number(a.surah.number) !== Number(t.surah.number) ||
          !String(a.text || '').trim() || !String(t.text || '').trim()) {
        throw new Error('Ayah alignment check failed in Juz ' + number + ' at item ' + (i + 1) + '.');
      }
      var text = a.text;
      if (Number(a.numberInSurah) === 1 && Number(a.surah.number) !== 1 && Number(a.surah.number) !== 9 &&
          typeof stripOpeningBismillahV5 === 'function') {
        text = stripOpeningBismillahV5(text);
      }
      return {
        number:Number(a.number),
        numberInSurah:Number(a.numberInSurah),
        text:text,
        translation:t.text,
        transliteration:transByNumber.get(Number(a.number)) || '',
        surah:a.surah,
        juz:Number(a.juz || number)
      };
    });
    var meta = qv7Juz[number - 1];
    var first = rows[0], last = rows[rows.length - 1];
    if (!meta || Number(first.surah.number) !== meta.ss || Number(first.numberInSurah) !== meta.sa ||
        Number(last.surah.number) !== meta.es || Number(last.numberInSurah) !== meta.ea) {
      throw new Error('Juz ' + number + ' start/end references did not match the verified index.');
    }
    return {number:number, ayahs:rows, edition:edition};
  }

  window.quranSetTabV7 = function (tab) {
    qv7Tab = tab === 'learn' || tab === 'progress' ? tab : 'read';
    qv7DropdownOpen = false;
    render();
    window.scrollTo(0, 0);
  };
  window.quranToggleSearchV7 = function () {
    qv7SearchOpen = !qv7SearchOpen;
    qv7Query = '';
    render();
    if (qv7SearchOpen) {
      var input = document.getElementById('qv7-search');
      if (input) input.focus();
    }
  };
  window.quranSearchChangeV7 = function (value) {
    qv7Query = String(value || '');
    var list = document.getElementById('qv7-list-container');
    if (list) list.innerHTML = listContent();
  };
  window.quranSearchClearV7 = function () {
    qv7Query = '';
    render();
    var input = document.getElementById('qv7-search');
    if (input) input.focus();
  };
  window.quranToggleViewMenuV7 = function () {
    qv7DropdownOpen = !qv7DropdownOpen;
    render();
  };
  window.quranSetViewModeV7 = function (mode) {
    if (['Sura','Juz','Revelation'].indexOf(mode) < 0) return;
    qv7Mode = mode;
    localStorage.setItem('noor-quran-view-mode', mode);
    qv7Query = '';
    qv7DropdownOpen = false;
    render();
  };
  window.quranOpenSurahV7 = function (number, verse) {
    var n = Math.max(1, Math.min(114, Number(number) || 1));
    qv7ReadingMode = 'sura';
    qv7JuzData = null;
    quranView = 'reader';
    window.scrollTo(0, 0);
    var task = typeof readSurah === 'function' ? readSurah(n) : Promise.reject(new Error('Surah reader is unavailable.'));
    Promise.resolve(task).then(function () {
      if (verse && Number(verse) > 1) {
        var target = document.querySelectorAll('.ayah-marker');
        var needle = 'Ayah ' + n + ':' + Number(verse);
        for (var i = 0; i < target.length; i += 1) {
          if ((target[i].textContent || '').indexOf(needle) >= 0) {
            target[i].closest('.ayah-block').scrollIntoView({block:'start',behavior:'smooth'});
            break;
          }
        }
      }
    });
  };
  window.quranContinueV7 = function () {
    var p = readPosition();
    window.quranOpenSurahV7(p.number, p.verse);
  };
  window.quranOpenJuzV7 = async function (number) {
    var n = Math.max(1, Math.min(30, Number(number) || 1));
    qv7ReadingMode = 'juz';
    qv7ActiveJuz = n;
    qv7JuzData = null;
    qv7JuzLoading = true;
    quranView = 'reader';
    if (typeof stopAudio === 'function') stopAudio();
    render();
    window.scrollTo(0, 0);
    try {
      qv7JuzData = await fetchJuz(n, currentEdition());
      qv7JuzLoading = false;
      render();
      window.scrollTo(0, 0);
    } catch (error) {
      qv7JuzLoading = false;
      qv7JuzData = null;
      render();
      toast('Could not load Juz ' + n + '. ' + (error && error.message ? error.message : 'Check your internet connection.'));
    }
  };
  window.quranSetJuzEditionV7 = function (edition) {
    var allowed = typeof quranTranslationsV5 !== 'undefined' && quranTranslationsV5.some(function (x) { return x.id === edition; });
    if (!allowed) return;
    localStorage.setItem('noor-quran-edition', edition);
    if (qv7ReadingMode === 'juz') window.quranOpenJuzV7(qv7ActiveJuz);
    else if (typeof setQuranTranslationEditionV5 === 'function') setQuranTranslationEditionV5(edition);
  };
  window.quranToggleJuzSettingsV7 = function () {
    var el = document.getElementById('qv7-juz-settings');
    if (el) el.hidden = !el.hidden;
  };
  window.quranReturnToLibraryV7 = function () {
    qv7ReadingMode = 'sura';
    qv7JuzData = null;
    qv7JuzLoading = false;
    quranView = 'library';
    if (typeof stopAudio === 'function') stopAudio();
    render();
    window.scrollTo(0, 0);
  };
  window.quranGetViewModeV7 = function () { return qv7Mode; };

  function quranPageV7() {
    if (quranView === 'reader') {
      return qv7ReadingMode === 'juz' ? quranJuzReaderMarkup() : quranReaderPageV2();
    }
    if (chapterList().length !== 114 && !qv7CatalogPromise) ensureCatalog();
    return quranHubMarkup();
  }
  quranPage = quranPageV7;

  var qv7PreviousGo = go;
  go = function (target) {
    if (target === 'quran') {
      qv7ReadingMode = 'sura';
      qv7JuzData = null;
      qv7Tab = 'read';
      qv7Query = '';
      qv7SearchOpen = false;
      qv7DropdownOpen = false;
    }
    return qv7PreviousGo.apply(this, arguments);
  };

  var qv7PreviousTranslationChange = typeof setQuranTranslationEditionV5 === 'function' ? setQuranTranslationEditionV5 : null;
  if (qv7PreviousTranslationChange) {
    setQuranTranslationEditionV5 = function (edition) {
      if (qv7ReadingMode === 'juz' && quranView === 'reader') {
        window.quranSetJuzEditionV7(edition);
      } else {
        qv7PreviousTranslationChange(edition);
      }
    };
  }

  function visibleAyah() {
    var rows = document.querySelectorAll('.ayah-block');
    if (!rows.length) return null;
    var chosen = null;
    for (var i = 0; i < rows.length; i += 1) {
      var rect = rows[i].getBoundingClientRect();
      if (rect.bottom > 145) { chosen = rows[i]; break; }
    }
    if (!chosen) chosen = rows[rows.length - 1];
    var marker = chosen.querySelector('.ayah-marker');
    var match = marker && (marker.textContent || '').match(/Ayah\s+\d+:(\d+)/i);
    if (!match) return null;
    return Number(match[1]);
  }
  window.addEventListener('scroll', function () {
    if (typeof page === 'undefined' || page !== 'quran' || quranView !== 'reader' || qv7ReadingMode !== 'sura') return;
    if (qv7ProgressTimer) window.clearTimeout(qv7ProgressTimer);
    qv7ProgressTimer = window.setTimeout(function () {
      var number = Number(localStorage.getItem('noor-surah-number') || 1);
      var verse = visibleAyah();
      if (verse && number >= 1 && number <= 114) saveReadPosition(number, verse);
    }, 240);
  }, {passive:true});

  if (typeof page !== 'undefined' && page === 'quran' && typeof render === 'function') render();
})();