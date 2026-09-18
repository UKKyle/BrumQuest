import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { distanceMetres } from './core.js';

const supabase = createClient(
  'https://wvawoavejeoykqhorlob.supabase.co',
  'sb_publishable_c6TI0P3LG29WTyV9PvnwRw_iTlSLIMM',
  { auth: { persistSession: false } }
);

const categories = [
  { key:'all', label:'All', icon:'◉' },
  { key:'city', label:'City Finds', icon:'🏙' },
  { key:'wild', label:'Wildlife', icon:'🐦' },
  { key:'food', label:'Food & Shopping', icon:'🍴' },
  { key:'hist', label:'History', icon:'🏛' },
  { key:'bonus', label:'Bonus', icon:'☺' },
  { key:'final', label:'Final', icon:'★' }
];

const hunt = [
  ['city-01','city','A hidden courtyard'],['city-02','city','A ghost sign'],['city-03','city','A blue Birmingham City Council street sign'],['city-04','city','A building dating from before 1850'],['city-05','city','An old-fashioned shopfront'],['city-06','city','A building with a date carved into it'],['city-07','city','A lion somewhere unexpected'],['city-08','city','A statue you’ve never noticed before'],['city-09','city','A weird or unusual street name'],['city-10','city','A tiny alleyway or passage'],['city-11','city','A hidden staircase'],['city-12','city','A building with an unusual roof'],['city-13','city','A gargoyle or grotesque'],['city-14','city','An interesting door knocker'],['city-15','city','A stained-glass window'],['city-16','city','A decorative tiled entrance'],['city-17','city','An old Birmingham Corporation feature'],['city-18','city','A historic plaque'],['city-19','city','Evidence of Birmingham’s industrial past'],['city-20','city','Evidence of bomb damage / wartime history'],['city-21','city','An old railway feature'],['city-22','city','A canal bridge'],['city-23','city','A canal lock'],['city-24','city','A canal-side detail most people walk past'],['city-25','city','A piece of public art'],['city-26','city','Street art or graffiti you actually like'],['city-27','city','A funny sign'],['city-28','city','A sign with a spelling/grammar mistake'],['city-29','city','Something painted an unexpected colour'],['city-30','city','A completely random object somewhere it shouldn’t be'],['city-31','city','A particularly ugly building'],['city-32','city','A particularly beautiful building'],['city-33','city','Something that looks much older than its surroundings'],['city-34','city','A reflection of Birmingham in glass or water'],['city-35','city','A view of the city skyline'],['city-36','city','A view where you can see at least 3 different architectural eras'],['city-37','city','A place you’ve walked past before but never noticed'],['city-38','city','Something that makes you think “only in Birmingham”'],
  ['wild-01','wild','A pigeon doing something ridiculous'],['wild-02','wild','A duck'],['wild-03','wild','A swan'],['wild-04','wild','A dog in an outfit'],['wild-05','wild','A cat'],['wild-06','wild','A bird other than a pigeon'],['wild-07','wild','An unusually brave animal'],['wild-08','wild','An animal somewhere completely unexpected'],
  ['food-01','food','A menu item with a ridiculous name'],['food-02','food','A menu typo'],['food-03','food','Something being sold for exactly £1'],['food-04','food','A shop you’ve never seen before'],['food-05','food','The strangest thing in a shop window'],['food-06','food','A Birmingham-themed souvenir'],['food-07','food','A completely unnecessary item you are tempted to buy'],['food-08','food','The cheapest food you can find'],['food-09','food','A restaurant/café you’ve never noticed before'],
  ['hist-01','hist','A building with a blue plaque'],['hist-02','hist','A building with an old business name still visible'],['hist-03','hist','A surviving Victorian feature'],['hist-04','hist','A surviving Georgian feature'],['hist-05','hist','Something connected to Birmingham’s jewellery industry'],['hist-06','hist','Something connected to Birmingham’s manufacturing history'],['hist-07','hist','Something connected to the canals'],['hist-08','hist','Something connected to Birmingham’s railway history'],['hist-09','hist','A memorial'],['hist-10','hist','A historical figure’s name'],['hist-11','hist','A piece of architecture that has survived major redevelopment'],['hist-12','hist','Something that reveals what the area used to be like'],
  ['bonus-01','bonus','Find something that looks like a face'],['bonus-02','bonus','Find a heart shape'],['bonus-03','bonus','Find a perfect circle'],['bonus-04','bonus','Find something accidentally matching your outfit'],['bonus-05','bonus','Find the weirdest door in Birmingham'],['bonus-06','bonus','Find the most unnecessarily complicated sign'],['bonus-07','bonus','Find something that looks like it belongs somewhere completely different'],['bonus-08','bonus','Take a photo that makes Birmingham look like another city'],['bonus-09','bonus','Take the most stereotypically “Brummie” photo possible'],['bonus-10','bonus','Find something you would never have noticed without doing this hunt'],
  ['final-01','final','Find something genuinely surprising that isn’t on this list']
].map(([id,category,title],index)=>({id,category,title,index:index+1}));

