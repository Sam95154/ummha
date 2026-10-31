/* Noor daily companion refinements: privacy-first Journey, live location prayer times,
   Google Maps mosque search, and selectable Quran translations. */
var primaryTabsV5=[['home','⌂','Home'],['prayers','◷','Prayers'],['quran','▤','Quran'],['journey','◉','Journey']];
var moreTabsV5=[['qibla','◎','Qibla'],['duas','♡','Duas'],['mosques','⌖','Mosques'],['giving','♧','Giving'],['tasbeeh','◉','Tasbeeh'],['inspiration','✧','Inspiration'],['calendar','▦','Calendar'],['settings','⚙','Settings']];
var pageNamesV5={home:'Home',prayers:'Prayers',quran:'Quran',journey:'My Journey',qibla:'Qibla',duas:'Duas',mosques:'Mosques',giving:'Giving',tasbeeh:'Tasbih',calendar:'Calendar',inspiration:'Inspiration',settings:'Settings',profile:'Profile',notifications:'Notifications'};
/* Restore GPS coordinates saved by the location button. */
(function restoreSavedCoordinatesV5(){
  try {
    var savedLat = localStorage.getItem('noor-latitude');
    var savedLon = localStorage.getItem('noor-longitude');
    if (savedLat !== null && savedLon !== null && savedLat.trim() !== '' && savedLon.trim() !== '') {
      var lat = Number(savedLat), lon = Number(savedLon);
      if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        API_STORE.latitude = lat;
        API_STORE.longitude = lon;
        API_STORE.city = localStorage.getItem('noor-city') || 'My location';
        API_STORE.country = localStorage.getItem('noor-country') || '';
      }
    }
  } catch (_) {}
})();
var quranTranslationsV5=[
 {id:'en.sahih',label:'English — Saheeh International',language:'en',dir:'ltr'},
 {id:'en.yusufali',label:'English — Yusuf Ali',language:'en',dir:'ltr'},
 {id:'en.pickthall',label:'English — Pickthall',language:'en',dir:'ltr'},
 {id:'en.asad',label:'English — Muhammad Asad',language:'en',dir:'ltr'},
 {id:'ur.jalandhry',label:'Urdu — Fateh Muhammad Jalandhry',language:'ur',dir:'rtl'},
 {id:'ur.kanzuliman',label:'Urdu — Ahmed Raza Khan',language:'ur',dir:'rtl'},
 {id:'hi.hindi',label:'Hindi — Suhel Farooq Khan',language:'hi',dir:'ltr'},
 {id:'ml.abdulhameed',label:'Malayalam — Abdul Hameed & Parappoor',language:'ml',dir:'ltr'},
 {id:'ta.tamil',label:'Tamil — Jan Turst Foundation',language:'ta',dir:'ltr'},
 {id:'bn.bengali',label:'Bengali — Muhiuddin Khan',language:'bn',dir:'ltr'},
 {id:'ms.basmeih',label:'Malay — Abdullah Basmeih',language:'ms',dir:'ltr'},
 {id:'id.indonesian',label:'Indonesian',language:'id',dir:'ltr'},
 {id:'fr.hamidullah',label:'French — Muhammad Hamidullah',language:'fr',dir:'ltr'},
 {id:'es.cortes',label:'Spanish — Julio Cortes',language:'es',dir:'ltr'},
 {id:'tr.diyanet',label:'Turkish — Diyanet İşleri',language:'tr',dir:'ltr'},
 {id:'de.bubenheim',label:'German — Bubenheim & Elyas',language:'de',dir:'ltr'},
 {id:'fa.makarem',label:'Persian — Naser Makarem Shirazi',language:'fa',dir:'rtl'},
 {id:'ru.kuliev',label:'Russian — Elmir Kuliev',language:'ru',dir:'ltr'},
 {id:'zh.jian',label:'Chinese — Ma Jian',language:'zh',dir:'ltr'},
 {id:'ja.japanese',label:'Japanese',language:'ja',dir:'ltr'}
];
function escapeAppHtmlV5(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function appDayKeyV5(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
var savedLatV5=localStorage.getItem('noor-latitude'),savedLngV5=localStorage.getItem('noor-longitude');
API_STORE.latitude=savedLatV5!==null&&savedLatV5!==''?Number(savedLatV5):null;
API_STORE.longitude=savedLngV5!==null&&savedLngV5!==''?Number(savedLngV5):null;
if(API_STORE.latitude!==null&&Number.isFinite(API_STORE.latitude)&&API_STORE.longitude!==null&&Number.isFinite(API_STORE.longitude)){API_STORE.city=localStorage.getItem('noor-city')||API_STORE.city||'';API_STORE.country=localStorage.getItem('noor-country')||''}else{API_STORE.latitude=null;API_STORE.longitude=null}
if(localStorage.getItem('noor-prayer-date')&&localStorage.getItem('noor-prayer-date')!==appDayKeyV5()){done={};localStorage.setItem('noor-prayers','{}')}
if(!localStorage.getItem('noor-prayer-date'))localStorage.setItem('noor-prayer-date',appDayKeyV5());
if(localStorage.getItem('noor-tasbih-date')&&localStorage.getItem('noor-tasbih-date')!==appDayKeyV5()){tasbih=0;localStorage.setItem('noor-tasbih','0')}
if(!localStorage.getItem('noor-tasbih-date'))localStorage.setItem('noor-tasbih-date',appDayKeyV5());
function currentLocationLabelV5(){var city=String(API_STORE.city||'').trim(),country=String(API_STORE.country||'').trim(),generic=/^(my location|current location|locating city[.…]*|choose your location)$/i.test(city);var coords=API_STORE.latitude!==null&&Number.isFinite(Number(API_STORE.latitude))&&API_STORE.longitude!==null&&Number.isFinite(Number(API_STORE.longitude));if(coords){if(!generic&&city&&country)return city+', '+country;if(!generic&&city)return city;return 'Current location (GPS)'}return [city,country].filter(Boolean).join(', ')||'Choose your location'}

function setLocationStatusV5(message){var el=document.getElementById('locationStatusV5');if(el)el.textContent=message}
async function reverseGeocodeLocationV5(lat,lon){
  var url='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lon)+'&localityLanguage=en';
  function clean(value){return String(value||'').trim()}
  function chooseBigCity(data){
    var admin=data.localityInfo&&Array.isArray(data.localityInfo.administrative)?data.localityInfo.administrative:[];
    var info=data.localityInfo&&Array.isArray(data.localityInfo.informative)?data.localityInfo.informative:[];
    var area=admin.find(function(x){return /city|town|village|municipality|district|county|locality|administrative area level 2/i.test(String(x.description||x.name||''))});
    var city=clean(data.city)||clean(data.locality)||clean(data.localityName)||clean(data.town)||clean(data.village)||clean(data.municipality)||clean(area&&area.name);
    if(!city){
      var candidate=admin.find(function(x){return Number(x.adminLevel)>=6&&Number(x.adminLevel)<=8})||admin.find(function(x){return /city|town|village|municipality|district|county|locality/i.test(String(x.description||''))});
      city=clean(candidate&&candidate.name);
    }
    if(!city&&info.length)city=clean(info.find(function(x){return /city|town|village|municipality|district|county|locality/i.test(String(x.description||x.name||''))})?.name);
    var country=clean(data.countryName);
    return city&&country?{city:city,country:country}:null;
  }
  try{
    var data=await getJSON(url),found=chooseBigCity(data);
    if(found)return found;
  }catch(_){}
  try{
    var osm=await getJSON('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=12&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon));
    var a=osm.address||{};
    var city=clean(a.city)||clean(a.town)||clean(a.village)||clean(a.municipality)||clean(a.locality)||clean(a.city_district)||clean(a.borough)||clean(a.suburb)||clean(a.county)||clean(a.state_district);
    var country=clean(a.country);
    if(city&&country)return {city:city,country:country};
  }catch(_){}
  try{
    var photon=await getJSON('https://photon.komoot.io/reverse?lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&lang=en');
    var feature=photon.features&&photon.features[0],p=feature&&feature.properties||{};
    var city=clean(p.city)||clean(p.town)||clean(p.village)||clean(p.locality)||clean(p.district)||clean(p.county)||clean(p.name);
    var country=clean(p.country);
    if(city&&country)return {city:city,country:country};
  }catch(_){}
  return null;
}
function persistLocationV5(){
  try{
    localStorage.setItem('noor-latitude',String(API_STORE.latitude));
    localStorage.setItem('noor-longitude',String(API_STORE.longitude));
    localStorage.setItem('noor-city',String(API_STORE.city||''));
    localStorage.setItem('noor-country',String(API_STORE.country||''));
    localStorage.setItem('noor-method',String(API_STORE.method||'3'));
    localStorage.setItem('noor-location-source',API_STORE.latitude!==null?'gps':'city');
  }catch(_){}
}

syncLocationLabels=function(){var label=currentLocationLabelV5();['locationName','settingLocation'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=label})};
function renderV5Nav(){var renderList=function(list){return list.map(function(item){return '<button class="'+(page===item[0]?'active':'')+'" onclick="go(\''+item[0]+'\')"><span class="ico">'+item[1]+'</span>'+item[2]+'</button>'}).join('')};var main=document.getElementById('sideNav'),more=document.getElementById('moreNav'),mobile=document.getElementById('mobileNav');if(main)main.innerHTML=renderList(primaryTabsV5);if(more)more.innerHTML=renderList(moreTabsV5);if(mobile)mobile.innerHTML=renderList(primaryTabsV5)};
nav=renderV5Nav;
function prayerTimeDateV5(name,offset){var raw=livePrayer&&livePrayer.timings&&livePrayer.timings[name];if(!raw)return null;var m=String(raw).match(/(\d{1,2}):(\d{2})/);if(!m)return null;var d=new Date();d.setDate(d.getDate()+(offset||0));d.setHours(Number(m[1]),Number(m[2]),0,0);return d}
function prayerStateV5(){if(!livePrayer||!livePrayer.timings)return null;var names=['Fajr','Dhuhr','Asr','Maghrib','Isha'],now=new Date(),slots=names.map(function(name){return{name:name,date:prayerTimeDateV5(name,0)}}).filter(function(x){return x.date});var nextIndex=slots.findIndex(function(x){return x.date>now});var active,next;if(nextIndex===-1){active=slots[slots.length-1];next={name:'Fajr',date:prayerTimeDateV5('Fajr',1),tomorrow:true}}else{next=slots[nextIndex];if(nextIndex===0)active={name:'Isha',date:prayerTimeDateV5('Isha',-1)};else active=slots[nextIndex-1]}if(!active||!next.date)return null;var ms=Math.max(0,next.date-now),total=Math.floor(ms/1000);return{active:active.name,next:next.name,nextTime:livePrayer.timings[next.name],tomorrow:!!next.tomorrow,seconds:total,remaining:Math.floor(total/3600)+'h '+String(Math.floor((total%3600)/60)).padStart(2,'0')+'m'}}
currentNext=function(){var s=prayerStateV5();return s?{name:s.next,time:s.nextTime,tomorrow:s.tomorrow}:null};
formatPrayerTime=function(value){var m=String(value||'').match(/(\d{1,2}):(\d{2})/);if(!m)return String(value||'—');var d=new Date();d.setHours(Number(m[1]),Number(m[2]),0,0);return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})};
function prayerRowsV5(){if(!livePrayer||!livePrayer.timings)return '<div class="location-empty" style="padding:16px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);font-size:13px;line-height:1.6">Prayer timings will appear here after your location is set. Use current GPS location or enter your city and country below.</div>';var state=prayerStateV5(),names=['Fajr','Dhuhr','Asr','Maghrib','Isha'],icons={Fajr:'☼',Dhuhr:'☀',Asr:'◔',Maghrib:'🌇',Isha:'☾'};return names.map(function(name){var isCurrent=state&&state.active===name;return '<div class="prayerrow '+(isCurrent?'current-prayer':'')+'"><div class="pname"><span>'+icons[name]+'</span>'+name+(isCurrent?' <span class="now-tag">Now</span>':'')+'</div><span class="ptime">'+formatPrayerTime(livePrayer.timings[name])+'</span><button class="check '+(done[name]?'done':'')+'" aria-label="Mark '+name+' complete" onclick="togglePrayer(\''+name+'\')">'+(done[name]?'✓':'')+'</button></div>'}).join('')}
actualPrayerRows=prayerRowsV5;
var togglePrayerBeforeV5=togglePrayer;togglePrayer=function(name){done[name]=!done[name];localStorage.setItem('noor-prayers',JSON.stringify(done));localStorage.setItem('noor-prayer-date',appDayKeyV5());render()};
var incrementBeforeV5=increment;increment=function(){incrementBeforeV5();localStorage.setItem('noor-tasbih-date',appDayKeyV5())};
function hijriLabelV5(){if(!livePrayer||!livePrayer.date||!livePrayer.date.hijri)return 'Islamic date loading';var h=livePrayer.date.hijri;return h.day+' '+h.month.en+' '+h.year+' AH'}
function weekStripV5(){var now=new Date(),start=new Date(now);start.setDate(now.getDate()-((now.getDay()+6)%7));return '<div class="prayer-calendar-strip">'+Array.from({length:7},function(_,i){var d=new Date(start);d.setDate(start.getDate()+i);return '<div class="prayer-day '+(d.toDateString()===now.toDateString()?'active':'')+'">'+d.toLocaleDateString('en',{weekday:'short'})+'<strong>'+d.getDate()+'</strong></div>'}).join('')+'</div>'}
function homeV5(){var state=prayerStateV5(),h=livePrayer&&livePrayer.date&&livePrayer.date.hijri,name=localStorage.getItem('noor-name')||'Samira',location=currentLocationLabelV5(),tools=[['qibla','🕋','Qibla'],['duas','🤲','Duas'],['mosques','🕌','Mosques'],['tasbeeh','📿','Tasbih'],['quran','📖','Quran'],['giving','💚','Giving'],['inspiration','✨','Inspiration'],['calendar','▦','Calendar']];return '<div class="home-date-row"><div><h1>Assalamu alaikum, '+escapeAppHtmlV5(name)+'</h1><p>Today, '+dateText()+' · '+(h?h.day+' '+h.month.en+' '+h.year+' AH':'Islamic date loading')+'</p></div><button class="location-chip" onclick="go(\'prayers\')">⌖ '+escapeAppHtmlV5(location)+' · Change</button></div><div class="grid g2"><div class="card hero-card"><div class="home-prayer-state"><span class="now-dot"></span> NOW · '+(state?escapeAppHtmlV5(state.active):'PRAYER TIMES')+'</div><h2 style="font:500 34px var(--serif);margin:17px 0 4px">'+(state?escapeAppHtmlV5(state.active):'Set your location')+'</h2><div class="sub">'+(state?formatPrayerTime(livePrayer.timings[state.active])+' · Next '+escapeAppHtmlV5(state.next)+' '+formatPrayerTime(state.nextTime)+(state.tomorrow?' tomorrow':''):'Prayer times will appear after your location is selected')+'</div><div class="timer">'+(state?state.remaining+' until '+escapeAppHtmlV5(state.next):'Choose GPS or enter your city to begin')+'</div><button class="btn-light" onclick="go(\'prayers\')">View all prayer times →</button></div><div class="card"><div class="rowbetween"><div><h3>Prayer tracker</h3><div class="sub">Your daily salah progress</div></div><span class="tag">'+Object.values(done).filter(Boolean).length+' of 5</span></div><div class="progress"><i style="width:'+Object.values(done).filter(Boolean).length*20+'%"></i></div><div class="prayerrows">'+prayerRowsV5()+'</div></div></div><div class="sectionhead"><h2>Features</h2><button class="plain" onclick="go(\'settings\')">Settings →</button></div><div class="home-tools">'+tools.map(function(x){return '<button class="home-tool" onclick="go(\''+x[0]+'\')"><span class="feature-icon">'+x[1]+'</span><b>'+x[2]+'</b></button>'}).join('')+'</div><div class="sectionhead"><h2>Continue Quran</h2><button class="plain" onclick="go(\'quran\')">Open →</button></div><button class="card rowbetween" style="width:100%;text-align:left" onclick="go(\'quran\')"><span><b>'+escapeAppHtmlV5(selectedSurah)+'</b><small class="sub" style="display:block;margin-top:4px">Arabic · translation · full-surah recitation</small></span><span class="tag">Read →</span></button><div class="sectionhead"><h2>Daily reflection</h2><button class="plain" onclick="go(\'inspiration\')">Open →</button></div><div class="card soft"><b>“For indeed, with hardship comes ease.”</b><p class="sub" style="margin:7px 0 0">Ash-Sharh · 94:5</p></div>'}
home=homeV5;
prayersPage=function(){var state=prayerStateV5(),t=livePrayer&&livePrayer.timings,methodOpts=Object.keys(PRAYER_METHODS).map(function(n){return '<option value="'+PRAYER_METHODS[n]+'" '+(API_STORE.method===PRAYER_METHODS[n]?'selected':'')+'>'+escapeAppHtmlV5(n)+'</option>'}).join(''),schedule=t?['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(function(n){return '<span class="prayer-pill">'+n+' · '+formatPrayerTime(t[n])+'</span>'}).join(''):'<span class="prayer-pill">Select a location to calculate times</span>';return title('Prayer times','Daily times and salah tracker',hijriLabelV5())+weekStripV5()+'<div class="grid g2"><div class="card hero-card"><div class="home-prayer-state"><span class="now-dot"></span> '+(state?'NOW · '+escapeAppHtmlV5(state.active):'LOCAL PRAYER SCHEDULE')+'</div><h2 style="font:500 31px var(--serif);margin:17px 0 5px">'+(state?'Next: '+escapeAppHtmlV5(state.next):'Set your location')+'</h2><div class="sub">'+(state?formatPrayerTime(state.nextTime)+(state.tomorrow?' · tomorrow':'')+' · '+state.remaining+' remaining':'Prayer times are calculated for your selected location')+'</div><div class="statrow" style="flex-wrap:wrap">'+schedule+'</div></div><div class="card"><div class="rowbetween"><div><h3>Today’s prayers</h3><div class="sub">Tap a circle after you complete salah</div></div><span class="tag">'+Object.values(done).filter(Boolean).length+' of 5</span></div><div class="progress"><i style="width:'+Object.values(done).filter(Boolean).length*20+'%"></i></div><div class="prayerrows">'+prayerRowsV5()+'</div></div></div><div class="sectionhead"><h2>Location & calculation</h2></div><div class="card"><div class="setting"><div><b>Location</b><small id="settingLocation">'+escapeAppHtmlV5(currentLocationLabelV5())+'</small></div><button class="smallbtn" onclick="setLocation()">Use current location</button></div><div class="grid g2"><label>City<input id="cityInput" class="search" style="margin:8px 0" value="'+escapeAppHtmlV5(API_STORE.latitude!==null?'':API_STORE.city)+'"></label><label>Country<input id="countryInput" class="search" style="margin:8px 0" value="'+escapeAppHtmlV5(API_STORE.country)+'"></label></div><div class="rowbetween" style="gap:12px;flex-wrap:wrap"><label class="sub">Calculation method <select id="methodInput" style="padding:10px;border:1px solid var(--line);border-radius:9px;margin-left:8px">'+methodOpts+'</select></label><button class="smallbtn" onclick="applyPrayerSettings()">Update prayer times</button></div><p id="methodStatusV5" class="settings-note" role="status"></p><p id="locationStatusV5" class="settings-note" role="status">Use current location to detect your town and country, or enter them manually. Prayer times will update after a location is set.</p><p class="settings-note">Prayer calculations can differ from local mosque timetables. Confirm times with your local authority. Your location is requested only when you tap “Use current location.”</p></div><div class="sectionhead"><h2>Find a mosque</h2><button class="plain" onclick="go(\'mosques\')">Nearby →</button></div><div class="card soft rowbetween" style="gap:12px;flex-wrap:wrap"><span><b>Prayer space near you</b><small class="sub" style="display:block;margin-top:4px">Search Google Maps using your current location or city.</small></span><button class="smallbtn" onclick="go(\'mosques\')">Find mosques →</button></div>'};
function useCurrentLocationV5(){
  if(!navigator.geolocation){toast('This browser does not support GPS location. Enter your city and country instead.');return}
  if(!window.isSecureContext&&location.hostname!=='localhost'){toast('Current location requires a secure HTTPS connection.');return}
  toast('Requesting your current location…');
  navigator.geolocation.getCurrentPosition(async function(pos){
    var lat=Number(pos.coords.latitude),lon=Number(pos.coords.longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180){toast('The device returned invalid location coordinates. Please retry.');return}
    API_STORE.latitude=lat;API_STORE.longitude=lon;API_STORE.city='Current location';API_STORE.country='';
    persistLocationV5();syncLocationLabels();render();
    setLocationStatusV5('GPS coordinates received. Finding your town or city…');toast('GPS found. Finding your town or city…');
    var place=await reverseGeocodeLocationV5(lat,lon);
    if(place&&place.city&&place.country){API_STORE.city=place.city;API_STORE.country=place.country}
    else{API_STORE.city='Current location';API_STORE.country=''}
    persistLocationV5();syncLocationLabels();render();
    setLocationStatusV5(place&&place.city&&place.country?'Location found: '+place.city+', '+place.country+'. Updating prayer times using GPS coordinates…':'City name could not be resolved. Your exact GPS coordinates will still be used for prayer times.');
    await loadPrayerData();
    if(livePrayer&&livePrayer.timings)setLocationStatusV5('Location ready: '+currentLocationLabelV5()+'. Prayer times updated from your current GPS coordinates.');else setLocationStatusV5('Location saved: '+currentLocationLabelV5()+'. Prayer timings could not load; check your connection and retry.');
  },function(error){
    var message=error&&error.code===1?'Location permission was denied. Allow location access in your browser settings, then try again.':error&&error.code===2?'Your device could not determine its location. Check GPS/location services and retry.':error&&error.code===3?'Location request timed out. Move near a window or check GPS, then retry.':'Could not get your location. Please try again or enter a city.';
    setLocationStatusV5(message);toast(message);
  },{enableHighAccuracy:true,maximumAge:0,timeout:20000})
}
setLocation=useCurrentLocationV5;
loadPrayerData=async function(){
  var method=API_STORE.method||'3';
  var hasCoords=API_STORE.latitude!==null&&Number.isFinite(Number(API_STORE.latitude))&&API_STORE.longitude!==null&&Number.isFinite(Number(API_STORE.longitude));
  var city=String(API_STORE.city||'').trim(),country=String(API_STORE.country||'').trim(),url;
  if(hasCoords){
    url='https://api.aladhan.com/v1/timings/'+apiDate()+'?latitude='+encodeURIComponent(API_STORE.latitude)+'&longitude='+encodeURIComponent(API_STORE.longitude)+'&method='+encodeURIComponent(method)+'&school='+(localStorage.getItem('noor-asr-method')==='hanafi'?'1':'0');
  }else if(city&&country){
    url='https://api.aladhan.com/v1/timingsByCity/'+apiDate()+'?city='+encodeURIComponent(city)+'&country='+encodeURIComponent(country)+'&method='+encodeURIComponent(method)+'&school='+(localStorage.getItem('noor-asr-method')==='hanafi'?'1':'0');
  }else{
    livePrayer=null;syncLocationLabels();
    if(page==='prayers')toast('Use current location or enter your city and country to load prayer times.');
    renderLivePrayerViews();return;
  }
  try{
    var j=await getJSON(url);
    if(!j.data||!j.data.timings)throw Error('Prayer timing service returned no schedule');
    livePrayer=j.data;
    localStorage.setItem('noor-prayer-cache',JSON.stringify({at:Date.now(),data:j.data,city:API_STORE.city,country:API_STORE.country,latitude:hasCoords?Number(API_STORE.latitude):null,longitude:hasCoords?Number(API_STORE.longitude):null,method:method}));
    if(j.data.meta&&j.data.meta.latitude!=null){
      try{var q=await getJSON('https://api.aladhan.com/v1/qibla/'+j.data.meta.latitude+'/'+j.data.meta.longitude);liveQibla=q.data.direction;localStorage.setItem('noor-qibla',String(liveQibla))}catch(_){}
    }
    var h=j.data.date&&j.data.date.hijri,top=document.getElementById('hijriTop');
    if(top&&h)top.textContent=h.day+' '+h.month.en+' '+h.year+' AH';
    syncLocationLabels();renderLivePrayerViews();
  }catch(e){
    var cached=null,matchingCache=false;
    try{cached=JSON.parse(localStorage.getItem('noor-prayer-cache')||'null')}catch(_){}
    if(cached&&cached.data&&cached.data.timings){
      if(hasCoords&&cached.latitude!=null&&cached.longitude!=null){
        matchingCache=Math.abs(Number(cached.latitude)-Number(API_STORE.latitude))<0.00001&&Math.abs(Number(cached.longitude)-Number(API_STORE.longitude))<0.00001;
      }else if(!hasCoords){
        matchingCache=String(cached.city||'').toLowerCase()===city.toLowerCase()&&String(cached.country||'').toLowerCase()===country.toLowerCase();
      }
    }
    livePrayer=matchingCache?cached.data:null;
    syncLocationLabels();
    if(page==='prayers')toast(matchingCache?'Could not refresh prayer times. Showing the last timings for this same location.':'Could not load prayer times for '+currentLocationLabelV5()+'. Check your connection and retry.');
    renderLivePrayerViews();
  }
}
applyPrayerSettings=function(){var city=document.getElementById('cityInput')&&document.getElementById('cityInput').value.trim(),country=document.getElementById('countryInput')&&document.getElementById('countryInput').value.trim(),method=document.getElementById('methodInput')&&document.getElementById('methodInput').value;if(!city||!country){toast('Enter both city and country, or use current location');return}API_STORE.latitude=null;API_STORE.longitude=null;API_STORE.city=city;API_STORE.country=country;API_STORE.method=method||API_STORE.method;persistLocationV5();syncLocationLabels();toast('Updating prayer times for '+city+', '+country+'…');loadPrayerData()};
function mapsMosqueUrlV5(){var place=API_STORE.latitude!==null?API_STORE.latitude.toFixed(6)+', '+API_STORE.longitude.toFixed(6):[API_STORE.city,API_STORE.country].filter(Boolean).join(', ');var query=place?'mosques near '+place:'mosques near me';return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query)}
function openGoogleMapsMosquesV5(){var url=mapsMosqueUrlV5();window.open(url,'_blank','noopener,noreferrer')}
function mosquesPageV5(){var place=currentLocationLabelV5();return title('Mosques near me','Find nearby prayer spaces with Google Maps',API_STORE.latitude!==null?'Device location':'Location ready')+'<div class="card mosque-map-card"><div><div class="mosque-map-icon">🕌</div><h2 style="font:600 24px var(--serif);margin:12px 0 4px">Mosques around '+escapeAppHtmlV5(place)+'</h2><p>Google Maps will show the mosque locations, opening hours, and directions for this area.</p><div class="map-actions"><button class="map-primary" onclick="openGoogleMapsMosquesV5()">Open nearby mosques in Google Maps ↗</button><button class="map-secondary" onclick="setLocation()">Use current location</button></div></div></div><div class="grid g2" style="margin-top:14px"><div class="card"><h3>Using your location</h3><p class="sub" style="line-height:1.7;margin:8px 0 0">'+(API_STORE.latitude!==null?'Using device coordinates for the Maps search and prayer calculations.':'Use your device location, or enter your city and country in Prayer settings.')+'</p><button class="smallbtn" style="margin-top:12px" onclick="go(\'prayers\')">Prayer location settings →</button></div><div class="card"><h3>Directions</h3><p class="sub" style="line-height:1.7;margin:8px 0 0">Choose a mosque in Google Maps to see its route and current travel details.</p><button class="smallbtn" style="margin-top:12px" onclick="openGoogleMapsMosquesV5()">Search on Google Maps →</button></div></div>'}
mosquesPage=mosquesPageV5;
/* Qibla: calculate from the actual selected coordinates and rotate the dial with device heading. */
var qiblaHeadingV5 = null, qiblaCompassRequestedV5 = false, qiblaOrientationHandlerV5 = null;
function normalizeQiblaDegreesV5(value) {
  if (value === null || value === undefined || value === '') return null;
  var number = Number(value);
  if (!Number.isFinite(number)) return null;
  return ((number % 360) + 360) % 360;
}
function validQiblaCoordinatesV5(lat, lon) {
  if (lat === null || lat === undefined || lon === null || lon === undefined || lat === '' || lon === '') return null;
  lat = Number(lat); lon = Number(lon);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { latitude: lat, longitude: lon } : null;
}
function qiblaCoordinatesV5() {
  var pair = validQiblaCoordinatesV5(API_STORE.latitude, API_STORE.longitude);
  if (pair) return pair;
  if (livePrayer && livePrayer.meta) {
    pair = validQiblaCoordinatesV5(livePrayer.meta.latitude, livePrayer.meta.longitude);
    if (pair) return pair;
  }
  try {
    var cache = JSON.parse(localStorage.getItem('noor-prayer-cache') || 'null');
    if (cache && cache.city === API_STORE.city && cache.country === API_STORE.country && cache.data && cache.data.meta) {
      pair = validQiblaCoordinatesV5(cache.data.meta.latitude, cache.data.meta.longitude);
      if (pair) return pair;
    }
  } catch (_) {}
  return null;
}
function calculateQiblaBearingV5(latitude, longitude) {
  var kaabaLat = 21.422487 * Math.PI / 180;
  var kaabaLon = 39.826206 * Math.PI / 180;
  var userLat = Number(latitude) * Math.PI / 180;
  var userLon = Number(longitude) * Math.PI / 180;
  var deltaLon = kaabaLon - userLon;
  var y = Math.sin(deltaLon);
  var x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLon);
  return normalizeQiblaDegreesV5(Math.atan2(y, x) * 180 / Math.PI);
}
function currentQiblaBearingV5() {
  var coords = qiblaCoordinatesV5();
  if (coords) {
    var computed = calculateQiblaBearingV5(coords.latitude, coords.longitude);
    if (computed !== null) {
      liveQibla = computed;
      try { localStorage.setItem('noor-qibla', String(computed)); } catch (_) {}
      return computed;
    }
  }
  if (liveQibla !== null && liveQibla !== undefined && Number.isFinite(Number(liveQibla))) return normalizeQiblaDegreesV5(liveQibla);
  var cached = localStorage.getItem('noor-qibla');
  return cached !== null && cached.trim() !== '' && Number.isFinite(Number(cached)) ? normalizeQiblaDegreesV5(cached) : null;
}
function qiblaCardinalV5(degrees) {
  var directions = ['N','NE','E','SE','S','SW','W','NW'];
  return directions[Math.round(normalizeQiblaDegreesV5(degrees) / 45) % 8];
}
function updateQiblaCompassUIV5() {
  var dial = document.getElementById('qiblaDialV5');
  if (dial) dial.style.transform = 'rotate(' + (qiblaHeadingV5 === null ? 0 : -qiblaHeadingV5) + 'deg)';
  var status = document.getElementById('qiblaCompassStatusV5');
  if (status) {
    if (qiblaHeadingV5 !== null) status.textContent = 'Live compass active · phone facing ' + qiblaCardinalV5(qiblaHeadingV5) + ' (' + Math.round(qiblaHeadingV5) + '°)';
    else if (qiblaCompassRequestedV5) status.textContent = 'Waiting for compass data… If it does not appear, check browser permissions or use the bearing below.';
    else status.textContent = 'Enable the live compass to align the Qibla marker with your phone.';
  }
  var button = document.getElementById('qiblaEnableCompassV5');
  if (button) button.style.display = qiblaHeadingV5 !== null ? 'none' : '';
}
function startQiblaCompassV5() {
  if (!window.isSecureContext) { toast('Live compass requires a secure HTTPS connection.'); return; }
  var Orientation = window.DeviceOrientationEvent;
  if (!Orientation) { toast('This browser does not provide a device compass. Use the calculated bearing instead.'); return; }
  function beginListening() {
    if (qiblaCompassRequestedV5) { toast('Compass is already enabled. Turn your phone slowly to align the marker.'); return; }
    qiblaCompassRequestedV5 = true;
    qiblaOrientationHandlerV5 = function (event) {
      var heading = null;
      if (typeof event.webkitCompassHeading === 'number' && event.webkitCompassHeading >= 0) {
        heading = event.webkitCompassHeading;
      } else if (event.absolute === true && typeof event.alpha === 'number') {
        heading = 360 - event.alpha;
      }
      heading = normalizeQiblaDegreesV5(heading);
      if (heading === null) return;
      qiblaHeadingV5 = heading;
      updateQiblaCompassUIV5();
    };
    window.addEventListener('deviceorientation', qiblaOrientationHandlerV5, true);
    window.addEventListener('deviceorientationabsolute', qiblaOrientationHandlerV5, true);
    updateQiblaCompassUIV5();
    toast('Compass enabled. Keep the phone flat and turn it slowly.');
    window.setTimeout(function () {
      if (qiblaHeadingV5 === null) {
        if (qiblaOrientationHandlerV5) {
          window.removeEventListener('deviceorientation', qiblaOrientationHandlerV5, true);
          window.removeEventListener('deviceorientationabsolute', qiblaOrientationHandlerV5, true);
        }
        qiblaCompassRequestedV5 = false;
        qiblaOrientationHandlerV5 = null;
        var status = document.getElementById('qiblaCompassStatusV5');
        if (status) status.textContent = 'No absolute compass reading was received. Check compass permissions or use the calculated bearing below; you can try enabling the compass again.';
        var button = document.getElementById('qiblaEnableCompassV5');
        if (button) button.style.display = '';
      }
    }, 5000);
  }
  if (typeof Orientation.requestPermission === 'function') {
    Orientation.requestPermission().then(function (permission) {
      if (permission === 'granted') beginListening();
      else toast('Compass permission was not granted. You can still use the calculated bearing.');
    }).catch(function () { toast('Could not enable the compass. Check browser permissions.'); });
  } else beginListening();
}
var qiblaCompassStylesV5 = document.createElement('style');
qiblaCompassStylesV5.textContent = '.qibla-compass:before,.qibla-compass:after{content:none!important}.qibla-dial{position:absolute;inset:0;border-radius:50%;transition:transform .12s linear}.qibla-north,.qibla-south{position:absolute;left:50%;transform:translateX(-50%);font-size:12px;font-weight:700}.qibla-north{top:15px;color:var(--green)}.qibla-south{bottom:15px;color:var(--muted)}.qibla-compass .needle{position:absolute;top:calc(50% - 102.5px);left:calc(50% - 1.5px)}.qibla-compass .center-dot{top:calc(50% - 5px);left:calc(50% - 5px)}.qibla-compass-status{font-size:12px;line-height:1.6;color:var(--muted);text-align:center;margin:9px auto 4px;max-width:320px}';
document.head.appendChild(qiblaCompassStylesV5);
qiblaPage = function () {
  var angle = currentQiblaBearingV5(), place = currentLocationLabelV5();
  var coordinates = qiblaCoordinatesV5();
  var bearingText = angle === null ? 'Set location' : Math.round(angle) + '° ' + qiblaCardinalV5(angle);
  var heading = qiblaHeadingV5 === null ? 0 : qiblaHeadingV5;
  var dialMarkup = angle === null
    ? '<div class="qibla-no-bearing">Choose a city or allow location access to calculate your Qibla bearing.</div>'
    : '<div class="compass qibla-compass"><div class="qibla-dial" id="qiblaDialV5" style="transform:rotate(' + (-heading) + 'deg)"><span class="qibla-north">N</span><span class="qibla-south">S</span><div class="needle" style="transform:rotate(' + angle + 'deg)"><span class="kaaba">⌂</span></div><span class="center-dot"></span></div></div>';
  return title('Qibla direction', 'Calculated from your selected location', angle === null ? 'Bearing unavailable' : bearingText + ' from north')
    + '<div class="grid g2"><div class="card"><div class="rowbetween"><div><h3>Qibla compass</h3><div class="sub">The marker points toward the Kaaba</div></div><span class="tag">' + (angle === null ? '—' : Math.round(angle) + '°') + '</span></div><div class="compass-wrap">' + dialMarkup + '</div><div style="text-align:center"><button class="smallbtn" id="qiblaEnableCompassV5" onclick="startQiblaCompassV5()" ' + (qiblaHeadingV5 !== null ? 'style="display:none"' : '') + '>Enable live compass</button><p class="qibla-compass-status" id="qiblaCompassStatusV5">' + (qiblaHeadingV5 !== null ? 'Live compass active · phone facing ' + qiblaCardinalV5(qiblaHeadingV5) + ' (' + Math.round(qiblaHeadingV5) + '°)' : 'Enable the live compass to align the Qibla marker with your phone.') + '</p></div></div><div class="card"><h3>About your Qibla</h3><p class="sub" style="line-height:1.8;margin-top:12px">' + (angle === null ? 'Choose a city in Prayer times or enable GPS location to calculate a direction to the Kaaba in Makkah.' : 'The calculated initial bearing to the Kaaba is <b>' + Math.round(angle) + '° ' + qiblaCardinalV5(angle) + '</b> clockwise from north for ' + escapeAppHtmlV5(place) + '.') + '</p><div class="setting"><b>Direction</b><span>' + (angle === null ? '—' : Math.round(angle) + '° ' + qiblaCardinalV5(angle)) + '</span></div><div class="setting"><b>Location</b><span>' + escapeAppHtmlV5(place) + '</span></div><p class="settings-note">' + (coordinates ? 'Bearing computed from the saved coordinates for this location.' : 'A saved bearing may be shown until location coordinates are available. Set or refresh your location for the best result.') + ' Keep your phone flat and away from magnetic objects. A device compass can be affected by nearby magnets and sensor quality.</p><button class="smallbtn" onclick="go(\'prayers\')">Update location →</button></div></div>';
};
var oldDuaListV5=duaList;duaList=function(filter){var f=String(filter||'').trim().toLowerCase(),favorites=JSON.parse(localStorage.getItem('noor-dua-favorites')||'[]');return duas.map(function(d,i){return{d:d,i:i}}).filter(function(x){return !f||x.d.join(' ').toLowerCase().includes(f)}).map(function(x){var d=x.d,i=x.i,saved=favorites.indexOf(i)>=0;return '<article class="card dua"><div class="rowbetween"><h3>'+escapeAppHtmlV5(d[0])+'</h3><button class="smallbtn" aria-label="'+(saved?'Remove saved dua':'Save dua')+'" onclick="toggleDuaFavoriteV5('+i+')">'+(saved?'♥ Saved':'♡ Save')+'</button></div><div class="arabic" lang="ar">'+escapeAppHtmlV5(d[1])+'</div><p>'+escapeAppHtmlV5(d[2])+'</p><span class="sub">Arabic · English meaning</span></article>'}).join('')||'<div class="card"><p class="sub">No duas match that search. Try another word.</p></div>'};
filterDuas=function(filter){var box=document.getElementById('duaList');if(box)box.innerHTML=duaList(filter)};
function toggleDuaFavoriteV5(index){var saved=JSON.parse(localStorage.getItem('noor-dua-favorites')||'[]'),at=saved.indexOf(index);if(at>=0)saved.splice(at,1);else saved.push(index);localStorage.setItem('noor-dua-favorites',JSON.stringify(saved));var input=document.getElementById('duaSearch');filterDuas(input?input.value:'');toast(at>=0?'Dua removed from saved items':'Dua saved on this device')}
duasPage=function(){return title('Duas & adhkar','Supplications for daily moments','Saved on this device')+'<div class="sectionhead"><h2>Collections</h2></div><div class="chips" style="margin-bottom:15px"><button class="chip" onclick="filterDuas(\'\')">All duas</button><button class="chip" onclick="filterDuas(\'Morning\')">Morning</button><button class="chip" onclick="filterDuas(\'Before eating\')">Meals</button><button class="chip" onclick="filterDuas(\'family\')">Home & family</button><button class="chip" onclick="filterDuas(\'ease\')">Ease & patience</button><button class="chip" onclick="filterDuas(\'forgiveness\')">Forgiveness</button></div><input id="duaSearch" class="search" placeholder="Search duas" oninput="filterDuas(this.value)"><div class="dua-list" id="duaList">'+duaList('')+'</div>'};
function journeyPageV5(){var completed=Object.values(done).filter(Boolean).length,bookmarks=JSON.parse(localStorage.getItem('noor-bookmarks')||'[]'),duaFavorites=JSON.parse(localStorage.getItem('noor-dua-favorites')||'[]'),recent=JSON.parse(localStorage.getItem('noor-quran-recent')||'[]'),reflection=localStorage.getItem('noor-reflection')||'';return title('My Journey','Your personal worship and reading progress','Private on this device')+'<div class="journey-private">🔒 Your prayer check-ins, saved duas, Quran bookmarks, and reflections stay in this browser.</div><div class="sectionhead"><h2>Today</h2><button class="plain" onclick="go(\'prayers\')">Prayer tracker →</button></div><div class="grid g2"><div class="card"><div class="rowbetween"><div><h3>Daily prayers</h3><div class="sub">'+completed+' of 5 marked complete</div></div><span class="tag">'+Math.round(completed/5*100)+'%</span></div><div class="progress"><i style="width:'+completed*20+'%"></i></div><button class="smallbtn" onclick="go(\'prayers\')">Update today’s prayers</button></div><div class="card"><div class="rowbetween"><div><h3>Tasbih today</h3><div class="sub">A gentle dhikr habit</div></div><span class="tag">'+Number(tasbih||0)+'</span></div><div class="progress"><i style="width:'+Math.min(Number(tasbih||0),100)+'%"></i></div><button class="smallbtn" onclick="go(\'tasbeeh\')">Continue tasbih</button></div></div><div class="sectionhead"><h2>Quran reading</h2><button class="plain" onclick="go(\'quran\')">Open Quran →</button></div><div class="grid g2"><div class="journey-stat"><b>'+escapeAppHtmlV5(selectedSurah)+'</b><small>Last selected surah</small></div><div class="journey-stat"><b>'+bookmarks.length+'</b><small>Saved ayahs · '+duaFavorites.length+' favorite duas</small></div></div><div class="sectionhead"><h2>Recent reading</h2></div><div class="card">'+(recent.length?recent.slice(0,3).map(function(r){var ch=chapters[r.surah-1],name=ch?ch.englishName:'Surah '+r.surah;return '<div class="setting"><b>'+escapeAppHtmlV5(name)+'</b><button class="smallbtn" onclick="openSurah('+Number(r.surah)+')">Continue →</button></div>'}).join(''):'<p class="sub">Your recently opened surahs will appear here.</p>')+'</div><div class="sectionhead"><h2>Private reflection</h2><button class="plain" onclick="go(\'inspiration\')">Open →</button></div><div class="card">'+(reflection?'<p style="line-height:1.7">'+escapeAppHtmlV5(reflection)+'</p>':'<p class="sub">Write a reflection for yourself. It is saved only in this browser.</p>')+'<button class="smallbtn" onclick="go(\'inspiration\')">Write or edit</button></div>'}
function appThemeV5(value){var theme=String(value||'Dark').toLowerCase();document.body.classList.toggle('app-light',theme==='light');document.body.classList.toggle('app-sepia',theme==='sepia');localStorage.setItem('noor-theme',theme==='light'?'Light':theme==='sepia'?'Sepia':'Dark')}
setTheme=appThemeV5;
var settingsPageBeforeV5=settingsPage;settingsPage=function(){var html=settingsPageBeforeV5(),theme=localStorage.getItem('noor-theme')||'Dark';html=html.replace('<option>Light</option><option>Sepia</option><option>Dark</option>','<option '+(theme==='Light'?'selected':'')+'>Light</option><option '+(theme==='Sepia'?'selected':'')+'>Sepia</option><option '+(theme==='Dark'?'selected':'')+'>Dark</option>');var methodOpts=Object.keys(PRAYER_METHODS).map(function(name){var id=String(PRAYER_METHODS[name]);return '<option value="'+id+'" '+(String(API_STORE.method||'3')===id?'selected':'')+'>'+escapeAppHtmlV5(name)+'</option>'}).join('');var methodControl='<div class="setting"><div><b>Calculation method</b><small>Automatically chosen for your location unless you select one</small></div><div class="method-settings-control"><select id="settingsMethodInput" onchange="setPrayerMethodV5(this.value)">'+methodOpts+'</select><button class="smallbtn" onclick="setPrayerMethodV5(&quot;auto&quot;)">Auto-detect</button></div></div>';html=html.replace(/<div class="setting"><div><b>Calculation method<\/b><small>Used for prayer times<\/small><\/div><select onchange="saveSetting\(&quot;method&quot;,this.value\)">[\s\S]*?<\/select><\/div>/,methodControl);return '<div class="momin-settings-page">'+html+'</div>'};
function quranTranslationEditionV5(){return localStorage.getItem('noor-quran-edition')||'en.sahih'}
function quranTranslationOptionsV5(){var active=quranTranslationEditionV5();return quranTranslationsV5.map(function(x){return '<option value="'+x.id+'" '+(x.id===active?'selected':'')+'>'+escapeAppHtmlV5(x.label)+'</option>'}).join('')}
function translationDirectionV5(){var x=quranTranslationsV5.find(function(y){return y.id===quranTranslationEditionV5()});return x?x.dir:'ltr'}
var quranReaderBeforeLanguageV5=quranReaderPageV2;quranReaderPageV2=function(){var html=quranReaderBeforeLanguageV5(),control='<label class="reader-setting"><span>Translation</span><select aria-label="Quran translation language" onchange="setQuranTranslationEditionV5(this.value)">'+quranTranslationOptionsV5()+'</select></label>';return html.replace('</div><div class="reading-goal">',control+'</div><div class="reading-goal">')};
var quranPageBeforeIconsV5=quranPage;quranPage=function(){var html=quranPageBeforeIconsV5();if(quranView==='library'){html=html.replace('>▮</button>','><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 3.5h12v17l-6-3.7-6 3.7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>').replace('>⌕</button>','><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15.5 15.5 5.3 5.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>')}return html};
setQuranTranslationEditionV5=function(edition){if(!quranTranslationsV5.some(function(x){return x.id===edition}))return;localStorage.setItem('noor-quran-edition',edition);var n=readerChapter().number||Number(localStorage.getItem('noor-surah-number'))||1;readSurah(n)};
verseMarkup=function(){var ch=readerChapter().number||1,dir=translationDirectionV5(),language=quranTranslationEditionV5().split('.')[0];return currentVerses.map(function(v){return '<article class="ayah-block"><div class="ayah-tools"><button class="ayah-marker" onclick="bookmarkVerse(\''+escapeAppHtmlV5(v.number)+'\')">Ayah '+ch+':'+v.numberInSurah+' <span>⌄</span></button></div><div class="ayah-arabic-row"><div class="ayah-rosette"><span>'+v.numberInSurah+'</span></div><div class="arabic" lang="ar">'+escapeAppHtmlV5(v.text)+'</div></div>'+(v.transliteration?'<div class="ayah-transliteration" lang="en">'+escapeAppHtmlV5(v.transliteration)+'</div>':'')+'<div class="ayah-translation" lang="'+language+'" dir="'+dir+'">'+escapeAppHtmlV5(v.translation||'')+'</div><div class="ayah-bookmark"><button onclick="bookmarkVerse(\''+escapeAppHtmlV5(v.number)+'\')">♡ Save ayah</button></div></article>'}).join('')};
function stripOpeningBismillahV5(text){var source=String(text||'').replace(/^\uFEFF/,'').trim(),words=source.split(/\s+/),marks=/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g;function plain(word){return String(word||'').normalize('NFD').replace(marks,'').replace(/\u0640/g,'').replace(/\u0671/g,'ا').normalize('NFC')}var expected=['بِسْمِ','ٱللَّهِ','ٱلرَّحْمَٰنِ','ٱلرَّحِيمِ'].map(plain);if(words.length>=4&&words.slice(0,4).map(plain).every(function(word,i){return word===expected[i]}))return words.slice(4).join(' ');return source}
readSurah=async function(n){n=Number(n)||1;var chapter=chapters[n-1];if(!chapter){toast('Surah list is still loading');return}var token=++readerRequestToken;stopAudio();selectedSurah=chapter.englishName;localStorage.setItem('noor-surah',selectedSurah);localStorage.setItem('noor-surah-number',n);currentVerses=[];readerLoading=true;render();var status=document.getElementById('loadStatus');if(status)status.textContent='Loading Arabic, transliteration, and meaning…';try{var edition=quranTranslationEditionV5(),url='https://api.alquran.cloud/v1/surah/'+n+'/editions/quran-uthmani,'+edition+',en.transliteration',result=await getJSON(url);if(token!==readerRequestToken)return;var data=result.data,arabic=data.find(function(x){return x.edition&&x.edition.identifier==='quran-uthmani'}),translation=data.find(function(x){return x.edition&&x.edition.identifier===edition}),trans=data.find(function(x){return x.edition&&x.edition.identifier==='en.transliteration'});if(!arabic||!translation)throw Error('Selected translation is not available');currentVerses=arabic.ayahs.map(function(v,i){var text=v.text;if(n!==1&&n!==9&&Number(v.numberInSurah)===1)text=stripOpeningBismillahV5(text);return{number:v.number,numberInSurah:v.numberInSurah,page:Number(v.page||0),surahNo:n,text:text,translation:translation.ayahs[i]&&translation.ayahs[i].text,transliteration:trans&&trans.ayahs[i]&&trans.ayahs[i].text||'',surah:arabic.englishName}});readerLoading=false;render();localStorage.setItem('noor-last-verse',n+':1');localStorage.setItem('noor-quran-progress',selectedSurah+' · Ayah 1');if(typeof saveQuranRecent==='function')saveQuranRecent(n,1)}catch(e){if(token!==readerRequestToken)return;readerLoading=false;render();var statusError=document.getElementById('loadStatus');if(statusError)statusError.textContent='Unable to load Quran text. Check your connection and try again.';toast('Quran content could not load')}};
showQuranInfo=function(){var t=quranTranslationsV5.find(function(x){return x.id===quranTranslationEditionV5()});toast('Arabic, transliteration, and '+(t?t.label:'selected translation'))};
if(localStorage.getItem('noor-theme'))appThemeV5(localStorage.getItem('noor-theme'));
render=function(){nav();var screens={home:home,prayers:prayersPage,quran:quranPage,journey:journeyPageV5,qibla:qiblaPage,duas:duasPage,mosques:mosquesPage,giving:givingPage,tasbeeh:tasbeehPage,calendar:calendarPage,inspiration:inspirationPage,settings:settingsPage,profile:profilePage,notifications:notificationsPage},screen=screens[page]||home;document.getElementById('view').innerHTML=screen();var crumb=document.getElementById('crumb');if(crumb)crumb.textContent=pageNamesV5[page]||'Home';var topHijri=document.getElementById('hijriTop');if(topHijri)topHijri.textContent=livePrayer&&livePrayer.date&&livePrayer.date.hijri?hijriLabelV5():'';syncLocationLabels()};
go=function(target){if(target==='ummah')target='journey';if(target==='aideen'){toast('Quran search is available from the Quran section');target='quran'}if(target==='quran'){quranView='library';quranSearchVisible=false;stopAudio()}else stopAudio();page=target;render();window.scrollTo({top:0,behavior:'smooth'})};
calendarPage=function(){var now=new Date(),h=livePrayer&&livePrayer.date&&livePrayer.date.hijri,days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],offset=new Date(now.getFullYear(),now.getMonth(),1).getDay(),count=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();return title('Islamic calendar','Gregorian dates with your local Hijri date',h?h.day+' '+h.month.en+' '+h.year+' AH':'Hijri date loading')+'<div class="grid g2"><div class="card"><div class="rowbetween"><div><h3>'+new Intl.DateTimeFormat('en',{month:'long',year:'numeric'}).format(now)+'</h3><div class="sub">Today · '+dateText()+'</div></div><span class="tag">'+(h?h.day+' '+h.month.en:'Today')+'</span></div><div class="calendar" style="margin-top:17px">'+days.map(function(x){return '<div class="weekday">'+x+'</div>'}).join('')+Array(offset).fill('<div></div>').join('')+Array.from({length:count},function(_,i){return '<div class="'+(i+1===now.getDate()?'today':'')+'">'+(i+1)+'</div>'}).join('')+'</div></div><div class="card"><h3>Prayer & month planning</h3><p class="sub" style="line-height:1.7;margin-top:10px">Hijri dates can vary by local moon sighting. Check your local mosque for confirmed religious dates.</p><button class="smallbtn" onclick="go(\'prayers\')">Prayer times →</button></div></div>'};
var oldSaveSettingV5=saveSetting;saveSetting=function(key,value){if(key==='notifications'&&value&&'Notification' in window){Notification.requestPermission().then(function(permission){localStorage.setItem('noor-notifications',permission==='granted'?'true':'false');toast(permission==='granted'?'Prayer notifications enabled in this browser':'Notification permission was not granted')});return}oldSaveSettingV5(key,value)};
if(API_STORE.latitude!==null)loadPrayerData();
/* Quran opening Bismillah: standalone for surahs 2–8 and 10–114; Al-Fatihah keeps it as ayah 1 and At-Tawbah omits it. */
var noorBismillahStyleV5=document.createElement('style');noorBismillahStyleV5.textContent='.surah-bismillah{max-width:780px;margin:14px auto 10px;padding:2px 10px;text-align:center;direction:rtl;color:var(--quran-ink,#382d22);font-family:"Noto Naskh Arabic","Amiri","Traditional Arabic",Georgia,serif;font-size:clamp(27px,4vw,38px);line-height:1.9}.reader-night .surah-bismillah{color:#f4ead5}';document.head.appendChild(noorBismillahStyleV5);
var quranReaderBeforeBismillahV5=quranReaderPageV2;quranReaderPageV2=function(){var html=quranReaderBeforeBismillahV5(),chapterNo=readerChapter().number||Number(localStorage.getItem('noor-surah-number'))||1;if(chapterNo!==1&&chapterNo!==9){var line='<div class="surah-bismillah" lang="ar" dir="rtl" aria-label="Bismillah ir-Rahman ir-Rahim">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';html=html.replace(/(<div class="surah-banner"[\s\S]*?<\/div>)(<div class="reader-loadstatus")/,function(_,banner,status){return banner+line+status})}return html};

