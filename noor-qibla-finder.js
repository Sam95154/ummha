
/* MOMIN Qibla Finder: responsive compass, true-north bearing, distance, coordinates, GPS and manual location controls.
   Adapted from the user-provided qibla-finder.html for the existing MOMIN single-page shell. */
(function(){
  'use strict';
  var KAABA={lat:21.4225,lng:39.8262};
  var CITIES=[
    ["Hyderabad, India",17.385,78.4867],["Nandyal, India",15.4786,78.4836],["Kurnool, India",15.8281,78.0373],
    ["Tirupati, India",13.6288,79.4192],["Vijayawada, India",16.5062,80.648],["Visakhapatnam, India",17.6868,83.2185],
    ["Bengaluru, India",12.9716,77.5946],["Chennai, India",13.0827,80.2707],["Mumbai, India",19.076,72.8777],
    ["Delhi, India",28.6139,77.209],["Kolkata, India",22.5726,88.3639],["Dubai, UAE",25.2048,55.2708],
    ["London, UK",51.5072,-0.1276],["New York, USA",40.7128,-74.006],["Sydney, Australia",-33.8688,151.2093]
  ];
  var WINDS=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  var mqState=null, mqLiveHandler=null, mqCompassActive=false, mqDialRotation=0, mqNeedleRotation=0;
  function validCoord(lat,lng){
    if(lat===null||lat===undefined||lng===null||lng===undefined||lat===""||lng==="")return null;
    lat=Number(lat);lng=Number(lng);
    return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180?{lat:lat,lng:lng}:null;
  }
  function currentCoordinates(){
    try{
      if(typeof API_STORE!=="undefined"){
        var own=validCoord(API_STORE.latitude,API_STORE.longitude);
        if(own)return own;
      }
    }catch(_){}
    try{
      if(typeof qiblaCoordinatesV5==="function"){
        var pair=qiblaCoordinatesV5();
        if(pair){var p=validCoord(pair.latitude,pair.longitude);if(p)return p;}
      }
    }catch(_){}
    return null;
  }
  function currentLabel(){
    try{if(typeof currentLocationLabelV5==="function")return currentLocationLabelV5()}catch(_){}
    try{return [API_STORE.city,API_STORE.country].filter(Boolean).join(", ")||"Choose your location"}catch(_){return "Choose your location"}
  }
  function currentHeading(){
    try{if(typeof qiblaHeadingV5!=="undefined"&&qiblaHeadingV5!==null&&Number.isFinite(Number(qiblaHeadingV5)))return normalize(Number(qiblaHeadingV5))}catch(_){}
    return mqState&&Number.isFinite(mqState.heading)?mqState.heading:0;
  }
  function normalize(x){return ((Number(x)%360)+360)%360}
  function rad(x){return x*Math.PI/180}
  function bearing(lat,lng){
    var p1=rad(lat),p2=rad(KAABA.lat),dl=rad(KAABA.lng-lng);
    var y=Math.sin(dl)*Math.cos(p2);
    var x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
    return normalize(Math.atan2(y,x)*180/Math.PI);
  }
  function distanceKm(lat,lng){
    var p1=rad(lat),p2=rad(KAABA.lat),dp=p2-p1,dl=rad(KAABA.lng-lng);
    var a=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
    return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
  }
  function safeText(s){return String(s===null||s===undefined?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function currentCountry(){try{return String(API_STORE.country||"")}catch(_){return ""}}
  function getTheme(){try{var t=String(localStorage.getItem("noor-theme")||"Dark").toLowerCase();return t==="light"||t==="sepia"?"light":"dark"}catch(_){return "dark"}}
  function stateFromApp(){
    var pos=currentCoordinates(), lat=pos?pos.lat:null,lng=pos?pos.lng:null;
    var savedCity="",savedCountry="";
    try{savedCity=String(API_STORE.city||"");savedCountry=String(API_STORE.country||"")}catch(_){}
    return {lat:lat,lng:lng,city:savedCity,country:savedCountry,heading:currentHeading(),status:mqState&&mqState.status?mqState.status:(pos?"Using MOMIN's saved location.":"Choose a city or enable location to calculate the Qibla."),live:mqCompassActive};
  }
  function tickMarkup(){
    var out="";
    for(var d=0;d<360;d+=5){
      var major=d%30===0,r1=major?168:176,r2=186,s=Math.sin(rad(d)),c=-Math.cos(rad(d));
      out+='<line class="'+(major?"mq-s-tick-major":"mq-s-tick")+'" x1="'+(200+r1*s).toFixed(3)+'" y1="'+(200+r1*c).toFixed(3)+'" x2="'+(200+r2*s).toFixed(3)+'" y2="'+(200+r2*c).toFixed(3)+'"></line>';
    }
    return out;
  }
  function labelMarkup(){
    var out="";
    [["N",0],["E",90],["S",180],["W",270]].forEach(function(p){
      var a=rad(p[1]);
      out+='<text class="mq-t-card '+(p[0]==="N"?"mq-t-north":"")+'" x="'+(200+128*Math.sin(a)).toFixed(3)+'" y="'+(200-128*Math.cos(a)).toFixed(3)+'">'+p[0]+'</text>';
    });
    for(var g=30;g<360;g+=30){
      if(g%90===0)continue;
      var a2=rad(g);
      out+='<text class="mq-t-deg" x="'+(200+140*Math.sin(a2)).toFixed(3)+'" y="'+(200-140*Math.cos(a2)).toFixed(3)+'">'+g+'</text>';
    }
    return out;
  }
  function cityOptions(){
    var out='<option value="" '+(!mqState||mqState.lat===null?'selected':'')+'>Choose a city…</option>';
    if(mqState&&mqState.lat!==null){
      out+='<option value="current" selected>Current MOMIN location — '+safeText(currentLabel())+'</option>';
    }else out+='<option value="current">Use my current location (GPS)</option>';
    CITIES.forEach(function(c,i){
      var sel="";
      if(mqState&&mqState.lat!==null&&Math.abs(mqState.lat-c[1])<0.001&&Math.abs(mqState.lng-c[2])<0.001)sel=" selected";
      out+='<option value="city:'+i+'"'+sel+'>'+safeText(c[0])+'</option>';
    });
    out+='<option value="custom">Custom coordinates</option>';
    return out;
  }
  function renderReadoutHtml(){
    var has=mqState&&mqState.lat!==null&&mqState.lng!==null;
    var b=has?bearing(mqState.lat,mqState.lng):null;
    var h=mqState?normalize(mqState.heading||0):0;
    var dist=has?distanceKm(mqState.lat,mqState.lng):null;
    var turn=b===null?null:((b-h+540)%360)-180;
    var turnText=b===null?'Choose a city or enable GPS to calculate the direction to the Kaaba.':dist<1?'You are at the Kaaba.':Math.abs(turn)<1?'<b>Facing the Qibla.</b>':'Turn <b>'+Math.abs(Math.round(turn))+'° '+(turn>0?'right':'left')+'</b> from your current heading.';
    var bearingText=b===null?'—':b.toFixed(1);
    var card=b===null?'Set location':WINDS[Math.round(b/22.5)%16];
    var distanceText=dist===null?'—':Math.round(dist).toLocaleString('en-US')+' km';
    var initialText=b===null?'—':WINDS[Math.round(b/22.5)%16]+' · '+b.toFixed(0)+'°';
    var latText=has?Math.abs(mqState.lat).toFixed(4)+'° '+(mqState.lat>=0?'N':'S'):'—';
    var lngText=has?Math.abs(mqState.lng).toFixed(4)+'° '+(mqState.lng>=0?'E':'W'):'—';
    return {has:has,bearing:b,heading:h,turn:turn,turnText:turnText,bearingText:bearingText,cardinal:card,distance:distanceText,initial:initialText,lat:latText,lng:lngText};
  }
  function qiblaPageMarkup(){
    var v=renderReadoutHtml(),s= mqState||stateFromApp();
    var selectValue=s.lat===null?"":("current");
    var needleTransform=v.bearing===null?"rotate(0 200 200)":"rotate("+v.bearing.toFixed(4)+" 200 200)";
    return '<section class="momin-qibla-finder" data-theme="'+getTheme()+'"><div class="mq-wrap">'+
      '<header class="mq-header"><div><p class="mq-kicker">MOMIN · DIRECTION</p><h1>Qibla Finder</h1><p class="mq-sub">Direction of the Kaaba from your location</p></div><div class="mq-kaaba-ref">KAABA · 21.4225° N, 39.8262° E</div></header>'+
      '<main class="mq-main">'+
        '<section class="mq-dial-card" aria-label="Qibla compass">'+
          '<svg class="mq-svg" viewBox="0 0 400 400" role="img" aria-labelledby="mqDialTitle"><title id="mqDialTitle">Compass dial with a needle pointing to the Qibla</title>'+
            '<g id="mqDial" class="mq-rot" style="transform-origin:200px 200px;transform:rotate('+(-v.heading)+'deg)">'+
              '<circle class="mq-s-dial" cx="200" cy="200" r="190"></circle><circle class="mq-s-ring" cx="200" cy="200" r="150"></circle>'+
              '<g id="mqTicks">'+tickMarkup()+'</g><g id="mqLabels">'+labelMarkup()+'</g>'+
              '<g id="mqNeedle" class="mq-rot" style="transform-origin:200px 200px;transform:'+needleTransform+';visibility:'+(v.bearing===null?'hidden':'visible')+'">'+
                '<path class="mq-needle-body" d="M200 62 L211 200 L200 188 L189 200 Z"></path><path class="mq-needle-tail" d="M200 200 L200 292"></path>'+
                '<g transform="translate(200 52)"><rect class="mq-kaaba-box" x="-13" y="-13" width="26" height="26" rx="2"></rect><rect class="mq-kaaba-band" x="-13" y="-6" width="26" height="4"></rect><path d="M-5 -1h10 M-5 3h10" stroke="#a67c2e" stroke-width="1"></path></g>'+
              '</g></g><path class="mq-lug" d="M200 6 L210 -6 L190 -6 Z" transform="translate(0 14)"></path><circle class="mq-hub" cx="200" cy="200" r="9"></circle>'+
          '</svg>'+
          '<div class="mq-slider-row"><label class="mq-slider-label" for="mqHeading"><span>Your facing direction</span><output id="mqHeadingOut">'+Math.round(v.heading)+'°</output></label><input id="mqHeading" type="range" min="0" max="359" step="1" value="'+Math.round(v.heading)+'" oninput="window.mqQiblaSetHeading(this.value)"></div>'+
          '<button type="button" class="mq-live-btn" id="mqEnableCompass" onclick="window.mqQiblaEnableLiveCompass()">'+(mqCompassActive?'Live compass active':'Enable live compass')+'</button>'+
          '<p class="mq-compass-status" id="mqCompassStatus" role="status">'+safeText(s.status||'Set the slider to your phone direction, or enable the live compass.')+'</p>'+
          '<p class="mq-hint">The dial rotates with your facing direction. If live compass is unavailable, set the slider to match your phone or hand compass.</p>'+
        '</section>'+
        '<div class="mq-side">'+
          '<section class="mq-result" aria-live="polite"><div class="mq-eyebrow">Qibla bearing from true north</div><div class="mq-bearing"><b id="mqBearing" style="font-weight:inherit">'+v.bearingText+'</b><span id="mqCardinal">'+v.cardinal+'</span></div><p class="mq-turn" id="mqTurn">'+v.turnText+'</p></section>'+
          '<dl class="mq-dl"><div><dt>Distance to Kaaba</dt><dd id="mqDistance">'+v.distance+'</dd></div><div><dt>Direction of travel</dt><dd id="mqInitial">'+v.initial+'</dd></div><div><dt>Latitude</dt><dd id="mqLatOut">'+v.lat+'</dd></div><div><dt>Longitude</dt><dd id="mqLngOut">'+v.lng+'</dd></div></dl>'+
          '<form class="mq-form" id="mqLocationForm" onsubmit="return window.mqQiblaApplyLocation(event)"><h2>Location</h2>'+
            '<div class="mq-field"><label for="mqCity">Choose a city or current location</label><select id="mqCity" onchange="window.mqQiblaChooseCity(this.value)">'+cityOptions()+'</select></div>'+
            '<div class="mq-row"><div class="mq-field"><label for="mqLat">Latitude</label><input id="mqLat" type="number" step="0.0001" min="-90" max="90" inputmode="decimal" placeholder="e.g. 17.3850" value="'+(v.has?safeText(mqState.lat):'')+'" oninput="window.mqQiblaPreviewCoordinates()"></div>'+
            '<div class="mq-field"><label for="mqLng">Longitude</label><input id="mqLng" type="number" step="0.0001" min="-180" max="180" inputmode="decimal" placeholder="e.g. 78.4867" value="'+(v.has?safeText(mqState.lng):'')+'" oninput="window.mqQiblaPreviewCoordinates()"></div></div>'+
            '<div class="mq-actions"><button type="button" class="mq-live-btn" onclick="window.mqQiblaUseCurrentLocation()">Use my current location</button><button type="submit" class="mq-action-btn">Update location</button></div>'+
            '<p class="mq-err" id="mqErr" role="alert"></p><p class="mq-legend">Choose a city, use GPS, or enter exact coordinates. North is positive latitude; east is positive longitude.</p>'+
          '</form>'+
        '</div>'+
      '</main>'+
      '<footer class="mq-footer">Bearings are measured clockwise from true north along the great circle to the Kaaba. A phone compass may show magnetic north, so nearby magnets and local magnetic declination can affect fine accuracy.</footer>'+
    '</div></section>';
  }
  function updateUi(){
    if(!mqState)return;
    var v=renderReadoutHtml();
    var byId=function(id){return document.getElementById(id)};
    var dial=byId("mqDial"),needle=byId("mqNeedle");
    if(dial)dial.style.transform="rotate("+(-v.heading)+"deg)";
    if(needle){needle.style.transform="rotate("+(v.bearing===null?0:v.bearing)+"deg)";needle.style.visibility=v.bearing===null?"hidden":"visible";}
    var txt={mqHeadingOut:Math.round(v.heading)+"°",mqBearing:v.bearingText,mqCardinal:v.cardinal,mqTurn:null,mqDistance:v.distance,mqInitial:v.initial,mqLatOut:v.lat,mqLngOut:v.lng,mqCompassStatus:mqState.status};
    Object.keys(txt).forEach(function(id){var el=byId(id);if(el&&txt[id]!==null)el.textContent=txt[id]});
    var turn=byId("mqTurn");if(turn)turn.innerHTML=v.turnText;
    var range=byId("mqHeading");if(range&&document.activeElement!==range)range.value=Math.round(v.heading);
    var liveButton=byId("mqEnableCompass");if(liveButton)liveButton.textContent=mqCompassActive?"Live compass active":"Enable live compass";
  }
  function setStatus(message){if(mqState)mqState.status=message;var el=document.getElementById("mqCompassStatus");if(el)el.textContent=message}
  function saveToApp(){
    try{
      API_STORE.latitude=mqState.lat;API_STORE.longitude=mqState.lng;
      API_STORE.city=mqState.city||"Custom coordinates";API_STORE.country=mqState.country||"";
      if(typeof persistLocationV5==="function")persistLocationV5();
      if(typeof syncLocationLabels==="function")syncLocationLabels();
    }catch(_){}
  }
  async function refreshPrayerAfterLocation(){
    try{if(typeof loadPrayerData==="function")await loadPrayerData()}catch(_){}
    setStatus("Location ready: "+currentLabel()+". Qibla bearing and prayer times use this location.");
    if(typeof render==="function")render();
  }
  function setPlace(lat,lng,city,country,status){
    var p=validCoord(lat,lng);
    if(!p){setError("Coordinates are outside the allowed latitude or longitude range.");return}
    mqState.lat=p.lat;mqState.lng=p.lng;mqState.city=city||"";mqState.country=country||"";
    try{API_STORE.latitude=p.lat;API_STORE.longitude=p.lng;API_STORE.city=mqState.city||"Custom coordinates";API_STORE.country=mqState.country}catch(_){}
    if(typeof persistLocationV5==="function")persistLocationV5();
    if(typeof syncLocationLabels==="function")syncLocationLabels();
    setStatus(status||"Location set. Updating prayer times…");
    updateUi();
    if(typeof render==="function")render();
    Promise.resolve().then(refreshPrayerAfterLocation);
  }
  function setError(message){var el=document.getElementById("mqErr");if(el)el.textContent=message;else setStatus(message)}
  window.mqQiblaChooseCity=function(value){
    if(value==="current"){
      var p=currentCoordinates();
      if(p){setPlace(p.lat,p.lng,String(API_STORE.city||""),String(API_STORE.country||""),"Using MOMIN's current location. Updating prayer times…");return}
      window.mqQiblaUseCurrentLocation();return;
    }
    if(value==="custom"){setStatus("Enter your custom latitude and longitude, then tap Update location.");return}
    if(value.indexOf("city:")===0){
      var item=CITIES[Number(value.slice(5))];if(!item)return;
      var parts=item[0].split(",");setPlace(item[1],item[2],parts[0].trim(),parts.slice(1).join(",").trim(),"Location set to "+item[0]+". Updating prayer times…");
    }
  };
  window.mqQiblaPreviewCoordinates=function(){
    if(!mqState)return;
    var lat=document.getElementById("mqLat"),lng=document.getElementById("mqLng");
    if(!lat||!lng||lat.value===""||lng.value==="")return;
    var p=validCoord(lat.value,lng.value);if(!p){setError("Latitude must be −90 to 90 and longitude −180 to 180.");return}
    mqState.lat=p.lat;mqState.lng=p.lng;mqState.city="Custom coordinates";mqState.country="";
    updateUi();
  };
  window.mqQiblaApplyLocation=function(event){
    if(event&&event.preventDefault)event.preventDefault();
    var city=document.getElementById("mqCity"),latEl=document.getElementById("mqLat"),lngEl=document.getElementById("mqLng");
    if(city&&city.value&&city.value.indexOf("city:")===0){window.mqQiblaChooseCity(city.value);return false}
    if(city&&city.value==="current"&&(!latEl||!lngEl||latEl.value===""||lngEl.value==="")){window.mqQiblaUseCurrentLocation();return false}
    if(!latEl||!lngEl||latEl.value===""||lngEl.value===""){setError("Choose a city, use current location, or enter both coordinates.");return false}
    var p=validCoord(latEl.value,lngEl.value);
    if(!p){setError("Latitude must be between −90 and 90, and longitude between −180 and 180.");return false}
    mqState.lat=p.lat;mqState.lng=p.lng;mqState.city="Custom coordinates";mqState.country="";
    setPlace(p.lat,p.lng,"Custom coordinates","", "Custom coordinates saved. Finding the nearest city…");
    if(typeof reverseGeocodeLocationV5==="function"){
      reverseGeocodeLocationV5(p.lat,p.lng).then(function(place){
        if(place&&place.city&&place.country){
          mqState.city=place.city;mqState.country=place.country;
          try{API_STORE.city=place.city;API_STORE.country=place.country;if(typeof persistLocationV5==="function")persistLocationV5();if(typeof syncLocationLabels==="function")syncLocationLabels()}catch(_){}
          setStatus("Location set to "+place.city+", "+place.country+". Updating prayer times…");
          if(typeof render==="function")render();
          Promise.resolve().then(refreshPrayerAfterLocation);
        }
      }).catch(function(){});
    }
    return false;
  };
  window.mqQiblaUseCurrentLocation=function(){
    if(!navigator.geolocation){setStatus("This browser does not support GPS. Choose a city or enter coordinates.");return}
    if(!window.isSecureContext&&location.hostname!=="localhost"){setStatus("GPS requires a secure HTTPS connection.");return}
    setStatus("Requesting your current location…");
    navigator.geolocation.getCurrentPosition(async function(pos){
      var p=validCoord(pos.coords.latitude,pos.coords.longitude);
      if(!p){setStatus("The device returned invalid coordinates. Please try again.");return}
      mqState.lat=p.lat;mqState.lng=p.lng;mqState.city="Current location";mqState.country="";
      try{API_STORE.latitude=p.lat;API_STORE.longitude=p.lng;API_STORE.city="Current location";API_STORE.country=""}catch(_){}
      if(typeof persistLocationV5==="function")persistLocationV5();
      if(typeof render==="function")render();
      setStatus("GPS received. Finding your town or city…");
      var place=null;
      try{if(typeof reverseGeocodeLocationV5==="function")place=await reverseGeocodeLocationV5(p.lat,p.lng)}catch(_){}
      if(place&&place.city&&place.country){mqState.city=place.city;mqState.country=place.country;try{API_STORE.city=place.city;API_STORE.country=place.country}catch(_){}}
      else{mqState.city="Current location";mqState.country=""}
      if(typeof persistLocationV5==="function")persistLocationV5();
      if(typeof syncLocationLabels==="function")syncLocationLabels();
      setStatus(place&&place.city&&place.country?"Location found: "+place.city+", "+place.country+". Updating prayer times…":"GPS saved. The city name could not be resolved, but exact coordinates will be used.");
      if(typeof render==="function")render();
      await refreshPrayerAfterLocation();
    },function(error){
      var msg=error&&error.code===1?"Location permission was denied. Allow Location for MOMIN in your browser's site settings, then retry.":error&&error.code===2?"The device could not determine a location. Check Location services and retry.":error&&error.code===3?"Location timed out. Move near a window or check GPS, then retry.":"Could not obtain your location. Choose a city or enter coordinates instead.";
      setStatus(msg);
    },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  };
  window.mqQiblaSetHeading=function(value){
    if(!mqState)return;
    var next=normalize(value);
    if(mqLiveHandler){
      window.removeEventListener("deviceorientation",mqLiveHandler,true);
      window.removeEventListener("deviceorientationabsolute",mqLiveHandler,true);
      mqLiveHandler=null;mqCompassActive=false;
    }
    mqState.heading=next;mqState.live=false;
    try{qiblaHeadingV5=next}catch(_){}
    setStatus("Manual heading set to "+Math.round(next)+"°. Use Enable live compass to read your phone sensor.");
    updateUi();
  };
  window.mqQiblaEnableLiveCompass=function(){
    if(!mqState)return;
    if(!window.isSecureContext&&location.hostname!=="localhost"){setStatus("Live compass requires a secure HTTPS connection.");return}
    var D=window.DeviceOrientationEvent;
    if(!D){setStatus("This browser does not provide a live device compass. Use the facing-direction slider.");return}
    function begin(){
      if(mqLiveHandler){mqCompassActive=true;setStatus("Live compass active. Turn the phone slowly to align the Qibla marker.");return}
      mqLiveHandler=function(event){
        var heading=null;
        if(typeof event.webkitCompassHeading==="number"&&event.webkitCompassHeading>=0)heading=event.webkitCompassHeading;
        else if(event.absolute===true&&typeof event.alpha==="number")heading=360-event.alpha;
        if(heading===null||!Number.isFinite(heading))return;
        mqCompassActive=true;mqState.heading=normalize(heading);
        try{qiblaHeadingV5=mqState.heading}catch(_){}
        setStatus("Live compass active · phone facing "+WINDS[Math.round(mqState.heading/22.5)%16]+" ("+Math.round(mqState.heading)+"°). Keep the phone flat.");
        updateUi();
      };
      window.addEventListener("deviceorientation",mqLiveHandler,true);
      window.addEventListener("deviceorientationabsolute",mqLiveHandler,true);
      setStatus("Waiting for a live compass reading… Keep the phone flat and turn it slowly.");
      window.setTimeout(function(){if(mqCompassActive)return;setStatus("No absolute compass reading received. Check sensor support/permissions or use the slider.");},5000);
    }
    if(typeof D.requestPermission==="function"){
      D.requestPermission().then(function(result){if(result==="granted")begin();else setStatus("Compass permission was not granted. Use the facing-direction slider instead.")}).catch(function(){setStatus("Could not enable the compass. Check browser permissions.")});
    }else begin();
  };
  var originalQiblaPage=qiblaPage;
  qiblaPage=function(){
    var prior=mqState;
    mqState=stateFromApp();
    if(prior&&Number.isFinite(prior.heading)&&!mqCompassActive)mqState.heading=prior.heading;
    if(prior&&prior.status)mqState.status=prior.status;
    var v=renderReadoutHtml();
    return qiblaPageMarkup();
  };
  var oldUpdateQibla=updateQiblaCompassUIV5;
  updateQiblaCompassUIV5=function(){
    try{if(typeof oldUpdateQibla==="function")oldUpdateQibla()}catch(_){}
    updateUi();
  };
})();
