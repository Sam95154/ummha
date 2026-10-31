/* MOMIN Settings V2 — based on settings (2).html and integrated with the existing MOMIN app APIs. */
(function(){
"use strict";
var STYLE_ID="momin-settings-v2-style";
var CSS_TEXT="/* Layout: one mobile column. Sticky glass bar (logo, Hijri date, avatar), page title with a live save status,\n   settings search, night-sky hero, then twelve animated accordions with working controls and per-section Save,\n   About-the-Founder card and a floating tab bar. Colours follow the Home screen. */\n:root{\n  --bg:#f3efe5; --card:#fdfbf6; --card-2:#f8f3e6; --field:#f6f1e4; --line:#e6dfcc; --gold-line:#d9c28a;\n  --ink:#1b1710; --muted:#7a7466; --gold:#a97a22; --gold-bright:#d6a74a; --gold-soft:#efe2c2;\n  --gold-grad:linear-gradient(145deg,#e6c47c,#b8892f); --on-gold:#1b1710; --err:#b3402f; --ok:#2f8f5b;\n  --glass:rgba(253,251,246,.86); --shadow:rgba(60,40,10,.18);\n  --sky-a:#0c0a06; --sky-b:#15110a; --sky-c:#3f2f17; --on-sky:#f6efdf; --on-sky-2:#cdbf9f;\n  --serif:\"Playfair Display\",Georgia,\"Times New Roman\",serif;\n  --sans:\"DM Sans\",system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;\n  --ease:cubic-bezier(.22,1,.36,1);\n}\n@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){\n  --bg:#0f0d0a; --card:#181510; --card-2:#201b13; --field:#14110c; --line:#2f2819; --gold-line:#5a4720;\n  --ink:#f3ecda; --muted:#a79f8a; --gold:#d9aa52; --gold-bright:#e8c071; --gold-soft:#2b2312;\n  --err:#e88a73; --ok:#4fbf82; --glass:rgba(24,21,16,.86); --shadow:rgba(0,0,0,.6); color-scheme:dark}}\n:root[data-theme=\"dark\"]{\n  --bg:#0f0d0a; --card:#181510; --card-2:#201b13; --field:#14110c; --line:#2f2819; --gold-line:#5a4720;\n  --ink:#f3ecda; --muted:#a79f8a; --gold:#d9aa52; --gold-bright:#e8c071; --gold-soft:#2b2312;\n  --err:#e88a73; --ok:#4fbf82; --glass:rgba(24,21,16,.86); --shadow:rgba(0,0,0,.6); color-scheme:dark}\n:root[data-contrast=\"high\"]{--line:color-mix(in srgb,var(--ink) 48%,transparent);--muted:color-mix(in srgb,var(--ink) 80%,var(--bg));--gold-line:color-mix(in srgb,var(--ink) 55%,transparent)}\n:root[data-text=\"large\"]{font-size:112.5%}\n:root[data-text=\"xl\"]{font-size:125%}\n:root[data-motion=\"reduce\"] *,:root[data-motion=\"reduce\"] *::before,:root[data-motion=\"reduce\"] *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}\n\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\nbody{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:.9375rem;line-height:1.45;-webkit-font-smoothing:antialiased;overflow-x:hidden;\n  padding-inline:max(16px,env(safe-area-inset-left,0px)) max(16px,env(safe-area-inset-right,0px));padding-block:0 160px}\nbody.lock{overflow:hidden}\nbody::before{content:\"\";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:60;background:var(--glass);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}\nh1,h2,h3{font-family:var(--serif);font-weight:600;margin:0}\np{margin:0}\nbutton,input,select{font:inherit;color:inherit}\nbutton{cursor:pointer}\n:focus-visible{outline:2px solid var(--gold-bright);outline-offset:3px;border-radius:12px}\nsvg{display:block}\n.app{max-width:480px;margin:0 auto}\n.i{width:1.375rem;height:1.375rem;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n\n/* bar */\n.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:40;display:flex;align-items:center;gap:12px;margin-inline:-16px;padding:10px 16px;background:var(--glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid transparent;transition:border-color .3s}\n.bar.scrolled{border-bottom-color:var(--line)}\n.lt{flex:none;width:44px;height:44px;border-radius:14px;padding:6px;background:linear-gradient(#fbf7ea,#efe7d0);border:1px solid var(--gold-line);display:grid;place-items:center;box-shadow:0 8px 16px -10px var(--shadow)}\n.lt svg.lg{width:100%;height:100%}\n.bar .wm{display:flex;flex-direction:column;min-width:0;flex:1;line-height:1.15}\n.bar .wm b{font-family:var(--serif);font-size:1.1875rem;letter-spacing:.14em;font-weight:700}\n.bar .wm span{color:var(--muted);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.av{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--gold-line);background:var(--gold-soft);color:var(--gold);font-family:var(--serif);font-weight:700;font-size:1.25rem;display:grid;place-items:center;transition:transform .25s var(--ease)}\n.av:active{transform:scale(.9)}\n\nmain>*{animation:rise .8s var(--ease) both;animation-delay:calc(var(--d,0)*60ms)}\n@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}\n\n/* title */\n.top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:26px}\n.top h1{font-size:clamp(2rem,9vw,2.4rem);line-height:1.05;letter-spacing:-.01em}\n.top p{color:var(--muted);margin-top:6px}\n.chip{flex:none;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:var(--gold-soft);color:var(--gold);font-weight:600;font-size:.85rem;transition:background .3s,color .3s;white-space:nowrap}\n.chip::before{content:\"\";width:8px;height:8px;border-radius:50%;background:var(--ok);transition:background .3s}\n.chip.dirty{background:var(--gold-bright);color:#1b1710}\n.chip.dirty::before{background:#1b1710;animation:blink 1.2s ease-in-out infinite}\n@keyframes blink{50%{opacity:.25}}\n@media (max-width:370px){.top{flex-direction:column;align-items:flex-start}}\n\n/* search */\n.search{margin-top:18px;display:flex;align-items:center;gap:10px;height:54px;padding:0 6px 0 18px;border-radius:999px;background:var(--card);border:1px solid var(--line);transition:border-color .25s,box-shadow .25s}\n.search:focus-within{border-color:var(--gold-bright);box-shadow:0 0 0 4px var(--gold-soft)}\n.search .i{color:var(--muted);flex:none;width:1.25rem;height:1.25rem}\n.search input{flex:1;min-width:0;height:100%;background:none;border:0;outline:0;font-size:1rem}\n.search input::placeholder{color:var(--muted)}\n.search .x{width:40px;height:40px;border-radius:50%;border:0;background:var(--gold-soft);color:var(--gold);display:grid;place-items:center;transform:scale(0);transition:transform .3s var(--ease)}\n.search.has .x{transform:scale(1)}\n\n/* hero + founder (night sky) */\n.night{position:relative;overflow:hidden;color:var(--on-sky);border-radius:30px;border:1px solid rgba(214,167,74,.4);\n  background:radial-gradient(120% 90% at 100% 0%,var(--sky-c) 0%,transparent 60%),linear-gradient(160deg,var(--sky-a),var(--sky-b) 55%,#241a0c);box-shadow:0 28px 44px -30px rgba(30,18,0,.7)}\n.night::after{content:\"\";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 35%,rgba(255,236,190,.14) 50%,transparent 65%);transform:translateX(-120%);animation:sheen 7s var(--ease) 1.4s infinite}\n@keyframes sheen{40%,100%{transform:translateX(120%)}}\n.night .stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#f7e7bd;opacity:.2;animation:tw 3.6s ease-in-out infinite;animation-delay:var(--t)}\n@keyframes tw{50%{opacity:.95;transform:scale(1.6)}}\n.hero{margin-top:20px;padding:22px 20px;display:flex;gap:16px;align-items:center}\n.hero .lt{width:76px;height:76px;border-radius:22px;padding:10px}\n.hero>div,.founder>div{position:relative;z-index:1;min-width:0}\n.eyebrow{display:block;color:var(--gold-bright);letter-spacing:.2em;font-weight:700;font-size:.72rem;text-transform:uppercase}\n.hero h2{margin:6px 0;font-size:1.75rem;line-height:1.1;background:linear-gradient(180deg,#fff7e2,#e6c98a);-webkit-background-clip:text;background-clip:text;color:transparent}\n.hero p{color:var(--on-sky-2)}\n\n/* accordions */\n#secs{display:flex;flex-direction:column;gap:14px;margin-top:20px}\n.acc{border-radius:28px;background:var(--card);border:1px solid var(--line);overflow:hidden;scroll-margin-top:84px;transition:border-color .35s,box-shadow .35s;animation:rise .7s var(--ease) both;animation-delay:calc(var(--d,0)*50ms)}\n.acc.open{border-color:var(--gold-line);box-shadow:0 22px 38px -30px var(--shadow)}\n.acc[hidden]{display:none}\n.acc-h{display:flex;align-items:center;gap:14px;width:100%;padding:16px 18px;background:none;border:0;text-align:left;transition:background .35s}\n.acc.open .acc-h{background:linear-gradient(180deg,var(--gold-soft),transparent)}\n.ico{flex:none;width:46px;height:46px;border-radius:15px;background:var(--gold-soft);color:var(--gold);display:grid;place-items:center;transition:transform .4s var(--ease)}\n.acc-h:hover .ico{transform:rotate(-6deg) scale(1.06)}\n.acc-h .t{flex:1;min-width:0}\n.acc-h .t b{display:block;font-size:1.0625rem;font-weight:600;line-height:1.25}\n.acc-h .t span{display:block;color:var(--muted);font-size:.875rem;overflow-wrap:anywhere}\n.dot{display:none;flex:none;padding:4px 10px;border-radius:999px;background:var(--gold-bright);color:#1b1710;font-size:.7rem;font-weight:700;letter-spacing:.04em}\n.acc.dirty .dot{display:inline-block;animation:pop .4s var(--ease)}\n@keyframes pop{from{transform:scale(.6);opacity:0}}\n.chev{flex:none;color:var(--gold);transition:transform .45s var(--ease)}\n.acc.open .chev{transform:rotate(180deg)}\n.acc-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s var(--ease)}\n.acc.open .acc-b{grid-template-rows:1fr}\n.acc-b>div{overflow:hidden;min-height:0}\n.acc-in{padding:8px 18px 20px;display:flex;flex-direction:column;gap:14px;opacity:0;transform:translateY(-6px);transition:opacity .4s ease .05s,transform .5s var(--ease)}\n.acc.open .acc-in{opacity:1;transform:none}\n\n.note{padding:14px 16px;border-radius:20px;background:var(--bg);border:1px solid var(--gold-line);color:var(--muted);line-height:1.5}\n.note b{color:var(--ink)}\n.kv{padding:14px 16px;border-radius:20px;background:var(--gold-soft);border:1px solid var(--gold-line)}\n.kv small{display:block;color:var(--muted);font-size:.85rem}\n.kv b{font-size:1.25rem;font-weight:700;display:block;margin-top:2px;overflow-wrap:anywhere}\n.row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,46%);gap:14px;align-items:center;padding:14px 0;border-top:1px solid var(--line)}\n.row.sw{grid-template-columns:minmax(0,1fr) auto}\n.acc-in>.row:first-child,.note+.row,.kv+.row{border-top:0}\n.rl b{display:block;font-weight:600;line-height:1.3}\n.rl span{display:block;color:var(--muted);font-size:.875rem;line-height:1.35;margin-top:2px}\n.row.off{opacity:.45;pointer-events:none}\n@media (max-width:360px){.row{grid-template-columns:1fr}.row.sw{grid-template-columns:minmax(0,1fr) auto}}\n\n.sel{position:relative}\n.sel select{appearance:none;-webkit-appearance:none;width:100%;height:48px;padding:0 38px 0 16px;border-radius:999px;border:1px solid var(--line);background:var(--field);outline:0;text-overflow:ellipsis;transition:border-color .2s,box-shadow .2s}\n.sel select:focus{border-color:var(--gold-bright);box-shadow:0 0 0 4px var(--gold-soft)}\n.sel select option{background:var(--card);color:var(--ink)}\n.sel .i{position:absolute;right:13px;top:50%;margin-top:-.5rem;width:1rem;height:1rem;pointer-events:none}\n.txt{width:100%;height:48px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:var(--field);outline:0;transition:border-color .2s,box-shadow .2s}\n.txt:focus{border-color:var(--gold-bright);box-shadow:0 0 0 4px var(--gold-soft)}\n.txt::placeholder{color:var(--muted)}\n.swt{width:54px;height:32px;border-radius:99px;border:1.5px solid var(--line);background:var(--field);position:relative;padding:0;transition:background .3s,border-color .3s}\n.swt i{position:absolute;top:3px;left:3px;width:23px;height:23px;border-radius:50%;background:var(--muted);transition:transform .4s var(--ease),background .3s}\n.swt[aria-checked=\"true\"]{background:var(--gold-grad);border-color:transparent}\n.swt[aria-checked=\"true\"] i{transform:translateX(22px);background:#1b1710}\n.swt:active i{width:28px}\n.swt[aria-checked=\"true\"]:active i{transform:translateX(17px)}\n\n.btn{height:52px;padding:0 18px;border-radius:18px;border:1px solid var(--line);background:none;font-weight:700;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:1.2;transition:transform .25s var(--ease),filter .2s,background .25s,border-color .25s;min-width:0}\n.btn:active{transform:scale(.97)}\n.btn:hover{border-color:var(--gold-bright)}\n.btn.pri{width:100%;border:0;background:var(--gold-grad);color:var(--on-gold);box-shadow:0 14px 24px -14px #b8892f}\n.btn.pri:hover{filter:brightness(1.06)}\n.btn.sm{height:46px;width:100%;padding:0 12px;font-size:.9rem}\n.btn.danger{color:var(--err);border-color:color-mix(in srgb,var(--err) 55%,transparent)}\n.btn.danger:hover{background:color-mix(in srgb,var(--err) 10%,transparent);border-color:var(--err)}\n.acts{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n@media (max-width:360px){.acts{grid-template-columns:1fr}}\n.val{color:var(--muted);text-align:right}\n[data-save],.dot,.chip.dirty{display:none!important}\n.acc.dirty .btn.pri{animation:glow 2.2s ease-in-out infinite}\n@keyframes glow{50%{box-shadow:0 0 0 5px var(--gold-soft),0 14px 24px -14px #b8892f}}\n\n/* help */\n.brand{position:relative;padding:18px;border-radius:24px;display:flex;gap:16px;align-items:center}\n.brand .lt{width:84px;height:84px;border-radius:24px;padding:12px}\n.brand h3{font-size:1.9rem;letter-spacing:.14em;margin:2px 0 4px}\n.brand p{color:var(--on-sky-2)}\n.ver{display:inline-block;margin-top:10px;padding:8px 14px;border-radius:999px;border:1px solid rgba(214,167,74,.45);font-size:.85rem}\n.card2{padding:18px;border-radius:24px;background:var(--bg);border:1px solid var(--gold-line)}\n.card2 h4{margin:0 0 6px;font-size:1.05rem}\n.card2 p{color:var(--muted);line-height:1.55}\n.card2 p+p{margin-top:10px}\n.sub{margin:6px 2px 0;font-size:1.1rem;font-weight:700}\n.exp{display:flex;align-items:flex-start;gap:14px;width:100%;text-align:left;padding:14px;border-radius:22px;background:var(--card);border:1px solid var(--line);transition:transform .35s var(--ease),border-color .25s,background .25s}\n.exp:hover{transform:translateX(4px);border-color:var(--gold-bright);background:var(--card-2)}\n.exp .ico{width:42px;height:42px;border-radius:14px}\n.exp b{display:block;font-weight:600}\n.exp span{display:block;color:var(--muted);font-size:.875rem;line-height:1.35}\n.exp .go{margin-left:auto;align-self:center;color:var(--gold);flex:none}\n.list{display:flex;flex-direction:column;gap:10px}\n.tag{text-align:center;color:var(--muted);font-style:italic;margin:6px 0 2px}\n.founder{margin-top:20px;padding:22px 20px;display:flex;flex-direction:column;gap:16px}\n.founder .fh{display:flex;gap:16px;align-items:center}\n.founder .lt{width:80px;height:80px;border-radius:24px;padding:12px}\n.founder h2{font-size:1.65rem;line-height:1.1;margin:4px 0 6px;color:#fff7e2}\n.founder p{color:var(--on-sky-2)}\n.founder .btn.pri{position:relative;z-index:1}\n.foot{margin:20px 4px 0;color:var(--muted);line-height:1.55}\n.empty{margin-top:20px;padding:34px 22px;border-radius:28px;border:1px dashed var(--line);text-align:center;color:var(--muted)}\n.empty b{display:block;color:var(--ink);font-family:var(--serif);font-size:1.3rem;margin-bottom:6px}\n\n/* tab bar + sheet + toast */\n.tabs{position:fixed;left:0;right:0;bottom:0;z-index:45;padding-inline:max(16px,env(safe-area-inset-left,0px)) max(16px,env(safe-area-inset-right,0px));padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));pointer-events:none}\n.tabs nav{pointer-events:auto;max-width:480px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);padding:6px;border-radius:26px;background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--line);box-shadow:0 22px 40px -18px var(--shadow)}\n.tab{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 0 9px;font-size:.78rem;font-weight:600;color:var(--muted);border-radius:20px;transition:color .3s,background .3s}\n.tab:hover{color:var(--gold);background:var(--gold-soft)}\n.tab:active .i{transform:scale(.85)}\n.tab .i{transition:transform .3s var(--ease)}\n.scrim{position:fixed;inset:0;z-index:70;background:rgba(10,8,4,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .35s}\n.scrim.on{opacity:1;pointer-events:auto}\n.sheet{position:fixed;left:0;right:0;bottom:0;z-index:71;max-width:480px;margin:0 auto;max-height:86vh;overflow:auto;padding:10px 22px calc(24px + env(safe-area-inset-bottom,0px));border-radius:32px 32px 0 0;background:var(--card);border:1px solid var(--line);border-bottom:0;transform:translateY(105%);transition:transform .55s var(--ease);box-shadow:0 -30px 60px -20px var(--shadow)}\n.sheet.on{transform:none}\n.sheet .grab{width:44px;height:5px;border-radius:5px;background:var(--line);margin:4px auto 16px}\n.sheet h3{font-size:1.5rem;margin-bottom:10px}\n.sheet .sb{color:var(--muted);line-height:1.55}\n.sheet .sb ul{margin:10px 0 0;padding-left:1.1rem}\n.sheet .sb li+li{margin-top:8px}\n.sheet .sa{display:flex;gap:10px;margin-top:20px}\n.sheet .sa .btn{flex:1}\n.toast{position:fixed;left:50%;bottom:calc(98px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;z-index:80;padding:12px 18px;border-radius:14px;background:var(--ink);color:var(--bg);font-size:.875rem;font-weight:500;max-width:calc(100vw - 40px);text-align:center;pointer-events:none;transition:opacity .3s,transform .4s var(--ease)}\n.toast.on{opacity:1;transform:translate(-50%,0)}\n\n\n/* edit profile */\n.pf{display:flex;flex-direction:column}\n.pf-t{font-family:var(--serif);font-size:1.5rem;margin:6px 0 10px}\n.pf-line{display:flex;align-items:center;justify-content:space-between;min-height:68px;font-size:1.02rem}\n.pf-av{position:relative;width:60px;height:60px;border-radius:50%;border:1px solid var(--gold-line);background:var(--gold-soft);padding:0;overflow:visible;color:var(--gold);transition:transform .3s var(--ease)}\n.pf-av:active{transform:scale(.92)}\n.pf-av img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}\n.pf-ph{display:grid;place-items:center;width:100%;height:100%}\n.pf-cam{position:absolute;right:-4px;bottom:-4px;width:26px;height:26px;border-radius:50%;background:var(--gold-grad);color:#1b1710;display:grid;place-items:center;border:2px solid var(--card)}\n.pf-cam .i{width:14px;height:14px}\n.pf-lock{color:var(--muted);display:grid;place-items:center;padding-right:6px}\n.pf-lock.sm .i{width:1.1rem;height:1.1rem}\n.pf-f{display:block;padding:16px 0 12px;border-top:1px solid var(--line)}\n.pf-f>span{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:.95rem;margin-bottom:6px}\n.pf-in{width:100%;height:46px;padding:0 4px;background:none;border:0;border-bottom:1.5px solid var(--gold-line);border-radius:0;outline:0;font-size:1.05rem;color:var(--ink);transition:border-color .25s}\n.pf-in:focus{border-bottom-color:var(--gold-bright)}\n.pf-em{display:flex;align-items:center;gap:12px;min-height:40px;border-bottom:1.5px solid var(--gold-line);padding-bottom:6px}\n.pf-em b{flex:1;min-width:0;font-weight:500;font-size:1.05rem;overflow-wrap:anywhere}\n.pf-em b.ph{color:var(--muted)}\n.pf-em .pf-in{border:0;flex:1;height:40px}\n.pf-link{flex:none;border:0;background:none;color:var(--gold);font-weight:700;padding:8px 0 8px 8px}\n.pf-ok{display:block;margin-top:8px;color:var(--ok);font-size:.85rem}\n.pf-warn{display:block;margin-top:8px;color:var(--muted);font-size:.85rem}\n.pf-i{border:0;background:none;padding:0;color:var(--gold);display:grid;place-items:center}\n.pf-i .i{width:1.25rem;height:1.25rem}\n.pf-hint{color:var(--muted);font-size:.85rem;line-height:1.45;margin:2px 0 6px}\n.pf-rad{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:4px 0 10px;border-bottom:1.5px solid var(--gold-line)}\n.pf-rad .rd{display:flex;align-items:center;gap:12px;border:0;background:none;height:48px;font-size:1.05rem;text-align:left}\n.pf-rad .rd i{flex:none;width:26px;height:26px;border-radius:50%;border:2px solid var(--muted);display:grid;place-items:center;transition:border-color .25s,background .25s}\n.pf-rad .rd i::after{content:\"\";width:12px;height:12px;border-radius:50%;background:var(--gold-bright);transform:scale(0);transition:transform .35s var(--ease)}\n.pf-rad .rd.on i{border-color:var(--gold-bright)}\n.pf-rad .rd.on i::after{transform:scale(1)}\n.pf-nav{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:62px;padding:0;border:0;border-bottom:1px solid var(--line);background:none;font-size:1.05rem;text-align:left;transition:padding .3s var(--ease)}\n.pf-nav:hover{padding-left:6px}\n.pf-nav .lo{display:flex;align-items:center;gap:14px;font-weight:600}\n.pf-nav.danger,.pf-nav .dg{color:var(--err)}\n.pf-grp{padding:18px 0 8px;border-bottom:1px solid var(--line)}\n.pf-grp h4{margin:0 0 10px;font-family:var(--serif);font-size:1.3rem}\n.pf-item{display:flex;align-items:center;gap:14px;min-height:60px}\n.pf-item b{display:block;font-weight:600}\n.pf-item small{display:block;color:var(--muted)}\n.pf-item .blue{flex:1;color:#2f6fed}\n.pf-item .tk{color:#2f6fed;width:1.6rem;height:1.6rem;stroke-width:2.2}\n.pf-tr{flex:none;border:0;background:none;color:var(--err);width:44px;height:44px;display:grid;place-items:center;border-radius:50%;transition:background .25s}\n.pf-tr:hover{background:color-mix(in srgb,var(--err) 12%,transparent)}\n#pfSave{margin-top:18px}\n#pfSave:disabled{background:var(--line);color:var(--muted);box-shadow:none;cursor:not-allowed}\n.sheet .pf-f{padding:12px 0 6px;border:0}\n.sheet .pf-sub{color:var(--muted);margin-bottom:6px}\n.av img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}\n.av{overflow:hidden}\n@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}\n\n/* MOMIN production shell integration and mobile safe area. */\nbody.momin-settings-v2-active{\n  padding-block-end:0!important;\n  overflow-x:hidden!important;\n}\nbody.momin-settings-v2-active .layout{\n  display:block!important;\n  grid-template-columns:1fr!important;\n  min-height:100vh!important;\n  min-height:100dvh!important;\n  height:auto!important;\n  overflow:visible!important;\n  padding:0!important;\n}\nbody.momin-settings-v2-active .layout>.sidebar,\nbody.momin-settings-v2-active .layout>main>.top,\nbody.momin-settings-v2-active .mobilebar{\n  display:none!important;\n}\nbody.momin-settings-v2-active .layout>main{\n  display:block!important;\n  width:100%!important;\n  min-width:0!important;\n  min-height:100vh!important;\n  min-height:100dvh!important;\n  height:auto!important;\n  padding:0!important;\n  overflow:visible!important;\n}\nbody.momin-settings-v2-active #view.content{\n  display:block!important;\n  width:100%!important;\n  max-width:none!important;\n  min-height:100vh!important;\n  min-height:100dvh!important;\n  height:auto!important;\n  margin:0!important;\n  padding:0 0 calc(160px + env(safe-area-inset-bottom,0px))!important;\n  overflow:visible!important;\n  background:transparent!important;\n}\nbody.momin-settings-v2-active .app{\n  width:100%;\n  max-width:480px;\n  min-height:0;\n  margin:0 auto;\n  padding-bottom:12px;\n}\nbody.momin-settings-v2-active .app>.top{\n  position:relative!important;\n  inset:auto!important;\n  top:auto!important;\n  z-index:auto!important;\n  display:flex!important;\n  align-items:flex-end!important;\n  justify-content:space-between!important;\n  width:auto!important;\n  height:auto!important;\n  min-height:0!important;\n  margin:26px 0 0!important;\n  padding:0!important;\n  background:transparent!important;\n  border:0!important;\n  border-radius:0!important;\n  box-shadow:none!important;\n  backdrop-filter:none!important;\n}\nbody.momin-settings-v2-active .app>.top>div{\n  position:static!important;\n  display:block!important;\n  min-width:0!important;\n  margin:0!important;\n  padding:0!important;\n  background:transparent!important;\n  border:0!important;\n}\nbody.momin-settings-v2-active #secs .acc{\n  scroll-margin-top:78px;\n}\nbody.momin-settings-v2-active #extras{\n  padding-bottom:14px;\n}\nbody.momin-settings-v2-active .foot{\n  margin-bottom:16px!important;\n  overflow-wrap:anywhere;\n}\nbody.momin-settings-v2-active .tabs{\n  position:fixed!important;\n  left:0!important;\n  right:0!important;\n  bottom:0!important;\n  z-index:45!important;\n  padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;\n}\nbody.momin-settings-v2-active .tabs nav{\n  pointer-events:auto;\n}\nbody.momin-settings-v2-active .btn[data-save]{\n  display:inline-flex!important;\n}\nbody.momin-settings-v2-active .chip.dirty{\n  display:inline-flex!important;\n}\nbody.momin-settings-v2-active .acc.dirty .dot{\n  display:inline-block!important;\n}\nbody.momin-settings-v2-active .pf-empty{\n  padding:12px 0;\n  color:var(--muted);\n  font-size:.9rem;\n  line-height:1.5;\n}\nbody.momin-settings-v2-active .pf-item{\n  min-width:0;\n}\nbody.momin-settings-v2-active .pf-device-copy{\n  min-width:0;\n  flex:1;\n}\nbody.momin-settings-v2-active .pf-device-copy small{\n  overflow-wrap:anywhere;\n}\nbody.momin-settings-v2-active .pf-avatar-photo{\n  width:100%;\n  height:100%;\n  border-radius:50%;\n  object-fit:cover;\n}\n@media(max-width:380px){\n  body.momin-settings-v2-active .pf-login-prompt{\n    align-items:flex-start;\n    flex-direction:column;\n  }\n}\n\n/* Settings screen: title-only top and in-flow bottom tabs. */\nbody.momin-settings-v2-active{\n  padding-block:0 18px!important;\n}\nbody.momin-settings-v2-active .app>.bar{\n  display:none!important;\n}\nbody.momin-settings-v2-active .app>main>.top{\n  margin-top:18px!important;\n  scroll-margin-top:12px;\n}\nbody.momin-settings-v2-active #view.content{\n  padding:0 0 18px!important;\n  overflow:visible!important;\n}\nbody.momin-settings-v2-active .tabs{\n  position:relative!important;\n  inset:auto!important;\n  left:auto!important;\n  right:auto!important;\n  bottom:auto!important;\n  z-index:1!important;\n  display:block!important;\n  width:100%!important;\n  max-width:480px!important;\n  margin:30px auto 12px!important;\n  padding:0 16px calc(12px + env(safe-area-inset-bottom,0px))!important;\n  pointer-events:auto!important;\n}\nbody.momin-settings-v2-active .tabs nav{\n  position:relative!important;\n  width:100%!important;\n  max-width:480px!important;\n  margin:0 auto!important;\n  pointer-events:auto!important;\n}\n\nbody.momin-settings-v2-active .momin-support-card a{\n  color:var(--gold,#d5ad58);\n  font-weight:750;\n  text-decoration:underline;\n  text-underline-offset:3px;\n  overflow-wrap:anywhere;\n}\nbody.momin-settings-v2-active .pf [data-act=\"change-profile-photo\"]{\n  min-height:42px;\n  margin:8px 0 0;\n}\n"
var ICONS="<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\"><defs>\n  <symbol id=\"logo\" viewBox=\"600 520 800 685\"><g><path fill=\"#21675f\" fill-rule=\"evenodd\" d=\"M610 1061L612 1062L624 1059L661 1055L711 1055L735 1057L782 1064L804 1069L862 1087L898 1103L916 1113L936 1127L947 1137L956 1149L960 1162L972 1182L982 1191L989 1195L997 1197L1003 1197L1014 1193L1028 1181L1035 1171L1042 1152L1047 1143L1063 1127L1096 1106L1116 1096L1146 1084L1195 1069L1204 1068L1217 1064L1264 1057L1288 1055L1338 1055L1368 1058L1389 1062L1382 1058L1352 1047L1340 1040L1327 1038L1264 1038L1240 1040L1193 1047L1167 1053L1166 1052L1169 1050L1176 1049L1185 1045L1234 1035L1281 1030L1325 1029L1308 1024L1302 1024L1279 1019L1276 1017L1276 1015L1281 1011L1264 1011L1245 1014L1235 1014L1195 1021L1162 1030L1134 1040L1100 1056L1081 1067L1060 1082L1035 1104L1015 1127L1002 1147L999 1148L985 1128L965 1105L943 1085L926 1072L924 1072L901 1057L877 1045L831 1028L804 1021L765 1014L735 1011L718 1011L724 1016L723 1018L674 1029L718 1030L766 1035L817 1046L822 1048L824 1050L823 1051L801 1046L759 1040L746 1040L734 1038L672 1038L659 1040L645 1048ZM774 995L799 995L834 998L863 1004L897 1015L926 1028L952 1043L982 1064L998 1078L1003 1077L1025 1058L1052 1040L1073 1028L1102 1015L1136 1004L1159 999L1201 995L1225 996L1223 993L1189 977L1173 972L1144 967L1099 968L1066 976L1029 992L1001 1010L996 1009L970 992L944 980L911 970L891 967L855 967L826 972L802 980ZM718 926L718 973L765 974L766 923L769 911L776 897L787 886L801 878L817 874L845 873L855 841L867 817L884 792L902 774L917 764L928 759L947 755L973 745L990 735L998 728L1001 728L1009 735L1033 748L1052 755L1076 761L1086 766L1102 778L1120 798L1135 822L1147 848L1153 871L1155 873L1171 873L1192 876L1208 883L1220 893L1225 900L1232 916L1233 971L1235 974L1281 973L1281 923L1279 910L1272 888L1266 876L1255 861L1241 848L1225 838L1210 832L1191 828L1188 825L1175 796L1164 778L1147 756L1133 742L1118 730L1103 721L1086 714L1058 707L1041 699L1032 692L1012 670L1002 650L1001 645L998 645L994 657L982 677L964 695L944 706L913 714L899 720L877 733L865 743L847 762L833 781L822 800L811 825L808 828L796 830L781 835L764 844L749 856L734 875L726 891L721 906Z\"/></g><g><path fill=\"#b98a2e\" fill-rule=\"evenodd\" d=\"M999 545L994 561L991 565L972 565L971 566L973 569L982 575L987 580L987 583L985 586L984 592L981 599L983 600L992 594L993 592L998 589L1001 589L1017 600L1018 598L1012 580L1025 569L1027 569L1028 566L1027 565L1008 565L1006 563L1003 552L1001 549L1001 546ZM969 530L953 545L947 556L944 566L944 575L943 576L944 591L947 600L953 611L961 620L970 627L988 634L994 634L995 635L1011 634L1031 626L1043 615L1046 611L1047 607L1044 608L1038 613L1027 618L1019 620L1003 620L992 617L981 611L970 601L969 598L963 591L962 586L959 581L959 576L958 575L958 558L962 545L972 530Z\"/></g></symbol>\n  <symbol id=\"ic-chev\" viewBox=\"0 0 24 24\"><path d=\"m6 9 6 6 6-6\"/></symbol>\n  <symbol id=\"ic-search\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6.8\"/><path d=\"m20 20-4.2-4.2\"/></symbol>\n  <symbol id=\"ic-x\" viewBox=\"0 0 24 24\"><path d=\"M6 6l12 12M18 6 6 18\"/></symbol>\n  <symbol id=\"ic-arrow\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14M13 6l6 6-6 6\"/></symbol>\n  <symbol id=\"ic-user\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"8\" r=\"3.6\"/><path d=\"M4.5 20c.6-3.8 3.5-6 7.5-6s6.9 2.2 7.5 6\"/></symbol>\n  <symbol id=\"ic-contrast\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 3.5v17a8.5 8.5 0 0 0 0-17Z\" fill=\"currentColor\"/></symbol>\n  <symbol id=\"ic-target\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3\"/></symbol>\n  <symbol id=\"ic-bell\" viewBox=\"0 0 24 24\"><path d=\"M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9ZM10 20a2 2 0 0 0 4 0\"/></symbol>\n  <symbol id=\"ic-book\" viewBox=\"0 0 24 24\"><path d=\"M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5ZM12 6.5v13\"/></symbol>\n  <symbol id=\"ic-heart\" viewBox=\"0 0 24 24\"><path d=\"M12 20.5S3 15 3 8.8A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 9 2.2C21 15 12 20.5 12 20.5Z\"/></symbol>\n  <symbol id=\"ic-compass\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"m15.5 8.5-2 5-5 2 2-5 5-2Z\"/></symbol>\n  <symbol id=\"ic-cal\" viewBox=\"0 0 24 24\"><rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"16\" rx=\"3\"/><path d=\"M3.5 9.5h17M8 2.5v4M16 2.5v4M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01\"/></symbol>\n  <symbol id=\"ic-lang\" viewBox=\"0 0 24 24\"><path d=\"M4 6h9M8.5 4v2M6 6c.5 3.5 3 6 6 7M12 6c-.7 3.8-3.5 6.3-7.500 7.500M13 20l4-9 4 9M14.5 17h5\"/></symbol>\n  <symbol id=\"ic-shield\" viewBox=\"0 0 24 24\"><path d=\"M12 3 4.5 6v5.5c0 4.600 3.100 8 7.500 9.500 4.400-1.500 7.500-4.900 7.500-9.500V6L12 3Z\"/><path d=\"m8.800 12 2.400 2.400 4-4.400\"/></symbol>\n  <symbol id=\"ic-store\" viewBox=\"0 0 24 24\"><rect x=\"4.500\" y=\"3.500\" width=\"15\" height=\"17\" rx=\"3\"/><path d=\"M8.500 8.500h7M8.500 12h7M8.500 15.500h7\"/></symbol>\n  <symbol id=\"ic-help\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"M9.500 9.500a2.600 2.600 0 1 1 3.700 2.300c-.8.400-1.200 1-1.200 1.900M12 17.200h.01\"/></symbol>\n  <symbol id=\"ic-home\" viewBox=\"0 0 24 24\"><path d=\"M3.5 11 12 3.5 20.5 11V20a1 1 0 0 1-1 1H15v-6H9v6H4.500a1 1 0 0 1-1-1V11Z\"/></symbol>\n  <symbol id=\"ic-clock\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9.500\"/><path d=\"M12 6.500V12l3.500 2\"/></symbol>\n  <symbol id=\"ic-path\" viewBox=\"0 0 24 24\"><circle cx=\"6\" cy=\"18\" r=\"2.200\"/><circle cx=\"18\" cy=\"6\" r=\"2.200\"/><path d=\"M8 18h6.500a3.500 3.500 0 0 0 0-7h-5a3.500 3.500 0 0 1 0-7H16\"/></symbol>\n  <symbol id=\"ic-tick\" viewBox=\"0 0 24 24\"><path d=\"m5 12.500 4.500 4.500L19 7.500\"/></symbol>\n  <symbol id=\"ic-cam\" viewBox=\"0 0 24 24\"><path d=\"M4 8.500A2 2 0 0 1 6 6.500h1.500L9 4.500h6l1.500 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.500Z\"/><circle cx=\"12\" cy=\"12.500\" r=\"3.300\"/></symbol>\n  <symbol id=\"ic-lock\" viewBox=\"0 0 24 24\"><rect x=\"5\" y=\"10.500\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 10.500V8a4 4 0 0 1 8 0v2.500\"/></symbol>\n  <symbol id=\"ic-trash\" viewBox=\"0 0 24 24\"><path d=\"M4.500 7h15M9.500 7V4.500h5V7M6.500 7l.8 12.500h9.400L17.500 7M10 11v5.500M14 11v5.500\"/></symbol>\n  <symbol id=\"ic-out\" viewBox=\"0 0 24 24\"><path d=\"M10 4.500H6a1.500 1.500 0 0 0-1.500 1.500v12A1.500 1.500 0 0 0 6 19.500h4M14 8l4 4-4 4M18 12H9\"/></symbol>\n  <symbol id=\"ic-info\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9.500\"/><path d=\"M12 11v5.500M12 7.700h.01\"/></symbol>\n  <symbol id=\"ic-rchev\" viewBox=\"0 0 24 24\"><path d=\"m9 6 6 6-6 6\"/></symbol>\n</defs></svg>";
var PAGE="<div class=\"app\">\n  <header class=\"bar\" id=\"bar\">\n    <span class=\"lt\" aria-hidden=\"true\"><svg class=\"lg\" viewBox=\"600 520 800 685\"><use href=\"#logo\" x=\"600\" y=\"520\" width=\"800\" height=\"685\"/></svg></span>\n    <div class=\"wm\"><b>MOMIN</b><span id=\"hdrDate\">Loading date</span></div>\n    <button class=\"av\" id=\"avBtn\" aria-label=\"Profile\">S</button>\n  </header>\n\n  <main>\n    <section class=\"top\" style=\"--d:0\">\n      <div><h1>Settings</h1></div>\n      \n    </section>\n\n    <label class=\"search\" id=\"searchBox\" style=\"--d:1\"><svg class=\"i\"><use href=\"#ic-search\"/></svg><input id=\"q\" type=\"search\" placeholder=\"Search settings\" autocomplete=\"off\" aria-label=\"Search settings\"><button type=\"button\" class=\"x\" id=\"qx\" aria-label=\"Clear search\"><svg class=\"i\"><use href=\"#ic-x\"/></svg></button></label>\n\n    <section class=\"night hero\" style=\"--d:2\" id=\"hero\">\n      <div class=\"stars\" aria-hidden=\"true\" id=\"stars\"></div>\n      <span class=\"lt\" aria-hidden=\"true\"><svg class=\"lg\" viewBox=\"600 520 800 685\"><use href=\"#logo\" x=\"600\" y=\"520\" width=\"800\" height=\"685\"/></svg></span>\n      <div><span class=\"eyebrow\">MOMIN preferences</span><h2>Make MOMIN yours</h2><p>Your settings stay on this device unless a feature says otherwise.</p></div>\n    </section>\n\n    <div id=\"secs\" style=\"--d:3\"></div>\n    <div class=\"empty\" id=\"none\" hidden><b>No settings match</b>Try a word like theme, prayer, Quran or privacy.</div>\n\n    <div id=\"extras\">\n      <section class=\"night founder\" style=\"--d:4\">\n        <div class=\"fh\"><span class=\"lt\" aria-hidden=\"true\"><svg class=\"lg\" viewBox=\"600 520 800 685\"><use href=\"#logo\" x=\"600\" y=\"520\" width=\"800\" height=\"685\"/></svg></span>\n          <div><span class=\"eyebrow\">Meet the creator</span><h2>About the Founder</h2><p>Learn about the person behind MOMIN and the idea that inspired this Islamic companion.</p></div></div>\n        <button class=\"btn pri\" type=\"button\" data-act=\"founder\">Meet the Founder</button>\n      </section>\n      <p class=\"foot\">Some capabilities, such as cloud sync and reliable background notifications, need additional app infrastructure and are not enabled just by changing a preference.</p>\n    </div>\n  </main>\n</div>\n\n<input type=\"file\" id=\"pfFile\" accept=\"image/*\" hidden>\n<input type=\"file\" id=\"imp\" accept=\"application/json,.json\" hidden>\n<div class=\"tabs\"><nav aria-label=\"Primary\">\n  <button class=\"tab\" data-t=\"Home\"><svg class=\"i\"><use href=\"#ic-home\"/></svg>Home</button>\n  <button class=\"tab\" data-t=\"Prayers\"><svg class=\"i\"><use href=\"#ic-clock\"/></svg>Prayers</button>\n  <button class=\"tab\" data-t=\"Quran\"><svg class=\"i\"><use href=\"#ic-book\"/></svg>Quran</button>\n  <button class=\"tab\" data-t=\"Journey\"><svg class=\"i\"><use href=\"#ic-path\"/></svg>Journey</button>\n</nav></div>\n<div class=\"scrim\" id=\"scrim\"></div>\n<div class=\"sheet\" id=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"shT\" aria-hidden=\"true\"></div>\n<div class=\"toast\" id=\"toast\" role=\"status\"></div>";

function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 var style=document.createElement("style");style.id=STYLE_ID;style.textContent=CSS_TEXT;document.head.appendChild(style);
}
function removeStyle(){var style=document.getElementById(STYLE_ID);if(style)style.remove();}
function settingsPageV2(){ensureStyle();return ICONS+PAGE;}
window.settingsPage=settingsPageV2;
if(typeof settingsPage!=="undefined")settingsPage=settingsPageV2;

var LANGS=[
 ["en","English"],["as","Assamese — অসমীয়া"],["bn","Bengali — বাংলা"],["brx","Bodo — बड़ो"],["doi","Dogri — डोगरी"],
 ["gu","Gujarati — ગુજરાતી"],["hi","Hindi — हिन्दी"],["kn","Kannada — ಕನ್ನಡ"],["ks","Kashmiri — کٲشُر"],["kok","Konkani — कोंकणी"],
 ["mai","Maithili — मैथिली"],["ml","Malayalam — മലയാളം"],["mni","Manipuri (Meitei) — মৈতৈলোন্"],["mr","Marathi — मराठी"],["ne","Nepali — नेपाली"],
 ["or","Odia — ଓଡ଼ିଆ"],["pa","Punjabi — ਪੰਜਾਬੀ"],["sa","Sanskrit — संस्कृतम्"],["sat","Santali — ᱥᱟᱱᱛᱟᱲᱤ"],["sd","Sindhi — سنڌي"],
 ["ta","Tamil — தமிழ்"],["te","Telugu — తెలుగు"],["ur","Urdu — اردو"],["ar","Arabic — العربية"]
];
var RECITERS=[
 ["ar.alafasy","Mishary Rashid Alafasy"],["ar.abdurrahmaansudais","Abdurrahman As-Sudais"],
 ["ar.husary","Mahmoud Khalil Al-Husary"],["ar.minshawi","Mohamed Siddiq Al-Minshawi"],
 ["ar.mahermuaiqly","Maher Al-Muaiqly"],["ar.shaatree","Abu Bakr Ash-Shaatree"]
];
var defaults, saved, draft, toastTimer, currentCleanup;
function get(k,f){try{var x=localStorage.getItem(k);return x===null?f:x}catch(_){return f}}
function json(k,f){try{var x=JSON.parse(localStorage.getItem(k));return x==null?f:x}catch(_){return f}}
function put(k,v){try{localStorage.setItem(k,String(v))}catch(_){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function user(){try{return window.MominProfileSettingsV1&&window.MominProfileSettingsV1.getUser?window.MominProfileSettingsV1.getUser():null}catch(_){return null}}
function devices(){try{return window.MominProfileSettingsV1&&window.MominProfileSettingsV1.getDevices?window.MominProfileSettingsV1.getDevices():[]}catch(_){return []}}
function toast(message){
 var t=document.getElementById("toast");if(!t)return;
 t.textContent=message;t.classList.add("on");clearTimeout(toastTimer);
 toastTimer=setTimeout(function(){t.classList.remove("on")},2300);
}
function readTheme(){
 var t=get("noor-theme-preference",get("noor-theme","Dark"));
 return ["System","Light","Dark","Sepia"].indexOf(t)>=0?t:"Dark";
}
function qTheme(){var t=get("noor-quran-theme","night");return ["night","paper","white"].indexOf(t)>=0?t:"night";}
function qLayout(){return get("noor-quran-reading-mode-v8","list")==="page"?"page":"list";}
function qSize(){return String(get("noor-quran-arabic-size","48"));}
function dSize(){return String(get("noor-dua-prototype-text-size","30"));}
function currentCity(){try{return API_STORE.city||"";}catch(_){return get("noor-city","");}}
function currentCountry(){try{return API_STORE.country||"";}catch(_){return get("noor-country","");}}
function currentMethod(){try{return API_STORE.methodMode==="manual"?String(API_STORE.method||"3"):"auto";}catch(_){return "auto";}}
function choicesTranslations(){
 try{if(typeof quranTranslationsV5!=="undefined"&&Array.isArray(quranTranslationsV5)&&quranTranslationsV5.length)return quranTranslationsV5.map(function(x){return [String(x.id),String(x.label)];});}catch(_){}
 return [["en.sahih","English — Sahih International"]];
}
function prayerMethodOptions(){
 var list=[["auto","Auto-detect for location"]];
 try{Object.keys(PRAYER_METHODS).forEach(function(name){list.push([String(PRAYER_METHODS[name]),name]);});}catch(_){}
 return list;
}
function initState(){
 var tasbihState=json("noor-tsb-v2",{});
 var scale=get("noor-interface-scale","normal");
 defaults={
  theme:readTheme(),
  reduceMotion:get("noor-reduce-motion","false")==="true",
  contrast:get("noor-high-contrast","false")==="true",
  textSize:scale==="larger"?"larger":scale==="large"?"large":"normal",
  city:currentCity(),country:currentCountry(),calc:currentMethod(),
  asr:get("noor-asr-method","standard"),sound:get("noor-adhan-sound","azan"),
  notif:get("noor-notifications","true")!=="false",
  nFajr:get("noor-notify-fajr",get("noor-notifications","true"))!=="false",
  nDhuhr:get("noor-notify-dhuhr",get("noor-notifications","true"))!=="false",
  nAsr:get("noor-notify-asr",get("noor-notifications","true"))!=="false",
  nMaghrib:get("noor-notify-maghrib",get("noor-notifications","true"))!=="false",
  nIsha:get("noor-notify-isha",get("noor-notifications","true"))!=="false",
  lead:get("noor-prayer-reminder-minutes","0"),
  translation:get("noor-quran-edition","en.sahih"),
  arSize:qSize(),
  showTr:get("noor-quran-show-translation-v8","true")!=="false",
  showTl:get("noor-quran-show-transliteration-v8","false")==="true",
  layout:qLayout(),
  reciter:get("noor-quran-reciter-v8","ar.alafasy"),
  speed:get("noor-quran-audio-speed-v8","1"),
  repeat:get("noor-quran-repeat-v8","false")==="true",
  autoNext:get("noor-quran-auto-next-v8","false")==="true",
  awake:get("noor-keep-awake-v8","false")==="true",
  qTheme:qTheme(),
  duaSize:dSize(),
  tsSound:!!tasbihState.sound,
  tsVibe:tasbihState.haptic!==false,
  units:get("noor-distance-unit","km"),
  hijriAdj:get("noor-hijri-adjustment","0"),
  occasions:get("noor-islamic-event-reminders","false")==="true",
  lang:get("noor-language","en"),
  onlineTr:get("momin-privacy-online-translation","true")!=="false"
 };
 saved=Object.assign({},defaults);
 draft=Object.assign({},saved);
}
function optionHtml(items,value){
 return items.map(function(x){return '<option value="'+esc(x[0])+'"'+(String(x[0])===String(value)?" selected":"")+'>'+esc(x[1])+'</option>'}).join("");
}
function methodItems(){return prayerMethodOptions()}
function translationItems(){return choicesTranslations()}
function icon(name){return '<svg class="i"><use href="#ic-'+name+'"/></svg>'}
function label(title,desc){return '<div class="rl"><b>'+esc(title)+'</b>'+(desc?'<span>'+esc(desc)+'</span>':"")+'</div>'}
function selectRow(k,title,desc,items,id){
 return '<div class="row">'+label(title,desc)+'<div class="sel"><select '+(id?'id="'+id+'" ':"")+'data-k="'+k+'" aria-label="'+esc(title)+'">'+optionHtml(items,draft[k])+'</select><svg class="i"><use href="#ic-chev"/></svg></div></div>';
}
function switchRow(k,title,desc,dep,id){
 return '<div class="row sw"'+(dep?' data-dep="'+dep+'"':"")+'>'+label(title,desc)+'<button type="button" class="swt" '+(id?'id="'+id+'" ':"")+'role="switch" data-k="'+k+'" aria-checked="'+!!draft[k]+'" aria-label="'+esc(title)+'"><i></i></button></div>';
}
function textRow(k,title,desc,placeholder,id){
 return '<div class="row">'+label(title,desc)+'<input class="txt" '+(id?'id="'+id+'" ':"")+'data-k="'+k+'" type="text" autocomplete="off" placeholder="'+esc(placeholder||"")+'" value="'+esc(draft[k]||"")+'" aria-label="'+esc(title)+'"></div>';
}
function note(text){return '<p class="note">'+text+'</p>'}
function kv(title,value,id){return '<div class="kv"><small>'+esc(title)+'</small><b'+(id?' id="'+id+'"':"")+'>'+value+'</b></div>'}
function button(text,kind,act){return '<button type="button" class="btn '+kind+'" data-act="'+act+'">'+esc(text)+'</button>'}
function rowAction(title,desc,html){return '<div class="row">'+label(title,desc)+'<div>'+html+'</div></div>'}
function saveButton(text,section){return '<button type="button" class="btn pri" data-save="'+section+'">'+esc(text)+'</button>'}
function actions(html){return '<div class="acts">'+html+'</div>'}

function profileMarkup(){
 var u=user(),list=devices(),google=u&&u.provider==="google";
 var photo=u&&u.avatar?'<img class="pf-avatar-photo" src="'+esc(u.avatar)+'" alt="" referrerpolicy="no-referrer">':'<span class="pf-ph">'+icon("user")+'</span>';
 var deviceRows=list.length?list.map(function(d){
  var id=String(d.id||""),current=!!(d.is_current||d.current);
  return '<div class="pf-item"><span class="pf-lock">'+icon("lock")+'</span><div class="pf-device-copy"><b>'+esc(d.name||d.device_name||"Signed-in device")+'</b><small>'+(current?"This device":esc(d.last_active||d.last_seen||"Signed-in session"))+'</small></div>'+
   (current?"":'<button type="button" class="pf-link" data-mprofile-action="revoke-device" data-device-id="'+esc(id)+'">Remove</button>')+'</div>';
 }).join(""):'<div class="pf-empty">'+(u?"No additional devices were returned by your account service.":"Sign in to view devices linked to your MOMIN account.")+'</div>';
 return '<div class="pf" id="pfBox"><h4 class="pf-t">'+(u?"Your account":"Guest profile")+'</h4>'+
  '<div class="pf-line"><span>Profile image</span><span class="pf-av">'+photo+'</span></div>'+
  (u?'<button type="button" class="pf-link" data-act="change-profile-photo">Upload / Change profile photo</button><p class="pf-hint">You can update your profile photo whenever you like. JPG, PNG, WebP or AVIF · Max 5 MB.</p>':'')+
  '<div class="pf-line"><span>Name</span><b>'+(u?esc(u.name||"Name not supplied"):"Available after sign-in")+'</b></div>'+
  '<div class="pf-f"><span>Email address</span><div class="pf-em"><b>'+(u?esc(u.email||"No email supplied"):"Available after sign-in")+'</b></div>'+(u?'<small class="'+(u.emailVerified?"pf-ok":"pf-warn")+'">'+(u.emailVerified?"Verified by sign-in provider":"Verification status not supplied")+'</small>':"")+'</div>'+
  '<div class="pf-f"><span>Sign-in method</span><div class="pf-em"><b>'+(u?esc(u.provider||"Account sign-in"):"Not connected")+'</b></div></div>'+
  '<p class="pf-hint">Name, email and profile photo are read from your signed-in account. Birthday and gender are not assumed or populated with sample information.</p>'+
  '<div class="pf-grp"><h4>Linked accounts</h4><div class="pf-item"><span class="g" aria-hidden="true">G</span><b class="blue">Google</b>'+(google?'<span class="pf-linked">✓ Linked</span>':'<button type="button" class="pf-link" data-mprofile-action="'+(u?"link-google":"sign-in")+'">'+(u?"Link Google":"Sign in with Google")+'</button>')+'</div></div>'+
  '<div class="pf-grp"><h4>Logged-in devices</h4>'+deviceRows+'<button type="button" class="pf-link" data-mprofile-action="refresh-devices">Refresh device list</button></div>'+
  (u?'<button type="button" class="pf-nav" data-mprofile-action="change-password"><span>Change password</span>'+icon("rchev")+'</button><button type="button" class="pf-nav" data-mprofile-action="logout"><span class="lo">'+icon("out")+'Logout</span>'+icon("rchev")+'</button><button type="button" class="pf-nav danger" data-mprofile-action="delete-account"><span>Delete account</span>'+icon("trash")+'</button>':'<button type="button" class="btn pri" data-mprofile-action="sign-in">Sign in to MOMIN</button>')+'</div>';
}

function buildSections(){
 var sections=[];
 sections.push({id:"profile",ic:"user",title:"Profile & Account",sub:"Profile, password and signed-in devices",body:profileMarkup()});
 sections.push({id:"appearance",ic:"contrast",title:"Appearance & Personalization",sub:"Theme, contrast and movement",body:
  note("These settings use MOMIN's shared appearance and accessibility preferences.")+
  selectRow("theme","Display mode","Choose how MOMIN looks",[["System","System default"],["Light","Light"],["Dark","Dark"],["Sepia","Sepia"]],"settingsTheme")+
  switchRow("reduceMotion","Reduce animations","Prefer less movement","","settingsReduceMotionV1")+
  switchRow("contrast","High contrast","Increase text and border contrast","","settingsHighContrastV1")+
  saveButton("Save appearance","appearance")});
 sections.push({id:"location",ic:"target",title:"Location & Prayer Times",sub:"",body:
  kv("Current location",esc([draft.city,draft.country].filter(Boolean).join(", ")||"Not set"),"settingsLocationSummaryV1")+
  textRow("city","City","City used for prayer calculations","Enter a city","settingsCityV1")+
  textRow("country","Country","Country for the selected city","Enter a country","settingsCountryV1")+
  actions(saveButton("Save location","location")+button("Use current GPS","ghost","gps"))+
  selectRow("calc","Calculation method","Automatic by location or select a method",methodItems(),"settingsMethodInput")+
  selectRow("asr","Asr calculation","Choose your juristic method",[["standard","Standard (Shafi'i / Maliki / Hanbali)"],["hanafi","Hanafi"]],"settingsAsrMethod")+
  selectRow("sound","Prayer-time sound","Sound used by MOMIN's prayer reminder service.",[["azan","Makkah Azan ringtone"],["chime","Gentle chime while app is open"],["system","System notification sound"],["silent","No extra sound"]],"settingsAdhanSound")+
  note("Prayer timings can vary by calculation method and local mosque. Confirm important timings locally.")+
  saveButton("Save prayer settings","location2")});
 sections.push({id:"notif",ic:"bell",title:"Notifications & Adhan",sub:"Prayer-by-prayer preferences",body:
  note("Prayer reminders can be checked while MOMIN is open. Background browser delivery is not guaranteed on every device.")+
  switchRow("notif","Enable notifications","Master notification preference","","settingsPrayerNotificationsV1")+
  [["Fajr","nFajr","fajr"],["Dhuhr","nDhuhr","dhuhr"],["Asr","nAsr","asr"],["Maghrib","nMaghrib","maghrib"],["Isha","nIsha","isha"]].map(function(p){return switchRow(p[1],p[0],"Reminder preference","notif","settingsNotify-"+p[2]);}).join("")+
  selectRow("lead","Advance reminder","Preferred lead time before prayer",[["0","At prayer time"],["5","5 minutes before"],["10","10 minutes before"],["15","15 minutes before"],["30","30 minutes before"]],"settingsReminderMinutesV1")+
  saveButton("Save notifications","notif")+
  actions(button("Send test notification","ghost","testnote")+button("Preview Makkah Azan","ghost","azan"))});
 sections.push({id:"quran",ic:"book",title:"Quran Reading & Audio",sub:"Translation, text size, reciter and playback",body:
  note("These controls save directly to the Quran reader's existing settings.")+
  selectRow("translation","Default translation","Used when opening a Surah",translationItems(),"settingsQuranTranslation")+
  selectRow("arSize","Arabic text size","Default verse text size",[["34","Small"],["40","Medium"],["48","Large"],["54","Extra large"],["58","Maximum"]],"settingsQuranArabicSizeV1")+
  switchRow("showTr","Show translation","Display translated meaning","","settingsQuranMeaningV1")+
  switchRow("showTl","Show transliteration","Display Roman pronunciation","","settingsQuranTranslitV1")+
  selectRow("layout","Reading layout","Verse list or page-like view",[["list","Verse list"],["page","Page view"]],"settingsQuranModeV1")+
  selectRow("reciter","Reciter","Default Quran recitation voice",RECITERS,"settingsReciterV1")+
  selectRow("speed","Playback speed","Default Quran audio speed",[["0.75","0.75×"],["1","1×"],["1.25","1.25×"],["1.5","1.5×"]],"settingsQuranSpeedV1")+
  switchRow("repeat","Repeat current Surah","Repeat recitation preference","","settingsQuranRepeatV1")+
  switchRow("autoNext","Auto-play next Surah","Continue to the next Surah","","settingsQuranNextV1")+
  switchRow("awake","Keep screen awake","When supported while reading","","settingsKeepAwake")+
  selectRow("qTheme","Quran reader theme","Separate from app-wide theme",[["night","Dark reading page"],["paper","Warm paper"],["white","White page"]],"settingsQuranReaderThemeV1")+
  saveButton("Save Quran defaults","quran")+actions(button("Open Quran","ghost","open-quran"))});
 sections.push({id:"duas",ic:"heart",title:"Duas & Tasbeeh",sub:"Arabic size, sound and vibration",body:
  note("Dua Arabic size and Tasbeeh sound/haptics use the existing Dua and Digital Tasbih settings.")+
  selectRow("duaSize","Dua Arabic text size","Text size in supplication details",[["24","Small"],["28","Medium"],["30","Large"],["34","Extra large"],["40","Maximum"]],"settingsDuaArabicSizeV1")+
  switchRow("tsSound","Tasbeeh click sound","Sound feedback on each bead","","settingsTasbihSoundV1")+
  switchRow("tsVibe","Tasbeeh vibration","Uses device vibration when supported","","settingsTasbihHapticV1")+
  saveButton("Save Duas & Tasbeeh","duas")+actions(button("Open Duas","ghost","open-duas")+button("Open Tasbeeh","ghost","open-tasbeeh"))});
 sections.push({id:"qibla",ic:"compass",title:"Qibla & Nearby Mosques",sub:"Location-based tools and distance units",body:
  note("Qibla and nearby mosque features use the location selected in Location & Prayer Times.")+
  selectRow("units","Distance units","Preferred display for distance",[["km","Kilometres"],["mi","Miles"]],"settingsDistanceUnitV1")+
  saveButton("Save distance units","qibla")+actions(button("Open Qibla Finder","ghost","open-qibla")+button("Nearby Mosques","ghost","open-mosques"))});
 sections.push({id:"calendar",ic:"cal",title:"Islamic Calendar & Events",sub:"Hijri dates and occasion preferences",body:
  note("Hijri dates can vary by local moon sighting. Occasion reminders are a saved preference only and are not scheduled in the background.")+
  selectRow("hijriAdj","Hijri date adjustment","Shift displayed Hijri dates by one day if needed",[["-1","One day earlier"],["0","No adjustment"],["1","One day later"]],"settingsHijriAdjustmentV1")+
  switchRow("occasions","Islamic occasion reminders","Preference only; not scheduled in the background yet","","settingsIslamicEventsV1")+
  saveButton("Save calendar preferences","calendar")+actions(button("Open Calendar","ghost","open-calendar"))});
 sections.push({id:"language",ic:"lang",title:"Language & Accessibility",sub:"Language and interface text",body:
  note("The language selector uses MOMIN's app-wide language service. Some screens may remain in English where translation coverage is not yet available.")+
  selectRow("lang","App language","India's scheduled languages, English and Arabic",LANGS,"settingsAppLanguage")+
  selectRow("textSize","Interface text size","Improve readability",[["normal","Standard"],["large","Large"],["larger","Extra large"]],"settingsInterfaceScaleV1")+
  saveButton("Save language & accessibility","language")});
 sections.push({id:"privacy",ic:"shield",title:"Privacy & Data",sub:"Export and reset preferences",body:
  note("MOMIN stores preferences and feature records in this browser. The account profile and device controls use the real sign-in service.")+
  kv("MOMIN data stored in this browser","","stor1")+
  switchRow("onlineTr","Online interface translation","When disabled, the app language service will not request new online translations.","","settingsOnlineTranslationV1")+
  saveButton("Save privacy preferences","privacy")+
  rowAction("Export a backup","Export the MOMIN local data format used by the app.",button("Export backup","ghost sm","export"))+
  rowAction("Import a backup","Restore a MOMIN backup after confirming its contents.",button("Choose backup","ghost sm","import"))+
  rowAction("Reset settings only","Restore settings while keeping Quran/Dua bookmarks, Tasbeeh counts and reading history.",button("Reset settings","danger sm","reset"))+
  rowAction("Delete MOMIN local data","Permanently remove MOMIN data stored by this browser profile.",button("Delete local data","danger sm","delete"))+
  rowAction("Privacy details","Review what stays on this device and what online features send.",button("View details","ghost sm","privacy"))});
 sections.push({id:"storage",ic:"store",title:"Storage & Offline",sub:"Local storage use and availability",body:
  kv("Estimated MOMIN browser storage in use","","stor2")+
  note("Estimate includes MOMIN- and Noor-namespaced localStorage text data only, not audio downloads, browser cache or files.")+
  rowAction("Offline content","Download manager is not available in this web build.",'<p class="val">Not available yet</p>')});
 sections.push({id:"help",ic:"help",title:"Help & About",sub:"Application information",body:
  '<div class="night brand"><div class="stars" aria-hidden="true" style="position:absolute;inset:0"></div><span class="lt" aria-hidden="true"><img src="./momin-mark.svg?v=islamic-logo-v3" alt="MOMIN logo"></span><div style="position:relative;z-index:1;min-width:0"><span class="eyebrow">Your Islamic daily companion</span><h3>MOMIN</h3><p>Where Faith Meets Devotion</p><span class="ver">Version 1.1 · Web Companion</span></div></div>'+
  '<div class="card2"><h4>Our purpose</h4><p>MOMIN brings useful Islamic worship tools together in one place, supporting daily prayers, Quran reading, supplications and remembrance of Allah.</p></div>'+
  '<p class="sub">Explore MOMIN</p><div class="list">'+[
    ["Prayer Times & Adhan","Prayer schedule and calculation preferences","prayers","clock"],
    ["Holy Quran","Read Quran verses and use supported translation and recitation","quran","book"],
    ["Duas & Tasbeeh","Supplications and remembrance","duas","heart"],
    ["Qibla & Nearby Mosques","Qibla direction and mosque search","qibla","compass"],
    ["Islamic Calendar","Hijri dates and calendar features","calendar","cal"],
    ["Language & Accessibility","App language and reading preferences","settings-language","lang"]
   ].map(function(e){return '<button type="button" class="exp" data-act="route" data-route="'+e[2]+'"><span class="ico">'+icon(e[3])+'</span><span><b>'+e[0]+'</b><span>'+e[1]+'</span></span>'+icon("arrow")+'</button>';}).join("")+'</div>'+
  '<div class="card2"><h4>Privacy &amp; transparency</h4><p>Signed-in account details are supplied by your sign-in provider. App preferences remain stored in this browser. Some features use external online services, and background notifications are not guaranteed.</p><p>Prayer timings and Hijri dates can vary by location, calculation method and moon-sighting practice.</p></div>'+
  '<p class="tag">Made to support your daily journey of faith.</p>'+
  rowAction("Share MOMIN","Share the app link.",button("Share MOMIN","ghost sm","share"))+
  rowAction("Privacy & Data","Learn what is stored and what online features may share.",button("View privacy details","ghost sm","privacy"))+
  '<div class="card2 momin-support-card"><h4>Support</h4><p>For any inquiry, please email us at <a href="mailto:mominsupport0@gmail.com">mominsupport0@gmail.com</a>.</p></div>'});
 var target=document.getElementById("secs");
 target.innerHTML=sections.map(function(sec,i){
  var open=sec.id==="profile";
  return '<section class="acc'+(open?" open":"")+'" id="sec-'+sec.id+'" data-sec="'+sec.id+'" style="--d:'+Math.min(i,6)+'">'+
   '<button type="button" class="acc-h" aria-expanded="'+open+'" aria-controls="b-'+sec.id+'"><span class="ico">'+icon(sec.ic)+'</span>'+
   '<span class="t"><b>'+sec.title+'</b><span>'+sec.sub+'</span></span><span class="dot">Unsaved</span>'+icon("chev")+'</button>'+
   '<div class="acc-b" id="b-'+sec.id+'"><div'+(open?'':' inert')+'><div class="acc-in">'+sec.body+'</div></div></div></section>';
 }).join("");
 target.querySelectorAll(".acc").forEach(function(a){a.dataset.kw=a.textContent.toLowerCase();});
 target.querySelectorAll(".night .stars").forEach(function(el){
  var html="";for(var i=0;i<14;i++){html+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;top:'+(Math.random()*100).toFixed(1)+'%;--t:'+(Math.random()*4).toFixed(2)+'s"></i>';}el.innerHTML=html;
 });
 refresh();
}
function sectionKeys(section,saveId){
 if(section.dataset.sec==="location")return saveId==="location"?["city","country"]:["calc","asr","sound"];
 var out={};section.querySelectorAll("[data-k]").forEach(function(el){out[el.dataset.k]=true;});return Object.keys(out);
}
function dirtyUpdate(){
 var any=false;
 document.querySelectorAll("#secs .acc").forEach(function(a){
  var allKeys={};a.querySelectorAll("[data-k]").forEach(function(el){allKeys[el.dataset.k]=true;});
  var dirty=Object.keys(allKeys).some(function(k){return draft[k]!==saved[k];});
  a.classList.toggle("dirty",dirty);if(dirty)any=true;
 });

}
function refresh(){
 var theme=document.getElementById("curTheme");if(theme){var labels={System:"System default",Light:"Light",Dark:"Dark",Sepia:"Sepia"};theme.textContent=labels[draft.theme]||draft.theme;}
 var loc=[draft.city,draft.country].filter(Boolean).join(", ")||"Not set";
 var cur=document.getElementById("curLoc")||document.getElementById("settingsLocationSummaryV1"),sub=document.getElementById("locSub");
 if(cur)cur.textContent=loc;if(sub)sub.textContent=loc+" · Calculation and Asr preferences";
 var date=document.getElementById("hdrDate");
 if(date){try{var p=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura",{day:"numeric",month:"long",year:"numeric"}).format(new Date());date.textContent=p}catch(_){date.textContent="Islamic calendar"}}
 var avatar=document.getElementById("avBtn"),u=user();
 if(avatar){if(u&&u.avatar)avatar.innerHTML='<img class="pf-avatar-photo" src="'+esc(u.avatar)+'" alt="">';else avatar.textContent=((u&&u.name||"Guest").trim().charAt(0)||"G").toUpperCase()}
 var bytes=0,count=0;
 try{for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key&&(key.indexOf("momin-")===0||key.indexOf("noor-")===0)){count++;bytes+=new Blob([key+(localStorage.getItem(key)||"")]).size}}}catch(_){}
 var storage=count+" entries · "+(bytes/1024).toFixed(1)+" KB";
 ["stor1","stor2"].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=storage});
 document.querySelectorAll("#secs [data-k]").forEach(function(el){var v=draft[el.dataset.k];if(el.getAttribute("role")==="switch")el.setAttribute("aria-checked",!!v);else if(el!==document.activeElement||el.tagName==="SELECT")el.value=v});
 document.querySelectorAll("#secs [data-dep]").forEach(function(row){var disabled=!draft[row.dataset.dep];row.classList.toggle("off",disabled);var btn=row.querySelector("button");if(btn)btn.disabled=disabled});
 dirtyUpdate();
}
function applyTheme(){
 var theme=document.getElementById("settingsTheme"),reduce=document.getElementById("settingsReduceMotionV1"),contrast=document.getElementById("settingsHighContrastV1");
 if(theme)theme.value=draft.theme;if(reduce)reduce.checked=!!draft.reduceMotion;if(contrast)contrast.checked=!!draft.contrast;
 if(typeof window.saveAppearancePrefsV1==="function"){window.saveAppearancePrefsV1();return true;}
 if(typeof window.setTheme==="function")window.setTheme(draft.theme);
 localStorage.setItem("noor-reduce-motion",draft.reduceMotion?"true":"false");localStorage.setItem("noor-high-contrast",draft.contrast?"true":"false");
 return true;
}
function applyLocation(){
 var city=document.getElementById("settingsCityV1"),country=document.getElementById("settingsCountryV1");
 if(city)city.value=draft.city;if(country)country.value=draft.country;
 if(typeof window.saveSettingsLocationV1==="function"){window.saveSettingsLocationV1();return true;}
 toast("Location settings are not available in this app version.");return false;
}
function applyPrayer(){
 var method=document.getElementById("settingsMethodInput"),asr=document.getElementById("settingsAsrMethod"),sound=document.getElementById("settingsAdhanSound");
 if(method)method.value=draft.calc;if(asr)asr.value=draft.asr;if(sound)sound.value=draft.sound;
 window.settingsMethodModeDraftV6=draft.calc==="auto"?"auto":"manual";
 if(typeof window.savePrayerBasicsV1==="function"){window.savePrayerBasicsV1();return true;}
 if(typeof window.savePrayerSettingsV6==="function"){window.savePrayerSettingsV6();return true;}
 toast("Prayer settings service is not available.");return false;
}
function applyNotifications(){
 var master=document.getElementById("settingsPrayerNotificationsV1");if(master)master.checked=!!draft.notif;
 [["fajr","nFajr"],["dhuhr","nDhuhr"],["asr","nAsr"],["maghrib","nMaghrib"],["isha","nIsha"]].forEach(function(p){
  var el=document.getElementById("settingsNotify-"+p[0]);if(el)el.checked=!!draft[p[1]];
 });
 var lead=document.getElementById("settingsReminderMinutesV1");if(lead)lead.value=String(draft.lead);
 if(typeof window.saveNotificationPrefsV1==="function"){window.saveNotificationPrefsV1();return true;}
 toast("Notification settings service is not available.");return false;
}
function applyQuran(){
 var edition=document.getElementById("settingsQuranTranslation");if(edition)edition.value=draft.translation;
 var size=document.getElementById("settingsQuranArabicSizeV1");if(size)size.value=draft.arSize;
 var meaning=document.getElementById("settingsQuranMeaningV1");if(meaning)meaning.checked=!!draft.showTr;
 var translit=document.getElementById("settingsQuranTranslitV1");if(translit)translit.checked=!!draft.showTl;
 var mode=document.getElementById("settingsQuranModeV1");if(mode)mode.value=draft.layout;
 var reciter=document.getElementById("settingsReciterV1");if(reciter)reciter.value=draft.reciter;
 var speed=document.getElementById("settingsQuranSpeedV1");if(speed)speed.value=draft.speed;
 var repeat=document.getElementById("settingsQuranRepeatV1");if(repeat)repeat.checked=!!draft.repeat;
 var next=document.getElementById("settingsQuranNextV1");if(next)next.checked=!!draft.autoNext;
 var awake=document.getElementById("settingsKeepAwake");if(awake)awake.checked=!!draft.awake;
 var theme=document.getElementById("settingsQuranReaderThemeV1");if(theme)theme.value=draft.qTheme;
 if(typeof window.saveQuranDefaultsV1==="function"){window.saveQuranDefaultsV1();return true;}
 toast("Quran settings service is not available.");return false;
}
function applyDuas(){
 var size=document.getElementById("settingsDuaArabicSizeV1");if(size)size.value=String(draft.duaSize);
 var sound=document.getElementById("settingsTasbihSoundV1");if(sound)sound.checked=!!draft.tsSound;
 var haptic=document.getElementById("settingsTasbihHapticV1");if(haptic)haptic.checked=!!draft.tsVibe;
 if(typeof window.saveDuaTasbihPrefsV1==="function"){window.saveDuaTasbihPrefsV1();return true;}
 toast("Dua and Tasbeeh settings service is not available.");return false;
}
function applyLanguage(){
 var language=document.getElementById("settingsAppLanguage");if(language)language.value=draft.lang;
 var scale=document.getElementById("settingsInterfaceScaleV1");if(scale)scale.value=draft.textSize;
 if(typeof window.saveLanguageAccessibilityV1==="function"){window.saveLanguageAccessibilityV1();return true;}
 localStorage.setItem("noor-language",draft.lang);if(typeof window.setMominLanguageV1==="function")window.setMominLanguageV1(draft.lang);
 return true;
}
function applyCalendar(){
 var events=document.getElementById("settingsIslamicEventsV1");if(events)events.checked=!!draft.occasions;
 var adj=document.getElementById("settingsHijriAdjustmentV1");if(adj)adj.value=draft.hijriAdj;
 if(typeof window.saveCalendarPrefsV1==="function"){window.saveCalendarPrefsV1();return true;}
 localStorage.setItem("noor-hijri-adjustment",draft.hijriAdj);localStorage.setItem("noor-islamic-event-reminders",draft.occasions?"true":"false");return true;
}
function applyDistance(){
 var units=document.getElementById("settingsDistanceUnitV1");if(units)units.value=draft.units;
 if(typeof window.saveDistanceUnitV1==="function"){window.saveDistanceUnitV1();return true;}
 localStorage.setItem("noor-distance-unit",draft.units);return true;
}
function applyPrivacy(){
 var toggle=document.getElementById("settingsOnlineTranslationV1");if(toggle)toggle.checked=!!draft.onlineTr;
 if(typeof window.savePrivacyPrefsV1==="function"){window.savePrivacyPrefsV1();return true;}
 localStorage.setItem("momin-privacy-online-translation",draft.onlineTr?"true":"false");return true;
}
function applySection(id,saveId){
 if(id==="appearance")return applyTheme();
 if(id==="location"){if(saveId==="location")return applyLocation();return applyPrayer();}
 if(id==="notif")return applyNotifications();
 if(id==="quran")return applyQuran();
 if(id==="duas")return applyDuas();
 if(id==="qibla")return applyDistance();
 if(id==="calendar")return applyCalendar();
 if(id==="language")return applyLanguage();
 if(id==="privacy")return applyPrivacy();
 return true;
}
function saveSection(section,saveId){
 var keys=sectionKeys(section,saveId),changed=keys.some(function(k){return draft[k]!==saved[k];});
 if(!changed){toast("Nothing new to save");return;}
 if(applySection(section.dataset.sec,saveId)===false)return;
 keys.forEach(function(k){saved[k]=draft[k];});
 try{localStorage.setItem("momin-settings",JSON.stringify(saved));}catch(_){}
 refresh();toast(section.querySelector(".t b").textContent+" saved");
}
window.refreshMominSettingsProfileV2=function(){
 var current=document.getElementById("pfBox");
 if(current)current.outerHTML=profileMarkup();
 var avatar=document.getElementById("avBtn"),u=user();
 if(avatar){
  if(u&&u.avatar)avatar.innerHTML='<img class="pf-avatar-photo" src="'+esc(u.avatar)+'" alt="">';
  else avatar.textContent=((u&&u.name||"Guest").trim().charAt(0)||"G").toUpperCase();
 }
};
function updateDraft(k,v){
 draft[k]=v;if(k==="calc")window.settingsMethodModeDraftV6=v==="auto"?"auto":"manual";
 refresh();
}
function openSheet(title,body,ok,action,danger){
 var sheet=document.getElementById("sheet"),scrim=document.getElementById("scrim");
 if(!sheet||!scrim)return;
 sheet.innerHTML='<div class="grab"></div><h3 id="shT">'+title+'</h3><div class="sb">'+body+'</div><div class="sa"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn '+(danger?"danger":"pri")+'" data-confirm>'+ok+'</button></div>';
 sheet.classList.add("on");scrim.classList.add("on");sheet.setAttribute("aria-hidden","false");
 sheet.onclick=function(e){if(e.target.closest("[data-close]")){closeSheet();return}if(e.target.closest("[data-confirm]")){closeSheet();action()}};
 scrim.onclick=closeSheet;
}
function closeSheet(){var sheet=document.getElementById("sheet"),scrim=document.getElementById("scrim");if(sheet){sheet.classList.remove("on");sheet.setAttribute("aria-hidden","true")}if(scrim)scrim.classList.remove("on")}
function openSettingsSection(sectionId){
 if(typeof go==="function")go("settings");
 window.setTimeout(function(){
  var target=document.getElementById("sec-"+sectionId);
  if(target){toggleAcc(target,true);target.scrollIntoView({behavior:"smooth",block:"start"});}
 },120);
}
function act(action,button){
 var route={"open-quran":"quran","open-duas":"duas","open-tasbeeh":"tasbeeh","open-qibla":"qibla","open-mosques":"qibla","open-calendar":"calendar"};
 if(route[action]){if(typeof go==="function")go(route[action]);return;}
 if(action==="route"){
  var dest=button.dataset.route||"home";
  if(dest.indexOf("settings-")===0){openSettingsSection(dest.slice(9));return;}
  if(typeof go==="function")go(dest);return;
 }
 if(action==="change-profile-photo"){var input=document.getElementById("pfFile");if(input){input.value="";input.click();}else toast("Photo upload control is unavailable.");return;}
 if(action==="gps"){if(typeof window.useSettingsGpsV1==="function")window.useSettingsGpsV1();else if(typeof setLocation==="function")setLocation();else toast("Location access is not available here.");return;}
 if(action==="founder"){
  if(typeof window.openMominFounderRouteV1==="function")window.openMominFounderRouteV1();
  else if(typeof window.openMominFounderPageV1==="function")window.openMominFounderPageV1();
  else toast("The Founder page is not available. Refresh MOMIN and try again.");
  return;
 }
 if(action==="privacy"){if(typeof window.showMominPrivacySummaryV1==="function")window.showMominPrivacySummaryV1();else toast("Privacy details are not available.");return;}
 if(action==="testnote"){if(typeof window.testMominNotificationV1==="function")window.testMominNotificationV1();else toast("Notification test is not available.");return;}
 if(action==="azan"){if(typeof window.previewMominAzanV1==="function")window.previewMominAzanV1();else toast("Makkah Azan preview is not available.");return;}
 if(action==="share"){if(typeof window.shareMominV1==="function")window.shareMominV1();else toast("Sharing is not available here.");return;}
 if(action==="export"){if(typeof window.exportMominDataV1==="function")window.exportMominDataV1();else toast("MOMIN export is not available.");return;}
 if(action==="import"){var input=document.getElementById("imp");if(input){input.value="";input.click();}return;}
 if(action==="reset"){if(typeof window.resetMominSettingsV1==="function")window.resetMominSettingsV1();else toast("Settings reset is not available.");return;}
 if(action==="delete"){if(typeof window.deleteMominLocalDataV1==="function")window.deleteMominLocalDataV1();else toast("Local data deletion is not available.");return;}
 if(action==="explore"){if(typeof go==="function")go(button.dataset.to||"home");return;}
}
function initializePage(){
 initState();buildSections();
 if(typeof loadIndianQuranTranslationsV6==="function"){
  var currentEdition=draft.translation;
  try{
   Promise.resolve(loadIndianQuranTranslationsV6()).then(function(){
    var select=document.getElementById("settingsQuranTranslation");
    if(!select||typeof quranTranslationOptionsV5!=="function")return;
    select.innerHTML=quranTranslationOptionsV5();
    if(Array.prototype.some.call(select.options,function(option){return option.value===currentEdition;}))select.value=currentEdition;
   }).catch(function(){});
  }catch(_){}
 }
 var q=document.getElementById("q"),search=document.getElementById("searchBox"),none=document.getElementById("none"),extras=document.getElementById("extras"),hero=document.getElementById("hero");
 q.addEventListener("input",function(){
  var v=q.value.trim().toLowerCase(),any=false;search.classList.toggle("has",!!q.value);
  document.querySelectorAll("#secs .acc").forEach(function(a){var hit=!v||a.dataset.kw.indexOf(v)>=0;a.hidden=!hit;if(hit)any=true;if(v&&hit)toggleAcc(a,true);});
  none.hidden=any;extras.hidden=!!v;hero.hidden=!!v;
 });
 document.getElementById("qx").onclick=function(){q.value="";q.dispatchEvent(new Event("input"));q.focus();};
 document.getElementById("secs").addEventListener("click",function(e){
  var header=e.target.closest(".acc-h");if(header){toggleAcc(header.parentNode);return;}
  var sw=e.target.closest(".swt");if(sw&&!sw.disabled){updateDraft(sw.dataset.k,sw.getAttribute("aria-checked")!=="true");return;}
  var save=e.target.closest("[data-save]");if(save){saveSection(save.closest(".acc"),save.dataset.save);return;}
  var action=e.target.closest("[data-act]");if(action)act(action.dataset.act,action);
 });
 document.getElementById("secs").addEventListener("input",function(e){var el=e.target;if(el.dataset&&el.dataset.k&&el.tagName==="INPUT")updateDraft(el.dataset.k,el.value);});
 document.getElementById("secs").addEventListener("change",function(e){var el=e.target;if(el.dataset&&el.dataset.k&&el.tagName==="SELECT")updateDraft(el.dataset.k,el.value);});
 document.getElementById("extras").addEventListener("click",function(e){var action=e.target.closest("[data-act]");if(action)act(action.dataset.act,action);});
async function uploadMominProfilePhotoV2(file,input){
 var sb=window.mominSupabase,profileApi=window.MominProfileSettingsV1;
 if(!sb||!sb.auth||!sb.storage){toast("Profile photo storage is not available. Refresh MOMIN and try again.");return;}
 if(!file)return;
 var allowed=["image/jpeg","image/png","image/webp","image/avif"];
 if(allowed.indexOf(file.type)<0){toast("Choose a JPG, PNG, WebP or AVIF image.");return;}
 if(file.size>5*1024*1024){toast("Choose an image smaller than 5 MB.");return;}
 var uploadButton=document.querySelector('#pfBox [data-act="change-profile-photo"]');
 var oldLabel=uploadButton&&uploadButton.textContent;
 if(uploadButton){uploadButton.disabled=true;uploadButton.textContent="Uploading photo…";}
 toast("Uploading your profile photo…");
 var uploadedPath=null;
 try{
  var auth=await sb.auth.getUser();
  if(auth.error)throw auth.error;
  var currentUser=auth.data&&auth.data.user;
  if(!currentUser)throw new Error("Please sign in before uploading a profile photo.");
  var bitmap=await createImageBitmap(file);
  var longest=Math.max(bitmap.width,bitmap.height);
  var scale=Math.min(1,640/longest);
  var canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  var context=canvas.getContext("2d");
  if(!context)throw new Error("This browser could not prepare the selected photo.");
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  if(bitmap.close)bitmap.close();
  var blob=await new Promise(function(resolve,reject){
    canvas.toBlob(function(result){if(result)resolve(result);else reject(new Error("Could not process the selected photo."));},"image/jpeg",0.86);
  });
  var token=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
  uploadedPath=currentUser.id+"/"+token+".jpg";
  var uploaded=await sb.storage.from("avatars").upload(uploadedPath,blob,{
    contentType:"image/jpeg",cacheControl:"31536000",upsert:false
  });
  if(uploaded.error)throw uploaded.error;
  var publicResult=sb.storage.from("avatars").getPublicUrl(uploadedPath);
  var photoUrl=publicResult&&publicResult.data&&publicResult.data.publicUrl;
  if(!photoUrl)throw new Error("The uploaded photo URL could not be created.");
  var updated=await sb.auth.updateUser({data:{avatar_url:photoUrl}});
  if(updated.error)throw updated.error;
  var updatedUser=updated.data&&updated.data.user;
  if(!updatedUser)throw new Error("The photo uploaded, but the account did not return the updated profile.");
  if(profileApi&&typeof profileApi.setUser==="function")profileApi.setUser(updatedUser,true);
  try{
    var meta=updatedUser.user_metadata||{};
    await sb.from("momin_profiles").upsert({
      user_id:updatedUser.id,
      display_name:meta.full_name||meta.name||meta.display_name||updatedUser.email||"",
      email:updatedUser.email||null,
      avatar_url:photoUrl,
      auth_provider:(updatedUser.app_metadata&&updatedUser.app_metadata.provider)||"email",
      email_verified:!!updatedUser.email_confirmed_at,
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
  }catch(profileError){console.warn("MOMIN profile avatar sync:",profileError&&profileError.message);}
  if(typeof window.refreshMominSettingsProfileV2==="function")window.refreshMominSettingsProfileV2();
  var oldUrl=currentUser.user_metadata&&currentUser.user_metadata.avatar_url||"";
  var marker="/storage/v1/object/public/avatars/";
  var oldAt=oldUrl.indexOf(marker);
  if(oldAt>=0){
    var oldPath="";
    try{oldPath=decodeURIComponent(oldUrl.slice(oldAt+marker.length).split("?")[0]);}catch(_){}
    if(oldPath&&oldPath.indexOf(currentUser.id+"/")===0&&oldPath!==uploadedPath){
      sb.storage.from("avatars").remove([oldPath]).catch(function(){});
    }
  }
  toast("Profile photo updated successfully.");
 }catch(error){
  if(uploadedPath){try{await sb.storage.from("avatars").remove([uploadedPath]);}catch(_){}}
  toast(error&&error.message||"Could not upload the profile photo.");
 }finally{
  if(uploadButton){uploadButton.disabled=false;uploadButton.textContent=oldLabel||"Upload / Change profile photo";}
  if(input)input.value="";
 }
}

 document.getElementById("pfFile").addEventListener("change",function(e){
  var input=e.target,file=input.files&&input.files[0];
  if(file)uploadMominProfilePhotoV2(file,input);
 });
 document.getElementById("imp").addEventListener("change",function(e){
  var input=e.target,file=input.files&&input.files[0];if(!file)return;
  if(typeof window.importMominDataV1==="function")window.importMominDataV1(file,input);else toast("MOMIN backup import is not available.");
 });
 document.querySelectorAll(".tab").forEach(function(t){
  t.onclick=function(){
   if(t.dataset.t==="Journey"){toast("The Journey page is not available in this web build yet.");return;}
   var routes={Home:"home",Prayers:"prayers",Quran:"quran"};
   if(typeof go==="function")go(routes[t.dataset.t]||"home");
  };
 });
 var avatar=document.getElementById("avBtn");if(avatar)avatar.onclick=function(){var section=document.getElementById("sec-profile");if(section){toggleAcc(section,true);section.scrollIntoView({behavior:"smooth",block:"start"});}};
 var bar=document.getElementById("bar"),scrollHandler=function(){if(bar)bar.classList.toggle("scrolled",window.scrollY>6);};
 if(window.__mominSettingsBarScroll)window.removeEventListener("scroll",window.__mominSettingsBarScroll);
 window.__mominSettingsBarScroll=scrollHandler;window.addEventListener("scroll",scrollHandler,{passive:true});scrollHandler();
}
function toggleAcc(section,force){var open=force==null?!section.classList.contains("open"):force;section.classList.toggle("open",open);section.querySelector(".acc-h").setAttribute("aria-expanded",String(open));var body=section.querySelector(".acc-b>div");if(open)body.removeAttribute("inert");else body.setAttribute("inert","")}
function initialize(){initializePage()}
/* Apply the saved Hijri date adjustment to the actual Calendar page display. */
function adjustedHijriLabelV2(){
 var adjustment=Number(localStorage.getItem("noor-hijri-adjustment")||"0");
 if(adjustment!==-1&&adjustment!==0&&adjustment!==1)adjustment=0;
 var date=new Date();date.setDate(date.getDate()+adjustment);
 try{
  var parts={};
  new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn",{day:"numeric",month:"long",year:"numeric"}).formatToParts(date).forEach(function(part){parts[part.type]=part.value;});
  if(parts.day&&parts.month&&parts.year)return parts.day+" "+parts.month+" "+parts.year+" AH";
 }catch(_){}
 return "";
}
var baseCalendarPageV2=window.calendarPage;
if(typeof baseCalendarPageV2==="function"){
 window.calendarPage=function(){
  var html=baseCalendarPageV2.apply(this,arguments);
  var adjustment=Number(localStorage.getItem("noor-hijri-adjustment")||"0");
  if(adjustment!==-1&&adjustment!==0&&adjustment!==1)adjustment=0;
  if(!adjustment)return html;
  var hijri=null;
  try{hijri=livePrayer&&livePrayer.date&&livePrayer.date.hijri;}catch(_){}
  var original=hijri?hijri.day+" "+hijri.month.en+" "+hijri.year+" AH":"";
  var adjusted=adjustedHijriLabelV2();
  if(!adjusted)return html;
  if(original&&html.indexOf(original)>=0)return html.split(original).join(adjusted);
  return html;
 };
}
var baseRender=window.render,token=0;
window.settingsPage=function(){ensureStyle();return ICONS+PAGE};
if(typeof settingsPage!=="undefined")settingsPage=window.settingsPage;
window.render=function(){
 var result=baseRender.apply(this,arguments);
 var active=typeof page!=="undefined"&&page==="settings";
 document.body.classList.toggle("momin-settings-v2-active",active);
 if(active){ensureStyle();var id=++token;window.setTimeout(function(){if(id===token&&page==="settings")initialize()},0)}
 else{token++;removeStyle()}
 return result;
};
window.addEventListener("momin:auth-state-changed",function(){if(typeof page!=="undefined"&&page==="settings")window.render()});
if(typeof page!=="undefined"&&page==="settings")window.render();
})();