const cases = [
  ['glass-transfer','Facet-glasset','1440 / 960','Flytt pekeren over et glassfelt. Trykk «Read paper» og deretter «Back».', [['Hel flate',1],['Glass i bevegelse',3.95],['Papiret',4.55]]],
  ['collapse-icon','Sidepanel med drag','456 / 270','Dra den hvite flaten mot høyre, hold midtveis, og dra den tilbake mot venstre.', [['Lukket',.08],['Midt i draget',2.8],['Åpent',5.1]]],
  ['quick-actions','Quick Actions','320 / 320','Trykk på plusstegnet. Hold pekeren over en handling. Lukk med krysset eller Escape.', [['Lukket',.08],['Handlinger synlige',1.5],['Peker over kort',2.7]]],
  ['patient-funnel','Patient funnel','358 / 270','Bytt fra «All patients» til «In-clinic» eller «Telehealth», og se hvordan profilen og partiklene endres.', [['Alle pasienter',.12],['In-clinic',4.6],['Telehealth',6.3]]],
  ['calorie-flame','Energy flame meter','356 / 270','Bytt mellom Walk, Run og Cycle. Bruk den hvite knappen for å stoppe og fortsette.', [['Tidlig i klippet',.09],['Aktiv flamme',4.1],['Sent i klippet',7.7]]],
  ['file-drawer','Archive Drawer','344 / 270','Trykk på metallfronten. Hold pekeren over en fane for å løfte den litt, eller trykk for å løfte kortet ut.', [['Lukket',.05],['Åpen skuff',1.1],['Mono løftet',7.65],['Nord løftet',12.0]]]
];
const picker = document.querySelector('#cases');
const movie = document.querySelector('#original');
const frame = document.querySelector('#copy');
const panel = document.querySelector('#pair');
const instruction = document.querySelector('#input');
const markers = document.querySelector('#marks');
const missing = document.querySelector('#error');
const localMovie=document.querySelector('#site-copy');
const websiteActions=document.querySelector('#website-actions');
const copyLabel=document.querySelector('#copy-label');
const status=document.querySelector('#web-status');
const before=document.querySelector('#original-frame'),after=document.querySelector('#copy-frame');
const videos=document.querySelector('#show-videos');
const libraryLink=document.querySelector('.actions a');
let activeWebsite=false;
function showLive(){
  before.hidden=true;after.hidden=true;movie.hidden=false;
  localMovie.hidden=!activeWebsite;frame.hidden=activeWebsite;
  copyLabel.textContent=activeWebsite?'Opptak fra kopien med originalkode':'Kjørbar komponent';
  videos.hidden=true;
  markers.querySelectorAll('[aria-pressed]').forEach(button=>button.setAttribute('aria-pressed','false'));
}
videos.addEventListener('click',()=>{
  showLive();
  if(activeWebsite)movie.play().catch(()=>{});
});
try {
  const response=await fetch('./private-reference/websites.json');
  if(response.ok){
    const sites=await response.json();
    for(const site of sites){
      const failures=site.missingRoutes>0?' '+site.missingRoutes+' forespørsler manglet i arkivet.':'';
      cases.push([site.id,site.title,site.ratio,site.hint+failures,[['Start',0]],
        './private-reference/website-replays/'+site.id+'/original.webm',site]);
    }
  }
} catch {}
try {
  const [response,review]=await Promise.all([
    fetch('./private-reference/manifest.json'),
    fetch('./private-reference/component-pairs.json')
  ]);
  if(response.ok){
    const assets=await response.json();
    const pairs=review.ok?await review.json():{};
    for(const entry of assets.comparisons??[]) cases.push([entry.id,entry.label,entry.ratio,
      pairs[entry.id]?.hint??'Bruk kontrollene i komponenten til høyre. Originalklippet kan stoppes og spoles separat.',
      [['Start',0]],entry.source,null,pairs[entry.id]]);
  }
} catch {}
for (const [id,label] of cases) picker.add(new Option(label,id));

