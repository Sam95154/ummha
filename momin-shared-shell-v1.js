/* MOMIN Shared App Shell V1
   One shared header and four-tab bottom navigation for every authenticated app route.
   This module changes presentation and route presentation only; feature renderers remain in place.
*/
(function(){
  "use strict";
  if(window.MominSharedShellV1&&window.MominSharedShellV1.initialized)return;

  var STYLE_ID="momin-shared-shell-v1-style";
  var HEADER_ID="momin-shared-header-v1";
  var NAV_ID="momin-shared-bottom-nav-v1";
  var SPACER_ID="momin-shared-bottom-space-v1";
  var routeStack=[];
  var scrollPositions=Object.create(null);
  var syncPending=false;
  var observer=null;
  var originalGo=typeof window.go==="function"?window.go:null;
  var originalRender=typeof window.render==="function"?window.render:null;

  var TOKENS=`
:root{
 --momin-bg:#0f0d0a;--momin-card:#181510;--momin-card-2:#201b13;
 --momin-border:#2f2819;--momin-gold-border:#5a4720;
 --momin-text:#f3ecda;--momin-muted:#a79f8a;
 --momin-gold:#d9aa52;--momin-gold-bright:#e8c071;--momin-gold-soft:#2b2312;
 --momin-hero:linear-gradient(160deg,#0c0a06 0%,#15110a 54%,#241a0c 100%);
 --momin-danger:#e88a73;--momin-success:#4fbf82;
 --momin-ease:cubic-bezier(.22,1,.36,1);
 --bg:var(--momin-bg);--surface:var(--momin-card);--card:var(--momin-card);
 --card-2:var(--momin-card-2);--line:var(--momin-border);--ink:var(--momin-text);
 --muted:var(--momin-muted);--accent:var(--momin-gold);--accent-strong:var(--momin-gold-bright);
 --accent-soft:var(--momin-gold-soft);--green:var(--momin-success);
 --momin-header-height:72px;
}
@media(prefers-color-scheme:light){
 html:not([data-theme="dark"]):not([data-theme="sepia"]){
  --momin-bg:#f3efe5;--momin-card:#fdfbf6;--momin-card-2:#f8f3e6;
  --momin-border:#e6dfcc;--momin-gold-border:#d9c28a;
  --momin-text:#1b1710;--momin-muted:#7a7466;
  --momin-gold:#a97a22;--momin-gold-bright:#d6a74a;--momin-gold-soft:#efe2c2;
  --momin-danger:#b3402f;--momin-success:#2f8f5b;
  --momin-hero:linear-gradient(160deg,#fdfbf6 0%,#f8f3e6 58%,#efe2c2 100%);
 }
}
html[data-theme="light"]{
 --momin-bg:#f3efe5;--momin-card:#fdfbf6;--momin-card-2:#f8f3e6;
 --momin-border:#e6dfcc;--momin-gold-border:#d9c28a;
 --momin-text:#1b1710;--momin-muted:#7a7466;
 --momin-gold:#a97a22;--momin-gold-bright:#d6a74a;--momin-gold-soft:#efe2c2;
 --momin-danger:#b3402f;--momin-success:#2f8f5b;
 --momin-hero:linear-gradient(160deg,#fdfbf6 0%,#f8f3e6 58%,#efe2c2 100%);
}
html[data-theme="dark"]{
 --momin-bg:#0f0d0a;--momin-card:#181510;--momin-card-2:#201b13;
 --momin-border:#2f2819;--momin-gold-border:#5a4720;
 --momin-text:#f3ecda;--momin-muted:#a79f8a;
 --momin-gold:#d9aa52;--momin-gold-bright:#e8c071;--momin-gold-soft:#2b2312;
 --momin-danger:#e88a73;--momin-success:#4fbf82;
 --momin-hero:linear-gradient(160deg,#0c0a06 0%,#15110a 54%,#241a0c 100%);
}
html[data-theme="sepia"]{
 --momin-bg:#eee4cf;--momin-card:#fff7e6;--momin-card-2:#f5ebd8;
 --momin-border:#dfd1b5;--momin-gold-border:#c7a76a;
 --momin-text:#33291c;--momin-muted:#7c6b51;
 --momin-gold:#9b6e26;--momin-gold-bright:#b8893b;--momin-gold-soft:#ead8b6;
 --momin-danger:#a33a2d;--momin-success:#2f8055;
 --momin-hero:linear-gradient(160deg,#fff7e6 0%,#f5ebd8 58%,#ead8b6 100%);
}
html,body{background:var(--momin-bg);color:var(--momin-text)}
body.momin-app-shell-active{
 background:var(--momin-bg)!important;color:var(--momin-text)!important;
 font-family:'DM Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
 overflow-x:hidden;
}
body.momin-app-shell-active :is(h1,h2,h3,h4,.page-title h1){
 font-family:'Playfair Display',Georgia,serif;
}
body.momin-app-shell-active :is(.arabic,[lang="ar"],.quran-arabic){
 font-family:'Amiri',serif;
}
body.momin-app-shell-active .layout{
 display:block!important;grid-template-columns:1fr!important;
 width:100%!important;min-height:0!important;height:auto!important;
 margin:0!important;padding:0!important;overflow:visible!important;
 background:transparent!important;
}
body.momin-app-shell-active .layout>.sidebar,
body.momin-app-shell-active .layout>main>.top,
body.momin-app-shell-active .mobilebar{
 display:none!important;
}
body.momin-app-shell-active .layout>main{
 display:block!important;width:100%!important;min-width:0!important;
 max-width:none!important;height:auto!important;min-height:0!important;
 margin:0!important;padding:0!important;overflow:visible!important;
 background:transparent!important;
}
body.momin-app-shell-active #view.content{
 display:block!important;width:100%!important;max-width:480px!important;
 min-width:0!important;min-height:0!important;height:auto!important;
 margin:0 auto!important;padding:0!important;
 overflow:visible!important;background:transparent!important;
 color:var(--momin-text)!important;
}
body.momin-app-shell-active .app{
 width:100%!important;max-width:480px!important;margin:0 auto!important;
 padding-bottom:8px!important;background:transparent!important;
}
body.momin-app-shell-active .tabs,
body.momin-app-shell-active .mobilebar,
body.momin-app-shell-active #mobileNav{
 display:none!important;
}
body.momin-app-shell-active .app>.top,
body.momin-app-shell-active .app>.bar,
body.momin-app-shell-active .dua-topbar,
body.momin-app-shell-active .mq-header,
body.momin-app-shell-active .quran-library.qv-shell .qv-head,
body.momin-app-shell-active .momin-mosque-design-v2 .wrap>header{
 display:none!important;
}
body.momin-app-shell-active .quran-library.qv-shell .qv-top{
 position:relative!important;top:auto!important;
 margin:0!important;padding-top:0!important;
}
body.momin-app-shell-active .momin-qibla-finder .mq-wrap{
 padding-top:0!important;
}
body.momin-app-shell-active .dua-page{
 padding-top:0!important;
}
body.momin-app-shell-active .content,
body.momin-app-shell-active main{
 color:var(--momin-text);
}
body.momin-app-shell-active :is(.card,.card2,.quick,.dua,.panel,.setting,.journey-stat,.prayerrow,.momin-sc-group){
 border-color:var(--momin-border);
}
body.momin-app-shell-active :is(button,input,select,textarea):focus-visible{
 outline:2px solid var(--momin-gold-bright)!important;
 outline-offset:3px!important;
}
body.momin-app-shell-active .momin-shell-bottom-space{
 display:block!important;width:100%!important;height:calc(140px + env(safe-area-inset-bottom,0px))!important;
 pointer-events:none!important;
}
.momin-shell-header{
 position:sticky;top:0;z-index:55;width:100%;
 padding:env(safe-area-inset-top,0px) 16px 0;
 background:color-mix(in srgb,var(--momin-card) 86%,transparent);
 border-bottom:1px solid transparent;
 backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
 transition:border-color .3s var(--momin-ease),box-shadow .3s var(--momin-ease),background .3s var(--momin-ease);
}
.momin-shell-header.is-scrolled{
 border-bottom-color:var(--momin-border);
 box-shadow:0 8px 24px -20px rgba(0,0,0,.55);
}
.momin-shell-header__inner{
 width:100%;max-width:480px;min-height:70px;margin:0 auto;
 display:grid;grid-template-columns:44px minmax(0,1fr) 88px;
 gap:10px;align-items:center;
}
.momin-shell-header__title{min-width:0;text-align:left}
.momin-shell-header__title h1{
 margin:0;color:var(--momin-text);font:600 27px/1.12 'Playfair Display',Georgia,serif;
 letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.momin-shell-header__title p{
 margin:4px 0 0;color:var(--momin-muted);font:500 13px/1.3 'DM Sans',sans-serif;
 white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.momin-shell-header.is-sub .momin-shell-header__inner{
 grid-template-columns:44px minmax(0,1fr) 44px;
}
.momin-shell-header.is-sub .momin-shell-header__title{text-align:center}
.momin-shell-header.is-sub .momin-shell-header__title h1{font-size:24px}
.momin-shell-back,.momin-shell-action,.momin-shell-logo{
 width:44px;height:44px;min-width:44px;min-height:44px;
 display:grid;place-items:center;border-radius:50%;
 color:var(--momin-text);background:transparent;
 border:1px solid var(--momin-gold-border);
 cursor:pointer;transition:transform .3s var(--momin-ease),background .3s var(--momin-ease),border-color .3s var(--momin-ease);
}
.momin-shell-back svg,.momin-shell-action svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.momin-shell-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px}
.momin-shell-actions .momin-shell-action{width:40px;height:40px;min-width:40px;min-height:40px}
.momin-shell-avatar{
 width:42px;height:42px;min-width:42px;min-height:42px;border-radius:50%;
 display:grid;place-items:center;overflow:hidden;border:1px solid var(--momin-gold-border);
 background:var(--momin-gold-soft);color:var(--momin-gold-bright);
 font:600 18px 'Playfair Display',Georgia,serif;cursor:pointer;
}
.momin-shell-avatar img{display:block;width:100%;height:100%;object-fit:cover}
.momin-shell-logo{
 border-radius:15px;background:#f8f0db;border-color:var(--momin-gold-border);
 overflow:hidden;padding:5px;
}
.momin-shell-logo img{display:block;width:100%;height:100%;object-fit:contain}
.momin-shell-back:active,.momin-shell-action:active,.momin-shell-avatar:active,
.momin-shell-logo:active{transform:scale(.94)}
.momin-shell-bottom-nav{
 position:fixed;left:16px;right:16px;bottom:calc(10px + env(safe-area-inset-bottom,0px));
 z-index:60;width:min(480px,calc(100% - 32px));margin:0 auto;
 padding:6px;border:1px solid var(--momin-border);border-radius:26px;
 background:color-mix(in srgb,var(--momin-card) 82%,transparent);
 backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
 box-shadow:0 20px 45px -20px rgba(0,0,0,.58);
 display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;
}
.momin-shell-bottom-nav button{
 position:relative;isolation:isolate;min-width:0;min-height:62px;padding:7px 3px 6px;
 border:1px solid transparent;border-radius:19px;background:transparent;
 color:var(--momin-muted);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
 font:600 12px/1.1 'DM Sans',sans-serif;cursor:pointer;
 transition:color .3s var(--momin-ease),background .3s var(--momin-ease),border-color .3s var(--momin-ease),transform .3s var(--momin-ease);
}
.momin-shell-bottom-nav button svg{width:22px;height:22px;display:block;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s var(--momin-ease)}
.momin-shell-bottom-nav button[aria-current="page"]{
 color:var(--momin-gold-bright);border-color:var(--momin-gold);
 background:var(--momin-gold-soft);
}
.momin-shell-bottom-nav button:active{transform:scale(.96)}
.momin-shell-bottom-nav button:active svg{transform:scale(.9)}
.momin-shell-bottom-nav button:focus-visible{
 outline:2px solid var(--momin-gold-bright);outline-offset:2px;
}
.momin-shell-bottom-nav .momin-shell-indicator{
 position:absolute;z-index:-1;inset:0;border-radius:19px;
 background:var(--momin-gold-soft);opacity:0;transform:scale(.94);
 transition:opacity .3s var(--momin-ease),transform .3s var(--momin-ease);
}
.momin-shell-bottom-nav button[aria-current="page"] .momin-shell-indicator{opacity:1;transform:scale(1)}
.momin-shell-header~.layout{scroll-margin-top:var(--momin-header-height)}
body.momin-app-shell-active #toast{z-index:75;bottom:calc(104px + env(safe-area-inset-bottom,0px))}
body.momin-app-shell-active .toast{z-index:75}
body.momin-app-shell-active .quran-reader{padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))!important}
body.momin-app-shell-active .quran-library.qv-shell{padding-bottom:12px!important}
body.momin-app-shell-active .momin-qibla-finder{padding-bottom:12px!important}
body.momin-app-shell-active.momin-founder-route-v3{overflow:hidden!important}
body.momin-app-shell-active.momin-founder-route-v3 .layout{
 height:calc(100dvh - var(--momin-header-height))!important;
 min-height:0!important;overflow:hidden!important;
}
body.momin-app-shell-active.momin-founder-route-v3 #view.content{
 height:100%!important;min-height:0!important;overflow:hidden!important;
 padding:0!important;
}
body.momin-app-shell-active.momin-founder-route-v3 #momin-founder-frame-v3{
 height:100%!important;min-height:0!important;
}
@keyframes mominShellRiseV1{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
body.momin-app-shell-active.momin-shell-enter #view :is(.card,.card2,.acc,.momin-qibla-finder .mq-card,.journey-stat){
 animation:mominShellRiseV1 .42s var(--momin-ease) both;
}
body.momin-app-shell-active.momin-shell-enter #view :is(.card,.card2,.acc):nth-child(2){animation-delay:60ms}
body.momin-app-shell-active.momin-shell-enter #view :is(.card,.card2,.acc):nth-child(3){animation-delay:120ms}
body.momin-app-shell-active.momin-shell-enter #view :is(.card,.card2,.acc):nth-child(4){animation-delay:180ms}
@media(max-width:380px){
 .momin-shell-header__inner{grid-template-columns:42px minmax(0,1fr) 84px;gap:7px}
 .momin-shell-header__title h1{font-size:24px}
 .momin-shell-header__title p{font-size:12px}
 .momin-shell-actions{gap:4px}
 .momin-shell-actions .momin-shell-action{width:36px;height:36px;min-width:36px;min-height:36px}
 .momin-shell-avatar{width:38px;height:38px;min-width:38px;min-height:38px}
 .momin-shell-bottom-nav{left:12px;right:12px;width:calc(100% - 24px)}
}
@media(min-width:700px){
 .momin-shell-header__inner{min-height:76px}
 .momin-shell-bottom-nav{bottom:calc(10px + env(safe-area-inset-bottom,0px))}
}
@media(prefers-reduced-motion:reduce){
 .momin-shell-header,.momin-shell-header *,.momin-shell-bottom-nav,.momin-shell-bottom-nav *{
  animation:none!important;transition:none!important;scroll-behavior:auto!important;
 }
 body.momin-app-shell-active.momin-shell-enter #view *{animation:none!important;transition:none!important}
}
`;
  var css=TOKENS+String.raw`
body.momin-app-shell-active .momin-home-v3-active .app>.top,
body.momin-app-shell-active.momin-home-v3-active .app>.top{display:none!important}
body.momin-app-shell-active .momin-settings-v2-active .app>.top,
body.momin-app-shell-active.momin-settings-v2-active .app>.top{display:none!important}
body.momin-app-shell-active .momin-settings-v2-active .tabs,
body.momin-app-shell-active.momin-home-v3-active .tabs{display:none!important}
body.momin-app-shell-active .dua-topbar{display:none!important}
body.momin-app-shell-active .mq-header{display:none!important}
body.momin-app-shell-active .quran-library.qv-shell .qv-head{display:none!important}
body.momin-app-shell-active .momin-mosque-design-v2 .wrap>header{display:none!important}
body.momin-app-shell-active .page-title{margin-top:8px}
body.momin-app-shell-active .page-title h1{display:none!important}
body.momin-app-shell-active .momin-mosque-design-v2 .title-row h1{display:none!important}
body.momin-app-shell-active .momin-support-card{background:var(--momin-card)!important;color:var(--momin-text)!important;border-color:var(--momin-gold-border)!important}
/* Preserve functional page actions while replacing only duplicated global chrome. */
body.momin-app-shell-active.dua-app-mode .dua-topbar{
 position:relative!important;top:auto!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;
 min-height:42px!important;margin:0 0 12px!important;padding:0!important;
 border:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
body.momin-app-shell-active.dua-app-mode .dua-topbar .dua-back,
body.momin-app-shell-active.dua-app-mode .dua-topbar h1{display:none!important}
body.momin-app-shell-active.dua-app-mode .dua-topbar .dua-top-actions{display:flex!important;justify-content:flex-end!important;min-width:0!important}
body.momin-app-shell-active.dua-app-mode .dua-bottom-nav{display:none!important}
body.momin-app-shell-active .quran-library.qv-shell .qv-top{
 position:relative!important;top:auto!important;margin:0!important;padding:0!important;
 border:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
body.momin-app-shell-active .quran-library.qv-shell .qv-head{
 height:auto!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;
 margin:0!important;padding:8px 0!important;
}
body.momin-app-shell-active .quran-library.qv-shell .qv-head h1{display:none!important}
body.momin-app-shell-active .momin-qibla-finder .mq-header{
 display:flex!important;justify-content:flex-end!important;align-items:center!important;
 margin:0!important;padding:8px 0!important;border:0!important;background:transparent!important;
}
body.momin-app-shell-active .momin-qibla-finder .mq-header>div:first-child{display:none!important}
body.momin-app-shell-active .momin-mosque-design-v2 .wrap>header{
 display:flex!important;justify-content:flex-end!important;align-items:center!important;
 height:auto!important;margin:0!important;padding:8px 0!important;border:0!important;background:transparent!important;box-shadow:none!important;
}
body.momin-app-shell-active .momin-mosque-design-v2 .wrap>header .brand{display:none!important}
body.momin-app-shell-active.momin-settings-v2-active .app>main>.top{display:none!important}
/* Shared theme tokens applied to legacy aliases used by existing page renderers. */
:root{--paper:var(--momin-card);--mint:var(--momin-gold-soft);--gold:var(--momin-gold);--gold-2:var(--momin-gold-bright);}
body.momin-app-shell-active .quran-library.qv-shell{
 --qv-bg:var(--momin-bg)!important;--qv-card:var(--momin-card)!important;
 --qv-card2:var(--momin-card-2)!important;--qv-line:var(--momin-border)!important;
 --qv-ink:var(--momin-text)!important;--qv-muted:var(--momin-muted)!important;
 --qv-gold:var(--momin-gold)!important;--qv-gold2:var(--momin-gold-bright)!important;
 --qv-gold-soft:var(--momin-gold-soft)!important;
 --qv-glass:color-mix(in srgb,var(--momin-card) 90%,transparent)!important;
 background:radial-gradient(ellipse at 50% -10%,var(--momin-gold-soft),transparent 46%),var(--momin-bg)!important;
 color:var(--momin-text)!important;
}
body.momin-app-shell-active.dua-app-mode .dua-page{
 --dua-bg:var(--momin-bg)!important;
 --dua-glow:radial-gradient(120% 50% at 50% -5%,var(--momin-gold-soft),transparent 70%)!important;
 --dua-card:var(--momin-card)!important;--dua-card2:var(--momin-card-2)!important;
 --dua-line:var(--momin-border)!important;--dua-ink:var(--momin-text)!important;
 --dua-muted:var(--momin-muted)!important;--dua-gold:var(--momin-gold)!important;
 --dua-gold2:var(--momin-gold-bright)!important;--dua-goldsoft:var(--momin-gold-soft)!important;
 --dua-glass:color-mix(in srgb,var(--momin-card) 90%,transparent)!important;
 --dua-field:color-mix(in srgb,var(--momin-card-2) 75%,transparent)!important;
 --dua-hill1:#5a4720!important;--dua-hill2:#241a0c!important;
 background:var(--momin-bg)!important;color:var(--momin-text)!important;
}
body.momin-app-shell-active .momin-qibla-finder .mq-dial-card,
body.momin-app-shell-active .momin-qibla-finder .mq-result,
body.momin-app-shell-active .momin-qibla-finder .mq-dl,
body.momin-app-shell-active .momin-qibla-finder .mq-form{
 background:var(--momin-card)!important;color:var(--momin-text)!important;border-color:var(--momin-border)!important;
}
body.momin-app-shell-active .momin-mosque-design-v2 .wrap{padding-bottom:12px!important}
body.momin-app-shell-active .momin-support-card{background:var(--momin-card)!important;color:var(--momin-text)!important;border-color:var(--momin-gold-border)!important}
body.momin-app-shell-active .momin-support-card a{color:var(--momin-gold-bright)!important}
`;
  function esc(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function routeNow(){
    try{if(typeof page!=="undefined"&&page)return String(page)}catch(_){}
    if(document.body.classList.contains("dua-app-mode"))return "duas";
    if(document.querySelector(".quran-reader"))return "quran";
    if(document.querySelector(".momin-qibla-finder"))return "qibla";
    if(document.querySelector(".momin-founder-route-v3"))return "founder";
    return "home";
  }
  function onLogin(){
    return /(?:^|\/)login(?:\.html)?\/?$/i.test(location.pathname)||
      routeNow()==="login"||document.body.classList.contains("momin-login-fullscreen");
  }
  function routeTitle(route){
    var names={
      home:"Home",prayers:"Prayers",quran:"Quran",journey:"Journey",
      duas:"Duas",tasbeeh:"Tasbeeh",qibla:"Qibla",mosques:"Mosques near me",
      calendar:"Islamic Calendar",settings:"Settings",founder:"About the Founder",
      giving:"Giving",inspiration:"Inspiration",profile:"Profile",notifications:"Notifications"
    };
    return names[route]||"Home";
  }
  function isTabRoute(route){return ["home","prayers","quran","journey"].indexOf(route)>=0}
  function icon(name){
    var paths={
      back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.5l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 12H1.5a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 4.5a2 2 0 1 1 2.8-2.8l.1.1a2 2 0 0 0 3.4-1.4V.3a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 21 8.2h.3a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.7 2.8Z"/>',
      home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
      prayers:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      quran:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5V22"/>',
      journey:'<path d="M4 6a3 3 0 1 1 3 3H5a3 3 0 1 0 0 6h9a3 3 0 1 1-3 3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||"")+'</svg>';
  }
  function userData(){
    try{
      var api=window.MominProfileSettingsV1;
      if(api&&typeof api.getUser==="function")return api.getUser()||{};
    }catch(_){}
    try{
      var raw=window.mominAuthSession&&(window.mominAuthSession.user||window.mominAuthSession);
      if(raw)return {name:raw.user_metadata&&(raw.user_metadata.full_name||raw.user_metadata.name)||raw.email||"",avatar:raw.user_metadata&&raw.user_metadata.avatar_url||raw.user_metadata&&raw.user_metadata.picture||""};
    }catch(_){}
    return {};
  }
  function hijriDate(){
    var el=document.getElementById("hijriTop");
    if(el&&el.textContent.trim())return el.textContent.trim();
    var other=document.getElementById("hijriBar");
    if(other&&other.textContent.trim())return other.textContent.trim();
    return "Hijri date";
  }
  function headerMarkup(route){
    var tab=isTabRoute(route),title=routeTitle(route),u=userData();
    if(route==="duas"){
      var duaTitle=document.querySelector(".dua-topbar h1");
      if(duaTitle&&duaTitle.textContent.trim())title=duaTitle.textContent.trim();
    }
    if(tab){
      var actions=route==="home"?
        '<div class="momin-shell-actions">'+
          '<button class="momin-shell-action" type="button" data-shell-action="notifications" aria-label="Notifications" title="Notifications">'+icon("bell")+'</button>'+
          '<button class="momin-shell-action" type="button" data-shell-action="settings" aria-label="Settings" title="Settings">'+icon("settings")+'</button>'+
          '<button class="momin-shell-avatar" type="button" data-shell-action="profile" aria-label="Open profile settings" title="Profile">'+
            (u.avatar?'<img src="'+esc(u.avatar)+'" alt="">':esc((u.name||"M").trim().charAt(0).toUpperCase()||"M"))+
          '</button>'+
        '</div>':'<span></span>';
      return '<div class="momin-shell-header__inner">'+
        '<span aria-hidden="true"></span><div class="momin-shell-header__title"><h1>'+esc(title)+'</h1><p>'+esc(hijriDate())+'</p></div>'+actions+
      '</div>';
    }
    return '<div class="momin-shell-header__inner">'+
      '<button class="momin-shell-back" type="button" data-shell-action="back" aria-label="Back">'+icon("back")+'</button>'+
      '<div class="momin-shell-header__title"><h1>'+esc(title)+'</h1></div>'+
      '<span class="momin-shell-logo" aria-label="MOMIN"><img src="./momin-mark.svg?v=islamic-logo-v3" alt="MOMIN"></span>'+
    '</div>';
  }
  function activeTab(route){return isTabRoute(route)?route:"home"}
  function navMarkup(route){
    var active=activeTab(route),tabs=[["home","Home"],["prayers","Prayers"],["quran","Quran"],["journey","Journey"]];
    return tabs.map(function(item){
      var selected=item[0]===active;
      return '<button type="button" data-shell-route="'+item[0]+'" aria-label="'+item[1]+'" aria-current="'+(selected?"page":"false")+'">'+
        '<span class="momin-shell-indicator" aria-hidden="true"></span>'+icon(item[0])+'<span>'+item[1]+'</span></button>';
    }).join("");
  }
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var style=document.createElement("style");style.id=STYLE_ID;style.textContent=css;document.head.appendChild(style);
  }
  function ensureComponents(){
    var layout=document.querySelector(".layout");if(!layout)return;
    var header=document.getElementById(HEADER_ID);
    if(!header){
      header=document.createElement("header");header.id=HEADER_ID;header.className="momin-shell-header";
      header.setAttribute("aria-label","MOMIN page header");layout.parentNode.insertBefore(header,layout);
    }
    var nav=document.getElementById(NAV_ID);
    if(!nav){
      nav=document.createElement("nav");nav.id=NAV_ID;nav.className="momin-shell-bottom-nav";
      nav.setAttribute("aria-label","Primary navigation");document.body.appendChild(nav);
    }
  }
  function ensureSpacer(){
    var view=document.getElementById("view");
    if(!view||routeNow()==="founder")return;
    var existing=document.getElementById(SPACER_ID);
    if(existing&&existing.parentNode===view&&view.lastElementChild===existing)return;
    if(existing&&existing.parentNode)existing.parentNode.removeChild(existing);
    var spacer=document.createElement("div");spacer.id=SPACER_ID;spacer.className="momin-shell-bottom-space";
    spacer.setAttribute("aria-hidden","true");view.appendChild(spacer);
  }
  function injectFounderStyle(frame){
    try{
      var doc=frame.contentDocument;if(!doc||doc.getElementById("momin-shared-founder-v1-style"))return;
      var style=doc.createElement("style");style.id="momin-shared-founder-v1-style";
      style.textContent='.app>.bar,.tabs{display:none!important}.app{padding-bottom:150px!important}.app>main{padding-top:8px!important}';
      doc.head.appendChild(style);
    }catch(_){}
  }
  function sync(){
    syncPending=false;
    if(onLogin()){
      document.body.classList.remove("momin-app-shell-active");
      var oldHeader=document.getElementById(HEADER_ID),oldNav=document.getElementById(NAV_ID);
      if(oldHeader)oldHeader.remove();if(oldNav)oldNav.remove();return;
    }
    ensureStyle();ensureComponents();
    document.body.classList.add("momin-app-shell-active");
    var route=routeNow(),header=document.getElementById(HEADER_ID),nav=document.getElementById(NAV_ID);
    if(!header||!nav)return;
    header.classList.toggle("is-sub",!isTabRoute(route));
    header.innerHTML=headerMarkup(route);
    nav.innerHTML=navMarkup(route);
    nav.querySelectorAll("[data-shell-route]").forEach(function(button){
      button.onclick=function(){navigate(button.getAttribute("data-shell-route"));};
    });
    header.querySelectorAll("[data-shell-action]").forEach(function(button){
      button.onclick=function(){headerAction(button.getAttribute("data-shell-action"));};
    });
    var view=document.getElementById("view");
    if(view){
      ensureSpacer();var frame=view.querySelector("#momin-founder-frame-v3");
      if(frame){
        if(frame.contentDocument&&frame.contentDocument.readyState==="complete")injectFounderStyle(frame);
        else frame.addEventListener("load",function(){injectFounderStyle(frame);},{once:true});
      }
    }
    document.body.classList.add("momin-shell-enter");
  }
  function scheduleSync(){if(syncPending)return;syncPending=true;window.requestAnimationFrame(sync)}
  function headerAction(action){
    if(action==="settings"){navigate("settings");return;}
    if(action==="notifications"){navigate("notifications");return;}
    if(action==="profile"){navigate("profile");return;}
    if(action==="back"){
      if(routeNow()==="duas"&&location.hash&&location.hash!=="#/duas"&&window.history&&window.history.length>1){window.history.back();return;}
      if(routeNow()==="quran"&&document.querySelector(".quran-reader")&&typeof window.returnToQuranLibrary==="function"){
        window.returnToQuranLibrary();scheduleSync();return;
      }
      if(routeStack.length){navigate(routeStack.pop(),true);return;}
      navigate("home",true);
    }
  }
  function navigate(target,fromBack){
    if(!target||typeof originalGo!=="function")return;
    var before=routeNow();
    if(before===target&&!(target==="quran"&&document.querySelector(".quran-reader")))return;
    if(before!==target){
      scrollPositions[before]=window.scrollY||document.documentElement.scrollTop||0;
      if(!fromBack)routeStack.push(before);
    }
    if(!fromBack&&before!==target&&window.history&&window.history.pushState){
      try{window.history.pushState({mominShellRoute:target},"",location.href)}catch(_){}
    }
    var result=originalGo.call(window,target);scheduleSync();
    var restore=scrollPositions[target]||0;
    window.setTimeout(function(){window.scrollTo({top:restore,behavior:"auto"});scheduleSync()},70);
    return result;
  }
  function wrapNavigation(){
    if(originalGo&&window.go===originalGo){
      window.go=function(target){return navigate(target,false)};
    }
    if(originalRender&&window.render===originalRender){
      window.render=function(){var result=originalRender.apply(this,arguments);scheduleSync();return result};
    }
  }
  function init(){
    ensureStyle();ensureComponents();wrapNavigation();
    if(window.history&&window.history.replaceState){
      try{
        if(!window.history.state||!window.history.state.mominShellRoute)
          window.history.replaceState({mominShellRoute:routeNow()},"",location.href);
      }catch(_){}
    }
    sync();
    var view=document.getElementById("view");
    if(view&&window.MutationObserver){
      observer=new MutationObserver(scheduleSync);observer.observe(view,{childList:true,subtree:true});
    }
    window.addEventListener("scroll",function(){
      var header=document.getElementById(HEADER_ID);
      if(header)header.classList.toggle("is-scrolled",(window.scrollY||0)>4);
    },{passive:true});
    window.addEventListener("popstate",function(event){
      var target=event.state&&event.state.mominShellRoute;
      if(!target||target===routeNow()||!originalGo)return;
      if(routeStack.length)routeStack.pop();
      originalGo.call(window,target);scheduleSync();
      window.setTimeout(function(){
        window.scrollTo({top:scrollPositions[target]||0,behavior:"auto"});
        scheduleSync();
      },70);
    });
    window.addEventListener("hashchange",scheduleSync);
    window.addEventListener("momin:auth-state-changed",scheduleSync);
  }
  window.MominSharedShellV1={
    initialized:true,sync:scheduleSync,navigate:navigate,currentRoute:routeNow,
    tokens:{
      dark:{background:"#0f0d0a",card:"#181510",card2:"#201b13",border:"#2f2819",goldBorder:"#5a4720",text:"#f3ecda",muted:"#a79f8a",gold:"#d9aa52",brightGold:"#e8c071",softGold:"#2b2312"},
      light:{background:"#f3efe5",card:"#fdfbf6",card2:"#f8f3e6",border:"#e6dfcc",goldBorder:"#d9c28a",text:"#1b1710",muted:"#7a7466",gold:"#a97a22",brightGold:"#d6a74a",softGold:"#efe2c2"}
    }
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();