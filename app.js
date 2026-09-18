import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { distanceMetres, rankFor } from './core.js';

const supabase=createClient(
  'https://wvawoavejeoykqhorlob.supabase.co',
  'sb_publishable_c6TI0P3LG29WTyV9PvnwRw_iTlSLIMM',
  {auth:{persistSession:false}}
);

const quests=[
{id:'gas-street',title:'Heart of the canals',place:'Gas Street Basin',category:'canal',points:150,lat:52.47507,lon:-1.90798,radius:180,prompt:'Photograph the basin where Birmingham’s old canal fabric meets the modern city.',note:'Water, boats, bridges or the basin architecture should be clearly part of the shot.'},
{id:'black-sabbath',title:'Heavy metal crossing',place:'Black Sabbath Bridge',category:'landmark',points:150,lat:52.477704,lon:-1.910686,radius:110,prompt:'Capture the Black Sabbath Bridge or its canal-side tribute.',note:'Keep to the public towpath and bridge approaches.'},
{id:'old-turn',title:'Three-way water',place:'Old Turn Junction',category:'canal',points:175,lat:52.47924,lon:-1.91385,radius:150,prompt:'Make a photo that shows the broad meeting of waterways at Old Turn Junction.',note:'A bridge, boat or the junction island can help make the location recognisable.'},
{id:'cambrian',title:'Wharf watcher',place:'Cambrian Wharf',category:'canal',points:125,lat:52.48067,lon:-1.91179,radius:150,prompt:'Capture a piece of canal life around Cambrian Wharf.',note:'Moorings, water, locks and old canal details all count.'},
{id:'farmers-locks',title:'Lock hunter',place:"Farmer's Bridge Locks",category:'canal',points:200,lat:52.4829,lon:-1.9064,radius:300,prompt:"Photograph one of the Farmer's Bridge locks from a safe public position.",note:'A lock chamber, gate or mechanism needs to be clearly visible.'},
{id:'brindley',title:'Brindley reflections',place:'Brindleyplace',category:'creative',points:100,lat:52.4775,lon:-1.91339,radius:220,prompt:'Use canal water or waterside glass to make reflection the subject of your photo.',note:'This is about the composition, not simply proving you are at Brindleyplace.'},
{id:'mailbox',title:'Canal meets city',place:'The Mailbox',category:'landmark',points:100,lat:52.47523,lon:-1.90614,radius:170,prompt:'Photograph The Mailbox from the canal side.',note:'Include water or towpath context so the Birmingham canal setting reads clearly.'},
{id:'worcester-bar',title:'The historic divide',place:'Worcester Bar',category:'landmark',points:175,lat:52.47722,lon:-1.91,radius:160,prompt:'Find and photograph Worcester Bar or the water junction around it.',note:'Stay on normal public routes; there is no need to access boat-only areas.'},
{id:'narrowboat',title:'Narrowboat colours',place:'City-centre canal zone',category:'creative',points:75,lat:52.4778,lon:-1.91,radius:900,prompt:'Find a colourful narrowboat and make its paintwork the focus.',note:'Respect people’s homes: do not photograph through windows or step onto boats.'},
{id:'bridge-frame',title:'Frame a bridge',place:'City-centre canal zone',category:'creative',points:75,lat:52.4785,lon:-1.91,radius:1000,prompt:'Use a canal bridge as a natural frame around another part of Birmingham.',note:'Keep clear of cyclists and working boat areas while composing the shot.'},
{id:'canal-wildlife',title:'Wild Birmingham',place:'City-centre canal zone',category:'creative',points:100,lat:52.48,lon:-1.908,radius:1300,prompt:'Capture canal wildlife without approaching or feeding it.',note:'Give wildlife space. A longer-distance photo still counts.'},
{id:'industrial-detail',title:'Industrial fingerprints',place:'Canal quarter',category:'landmark',points:125,lat:52.481,lon:-1.909,radius:1300,prompt:'Find an old industrial detail: ironwork, brickwork, lock gear or rope wear.',note:'The detail must be reachable from an ordinary public route.'}
];

