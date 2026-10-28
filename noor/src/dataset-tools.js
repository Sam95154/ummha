/* Noor-ul-Islam Quran dataset importer and structural validator.
   This validates shape/completeness only; it cannot independently prove textual authenticity or licensing. */
(function () {
  'use strict';
  const EXPECTED_TOTAL = 6236;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let imported = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function normalizeSurah(s, index) {
    const no = Number(s.no ?? s.number ?? index + 1);
    const verses = Array.isArray(s.ayahs) ? s.ayahs : Array.isArray(s.verses) ? s.verses : [];
    return {
      no,
      name: String(s.name ?? s.englishName ?? window.NoorData.surahs[index]?.name ?? `Surah ${no}`),
      count: Number(s.count ?? s.ayahCount ?? verses.length),
      ayahs: verses.map((a, i) => ({
        n: Number(a.n ?? a.numberInSurah ?? a.ayah ?? i + 1),
        ar: String(a.ar ?? a.arabic ?? a.textArabic ?? ''),
        tr: String(a.tr ?? a.transliteration ?? ''),
        en: String(a.en ?? a.english ?? a.translationEn ?? ''),
        ur: String(a.ur ?? a.urdu ?? a.translationUr ?? '')
      }))
    };
  }

  function validate(data) {
    const errors = [], warnings = [];
    if (!data || typeof data !== 'object') return {ok:false, errors:['The JSON root must be an object.'], warnings:[], summary:{}};
    const input = Array.isArray(data.surahs) ? data.surahs : Array.isArray(data.chapters) ? data.chapters : null;
    if (!input) return {ok:false, errors:['Expected a "surahs" array (or "chapters" array).'], warnings:[], summary:{}};
    if (input.length !== 114) errors.push(`Expected 114 Surahs; found ${input.length}.`);
    const surahs = input.map(normalizeSurah);
    let total = 0, arabicCount = 0;
    const translationCounts = {tr:0,en:0,ur:0};
    surahs.forEach((s, i) => {
      const expected = window.NoorData.surahs[i];
      if (s.no !== i + 1) errors.push(`Entry ${i + 1}: expected Surah number ${i + 1}; found ${s.no}.`);
      if (expected && s.count !== expected.count) errors.push(`Surah ${i + 1}: expected ${expected.count} Ayahs; found ${s.count}.`);
      if (s.ayahs.length !== s.count) errors.push(`Surah ${i + 1}: count says ${s.count}, but ${s.ayahs.length} verse records were found.`);
      total += s.ayahs.length;
      const ids = s.ayahs.map(a => a.n);
      if (ids.some((n, j) => n !== j + 1)) errors.push(`Surah ${i + 1}: Ayah IDs must be sequential from 1.`);
      s.ayahs.forEach((a, j) => {
        if (a.ar.trim()) arabicCount++;
        else errors.push(`Missing Arabic text at ${i + 1}:${j + 1}.`);
        ['tr','en','ur'].forEach(k => { if (a[k].trim()) translationCounts[k]++; });
      });
    });
    if (total !== EXPECTED_TOTAL) errors.push(`Expected ${EXPECTED_TOTAL} Ayahs in total; found ${total}.`);
    if (arabicCount !== EXPECTED_TOTAL) errors.push(`Expected Arabic text for ${EXPECTED_TOTAL} Ayahs; found ${arabicCount}.`);
    [['tr','Roman transliteration'],['en','English translation'],['ur','Urdu translation']].forEach(([k,label]) => {
      if (translationCounts[k] !== EXPECTED_TOTAL) warnings.push(`${label} is incomplete: ${translationCounts[k]} of ${EXPECTED_TOTAL} Ayahs have text.`);
    });
    const source = data.source || data.metadata?.source || {};
    if (!source.name) warnings.push('Source name is missing. Add source.name to document provenance.');
    if (!source.url) warnings.push('Source URL is missing. Add source.url.');
    if (!source.license) warnings.push('License is missing or unconfirmed. Do not publish until reuse terms are verified.');
    warnings.push('Structural validation does not prove that the Arabic matches a trusted Mushaf or that translations/audio are licensed. Verify source and license independently.');
    return {ok:errors.length===0, errors, warnings, summary:{surahs:surahs.length, ayahs:total, arabic:arabicCount, transliteration:translationCounts.tr, english:translationCounts.en, urdu:translationCounts.ur}, surahs, source};
  }

  function ensurePanel() {
    const view = $('#view');
    if (!view || !$('#sl') || $('.dataset-tools', view)) return;
    const section = $('#ay')?.parentElement;
    if (!section) return;
    const panel = document.createElement('section');
    panel.className = 'card dataset-tools';
    panel.innerHTML = `<div class="row" style="justify-content:space-between"><div><h3 style="margin:0">Quran data connection</h3><p class="mut" style="margin:.25rem 0">Load the official Tanzil verse-numbered TXT or a compatible JSON dataset. The selected file stays in this browser session; it is not uploaded.</p></div><span class="chip" id="dataset-status">Demo mode</span></div><div class="row" style="margin-top:10px"><button class="c" type="button" id="dataset-pick">Choose Quran JSON or Tanzil TXT</button><input id="dataset-file" type="file" accept=".json,.txt,application/json,text/plain" hidden><button class="c" type="button" id="dataset-report" disabled>Download validation report</button></div><div id="dataset-report-box" aria-live="polite" class="mut" style="margin-top:8px">No verified dataset is connected. The reader will continue to show explicit placeholders.</div>`;
    section.insertBefore(panel, $('#sh'));
    $('#dataset-pick', panel).addEventListener('click', () => $('#dataset-file', panel).click());
    $('#dataset-file', panel).addEventListener('change', onFile);
    $('#dataset-report', panel).addEventListener('click', downloadReport);
    updateStatus();
  }

  function updateStatus(result) {
    const badge = $('#dataset-status');
    const box = $('#dataset-report-box');
    const reportButton = $('#dataset-report');
    if (!badge || !box) return;
    if (!result) {
      badge.textContent = imported ? 'Loaded in this session' : 'Demo mode';
      badge.className = `chip ${imported ? 'live' : ''}`;
      box.textContent = imported ? 'A dataset is loaded in memory. Refreshing the page will remove it unless you load it again.' : 'No verified dataset is connected. The reader will continue to show explicit placeholders.';
      if (reportButton) reportButton.disabled = !window.NoorDatasetLastReport;
      return;
    }
    badge.textContent = result.ok ? 'Structure checks passed' : 'Validation failed';
    badge.className = `chip ${result.ok ? 'live' : ''}`;
    const rows = [
      `<b>Summary:</b> ${result.summary.surahs ?? 0} Surahs · ${result.summary.ayahs ?? 0} Ayahs · ${result.summary.arabic ?? 0} Arabic records`,
      ...(result.errors || []).map(x => `<span style="color:#b42318">Error: ${escapeHtml(x)}</span>`),
      ...(result.warnings || []).map(x => `<span>Note: ${escapeHtml(x)}</span>`)
    ];
    box.innerHTML = rows.map(x => `<div style="margin:4px 0">${x}</div>`).join('');
    if (reportButton) reportButton.disabled = false;
  }

  function parseTanzilText(text) {
    const lines = String(text).replace(/^\uFEFF/, '').split(/\n/);
    const surahs = Array.from({length:114}, (_, i) => ({
      no: i + 1,
      name: window.NoorData.surahs[i]?.name || `Surah ${i + 1}`,
      count: 0,
      ayahs: []
    }));
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\r$/, '');
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^(\d+)\|(\d+)\|(.*)$/);
      if (!match) { errors.push(`Line ${i + 1}: expected surah|ayah|Arabic text.`); if (errors.length >= 10) break; continue; }
      const surahNo = Number(match[1]), ayahNo = Number(match[2]), arabic = match[3];
      if (surahNo < 1 || surahNo > 114) { errors.push(`Line ${i + 1}: invalid Surah number ${surahNo}.`); continue; }
      surahs[surahNo - 1].ayahs.push({n:ayahNo, ar:arabic, tr:'', en:'', ur:''});
      surahs[surahNo - 1].count++;
    }
    if (errors.length) throw new Error(errors.join(' '));
    return {
      source: {
        name: 'Tanzil Quran Text (Uthmani, Version 1.1)',
        url: 'https://tanzil.net/',
        license: 'Creative Commons Attribution 3.0',
        licenseUrl: 'https://tanzil.net/docs/Text_License',
        note: 'Raw TXT parsed in memory; the selected original file is not modified. Translation/audio sources are not included.'
      },
      surahs
    };
  }

  function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        const content = String(reader.result);
        data = /\.txt$/i.test(file.name) ? parseTanzilText(content) : JSON.parse(content);
      }
      catch (error) { const r={ok:false,errors:[error?.message || 'Could not parse file. Use UTF-8 JSON or Tanzil verse-numbered TXT (surah|ayah|Arabic).'],warnings:[],summary:{}}; window.NoorDatasetLastReport=r; updateStatus(r); return; }
      const result = validate(data);
      window.NoorDatasetLastReport = {ok:result.ok, errors:result.errors, warnings:result.warnings, summary:result.summary, source:result.source || data.source || null, fileName:file.name, checkedAt:new Date().toISOString()};
      if (!result.ok) { updateStatus(result); return; }
      imported = result;
      window.NoorData.surahs = result.surahs.map(s => ({no:s.no,name:s.name,count:s.count}));
      window.NoorData.mode = 'uploaded-structurally-validated';
      window.NoorData.getAyahs = no => Promise.resolve({
        status:'imported',
        source:result.source,
        ayahs:result.surahs[no-1].ayahs
      });
      updateStatus(result);
      if (typeof window.NoorRender === 'function') window.NoorRender();
      else location.hash = '#/quran';
    };
    reader.onerror = () => { const r={ok:false,errors:['The selected file could not be read.'],warnings:[],summary:{}}; window.NoorDatasetLastReport=r; updateStatus(r); };
    reader.readAsText(file, 'utf-8');
  }

  function downloadReport() {
    const report = window.NoorDatasetLastReport;
    if (!report) return;
    const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='noor-quran-validation-report.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const observer = new MutationObserver(() => ensurePanel());
  observer.observe(document.documentElement, {subtree:true, childList:true});
  document.addEventListener('DOMContentLoaded', ensurePanel);
  setTimeout(ensurePanel, 0);
})();
