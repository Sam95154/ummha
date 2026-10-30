/* MOMIN Duas V2: adapt the supplied duas.html visual language to the live, data-backed Duas routes. */
(function () {
  "use strict";
  if (document.getElementById("momin-duas-design-v2")) return;
  var style = document.createElement("style");
  style.id = "momin-duas-design-v2";
  style.textContent = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
body.dua-app-mode .layout{display:block!important;grid-template-columns:1fr!important;min-height:100dvh;padding:0!important}
body.dua-app-mode .sidebar,body.dua-app-mode main>.top,body.dua-app-mode .mobilebar{display:none!important}
body.dua-app-mode main{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
body.dua-app-mode .content{width:100%!important;max-width:480px!important;min-height:100vh;margin:0 auto!important;padding:0!important;background:transparent!important;box-shadow:none!important}
body.dua-app-mode .dua-page{
  --dua-bg:#0a1613;--dua-glow:radial-gradient(120% 55% at 50% -5%,#134a3f 0%,rgba(19,74,63,0) 70%);
  --dua-card:#1a1711;--dua-card2:#221e15;--dua-line:#2e2a1f;--dua-ink:#f3ede0;--dua-muted:#a8a08d;
  --dua-gold:#d9b25f;--dua-gold2:#efcb7b;--dua-goldsoft:rgba(217,178,95,.14);--dua-glass:rgba(12,24,20,.84);
  --dua-field:rgba(255,255,255,.06);--dua-shadow:rgba(0,0,0,.5);--dua-hill1:#0f4a41;--dua-hill2:#0a2f2a;
  position:relative;isolation:isolate;width:100%;max-width:480px;min-height:100dvh;margin:0 auto;
  padding:0 16px calc(118px + env(safe-area-inset-bottom,0px));overflow:hidden;
  background-color:var(--dua-bg);background-image:var(--dua-glow);background-repeat:no-repeat;
  color:var(--dua-ink);font-family:'DM Sans',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.45;
  -webkit-font-smoothing:antialiased;color-scheme:dark
}
:root[data-theme="light"] body.dua-app-mode .dua-page{--dua-bg:#f1ede2;--dua-glow:radial-gradient(120% 50% at 50% -5%,#cfe3da 0%,rgba(207,227,218,0) 70%);--dua-card:#fdfbf6;--dua-card2:#f7f2e6;--dua-line:#e4dcc7;--dua-ink:#1b1710;--dua-muted:#7a7466;--dua-gold:#a97a22;--dua-gold2:#c4902f;--dua-goldsoft:rgba(169,122,34,.13);--dua-glass:rgba(250,247,239,.88);--dua-field:rgba(27,23,16,.05);--dua-shadow:rgba(60,40,10,.16);--dua-hill1:#1d6a5d;--dua-hill2:#0f4a41;color-scheme:light}
@media(prefers-color-scheme:light){:root:not([data-theme="dark"]) body.dua-app-mode .dua-page{--dua-bg:#f1ede2;--dua-glow:radial-gradient(120% 50% at 50% -5%,#cfe3da 0%,rgba(207,227,218,0) 70%);--dua-card:#fdfbf6;--dua-card2:#f7f2e6;--dua-line:#e4dcc7;--dua-ink:#1b1710;--dua-muted:#7a7466;--dua-gold:#a97a22;--dua-gold2:#c4902f;--dua-goldsoft:rgba(169,122,34,.13);--dua-glass:rgba(250,247,239,.88);--dua-field:rgba(27,23,16,.05);--dua-shadow:rgba(60,40,10,.16);--dua-hill1:#1d6a5d;--dua-hill2:#0f4a41;color-scheme:light}}
:root[data-theme="sepia"] body.dua-app-mode .dua-page{--dua-bg:#eee4cf;--dua-glow:radial-gradient(120% 50% at 50% -5%,#e1d0ad 0%,rgba(225,208,173,0) 70%);--dua-card:#fff7e6;--dua-card2:#f5ebd8;--dua-line:#dfd1b5;--dua-ink:#33291c;--dua-muted:#7c6b51;--dua-gold:#9b6e26;--dua-gold2:#b8893b;--dua-goldsoft:rgba(155,110,38,.14);--dua-glass:rgba(255,247,230,.9);--dua-field:rgba(51,41,28,.05);--dua-shadow:rgba(60,40,10,.13);--dua-hill1:#527968;--dua-hill2:#244e43;color-scheme:light}
body.dua-app-mode .dua-page *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body.dua-app-mode .dua-page a{color:inherit;text-decoration:none}
body.dua-app-mode .dua-page button,input{font:inherit}
body.dua-app-mode .dua-page h1,body.dua-app-mode .dua-page h2,body.dua-app-mode .dua-page h3,body.dua-app-mode .dua-page p{margin-top:0}
body.dua-app-mode .dua-topbar{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:8px;min-height:66px;position:sticky;top:0;z-index:20;margin:0 -16px 15px;padding:10px 16px;background:var(--dua-glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--dua-line)}
body.dua-app-mode .dua-topbar .dua-back{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border-radius:50%;color:var(--dua-ink);font-size:30px;font-weight:300;line-height:1}
body.dua-app-mode .dua-topbar h1{margin:0;text-align:center;font:600 21px/1.25 'Playfair Display',Georgia,serif;letter-spacing:-.005em;color:var(--dua-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.dua-app-mode .dua-top-actions{display:flex;align-items:center;justify-content:flex-end;gap:4px;min-width:44px}
body.dua-app-mode .dua-top-actions>a{display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--dua-line);border-radius:50%;color:var(--dua-gold2);font-size:23px}
body.dua-app-mode .dua-top-actions .dua-header-heart{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8}
body.dua-app-mode .dua-search-wrap{height:56px;margin:17px 0 15px;padding:0 8px 0 18px;border-radius:999px;background:var(--dua-field);border:1px solid var(--dua-line);display:flex;align-items:center;gap:10px;color:var(--dua-muted);box-shadow:none}
body.dua-app-mode .dua-search-wrap>span{font-size:23px;line-height:1;color:var(--dua-muted)}
body.dua-app-mode .dua-search-wrap input{flex:1;min-width:0;width:100%;height:100%;padding:8px 0;background:transparent;border:0;outline:0;color:var(--dua-ink);font:400 15px/1.4 'DM Sans',system-ui,sans-serif;box-shadow:none}
body.dua-app-mode .dua-search-wrap input::placeholder{color:var(--dua-muted);opacity:1}
body.dua-app-mode .dua-search-wrap button{width:40px;height:40px;border-radius:50%;border:0;background:var(--dua-goldsoft);color:var(--dua-gold2);font-size:22px}
body.dua-app-mode .dua-search-wrap button[hidden]{display:none!important}
body.dua-app-mode .dua-shortcuts{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:0 0 25px!important;padding:10px!important;background:var(--dua-card)!important;border:1px solid var(--dua-line)!important;border-radius:22px!important}
body.dua-app-mode .dua-shortcuts a{min-width:0;min-height:66px;display:grid!important;grid-template-columns:38px minmax(0,1fr)!important;grid-template-rows:auto auto!important;align-items:center;justify-items:start;column-gap:10px;row-gap:3px;padding:9px!important;text-align:left!important;color:var(--dua-ink)!important;background:var(--dua-card2)!important;border:1px solid var(--dua-line)!important;border-radius:16px!important;font-size:12px!important;line-height:1.3}
body.dua-app-mode .dua-shortcuts a:hover{border-color:var(--dua-gold)!important;background:var(--dua-goldsoft)!important}
body.dua-app-mode .dua-shortcuts .shortcut-icon{grid-column:1;grid-row:1/span 2;width:38px;height:38px;display:grid;place-items:center;font-size:22px;color:var(--dua-gold2)}
body.dua-app-mode .dua-shortcuts small{grid-column:2;grid-row:2;display:block;width:100%;min-width:0;color:var(--dua-muted)!important;font-size:10px!important;line-height:1.3;text-align:left;white-space:normal;overflow-wrap:anywhere}
body.dua-app-mode .dua-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:32px 2px 14px}
body.dua-app-mode .dua-section-head small,body.dua-app-mode .dua-eyebrow{display:block;color:var(--dua-gold);font-weight:700;letter-spacing:.17em;font-size:10px;text-transform:uppercase;margin:0 0 6px;line-height:1.3}
body.dua-app-mode .dua-section-head h2{margin:0;font:600 26px/1.13 'Playfair Display',Georgia,serif;color:var(--dua-ink);letter-spacing:-.01em}
body.dua-app-mode .dua-section-head>a{color:var(--dua-gold2);font-weight:600;font-size:13px;white-space:nowrap;display:inline-flex;gap:6px}
body.dua-app-mode .dua-feature-card{display:grid;grid-template-columns:minmax(0,40%) minmax(0,1fr);min-height:160px;border:1px solid var(--dua-line);border-radius:25px;background:var(--dua-card);overflow:hidden;box-shadow:0 22px 40px -28px var(--dua-shadow)}
body.dua-app-mode .dua-feature-card .dua-art{height:100%;min-height:160px;border-radius:0}
body.dua-app-mode .dua-feature-copy{min-width:0;padding:17px 15px;align-self:center}
body.dua-app-mode .dua-tag{display:inline-block;font-size:9px;line-height:1.3;letter-spacing:.13em;border:1px solid var(--dua-line);color:var(--dua-gold2);border-radius:99px;padding:5px 8px;margin-bottom:8px}
body.dua-app-mode .dua-feature-copy h3{font:600 21px/1.15 'Playfair Display',Georgia,serif;margin:0 0 7px;color:var(--dua-ink)}
body.dua-app-mode .dua-feature-copy p{font-size:12px;line-height:1.5;color:var(--dua-muted);margin:0 0 10px}
body.dua-app-mode .dua-feature-copy small{font-size:10px;color:var(--dua-muted);line-height:1.4;display:block}
body.dua-app-mode .dua-feature-copy small span{float:right;font-size:16px;color:var(--dua-gold2)}
body.dua-app-mode .dua-card-scroller{display:flex;gap:13px;overflow-x:auto;scroll-snap-type:x proximity;margin:0 -16px;padding:4px 16px 15px;scrollbar-width:none}
body.dua-app-mode .dua-card-scroller::-webkit-scrollbar{display:none}
body.dua-app-mode .dua-category-card{display:block;flex:0 0 min(62vw,230px);width:min(62vw,230px);max-width:230px;min-width:150px;border-radius:23px;overflow:hidden;background:var(--dua-card);border:1px solid var(--dua-line);scroll-snap-align:start;box-shadow:0 15px 28px -24px var(--dua-shadow);transition:transform .3s,border-color .25s}
body.dua-app-mode .dua-category-card:hover{transform:translateY(-3px);border-color:var(--dua-gold)}
body.dua-app-mode .dua-category-card .dua-art{height:116px;border-radius:0}
body.dua-app-mode .dua-category-copy{min-width:0;padding:13px 14px 15px}
body.dua-app-mode .dua-category-copy h3{font:600 16px/1.25 'Playfair Display',Georgia,serif;margin:0 0 5px;color:var(--dua-ink);overflow-wrap:anywhere}
body.dua-app-mode .dua-category-copy p{font-size:12px;line-height:1.4;color:var(--dua-muted);margin:0}
body.dua-app-mode .dua-essential-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
body.dua-app-mode .dua-essential-card{display:block;min-width:0;background:var(--dua-card);border:1px solid var(--dua-line);border-radius:20px;overflow:hidden;box-shadow:0 13px 25px -24px var(--dua-shadow)}
body.dua-app-mode .dua-essential-card .dua-art{height:100px;border-radius:0}
body.dua-app-mode .dua-essential-card>div:last-child{padding:13px}
body.dua-app-mode .dua-essential-card h3{font:600 16px/1.2 'Playfair Display',Georgia,serif;margin:0 0 6px;color:var(--dua-ink);overflow-wrap:anywhere}
body.dua-app-mode .dua-essential-card p{font-size:11px;line-height:1.4;color:var(--dua-muted);margin:0 0 9px}
body.dua-app-mode .dua-essential-card span{font-size:11px;color:var(--dua-gold2)}
body.dua-app-mode .dua-art{background:linear-gradient(145deg,#366b5d,#092f2c);border-radius:14px}
body.dua-app-mode .dua-art:before{background:radial-gradient(circle at 20% 12%,rgba(244,229,177,.4),transparent 24%),linear-gradient(180deg,rgba(7,45,39,.02),rgba(2,31,27,.62))}
body.dua-app-mode .dua-art .art-hill{background:rgba(8,48,42,.72)}
body.dua-app-mode .dua-note{margin:19px 0 0;padding:14px 15px;border:1px solid var(--dua-line);border-radius:17px;background:var(--dua-card);color:var(--dua-muted);font-size:11px;line-height:1.5}
body.dua-app-mode .dua-search-results{margin-top:12px}
body.dua-app-mode .dua-search-label{margin:17px 2px 8px;color:var(--dua-gold);font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase}
body.dua-app-mode .dua-search-result{display:flex;align-items:center;gap:12px;padding:14px;border-top:1px solid var(--dua-line);color:var(--dua-ink)}
body.dua-app-mode .dua-search-result>span:first-child{width:34px;height:34px;display:grid;place-items:center;border-radius:12px;background:var(--dua-goldsoft);color:var(--dua-gold2);flex:none}
body.dua-app-mode .dua-search-result>span:nth-child(2){flex:1;min-width:0}
body.dua-app-mode .dua-search-result strong{display:block;font-size:13px}
body.dua-app-mode .dua-search-result small{display:block;margin-top:3px;color:var(--dua-muted);font-size:10px}
body.dua-app-mode .dua-search-result>b{color:var(--dua-gold2)}
body.dua-app-mode .dua-empty-search{padding:20px;text-align:center;color:var(--dua-muted);font-size:13px}
body.dua-app-mode .dua-category-hero{display:grid;grid-template-columns:minmax(0,42%) minmax(0,1fr);gap:15px;align-items:center;padding:15px 0 17px;border-bottom:1px solid var(--dua-line)}
body.dua-app-mode .dua-category-hero .dua-art{height:145px;min-height:145px}
body.dua-app-mode .dua-category-hero h2{font:600 24px/1.2 'Playfair Display',Georgia,serif;margin:3px 0 7px;color:var(--dua-ink);overflow-wrap:anywhere}
body.dua-app-mode .dua-category-hero p,body.dua-app-mode .dua-list-intro{font-size:12px;color:var(--dua-muted);line-height:1.5;margin:0 0 9px}
body.dua-app-mode .dua-category-hero small{font-size:10px;color:var(--dua-muted)}
body.dua-app-mode .dua-chapter-list{margin-top:10px;border-top:1px solid var(--dua-line)}
body.dua-app-mode .dua-list-row{min-height:66px;display:flex;align-items:center;gap:12px;padding:11px 3px;border-bottom:1px solid var(--dua-line);min-width:0;color:var(--dua-ink)}
body.dua-app-mode .dua-row-book{width:34px;flex:0 0 34px;height:34px;display:grid;place-items:center;border-radius:12px;background:var(--dua-goldsoft);color:var(--dua-gold2);font-size:18px}
body.dua-app-mode .dua-row-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
body.dua-app-mode .dua-row-copy strong{font-size:13px;font-weight:600;line-height:1.4;color:var(--dua-ink);overflow-wrap:anywhere}
body.dua-app-mode .dua-row-copy small{font-size:10px;color:var(--dua-muted);line-height:1.35}
body.dua-app-mode .dua-row-arrow{font-size:22px;line-height:1;color:var(--dua-gold2);padding:0 6px;font-weight:300}
body.dua-app-mode .dua-entry-open{display:flex;align-items:center;gap:12px;flex:1;min-width:0;min-height:45px}
body.dua-app-mode .dua-small-bookmark{width:38px;height:38px;flex:0 0 38px;border:1px solid var(--dua-line);background:var(--dua-card);color:var(--dua-muted);border-radius:50%;font-size:20px;cursor:pointer}
body.dua-app-mode .dua-small-bookmark.is-saved{color:#1b1710;background:var(--dua-gold2);border-color:var(--dua-gold2)}
body.dua-app-mode .dua-chapter-context{display:grid;grid-template-columns:110px minmax(0,1fr);gap:13px;align-items:center;margin:13px 0 16px}
body.dua-app-mode .dua-chapter-context .dua-art{height:90px;min-height:90px}
body.dua-app-mode .dua-chapter-context h2{font:600 17px/1.3 'Playfair Display',Georgia,serif;margin:3px 0 5px;color:var(--dua-ink);overflow-wrap:anywhere}
body.dua-app-mode .dua-chapter-context small{font-size:9px;letter-spacing:.12em;color:var(--dua-muted);text-transform:uppercase}
body.dua-app-mode .dua-chapter-context p{font-size:10px;color:var(--dua-muted);margin:0}
body.dua-app-mode .dua-detail-top{margin:0 -16px 0;padding:0 16px 7px;background:var(--dua-glass);position:sticky;top:0;z-index:15;backdrop-filter:blur(16px)}
body.dua-app-mode .dua-detail-top .dua-topbar{position:static;margin:0 -16px;background:transparent;border-bottom:0}
body.dua-app-mode .dua-detail-pager{display:flex;justify-content:center;align-items:center;gap:20px;height:30px;font-size:11px;color:var(--dua-muted)}
body.dua-app-mode .dua-detail-pager small{font-size:9px;color:var(--dua-muted);padding:0 2px}
body.dua-app-mode .dua-page-arrow{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;font-size:20px;color:var(--dua-ink)}
body.dua-app-mode .dua-page-arrow.is-disabled{opacity:.25}
body.dua-app-mode .dua-reading-card{position:relative;margin:18px 0 0;min-height:300px;padding:54px 20px 26px;background:radial-gradient(ellipse at 50% 20%,rgba(54,121,101,.16),transparent 47%),linear-gradient(155deg,#0a463d,#063a33 85%);border:1px solid rgba(231,249,240,.12);border-radius:25px;box-shadow:0 18px 50px var(--dua-shadow);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
body.dua-app-mode .dua-card-actions{position:absolute;top:10px;inset-inline-end:10px;display:flex;align-items:center;gap:3px}
body.dua-app-mode .dua-card-actions .dua-icon-btn{font-size:19px;color:#f0d89f}
body.dua-app-mode .dua-more-menu{position:absolute;top:45px;inset-inline-end:10px;z-index:5;min-width:185px;padding:5px;border-radius:14px;background:#154f45;border:1px solid rgba(240,250,245,.14);box-shadow:0 12px 25px #001a1666;text-align:start}
body.dua-app-mode .dua-more-menu[hidden],body.dua-app-mode .dua-settings-panel[hidden]{display:none!important}
body.dua-app-mode .dua-more-menu button{display:block;width:100%;border:0;background:transparent;color:#eff7f3;font-size:12px;text-align:start;padding:10px;border-radius:8px}
body.dua-app-mode .dua-arabic{font-family:'Amiri','Noto Naskh Arabic','Geeza Pro',serif!important;font-size:30px;line-height:2.1;font-weight:400;color:#fff5dc;margin:2px auto 0;max-width:100%;overflow-wrap:normal;word-break:normal}
body.dua-app-mode .dua-transliteration{font:italic 13px/1.7 'DM Sans',system-ui,sans-serif;color:#d9c99f;margin:0 auto;max-width:520px}
body.dua-app-mode .dua-translation{font:400 14px/1.75 'DM Sans',system-ui,sans-serif;color:#f5f0e4;margin:0 auto;max-width:570px}
body.dua-app-mode .dua-reference{font-size:11px;line-height:1.45;color:#dfc98d;margin:3px auto 0}
body.dua-app-mode .dua-source-link{font-size:11px;color:#f1ddb0;border-bottom:1px solid rgba(241,221,176,.4);padding-bottom:1px}
body.dua-app-mode .dua-detail-progress{height:3px;border-radius:3px;background:var(--dua-line);overflow:hidden;margin:20px 7px 0}
body.dua-app-mode .dua-detail-progress span{display:block;height:100%;background:var(--dua-gold2);transition:width .25s ease}
body.dua-app-mode .dua-detail-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0 0}
body.dua-app-mode .dua-detail-actions-single{grid-template-columns:minmax(0,1fr)!important;max-width:650px;margin-left:auto;margin-right:auto}
body.dua-app-mode .dua-detail-actions button{min-height:46px;border-radius:26px;border:1px solid var(--dua-gold);background:var(--dua-goldsoft);color:var(--dua-gold2);font-size:13px;font-weight:650}
body.dua-app-mode .dua-detail-actions button.is-read{background:var(--dua-gold2);color:#1b1710}
body.dua-app-mode .dua-settings-panel{margin:15px 0;padding:17px;border:1px solid var(--dua-line);border-radius:18px;background:var(--dua-card);color:var(--dua-ink)}
body.dua-app-mode .dua-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
body.dua-app-mode .dua-settings-panel label{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid var(--dua-line);font-size:13px}
body.dua-app-mode .dua-settings-panel input{accent-color:var(--dua-gold)}
body.dua-app-mode .dua-settings-panel .row{display:flex;gap:10px;margin-top:12px}
body.dua-app-mode .dua-settings-panel .c{min-width:60px;padding:9px 15px;border:1px solid var(--dua-line);border-radius:12px;background:var(--dua-card2);color:var(--dua-ink)}
body.dua-app-mode .dua-special-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
body.dua-app-mode .dua-empty-state{padding:36px 16px;text-align:center;border:1px solid var(--dua-line);border-radius:22px;background:var(--dua-card);margin-top:18px;color:var(--dua-muted)}
body.dua-app-mode .dua-empty-state>span{font-size:34px;color:var(--dua-gold)}
body.dua-app-mode .dua-empty-state h2{font:600 22px 'Playfair Display',Georgia,serif;color:var(--dua-ink);margin:12px 0 5px}
body.dua-app-mode .dua-empty-state p{font-size:12px;color:var(--dua-muted)}
body.dua-app-mode .dua-primary-cta{display:inline-flex;align-items:center;justify-content:center;padding:11px 18px;border-radius:24px;background:var(--dua-gold2);color:#1b1710!important;font-size:12px;font-weight:700}
body.dua-app-mode .dua-bottom-nav{position:fixed;z-index:25;bottom:calc(8px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));width:min(448px,calc(100% - 32px));padding:8px 8px 7px;border:1px solid var(--dua-line);border-radius:26px;background:var(--dua-glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 22px 40px -18px var(--dua-shadow)}
body.dua-app-mode .dua-bottom-nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;min-height:50px;padding:6px 0;color:var(--dua-muted);font-size:19px;line-height:1.2;border-radius:18px}
body.dua-app-mode .dua-bottom-nav a span{font-size:10px;line-height:1.2}
body.dua-app-mode .dua-bottom-nav a.on{color:#1b1710;background:var(--dua-gold2);font-weight:700}
body.dua-app-mode .dua-bottom-nav .dua-nav-quran-icon{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5}
@media(max-width:380px){body.dua-app-mode .dua-page{padding-left:13px;padding-right:13px}body.dua-app-mode .dua-topbar{margin-left:-13px;margin-right:-13px;padding-left:13px;padding-right:13px}body.dua-app-mode .dua-feature-card{grid-template-columns:36% minmax(0,1fr)}body.dua-app-mode .dua-feature-copy{padding:14px 12px}body.dua-app-mode .dua-bottom-nav{width:calc(100% - 20px)}}
@media(prefers-reduced-motion:reduce){body.dua-app-mode .dua-page *,body.dua-app-mode .dua-page *:before,body.dua-app-mode .dua-page *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `;
  document.head.appendChild(style);
})();