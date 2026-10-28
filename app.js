const E={stop:'📍',charge:'⚡',food:'🍽️',alt:'↪️',hotel:'🏨'},$=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='gt-state-v3',gmap=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const DEF=()=>({items:D.items.map((i,k)=>({...i,id:k+1})),hot:D.hot.map(h=>({...h})),bud:D.bud.map(b=>({...b})),hsel:0,scen:'full'});
let S;try{S=JSON.parse(localStorage[KEY])}catch(e){}if(!S||!S.items)S=DEF();function mig(o){if(o.dv!=='w4'){const n=DEF();let m=Math.max(0,...o.items.map(i=>+i.id||0));o.items=o.items.filter(i=>i.d!=2&&i.d!=3).concat(n.items.filter(i=>i.d==2||i.d==3).map(i=>({...i,id:++m})));o.dv='w4'}return o}S=mig(S);localStorage[KEY]=JSON.stringify(S);
const save=()=>{localStorage[KEY]=JSON.stringify(S);renderAll()};
let EDIT=false,DAY=1;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Athens'}).format(new Date()),TM={'2026-10-27':1,'2026-10-28':2,'2026-10-29':3,'2026-10-30':4},DATES=['2026-10-27','2026-10-28','2026-10-29','2026-10-30'];
const nowHM=()=>new Intl.DateTimeFormat('el-GR',{timeZone:'Europe/Athens',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
const fmtT=ts=>new Intl.DateTimeFormat('el-GR',{timeZone:'Europe/Athens',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ts));
const byTime=a=>a; // order = user order
const thumb=i=>i.im?`background-image:url(img/t/${i.im}.jpg)`:'';
function row(i,edit){const inner=`<div class="th" style="${thumb(i)}">${i.im?'':E[i.ty||'hotel']}</div><div class="c">${i.t?`<div class="tm">${E[i.ty]||''} ${esc(i.t)}</div>`:''}<div class="n">${esc(String(i.n).replace(/^⚡\s*/,''))}</div><div class="x">${esc(i.x)}</div></div>`;
 if(edit)return `<div class="row ${i.ty}">${inner}<div class="ed"><button onclick="mv(${i.id},-1)">↑</button><button onclick="mv(${i.id},1)">↓</button><button onclick="openItem(${i.id})">✎</button><button onclick="del(${i.id})">🗑</button></div></div>`;
 return `<a class="row ${i.ty||''}" href="${i.u}" target="_blank" rel="noopener">${inner}<div class="go">›</div></a>`}
// ---- plan
function pickDay(d){DAY=+d;localStorage.day=d;renderPlan();if(map&&document.body.classList.contains('wplan'))fit('d'+DAY)}
function renderPlan(){document.querySelectorAll('#days button').forEach(b=>b.classList.toggle('on',b.dataset.d==DAY));const y=D.days[DAY];
 $('#meta').textContent=`${y.ti} · 🚗 ${y.km} χλμ · ~${Math.floor(y.mn/60)}ω${String(y.mn%60).padStart(2,'0')} οδήγηση`;
 const its=S.items.filter(i=>i.d==DAY);let html='';const isToday=TM[today]==DAY&&!EDIT,n=nowHM();let placed=!isToday;
 its.forEach(i=>{if(!placed&&/^\d\d:\d\d$/.test(i.t)&&i.t>n){html+=`<div class="now">Τώρα ${n}</div>`;placed=true}html+=row(i,EDIT)});
 if(!placed)html+=`<div class="now">Τώρα ${n}</div>`;
 if(EDIT)html+=`<button class="add" onclick="openItem(0)">＋ Προσθήκη στάσης</button>`;
 $('#list').innerHTML=html;renderWx()}
$('#days').innerHTML=Object.entries(D.days).map(([d,y])=>`<button data-d="${d}" onclick="pickDay(${d})"><b>Μέρα ${d}</b>${y.dt.split(' ').slice(0,2).join(' ')}</button>`).join('');
function toggleEdit(){EDIT=!EDIT;$('#edb').classList.toggle('on',EDIT);renderAll()}
function mv(id,dir){const a=S.items,i=a.findIndex(x=>x.id==id);let j=i+dir;while(j>=0&&j<a.length&&a[j].d!=a[i].d)j+=dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save()}
function del(id){if(confirm('Διαγραφή στάσης;')){S.items=S.items.filter(x=>x.id!=id);save()}}
let editing=0;
function openItem(id){editing=id;const f=$('#mf'),i=S.items.find(x=>x.id==id)||{d:DAY,t:'',n:'',x:'',ty:'stop',q:'',la:'',lo:''};
 for(const k of['d','t','n','x','ty','la','lo'])f[k].value=i[k]??'';f.q.value=i.q||'';$('#modal').classList.add('on')}
function closeModal(){$('#modal').classList.remove('on')}
function saveItem(ev){ev.preventDefault();const f=$('#mf'),o={d:+f.d.value,t:f.t.value.trim(),n:f.n.value.trim(),x:f.x.value.trim(),ty:f.ty.value,q:f.q.value.trim(),la:parseFloat(f.la.value),lo:parseFloat(f.lo.value)};
 o.u=gmap(o.q||(isFinite(o.la)?o.la+','+o.lo:o.n));
 if(editing){const i=S.items.find(x=>x.id==editing);if(!o.q&&i.q===undefined&&i.n==o.n&&i.la==o.la)o.u=i.u;Object.assign(i,o)}else{o.id=Math.max(0,...S.items.map(x=>x.id))+1;S.items.push(o)}
 closeModal();save()}
// ---- weather (open-meteo, cached)
const WK='gt-wx';let wxLive=false;
async function fetchWx(){if(!navigator.onLine)return renderWx();try{const L=D.wx;const u=`https://api.open-meteo.com/v1/forecast?latitude=${L.map(x=>x.la)}&longitude=${L.map(x=>x.lo)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset,weather_code&timezone=Europe%2FAthens&start_date=2026-10-27&end_date=2026-10-30`;
 const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();localStorage[WK]=JSON.stringify({ts:Date.now(),d:Array.isArray(j)?j:[j]});wxLive=true}catch(e){}renderWx()}
const WC=c=>c==null?'':c<1?'☀️':c<4?'⛅':c<50?'🌫️':c<70?'🌧️':c<80?'🌨️':'⛈️';
function renderWx(){let c;try{c=JSON.parse(localStorage[WK])}catch(e){}const el=$('#wx');if(!el)return;
 if(!c){el.innerHTML=`Καιρός: <small>δεν έχει φορτωθεί ακόμα (χρειάζεται σύνδεση)</small>`;return}
 const li=D.dayloc[DAY],di=DAY-1,dd=c.d[li]?.daily;if(!dd||dd.time[di]!==DATES[di]){el.innerHTML='Καιρός: <small>μη διαθέσιμος</small>';return}
 let extra='';if(DAY==3&&c.d[2])extra=` · Μέτσοβο ${Math.round(c.d[2].daily.temperature_2m_max[di])}°/${Math.round(c.d[2].daily.temperature_2m_min[di])}°`;
 el.innerHTML=`${WC(dd.weather_code[di])} <b>${D.wx[li].n} ${Math.round(dd.temperature_2m_max[di])}°/${Math.round(dd.temperature_2m_min[di])}°</b> · βροχή ${dd.precipitation_probability_max[di]}% · 🌅 ${dd.sunset[di].slice(11)}${extra}<br><small>${wxLive?'Πρόβλεψη open-meteo, ενημέρωση':'⚠️ Αποθηκευμένη πρόβλεψη (offline) από'} ${fmtT(c.ts)}</small>`}
// ---- places
function renderPlaces(){const seen=new Set(),uq=a=>a.filter(i=>!seen.has(i.u)&&seen.add(i.u)),skip=/^(Αναχώρηση|Άφιξη Αθήνα)/;
 const G=[['Αξιοθέατα',S.items.filter(i=>(i.ty=='stop'||i.ty=='alt')&&!skip.test(i.n))],['Φαγητό',S.items.filter(i=>i.ty=='food')],['Φόρτιση',S.items.filter(i=>i.ty=='charge')],['Διαμονή'+(S.hsel<0?' (TBD)':''),S.hot.map(h=>({...h,ty:'hotel',x:(h.x||`€${h.p} / 3 νύχτες`)+'. Πάρκινγκ: Stoa Sarka (Πυρσινέλα 15, δίπλα, Δευ–Σαβ 07:30–23:30), Σταθμός Πλ. Πύρρου (~150 μ., €4 1η ώρα, €5 ημέρα, €4 νύχτα), Ακρίτα Λουκή 7 (~1 χλμ., €6/24ω, 24ωρο). Το κατάλυμα: ιδιωτικό πάρκινγκ με χρέωση κατόπιν συνεννόησης.'}))]];
 $('#places').innerHTML=G.map(([h,a])=>`<h3>${h}</h3>`+uq(a).map(i=>row({...i,t:''},false)).join('')).join('')}
// ---- cost
function total(){const ch=S.scen=='cheap',base=S.bud.reduce((s,b)=>s+(+(ch?b.c:b.f)||0),0),k=1;
 if(S.hsel>=0){const v=base+S.hot[S.hsel].p*k;return[v,v]}const ps=S.hot.map(h=>h.p*k);return[base+Math.min(...ps),base+Math.max(...ps)]}
const eur=v=>'€'+Math.round(v);
function renderCost(){const ch=S.scen=='cheap',[a,b]=total(),rng=a==b?eur(a):`${eur(a)}–${eur(b)}`,pp=a==b?eur(a/2):`${eur(a/2)}–${eur(b/2)}`,fits=b<=400,near=a<=410;
 $('#cost').innerHTML=`<div class="seg"><button class="${ch?'':'on'}" onclick="setScen('full')">Πλήρες · 3 νύχτες</button><button class="${ch?'on':''}" onclick="setScen('cheap')">Οικονομικό · 3 νύχτες</button></div>
<div class="card"><div class="big">${rng}</div><div style="color:#78716c">${pp} το άτομο${S.hsel<0?' · ανάλογα με το ξενοδοχείο':''}</div></div>
<div class="card ${fits?'okc':near?'okc':'warn'}">${fits?'✅ Χωράει στα €400.':near?'≈ Περίπου στα €400.':'⚠️ Δεν χωράει στα €400: '+(a>400?`${eur(a-400)}–${eur(b-400)}`:`έως ${eur(b-400)}`)+' πάνω.'}${ch?'<br><small>Οικονομικό: φθηνά μεσημεριανά, 2 νύχτες (επιστροφή Πέμπτη), ξενοδοχείο με δωρεάν φόρτιση.</small>':''}</div>
<h3>Ανάλυση ${EDIT?'(πάτα για αλλαγή)':''}</h3><div class="card">${S.bud.map((x,k)=>`<div class="li" ${EDIT?`onclick="editBud(${k})"`:''}><div>${esc(x.a)}<small>${esc(x.n)}</small></div><b>${eur(ch?x.c:x.f)}${EDIT?' ✎':''}</b></div>`).join('')}
<div class="li"><div>Ξενοδοχείο (3 νύχτες)<small>${S.hsel<0?'TBD: εύρος υποψηφίων':esc(S.hot[S.hsel].n)}</small></div><b>${S.hsel<0?(()=>{const p=S.hot.map(h=>h.p);return eur(Math.min(...p))+'–'+eur(Math.max(...p))})():eur(S.hot[S.hsel].p)}</b></div>
${EDIT?`<button class="btn" onclick="addBud()">＋ Νέο έξοδο</button>`:''}</div>
<h3>Διαμονή · ✅ κλεισμένο</h3><div class="card">
${S.hot.map((h,k)=>`<label class="hrow"><input type="radio" name="hs" ${S.hsel==k?'checked':''} onchange="selH(${k})"><div class="c"><b>${esc(h.n)}</b><br><small>€${String(h.p).replace('.',',')} για 3 νύχτες · ${esc(h.x||'')}</small></div>${EDIT?`<button class="ib" onclick="event.preventDefault();editH(${k})">✎</button>`:`<a href="${h.u}" target="_blank">Χάρτης ›</a>`}</label>`).join('')}
${EDIT?`<button class="btn" onclick="addH()">＋ Νέο ξενοδοχείο</button>`:''}</div>
<h3>Φόρτιση BYD Seal U</h3><div class="card" style="font-size:14px">87 kWh ωφέλιμη · ~24 kWh/100 χλμ στην εθνική (EV Database/Green NCAP). Πήγαινε: DC στο Αγρίνιο (Kapsiochas, ΔΕΗ blue 60 kW). Γυρισμός μέσω Μετεώρων (488 χλμ): ξεκινάτε ~100%, DC στο Shell Travel Stop Λαμίας (εναλλακτικά Αταλάντη NRG ή ΔΕΗ blue Κάστρο 135 kW). AC στην Κανάρη, Γιάννενα. App <b>PPC blue</b> ως μέλος: AC €0,40 / DC €0,52.</div>
<h3>Offline & δεδομένα</h3><div class="card"><button class="btn p" onclick="dlTiles()">⬇️ Λήψη χάρτη για offline</button><div id="tilest" style="font-size:13px;color:#78716c">${localStorage.tilesDone?'✅ Χάρτης αποθηκευμένος '+fmtT(+localStorage.tilesDone):'Φωτογραφίες και πρόγραμμα αποθηκεύονται αυτόματα. Ο χάρτης θέλει λήψη μία φορά (~25 MB, με Wi-Fi).'}</div>
<button class="btn" onclick="fetchWx()">🔄 Ανανέωση καιρού</button><button class="btn p" onclick="shareLink()">🔗 Κοινοποίηση / Αντιγραφή link</button><button class="btn" onclick="exportJ()">📤 Αντίγραφο (JSON)</button><button class="btn" onclick="$('#imp').click()">📥 Επαναφορά από αντίγραφο</button><input type="file" id="imp" accept="application/json" hidden onchange="importJ(this)"><button class="btn" style="color:#b91c1c" onclick="resetAll()">↺ Επαναφορά αρχικών</button></div>
<p class="tiny">Φωτογραφίες: Wikimedia Commons · ${Object.entries(D.cr).map(([k,c])=>`<a href="${c.p}" target="_blank">${k}</a> (${c.a}, ${c.l})`).join(' · ')} · Χάρτης © OpenStreetMap contributors · Διαδρομές OSRM · Καιρός open-meteo</p>`}
function setScen(s){S.scen=s;save()}function selH(k){S.hsel=k;save()}
function editBud(k){const x=S.bud[k],ch=S.scen=='cheap',v=prompt(`${x.a}\nΠοσό (€) για ${ch?'οικονομικό':'πλήρες'} σενάριο (κενό = διαγραφή):`,ch?x.c:x.f);if(v===null)return;if(v.trim()===''){if(confirm('Διαγραφή γραμμής;'))S.bud.splice(k,1)}else{const n=parseFloat(v.replace(',','.'));if(isFinite(n)){ch?x.c=n:x.f=n}}save()}
function addBud(){const a=prompt('Περιγραφή εξόδου:');if(!a)return;const n=parseFloat((prompt('Ποσό (€):','0')||'0').replace(',','.'))||0;S.bud.push({a,f:n,c:n,n:''});save()}
function editH(k){const h=S.hot[k],n=prompt('Όνομα ξενοδοχείου (κενό = διαγραφή):',h.n);if(n===null)return;if(!n.trim()){S.hot.splice(k,1);if(S.hsel==k)S.hsel=-1;return save()}const p=parseFloat((prompt('Τιμή 3 νυχτών (€):',h.p)||h.p).replace(',','.'));h.n=n;h.p=isFinite(p)?p:h.p;h.u=gmap(n);save()}
function addH(){const n=prompt('Όνομα ξενοδοχείου:');if(!n)return;const p=parseFloat((prompt('Τιμή 3 νυχτών (€):','150')||'150').replace(',','.'))||0;S.hot.push({n,p,x:'',u:gmap(n),la:39.665,lo:20.853});save()}
function exportJ(){const b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='giannena-trip.json';a.click()}
function importJ(inp){const f=inp.files[0];if(!f)return;f.text().then(t=>{const o=JSON.parse(t);if(!o.items)throw 0;S=o;save();alert('Έγινε επαναφορά.')}).catch(()=>alert('Μη έγκυρο αρχείο.'))}
function resetAll(){if(confirm('Να χαθούν όλες οι αλλαγές σου;')){S=DEF();save()}}
// ---- offline tiles (user-triggered, bounded)
function tl(z,la,lo){const n=2**z;return[Math.floor((lo+180)/360*n),Math.floor((1-Math.asinh(Math.tan(la*Math.PI/180))/Math.PI)/2*n)]}
function tileList(){const B=[[39.55,39.98,20.65,21.25,9,13],[37.8,39.95,20.6,23.9,7,8],[39.62,39.72,20.78,20.90,14,15],[39.84,39.92,20.73,20.81,14,14],[39.76,39.78,21.17,21.20,14,14],[39.62,39.80,21.25,21.75,12,13],[39.70,39.735,21.60,21.66,14,15]],o=[];
 for(const[a1,a2,o1,o2,z1,z2]of B)for(let z=z1;z<=z2;z++){const[x1,y1]=tl(z,a2,o1),[x2,y2]=tl(z,a1,o2);for(let x=x1;x<=x2;x++)for(let y=y1;y<=y2;y++)o.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`)}return o}
async function dlTiles(){const L=tileList(),st=$('#tilest');if(!navigator.onLine){st.textContent='Χρειάζεται σύνδεση.';return}const c=await caches.open('tiles');let done=0,fail=0,i=0;
 const w=async()=>{while(i<L.length){const u=L[i++];try{if(!(await c.match(u))){const r=await fetch(u);if(r.ok)await c.put(u,r);else fail++}}catch(e){fail++}done++;st.textContent=`Λήψη χάρτη: ${done}/${L.length}${fail?` (${fail} απέτυχαν)`:''}`}};
 await Promise.all([w(),w(),w()]);if(!fail){localStorage.tilesDone=Date.now()}st.textContent=fail?`Ολοκληρώθηκε με ${fail} σφάλματα, πάτα ξανά.`:'✅ Ο χάρτης είναι διαθέσιμος offline.'}

// ---- share link (state compressed in URL hash)
const b64u=u8=>{let s='';for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode(...u8.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function pipe(u8,T){return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(T)).arrayBuffer())}
async function encState(o){const u8=new TextEncoder().encode(JSON.stringify(o));if(window.CompressionStream)return 'z'+b64u(await pipe(u8,new CompressionStream('deflate-raw')));return 'j'+b64u(u8)}
async function decState(s){const k=s[0],u8=ub64(s.slice(1));return JSON.parse(new TextDecoder().decode(k=='z'?await pipe(u8,new DecompressionStream('deflate-raw')):u8))}
async function shareLink(){const url=location.origin+location.pathname+'#s='+await encState(S);
 try{if(navigator.share){await navigator.share({title:'Γιάννενα Τριήμερο',text:'Το πρόγραμμά μας για τα Γιάννενα',url});return}}catch(e){if(e.name=='AbortError')return}
 try{await navigator.clipboard.writeText(url);alert('Το link αντιγράφηκε. Στείλε το στην άλλη συσκευή.')}catch(e){prompt('Αντέγραψε το link:',url)}}
async function checkShared(){const m=location.hash.match(/^#s=(.+)$/);if(!m)return false;history.replaceState(null,'',location.pathname);
 try{const o=await decState(m[1]);if(!o.items)throw 0;if(confirm('Να φορτωθεί το πρόγραμμα που σου στάλθηκε;')){S=mig(o);save()}}catch(e){alert('Το link δεν είναι έγκυρο.')}return true}
// ---- map
let map,lines={},mlayer;const C={d1:'#14532d',d2:'#b45309',d3:'#1d4ed8',d3m:'#7c3aed',d4:'#be123c'};
function initMap(){map=L.map('map',{zoomControl:false,maxZoom:18});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
 for(const k in ROUTES)lines[k]=L.polyline(ROUTES[k].coords,{color:C[k],weight:5,opacity:.85,dashArray:k=='d3m'?'8 8':null}).addTo(map);
 mlayer=L.layerGroup().addTo(map);drawMarkers();
 $('#mapf').innerHTML=[['all','Όλα'],['d1','Τρ'],['d2','Τε'],['d3','Πε'],['d3m','Μέτσοβο'],['d4','Πα']].map(([k,t])=>`<button data-k="${k}" onclick="fit('${k}')">${t}</button>`).join('');fit('d'+DAY)}
function drawMarkers(){if(!map)return;mlayer.clearLayers();const ic=e=>L.divIcon({html:`<div style="font-size:24px">${e}</div>`,className:'',iconSize:[28,28],iconAnchor:[14,24]}),s=new Set();
 const pop=i=>`<b>${esc(i.n)}</b><br><a href="${i.u}" target="_blank" style="color:#1a73e8;font-size:15px">Άνοιγμα στο Google Maps ›</a>`;
 S.items.filter(i=>isFinite(i.la)&&!s.has(i.u)&&s.add(i.u)).forEach(i=>L.marker([i.la,i.lo],{icon:ic(E[i.ty])}).bindPopup(pop(i)).addTo(mlayer));S.hot.forEach(h=>L.marker([h.la,h.lo],{icon:ic('🏨')}).bindPopup(pop(h)).addTo(mlayer))}
function fit(k){document.querySelectorAll('#mapf button').forEach(b=>b.classList.toggle('on',b.dataset.k==k));map.fitBounds((k=='all'?L.featureGroup(Object.values(lines)):lines[k]).getBounds(),{padding:[50,30]})}
// ---- tabs & boot
function renderAll(){renderPlan();renderPlaces();renderCost();drawMarkers()}
const WIDE=matchMedia('(min-width:900px)');function syncWide(){const t=(document.querySelector('.tab.on')||{}).id;document.body.classList.toggle('wplan',WIDE.matches&&t=='t-plan');if(WIDE.matches&&t=='t-plan'){if(!map)initMap();setTimeout(()=>{map.invalidateSize();fit('d'+DAY)},60)}}
function tab(t){document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('on',s.id=='t-'+t));document.querySelectorAll('nav.tb button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));if(t=='map'){if(!map)initMap();setTimeout(()=>map.invalidateSize(),50)}scrollTo(0,0);history.replaceState(null,'','#'+t);syncWide()}
document.querySelectorAll('nav.tb button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
DAY=TM[today]||+localStorage.day||1;renderAll();checkShared().then(sh=>{if(!sh&&location.hash.length>1)tab(location.hash.slice(1))});
syncWide();WIDE.addEventListener('change',syncWide);fetchWx();setInterval(()=>{if(TM[today]&&!EDIT&&$('#t-plan').classList.contains('on'))renderPlan()},60000);addEventListener('online',fetchWx);
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent),sa=navigator.standalone||matchMedia('(display-mode: standalone)').matches;
function hideHint(){$('#hint').style.display='none';localStorage.hint=1}if(ios&&!sa&&!localStorage.hint)$('#hint').style.display='block';
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
