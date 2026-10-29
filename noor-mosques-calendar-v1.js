/* MOMIN Nearby Mosques + Hijri Calendar V1 */
(function(){
"use strict";
var mosqueV1={radius:3000,coords:null,items:[],loading:false,error:"",query:"",initialized:false,lastKey:"",searchToken:0,cityLabel:""};
var mosqueRadiusOptions=[1000,3000,5000];
function escV1(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function toastV1(s){if(typeof toast==="function")toast(s)}
function validCoordsV1(lat,lon){lat=Number(lat);lon=Number(lon);return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180?{lat:lat,lon:lon}:null}
function kmV1(m){return m<1000?Math.round(m)+" m":(m/1000).toFixed(m<10000?1:0)+" km"}
function distanceV1(a,b){var R=6371000,p=Math.PI/180,d1=(b.lat-a.lat)*p,d2=(b.lon-a.lon)*p,x=Math.sin(d1/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)))}
function safeLocationLabelV1(){try{if(typeof currentLocationLabelV5==="function")return currentLocationLabelV5()}catch(_){}try{return [API_STORE.city,API_STORE.country].filter(Boolean).join(", ")||"Current location"}catch(_){return "Current location"}}
function setMosqueStatusV1(text){var e=document.getElementById("mosqueLocationStatusV1");if(e)e.textContent=text}
function osmMapUrlV1(coords,radius){
 if(!coords)return "";
 var latSpan=(radius/1000)/111,lonSpan=latSpan/Math.max(.25,Math.cos(coords.lat*Math.PI/180));
 var west=coords.lon-lonSpan,east=coords.lon+lonSpan,south=coords.lat-latSpan,north=coords.lat+latSpan;
 return "https://www.openstreetmap.org/export/embed.html?bbox="+[west,south,east,north].map(function(n){return n.toFixed(6)}).join("%2C")+"&layer=mapnik&marker="+coords.lat.toFixed(6)+"%2C"+coords.lon.toFixed(6)
}
function paintMosqueMapV1(){
 var map=document.getElementById("mosqueMapFrameV1"),wrap=document.getElementById("mosqueMapWrapV1"),link=document.getElementById("mosqueMapFullV1");
 if(!wrap||!map)return;
 if(!mosqueV1.coords){wrap.hidden=true;return}
 wrap.hidden=false;map.src=osmMapUrlV1(mosqueV1.coords,mosqueV1.radius);
 if(link)link.href="https://www.openstreetmap.org/?mlat="+mosqueV1.coords.lat+"&mlon="+mosqueV1.coords.lon+"#map=16/"+mosqueV1.coords.lat+"/"+mosqueV1.coords.lon
}
function mosqueDirectionsUrlV1(item){
 var origin=mosqueV1.coords?mosqueV1.coords.lat+","+mosqueV1.coords.lon:"";
 return "https://www.google.com/maps/dir/?api=1"+(origin?"&origin="+encodeURIComponent(origin):"")+"&destination="+encodeURIComponent(item.lat+","+item.lon)+"&travelmode=walking"
}
function mosqueSearchUrlV1(){
 return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("mosques near "+(mosqueV1.coords?mosqueV1.coords.lat+","+mosqueV1.coords.lon:safeLocationLabelV1()))
}
function renderMosqueResultsV1(){
 var host=document.getElementById("mosqueResultsV1");if(!host)return;
 var items=mosqueV1.items.slice(),q=mosqueV1.query.trim().toLowerCase();
 if(q)items=items.filter(function(x){return [x.name,x.address,x.area,x.operator].join(" ").toLowerCase().indexOf(q)>=0});
 var count=document.getElementById("mosqueMatchCountV1");if(count)count.textContent=mosqueV1.loading?"Searching nearby…":(items.length+" "+(items.length===1?"match":"matches")+" within "+(mosqueV1.radius/1000)+" km");
 if(mosqueV1.loading){host.innerHTML='<div class="mosque-state-v1"><span class="mosque-loader-v1"></span><b>Finding nearby mosques</b><p>Checking prayer spaces around your location…</p></div>';return}
 if(mosqueV1.error){host.innerHTML='<div class="mosque-state-v1"><span class="mosque-state-icon-v1">⌖</span><b>Could not load nearby results</b><p>'+escV1(mosqueV1.error)+'</p><button class="mosque-action-v1 primary-v1" onclick="searchNearbyMosquesV1()">Try again</button></div>';return}
 if(!mosqueV1.coords){host.innerHTML='<div class="mosque-state-v1"><span class="mosque-state-icon-v1">⌖</span><b>Find mosques around you</b><p>Share your location to show nearby mosques here, sorted by distance. You can choose a 1, 3 or 5 km radius.</p><button class="mosque-action-v1 primary-v1" onclick="useCurrentMosqueLocationV1()">Use my current location</button></div>';return}
 if(!mosqueV1.items.length){host.innerHTML='<div class="mosque-state-v1"><span class="mosque-state-icon-v1">🕌</span><b>No mapped mosques found within '+(mosqueV1.radius/1000)+' km</b><p>Try a larger radius. Mosque listings depend on OpenStreetMap coverage in your area.</p><button class="mosque-action-v1 secondary-v1" onclick="setMosqueRadiusV1(5000)">Search within 5 km</button><a class="mosque-action-v1 text-action-v1" target="_blank" rel="noopener" href="'+escV1(mosqueSearchUrlV1())+'">Check the wider map ↗</a></div>';return}
 if(!items.length){host.innerHTML='<div class="mosque-state-v1"><b>No results match “'+escV1(mosqueV1.query)+'”</b><p>Try another mosque name or clear your search.</p></div>';return}
 host.innerHTML=items.map(function(x,i){
  var meta=[x.area,x.address].filter(Boolean).filter(function(v,j,a){return a.indexOf(v)===j}).join(" · ");
  var hours=x.hours?'<span class="mosque-tag-v1">◷ '+escV1(x.hours)+'</span>':"";
  var phone=x.phone?'<span class="mosque-tag-v1">☎ '+escV1(x.phone)+'</span>':"";
  return '<article class="mosque-result-v1"><div class="mosque-result-top-v1"><span class="mosque-result-icon-v1">🕌</span><span class="mosque-result-distance-v1">'+kmV1(x.distance)+'</span></div><h3>'+escV1(x.name)+'</h3>'+(meta?'<p class="mosque-result-address-v1">'+escV1(meta)+'</p>':'<p class="mosque-result-address-v1">Nearby prayer space · address not listed</p>')+'<div class="mosque-result-tags-v1">'+hours+phone+(x.wheelchair?'<span class="mosque-tag-v1">♿ '+escV1(x.wheelchair)+'</span>':"")+'</div><div class="mosque-result-actions-v1"><a class="mosque-action-v1 primary-v1" href="'+escV1(mosqueDirectionsUrlV1(x))+'" target="_blank" rel="noopener noreferrer">Walking directions ↗</a><a class="mosque-action-v1 secondary-v1" href="https://www.openstreetmap.org/?mlat='+x.lat+'&mlon='+x.lon+'#map=18/'+x.lat+'/'+x.lon+'" target="_blank" rel="noopener noreferrer">View map</a></div></article>'
 }).join("");
}
async function getOverpassMosquesV1(coords,radius,token){
 var r=radius,lat=coords.lat,lon=coords.lon;
 var q='[out:json][timeout:18];('+
 'nwr["amenity"="place_of_worship"]["religion"~"muslim|islam|islamic",i](around:'+r+','+lat+','+lon+');'+
 'nwr["amenity"="mosque"](around:'+r+','+lat+','+lon+');'+
 'nwr["building"="mosque"](around:'+r+','+lat+','+lon+');'+
 ');out center tags;';
 var endpoints=["https://overpass-api.de/api/interpreter?data=","https://overpass.kumi.systems/api/interpreter?data="];
 var lastError=null;
 for(var i=0;i<endpoints.length;i++){
  if(token!==mosqueV1.searchToken)throw Error("Search cancelled");
  var controller=typeof AbortController!=="undefined"?new AbortController():null;
  var timer=setTimeout(function(){if(controller)controller.abort()},19000);
  try{
   var response=await fetch(endpoints[i]+encodeURIComponent(q),{method:"GET",signal:controller?controller.signal:undefined,headers:{"Accept":"application/json"}});
   if(!response.ok)throw Error("Map data service returned "+response.status);
   var json=await response.json();clearTimeout(timer);
   if(!json||!Array.isArray(json.elements))throw Error("Map data response was incomplete");
   return json.elements.map(function(e){
    var tags=e.tags||{},p=validCoordsV1(e.lat!=null?e.lat:e.center&&e.center.lat,e.lon!=null?e.lon:e.center&&e.center.lon);
    if(!p)return null;
    var distance=distanceV1(coords,p);if(distance>radius)return null;
    var name=String(tags.name||tags["name:en"]||tags["name:local"]||"").trim();
    if(!name){
     var type=tags.building==="mosque"||tags.amenity==="mosque"?"Mosque":"Muslim prayer space";
     name=type;
    }
    var area=[tags["addr:suburb"],tags["addr:neighbourhood"],tags["addr:hamlet"],tags["addr:village"],tags["addr:town"],tags["addr:city"]].filter(Boolean)[0]||"";
    var address=[tags["addr:housenumber"],tags["addr:street"],tags["addr:postcode"]].filter(Boolean).join(" ");
    return {id:String(e.type)+"/"+e.id,name:name,lat:p.lat,lon:p.lon,distance:distance,area:area,address:address,hours:tags.opening_hours||"",phone:tags.phone||tags["contact:phone"]||"",operator:tags.operator||"",wheelchair:tags.wheelchair||""}
   }).filter(Boolean).sort(function(a,b){return a.distance-b.distance}).filter(function(x,i,all){return all.findIndex(function(y){return (x.name.toLowerCase()===y.name.toLowerCase()&&Math.abs(x.lat-y.lat)<.00015&&Math.abs(x.lon-y.lon)<.00015)})===i}).slice(0,40);
  }catch(e){clearTimeout(timer);lastError=e}
 }
 throw lastError||Error("Map data service is temporarily unavailable");
}
async function searchNearbyMosquesV1(){
 if(mosqueV1.loading)return;
 if(!mosqueV1.coords){await useCurrentMosqueLocationV1();return}
 var token=++mosqueV1.searchToken;mosqueV1.loading=true;mosqueV1.error="";renderMosqueResultsV1();setMosqueStatusV1("Searching");
 try{
  var results=await getOverpassMosquesV1(mosqueV1.coords,mosqueV1.radius,token);
  if(token!==mosqueV1.searchToken)return;
  mosqueV1.items=results;mosqueV1.loading=false;mosqueV1.error="";
  setMosqueStatusV1(results.length?"Nearby results ready":"No mapped matches");
 }catch(e){
  if(token!==mosqueV1.searchToken)return;
  mosqueV1.loading=false;mosqueV1.error=String(e&&e.name==="AbortError"?"The map search timed out. Please retry.":(e&&e.message||"The nearby map service is not responding."));
  if(mosqueV1.error.indexOf("Search cancelled")>=0)return;
  setMosqueStatusV1("Search unavailable");
 }finally{if(token===mosqueV1.searchToken){paintMosqueMapV1();renderMosqueResultsV1()}}
}
async function useCurrentMosqueLocationV1(){
 if(!navigator.geolocation){mosqueV1.error="Your browser does not provide device location. Enable location access or set a city in Prayer settings.";renderMosqueResultsV1();return}
 var host=document.getElementById("mosqueResultsV1");if(host)host.innerHTML='<div class="mosque-state-v1"><span class="mosque-loader-v1"></span><b>Finding your location…</b><p>Allow location access when your browser asks.</p></div>';
 setMosqueStatusV1("Locating");
 navigator.geolocation.getCurrentPosition(async function(pos){
  var coords={lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};
  if(!validCoordsV1(coords.lat,coords.lon)){mosqueV1.error="Your device returned invalid coordinates.";renderMosqueResultsV1();return}
  mosqueV1.coords=coords;mosqueV1.error="";mosqueV1.cityLabel=safeLocationLabelV1();
  try{
   API_STORE.latitude=coords.lat;API_STORE.longitude=coords.lon;
   localStorage.setItem("noor-latitude",String(coords.lat));localStorage.setItem("noor-longitude",String(coords.lon));
   localStorage.setItem("noor-location-source","gps");
   if(typeof reverseGeocodeLocationV5==="function"){
    var place=await reverseGeocodeLocationV5(coords.lat,coords.lon);
    if(place&&place.city&&place.country){API_STORE.city=place.city;API_STORE.country=place.country;mosqueV1.cityLabel=place.city+", "+place.country;localStorage.setItem("noor-city",place.city);localStorage.setItem("noor-country",place.country);if(typeof persistLocationV5==="function")persistLocationV5();if(typeof syncLocationLabels==="function")syncLocationLabels();if(typeof loadPrayerData==="function")loadPrayerData()}
   }
  }catch(_){}
  var currentPlace=document.getElementById("mosqueCurrentPlaceV1");if(currentPlace)currentPlace.textContent=mosqueV1.cityLabel||"Your current location";
  paintMosqueMapV1();searchNearbyMosquesV1();
 },function(err){
  mosqueV1.error=err&&err.code===1?"Location permission was denied. Allow location for MOMIN in your browser settings, then try again.":err&&err.code===2?"Your current location could not be determined. Check device location services.":"Location request timed out. Move to a place with GPS reception and try again.";
  mosqueV1.loading=false;setMosqueStatusV1("Location needed");renderMosqueResultsV1();
 },{enableHighAccuracy:true,timeout:15000,maximumAge:120000});
}

window.searchMosqueAreaV1=async function(){
 var input=document.getElementById("mosqueAreaInputV1"),query=String(input&&input.value||"").trim();
 if(!query){toastV1("Enter a town, city or area to search.");return}
 var status=document.getElementById("mosqueLocationStatusV1");
 if(status)status.textContent="Finding area…";
 var host=document.getElementById("mosqueResultsV1");
 if(host)host.innerHTML='<div class="mosque-state-v1"><span class="mosque-loader-v1"></span><b>Finding '+escV1(query)+'</b><p>Locating the area to search nearby mosques.</p></div>';
 try{
  var response=await fetch("https://photon.komoot.io/api/?q="+encodeURIComponent(query)+"&limit=5&lang=en");
  if(!response.ok)throw Error("Area search is temporarily unavailable.");
  var data=await response.json(),features=data.features||[];
  var item=features.find(function(f){var p=f.properties||{};return p.city||p.town||p.village||p.county||p.name})||features[0];
  if(!item)throw Error("We could not find that town or city. Check its spelling and try again.");
  var p=item.properties||{},raw=item.geometry&&item.geometry.coordinates;
  var coords=validCoordsV1(raw&&raw[1],raw&&raw[0]);
  if(!coords)throw Error("That search result did not include usable map coordinates.");
  mosqueV1.coords=coords;
  mosqueV1.cityLabel=[p.name&&p.name.toLowerCase()!==query.toLowerCase()?p.name:"",p.city||p.town||p.village||p.county||"",p.state||"",p.country||""].filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i}).join(", ")||query;
  mosqueV1.error="";mosqueV1.items=[];mosqueV1.query="";
  var current=document.getElementById("mosqueCurrentPlaceV1");if(current)current.textContent=mosqueV1.cityLabel;
  var search=document.querySelector(".momin-mosque-search-v1 input");if(search)search.value="";
  paintMosqueMapV1();await searchNearbyMosquesV1();
 }catch(e){
  mosqueV1.loading=false;mosqueV1.error=e&&e.message||"Area search failed. Please try again.";
  if(status)status.textContent="Area search unavailable";
  renderMosqueResultsV1();
 }
};
window.useCurrentMosqueLocationV1=useCurrentMosqueLocationV1;
window.searchNearbyMosquesV1=searchNearbyMosquesV1;
window.setMosqueRadiusV1=function(radius){
 radius=Number(radius);if(mosqueRadiusOptions.indexOf(radius)<0)return;
 mosqueV1.radius=radius;document.querySelectorAll("[data-mosque-radius-v1]").forEach(function(b){b.classList.toggle("active",Number(b.getAttribute("data-mosque-radius-v1"))===radius);b.setAttribute("aria-pressed",String(Number(b.getAttribute("data-mosque-radius-v1"))===radius))});
 paintMosqueMapV1();if(mosqueV1.coords)searchNearbyMosquesV1();else renderMosqueResultsV1()
};
window.openGoogleMapsMosquesV1=function(){window.open(mosqueSearchUrlV1(),"_blank","noopener,noreferrer")};
window.filterNearbyMosquesV1=function(value){mosqueV1.query=String(value||"");renderMosqueResultsV1()};
function initMosquePageV1(){
 var coord=validCoordsV1(API_STORE.latitude,API_STORE.longitude);
 if(!coord){var a=localStorage.getItem("noor-latitude"),b=localStorage.getItem("noor-longitude");coord=validCoordsV1(a,b)}
 if(coord){
  var changed=!mosqueV1.coords||Math.abs(mosqueV1.coords.lat-coord.lat)>.000001||Math.abs(mosqueV1.coords.lon-coord.lon)>.000001;
  mosqueV1.coords=coord;var label=document.getElementById("mosqueCurrentPlaceV1");if(label)label.textContent=safeLocationLabelV1();
  paintMosqueMapV1();
  var key=coord.lat.toFixed(4)+","+coord.lon.toFixed(4)+","+mosqueV1.radius;
  if(changed||mosqueV1.lastKey!==key){mosqueV1.lastKey=key;searchNearbyMosquesV1()}
 }else{
  renderMosqueResultsV1();
  if(!mosqueV1.initialized&&navigator.permissions&&navigator.permissions.query){
   mosqueV1.initialized=true;navigator.permissions.query({name:"geolocation"}).then(function(p){if(p.state==="granted"&&page==="mosques")useCurrentMosqueLocationV1()}).catch(function(){});
  }
 }
}
var originalMosqueLogoGroupV2="<path class=\"lg-teal\" fill=\"#21675f\" fill-rule=\"evenodd\" d=\"M610 1061L612 1062L624 1059L661 1055L711 1055L735 1057L782 1064L804 1069L862 1087L898 1103L916 1113L936 1127L947 1137L956 1149L960 1162L972 1182L982 1191L989 1195L997 1197L1003 1197L1014 1193L1028 1181L1035 1171L1042 1152L1047 1143L1063 1127L1096 1106L1116 1096L1146 1084L1195 1069L1204 1068L1217 1064L1264 1057L1288 1055L1338 1055L1368 1058L1389 1062L1382 1058L1352 1047L1340 1040L1327 1038L1264 1038L1240 1040L1193 1047L1167 1053L1166 1052L1169 1050L1176 1049L1185 1045L1234 1035L1281 1030L1325 1029L1308 1024L1302 1024L1279 1019L1276 1017L1276 1015L1281 1011L1264 1011L1245 1014L1235 1014L1195 1021L1162 1030L1134 1040L1100 1056L1081 1067L1060 1082L1035 1104L1015 1127L1002 1147L999 1148L985 1128L965 1105L943 1085L926 1072L924 1072L901 1057L877 1045L831 1028L804 1021L765 1014L735 1011L718 1011L724 1016L723 1018L674 1029L718 1030L766 1035L817 1046L822 1048L824 1050L823 1051L801 1046L759 1040L746 1040L734 1038L672 1038L659 1040L645 1048ZM774 995L799 995L834 998L863 1004L897 1015L926 1028L952 1043L982 1064L998 1078L1003 1077L1025 1058L1052 1040L1073 1028L1102 1015L1136 1004L1159 999L1201 995L1225 996L1223 993L1189 977L1173 972L1144 967L1099 968L1066 976L1029 992L1001 1010L996 1009L970 992L944 980L911 970L891 967L855 967L826 972L802 980ZM718 926L718 973L765 974L766 923L769 911L776 897L787 886L801 878L817 874L845 873L855 841L867 817L884 792L902 774L917 764L928 759L947 755L973 745L990 735L998 728L1001 728L1009 735L1033 748L1052 755L1076 761L1086 766L1102 778L1120 798L1135 822L1147 848L1153 871L1155 873L1171 873L1192 876L1208 883L1220 893L1225 900L1232 916L1233 971L1235 974L1281 973L1281 923L1279 910L1272 888L1266 876L1255 861L1241 848L1225 838L1210 832L1191 828L1188 825L1175 796L1164 778L1147 756L1133 742L1118 730L1103 721L1086 714L1058 707L1041 699L1032 692L1012 670L1002 650L1001 645L998 645L994 657L982 677L964 695L944 706L913 714L899 720L877 733L865 743L847 762L833 781L822 800L811 825L808 828L796 830L781 835L764 844L749 856L734 875L726 891L721 906Z\"/><path class=\"lg-fade\" fill=\"#b98a2e\" fill-rule=\"evenodd\" d=\"M999 545L994 561L991 565L972 565L971 566L973 569L982 575L987 580L987 583L985 586L984 592L981 599L983 600L992 594L993 592L998 589L1001 589L1017 600L1018 598L1012 580L1025 569L1027 569L1028 566L1027 565L1008 565L1006 563L1003 552L1001 549L1001 546ZM969 530L953 545L947 556L944 566L944 575L943 576L944 591L947 600L953 611L961 620L970 627L988 634L994 634L995 635L1011 634L1031 626L1043 615L1046 611L1047 607L1044 608L1038 613L1027 618L1019 620L1003 620L992 617L981 611L970 601L969 598L963 591L962 586L959 581L959 576L958 575L958 558L962 545L972 530Z\"/>";