const mapStops = [
  {id:'gas-street',title:'Gas Street Basin',lat:52.47507,lon:-1.90798},
  {id:'black-sabbath',title:'Black Sabbath Bridge',lat:52.477704,lon:-1.910686},
  {id:'old-turn',title:'Old Turn Junction',lat:52.47924,lon:-1.91385},
  {id:'cambrian',title:'Cambrian Wharf',lat:52.48067,lon:-1.91179},
  {id:'farmers-locks',title:"Farmer's Bridge Locks",lat:52.4829,lon:-1.9064},
  {id:'brindley',title:'Brindleyplace',lat:52.4775,lon:-1.91339},
  {id:'mailbox',title:'The Mailbox',lat:52.47523,lon:-1.90614},
  {id:'worcester-bar',title:'Worcester Bar',lat:52.47722,lon:-1.91},
  {id:'narrowboat',title:'Central canal zone',lat:52.4778,lon:-1.91},
  {id:'bridge-frame',title:'Brindley canal bridges',lat:52.4785,lon:-1.91},
  {id:'canal-wildlife',title:'Canal wildlife zone',lat:52.48,lon:-1.908},
  {id:'industrial-detail',title:'Canal quarter',lat:52.481,lon:-1.909}
];

const state = {
  session:null,
  shared:{completed:[],mapTarget:null,members:1,highlights:{}},
  huntFilter:'all',
  captureFilter:'all',
  search:'',
  activeItem:null,
  photo:null,
  photoPreview:null,
  deferredInstall:null,
  channel:null,
  poll:null,
  map:null,
  location:null,
  userMarker:null,
  targetMarker:null,
  routeLayer:null,
  watchId:null,
  lastRouteAt:0,
  lastOrigin:null
};

const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const cat=k=>categories.find(c=>c.key===k);
const itemById=id=>hunt.find(i=>i.id===id);
const completed=id=>state.shared.completed.find(x=>x.id===id)||null;
const completedIds=()=>new Set(state.shared.completed.map(x=>x.id));
const score=()=>Math.round(state.shared.completed.length/hunt.length*100);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function api(action,payload={}){
  const {data,error}=await supabase.functions.invoke('brumquest-api',{body:{action,...payload}});
  if(error)throw error;
  if(data?.error){const e=new Error(data.error);e.code=data.error;throw e}
  return data;
}
function auth(){return{groupId:state.session.groupId,accessKey:state.session.accessKey}}
function readSession(){try{const x=JSON.parse(localStorage.getItem('brumquest-session'));return x?.groupId&&x?.accessKey?x:null}catch{return null}}
function saveSession(x){state.session=x;localStorage.setItem('brumquest-session',JSON.stringify(x))}
function clearSession(){localStorage.removeItem('brumquest-session');state.session=null;state.shared={completed:[],mapTarget:null,members:1,highlights:{}}}