function show() {
  const [id,label,ratio,hint,points,source,website,study] = cases.find(([key]) => key === picker.value);
  activeWebsite=Boolean(website);
  instruction.textContent = hint;
  panel.style.setProperty('--ratio',ratio);
  libraryLink.href='./index.html?reference-assets=1#'+id;
  movie.pause();
  movie.hidden=false;before.hidden=true;after.hidden=true;videos.hidden=true;
  movie.removeAttribute('poster');localMovie.removeAttribute('poster');
  movie.src = source ?? './private-reference/' + id + '.mp4';
  localMovie.pause();localMovie.hidden=!website;frame.hidden=Boolean(website);
  websiteActions.hidden=!website;status.textContent='';
  copyLabel.textContent=website?'Opptak fra kopien med originalkode':'Kjørbar komponent';
  if(website){
    frame.removeAttribute('src');
    const base='./private-reference/website-replays/'+id+'/';
    localMovie.src=base+'copy.webm';
    if(website.frames?.length){
      movie.poster=base+website.frames[0].original;
      localMovie.poster=base+website.frames[0].copy;
    }
  }else{
    localMovie.removeAttribute('src');
    frame.title = label + ' med fungerende kontroller';
    frame.src = './index.html?demo=1&reference-assets=1#' + id;
  }
  missing.hidden = true;
  markers.replaceChildren();
  const pairs=website?.frames??study?.frames;
  if(pairs?.length){
    pairs.forEach((step,i)=>{
      const action=document.createElement('button');
      action.type='button';
      action.textContent=(i?i+' · ':'')+step.label;
      action.setAttribute('aria-pressed','false');
      action.addEventListener('click',()=>{
        movie.pause();localMovie.pause();
        movie.hidden=true;localMovie.hidden=true;frame.hidden=true;
        const base=website?'./private-reference/website-replays/'+id+'/':'./private-reference/component-frames/'+id+'/';
        before.src=base+step.original;after.src=base+step.copy;
        before.hidden=false;after.hidden=false;videos.hidden=false;
        videos.textContent=website?'Spill opptak':'Tilbake til kjørbar komponent';
        copyLabel.textContent=website?'Kopien med originalkode':'Opptak fra komponenten';
        markers.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button===action)));
      });
      markers.append(action);
    });
    return;
  }
  for (const [text,position] of points) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', () => {
      movie.pause();
      if (movie.readyState) movie.currentTime = position;
      else movie.addEventListener('loadedmetadata', () => { movie.currentTime = position; }, { once:true });
    });
    markers.append(button);
  }
}
movie.addEventListener('error', () => { missing.hidden = false; });
for(const [track,other] of [[movie,localMovie],[localMovie,movie]]){
  track.addEventListener('play',()=>{
    if(!localMovie.hidden&&other.paused)other.play().catch(()=>{});
  });
  track.addEventListener('pause',()=>{
    if(!localMovie.hidden&&!other.paused)other.pause();
  });
  track.addEventListener('seeked',()=>{
    if(localMovie.hidden||other.readyState<1)return;
    const paired=Math.min(track.currentTime,other.duration);
    if(Math.abs(other.currentTime-paired)>.1)other.currentTime=paired;
  });
}
document.querySelector('#open-site').addEventListener('click',async()=>{
  try{
    const response=await fetch('/open-archived-site/'+encodeURIComponent(picker.value),{method:'POST',headers:{'X-Reference-Replay':'1'}});
    status.textContent=response.ok?'Åpner den lokale kopien i et eget Chrome-vindu.':'Kopien kunne ikke åpnes fra denne serveren.';
  }catch{status.textContent='Kopien kunne ikke åpnes.';}
});
picker.addEventListener('change', () => { history.replaceState(null,'','#'+picker.value); show(); });
function readHash() {
  const requested=location.hash.slice(1);
  if (cases.some(([id]) => id === requested)) picker.value=requested;
  show();
}
window.addEventListener('hashchange',readHash);
readHash();