function ensureMosqueExactStylesV2(){
 if(!document.getElementById("mominMosqueExactCssV2")){
  var font=document.createElement("link");font.id="mominMosqueExactFontsV2";font.rel="stylesheet";font.href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;700&display=swap";document.head.appendChild(font);
  var cssLink=document.createElement("link");cssLink.id="mominMosqueExactCssV2";cssLink.rel="stylesheet";cssLink.href="./noor-mosques-exact-v2.css?v=2";document.head.appendChild(cssLink);
 }
 document.body.classList.add("momin-mosques-exact-active-v2");
}
function removeMosqueExactStylesV2(){
 document.body.classList.remove("momin-mosques-exact-active-v2");
 ["mominMosqueExactCssV2","mominMosqueExactFontsV2"].forEach(function(id){var e=document.getElementById(id);if(e)e.remove()});
}
function updateMosqueCoordsV2(){
 var c=mosqueV1.coords;if(!c)return;
 var lat=document.getElementById("lat"),lng=document.getElementById("lng");
 if(lat)lat.textContent=c.lat.toFixed(4);if(lng)lng.textContent=c.lon.toFixed(4);
 var title=document.getElementById("mosqueCurrentPlaceV1");if(title)title.textContent="Mosques around "+(mosqueV1.cityLabel||safeLocationLabelV1());
}
function bindMosqueExactControlsV2(){
 var open=document.getElementById("open");
 if(open)open.onclick=function(){if(mosqueV1.coords)searchNearbyMosquesV1();else useCurrentMosqueLocationV1();var target=document.getElementById("mosqueResultsV1");if(target)target.scrollIntoView({behavior:"smooth",block:"nearest"})};
 var locate=document.getElementById("locate");if(locate)locate.onclick=function(){useCurrentMosqueLocationV1()};
 document.querySelectorAll("#steps button").forEach(function(b){b.onclick=function(){var li=b.parentNode,on=li.classList.toggle("open");b.setAttribute("aria-expanded",String(on))}});
 document.querySelectorAll("[data-mosque-radius-v1]").forEach(function(b){b.onclick=function(){setMosqueRadiusV1(Number(b.getAttribute("data-mosque-radius-v1")))}});
}

