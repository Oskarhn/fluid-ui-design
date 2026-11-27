const cases = [
  ['glass-transfer','Facet-glasset','1440 / 960','Flytt pekeren over et glassfelt. Trykk «Read paper» og deretter «Back».', [['Hel flate',1],['Glass i bevegelse',3.95],['Papiret',4.55]]],
  ['collapse-icon','Sidepanel med drag','456 / 270','Dra den hvite flaten mot høyre, hold midtveis, og dra den tilbake mot venstre.', [['Lukket',.08],['Midt i draget',2.8],['Åpent',5.1]]],
  ['quick-actions','Quick Actions','320 / 320','Trykk på plusstegnet. Hold pekeren over en handling. Lukk med krysset eller Escape.', [['Lukket',.08],['Handlinger synlige',1.5],['Peker over kort',2.7]]],
  ['patient-funnel','Patient funnel','358 / 270','Bytt fra «All patients» til «In-clinic» eller «Telehealth», og se hvordan profilen og partiklene endres.', [['Alle pasienter',.12],['In-clinic',4.6],['Telehealth',6.3]]],
  ['calorie-flame','Energy flame meter','356 / 270','Bytt mellom Walk, Run og Cycle. Bruk den hvite knappen for å stoppe og fortsette.', [['Tidlig i klippet',.09],['Aktiv flamme',4.1],['Sent i klippet',7.7]]],
  ['file-drawer','Archive Drawer','344 / 270','Trykk på metallfronten. Trykk på en av de to synlige arkivfanene og deretter på det løftede kortet for å legge det tilbake.', [['Lukket',.05],['Åpen skuff',1.1],['Mono løftet',7.65],['Nord løftet',12.0]]]
];
const picker = document.querySelector('#cases');
const movie = document.querySelector('#original');
const frame = document.querySelector('#copy');
const panel = document.querySelector('#pair');
const instruction = document.querySelector('#input');
const markers = document.querySelector('#marks');
const missing = document.querySelector('#error');
try {
  const response=await fetch('./private-reference/manifest.json');
  if(response.ok){
    const assets=await response.json();
    for(const entry of assets.comparisons??[]) cases.push([entry.id,entry.label,entry.ratio,
      'Bruk kontrollene i komponenten til høyre. Originalklippet kan stoppes og spoles separat.',[['Start',0]],entry.source]);
  }
} catch {}
for (const [id,label] of cases) picker.add(new Option(label,id));

function show() {
  const [id,label,ratio,hint,points,source] = cases.find(([key]) => key === picker.value);
  instruction.textContent = hint;
  panel.style.setProperty('--ratio',ratio);
  movie.pause();
  movie.src = source ?? './private-reference/' + id + '.mp4';
  frame.title = label + ' med fungerende kontroller';
  frame.src = './index.html?demo=1&reference-assets=1#' + id;
  missing.hidden = true;
  markers.replaceChildren();
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
picker.addEventListener('change', () => { history.replaceState(null,'','#'+picker.value); show(); });
const requested = location.hash.slice(1);
if (cases.some(([id]) => id === requested)) picker.value = requested;
show();