const state={session:null,shared:{completed:[],mapTarget:null,members:1},location:null,accuracy:null,filter:'all',active:null,photo:null,photoPreview:null,deferredInstall:null,channel:null,poll:null,map:null,userMarker:null,targetMarker:null,routeLayer:null,watchId:null,lastRouteAt:0,lastOrigin:null};
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));

async function api(action,payload={}){
  const {data,error}=await supabase.functions.invoke('brumquest-api',{body:{action,...payload}});
  if(error)throw error;
  if(data?.error){const e=new Error(data.error);e.code=data.error;throw e}
  return data;
}
function readSession(){try{const x=JSON.parse(localStorage.getItem('brumquest-session'));return x?.groupId&&x?.accessKey?x:null}catch{return null}}
function saveSession(x){state.session=x;localStorage.setItem('brumquest-session',JSON.stringify(x))}
function clearSession(){localStorage.removeItem('brumquest-session');state.session=null;state.shared={completed:[],mapTarget:null,members:1}}
function auth(){return{groupId:state.session.groupId,accessKey:state.session.accessKey}}
function completeRecord(id){return state.shared.completed.find(x=>x.id===id)||null}
function done(id){return!!completeRecord(id)}
function score(){const ids=new Set(state.shared.completed.map(x=>x.id));return quests.reduce((s,q)=>s+(ids.has(q.id)?q.points:0),0)}
function dist(q){return state.location?distanceMetres(state.location.lat,state.location.lon,q.lat,q.lon):null}
function inRange(q){const d=dist(q);if(d===null)return false;const allowance=Math.min(Math.max(Number(state.accuracy)||0,0),75);return Math.max(0,d-allowance)<=q.radius}
function fmt(m){if(m===null)return'';return m<1000?Math.round(m)+' m away':(m/1000).toFixed(1)+' km away'}
function esc(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function label(c){return c==='landmark'?'Place':c==='creative'?'Creative':'Canal'}
function qnum(q){return String(quests.findIndex(x=>x.id===q.id)+1).padStart(2,'0')}
function sorted(){return quests.slice().sort((a,b)=>{if(done(a.id)!==done(b.id))return done(a.id)?1:-1;const da=dist(a),db=dist(b);return da===null||db===null?quests.indexOf(a)-quests.indexOf(b):da-db})}
function badges(){const ids=state.shared.completed.map(x=>x.id),count=c=>quests.filter(q=>q.category===c&&ids.includes(q.id)).length;return[['First Capture','Complete one quest.',ids.length>=1],['Five Alive','Complete five quests.',ids.length>=5],['Canal Collector','Complete all four canal quests.',count('canal')>=4],['Brum Spotter','Complete three place quests.',count('landmark')>=3],['Different Angle','Complete three creative quests.',count('creative')>=3],['City Conquered','Complete every current quest.',ids.length===quests.length]]}
function row(q){const d=dist(q);return'<button class="quest-row '+(done(q.id)?'done':'')+'" data-quest="'+q.id+'"><span class="quest-no">'+qnum(q)+'</span><span class="quest-main"><span class="quest-type">'+label(q.category)+'</span><b>'+esc(q.title)+'</b><small>'+esc(q.place)+'</small></span><span class="quest-side">'+(done(q.id)?'<span class="done-mark">✓</span>':'<b>'+q.points+' pts</b>')+(d!==null?'<small>'+fmt(d)+'</small>':'<small>View challenge</small>')+'</span></button>'}

function applyShared(next,quiet=false){
  if(!next)return;
  const before=JSON.stringify({c:state.shared.completed.map(x=>x.id),t:state.shared.mapTarget,m:state.shared.members});
  const after=JSON.stringify({c:(next.completed||[]).map(x=>x.id),t:next.mapTarget,m:next.members});
  state.shared={completed:Array.isArray(next.completed)?next.completed:[],mapTarget:next.mapTarget||null,members:Number(next.members||1),updatedAt:next.updatedAt||null};
  render();
  if($('#map').classList.contains('active')){renderMapTargets();refreshMapTarget(false)}
  if(before!==after&&!quiet)toast('Shared game updated');
}
async function refresh(quiet=true){if(!state.session)return;const d=await api('state',auth());applyShared(d.state,quiet)}
function setupRealtime(){
  if(!state.session)return;
  if(state.channel)supabase.removeChannel(state.channel);
  state.channel=supabase.channel('brq-'+state.session.accessKey);
  state.channel.on('broadcast',{event:'refresh'},()=>refresh(false)).subscribe();
  clearInterval(state.poll);
  state.poll=setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)refresh(true).catch(()=>{})},10000);
}
async function broadcast(){try{await state.channel?.send({type:'broadcast',event:'refresh',payload:{t:Date.now()}})}catch{}}

