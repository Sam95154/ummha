/* MOMIN Notifications Bridge V2
   Shared foreground fallback, authenticated Web Push subscriptions, and app/iframe routing.
   The server-side Supabase scheduler is responsible for reminders while MOMIN is closed. */
(function(){
  "use strict";
  var PRAYERS=[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","Asr"],["maghrib","Maghrib"],["isha","Isha"]];
  var ICONS={Fajr:"p0",Dhuhr:"p1",Asr:"p2",Maghrib:"p3",Isha:"p4"};
  var TIMER=null,AZAN=null;
  var PUSH_PUBLIC_KEY="BFp-52sdHBzvkbGvNBnUi7-mlwuohtdMMX59Y1Us34Duw-DI8w-KOYbYdkpqGR-0ZHOXQdIjCYSoatcjcy7P_nE";
  var pushRegistration=null,pushSetupPromise=null;
  var PUSH_ORIGIN="https://qzwqpiquvhpjwqgaxorp.supabase.co";
  var PUSH_APKEY="sb_publishable_SAHjdts8xtuQSXE_lPa1cw_V6J3PjQt";
  var PUSH_FUNCTION=PUSH_ORIGIN+"/functions/v1/momin-push-register";
  function b64urlBytes(value){var s=String(value).replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";var raw=atob(s),out=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
  function getDeviceKey(){var key=get("momin-device-key-v1","");if(!key){key=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():"momin-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);put("momin-device-key-v1",key)}return key}
  async function getPushSession(){var client=window.mominSupabase;if(!client||!client.auth)return null;var result=await client.auth.getSession();if(result.error||!result.data||!result.data.session)return null;return result.data.session}
  function currentPushPreferences(){return {on:get("noor-notifications","true")!=="false",lead:Math.max(0,Math.min(60,Number(get("noor-prayer-reminder-minutes","0"))||0)),pr:PRAYERS.map(function(p){return get("noor-notify-"+p[0],"true")!=="false"}),jumuah:get("noor-jumuah-reminders","true")!=="false",adhkar:get("noor-adhkar-reminders","false")==="true",dates:get("noor-islamic-event-reminders","false")==="true",announcements:get("momin-announcements-enabled","false")==="true",sound:get("noor-adhan-sound","system")}}
  function pushLocationData(){
    var rawLat=get("noor-latitude",""),rawLon=get("noor-longitude",""),lat=Number(rawLat),lon=Number(rawLon);
    var coords=rawLat!==""&&rawLon!==""&&Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180,method=3;
    try{if(typeof API_STORE!=="undefined"&&API_STORE&&API_STORE.method!==undefined)method=Number(API_STORE.method)||3}catch(_){}
    if(get("noor-method","")!=="")method=Number(get("noor-method","3"))||3;
    var timezone="";
    try{if(typeof livePrayer!=="undefined"&&livePrayer&&livePrayer.meta&&livePrayer.meta.timezone)timezone=String(livePrayer.meta.timezone)}catch(_){}
    if(!timezone){
      try{
        var cached=parseJSON(get("noor-prayer-cache","null"),null);
        if(cached&&cached.data&&cached.data.meta&&cached.data.meta.timezone)timezone=String(cached.data.meta.timezone);
      }catch(_){}
    }
    if(!timezone)timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Kolkata";
    return {latitude:coords?lat:null,longitude:coords?lon:null,city:get("noor-city",""),country:get("noor-country",""),timezone:timezone,calculation_method:method,asr_school:get("noor-asr-method","standard")==="hanafi"?1:0};
  }
  async function pushApi(action,extra){
    var session=await getPushSession();if(!session)throw new Error("Please sign in to MOMIN again before enabling background notifications.");
    var response=await fetch(PUSH_FUNCTION,{method:"POST",headers:{"Content-Type":"application/json","apikey":PUSH_APKEY,"Authorization":"Bearer "+session.access_token},body:JSON.stringify(Object.assign({action:action,device_key:getDeviceKey(),device_name:(/Android/i.test(navigator.userAgent||"")?"Android":"MOMIN device")+" · "+(navigator.userAgent||"").slice(0,140),preferences:currentPushPreferences()},extra||{}))});
    var data={};try{data=await response.json()}catch(_){}if(!response.ok)throw new Error(data.error||"Background notification service returned HTTP "+response.status);return {ok:true,data:data};
  }
  async function getPushWorker(){if(!("serviceWorker" in navigator)||!window.isSecureContext)throw new Error("Background notifications require a secure, supported browser.");if(!pushRegistration)pushRegistration=await navigator.serviceWorker.register("/momin-sw.js",{scope:"/"});await navigator.serviceWorker.ready;return pushRegistration}
  async function registerExistingPush(prefs){
    if(!("PushManager" in window)||!("Notification" in window))return false;
    var registration=await getPushWorker(),subscription=await registration.pushManager.getSubscription();if(!subscription)return false;
    var loc=pushLocationData(),result=await pushApi("register",{subscription:subscription.toJSON(),preferences:prefs||currentPushPreferences(),latitude:loc.latitude,longitude:loc.longitude,city:loc.city,country:loc.country,timezone:loc.timezone,calculation_method:loc.calculation_method,asr_school:loc.asr_school});
    put("momin-push-enabled","true");put("momin-push-last-sync",new Date().toISOString());return result.data;
  }
  async function enableBackgroundPush(prefs){
    if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){
      var permission=await window.MominNativePrayerAlarm.requestNotificationPermission();
      if(!permission.notificationsEnabled)throw new Error("Allow notifications for MOMIN in Android settings.");
      var activePrefs=prefs||currentPushPreferences();
      var hasPrayerAlarms=!Array.isArray(activePrefs.pr)||activePrefs.pr.some(Boolean);
      if(hasPrayerAlarms&&!permission.exactAlarmAllowed){
        await window.MominNativePrayerAlarm.openExactAlarmSettings();
        throw new Error("Enable Alarms & reminders for MOMIN, return to MOMIN, then save notifications again.");
      }
      var nativeResult=await window.MominNativePrayerAlarm.scheduleFromPreferences(activePrefs,true);
      put("momin-push-enabled","true");
      return {native:true,scheduled:nativeResult.scheduled||0};
    }
    if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window))throw new Error("This browser does not support background push. Install MOMIN as an app or use a supported browser.");
    var permission=Notification.permission;if(permission==="default")permission=await Notification.requestPermission();
    if(permission!=="granted")throw new Error(permission==="denied"?"Notifications are blocked for MOMIN. Allow them in your browser or phone settings.":"Notifications were not enabled.");
    if(pushSetupPromise)return await pushSetupPromise;
    pushSetupPromise=(async function(){
      var registration=await getPushWorker(),subscription=await registration.pushManager.getSubscription();
      if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64urlBytes(PUSH_PUBLIC_KEY)});
      var loc=pushLocationData(),result=await pushApi("register",{subscription:subscription.toJSON(),preferences:prefs||currentPushPreferences(),latitude:loc.latitude,longitude:loc.longitude,city:loc.city,country:loc.country,timezone:loc.timezone,calculation_method:loc.calculation_method,asr_school:loc.asr_school});
      put("momin-push-enabled","true");put("momin-push-last-sync",new Date().toISOString());return result.data;
    })();
    try{return await pushSetupPromise}finally{pushSetupPromise=null}
  }
  async function syncAnnouncementPreference(prefs){
    var session=await getPushSession(),client=window.mominSupabase;
    if(!session||!client||!client.from)return false;
    var result=await client.from("momin_profiles").update({
      announcements_enabled:!!(prefs||currentPushPreferences()).announcements,
      updated_at:new Date().toISOString()
    }).eq("user_id",session.user.id);
    if(result.error){console.warn("MOMIN announcement consent sync:",result.error.message);return false}
    return true;
  }
  async function syncPushPreferences(){
    var prefs=currentPushPreferences();
    var consent=await syncAnnouncementPreference(prefs);
    if(get("momin-push-enabled","false")!=="true")return consent;
    try{await registerExistingPush(prefs);return true}catch(error){console.warn("MOMIN background notification preference sync:",error);return false}
  }
  async function sendPushTest(){
    if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){
      var status=await window.MominNativePrayerAlarm.getStatus();
      if(!status.notificationsEnabled)throw new Error("Allow MOMIN notifications in Android settings.");
      await window.MominNativePrayerAlarm.testNotification();return true;
    }
    if(get("momin-push-enabled","false")!=="true")await enableBackgroundPush(currentPushPreferences());
    await pushApi("test",{});try{await refreshPushInbox()}catch(_){}return true;
  }
  async function refreshPushInbox(){
    var previous=readInbox(),readIds={};
    previous.forEach(function(item){if(item&&item.inboxId&&item.unread===false)readIds[String(item.inboxId)]=true;});
    var result=await pushApi("inbox",{}),items=(result.data&&result.data.items||[]).map(function(item){
      var at=item.sent_at||item.created_at||new Date().toISOString(),date=new Date(at),id=item.id||null;
      return {t:item.title||"MOMIN reminder",s:item.body||"",w:date.toLocaleDateString([],{month:"short",day:"numeric"}),i:item.icon_key||"b",at:at,route:item.route||"home",image:item.image_url||null,inboxId:id,unread:id?!readIds[String(id)]:true};
    });
    /* Admin announcements are persisted per user in Supabase and are also shown
       in the same MOMIN inbox, including when push permission is disabled. */
    try{
      var client=window.mominSupabase;
      if(client&&client.auth){
        var auth=await client.auth.getUser(),user=auth&&auth.data&&auth.data.user;
        if(user){
          var saved=await client.from("momin_user_notifications")
            .select("id,title,message,route,image_url,read_at,created_at")
            .eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
          if(!saved.error){
            (saved.data||[]).forEach(function(row){
              var at=row.created_at||new Date().toISOString(),id="admin:"+row.id;
              items.push({t:row.title||"MOMIN update",s:row.message||"",w:new Date(at).toLocaleDateString([],{month:"short",day:"numeric"}),
                i:"b",at:at,route:row.route||"home",image:row.image_url||null,inboxId:id,
                unread:!!row.read_at?false:!readIds[id],source:"admin"});
            });
          }else{console.warn("MOMIN admin inbox:",saved.error.message);}
        }
      }
    }catch(error){console.warn("MOMIN admin inbox:",error&&error.message||error);}
    items.sort(function(a,b){return new Date(b.at||0)-new Date(a.at||0);});
    items=items.slice(0,100);
    put("noor-notification-inbox",JSON.stringify(items));try{window.dispatchEvent(new CustomEvent("momin:notifications-updated"))}catch(_){}return items;
  }
  async function disableBackgroundPush(){
    if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){await window.MominNativePrayerAlarm.cancel();put("momin-push-enabled","false");return true;}
    try{var session=await getPushSession();if(session)await pushApi("unsubscribe",{});if("serviceWorker" in navigator){var reg=pushRegistration||await navigator.serviceWorker.getRegistration("/");if(reg){var sub=await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe()}}put("momin-push-enabled","false");return true}
    catch(error){console.warn("MOMIN push unsubscribe:",error);return false}
  }
  async function refreshPushSubscriptionIfNeeded(){
    if(get("momin-push-enabled","false")!=="true"||!("Notification" in window)||Notification.permission!=="granted")return false;
    try{
      var registration=await getPushWorker();
      var subscription=await registration.pushManager.getSubscription();
      if(subscription){
        await registerExistingPush(currentPushPreferences());
      }else{
        await enableBackgroundPush(currentPushPreferences());
      }
      return true;
    }catch(error){
      console.warn("MOMIN background push refresh:",error);
      return false;
    }
  }
  if(!window.MominNativePrayerAlarm&&"serviceWorker" in navigator&&window.isSecureContext){
    getPushWorker().then(function(){return refreshPushSubscriptionIfNeeded()})
      .catch(function(error){console.warn("MOMIN service worker:",error)});
    window.addEventListener("focus",refreshPushSubscriptionIfNeeded);
    document.addEventListener("visibilitychange",function(){if(!document.hidden)refreshPushSubscriptionIfNeeded()});
  }
  window.addEventListener("message",function(event){if(event.origin!==location.origin||!event.data||event.data.type!=="MOMIN_PUSH_OPEN")return;var route=String(event.data.route||"home");if(["home","prayers","quran","duas","calendar","notifications","settings","journey","giving","complaints"].indexOf(route)<0)route="home";navigate(route)});

  function get(key,fallback){try{var v=localStorage.getItem(key);return v===null?fallback:v}catch(_){return fallback}}
  function put(key,value){try{localStorage.setItem(key,String(value));return true}catch(_){return false}}
  function parseJSON(value,fallback){try{return JSON.parse(value)}catch(_){return fallback}}
  function toast(message){try{if(typeof window.toast==="function")window.toast(message)}catch(_){}}
  function prayerData(){
    try{if(typeof livePrayer!=="undefined"&&livePrayer&&livePrayer.timings)return {timings:livePrayer.timings,timezone:livePrayer.meta&&livePrayer.meta.timezone}}catch(_){}
    try{if(window.livePrayer&&window.livePrayer.timings)return {timings:window.livePrayer.timings,timezone:window.livePrayer.meta&&window.livePrayer.meta.timezone}}catch(_){}
    var cached=parseJSON(get("noor-prayer-cache","null"),null);
    if(cached&&cached.data&&cached.data.timings)return {timings:cached.data.timings,timezone:cached.data.meta&&cached.data.meta.timezone,hijri:cached.data.date&&cached.data.date.hijri};
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
      dates:get("noor-islamic-event-reminders","false")==="true",
      announcements:get("momin-announcements-enabled","false")==="true"
    };
  }
  function normalizePrefs(input){
    var base=readPrefs(),p=input&&typeof input==="object"?input:{};
    base.on=p.on===undefined?base.on:!!p.on;
    base.lead=Math.max(0,Math.min(60,Number(p.lead===undefined?base.lead:p.lead)||0));
    base.pr=Array.isArray(p.pr)?PRAYERS.map(function(_,i){return !!p.pr[i]}):base.pr;
    ["jumuah","adhkar","dates","announcements"].forEach(function(k){if(p[k]!==undefined)base[k]=!!p[k]});
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
    put("momin-announcements-enabled",p.announcements?"true":"false");
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
  function isFriday(date,timezone){
    try{return new Intl.DateTimeFormat("en-US",{timeZone:timezone||undefined,weekday:"short"}).format(date)==="Fri"}
    catch(_){return date.getDay()===5}
  }
  function checkUpdateReminders(prefs,data,now,keyDay,nowMin){
    /* Jumu'ah: use today's real Dhuhr time; alert once in the hour before it. */
    if(prefs.jumuah&&isFriday(now,data.timezone)){
      var dhuhr=minutes(data.timings.Dhuhr||data.timings.dhuhr);
      if(dhuhr!==null){
        var target=(dhuhr-60+1440)%1440,elapsed=(nowMin-target+1440)%1440;
        var key="noor-jumuah-reminder-sent-"+keyDay;
        if(nowMin<=dhuhr&&elapsed<=60&&get(key,"")!=="true"){
          if(showNotification("MOMIN · Jumu'ah reminder","Friday prayer is approaching. Check your local mosque's khutbah and prayer time.","momin-jumuah-"+keyDay,"cal"))put(key,"true");
        }
      }
    }
    /* Morning and evening adhkar: a gentle local-time prompt, once per window. */
    if(prefs.adhkar){
      [{name:"Morning",at:7,from:7,until:12},{name:"Evening",at:17,from:17,until:21}].forEach(function(slot){
        var key="noor-adhkar-reminder-sent-"+keyDay+"-"+slot.name.toLowerCase();
        if(nowMin>=slot.from*60&&nowMin<slot.until*60&&get(key,"")!=="true"){
          if(showNotification("MOMIN · "+slot.name+" adhkar","Take a quiet moment for your morning and evening remembrance.","momin-adhkar-"+keyDay+"-"+slot.name.toLowerCase(),"mo"))put(key,"true");
        }
      });
    }
    /* Hijri occasions follow the returned local calendar date; observance can vary by moon sighting. */
    if(prefs.dates&&data.hijri&&data.hijri.month){
      var day=Number(data.hijri.day),month=Number(data.hijri.month.number),year=String(data.hijri.year||"");
      var occasions={
        "1-1":"Islamic New Year",
        "1-10":"Day of Ashura",
        "9-1":"Ramadan begins",
        "10-1":"Eid al-Fitr",
        "12-9":"Day of Arafah",
        "12-10":"Eid al-Adha"
      };
      var eventName=occasions[month+"-"+day],eventKey="noor-islamic-date-reminder-sent-"+year+"-"+month+"-"+day;
      if(eventName&&nowMin>=7*60&&get(eventKey,"")!=="true"){
        if(showNotification("MOMIN · Islamic date",eventName+" — dates may vary by local moon sighting.","momin-islamic-date-"+year+"-"+month+"-"+day,"bk"))put(eventKey,"true");
      }
    }
  }
  function checkPrayerReminders(){
    var prefs=readPrefs();
    if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){if(prefs.on)window.MominNativePrayerAlarm.scheduleFromPreferences(prefs).catch(function(e){console.warn("MOMIN native prayer alarm:",e)});else window.MominNativePrayerAlarm.cancel().catch(function(e){console.warn("MOMIN native prayer alarm cancel:",e)});return;}
    if(!prefs.on||!("Notification" in window)||Notification.permission!=="granted")return;
    var data=prayerData();if(!data||!data.timings)return;
    var now=new Date(),keyDay=dayKey(now,data.timezone),part=timeParts(now,data.timezone),nowMin=part.hour*60+part.minute;
    if(get("momin-push-enabled","false")!=="true"){
      PRAYERS.forEach(function(pair,i){
      if(!prefs.pr[i])return;
      var prayerMin=minutes(data.timings[pair[1]]||data.timings[pair[1].toLowerCase()]);
      if(prayerMin===null)return;
      var reminderKey="noor-prayer-reminder-sent-"+keyDay+"-"+pair[0];
      var timeKey="noor-prayer-time-sent-"+keyDay+"-"+pair[0];
      if(prefs.lead>0){
        var reminderTarget=(prayerMin-prefs.lead+1440)%1440;
        var reminderElapsed=(nowMin-reminderTarget+1440)%1440;
        if(reminderElapsed<=1&&get(reminderKey,"")!=="true"){
          var reminderBody=pair[1]+" is coming up in "+prefs.lead+" minutes.";
          if(showNotification("MOMIN · "+pair[1]+" reminder",reminderBody,"momin-prayer-reminder-"+keyDay+"-"+pair[0],ICONS[pair[1]]))put(reminderKey,"true");
        }
      }
      var prayerElapsed=(nowMin-prayerMin+1440)%1440;
      if(prayerElapsed<=1&&get(timeKey,"")!=="true"){
        var prayerBody="It is time for "+pair[1]+".";
        if(!showNotification("MOMIN · "+pair[1]+" time",prayerBody,"momin-prayer-time-"+keyDay+"-"+pair[0],ICONS[pair[1]]))return;
        put(timeKey,"true");
        var sound=get("noor-adhan-sound","azan");
        if(sound==="azan")playAzan();
        else if(sound==="chime")playChime();
      }
      });
      checkUpdateReminders(prefs,data,now,keyDay,nowMin);
    }
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
    return {prefs:readPrefs(),prayerTimes:data&&data.timings||null,inbox:readInbox(),permission:("Notification" in window)?Notification.permission:"unsupported",pushEnabled:get("momin-push-enabled","false")==="true",location:get("noor-city","")};
  }
  window.MominNotificationsBridgeV1={
    snapshot:snapshot,
    savePrefs:function(prefs){
      var saved=savePrefs(prefs);
      if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){
        if(saved.on)window.MominNativePrayerAlarm.scheduleFromPreferences(saved).catch(function(error){console.warn("MOMIN Android notification preferences:",error)});
        else window.MominNativePrayerAlarm.cancel().catch(function(error){console.warn("MOMIN Android notification cancel:",error)});
      }else syncPushPreferences();
      return saved;
    },
    requestPermission:requestPermission,
    enableBackgroundPush:enableBackgroundPush,
    syncPushPreferences:syncPushPreferences,
    sendPushTest:sendPushTest,
    refreshInbox:refreshPushInbox,
    markInboxRead:function(id){
      var key=String(id||""),items=readInbox(),found=false;
      items=items.map(function(item){
        if(String(item&&item.inboxId||"")===key){
          item.unread=false;item.read=true;found=true;
        }
        return item;
      });
      if(found){writeInbox(items);try{window.dispatchEvent(new CustomEvent("momin:notifications-updated"))}catch(_){}}
      if(key.indexOf("admin:")===0&&window.mominSupabase){
        var rowId=key.slice(6);
        return window.mominSupabase.auth.getUser().then(function(auth){
          var user=auth&&auth.data&&auth.data.user;
          if(!user)return found;
          return window.mominSupabase.from("momin_user_notifications")
            .update({read_at:new Date().toISOString()}).eq("id",rowId).eq("user_id",user.id)
            .then(function(result){if(result.error)console.warn("MOMIN notification read state:",result.error.message);return found;});
        });
      }
      return Promise.resolve(found);
    },
    disableBackgroundPush:disableBackgroundPush,
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
    var master=document.getElementById("settingsPrayerNotificationsV1"),prefs=readPrefs();
    if(master)prefs.on=!!master.checked;
    PRAYERS.forEach(function(p,i){var el=document.getElementById("settingsNotify-"+p[0]);if(el)prefs.pr[i]=!!el.checked});
    var lead=document.getElementById("settingsReminderMinutesV1");if(lead)prefs.lead=Number(lead.value)||0;
    var sound=document.getElementById("settingsAdhanSound");if(sound){put("noor-adhan-sound",sound.value);prefs.sound=sound.value;}
    var festivals=document.getElementById("settingsFestivalNotificationsV1");if(festivals)prefs.dates=festivals.getAttribute("aria-checked")==="true";
    var admin=document.getElementById("settingsAdminNotificationsV1");if(admin)prefs.announcements=admin.getAttribute("aria-checked")==="true";
    savePrefs(prefs);
    if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){
      if(prefs.on){
        try{await enableBackgroundPush(prefs);toast("Prayer alerts and Makkah Azan alarms are enabled. Azan plays at the actual prayer time.");}
        catch(error){toast(error.message||"Android prayer alarms could not be enabled.");}
      }else{await disableBackgroundPush();toast("Prayer notifications and Azan alarms are paused.");}
      checkPrayerReminders();return true;
    }
    var permission="unsupported";
    if(prefs.on)permission=await requestPermission();
    if(prefs.on&&permission==="granted"){
      try{await enableBackgroundPush(prefs);toast("Background notifications are enabled for this device.");}
      catch(error){toast("Preferences saved. Background push setup needs attention: "+error.message);}
    }else if(prefs.on){toast("Preferences saved. Allow notifications for MOMIN in device settings.");}
    else{await disableBackgroundPush();toast("Notifications paused for this device.");}
    checkPrayerReminders();return true;
  };
  window.testMominNotificationV1=async function(){
    try{await sendPushTest();toast("A background push test was sent to this device.");return true;}
    catch(error){toast("Background notification test failed: "+error.message);return false;}
  };
  window.previewMominAzanV1=function(){
    if(window.MominNativePrayerAlarm&&window.MominNativePrayerAlarm.isNative){
      window.MominNativePrayerAlarm.previewAzan().then(function(){toast("Makkah Azan preview started. Use Stop Azan in its notification to stop playback.")})
        .catch(function(error){toast("Azan preview failed: "+(error.message||"Android audio could not start."))});
      return;
    }
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
    return '<div class="momin-notifications-frame-shell"><iframe class="momin-notifications-frame" title="MOMIN notifications" src="./notifications.html?v=20261103-device-responsive-v1"></iframe></div>';
  };
  try{
    var query=new URL(location.href),route=query.searchParams.get("mominPushRoute");
    if(route&&["home","prayers","quran","duas","calendar","notifications","settings","journey","giving","complaints"].indexOf(route)>=0){
      query.searchParams.delete("mominPushRoute");
      history.replaceState(history.state,"",query.pathname+query.search+query.hash);
      window.setTimeout(function(){navigate(route)},450);
    }
    if(window.page==="notifications"&&typeof window.render==="function")window.render();
  }catch(_){}
})();