function applyShared(next,quiet=false){
  if(!next)return;
  const before=JSON.stringify({c:state.shared.completed.map(x=>x.id),t:state.shared.mapTarget,m:state.shared.members,h:state.shared.highlights});
  state.shared={
    completed:Array.isArray(next.completed)?next.completed:[],
    mapTarget:next.mapTarget||null,
    members:Number(next.members||1),
    highlights:next.highlights||{},
    updatedAt:next.updatedAt||null
  };
  render();
  if($('#map').classList.contains('active')){renderMapTargets();refreshMapTarget(false)}
  const after=JSON.stringify({c:state.shared.completed.map(x=>x.id),t:state.shared.mapTarget,m:state.shared.members,h:state.shared.highlights});
  if(before!==after&&!quiet)toast('Shared hunt updated');
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
async function broadcast(){try{await state.channel?.send({type:'broadcast',event:'refresh',payload:{at:Date.now()}})}catch{}}

function showGate(mode='welcome'){
  $('#linkGate').hidden=false;document.body.classList.add('linking');$('#linkError').textContent='';
  $('#welcomePane').hidden=mode!=='welcome';$('#createPane').hidden=mode!=='create';$('#joinPane').hidden=mode!=='join';
}
function hideGate(){$('#linkGate').hidden=true;document.body.classList.remove('linking')}
async function createGame(){
  const b=$('#createGame');b.disabled=true;b.textContent='Creating…';
  try{
    const d=await api('create');
    saveSession({groupId:d.groupId,accessKey:d.accessKey,role:'owner'});
    applyShared(d.state,true);setupRealtime();
    $('#linkCode').textContent=d.code;$('#copyCode').dataset.code=d.code;$('#shareCode').dataset.code=d.code;
    $('#startApp').hidden=false;b.hidden=true;
    $('#createdHelp').textContent='Share this one-time code. It expires in 30 minutes and stops working after the second phone joins.';
  }catch(e){console.error(e);$('#linkError').textContent='Could not create the shared hunt. Check your connection and try again.';b.disabled=false;b.textContent='Create linking code'}
}
async function joinGame(){
  const code=$('#joinCode').value.trim().toUpperCase();
  if(!code){$('#linkError').textContent='Enter the linking code first.';return}
  const b=$('#joinGame');b.disabled=true;b.textContent='Joining…';
  try{
    const d=await api('join',{code});
    saveSession({groupId:d.groupId,accessKey:d.accessKey,role:'member'});
    applyShared(d.state,true);setupRealtime();hideGate();navigate('home');
    history.replaceState({},'',location.pathname);toast('Linked. Shared sync is live.');
  }catch(e){console.error(e);$('#linkError').textContent=e.code==='expired_code'?'That code has expired. Create a new one on the other phone.':e.code==='group_full'?'Two phones are already linked to that hunt.':'That linking code is not valid.';b.disabled=false;b.textContent='Join shared BrumQuest'}
}
function inviteUrl(code){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('join',code);return u.toString()}
async function copyCode(code){if(!code)return;try{await navigator.clipboard.writeText(code);toast('Linking code copied')}catch{toast('Code: '+code)}}
async function shareCode(code){if(!code)return;if(navigator.share){try{await navigator.share({title:'Join my BrumQuest',text:'Join my Birmingham scavenger hunt with code '+code,url:inviteUrl(code)});return}catch(e){if(e?.name==='AbortError')return}}copyCode(code)}
async function newInvite(){
  const b=$('#newLinkCode');b.disabled=true;
  try{const d=await api('invite',auth());$('#profileLinkCode').textContent=d.code;$('#profileShareCode').dataset.code=d.code;$('#profileInviteBox').hidden=false}
  catch(e){toast(e.code==='group_full'?'Two phones are already linked.':'Could not create a code.')}
  finally{b.disabled=false}
}
async function leave(){
  if(!confirm('Leave this shared BrumQuest on this phone? Shared captures will remain available on the other linked phone.'))return;
  if(state.channel)supabase.removeChannel(state.channel);clearInterval(state.poll);clearSession();showGate();
}

function categoryCounts(){
  const ids=completedIds();
  return categories.filter(c=>c.key!=='all').map(c=>{
    const items=hunt.filter(i=>i.category===c.key),done=items.filter(i=>ids.has(i.id)).length;
    return {...c,total:items.length,done};
  });
}
function renderFilters(target,active,type){
  target.innerHTML=categories.map(c=>{
    const total=c.key==='all'?hunt.length:hunt.filter(i=>i.category===c.key).length;
    return '<button class="filter '+(active===c.key?'active':'')+'" data-'+type+'-filter="'+c.key+'"><span class="filter-icon">'+c.icon+'</span>'+c.label+' <b>'+total+'</b></button>';
  }).join('');
}
function visibleHunt(){
  const q=state.search.trim().toLowerCase();
  return hunt.filter(i=>(state.huntFilter==='all'||i.category===state.huntFilter)&&(!q||i.title.toLowerCase().includes(q)));
}
function huntRow(i){
  const record=completed(i.id),c=cat(i.category);
  return '<button class="hunt-row '+(record?'done':'')+'" data-item="'+i.id+'"><span class="hunt-check">'+(record?'✓':'')+'</span><span class="hunt-copy"><small>'+c.icon+' '+c.label+' · '+String(i.index).padStart(2,'0')+'</small><b>'+esc(i.title)+'</b></span><span class="hunt-action">'+(record?'View':'Add photo')+'</span></button>';
}
function milestones(){
  const n=state.shared.completed.length;
  return [
    ['First find','Complete your first capture.',n>=1],
    ['Quarter hunt','Reach 25 / 100.',score()>=25],
    ['Halfway','Reach 50 / 100.',score()>=50],
    ['Three quarters','Reach 75 / 100.',score()>=75],
    ['Category sweep','Complete any full category.',categoryCounts().some(c=>c.done===c.total)],
    ['Birmingham complete','Find all 78 things.',n===78]
  ];
}

function render(){
  const n=state.shared.completed.length,s=score(),counts=categoryCounts();
  $('#scoreTop').textContent=s;$('#scoreHome').textContent=s;$('#scoreProfile').textContent=s;
  $('#foundHome').textContent=n;$('#foundProfile').textContent=n;$('#captureCount').textContent=n;
  $('#scoreRing').style.setProperty('--progress',s*3.6+'deg');
  $('#scoreHint').textContent=n===0?'Take your first photo to get started.':n===78?'You found every item. Birmingham complete.':(78-n)+' finds left.';
  $('#syncStatus').textContent=state.shared.members>=2?'2 phones linked · live sync':'Waiting for second phone';
  $('#nextMilestone').textContent=n===78?'All 78 finds complete.':Math.max(0,78-n)+' finds remaining.';

  $('#categoryProgress').innerHTML=counts.map(c=>'<button class="category-card" data-home-category="'+c.key+'"><span>'+c.icon+'</span><div><b>'+c.label+'</b><small>'+c.done+' / '+c.total+' found</small></div><strong>'+Math.round(c.done/c.total*100)+'%</strong></button>').join('');

  const recent=state.shared.completed.slice().reverse().slice(0,4);
  $('#recentCaptures').innerHTML=recent.length?recent.map(c=>captureCard(c,true)).join(''):'<div class="empty-card">Your first shared capture will appear here.</div>';

  renderFilters($('#huntFilters'),state.huntFilter,'hunt');
  const visible=visibleHunt();
  const doneVisible=visible.filter(i=>completed(i.id)).length;
  $('#huntSummary').innerHTML='<span>'+doneVisible+' of '+visible.length+' shown items found</span><span>'+n+'/78 total</span>';
  $('#huntList').innerHTML=visible.map(huntRow).join('')||'<div class="empty-card">No checklist items match that search.</div>';

  renderFilters($('#captureFilters'),state.captureFilter,'capture');
  const captures=state.shared.completed.slice().reverse().filter(c=>{
    const item=itemById(c.id);
    return item&&(state.captureFilter==='all'||item.category===state.captureFilter);
  });
  $('#captureGrid').innerHTML=captures.length?captures.map(c=>captureCard(c,false)).join(''):'<div class="empty-card wide">No captures in this category yet.</div>';

  const m=milestones();
  $('#milestones').innerHTML=m.map(x=>'<div class="milestone '+(x[2]?'earned':'')+'"><span>'+(x[2]?'✓':'○')+'</span><div><b>'+x[0]+'</b><small>'+x[1]+'</small></div></div>').join('');

  $('#bestFind').value=state.shared.highlights.bestFind||'';
  $('#weirdestFind').value=state.shared.highlights.weirdestFind||'';
  const best=$('#bestPhoto');
  const options=['<option value="">Choose from your captures</option>'].concat(state.shared.completed.map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>'));
  best.innerHTML=options.join('');best.value=state.shared.highlights.bestPhoto||'';

  bindDynamic();
}
function captureCard(c,compact){
  const item=itemById(c.id);if(!item)return'';
  const category=cat(item.category);
  return '<button class="capture-card '+(compact?'compact':'')+'" data-photo="'+c.id+'"><div class="capture-image">'+(c.photoUrl?'<img src="'+esc(c.photoUrl)+'" alt="'+esc(c.title)+'">':'<span>Photo unavailable</span>')+'</div><div class="capture-meta"><small>'+category.icon+' '+category.label+'</small><b>'+esc(c.title)+'</b><span>'+new Date(c.completedAt).toLocaleDateString('en-GB')+'</span></div></button>';
}
function bindDynamic(){
  $$('[data-item]').forEach(b=>b.onclick=()=>openItem(b.dataset.item));
  $$('[data-photo]').forEach(b=>b.onclick=()=>openPhoto(b.dataset.photo));
  $$('[data-hunt-filter]').forEach(b=>b.onclick=()=>{state.huntFilter=b.dataset.huntFilter;render()});
  $$('[data-capture-filter]').forEach(b=>b.onclick=()=>{state.captureFilter=b.dataset.captureFilter;render()});
  $$('[data-home-category]').forEach(b=>b.onclick=()=>{state.huntFilter=b.dataset.homeCategory;navigate('hunt')});
}

function openItem(id){
  const item=itemById(id);if(!item)return;state.activeItem=item;state.photo=null;clearPreview();
  const record=completed(id),category=cat(item.category);
  let body='';
  if(record){
    body='<button class="large-capture" data-photo="'+id+'>'+(record.photoUrl?'<img src="'+esc(record.photoUrl)+'" alt="'+esc(item.title)+'">':'<span>Photo unavailable</span>')+'</button><div class="complete-banner">✓ Found · shared on both phones</div>';
  }else{
    body='<label class="photo-button"><input id="photoInput" type="file" accept="image/*" capture="environment" hidden><span>Take / choose photo</span><span>＋</span></label><div id="photoPreview" class="photo-preview" hidden></div><button id="saveCapture" class="button button-primary" disabled>Save shared capture</button><p class="sheet-note">No GPS check is required for scavenger finds. Use a photo that clearly shows the thing you found.</p>';
  }
  $('#itemDetail').innerHTML='<article class="item-sheet"><div class="sheet-meta"><span>'+category.icon+' '+category.label+'</span><span>'+String(item.index).padStart(2,'0')+' / 78</span></div><h2>'+esc(item.title)+'</h2><p class="sheet-note">Photograph this anywhere in Birmingham. Once saved, the item is checked off for both linked phones.</p>'+body+'</article>';
  $('#itemDialog').showModal();
  if(!record){
    $('#photoInput').onchange=choosePhoto;
    $('#saveCapture').onclick=saveCapture;
  }else{
    const p=$('#itemDetail [data-photo]');if(p)p.onclick=()=>{$('#itemDialog').close();openPhoto(id)};
  }
}
function choosePhoto(e){
  const f=e.target.files?.[0];if(!f)return;
  if(!f.type.startsWith('image/'))return toast('Choose an image file.');
  state.photo=f;clearPreview();state.photoPreview=URL.createObjectURL(f);
  const p=$('#photoPreview');p.innerHTML='<img src="'+state.photoPreview+'" alt="Selected scavenger hunt photo">';p.hidden=false;$('#saveCapture').disabled=false;
}
async function saveCapture(){
  const item=state.activeItem;if(!item||!state.photo)return;
  const b=$('#saveCapture');b.disabled=true;b.textContent='Saving…';
  try{
    const blob=await compress(state.photo),photoBase64=await b64(blob);
    const d=await api('complete',{...auth(),questId:item.id,photoBase64});
    applyShared(d.state,true);await broadcast();$('#itemDialog').close();state.photo=null;clearPreview();toast('Captured · '+item.title);
  }catch(e){console.error(e);b.disabled=false;b.textContent='Save shared capture';toast('Could not save that capture. Try again.')}
}
function openPhoto(id){
  const record=completed(id),item=itemById(id);if(!record||!item)return;
  const category=cat(item.category);
  $('#photoDetail').innerHTML='<div class="photo-full">'+(record.photoUrl?'<img src="'+esc(record.photoUrl)+'" alt="'+esc(item.title)+'">':'<div class="photo-missing">Photo unavailable</div>')+'</div><div class="photo-caption"><small>'+category.icon+' '+category.label+'</small><h2>'+esc(item.title)+'</h2><p>Captured '+new Date(record.completedAt).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})+'</p></div>';
  $('#photoDialog').showModal();
}
function clearPreview(){if(state.photoPreview){URL.revokeObjectURL(state.photoPreview);state.photoPreview=null}}