function mosquesPageMominV1(){
 var place=escV1(safeLocationLabelV1()),h=[];
 h.push('<div class="momin-mosque-design-v2" id="mominMosqueDesignV2"><svg viewBox="600 520 800 685" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><g id="mominOriginalMosqueLogoV2">'+originalMosqueLogoGroupV2+'</g></svg><div class="wrap" id="mominMosqueAppV2">');
 h.push('<header><div class="brand"><span class="badge" aria-hidden="true"><svg viewBox="600 520 800 685"><use href="#mominOriginalMosqueLogoV2"/></svg></span><span class="date">18 Jumādá al-ūlá 1448 AH</span></div><span class="chip"><span class="dot"></span><span id="mosqueLocationStatusV1">Device location</span></span></header>');
 h.push('<div class="title-row reveal"><div><h1>Mosques near me</h1><p class="sub">Find nearby prayer spaces with Google Maps</p></div></div>');
 h.push('<section class="hero reveal" aria-labelledby="mosqueCurrentPlaceV1"><div class="stage" aria-hidden="true"><span class="ring"></span><span class="ring"></span><span class="ring"></span><div class="seal"><svg viewBox="600 520 800 685" role="img" aria-label="Mosque dome over an open book"><use href="#mominOriginalMosqueLogoV2"/></svg></div></div>');
 h.push('<h2 id="mosqueCurrentPlaceV1">Mosques around '+place+'</h2><p id="lead">Browse nearby prayer spaces, check the distance, then choose directions for a mosque.</p>');
 h.push('<div class="radius" role="group" aria-label="Search distance">'+mosqueRadiusOptions.map(function(r){return '<button type="button" aria-pressed="'+(mosqueV1.radius===r)+'" data-mosque-radius-v1="'+r+'">'+(r/1000)+' km</button>'}).join("")+'</div>');
 h.push('<button class="btn primary" id="open" type="button">Find nearby mosques <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M7 17 17 7M8 7h9v9"/></svg></button><button class="btn ghost" id="locate" type="button">Use current location</button></section>');
 h.push('<section class="card" aria-labelledby="loc"><h3 id="loc">Using your location</h3><p class="sub" id="locNote">Using the current device location for nearby mosque results and prayer calculations.</p><div class="coords"><div>Latitude<b id="lat">15.8281</b></div><div>Longitude<b id="lng">78.0373</b></div></div><div class="nearby-area-v2"><input id="mosqueAreaInputV1" type="search" aria-label="Search a town or city" placeholder="Enter town or city" onkeydown="if(event.key===&quot;Enter&quot;){event.preventDefault();searchMosqueAreaV1()}"><button type="button" onclick="searchMosqueAreaV1()">Search town or city</button></div><button class="btn ghost" type="button" onclick="go(&quot;prayers&quot;)">Prayer location settings</button></section>');
 h.push('<section class="card" aria-labelledby="nearby-heading-v2"><h3 id="nearby-heading-v2">Nearby matches</h3><p class="sub" id="mosqueMatchCountV1">Use current location to see nearby matches.</p><label class="nearby-search-v2"><input type="search" aria-label="Filter nearby mosques" placeholder="Filter by mosque name or area" oninput="filterNearbyMosquesV1(this.value)"></label><div class="nearby-map-v2" id="mosqueMapWrapV1" hidden><iframe id="mosqueMapFrameV1" title="Map around your current location" loading="lazy" referrerpolicy="no-referrer" src="about:blank"></iframe><div class="nearby-map-caption-v2">Map data © OpenStreetMap contributors <a id="mosqueMapFullV1" href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">Open map ↗</a></div></div><div class="nearby-results-v2" id="mosqueResultsV1"><div class="mosque-state-v1"><b>Find mosques around you</b><p>Share your location to show nearby mosques here, sorted by distance.</p><button class="mosque-action-v1 primary-v1" onclick="useCurrentMosqueLocationV1()">Use my current location</button></div></div><p class="sub" style="font-size:11px;margin-top:12px">Nearby places use OpenStreetMap community data. Names and opening-hour details may be incomplete.</p></section>');
 h.push('<section class="card" aria-labelledby="dir"><h3 id="dir">Directions</h3><ul class="steps" id="steps"><li class="open"><button type="button" aria-expanded="true"><span class="n">1</span><span class="t">Find nearby matches</span><svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="more"><div>Use your location or search your town. Nearby prayer spaces appear above in MOMIN, sorted from closest to farthest.</div></div></li><li><button type="button" aria-expanded="false"><span class="n">2</span><span class="t">Choose a mosque</span><svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="more"><div>Check the address and available details, then choose walking directions for your mosque.</div></div></li><li><button type="button" aria-expanded="false"><span class="n">3</span><span class="t">Start navigation</span><svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="more"><div>Directions open only for the mosque you select, rather than sending you away before you see nearby matches.</div></div></li></ul></section>');
 h.push('</div><nav aria-label="Main"><a href="#home" onclick="go(&quot;home&quot;);return false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9H4z"/></svg>Home</a><a href="#prayers" onclick="go(&quot;prayers&quot;);return false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>Prayers</a><a href="#quran" onclick="go(&quot;quran&quot;);return false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h6a2 2 0 0 1 1 .3A2 2 0 0 1 13 5h6v14h-6a2 2 0 0 0-1 .3 2 2 0 0 0-1-.3H5z"/></svg>Quran</a><a href="#mosques" aria-current="page" onclick="go(&quot;mosques&quot;);return false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>Mosques</a></nav></div>');
 return h.join("");
}
var mosquesPageV1=mosquesPageMominV1;mosquesPage=mosquesPageV1;
if(Array.isArray(pages)&&!pages.some(function(p){return p[0]==="mosques"}))pages.splice(3,0,["mosques","⌖","Mosques"]);
function renderCalendarWidgetV1(){var root=document.getElementById("mominCalendarRootV1");if(!root)return;root.innerHTML=calendarMarkupV1();bindCalendarWidgetV1(root)}
var hijriMonthsV1=["Muḥarram","Ṣafar","Rabīʿ al-awwal","Rabīʿ al-thānī","Jumādá al-ūlá","Jumādá al-ākhirah","Rajab","Shaʿbān","Ramaḍān","Shawwāl","Dhū al-Qaʿdah","Dhū al-Ḥijjah"];
var hijriEventsV1=[[1,1,"Islamic New Year","Start of the Hijri year","new"],[1,10,"Day of Ashura","Recommended day of fasting","fast"],[3,12,"Mawlid al-Nabi","Observed by many Muslims","night"],[7,27,"Isra and Miʿraj","The Night Journey","night"],[8,15,"Mid-Shaʿbān","Night of Barāʾah","night"],[9,1,"Ramadan begins","First day of fasting","fast"],[9,27,"Laylat al-Qadr","Commonly sought on the 27th night","night"],[10,1,"Eid al-Fitr","Festival marking the end of Ramadan","eid"],[12,9,"Day of Arafah","Recommended fast for those not performing Hajj","fast"],[12,10,"Eid al-Adha","Festival of sacrifice","eid"]];
var hijriFmtV1=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn",{day:"numeric",month:"numeric",year:"numeric"});
var hijriListV1=[];
function dateNoonV1(y,m,d){return new Date(y,m,d,12,0,0,0)}
function hijriOfV1(date){var p={};hijriFmtV1.formatToParts(date).forEach(function(x){p[x.type]=x.value});return{day:Number(p.day),month:Number(p.month),year:parseInt(p.year,10)||Number(String(p.year||"").match(/\d+/)?.[0])||0}}
function gregLabelV1(date,options){return date.toLocaleDateString("en-GB",options||{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
function dateKeyV1(date){return date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate()}
function hijriLabelDateV1(h){return h.day+" "+(hijriMonthsV1[h.month-1]||"Hijri month")+" "+h.year+" AH"}
function makeHijriEventsV1(){
 var events=[],start=dateNoonV1(2023,0,1),end=dateNoonV1(2032,0,1);
 for(var d=new Date(start);d<end;d=dateNoonV1(d.getFullYear(),d.getMonth(),d.getDate()+1)){
  var h=hijriOfV1(d);
  hijriEventsV1.forEach(function(e){if(e[0]===h.month&&e[1]===h.day)events.push({date:new Date(d),h:h,name:e[2],note:e[3],kind:e[4]})});
 }
 return events
}
hijriListV1=makeHijriEventsV1();
var calV1={now:new Date(),viewYear:new Date().getFullYear(),viewMonth:new Date().getMonth(),selected:new Date(),hijriYear:hijriOfV1(new Date()).year};
function nextHijriEventV1(){var d=new Date(calV1.now.getFullYear(),calV1.now.getMonth(),calV1.now.getDate(),12),n=hijriListV1.find(function(e){return e.date>=d});return n||hijriListV1[0]}
function calendarMarkupV1(){
 var first=dateNoonV1(calV1.viewYear,calV1.viewMonth,1),lastDay=dateNoonV1(calV1.viewYear,calV1.viewMonth+1,0).getDate(),firstH=hijriOfV1(first),lastH=hijriOfV1(dateNoonV1(calV1.viewYear,calV1.viewMonth,lastDay));
 var currentH=hijriOfV1(calV1.now),selectedH=hijriOfV1(calV1.selected),eventByDate={};
 hijriListV1.forEach(function(e){eventByDate[dateKeyV1(e.date)]=e});
 var days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],cells="";
 for(var i=0;i<first.getDay();i++)cells+='<span class="momin-cal-blank-v1" aria-hidden="true"></span>';
 for(var day=1;day<=lastDay;day++){
  var d=dateNoonV1(calV1.viewYear,calV1.viewMonth,day),h=hijriOfV1(d),ev=eventByDate[dateKeyV1(d)];
  var classes="momin-cal-day-v1"+(d.toDateString()===calV1.now.toDateString()?" today-v1":"")+(d.toDateString()===calV1.selected.toDateString()?" selected-v1":"")+(d.getDay()===5?" friday-v1":"")+(ev?" event-v1 "+(ev.kind==="eid"?"eid-v1":""):"");
  var aria=gregLabelV1(d,{weekday:"long",day:"numeric",month:"long"})+", "+hijriLabelDateV1(h)+(ev?", "+ev.name:"");
  cells+='<button type="button" class="'+classes+'" data-cal-date-v1="'+d.getTime()+'" aria-label="'+escV1(aria)+'"><span class="momin-cal-greg-v1">'+day+'</span><span class="momin-cal-hijri-v1">'+(h.day===1?(hijriMonthsV1[h.month-1]||"").split(" ")[0].slice(0,4):h.day)+'</span>'+(ev?'<i class="momin-cal-dot-v1"></i>':"")+'</button>';
 }
 var rangeText=firstH.month===lastH.month?hijriMonthsV1[firstH.month-1]+" "+firstH.year:hijriMonthsV1[firstH.month-1]+" – "+hijriMonthsV1[lastH.month-1]+" "+lastH.year;
 var event=nextHijriEventV1(),daysLeft=Math.round((new Date(event.date.getFullYear(),event.date.getMonth(),event.date.getDate())-new Date(calV1.now.getFullYear(),calV1.now.getMonth(),calV1.now.getDate()))/86400000);
 var eventHero='<section class="momin-cal-next-v1"><div class="momin-cal-next-icon-v1">☾</div><div class="momin-cal-next-copy-v1"><span class="momin-eyebrow-v1">NEXT IMPORTANT DATE</span><h2>'+(daysLeft===0?escV1(event.name+" is today"):escV1(event.name))+'</h2><p>'+escV1(hijriLabelDateV1(event.h))+'</p><small>'+escV1(gregLabelV1(event.date,{weekday:"short",day:"numeric",month:"short",year:"numeric"}))+' · '+(daysLeft<0?"Today":daysLeft===0?"Today":daysLeft+" days away")+'</small></div></section>';
 var detailEvent=eventByDate[dateKeyV1(calV1.selected)];
 var detail='<section class="momin-cal-detail-v1"><span class="momin-eyebrow-v1">SELECTED DATE</span><strong>'+escV1(gregLabelV1(calV1.selected))+'</strong><span>'+escV1(hijriLabelDateV1(selectedH))+'</span>'+(detailEvent?'<p class="momin-cal-event-note-v1">✦ '+escV1(detailEvent.name)+' · '+escV1(detailEvent.note)+'</p>':calV1.selected.getDay()===5?'<p class="momin-cal-event-note-v1">☾ Jumuʿah · Friday prayer</p>':'')+'</section>';
 var activeEvents=hijriListV1.filter(function(e){return e.h.year===calV1.hijriYear}).sort(function(a,b){return a.date-b.date});
 var ys=[calV1.hijriYear-1,calV1.hijriYear,calV1.hijriYear+1];
 var eventRows=activeEvents.map(function(e){var delta=Math.round((new Date(e.date.getFullYear(),e.date.getMonth(),e.date.getDate())-new Date(calV1.now.getFullYear(),calV1.now.getMonth(),calV1.now.getDate()))/86400000),status=delta===0?"Today":delta>0?"In "+delta+(delta===1?" day":" days"):"Passed";return '<button type="button" class="momin-cal-event-row-v1 '+(e.kind==="eid"?"eid-v1":"")+'" data-cal-date-v1="'+e.date.getTime()+'"><span class="momin-cal-event-date-v1"><b>'+e.date.getDate()+'</b><small>'+escV1(e.date.toLocaleDateString("en",{month:"short"}))+'</small></span><span class="momin-cal-event-text-v1"><strong>'+escV1(e.name)+'</strong><small>'+escV1(hijriLabelDateV1(e.h))+' · '+escV1(e.note)+'</small></span><span class="momin-cal-event-when-v1 '+(delta>=0&&delta<=30?"soon-v1":"")+'">'+status+'</span></button>'}).join("");
 return '<section class="momin-cal-intro-v1"><span class="momin-eyebrow-v1">TIME · FAITH · REFLECTION</span><h2>Islamic calendar</h2><p>Explore dates across the Gregorian and Hijri calendars.</p><div class="momin-cal-today-v1"><span>Today · '+escV1(gregLabelV1(calV1.now,{weekday:"long",day:"numeric",month:"long"}))+'</span><b>'+escV1(hijriLabelDateV1(currentH))+'</b></div></section>'+
 eventHero+
 '<section class="momin-cal-month-v1"><div class="momin-cal-month-head-v1"><div><span class="momin-eyebrow-v1">MONTH VIEW</span><h2>'+escV1(calV1.now.getFullYear()===calV1.viewYear&&calV1.now.getMonth()===calV1.viewMonth?"": "")+escV1(first.toLocaleDateString("en",{month:"long",year:"numeric"}))+'</h2><p>'+escV1(rangeText)+'</p></div><div class="momin-cal-month-controls-v1"><button type="button" data-cal-action-v1="today" aria-label="Go to today">Today</button><button type="button" data-cal-action-v1="prev" aria-label="Previous month">‹</button><button type="button" data-cal-action-v1="next" aria-label="Next month">›</button></div></div>'+
 '<div class="momin-cal-grid-v1">'+days.map(function(x){return '<span class="momin-cal-weekday-v1 '+(x==="Fri"?"friday-v1":"")+'">'+x+'</span>'}).join("")+cells+'</div>'+detail+
 '<p class="momin-cal-legend-v1"><span><i class="today-dot-v1"></i> Today</span><span><i class="selected-dot-v1"></i> Selected</span><span><i class="event-dot-v1"></i> Important date</span></p></section>'+
 '<section class="momin-cal-important-v1"><div class="momin-cal-important-head-v1"><div><span class="momin-eyebrow-v1">PLAN AHEAD</span><h2>Important days</h2><p>Events follow a calculated Hijri calendar.</p></div></div><div class="momin-cal-year-tabs-v1" role="group" aria-label="Hijri year">'+ys.map(function(y){return '<button type="button" data-hijri-year-v1="'+y+'" aria-pressed="'+(y===calV1.hijriYear)+'">'+y+' AH</button>'}).join("")+'</div><div class="momin-cal-event-list-v1">'+(eventRows||'<p class="momin-cal-empty-v1">No dates listed for this Hijri year.</p>')+'</div></section>'+
 '<p class="momin-cal-footnote-v1">Hijri dates can vary by local moon sighting and may differ by one day. Confirm religious dates with your local mosque. Calendar calculations use the Umm al-Qura calendar. <span>Data source: device calendar.</span></p>';
}
function bindCalendarWidgetV1(root){
 root.querySelectorAll("[data-cal-action-v1]").forEach(function(b){b.onclick=function(){var action=b.getAttribute("data-cal-action-v1");if(action==="prev")calV1.viewMonth--;if(action==="next")calV1.viewMonth++;if(action==="today"){calV1.viewYear=calV1.now.getFullYear();calV1.viewMonth=calV1.now.getMonth();calV1.selected=new Date(calV1.now)}var d=dateNoonV1(calV1.viewYear,calV1.viewMonth,1);calV1.viewYear=d.getFullYear();calV1.viewMonth=d.getMonth();renderCalendarWidgetV1()}});
 root.querySelectorAll("[data-cal-date-v1]").forEach(function(b){b.onclick=function(){var date=new Date(Number(b.getAttribute("data-cal-date-v1")));calV1.selected=date;calV1.viewYear=date.getFullYear();calV1.viewMonth=date.getMonth();renderCalendarWidgetV1()}});
 root.querySelectorAll("[data-hijri-year-v1]").forEach(function(b){b.onclick=function(){calV1.hijriYear=Number(b.getAttribute("data-hijri-year-v1"));renderCalendarWidgetV1()}});
}
function calendarPageMominV1(){return title("Islamic calendar","Gregorian dates with Hijri dates shown inside each day",""+hijriLabelDateV1(hijriOfV1(new Date())))+'<div id="mominCalendarRootV1" class="momin-calendar-page-v1">'+calendarMarkupV1()+'</div>'}
calendarPage=calendarPageMominV1;
function afterRenderMominV1(){
 if(typeof page==="undefined")return;
 if(page==="mosques")initMosquePageV1();
}
var baseRenderMominV1=render;
render=function(){
 if(page==="mosques")ensureMosqueExactStylesV2();else removeMosqueExactStylesV2();
 baseRenderMominV1();
 if(page==="mosques"){bindMosqueExactControlsV2();updateMosqueCoordsV2();window.setTimeout(afterRenderMominV1,100)}
};
/* Add a compact Hijri mini-calendar and fast access links to the home screen below the main content. */
var baseHomeMominV1=home;
home=function(){
 var result=baseHomeMominV1();
 var mini='<section class="momin-home-calendar-v1"><div class="momin-home-calendar-head-v1"><div><span class="momin-eyebrow-v1">YOUR DATES</span><h2>Hijri calendar</h2><p>'+escV1(hijriLabelDateV1(hijriOfV1(new Date())))+'</p></div><button type="button" onclick="go(&quot;calendar&quot;)">View calendar ↗</button></div><div class="momin-home-date-strip-v1">'+Array.from({length:7},function(_,i){var day=new Date();day.setDate(day.getDate()-((day.getDay()+6)%7)+i);var h=hijriOfV1(day);return '<button type="button" class="'+(day.toDateString()===new Date().toDateString()?"current-v1":"")+'" onclick="go(&quot;calendar&quot;)"><span>'+day.toLocaleDateString("en",{weekday:"short"})+'</span><b>'+day.getDate()+'</b><small>'+h.day+'</small></button>'}).join("")+'</div></section>';
 /* place the strip near the end of the home view, before the last closing wrapper */
 return result.replace(/<\/div>\s*$/,mini+"</div>");
};
/* Render once after registering the enhanced pages. */
if(typeof render==="function")render();
})();