render();


/* MOMIN location autofill + regional calculation method selection */
(function locationCalculationMethodsV6(){
  var methodMap = {
    "0":"Shia Ithna-Ashari (Ja'fari) / Leva Institute, Qom",
    "1":"University of Islamic Sciences, Karachi",
    "2":"Islamic Society of North America (ISNA)",
    "3":"Muslim World League (MWL)",
    "4":"Umm al-Qura University, Makkah",
    "5":"Egyptian General Authority of Survey",
    "7":"Institute of Geophysics, University of Tehran",
    "8":"Gulf Region",
    "9":"Kuwait",
    "10":"Qatar",
    "11":"Majlis Ugama Islam Singapura (MUIS)",
    "12":"Union Organization Islamique de France (UOIF)",
    "13":"Diyanet İşleri Başkanlığı, Turkey",
    "14":"Spiritual Administration of Muslims of Russia",
    "15":"Moonsighting Committee Worldwide",
    "16":"Dubai, UAE (Experimental/Research)",
    "17":"Jabatan Kemajuan Islam Malaysia (JAKIM)",
    "18":"Tunisia",
    "19":"Algeria",
    "20":"Kementerian Agama Republik Indonesia (KEMENAG)",
    "21":"Morocco",
    "22":"Comunidade Islâmica de Lisboa (Portugal)",
    "23":"Jordan"
  };
  var methodById = {};
  Object.keys(methodMap).forEach(function(id){methodById[id]=methodMap[id]});
  function countryMethodIdV6(country){
    var c=String(country||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if(!c)return "3";
    if(/iran|islamic republic of iran/.test(c))return "7";
    if(/saudi arabia/.test(c))return "4";
    if(/india|pakistan|bangladesh|afghanistan/.test(c))return "1";
    if(/united states|united states of america|usa|canada/.test(c))return "2";
    if(/singapore/.test(c))return "11";
    if(/united arab emirates|uae|dubai/.test(c))return "16";
    if(/kuwait/.test(c))return "9";
    if(/qatar/.test(c))return "10";
    if(/turkey|turkiye/.test(c))return "13";
    if(/russia/.test(c))return "14";
    if(/malaysia/.test(c))return "17";
    if(/tunisia/.test(c))return "18";
    if(/algeria/.test(c))return "19";
    if(/indonesia/.test(c))return "20";
    if(/morocco/.test(c))return "21";
    if(/portugal/.test(c))return "22";
    if(/jordan/.test(c))return "23";
    if(/france/.test(c))return "12";
    if(/syria|iraq|lebanon|egypt/.test(c))return "5";
    var africanCountries="angola benin botswana burkina faso burundi cabo verde cameroon central african republic chad comoros democratic republic of the congo republic of the congo cote divoire ivory coast djibouti equatorial guinea eritrea eswatini swaziland ethiopia gabon gambia ghana guinea guinea-bissau kenya lesotho liberia libya madagascar malawi mali mauritania mauritius mozambique namibia niger nigeria rwanda sao tome and principe senegal seychelles sierra leone somalia south africa south sudan sudan tanzania togo uganda zambia zimbabwe".split(" ");
    if(africanCountries.indexOf(c)>=0)return "5";
    if(/bahrain|oman|yemen/.test(c))return "8";
    if(/united kingdom|ireland|germany|spain|italy|netherlands|belgium|switzerland|austria|sweden|norway|denmark|finland|poland|greece|europe/.test(c))return "3";
    return "3";
  }
  function methodNameV6(id){return methodById[String(id)]||methodById["3"]}
  function saveMethodV6(mode,id){
    API_STORE.methodMode=mode==="manual"?"manual":"auto";
    if(id!==undefined&&id!==null&&String(id)!=="")API_STORE.method=String(id);
    try{
      localStorage.setItem("noor-method-mode",API_STORE.methodMode);
      localStorage.setItem("noor-method",String(API_STORE.method||"3"));
    }catch(_){}
  }
  function applyAutoMethodV6(){
    if((API_STORE.methodMode||"auto")==="manual")return;
    API_STORE.method=countryMethodIdV6(API_STORE.country);
    try{localStorage.setItem("noor-method",String(API_STORE.method))}catch(_){}
  }
  var oldSyncLocationMethodsV6=syncLocationLabels;
  syncLocationLabels=function(){
    if((API_STORE.methodMode||"auto")!=="manual")applyAutoMethodV6();
    oldSyncLocationMethodsV6();
    var city=String(API_STORE.city||"").trim(),country=String(API_STORE.country||"").trim();
    var generic=/^(current location|my location|locating city[.…]*|choose your location)$/i;
    var cityField=document.getElementById("cityInput"),countryField=document.getElementById("countryInput");
    if(cityField&&!generic.test(city))cityField.value=city;
    if(countryField&&country)countryField.value=country;
    var picker=document.getElementById("methodInput"),status=document.getElementById("methodStatusV5");
    var auto=(API_STORE.methodMode||"auto")!=="manual";
    if(picker)picker.value=auto?"auto":String(API_STORE.method||"3");
    if(status)status.textContent=auto
      ? "Automatic method: "+methodNameV6(API_STORE.method)+(country?" for "+country+".":" (MWL fallback until your country is detected).")
      : "Manual method: "+methodNameV6(API_STORE.method)+".";
  };
  var oldPrayerPageMethodsV6=prayersPage;
  prayersPage=function(){
    var markup=oldPrayerPageMethodsV6();
    var cityInput=API_STORE.city&& !/^(current location|my location|locating city[.…]*)$/i.test(String(API_STORE.city))?API_STORE.city:"";
    markup=markup.replace(/(<input id="cityInput"[^>]*value=")[^"]*(")/,function(_,start,end){return start+escapeAppHtmlV5(cityInput)+end});
    markup=markup.replace(/(<input id="countryInput"[^>]*value=")[^"]*(")/,function(_,start,end){return start+escapeAppHtmlV5(API_STORE.country||"")+end});
    var options='<option value="auto">Auto-detect for my location</option>'+Object.keys(PRAYER_METHODS).map(function(name){
      var id=String(PRAYER_METHODS[name]);
      return '<option value="'+id+'">'+escapeAppHtmlV5(name)+'</option>';
    }).join("");
    markup=markup.replace(/<select id="methodInput"[^>]*>[\s\S]*?<\/select>/, '<select id="methodInput" style="padding:10px;border:1px solid var(--line);border-radius:9px;margin-left:8px">'+options+'</select>');
    markup=markup.replace('>Prayer times are calculated for your selected location<','>Prayer timings update automatically after your location is detected<');
    return markup;
  };
  var oldApplyLocationMethodsV6=applyPrayerSettings;
  applyPrayerSettings=function(){
    var cityInput=document.getElementById("cityInput"),countryInput=document.getElementById("countryInput"),methodInput=document.getElementById("methodInput");
    var city=cityInput?cityInput.value.trim():"",country=countryInput?countryInput.value.trim():"",choice=methodInput?methodInput.value:"auto";
    var hasGps=API_STORE.latitude!==null&&Number.isFinite(Number(API_STORE.latitude))&&API_STORE.longitude!==null&&Number.isFinite(Number(API_STORE.longitude));
    var currentCity=String(API_STORE.city||"").trim().toLowerCase(),currentCountry=String(API_STORE.country||"").trim().toLowerCase();
    var fieldsMatchGps=hasGps&&city.toLowerCase()===currentCity&&country.toLowerCase()===currentCountry;
    if(hasGps&&((!city&&!country)||fieldsMatchGps)){
      // Retain precise GPS if the reverse-geocoded fields are blank or unchanged.
    }else{
      if(!city||!country){toast("Enter both city and country, or use current location");return}
      API_STORE.latitude=null;API_STORE.longitude=null;API_STORE.city=city;API_STORE.country=country;
    }
    if(choice==="auto"||!choice){
      saveMethodV6("auto",countryMethodIdV6(API_STORE.country));
    }else{
      if(!Object.keys(PRAYER_METHODS).some(function(name){return String(PRAYER_METHODS[name])===String(choice)})){
        toast("Choose one of the calculation methods shown");return;
      }
      saveMethodV6("manual",String(choice));
    }
    persistLocationV5();syncLocationLabels();
    setLocationStatusV5("Updating prayer times for "+currentLocationLabelV5()+"…");
    loadPrayerData();
  };
  loadPrayerData=async function(){
    var hasGps=API_STORE.latitude!==null&&Number.isFinite(Number(API_STORE.latitude))&&API_STORE.longitude!==null&&Number.isFinite(Number(API_STORE.longitude));
    var city=String(API_STORE.city||"").trim(),country=String(API_STORE.country||"").trim();
    if((API_STORE.methodMode||"auto")!=="manual")applyAutoMethodV6();
    var method=String(API_STORE.method||"3"),url;
    if(hasGps){
      url="https://api.aladhan.com/v1/timings/"+apiDate()+"?latitude="+encodeURIComponent(API_STORE.latitude)+"&longitude="+encodeURIComponent(API_STORE.longitude)+"&method="+encodeURIComponent(method);
    }else if(city&&country){
      url="https://api.aladhan.com/v1/timingsByCity/"+apiDate()+"?city="+encodeURIComponent(city)+"&country="+encodeURIComponent(country)+"&method="+encodeURIComponent(method);
    }else{
      livePrayer=null;syncLocationLabels();
      if(page==="prayers")setLocationStatusV5("Use current location or enter a city and country to calculate prayer times.");
      renderLivePrayerViews();return;
    }
    try{
      var result=await getJSON(url);
      if(!result.data||!result.data.timings)throw Error("The prayer service returned no timings");
      livePrayer=result.data;
      localStorage.setItem("noor-prayer-cache",JSON.stringify({
        at:Date.now(),data:result.data,city:API_STORE.city,country:API_STORE.country,
        latitude:hasGps?Number(API_STORE.latitude):null,longitude:hasGps?Number(API_STORE.longitude):null,
        method:method,methodMode:API_STORE.methodMode||"auto"
      }));
      if(result.data.meta&&result.data.meta.latitude!=null){
        try{var qibla=await getJSON("https://api.aladhan.com/v1/qibla/"+result.data.meta.latitude+"/"+result.data.meta.longitude);liveQibla=qibla.data.direction;localStorage.setItem("noor-qibla",String(liveQibla))}catch(_){}
      }
      if((API_STORE.methodMode||"auto")!=="manual"){
        // Keep the country-region method selected; never replace it with a generic response default.
        API_STORE.method=countryMethodIdV6(API_STORE.country);
        localStorage.setItem("noor-method",String(API_STORE.method));
      }
      var hijri=result.data.date&&result.data.date.hijri,top=document.getElementById("hijriTop");
      if(top&&hijri)top.textContent=hijri.day+" "+hijri.month.en+" "+hijri.year+" AH";
      syncLocationLabels();renderLivePrayerViews();
      if(page==="prayers")setLocationStatusV5("Prayer times updated for "+currentLocationLabelV5()+" using "+methodNameV6(method)+".");
    }catch(error){
      var cached=null,match=false;try{cached=JSON.parse(localStorage.getItem("noor-prayer-cache")||"null")}catch(_){}
      if(cached&&cached.data&&cached.data.timings){
        if(hasGps&&cached.latitude!=null&&cached.longitude!=null)match=Math.abs(Number(cached.latitude)-Number(API_STORE.latitude))<0.00001&&Math.abs(Number(cached.longitude)-Number(API_STORE.longitude))<0.00001&&String(cached.method)===method;
        else if(!hasGps)match=String(cached.city||"").toLowerCase()===city.toLowerCase()&&String(cached.country||"").toLowerCase()===country.toLowerCase()&&String(cached.method||"")===method;
      }
      livePrayer=match?cached.data:null;syncLocationLabels();
      if(page==="prayers")setLocationStatusV5(match?"Network refresh failed. Showing saved times for this same location and method.":"Could not update prayer times. Check your connection and try again.");
      renderLivePrayerViews();
    }
  };
  window.setPrayerMethodV5=function(value){
    if(value==="auto"){
      saveMethodV6("auto",countryMethodIdV6(API_STORE.country));
    }else{
      var valid=Object.keys(PRAYER_METHODS).some(function(name){return String(PRAYER_METHODS[name])===String(value)});
      if(!valid){toast("Choose a calculation method from the provided list");return}
      saveMethodV6("manual",String(value));
    }
    syncLocationLabels();render();
    var hasCoords=API_STORE.latitude!==null&&Number.isFinite(Number(API_STORE.latitude))&&API_STORE.longitude!==null&&Number.isFinite(Number(API_STORE.longitude));
    if(hasCoords||(API_STORE.city&&API_STORE.country)){
      setLocationStatusV5("Updating prayer times using "+methodNameV6(API_STORE.method)+"…");loadPrayerData();
    }else toast("Method saved. Set your current location to calculate prayer times.");
  };
  function startAutomaticLocationV6(){
    API_STORE.methodMode=localStorage.getItem("noor-method-mode")||"auto";
    var latText=localStorage.getItem("noor-latitude"),lonText=localStorage.getItem("noor-longitude");
    var lat=latText!==null&&latText!==""?Number(latText):null,lon=lonText!==null&&lonText!==""?Number(lonText):null;
    var hasCoords=Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
    var city=String(localStorage.getItem("noor-city")||API_STORE.city||"").trim(),country=String(localStorage.getItem("noor-country")||API_STORE.country||"").trim();
    var generic=/^(current location|my location|locating city[.…]*|choose your location)$/i;
    if(hasCoords){
      API_STORE.latitude=lat;API_STORE.longitude=lon;API_STORE.city=city;API_STORE.country=country;
      if(!city||!country||generic.test(city)){
        reverseGeocodeLocationV5(lat,lon).then(function(place){
          if(place&&place.city&&place.country){API_STORE.city=place.city;API_STORE.country=place.country;}
          if((API_STORE.methodMode||"auto")!=="manual")applyAutoMethodV6();
          persistLocationV5();syncLocationLabels();render();loadPrayerData();
        }).catch(function(){if((API_STORE.methodMode||"auto")!=="manual")applyAutoMethodV6();persistLocationV5();syncLocationLabels();loadPrayerData();});
      }else{
        if((API_STORE.methodMode||"auto")!=="manual")applyAutoMethodV6();
        persistLocationV5();syncLocationLabels();loadPrayerData();
      }
      return;
    }
    API_STORE.latitude=null;API_STORE.longitude=null;
    if(generic.test(city)){city="";country="";try{localStorage.removeItem("noor-city");localStorage.removeItem("noor-country");}catch(_){}}
    if(city&&country){
      API_STORE.city=city;API_STORE.country=country;
      if((API_STORE.methodMode||"auto")!=="manual")applyAutoMethodV6();
      persistLocationV5();syncLocationLabels();loadPrayerData();
      // A city was saved manually, so don't request GPS at every page load.
      return;
    }
    API_STORE.city="";API_STORE.country="";syncLocationLabels();
    function requestIfAvailable(){
      var savedCity=String(localStorage.getItem("noor-city")||"").trim();
      var savedCountry=String(localStorage.getItem("noor-country")||"").trim();
      var savedGps=localStorage.getItem("noor-latitude")!==null&&localStorage.getItem("noor-longitude")!==null;
      if(savedCity&&savedCountry||savedGps)return;
      if(navigator.permissions&&navigator.permissions.query){
        navigator.permissions.query({name:"geolocation"}).then(function(permission){
          if(permission.state==="granted"){
            useCurrentLocationV5();
          }else if(permission.state==="prompt"){
            // One request per tab session prevents a permission toast on every reload.
            if(!sessionStorage.getItem("noor-location-prompted-session")){
              sessionStorage.setItem("noor-location-prompted-session","1");
              useCurrentLocationV5();
            }else{
              setLocationStatusV5("Allow location access in your browser to fill your city and country automatically, then reload MOMIN.");
            }
          }else{
            setLocationStatusV5("Location permission is blocked. Open your browser's site settings, allow Location for MOMIN, then reload or tap Use current location.");
          }
        }).catch(function(){
          if(!sessionStorage.getItem("noor-location-prompted-session")){
            sessionStorage.setItem("noor-location-prompted-session","1");
            useCurrentLocationV5();
          }
        });
      }else if(!sessionStorage.getItem("noor-location-prompted-session")){
        sessionStorage.setItem("noor-location-prompted-session","1");
        useCurrentLocationV5();
      }else{
        setLocationStatusV5("Allow location access in your browser to fill your city and country automatically, then reload MOMIN.");
      }
    }
    window.setTimeout(requestIfAvailable,1200);
  }

  if(page==="prayers")render();
  startAutomaticLocationV6();

/* MOMIN_SETTINGS_SAVE_AND_INDIAN_TRANSLATIONS_V1 */
var mominIndianLanguagesV6=[
 {code:"as",name:"Assamese",native:"অসমীয়া"},{code:"bn",name:"Bengali",native:"বাংলা"},{code:"brx",name:"Bodo",native:"बड़ो"},
 {code:"doi",name:"Dogri",native:"डोगरी"},{code:"gu",name:"Gujarati",native:"ગુજરાતી"},{code:"hi",name:"Hindi",native:"हिन्दी"},
 {code:"kn",name:"Kannada",native:"ಕನ್ನಡ"},{code:"ks",name:"Kashmiri",native:"کٲشُر"},{code:"kok",name:"Konkani",native:"कोंकणी"},
 {code:"mai",name:"Maithili",native:"मैथिली"},{code:"ml",name:"Malayalam",native:"മലയാളം"},{code:"mni",name:"Manipuri (Meitei)",native:"মৈতৈলোন্"},
 {code:"mr",name:"Marathi",native:"मराठी"},{code:"ne",name:"Nepali",native:"नेपाली"},{code:"or",name:"Odia",native:"ଓଡ଼ିଆ"},
 {code:"pa",name:"Punjabi",native:"ਪੰਜਾਬੀ"},{code:"sa",name:"Sanskrit",native:"संस्कृतम्"},{code:"sat",name:"Santali",native:"ᱥᱟᱱᱛᱟᱲᱤ"},
 {code:"sd",name:"Sindhi",native:"سنڌي"},{code:"ta",name:"Tamil",native:"தமிழ்"},{code:"te",name:"Telugu",native:"తెలుగు"},
 {code:"ur",name:"Urdu",native:"اردو"}
];
var mominLanguageCodesV6={
 assamese:"as",bengali:"bn",bodo:"brx",dogri:"doi",gujarati:"gu",hindi:"hi",kannada:"kn",kashmiri:"ks",
 konkani:"kok",maithili:"mai",malayalam:"ml",manipuri:"mni",meitei:"mni",marathi:"mr",nepali:"ne",odia:"or",
 oriya:"or",punjabi:"pa",sanskrit:"sa",santali:"sat",santhali:"sat",sindhi:"sd",tamil:"ta",telugu:"te",urdu:"ur"
};
var mominTranslationCatalogPromiseV6=null;
function mominEscapeV6(value){return String(value==null?"":value).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]})}
function mominAppLanguageOptionsV6(){
 var selected=localStorage.getItem("noor-language")||"en";
 return '<option value="en" '+(selected==="en"?"selected":"")+' >English</option>'+
  mominIndianLanguagesV6.map(function(l){return '<option value="'+l.code+'" '+(selected===l.code?"selected":"")+'>'+l.name+' — '+l.native+'</option>'}).join("");
}
quranTranslationOptionsV5=function(){
 var active=quranTranslationEditionV5(),indianSet={};
 mominIndianLanguagesV6.forEach(function(l){indianSet[l.code]=true});
 var indian=quranTranslationsV5.filter(function(x){return x.language&&indianSet[x.language]});
 var other=quranTranslationsV5.filter(function(x){return !x.language||!indianSet[x.language]});
 var out='<optgroup label="Indian languages — available Quran translations">';
 out+=indian.map(function(x){return '<option value="'+mominEscapeV6(x.id)+'" '+(x.id===active?'selected':'')+'>'+mominEscapeV6(x.label)+'</option>'}).join('');
 out+='</optgroup>';
 var present={};indian.forEach(function(x){present[x.language]=true});
 var missing=mominIndianLanguagesV6.filter(function(l){return !present[l.code]});
 if(missing.length){
  out+='<optgroup label="Indian languages — not yet available">';
  out+=missing.map(function(l){return '<option value="unavailable:'+l.code+'" disabled>'+mominEscapeV6(l.name)+' — translation not connected yet</option>'}).join('');
  out+='</optgroup>';
 }
 out+='<optgroup label="Other Quran translations">';
 out+=other.map(function(x){return '<option value="'+mominEscapeV6(x.id)+'" '+(x.id===active?'selected':'')+'>'+mominEscapeV6(x.label)+'</option>'}).join('');
 out+='</optgroup>';
 return out;
};
window.loadIndianQuranTranslationsV6=loadIndianQuranTranslationsV6;
window.quranTranslationOptionsV5=quranTranslationOptionsV5;
translationDirectionV5=function(){
 var x=quranTranslationsV5.find(function(y){return y.id===quranTranslationEditionV5()});
 return x?x.dir||"ltr":((localStorage.getItem("noor-quran-edition-language")||"")==="ur"?"rtl":"ltr");
};
function translationLanguageV6(){
 var x=quranTranslationsV5.find(function(y){return y.id===quranTranslationEditionV5()});
 return x&&x.language?x.language:(localStorage.getItem("noor-quran-edition-language")||"en");
}
async function loadIndianQuranTranslationsV6(){
 if(mominTranslationCatalogPromiseV6)return mominTranslationCatalogPromiseV6;
 mominTranslationCatalogPromiseV6=(async function(){
  try{
   var first=await getJSON("https://api.quran.com/api/v4/resources/translations?per_page=50&page=1");
   var rows=first.translations||first.data&&first.data.translations||[];
   var pages=Number(first.pagination&&first.pagination.total_pages)||1;
   for(var p=2;p<=Math.min(pages,40);p++){
    var next=await getJSON("https://api.quran.com/api/v4/resources/translations?per_page=50&page="+p);
    rows=rows.concat(next.translations||next.data&&next.data.translations||[]);
   }
   var aliases={assamese:"as",bengali:"bn",bangla:"bn",bodo:"brx",dogri:"doi",gujarati:"gu",hindi:"hi",kannada:"kn",kashmiri:"ks",konkani:"kok",maithili:"mai",malayalam:"ml",manipuri:"mni",meitei:"mni",marathi:"mr",nepali:"ne",odia:"or",oriya:"or",punjabi:"pa",sanskrit:"sa",santali:"sat",santhali:"sat",sindhi:"sd",tamil:"ta",telugu:"te",urdu:"ur"};
   var known={};quranTranslationsV5.forEach(function(x){if(x.id)known[String(x.id)]=true});
   rows.forEach(function(t){
    var raw=String(t.language_name||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
    var code=aliases[raw]||mominLanguageCodesV6[raw],id=String(t.id||"");
    if(!code||!id||known["qcom:"+id])return;
    var language=mominIndianLanguagesV6.find(function(l){return l.code===code});
    if(!language)return;
    quranTranslationsV5.push({id:"qcom:"+id,label:language.name+" — "+String(t.name||t.author_name||"Quran translation"),language:code,dir:(code==="ur"||code==="sd"||code==="ks")?"rtl":"ltr",provider:"quran.com",translationId:id});
    known["qcom:"+id]=true;
   });
   var selectors=document.querySelectorAll('select[aria-label="Quran translation language"],#settingsQuranTranslation,#quranTranslationSelectV8');
   selectors.forEach(function(el){var prev=el.value;el.innerHTML=quranTranslationOptionsV5();if(Array.prototype.some.call(el.options,function(o){return o.value===prev}))el.value=prev});
   var status=document.getElementById("settingsTranslationStatusV6");
   if(status)status.textContent="Verified Quran translation editions loaded. Indian languages without a connected edition remain unavailable.";
   return quranTranslationsV5;
  }catch(error){
   var status=document.getElementById("settingsTranslationStatusV6");
   if(status)status.textContent="Could not refresh the translation catalogue. Existing available editions remain listed.";
   return quranTranslationsV5;
  }
 })();
 return mominTranslationCatalogPromiseV6;
}
function cleanQuranComTextV6(value){
 var holder=document.createElement("div");holder.innerHTML=String(value==null?"":value);
 return String(holder.textContent||holder.innerText||"").replace(/\s+/g," ").trim();
}
/* Settings view with explicit Save buttons: values are staged until the relevant button is pressed. */
var settingsPageBeforeSaveV6=settingsPage;
settingsPage=function(){
 window.settingsMethodModeDraftV6=localStorage.getItem("noor-method-mode")||"auto";
 var html=settingsPageBeforeSaveV6();
 html=html.replace('onchange="setPrayerMethodV5(this.value)"','onchange="window.settingsMethodModeDraftV6=\'manual\'"');
 html=html.replace('onclick="setPrayerMethodV5(&quot;auto&quot;)"','onclick="draftAutoPrayerMethodV6()"');
 var asr=localStorage.getItem("noor-asr-method")||"standard";
 html=html.replace(/<select><option>Standard<\/option><option>Hanafi<\/option><\/select>/,
  '<select id="settingsAsrMethod"><option value="standard" '+(asr==="standard"?"selected":"")+'>Standard</option><option value="hanafi" '+(asr==="hanafi"?"selected":"")+'>Hanafi</option></select>');
 var notifications=localStorage.getItem("noor-notifications")!=="false";
 html=html.replace(/<input class="toggle" type="checkbox" checked onchange="saveSetting\(&quot;notifications&quot;,this.checked\)">/,
  '<input id="settingsPrayerNotifications" class="toggle" type="checkbox" '+(notifications?"checked":"")+' >');
 var adhan=localStorage.getItem("noor-adhan-sound")||"chime";
 html=html.replace(/<select><option>Gentle chime<\/option><option>Adhan · Makkah<\/option><option>Adhan · Madinah<\/option><option>Silent<\/option><\/select>/,
  '<select id="settingsAdhanSound"><option value="chime" '+(adhan==="chime"?"selected":"")+'>Gentle chime</option><option value="makkah" '+(adhan==="makkah"?"selected":"")+'>Adhan · Makkah</option><option value="madinah" '+(adhan==="madinah"?"selected":"")+'>Adhan · Madinah</option><option value="silent" '+(adhan==="silent"?"selected":"")+'>Silent</option></select>');
 html=html.replace(/<div class="setting"><div><b>Quran translation<\/b><small>Default translation<\/small><\/div><select>[\s\S]*?<\/select><\/div>/,
  '<div class="setting"><div><b>Quran translation</b><small>Available translation editions</small></div><select id="settingsQuranTranslation">'+quranTranslationOptionsV5()+'</select></div><p class="settings-note" id="settingsTranslationStatusV6">Loading available Indian-language translation editions…</p>');
 html=html.replace(/<div class="setting"><div><b>Language<\/b><small>App display language<\/small><\/div><select>[\s\S]*?<\/select><\/div>/,
  '<div class="setting"><div><b>App language</b><small>English and India’s 22 scheduled languages</small></div><select id="settingsAppLanguage">'+mominAppLanguageOptionsV6()+'</select></div><p class="settings-note">This saves your app-language preference; some screens may remain in English until their translations are available.</p>');
 var theme=localStorage.getItem("noor-theme")||"Dark";
 html=html.replace(/<select onchange="setTheme\(this\.value\)">[\s\S]*?<\/select>/,
  '<select id="settingsTheme"><option value="Light" '+(theme==="Light"?"selected":"")+'>Light</option><option value="Sepia" '+(theme==="Sepia"?"selected":"")+'>Sepia</option><option value="Dark" '+(theme==="Dark"?"selected":"")+'>Dark</option></select>');
 var keepAwake=localStorage.getItem("noor-keep-awake")==="true";
 html=html.replace(/<div class="setting"><div><b>Keep screen awake<\/b><small>While reading Quran<\/small><\/div><input class="toggle" type="checkbox"><\/div>/,
  '<div class="setting"><div><b>Keep screen awake</b><small>While reading Quran</small></div><input id="settingsKeepAwake" class="toggle" type="checkbox" '+(keepAwake?"checked":"")+'></div>');
 /* The buttons are inserted before the closing tags of their respective cards. */
 html=html.replace('</div><div class="card"><h3>Reading & appearance</h3>',
  '<div class="settings-save-actions"><button type="button" class="settings-save-btn" onclick="savePrayerSettingsV6()">Save prayer settings</button></div></div><div class="card"><h3>Reading & appearance</h3>');
 html=html.replace('</div></div></div><div class="card" style="margin-top:16px">',
  '</div><div class="settings-save-actions"><button type="button" class="settings-save-btn" onclick="saveReadingAppearanceV6()">Save reading & appearance</button></div></div></div><div class="card" style="margin-top:16px">');
 return html;
};
window.settingsMethodModeDraftV6="auto";
window.draftAutoPrayerMethodV6=function(){
 window.settingsMethodModeDraftV6="auto";
 var select=document.getElementById("settingsMethodInput");
 if(select&&typeof countryMethodIdV6==="function")select.value=String(countryMethodIdV6(API_STORE.country||""));
 toast("Auto-detect selected. Tap Save prayer settings to apply it.");
};
window.savePrayerSettingsV6=function(){
 var method=document.getElementById("settingsMethodInput");
 var asr=document.getElementById("settingsAsrMethod");
 var notifications=document.getElementById("settingsPrayerNotifications");
 var sound=document.getElementById("settingsAdhanSound");
 if(method){
  var mode=window.settingsMethodModeDraftV6||localStorage.getItem("noor-method-mode")||"auto";
  var methodId=String(method.value||"3");
  if(mode==="auto"&&typeof countryMethodIdV6==="function")methodId=String(countryMethodIdV6(API_STORE.country||""));
  if(!Object.keys(PRAYER_METHODS).some(function(k){return String(PRAYER_METHODS[k])===methodId})){
   toast("Choose a valid calculation method before saving.");return;
  }
  saveMethodV6(mode,methodId);
 }
 if(asr)localStorage.setItem("noor-asr-method",asr.value);
 if(notifications)localStorage.setItem("noor-notifications",notifications.checked?"true":"false");
 if(sound)localStorage.setItem("noor-adhan-sound",sound.value);
 render();
 if((API_STORE.latitude!==null&&API_STORE.longitude!==null)||(API_STORE.city&&API_STORE.country))loadPrayerData();
 toast("Prayer settings saved on this device.");
};
window.saveReadingAppearanceV6=function(){
 var edition=document.getElementById("settingsQuranTranslation");
 var language=document.getElementById("settingsAppLanguage");
 var theme=document.getElementById("settingsTheme");
 var awake=document.getElementById("settingsKeepAwake");
 if(edition){
  if(edition.value.indexOf("unavailable:")===0){toast("No connected Quran translation is available for that language yet.");return;}
  if(!quranTranslationsV5.some(function(x){return x.id===edition.value})){
   loadIndianQuranTranslationsV6();toast("Translation editions are still loading. Please try again in a moment.");return;
  }
  localStorage.setItem("noor-quran-edition",edition.value);
  var selected=quranTranslationsV5.find(function(x){return x.id===edition.value});
  if(selected&&selected.language)localStorage.setItem("noor-quran-edition-language",selected.language);
 }
 if(language){
  localStorage.setItem("noor-language",language.value);
  document.documentElement.lang=language.value==="en"?"en":language.value;
 }
 if(theme&&typeof setTheme==="function")setTheme(theme.value);
 if(awake)localStorage.setItem("noor-keep-awake",awake.checked?"true":"false");
 var status=document.getElementById("settingsTranslationStatusV6");
 if(status)status.textContent="Saved. The Quran reader uses the selected translation when you open a Surah. Interface localization is still partial.";
 toast("Reading & appearance saved on this device.");
};
window.retryIndianQuranTranslationsV6=function(){mominTranslationCatalogPromiseV6=null;loadIndianQuranTranslationsV6()};
var readSurahBeforeQuranComV6=readSurah;
readSurah=async function(n){
 var edition=quranTranslationEditionV5();
 if(edition.indexOf("qcom:")!==0)return readSurahBeforeQuranComV6(n);
 n=Number(n)||1;
 var chapter=chapters[n-1];
 if(!chapter){toast("Surah list is still loading");return;}
 var token=++readerRequestToken;
 stopAudio();selectedSurah=chapter.englishName;
 localStorage.setItem("noor-surah",selectedSurah);localStorage.setItem("noor-surah-number",n);
 currentVerses=[];readerLoading=true;render();
 var status=document.getElementById("loadStatus");
 if(status)status.textContent="Loading Arabic, transliteration, and the selected translation…";
 try{
  var translationId=edition.slice(5);
  var mainResult=await getJSON("https://api.alquran.cloud/v1/surah/"+n+"/editions/quran-uthmani,en.transliteration");
  if(token!==readerRequestToken)return;
  var arabic=mainResult.data.find(function(x){return x.edition&&x.edition.identifier==="quran-uthmani"});
  var trans=mainResult.data.find(function(x){return x.edition&&x.edition.identifier==="en.transliteration"});
  if(!arabic)throw Error("Arabic Quran text could not load");
  var first=await getJSON("https://api.quran.com/api/v4/translations/"+encodeURIComponent(translationId)+"?chapter_number="+n+"&fields=verse_key&per_page=50&page=1");
  var rows=first.translations||first.data&&first.data.translations||[];
  var pages=Number(first.pagination&&first.pagination.total_pages)||1;
  for(var p=2;p<=Math.min(pages,10);p++){
   var next=await getJSON("https://api.quran.com/api/v4/translations/"+encodeURIComponent(translationId)+"?chapter_number="+n+"&fields=verse_key&per_page=50&page="+p);
   rows=rows.concat(next.translations||next.data&&next.data.translations||[]);
  }
  if(token!==readerRequestToken)return;
  var byKey={};rows.forEach(function(row){var key=String(row.verse_key||((row.chapter_id||n)+":"+row.verse_number));byKey[key]=cleanQuranComTextV6(row.text)});
  currentVerses=arabic.ayahs.map(function(v){
   var text=v.text;if(n!==1&&n!==9&&Number(v.numberInSurah)===1)text=stripOpeningBismillahV5(text);
   return {number:v.number,numberInSurah:v.numberInSurah,text:text,translation:byKey[n+":"+v.numberInSurah]||"",transliteration:trans&&trans.ayahs[v.numberInSurah-1]&&trans.ayahs[v.numberInSurah-1].text||"",surah:arabic.englishName};
  });
  if(!currentVerses.some(function(v){return v.translation}))throw Error("No translation text was returned");
  readerLoading=false;render();localStorage.setItem("noor-last-verse",n+":1");
  localStorage.setItem("noor-quran-progress",selectedSurah+" · Ayah 1");
  if(typeof saveQuranRecent==="function")saveQuranRecent(n,1);
 }catch(error){
  if(token!==readerRequestToken)return;
  readerLoading=false;render();
  var err=document.getElementById("loadStatus");
  if(err)err.textContent="Unable to load this translation. Try another available edition or check your connection.";
  toast("The selected Quran translation could not load.");
 }
};
/* Keep translation language metadata valid for both AlQuranCloud and Quran.com editions. */
var oldVerseMarkupLangV6=verseMarkup;
verseMarkup=function(){
 var html=oldVerseMarkupLangV6();
 var lang=translationLanguageV6();
 return html.replace(/lang="qcom:[^"]+"/g,'lang="'+lang+'"');
};
loadIndianQuranTranslationsV6();



/* MOMIN_QURAN_TRANSLITERATION_SETTINGS_V7 */
var mominTransliterationLanguagesV7=[
 {code:"en",name:"English — Roman transliteration",native:"Latin",target:"",dir:"ltr"},
 {code:"as",name:"Assamese — অসমীয়া",native:"Assamese script",target:"as",dir:"ltr"},
 {code:"bn",name:"Bengali — বাংলা",native:"Bengali script",target:"bn",dir:"ltr"},
 {code:"brx",name:"Bodo — Devanagari fallback",native:"Devanagari script",target:"hi",dir:"ltr",fallback:true},
 {code:"doi",name:"Dogri — Devanagari fallback",native:"Devanagari script",target:"hi",dir:"ltr",fallback:true},
 {code:"gu",name:"Gujarati — ગુજરાતી",native:"Gujarati script",target:"gu",dir:"ltr"},
 {code:"hi",name:"Hindi — हिन्दी",native:"Devanagari script",target:"hi",dir:"ltr"},
 {code:"kn",name:"Kannada — ಕನ್ನಡ",native:"Kannada script",target:"kn",dir:"ltr"},
 {code:"ks",name:"Kashmiri — Urdu-script fallback",native:"Urdu script",target:"ur",dir:"rtl",fallback:true},
 {code:"kok",name:"Konkani — Devanagari fallback",native:"Devanagari script",target:"hi",dir:"ltr",fallback:true},
 {code:"mai",name:"Maithili — Devanagari fallback",native:"Devanagari script",target:"hi",dir:"ltr",fallback:true},
 {code:"ml",name:"Malayalam — മലയാളം",native:"Malayalam script",target:"ml",dir:"ltr"},
 {code:"mni",name:"Manipuri (Meitei) — Bengali-script fallback",native:"Bengali-compatible script",target:"bn",dir:"ltr",fallback:true},
 {code:"mr",name:"Marathi — मराठी",native:"Devanagari script",target:"mr",dir:"ltr"},
 {code:"ne",name:"Nepali — नेपाली",native:"Devanagari script",target:"ne",dir:"ltr"},
 {code:"or",name:"Odia — ଓଡ଼ିଆ",native:"Odia script",target:"or",dir:"ltr"},
 {code:"pa",name:"Punjabi — ਪੰਜਾਬੀ",native:"Gurmukhi script",target:"pa",dir:"ltr"},
 {code:"sa",name:"Sanskrit — Devanagari fallback",native:"Devanagari script",target:"hi",dir:"ltr",fallback:true},
 {code:"sat",name:"Santali — Bengali-script fallback",native:"Bengali-compatible script",target:"bn",dir:"ltr",fallback:true},
 {code:"sd",name:"Sindhi — سنڌي / Urdu-script fallback",native:"Urdu script",target:"ur",dir:"rtl",fallback:true},
 {code:"ta",name:"Tamil — தமிழ்",native:"Tamil script",target:"ta",dir:"ltr"},
 {code:"te",name:"Telugu — తెలుగు",native:"Telugu script",target:"te",dir:"ltr"},
 {code:"ur",name:"Urdu — اردو",native:"Urdu script",target:"ur",dir:"rtl"}
];
var mominTranslitCacheV7=Object.create(null);
var mominTranslitQueueV7=[];
var mominTranslitActiveV7=0;
var mominTranslitInflightV7=Object.create(null);
var mominTranslitObserverV7=null;
function mominTranslitChoiceV7(){
 var wanted=localStorage.getItem("noor-quran-translit-language")||"en";
 return mominTransliterationLanguagesV7.find(function(x){return x.code===wanted})||mominTransliterationLanguagesV7[0];
}
function mominTranslitOptionsV7(){
 var current=mominTranslitChoiceV7().code;
 return mominTransliterationLanguagesV7.map(function(x){
  return '<option value="'+x.code+'" '+(x.code===current?"selected":"")+'>'+mominEscapeV6(x.name)+'</option>';
 }).join("");
}
function mominTranslitSettingsSectionV7(){
 return '<div class="reader-settings-section-title">Arabic transliteration</div>'+
  '<label class="reader-setting"><span>Transliteration language</span><select id="readerTranslitLanguageV7" aria-label="Arabic transliteration language" onchange="setArabicTransliterationLanguageV7(this.value)">'+mominTranslitOptionsV7()+'</select></label>'+
  '<p class="reader-settings-hint" id="readerTranslitNoteV7" role="status">This changes the Arabic pronunciation into another script; it does not translate the meaning.</p>';
}
var quranReaderBeforeTranslitSettingsV7=quranReaderPageV2;
quranReaderPageV2=function(){
 var html=quranReaderBeforeTranslitSettingsV7();
 var anchor='</select></label></div><div class="reading-goal">';
 if(html.indexOf(anchor)>=0){
  html=html.replace(anchor,'</select></label>'+mominTranslitSettingsSectionV7()+'</div><div class="reading-goal">');
 }
 return html;
};
function updateTranslitNoteV7(){
 var choice=mominTranslitChoiceV7(),note=document.getElementById("readerTranslitNoteV7");
 if(!note)return;
 if(choice.code==="en"){
  note.textContent="Shows the original Roman pronunciation. Transliteration is not a meaning translation.";
 }else if(choice.fallback){
  note.textContent="Uses a related supported script for phonetic rendering, not the language’s unique native script. The Arabic text remains the source.";
 }else{
  note.textContent="Renders the Roman pronunciation in "+choice.native+". This is phonetic transliteration, not a translation of the ayah meaning.";
 }
}
window.setArabicTransliterationLanguageV7=function(code){
 if(!mominTransliterationLanguagesV7.some(function(x){return x.code===code}))return;
 localStorage.setItem("noor-quran-translit-language",code);
 updateTranslitNoteV7();scheduleArabicTransliterationV7();
};
function parseGoogleTranslitV7(result){
 if(!Array.isArray(result)||result[0]!=="SUCCESS"||!Array.isArray(result[1]))return "";
 return result[1].map(function(row){
  return Array.isArray(row)&&Array.isArray(row[1])&&row[1].length?String(row[1][0]||""):"";
 }).filter(Boolean).join(" ").trim();
}
async function requestGoogleTranslitV7(text,code){
 var language=mominTransliterationLanguagesV7.find(function(x){return x.code===code})||mominTransliterationLanguagesV7[0];
 if(!language.target)return text;
 var url="https://inputtools.google.com/request?text="+encodeURIComponent(text)+
  "&itc="+encodeURIComponent(language.target+"-t-i0-und")+
  "&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test";
 var result=await getJSON(url);
 return parseGoogleTranslitV7(result);
}
function renderTranslitNodeV7(el,lang,roman){
 var choice=mominTransliterationLanguagesV7.find(function(x){return x.code===lang})||mominTransliterationLanguagesV7[0];
 var key=lang+"|"+roman;
 el.setAttribute("data-translit-key",key);
 el.setAttribute("lang",choice.target||"en");
 el.setAttribute("dir",choice.dir||"ltr");
 if(lang==="en"){
  el.textContent=roman;el.title="Roman pronunciation";el.setAttribute("data-translit-request",key);return;
 }
 if(mominTranslitCacheV7[key]){
  el.textContent=mominTranslitCacheV7[key];
  el.title=choice.fallback?"Rendered in a related script as a fallback.":"Phonetic transliteration.";
  el.setAttribute("data-translit-request",key);return;
 }
 el.textContent="Transliterating…";
 el.setAttribute("data-translit-request",key);
 enqueueTranslitNodeV7(el,lang,roman,key);
}
function enqueueTranslitNodeV7(el,lang,roman,key){
 if(!el||!roman||lang==="en"||mominTranslitCacheV7[key]||mominTranslitInflightV7[key]||el.getAttribute("data-translit-enqueued")===key)return;
 el.setAttribute("data-translit-enqueued",key);
 mominTranslitQueueV7.push({el:el,lang:lang,roman:roman,key:key});
 drainTranslitQueueV7();
}
function drainTranslitQueueV7(){
 while(mominTranslitActiveV7<3&&mominTranslitQueueV7.length){
  (function(job){
   mominTranslitActiveV7++;mominTranslitInflightV7[job.key]=true;
   requestGoogleTranslitV7(job.roman,job.lang).then(function(converted){
    if(converted)mominTranslitCacheV7[job.key]=converted;
    document.querySelectorAll(".ayah-transliteration[data-roman]").forEach(function(node){
     if(node.getAttribute("data-translit-key")!==job.key||node.getAttribute("data-translit-request")!==job.key)return;
     if(converted){
      node.textContent=converted;
      var meta=mominTransliterationLanguagesV7.find(function(x){return x.code===job.lang});
      node.title=meta&&meta.fallback?"Rendered in a related script as a fallback.":"Phonetic transliteration.";
     }else{
      node.textContent=node.getAttribute("data-roman")||job.roman;
      node.setAttribute("lang","en");node.setAttribute("dir","ltr");
      node.title="Script conversion failed; Roman pronunciation is shown instead.";
     }
    });
   }).catch(function(){
    document.querySelectorAll(".ayah-transliteration[data-roman]").forEach(function(node){
     if(node.getAttribute("data-translit-key")===job.key&&node.getAttribute("data-translit-request")===job.key){
      node.textContent=node.getAttribute("data-roman")||job.roman;
      node.setAttribute("lang","en");node.setAttribute("dir","ltr");
      node.title="Script conversion failed; Roman pronunciation is shown instead.";
     }
    });
   }).finally(function(){delete mominTranslitInflightV7[job.key];mominTranslitActiveV7--;drainTranslitQueueV7();});
  })(mominTranslitQueueV7.shift());
 }
}
function scheduleArabicTransliterationV7(){
 updateTranslitNoteV7();
 var root=document.querySelector(".quran-reader");
 if(!root||root.classList.contains("reader-translations-hidden"))return;
 var language=localStorage.getItem("noor-quran-translit-language")||"en";
 root.querySelectorAll(".ayah-transliteration[data-roman]").forEach(function(el){
  var roman=el.getAttribute("data-roman")||"";
  if(roman)renderTranslitNodeV7(el,language,roman);
 });
}
var verseMarkupBeforeTranslitV7=verseMarkup;
verseMarkup=function(){
 var result=verseMarkupBeforeTranslitV7(),language=localStorage.getItem("noor-quran-translit-language")||"en",index=0;
 return result.replace(/<div class="ayah-transliteration" lang="[^"]*">([\s\S]*?)<\/div>/g,function(match){
  while(index<currentVerses.length&&!currentVerses[index].transliteration)index++;
  var verse=currentVerses[index++];
  if(!verse)return match;
  var roman=String(verse.transliteration||""),choice=mominTransliterationLanguagesV7.find(function(x){return x.code===language})||mominTransliterationLanguagesV7[0];
  var key=language+"|"+roman,shown=language==="en"?roman:(mominTranslitCacheV7[key]||"Transliterating…");
  return '<div class="ayah-transliteration" lang="'+(choice.target||"en")+'" dir="'+(choice.dir||"ltr")+'" data-roman="'+escapeAppHtmlV5(roman)+'" data-translit-key="'+escapeAppHtmlV5(key)+'" data-translit-request="'+escapeAppHtmlV5(key)+'">'+escapeAppHtmlV5(shown)+'</div>';
 });
};
var renderBeforeTranslitScheduleV7=render;
render=function(){renderBeforeTranslitScheduleV7();window.setTimeout(scheduleArabicTransliterationV7,0);};


})();