async function saveHighlights(){
  const b=$('#saveHighlights');b.disabled=true;b.textContent='Saving…';
  try{
    const d=await api('highlights',{...auth(),highlights:{bestFind:$('#bestFind').value.trim(),weirdestFind:$('#weirdestFind').value.trim(),bestPhoto:$('#bestPhoto').value}});
    applyShared(d.state,true);await broadcast();toast('Shared highlights saved');
  }catch(e){console.error(e);toast('Could not save highlights.')}
  finally{b.disabled=false;b.textContent='Save shared highlights'}
}

function target(){return mapStops.find(x=>x.id===state.shared.mapTarget)||mapStops[0]}
async function setTarget(id){
  state.shared.mapTarget=id;renderMapTargets();refreshMapTarget(false);
  try{const d=await api('target',{...auth(),mapTarget:id});applyShared(d.state,true);await broadcast()}catch(e){console.error(e);toast('Could not sync the map destination.')}
}
function ensureMap(){
  if(state.map||!window.L)return;
  state.map=L.map('liveMap',{zoomControl:true,attributionControl:true}).setView([52.479,-1.91],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(state.map);
}
function renderMapTargets(){
  const s=$('#mapTarget');if(!s)return;const t=target();
  s.innerHTML=mapStops.map(x=>'<option value="'+x.id+'" '+(x.id===t.id?'selected':'')+'>'+esc(x.title)+'</option>').join('');
  s.onchange=()=>setTarget(s.value);
  $('#externalDirections').href='https://www.google.com/maps/dir/?api=1&destination='+t.lat+','+t.lon+'&travelmode=walking';
}
function refreshMapTarget(fit){
  if(!state.map)return;const t=target();
  if(state.targetMarker)state.targetMarker.remove();
  state.targetMarker=L.marker([t.lat,t.lon],{icon:L.divIcon({className:'map-quest-icon',html:'<div class="map-pin">★</div>',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(state.map).bindTooltip(t.title,{direction:'top'});
  $('#externalDirections').href='https://www.google.com/maps/dir/?api=1&destination='+t.lat+','+t.lon+'&travelmode=walking';
  if(state.location){if(fit)state.map.fitBounds([[state.location.lat,state.location.lon],[t.lat,t.lon]],{padding:[45,45],maxZoom:17});route()}
  else{state.map.setView([t.lat,t.lon],16);$('#routeDistance').textContent='Location needed';$('#routeTime').textContent='—';$('#routeStatus').textContent='Enable live location to draw a walking route.'}
}
function updateMapPosition(p){
  state.location={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};if(!state.map)return;
  const icon=L.divIcon({className:'map-user-icon',html:'<div class="map-user-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]});
  if(state.userMarker)state.userMarker.setLatLng([state.location.lat,state.location.lon]);else state.userMarker=L.marker([state.location.lat,state.location.lon],{icon,zIndexOffset:1000}).addTo(state.map).bindTooltip('You',{direction:'top'});
  const now=Date.now(),moved=state.lastOrigin?distanceMetres(state.lastOrigin.lat,state.lastOrigin.lon,state.location.lat,state.location.lon):Infinity;
  if(now-state.lastRouteAt>20000||moved>30)route();
}
async function route(){
  if(!state.location||!state.map)return;const t=target(),o={...state.location};state.lastRouteAt=Date.now();state.lastOrigin=o;$('#routeStatus').textContent='Updating walking route…';
  try{
    const u='https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+o.lon+','+o.lat+';'+t.lon+','+t.lat+'?overview=full&geometries=geojson&steps=false';
    const r=await fetch(u);if(!r.ok)throw new Error('route');const d=await r.json();if(d.code!=='Ok'||!d.routes?.[0])throw new Error('route');
    const x=d.routes[0];if(state.routeLayer)state.routeLayer.remove();state.routeLayer=L.geoJSON(x.geometry,{style:{color:'#ff6b35',weight:5,opacity:.9}}).addTo(state.map);
    $('#routeDistance').textContent=x.distance<1000?Math.round(x.distance)+' m':(x.distance/1000).toFixed(1)+' km';$('#routeTime').textContent=Math.max(1,Math.round(x.duration/60))+' min';$('#routeStatus').textContent='Walking route to '+t.title+'. Your live position stays private.';
  }catch{
    if(state.routeLayer){state.routeLayer.remove();state.routeLayer=null}
    const d=distanceMetres(o.lat,o.lon,t.lat,t.lon);$('#routeDistance').textContent=(d<1000?Math.round(d)+' m':(d/1000).toFixed(1)+' km')+' direct';$('#routeTime').textContent='—';$('#routeStatus').textContent='Live routing is temporarily unavailable. Your position and destination are still shown.';
  }
}
function startTracking(){
  if(!navigator.geolocation){$('#routeStatus').textContent='Location is not available in this browser.';return}
  if(state.watchId!==null)return;
  $('#routeStatus').textContent='Finding your live position…';
  state.watchId=navigator.geolocation.watchPosition(p=>{updateMapPosition(p);$('#mapLocate').innerHTML='Live location on <span>●</span>'},e=>{$('#routeStatus').textContent=e.code===1?'Location permission is off. Enable it for BrumQuest in Safari settings.':'Could not update your position. Try again outdoors.';$('#mapLocate').innerHTML='Try live location <span>◎</span>'},{enableHighAccuracy:true,timeout:15000,maximumAge:5000});
}
function openMap(){
  ensureMap();if(!state.map){$('#routeStatus').textContent='Map tiles could not load. Use turn-by-turn directions below.';return}
  renderMapTargets();setTimeout(()=>{state.map.invalidateSize();refreshMapTarget(true)},50);startTracking();
}
function recenter(){
  if(!state.map)return;const t=target();
  if(state.location)state.map.fitBounds([[state.location.lat,state.location.lon],[t.lat,t.lon]],{padding:[45,45],maxZoom:17});else state.map.setView([t.lat,t.lon],16);
}

function navigate(name){
  $$('.view').forEach(v=>v.classList.remove('active'));$('#'+name).classList.add('active');$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  window.scrollTo({top:0,behavior:'smooth'});render();if(name==='map')openMap();
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2500)}
async function compress(file){
  const max=1400;let src,w,h,release=()=>{};
  if('createImageBitmap'in window){src=await createImageBitmap(file);w=src.width;h=src.height;release=()=>src.close?.()}
  else{const u=URL.createObjectURL(file);src=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u});w=src.naturalWidth;h=src.naturalHeight;release=()=>URL.revokeObjectURL(u)}
  const scale=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(src,0,0,c.width,c.height);release();
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('compress')),'image/jpeg',.78));
}
function b64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||'').split(',')[1]||'');r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}

