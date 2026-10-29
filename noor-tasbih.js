/* Momin — Digital Tasbih. A real hanging tasbih: loop of 33 beads, imam bead and tassel.
   Each tap slides one bead across the string. Per-dhikr counts, goals, bead materials, haptics/sound, 7-day history. */
(function(){
var DHIKR=[
 {id:'sub',ar:'سُبْحَانَ ٱللَّٰهِ',tr:'Subhanallah',en:'Glory be to Allah',t:33},
 {id:'ham',ar:'ٱلْحَمْدُ لِلَّٰهِ',tr:'Alhamdulillah',en:'All praise is for Allah',t:33},
 {id:'akb',ar:'ٱللَّٰهُ أَكْبَرُ',tr:'Allahu Akbar',en:'Allah is the Greatest',t:34},
 {id:'ist',ar:'أَسْتَغْفِرُ ٱللَّٰهَ',tr:'Astaghfirullah',en:'I seek forgiveness from Allah',t:100},
 {id:'lai',ar:'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',tr:'La ilaha illallah',en:'There is no god but Allah',t:100},
 {id:'sal',ar:'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',tr:'Salawat on the Prophet ﷺ',en:'O Allah, send blessings upon Muhammad',t:100},
 {id:'haw',ar:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ',tr:'La hawla wa la quwwata illa billah',en:'There is no power or strength except with Allah',t:100}
];
var THEMES=[['sandalwood','#a8631f'],['emerald','#14876a'],['pearl','#e4d9c0'],['onyx','#2d3237'],['lapis','#2754b4']];
var TARGETS=[33,34,99,100,500,1000],KEY='noor-tsb-v2';
var NB=33,M=44,CX=150,CY=150,R=124,BR=8.1,A=360/M;

function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function sum(o){var s=0;for(var k in o)s+=o[k]||0;return s}
function load(){var s;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  s=s||{day:today(),sel:'sub',tg:{},counts:{},hist:{},sound:false,haptic:true,theme:'sandalwood'};
  if(s.day!==today()){s.hist=s.hist||{};s.hist[s.day]=sum(s.counts||{});s.counts={};s.day=today()}
  s.hist=s.hist||{};s.tg=s.tg||{};s.counts=s.counts||{};s.theme=s.theme||'sandalwood';
  var keys=Object.keys(s.hist).sort();while(keys.length>14)delete s.hist[keys.shift()];return s}
var st=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}
  var total=sum(st.counts);try{tasbih=total}catch(e){}
  try{localStorage.setItem('noor-tasbih',String(total));localStorage.setItem('noor-tasbih-date',today())}catch(e){}}
function cur(){return DHIKR.filter(function(d){return d.id===st.sel})[0]||DHIKR[0]}
function target(d){return st.tg[d.id]||d.t}
function cnt(d){return st.counts[d.id]||0}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(i){return document.getElementById(i)}
function moved(n){return n<=0?0:((n-1)%NB)+1}

/* ---------- audio / haptics ---------- */
var ac;function tone(f,dur,vol,type){if(!st.sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();var o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(vol||.06,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch(e){}}
function clack(){tone(1700,.022,.05,'square');tone(380,.07,.07,'triangle')}
function buzz(p){if(st.haptic&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}}

/* ---------- bead geometry ---------- */
/* slot positions: imam at bottom; counted beads stack one side, uncounted on the other, free gap between */
function xy(slot,lift){var th=(90+slot*A)*Math.PI/180,r=R+(lift||0);return [CX+r*Math.cos(th),CY+r*Math.sin(th)]}
function targetSlot(b,m){return b>=NB+1-m?NB+1.3-b:NB+10.7-b}   /* counted: 34.3-b (=0.3+k) ; uncounted: 43.7-b */
var cur_={},anims={},raf=0;
function place(b,slot,lift){var p=xy(slot,lift),g=$('tsbB'+b),sc=1+(lift||0)*.028;if(g)g.setAttribute('transform','translate('+p[0].toFixed(2)+' '+p[1].toFixed(2)+')'+(lift?' scale('+sc.toFixed(3)+')':''))}
function setOn(b,on){var g=$('tsbB'+b);if(g)g.classList.toggle('on',!!on)}
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function loop(now){raf=0;var any=false;
  for(var k in anims){var a=anims[k],t=(now-a.t0-a.delay)/a.dur;
    if(t<0){any=true;continue}
    if(t>=1){cur_[k]=a.to;place(k,a.to,0);delete anims[k];var g=$('tsbB'+k);if(g&&a.land){g.classList.remove('land');void g.getBoundingClientRect();g.classList.add('land')}continue}
    any=true;var s=a.from+(a.to-a.from)*ease(t);cur_[k]=s;place(k,s,a.lift*Math.sin(Math.PI*t))}
  if(any)raf=requestAnimationFrame(loop)}
function slide(b,to,dur,delay,lift,land){if(cur_[b]===to&&!anims[b])return;
  anims[b]={from:cur_[b],to:to,t0:performance.now(),delay:delay||0,dur:dur,lift:lift||0,land:land};
  if(!raf)raf=requestAnimationFrame(loop)}
function snap(m){anims={};for(var b=1;b<=NB;b++){var s=targetSlot(b,m);cur_[b]=s;place(b,s,0);setOn(b,b>=NB+1-m)}}

/* ---------- markup ---------- */
function svg(){var h='<svg viewBox="0 0 300 400" aria-hidden="true"><defs>'+
 '<radialGradient id="tsbBd" cx=".34" cy=".3" r=".85"><stop offset="0" style="stop-color:var(--b1)"/><stop offset=".5" style="stop-color:var(--b2)"/><stop offset="1" style="stop-color:var(--b3)"/></radialGradient>'+
 '<clipPath id="tsbClip"><circle r="'+BR+'"/></clipPath><linearGradient id="tsbBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a22"/><stop offset=".35" stop-color="#f6e7b8"/><stop offset=".7" stop-color="#c9a85a"/><stop offset="1" stop-color="#6e5216"/></linearGradient>'+
 '<linearGradient id="tsbGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7b8"/><stop offset=".5" stop-color="#c9a85a"/><stop offset="1" stop-color="#8a6a22"/></linearGradient>'+
 '<linearGradient id="tsbTas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--t1)"/><stop offset="1" style="stop-color:var(--t2)"/></linearGradient></defs>'+
 '<circle class="tsb-thread" cx="'+CX+'" cy="'+CY+'" r="'+R+'"/><g class="tsb-beads">';
 for(var b=1;b<=NB;b++){var mk=(b===1||b===12||b===23),rot=(b*53)%180;
  h+='<g class="tsb-bd'+(mk?' mk':'')+'" id="tsbB'+b+'"><g class="in"><circle r="'+BR+'" fill="url(#tsbBd)"/>'+
  '<g class="grain" transform="rotate('+rot+')" clip-path="url(#tsbClip)"><path d="M-9-3.2Q0-6.6 9-3.2M-9 0.4Q0-2.6 9 0.4M-9 4Q0 1 9 4"/></g>'+
  (mk?'<g clip-path="url(#tsbClip)"><rect x="-9" y="-2" width="18" height="4" fill="url(#tsbBand)"/><rect x="-9" y="-2" width="18" height=".7" fill="#fff" opacity=".5"/></g>':'')+
  '<circle class="ring" r="'+(BR-.4)+'"/><ellipse cx="-2.7" cy="-3.1" rx="2.6" ry="1.5" fill="#fff" opacity=".6" transform="rotate(-35 -2.7 -3.1)"/><circle cx="2.4" cy="3.1" r="2.7" fill="#000" opacity=".14"/></g></g>'}
 h+='</g>';
 /* imam bead + tassel (bottom) */
 var by=CY+R;
 h+='<g class="tsb-imam"><rect x="'+(CX-17)+'" y="'+(by-5.5)+'" width="34" height="11" rx="5.5" fill="url(#tsbBd)"/><ellipse cx="'+(CX-4)+'" cy="'+(by-2.6)+'" rx="7" ry="1.9" fill="#fff" opacity=".4"/>'+
 '<rect x="'+(CX-19.5)+'" y="'+(by-6.5)+'" width="4" height="13" rx="2" fill="url(#tsbGold)"/><rect x="'+(CX+15.5)+'" y="'+(by-6.5)+'" width="4" height="13" rx="2" fill="url(#tsbGold)"/></g>';
 h+='<g class="tsb-tassel"><path d="M150 '+(by+5)+'v14" stroke="#e8d7ae" stroke-width="1.6"/><circle cx="150" cy="'+(by+23)+'" r="6.5" fill="url(#tsbBd)"/><ellipse cx="148" cy="'+(by+21)+'" rx="2.2" ry="1.4" fill="#fff" opacity=".5"/>'+
 '<rect x="145.5" y="'+(by+28)+'" width="9" height="7" rx="2" fill="url(#tsbGold)"/><g fill="url(#tsbTas)">';
 for(var i=-7;i<=7;i++){var x=150+i*1.05,sp=i*2.5;h+='<path d="M'+x+' '+(by+34)+' C'+(x+sp*.25)+' '+(by+52)+' '+(x+sp*.7)+' '+(by+66)+' '+(x+sp)+' '+(by+86)+' L'+(x+sp+1.4)+' '+(by+86)+' C'+(x+sp*.7+1.4)+' '+(by+65)+' '+(x+sp*.25+1.3)+' '+(by+52)+' '+(x+1.3)+' '+(by+34)+'z" opacity="'+(.72+.28*Math.cos(i*.7))+'"/>'}
 h+='</g><rect x="143" y="'+(by+42)+'" width="14" height="3.4" rx="1.7" fill="url(#tsbGold)"/><rect x="143.6" y="'+(by+47)+'" width="12.8" height="2.6" rx="1.3" fill="url(#tsbGold)" opacity=".85"/><path d="M148 '+(by+36)+'q-1 22 -3 46" stroke="#fff" stroke-opacity=".18" stroke-width="1.2" fill="none"/></g></svg>';return h}
function ring(d){var t=target(d),n=cnt(d),r=n%t;return {inRound:r===0&&n>0?t:r,pct:(r===0&&n>0?1:r/t),rounds:Math.floor(n/t),t:t,n:n}}
function weekBars(){var days=[],max=1,i,d,key,v,out='';
  for(i=6;i>=0;i--){d=new Date();d.setDate(d.getDate()-i);key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    v=i===0?sum(st.counts):(st.hist[key]||0);days.push({v:v,l:'SMTWTFS'[d.getDay()],now:i===0});max=Math.max(max,v)}
  days.forEach(function(x){out+='<div class="tsb-bar'+(x.now?' today':'')+'" title="'+x.v+'"><i style="--h:'+Math.max(4,Math.round(x.v/max*88))+'px"></i>'+x.l+'</div>'});return out}
function list(){return DHIKR.map(function(d){return '<div class="tsb-row'+(d.id===st.sel?' on':'')+'"><span>'+esc(d.tr.replace(' ﷺ',''))+'</span><span class="n">'+cnt(d)+'</span></div>'}).join('')}
function ic(p){return '<svg viewBox="0 0 24 24">'+p+'</svg>'}
function cyc(d){var n=cnt(d);return n?'Bead '+moved(n)+' / '+NB+' · Cycle '+(Math.floor((n-1)/NB)+1):'Begin with Bismillah'}

window.tasbeehPage=function(){
  st=load();var d=cur(),r=ring(d);
  var chips=DHIKR.map(function(x){var nm=x.tr.length>16?x.tr.split(' ').slice(0,3).join(' '):x.tr;if(x.id==='sal')nm='Salawat';return '<button class="tsb-chip'+(x.id===st.sel?' on':'')+'" onclick="tsbSelect(\''+x.id+'\')">'+esc(nm)+'</button>'}).join('');
  var sw=THEMES.map(function(t){return '<button class="'+(t[0]===st.theme?'on':'')+'" style="background:radial-gradient(circle at 35% 30%,#fff8,'+t[1]+' 55%,#0006)" title="'+t[0]+'" aria-label="'+t[0]+' beads" onclick="tsbTheme(\''+t[0]+'\')"></button>'}).join('');
  var total=sum(st.counts),rounds=0;DHIKR.forEach(function(x){rounds+=Math.floor(cnt(x)/target(x))});
  return title('Digital tasbih','Count your dhikr with presence','Today: <span id="tsbTotalTag">'+total+'</span>')+
  '<div class="tsb"><section class="panel"><div class="tsb-chips">'+chips+'</div>'+
  '<div class="tsb-ar" id="tsbAr" lang="ar">'+d.ar+'</div><div class="tsb-tr" id="tsbTr">'+esc(d.tr)+'</div><div class="tsb-en" id="tsbEn">'+esc(d.en)+'</div><div class="tsb-orn"><i></i><b></b><i></i></div>'+
  '<div class="tsb-stage" id="tsbStage" data-theme="'+st.theme+'" role="button" tabindex="0" aria-label="Slide a bead to count">'+'<div class="tsb-glow"></div>'+svg()+
  '<div class="tsb-center"><span class="tsb-count" id="tsbCount">'+r.inRound+'</span><span class="tsb-of" id="tsbOf">of '+r.t+'</span><span class="tsb-cyc" id="tsbCyc">'+cyc(d)+'</span></div></div>'+
  '<span class="tsb-pull">Tap or swipe to slide a bead</span>'+
  '<div class="tsb-bar-goal"><i id="tsbGoalBar" style="width:'+Math.round(r.pct*100)+'%"></i></div><div class="tsb-goal-l" id="tsbGoalL">'+r.inRound+' / '+r.t+' · '+r.rounds+' round'+(r.rounds===1?'':'s')+' done</div>'+
  '<div class="tsb-tool"><div class="tsb-sw">'+sw+'</div><span class="tsb-sep"></span>'+
  '<button class="tsb-ic" onclick="tsbUndo()" title="Undo">'+ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>')+'Undo</button>'+
  '<button class="tsb-ic tsb-goal" id="tsbGoal" onclick="tsbCycleGoal()" title="Change goal">'+ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>')+'Goal '+r.t+'</button>'+
  '<button class="tsb-ic sq'+(st.haptic?' on':'')+'" id="tsbHap" onclick="tsbToggle(\'haptic\')" title="Haptics" aria-label="Haptics">'+ic('<path d="M4 8v8M8 5v14M16 5v14M20 8v8"/>')+'</button>'+
  '<button class="tsb-ic sq'+(st.sound?' on':'')+'" id="tsbSnd" onclick="tsbToggle(\'sound\')" title="Sound" aria-label="Sound">'+ic('<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/>')+'</button>'+
  '<button class="tsb-ic sq" onclick="tsbReset()" title="Reset" aria-label="Reset">'+ic('<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>')+'</button></div>'+
  '<div class="tsb-note">Space / Enter also counts. Your counts save on this device.</div></section>'+
  '<aside style="display:grid;gap:18px"><section class="panel"><div class="tsb-stats"><div class="tsb-stat"><b id="tsbSTotal">'+total+'</b><span>Today</span></div><div class="tsb-stat"><b id="tsbSRounds">'+rounds+'</b><span>Rounds</span></div><div class="tsb-stat"><b id="tsbSThis">'+r.n+'</b><span>This dhikr</span></div></div></section>'+
  '<section class="panel"><h3>Last 7 days</h3><div class="tsb-week" id="tsbWeek">'+weekBars()+'</div></section>'+
  '<section class="panel"><h3>Today by dhikr</h3><div class="tsb-list" id="tsbList">'+list()+'</div></section></aside></div>'};

/* after the page markup is in the DOM, lay the beads out (render() has no hook, so watch the view) */
function mount(){var stg=$('tsbStage');if(!stg||stg.getAttribute('data-ready'))return;stg.setAttribute('data-ready','1');
  snap(moved(cnt(cur())));
  var sx,sy,swiped=false;
  var fine=window.matchMedia&&matchMedia('(hover:hover)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(fine){stg.addEventListener('pointermove',function(e){var rc=stg.getBoundingClientRect(),x=(e.clientX-rc.left)/rc.width-.5,y=(e.clientY-rc.top)/rc.height-.5;stg.style.transform='perspective(1000px) rotateX('+(-y*7).toFixed(2)+'deg) rotateY('+(x*9).toFixed(2)+'deg)'});
    stg.addEventListener('pointerleave',function(){stg.style.transform=''})}
  stg.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;swiped=false});
  stg.addEventListener('pointerup',function(e){if(sx==null)return;var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.abs(dx)>26||Math.abs(dy)>26){swiped=true;window.tsbTap(e)}});
  stg.addEventListener('click',function(e){if(swiped){swiped=false;return}window.tsbTap(e)});
  stg.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();window.tsbTap()}});
}
var mo=new MutationObserver(function(){if($('tsbStage'))mount()});
function watch(){var v=$('view');if(v)mo.observe(v,{childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();

function refresh(opts){opts=opts||{};var d=cur(),r=ring(d);if(!$('tsbCount'))return;
  var c=$('tsbCount');c.textContent=r.inRound;if(opts.pop){c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}
  $('tsbOf').textContent='of '+r.t;$('tsbCyc').textContent=cyc(d);$('tsbGoalBar').style.width=Math.round(r.pct*100)+'%';
  $('tsbGoalL').textContent=r.inRound+' / '+r.t+' · '+r.rounds+' round'+(r.rounds===1?'':'s')+' done';
  var total=sum(st.counts),rounds=0;DHIKR.forEach(function(x){rounds+=Math.floor(cnt(x)/target(x))});
  $('tsbSTotal').textContent=total;$('tsbSRounds').textContent=rounds;$('tsbSThis').textContent=r.n;$('tsbTotalTag').textContent=total;
  $('tsbGoal').lastChild.nodeValue='Goal '+r.t;$('tsbList').innerHTML=list();
  var w=$('tsbWeek');if(w){var bars=w.querySelectorAll('.tsb-bar i'),tmp=document.createElement('div');tmp.innerHTML=weekBars();var nb=tmp.querySelectorAll('.tsb-bar i');for(var i=0;i<bars.length;i++)bars[i].style.setProperty('--h',nb[i].style.getPropertyValue('--h'))}}
function kick(){var s=$('tsbStage');if(!s)return;s.classList.remove('kick');void s.offsetWidth;s.classList.add('kick')}
function celebrate(){var stg=$('tsbStage');if(!stg)return;stg.classList.add('done');setTimeout(function(){stg.classList.remove('done')},1000);
  var cols=['#dec27b','#f6e7b8','#b9e7aa','#ffffff'];
  for(var i=0;i<22;i++){var s=document.createElement('span'),a=Math.random()*Math.PI*2,dist=90+Math.random()*90;s.className='tsb-spark';s.style.setProperty('--x',Math.cos(a)*dist+'px');s.style.setProperty('--y',Math.sin(a)*dist+'px');s.style.setProperty('--c',cols[i%cols.length]);stg.appendChild(s);(function(el){setTimeout(function(){el.remove()},1200)})(s)}
  buzz([60,40,60,40,120]);tone(660,.18,.07);setTimeout(function(){tone(880,.25,.07)},140);setTimeout(function(){tone(1175,.4,.07)},300);
  try{toast('Round complete — MashaAllah ✨')}catch(e){}}

/* move beads to match count; animate the changed ones */
function sync(prevN,newN){var pm=moved(prevN),nm=moved(newN),b,hop=NB+1-nm;
  if(nm>pm){slide(hop,targetSlot(hop,nm),560,0,7,true);setOn(hop,true)}
  else if(nm<pm){ /* wrap or undo */
    if(newN>prevN){ /* new cycle: cascade all beads back, then first bead hops */
      for(b=NB;b>=1;b--){if(b>=NB+1-pm){slide(b,targetSlot(b,0),430,(NB-b)*14,0,false);setOn(b,false)}}
      slide(hop,targetSlot(hop,nm),560,520,7,true);setOn(hop,true)}
    else{ /* undo across a cycle boundary: snap back */ snap(nm)}}
  else snap(nm)}

window.tsbTap=function(){var d=cur(),prev=cnt(d);st.counts[d.id]=prev+1;save();var n=prev+1,r=ring(d);
  sync(prev,n);kick();refresh({pop:true});
  if(r.n%r.t===0)celebrate();else if(moved(n)%11===0){buzz([28,30,28]);clack();tone(1175,.35,.05)}else{buzz(12);clack()}};
window.tsbUndo=function(){var d=cur(),prev=cnt(d);if(prev>0){st.counts[d.id]=prev-1;save();var pm=moved(prev),nm=moved(prev-1),b=NB+1-pm;
  if(nm<pm&&!(pm===1&&prev>1)){slide(b,targetSlot(b,0),380,0,-5,false);setOn(b,false)}else snap(nm);refresh({pop:true});buzz(8)}};
window.tsbReset=function(){var d=cur();if(!cnt(d))return;if(confirm('Reset the count for '+d.tr+'?')){st.counts[d.id]=0;save();snap(0);refresh({pop:true})}};
window.tsbSelect=function(id){st.sel=id;save();render()};
window.tsbTheme=function(t){st.theme=t;save();var s=$('tsbStage');if(s)s.setAttribute('data-theme',t);document.querySelectorAll('.tsb-sw button').forEach(function(b){b.classList.toggle('on',b.title===t)});kick()};
window.tsbCycleGoal=function(){var d=cur(),t=target(d),i=TARGETS.indexOf(t);st.tg[d.id]=TARGETS[(i+1)%TARGETS.length];save();refresh({pop:true})};
window.tsbToggle=function(k){st[k]=!st[k];save();var b=$(k==='sound'?'tsbSnd':'tsbHap');if(b)b.classList.toggle('on',st[k]);if(k==='sound'&&st.sound)clack();if(k==='haptic'&&st.haptic)buzz(30)};
window.increment=function(){window.tsbTap()};
window.resetCounter=function(){window.tsbReset()};
document.addEventListener('keydown',function(e){if(typeof page==='undefined'||page!=='tasbeeh')return;var t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT'||t==='BUTTON'||t==='A')return;if(e.target&&e.target.id==='tsbStage')return;if(e.key===' '||e.key==='Enter'){e.preventDefault();window.tsbTap()}});
save();

/* Settings Center bridge: update active Tasbeeh controls without requiring a reload. */
window.MominTasbihSettingsV1={
  setPreferences:function(prefs){
    if(!prefs||typeof prefs!=="object")return;
    if(typeof prefs.sound==="boolean")st.sound=prefs.sound;
    if(typeof prefs.haptic==="boolean")st.haptic=prefs.haptic;
    save();
    var soundButton=$("tsbSnd"),hapticButton=$("tsbHap");
    if(soundButton)soundButton.classList.toggle("on",st.sound);
    if(hapticButton)hapticButton.classList.toggle("on",st.haptic);
  }
};
})();