function showGate(mode='welcome'){
  $('#linkGate').hidden=false;document.body.classList.add('linking');$('#linkError').textContent='';
  $('#welcomePane').hidden=mode!=='welcome';$('#createPane').hidden=mode!=='create';$('#joinPane').hidden=mode!=='join';
}
function hideGate(){$('#linkGate').hidden=true;document.body.classList.remove('linking')}
async function createGame(){
  const b=$('#createGame');b.disabled=true;b.textContent='Creating…';
  try{
    const d=await api('create');saveSession({groupId:d.groupId,accessKey:d.accessKey,role:'owner'});applyShared(d.state,true);setupRealtime();
    $('#linkCode').textContent=d.code;$('#copyCode').dataset.code=d.code;$('#shareCode').dataset.code=d.code;$('#startApp').hidden=false;b.hidden=true;
    $('#createdHelp').textContent='Share this one-time code. It expires in 30 minutes and stops working after the second phone joins.';
  }catch(e){console.error(e);$('#linkError').textContent='Could not create the shared game. Check your connection and try again.';b.disabled=false;b.textContent='Create linking code'}
}
async function joinGame(){
  const code=$('#joinCode').value.trim().toUpperCase();if(!code)return $('#linkError').textContent='Enter the linking code first.';
  const b=$('#joinGame');b.disabled=true;b.textContent='Joining…';
  try{
    const d=await api('join',{code});saveSession({groupId:d.groupId,accessKey:d.accessKey,role:'member'});applyShared(d.state,true);setupRealtime();hideGate();navigate('home');history.replaceState({},'',location.pathname);toast('Linked. Shared sync is live.');
  }catch(e){console.error(e);$('#linkError').textContent=e.code==='expired_code'?'That code has expired. Create a new one on the other phone.':e.code==='group_full'?'Two phones are already linked to that game.':'That linking code is not valid.';b.disabled=false;b.textContent='Join shared BrumQuest'}
}
async function newInvite(){
  const b=$('#newLinkCode');b.disabled=true;
  try{const d=await api('invite',auth());$('#profileLinkCode').textContent=d.code;$('#profileShareCode').dataset.code=d.code;$('#profileInviteBox').hidden=false}
  catch(e){toast(e.code==='group_full'?'Two phones are already linked.':'Could not create a code.')}
  finally{b.disabled=false}
}
function inviteUrl(code){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('join',code);return u.toString()}
async function copyCode(code){if(!code)return;try{await navigator.clipboard.writeText(code);toast('Linking code copied')}catch{toast('Code: '+code)}}
async function shareCode(code){if(!code)return;if(navigator.share){try{await navigator.share({title:'Join my BrumQuest',text:'Join my Birmingham photo hunt with code '+code,url:inviteUrl(code)});return}catch(e){if(e?.name==='AbortError')return}}copyCode(code)}
async function leave(){if(!confirm('Leave this shared BrumQuest on this phone? Shared progress will stay on the other linked phone.'))return;if(state.channel)supabase.removeChannel(state.channel);clearInterval(state.poll);clearSession();showGate()}