async function bootstrap(){
  state.session=readSession();const join=new URLSearchParams(location.search).get('join');
  if(state.session){hideGate();try{await refresh(true);setupRealtime()}catch(e){console.error(e);clearSession();showGate();$('#linkError').textContent='This phone is no longer linked. Join again with a new code.'}return}
  showGate(join?'join':'welcome');if(join)$('#joinCode').value=join.toUpperCase();
}

$$('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
$('#continueHunt').onclick=()=>navigate('hunt');
$('#huntSearch').addEventListener('input',e=>{state.search=e.target.value;render()});
$('#recenterMap').onclick=recenter;$('#mapLocate').onclick=startTracking;
$('#closeItem').onclick=()=>$('#itemDialog').close();$('#itemDialog').addEventListener('close',clearPreview);
$('#closePhoto').onclick=()=>$('#photoDialog').close();
$('#createChoice').onclick=()=>showGate('create');$('#joinChoice').onclick=()=>showGate('join');$('#createBack').onclick=()=>showGate();$('#joinBack').onclick=()=>showGate();
$('#createGame').onclick=createGame;$('#joinGame').onclick=joinGame;$('#startApp').onclick=()=>{hideGate();navigate('home')};$('#copyCode').onclick=()=>copyCode($('#copyCode').dataset.code);$('#shareCode').onclick=()=>shareCode($('#shareCode').dataset.code);
$('#newLinkCode').onclick=newInvite;$('#profileShareCode').onclick=()=>shareCode($('#profileShareCode').dataset.code);$('#leaveShared').onclick=leave;$('#saveHighlights').onclick=saveHighlights;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;$('#install').hidden=false});
$('#install').onclick=async()=>{if(!state.deferredInstall)return;state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;$('#install').hidden=true};
window.addEventListener('online',()=>refresh(true).catch(()=>{}));window.addEventListener('focus',()=>refresh(true).catch(()=>{}));
window.addEventListener('pagehide',()=>{if(state.watchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(state.watchId)});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));

render();
bootstrap();