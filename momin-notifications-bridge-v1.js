/* MOMIN Notifications Bridge V1
   Shared foreground notification scheduler and app/iframe bridge.
   Background delivery is intentionally not claimed: browsers may suspend pages. */
(function(){
  "use strict";
  var PRAYERS=[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","Asr"],["maghrib","Maghrib"],["isha","Isha"]];
  var ICONS={Fajr:"p0",Dhuhr:"p1",Asr:"p2",Maghrib:"p3",Isha:"p4"};
  var TIMER=null,AZAN=null;
  function get(key,fallback){try{var v=localStorage.getItem(key);return v===null?fallback:v}catch(_){return fallback}}
  function put(key,value){try{localStorage.setItem(key,String(value));return true}catch(_){return false}}
  function parseJSON(value,fallback){try{return JSON.parse(value)}catch(_){return fallback}}
  function toast(message){try{if(typeof window.toast==="function")window.toast(message)}catch(_){}}
  function prayerData(){
    try{if(typeof livePrayer!=="undefined"&&livePrayer&&livePrayer.timings)return {timings:livePrayer.timings,timezone:livePrayer.meta&&livePrayer.meta.timezone}}catch(_){}
    try{if(window.livePrayer&&window.livePrayer.timings)return {timings:window.livePrayer.timings,timezone:window.livePrayer.meta&&window.livePrayer.meta.timezone}}catch(_){}
    var cached=parseJSON(get("noor-prayer-cache","null"),null);
    if(cached&&cached.data&&cached.data.timings)return {timings:cached.data.timings,timezone:cached.data.meta&&cached.data.meta.timezone};
    return null;
  }
  function readPrefs(){
    var master=get("noor-notifications","true")!=="false";
    return {
      on:master,
      lead:Math.max(0,Math.min(60,Number(get("noor-prayer-reminder-minutes","0"))||0)),
      pr:PRAYERS.map(function(p){return get("noor-notify-"+p[0],master?"true":"false")!=="false"}),
      jumuah:get("noor-jumuah-reminders","true")!=="false",
      adhkar:get("noor-adhkar-reminders","false")==="true",
      dates:get("noor-islamic-event-reminders","true")!=="false"
    };
  }
  function normalizePrefs(input){
    var base=readPrefs(),p=input&&typeof input==="object"?input:{};
    base.on=p.on===undefined?base.on:!!p.on;
    base.lead=Math.max(0,Math.min(60,Number(p.lead===undefined?base.lead:p.lead)||0));
    base.pr=Array.isArray(p.pr)?PRAYERS.map(function(_,i){return !!p.pr[i]}):base.pr;
    ["jumuah","adhkar","dates"].forEach(function(k){if(p[k]!==undefined)base[k]=!!p[k]});
    return base;
  }
  function savePrefs(input){
    var p=normalizePrefs(input);
    put("noor-notifications",p.on?"true":"false");
    PRAYERS.forEach(function(pair,i){put("noor-notify-"+pair[0],p.pr[i]?"true":"false")});
    put("noor-prayer-reminder-minutes",p.lead);
    put("noor-jumuah-reminders",p.jumuah?"true":"false");
    put("noor-adhkar-reminders",p.adhkar?"true":"false");
    put("noor-islamic-event-reminders",p.dates?"true":"false");
    return p;
  }
  function dayKey(date,timezone){
    try{
      var parts={},fmt=new Intl.DateTimeFormat("en-CA",{timeZone:timezone||undefined,year:"numeric",month:"2-digit",day:"2-digit"});
      fmt.formatToParts(date).forEach(function(x){parts[x.type]=x.value});
      return parts.year+"-"+parts.month+"-"+parts.day;
    }catch(_){
      return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
    }
  }
  function timeParts(date,timezone){
    var parts={};
    try{
      new Intl.DateTimeFormat("en-GB",{timeZone:timezone||undefined,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).forEach(function(x){parts[x.type]=x.value});
      return {hour:Number(parts.hour),minute:Number(parts.minute)};
    }catch(_){return {hour:date.getHours(),minute:date.getMinutes()}}
  }
  function minutes(value){
    var m=String(value||"").match(/(\d{1,2}):(\d{2})/);
    return m?Number(m[1])*60+Number(m[2]):null;
  }
  function displayDay(iso){
    try{return new Date(iso).toLocaleDateString([],{month:"short",day:"numeric"})}catch(_){return "Today"}
  }
  function readInbox(){
    var value=parseJSON(get("noor-notification-inbox","[]"),[]);
    return Array.isArray(value)?value:[];
  }
  function writeInbox(items){put("noor-notification-inbox",JSON.stringify(items.slice(0,100)))}
  function record(title,body,icon){
    var now=new Date(),items=readInbox();
    items.unshift({t:String(title||"MOMIN update"),s:String(body||""),w:"Today",i:icon||"b",at:now.toISOString()});
    items=items.slice(0,100);
    writeInbox(items);
    try{window.dispatchEvent(new CustomEvent("momin:notifications-updated"))}catch(_){}
    return items;
  }
  function requestPermission(){
    if(!("Notification" in window))return Promise.resolve("unsupported");
    if(Notification.permission!=="default")return Promise.resolve(Notification.permission);
    try{return Notification.requestPermission()}catch(_){return Promise.resolve("denied")}
  }
  function showNotification(title,body,tag,icon){
    if(!("Notification" in window)||Notification.permission!=="granted")return false;
    try{
      new Notification(title,{body:body,tag:tag||("momin-"+Date.now()),icon:"/momin-mark.svg",badge:"/momin-mark.svg"});
      record(title,body,icon||"b");
      return true;
    }catch(_){return false}
  }
  function playAzan(){
    try{
      if(!AZAN){AZAN=new Audio("./makkah-azan-notification.mp3?v=1");AZAN.preload="none"}
      try{AZAN.pause();AZAN.currentTime=0}catch(_){}
      var promise=AZAN.play();
      if(promise&&promise.catch)promise.catch(function(){});
      return true;
    }catch(_){return false}
  }
  function playChime(){
    try{
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      var ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(880,ctx.currentTime);
      gain.gain.setValueAtTime(.0001,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.055,ctx.currentTime+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.72);
      osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.74);
      window.setTimeout(function(){try{ctx.close()}catch(_){}},950);
    }catch(_){}
  }
  function checkPrayerReminders(){
    var prefs=readPrefs();
    if(!prefs.on||!("Notification" in window)||Notification.permission!=="granted")return;
    var data=prayerData();if(!data||!data.timings)return;
    var now=new Date(),keyDay=dayKey(now,data.timezone),part=timeParts(now,data.timezone),nowMin=part.hour*60+part.minute;
    PRAYERS.forEach(function(pair,i){
      if(!prefs.pr[i])return;
      var prayerMin=minutes(data.timings[pair[1]]||data.timings[pair[1].toLowerCase()]);
      if(prayerMin===null)return;
      var target=(prayerMin-prefs.lead+1440)%1440;
      var elapsed=(nowMin-target+1440)%1440;
      var sentKey="noor-prayer-reminder-sent-"+keyDay+"-"+pair[0];
      if(elapsed>1||get(sentKey,"")==="true")return;
      var body=prefs.lead?pair[1]+" is coming up in "+prefs.lead+" minutes.":"It is time for "+pair[1]+".";
      if(!showNotification(prefs.lead?"MOMIN · "+pair[1]+" reminder":"MOMIN · "+pair[1]+" time",body,"momin-prayer-"+keyDay+"-"+pair[0],ICONS[pair[1]]))return;
      put(sentKey,"true");
      var sound=get("noor-adhan-sound","azan");
      if(sound==="azan")playAzan();
      else if(sound==="chime")playChime();
    });
  }
  function currentRoute(){
    try{return window.MominSharedShellV1&&window.MominSharedShellV1.currentRoute?window.MominSharedShellV1.currentRoute():""}catch(_){return ""}
  }
  function navigate(target){
    if(window.MominSharedShellV1&&typeof window.MominSharedShellV1.navigate==="function"){
      window.MominSharedShellV1.navigate(target);return true;
    }
    if(typeof window.go==="function"){window.go(target);return true}
    return false;
  }
  function back(){
    try{
      if(window.history&&window.history.state&&window.history.state.mominShellRoute&&window.history.length>1){
        window.history.back();return true;
      }
    }catch(_){}
    if(window.MominSharedShellV1&&typeof window.MominSharedShellV1.navigate==="function"){
      window.MominSharedShellV1.navigate("home",true);return true;
    }
    return navigate("home");
  }
  function snapshot(){
    var data=prayerData();
    return {prefs:readPrefs(),prayerTimes:data&&data.timings||null,inbox:readInbox(),permission:("Notification" in window)?Notification.permission:"unsupported",location:get("noor-city","")};
  }
  window.MominNotificationsBridgeV1={
    snapshot:snapshot,
    savePrefs:savePrefs,
    requestPermission:requestPermission,
    sendTest:function(){
      return requestPermission().then(function(permission){
        if(permission!=="granted")return false;
        var ok=showNotification("MOMIN notification test","This is a test reminder from MOMIN.","momin-test-"+Date.now(),"b");
        return ok;
      });
    },
    record:record,
    clearInbox:function(){writeInbox([]);try{window.dispatchEvent(new CustomEvent("momin:notifications-updated"))}catch(_){}},
    restoreInbox:function(items){writeInbox(Array.isArray(items)?items:[]);try{window.dispatchEvent(new CustomEvent("momin:notifications-updated"))}catch(_){}},
    back:back,
    navigate:navigate,
    currentRoute:currentRoute
  };

  window.saveNotificationPrefsV1=async function(){
    var master=document.getElementById("settingsPrayerNotificationsV1");
    var prefs=readPrefs();
    if(master)prefs.on=!!master.checked;
    PRAYERS.forEach(function(p,i){var el=document.getElementById("settingsNotify-"+p[0]);if(el)prefs.pr[i]=!!el.checked});
    var lead=document.getElementById("settingsReminderMinutesV1");if(lead)prefs.lead=Number(lead.value)||0;
    savePrefs(prefs);
    var permission="unsupported";
    if(prefs.on)permission=await requestPermission();
    if(prefs.on&&permission!=="granted")toast("Preferences saved. Allow browser notifications to receive prayer alerts.");
    else toast("Notification preferences saved.");
    checkPrayerReminders();
    return true;
  };
  window.testMominNotificationV1=async function(){
    var permission=await requestPermission();
    if(permission!=="granted"){toast("Notifications are not permitted. Allow them for this site in browser settings.");return false}
    var ok=showNotification("MOMIN notification test","This is a test reminder from MOMIN.","momin-settings-test-"+Date.now(),"b");
    if(!ok){toast("The browser could not display a test notification.");return false}
    var sound=(document.getElementById("settingsAdhanSound")||{}).value||get("noor-adhan-sound","azan");
    if(sound==="azan")playAzan();else if(sound==="chime")playChime();
    toast("Test notification sent.");return true;
  };
  window.previewMominAzanV1=function(){
    if(playAzan())toast("Makkah Azan preview started. Keep MOMIN open while it plays.");
    else toast("Azan audio could not start. Check browser audio permissions.");
  };

  if(TIMER)window.clearInterval(TIMER);
  TIMER=window.setInterval(checkPrayerReminders,30000);
  window.addEventListener("focus",checkPrayerReminders);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)checkPrayerReminders()});

  /* Keep the uploaded, standalone notification design inside the authenticated MOMIN shell. */
  var styles=document.createElement("style");
  styles.id="momin-notifications-frame-v1-style";
  styles.textContent=
    'body:has(.momin-notifications-frame-shell){overflow:hidden!important}'+
    'body:has(.momin-notifications-frame-shell) .layout{display:block!important;grid-template-columns:1fr!important;width:100%;height:100dvh;min-height:100dvh;padding-bottom:0!important;overflow:hidden}'+
    'body:has(.momin-notifications-frame-shell) .sidebar,body:has(.momin-notifications-frame-shell) .top,body:has(.momin-notifications-frame-shell) .mobilebar{display:none!important}'+
    'body:has(.momin-notifications-frame-shell) main{width:100%;height:100dvh;min-height:0;overflow:hidden}'+
    'body:has(.momin-notifications-frame-shell) .content{max-width:none!important;width:100%;height:100%;min-height:0;margin:0;padding:0!important;overflow:hidden}'+
    'body:has(.momin-notifications-frame-shell) #view{width:100%;height:100%;min-height:0;margin:0;padding:0}'+
    '.momin-notifications-frame-shell{display:block;width:100%;height:100dvh;min-height:0;overflow:hidden;background:#0c0a07}'+
    '.momin-notifications-frame{display:block;width:100%;height:100%;min-height:100dvh;border:0;background:#0c0a07}'+
    '@supports not selector(body:has(.momin-notifications-frame-shell)){.momin-notifications-frame-shell{height:100vh}.momin-notifications-frame{height:100vh;min-height:100vh}}';
  document.head.appendChild(styles);
  window.notificationsPage=function(){
    return '<div class="momin-notifications-frame-shell"><iframe class="momin-notifications-frame" title="MOMIN notifications" src="./notifications.html?v=20261101-notifications-v1"></iframe></div>';
  };
  try{if(window.page==="notifications"&&typeof window.render==="function")window.render()}catch(_){}
})();