async function render(){
  const ids=state.shared.completed.map(x=>x.id),s=score(),r=rankFor(s),bs=badges(),pct=Math.round(ids.length/quests.length*100),list=sorted();
  $('#score').textContent=s;$('#doneStat').textContent=ids.length;$('#progressFill').style.width=pct+'%';$('#rankStat').textContent=r.name;$('#pointsStat').textContent=s+' points';
  $('#profileScore').textContent=s;$('#profileDone').textContent=ids.length+'/'+quests.length;$('#profileBadges').textContent=bs.filter(x=>x[2]).length+'/6';$('#profileTitle').textContent=r.name;$('#rankBadge').textContent=r.short;
  $('#nextRank').textContent=r.next?(r.next-s)+' points to '+rankFor(r.next).name+'.':'Top rank reached.';
  $('#syncStatus').textContent=state.shared.members>=2?'2 phones linked · live sync':'Waiting for second phone';
  $('#homeQuestHeading').textContent=state.location?'Closest unfinished':'Pick a first quest';
  $('#nearby').innerHTML=list.filter(q=>!done(q.id)).slice(0,3).map(row).join('')||'<div class="empty-state"><b>Every quest complete.</b><p>You have cleared the current Birmingham field list.</p></div>';
  $('#questList').innerHTML=list.filter(q=>state.filter==='all'||q.category===state.filter).map(row).join('');
  $('#badges').innerHTML=bs.map(x=>'<div class="badge-row '+(x[2]?'unlocked':'')+'"><span class="badge-symbol">'+(x[2]?'●':'○')+'</span><span><b>'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></span><span class="badge-status">'+(x[2]?'Earned':'Locked')+'</span></div>').join('');
  renderCaptures();bindRows();
}
function renderCaptures(){
  if(!state.shared.completed.length){$('#captureList').innerHTML='<div class="empty-state"><b>Your roll is empty.</b><p>Complete a photo challenge and the shot will appear here on both linked phones.</p></div>';return}
  $('#captureList').innerHTML=state.shared.completed.slice().reverse().map(x=>'<article class="capture-card"><div class="capture-image">'+(x.photoUrl?'<img src="'+esc(x.photoUrl)+'" alt="Shared BrumQuest capture">':'<span>Photo unavailable</span>')+'</div><b>'+esc(x.title)+'</b><small>'+new Date(x.completedAt).toLocaleDateString('en-GB')+' · +'+x.points+' pts</small></article>').join('')
}
function bindRows(){$$('[data-quest]').forEach(b=>b.onclick=()=>openQuest(b.dataset.quest))}
function proximity(q){const d=dist(q);if(d===null)return'<div class="proximity"><span>○</span><span>Location not checked yet. Verify your position before banking the challenge.</span></div>';if(inRange(q))return'<div class="proximity good"><span>●</span><span>You are in range · '+fmt(d)+' · GPS accuracy about '+Math.round(state.accuracy||0)+' m.</span></div>';return'<div class="proximity bad"><span>●</span><span>Not close enough yet · '+fmt(d)+'. Move within roughly '+q.radius+' m.</span></div>'}

async function setTarget(id){
  if(!state.session)return;state.shared.mapTarget=id;renderMapTargets();refreshMapTarget(false);
  try{const d=await api('target',{...auth(),mapTarget:id});applyShared(d.state,true);await broadcast()}catch(e){console.error(e);toast('Could not sync the destination.')}
}
async function openQuest(id){
  const q=quests.find(x=>x.id===id);if(!q)return;state.active=q;state.photo=null;clearPreview();const record=completeRecord(q.id);
  let actions=record?'<div class="completed-box"><b>Challenge banked · +'+q.points+' pts</b><span class="complete-note">Completed '+new Date(record.completedAt).toLocaleDateString('en-GB')+'.</span>'+(record.photoUrl?'<div class="saved-photo"><img src="'+esc(record.photoUrl)+'" alt="Shared capture"></div>':'')+'</div>':
  '<div class="sheet-actions">'+(!state.location?'<button id="verifyHere" class="verify-button"><span>Verify my location</span><span>◎</span></button>':'')+
  '<button id="routeHere" class="map-link"><span>Follow route in BrumQuest</span><span>⌖</span></button><a class="map-link" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+q.lat+','+q.lon+'&travelmode=walking"><span>Open in phone maps</span><span>↗</span></a><label class="photo-button"><input id="photoInput" type="file" accept="image/*" capture="environment" hidden><span>Take challenge photo</span><span>＋</span></label><div id="photoPreview" class="photo-preview" hidden></div><button id="complete" class="complete-button" disabled><span>Bank challenge · +'+q.points+' pts</span><span>→</span></button><p id="completionNote" class="complete-note">You need to be in range and attach a photo. Your capture will sync to the linked phone.</p></div>';
  $('#detail').innerHTML='<article class="quest-sheet"><div class="sheet-meta"><span>'+label(q.category)+' · '+qnum(q)+'</span><span>'+q.points+' points</span></div><h2>'+esc(q.title)+'</h2><p class="sheet-place">'+esc(q.place)+'</p><p class="sheet-prompt">'+esc(q.prompt)+'</p>'+proximity(q)+'<p class="complete-note"><b>Field note:</b> '+esc(q.note)+'</p>'+actions+'</article>';
  $('#questDialog').showModal();
  if(!record){
    if($('#photoInput'))$('#photoInput').onchange=choosePhoto;
    if($('#complete'))$('#complete').onclick=completeQuest;
    if($('#verifyHere'))$('#verifyHere').onclick=()=>locate(true);
    if($('#routeHere'))$('#routeHere').onclick=async()=>{await setTarget(q.id);$('#questDialog').close();navigate('map')};
    updateComplete()
  }
}
function choosePhoto(e){
  const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith('image/'))return toast('Choose an image file.');
  state.photo=f;clearPreview();state.photoPreview=URL.createObjectURL(f);const p=$('#photoPreview');p.innerHTML='<img src="'+state.photoPreview+'" alt="Selected challenge photo">';p.hidden=false;updateComplete()
}
function updateComplete(){
  if(!state.active)return;const b=$('#complete');if(!b)return;const ok=inRange(state.active);b.disabled=!(state.photo&&ok);const n=$('#completionNote');if(!n)return;
  n.textContent=!state.photo&&!ok?'Get in range and take the challenge photo to bank the points.':!state.photo?'Location verified. Take the challenge photo next.':!ok?'Photo ready. Verify your location when you reach the challenge.':'Ready to bank. This capture will sync to both linked phones.'
}
async function completeQuest(){
  const q=state.active;if(!q||!state.photo||!state.session)return toast('Take the challenge photo first.');if(!inRange(q))return toast('You are still outside this challenge area.');
  const b=$('#complete');b.disabled=true;b.querySelector('span').textContent='Syncing capture…';
  try{
    const blob=await compress(state.photo),photoBase64=await b64(blob),d=await api('complete',{...auth(),questId:q.id,photoBase64});applyShared(d.state,true);$('#questDialog').close();clearPreview();state.photo=null;
    const next=sorted().find(x=>!done(x.id));if(next)await setTarget(next.id);await broadcast();toast('+'+q.points+' points · synced');navigator.vibrate?.(35)
  }catch(e){console.error(e);b.disabled=false;b.querySelector('span').textContent='Bank challenge · +'+q.points+' pts';toast('The capture could not be synced. Try again.')}
}

function locate(reopen){
  if(!navigator.geolocation){$('#locationStatus').textContent='This browser does not provide location access.';return}
  const b=$('#locate');if(b){b.disabled=true;b.querySelector('span').textContent='Finding you…'}
  navigator.geolocation.getCurrentPosition(p=>{
    state.location={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};state.accuracy=p.coords.accuracy;
    $('#locationStatus').textContent='Sorted by your location · accuracy about '+Math.round(p.coords.accuracy)+' m.';
    if(b){b.disabled=false;b.querySelector('span').textContent='Refresh location'}
    render().then(()=>reopen&&state.active?openQuest(state.active.id):updateComplete())
  },e=>{
    $('#locationStatus').textContent=e.code===1?'Location permission is off. Enable it for BrumQuest in Safari settings.':'Could not get a reliable location. Try again outdoors.';
    if(b){b.disabled=false;b.querySelector('span').textContent='Try location again'}
  },{enableHighAccuracy:true,timeout:12000,maximumAge:10000})
}

function mapTarget(){if(state.shared.mapTarget){const q=quests.find(x=>x.id===state.shared.mapTarget&&!done(x.id));if(q)return q}return sorted().find(x=>!done(x.id))||quests[0]}
function ensureMap(){
  if(state.map||!window.L)return;state.map=L.map('liveMap',{zoomControl:true,attributionControl:true}).setView([52.479,-1.91],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(state.map)
}
function renderMapTargets(){
  const s=$('#mapTarget');if(!s)return;const t=mapTarget();s.innerHTML=quests.filter(q=>!done(q.id)||q.id===t.id).map(q=>'<option value="'+q.id+'" '+(q.id===t.id?'selected':'')+'>'+esc(q.title)+' · '+esc(q.place)+'</option>').join('');s.onchange=()=>setTarget(s.value);$('#externalDirections').href='https://www.google.com/maps/dir/?api=1&destination='+t.lat+','+t.lon+'&travelmode=walking'
}
function refreshMapTarget(fit){
  if(!state.map)return;const t=mapTarget();if(state.targetMarker)state.targetMarker.remove();
  state.targetMarker=L.marker([t.lat,t.lon],{icon:L.divIcon({className:'map-quest-icon',html:'<div class="map-quest-dot">'+qnum(t)+'</div>',iconSize:[28,28],iconAnchor:[14,14]})}).addTo(state.map).bindTooltip(t.title,{direction:'top'});
  $('#externalDirections').href='https://www.google.com/maps/dir/?api=1&destination='+t.lat+','+t.lon+'&travelmode=walking';
  if(state.location){if(fit)state.map.fitBounds([[state.location.lat,state.location.lon],[t.lat,t.lon]],{padding:[45,45],maxZoom:17});route()}
  else{state.map.setView([t.lat,t.lon],16);$('#routeDistance').textContent='Location needed';$('#routeTime').textContent='—';$('#routeStatus').textContent='Enable live location to draw the walking route.'}
}
function updateMapPosition(p){
  state.location={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};state.accuracy=p.coords.accuracy;if(!state.map)return;
  const icon=L.divIcon({className:'map-user-icon',html:'<div class="map-user-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]});
  if(state.userMarker)state.userMarker.setLatLng([state.location.lat,state.location.lon]);else state.userMarker=L.marker([state.location.lat,state.location.lon],{icon,zIndexOffset:1000}).addTo(state.map).bindTooltip('You',{direction:'top'});
  const now=Date.now(),moved=state.lastOrigin?distanceMetres(state.lastOrigin.lat,state.lastOrigin.lon,state.location.lat,state.location.lon):Infinity;if(now-state.lastRouteAt>20000||moved>30)route()
}
async function route(){
  if(!state.location||!state.map)return;const t=mapTarget(),o={...state.location};state.lastRouteAt=Date.now();state.lastOrigin=o;$('#routeStatus').textContent='Updating walking route…';
  try{
    const url='https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+o.lon+','+o.lat+';'+t.lon+','+t.lat+'?overview=full&geometries=geojson&steps=false',r=await fetch(url);if(!r.ok)throw 0;const d=await r.json();if(d.code!=='Ok'||!d.routes?.[0])throw 0;const x=d.routes[0];if(state.routeLayer)state.routeLayer.remove();state.routeLayer=L.geoJSON(x.geometry,{style:{color:'#e66b3f',weight:5,opacity:.9}}).addTo(state.map);$('#routeDistance').textContent=fmt(x.distance).replace(' away','');$('#routeTime').textContent=Math.max(1,Math.round(x.duration/60))+' min';$('#routeStatus').textContent='Live route to '+t.place+'. Destination syncs; your live position stays private.'
  }catch{if(state.routeLayer){state.routeLayer.remove();state.routeLayer=null}const d=dist(t);$('#routeDistance').textContent=d===null?'Location needed':fmt(d).replace(' away','')+' direct';$('#routeTime').textContent='—';$('#routeStatus').textContent='Live routing is temporarily unavailable. Your position and destination are still shown.'}
}
function startTracking(){
  if(!navigator.geolocation){$('#routeStatus').textContent='Location is not available in this browser.';return}if(state.watchId!==null)return;$('#routeStatus').textContent='Finding your live position…';
  state.watchId=navigator.geolocation.watchPosition(p=>{updateMapPosition(p);$('#mapLocate').innerHTML='Live location on <span>●</span>'},e=>{$('#routeStatus').textContent=e.code===1?'Location permission is off. Enable it for BrumQuest in Safari settings.':'Could not update your position. Try again outdoors.';$('#mapLocate').innerHTML='Try live location <span>◎</span>'},{enableHighAccuracy:true,timeout:15000,maximumAge:5000})
}
function openMap(){ensureMap();if(!state.map){$('#routeStatus').textContent='Map tiles could not load. Use turn-by-turn directions below.';return}renderMapTargets();setTimeout(()=>{state.map.invalidateSize();refreshMapTarget(true)},50);startTracking()}
function recenter(){if(!state.map)return;const t=mapTarget();if(state.location)state.map.fitBounds([[state.location.lat,state.location.lon],[t.lat,t.lon]],{padding:[45,45],maxZoom:17});else state.map.setView([t.lat,t.lon],16)}

function navigate(name){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+name).classList.add('active');$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));window.scrollTo({top:0,behavior:'smooth'});render().then(()=>{if(name==='map')openMap()})}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600)}
function clearPreview(){if(state.photoPreview){URL.revokeObjectURL(state.photoPreview);state.photoPreview=null}}
async function compress(file){
  const max=1200;let src,w,h,release=()=>{};
  if('createImageBitmap'in window){src=await createImageBitmap(file);w=src.width;h=src.height;release=()=>src.close?.()}
  else{const u=URL.createObjectURL(file);src=await new Promise((res,rej)=>{const i=new Image;i.onload=()=>res(i);i.onerror=rej;i.src=u});w=src.naturalWidth;h=src.naturalHeight;release=()=>URL.revokeObjectURL(u)}
  const scale=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(src,0,0,c.width,c.height);release();return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('compress')),'image/jpeg',.74))
}
function b64(blob){return new Promise((res,rej)=>{const r=new FileReader;r.onload=()=>res(String(r.result||'').split(',')[1]||'');r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}

async function bootstrap(){
  state.session=readSession();const join=new URLSearchParams(location.search).get('join');
  if(state.session){hideGate();try{await refresh(true);setupRealtime()}catch(e){console.error(e);clearSession();showGate();$('#linkError').textContent='This phone is no longer linked. Join again with a new code.'}return}
  showGate(join?'join':'welcome');if(join)$('#joinCode').value=join.toUpperCase()
}

$$('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
$$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;render()});
$('#startNearby').onclick=()=>{navigate('explore');if(!state.location)locate(false)};
$('#locate').onclick=()=>locate(false);$('#mapLocate').onclick=startTracking;$('#recenterMap').onclick=recenter;$('#close').onclick=()=>$('#questDialog').close();$('#questDialog').addEventListener('close',clearPreview);
$('#createChoice').onclick=()=>showGate('create');$('#joinChoice').onclick=()=>showGate('join');$('#createBack').onclick=()=>showGate();$('#joinBack').onclick=()=>showGate();$('#createGame').onclick=createGame;$('#joinGame').onclick=joinGame;$('#startApp').onclick=()=>{hideGate();navigate('home')};$('#copyCode').onclick=()=>copyCode($('#copyCode').dataset.code);$('#shareCode').onclick=()=>shareCode($('#shareCode').dataset.code);$('#newLinkCode').onclick=newInvite;$('#profileShareCode').onclick=()=>shareCode($('#profileShareCode').dataset.code);$('#leaveShared').onclick=leave;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;$('#install').hidden=false});
$('#install').onclick=async()=>{if(!state.deferredInstall)return;state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;$('#install').hidden=true};
window.addEventListener('online',()=>refresh(true).catch(()=>{}));window.addEventListener('focus',()=>refresh(true).catch(()=>{}));window.addEventListener('pagehide',()=>{if(state.watchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(state.watchId)});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
render();bootstrap();