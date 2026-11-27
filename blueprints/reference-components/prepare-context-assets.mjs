import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog } from './catalog.mjs';

const [, , archiveRoot] = process.argv;
if (!archiveRoot) throw Error('Pass a folder of authorized browser captures.');
const archive = resolve(archiveRoot);
const dir = dirname(fileURLToPath(import.meta.url));
const output = join(dir,'private-reference');
const assets = join(output,'context');
mkdirSync(assets,{recursive:true});
const manifestPath=join(output,'manifest.json');
const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{};
const passes=['captures-precision','captures-targeted','captures-followup','captures-controls','captures-verified',
  'captures-fixed','captures-retry','captures-detail','captures-actions','captures-refined','captures'];
function folder(id) {
  for(const kind of passes) {
    const root=join(archive,kind,id), path=join(root,'archive.json');
    if(!existsSync(path))continue;
    const doc=JSON.parse(readFileSync(path,'utf8'));
    if(doc.checks?.original?.shots?.length&&doc.checks?.copy?.shots?.length) return {root,doc};
  }
}
const path = name => './private-reference/context/' + name;
function snapshot(bundle,index,name,crop) {
  const shots = bundle.doc.checks.original.shots;
  const shot=shots[Math.min(index,shots.length-1)];
  if(!shot||!/^original-\d\d\.(?:jpg|png)$/.test(shot.file))return;
  const file=join(bundle.root,shot.file);
  if(!existsSync(file))return;
  if(crop)convertFrame(file,'0',name,crop);
  else copyFileSync(file,join(assets,name));
  return path(name);
}
function encode(args) {
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{windowsHide:true});
  if(result.status!==0)throw Error(String(result.stderr??result.error).slice(0,260));
}
function convertFrame(input,time,name,crop) {
  encode(['-ss',String(time),'-i',input,'-vf',crop || 'scale=680:-2','-frames:v','1',join(assets,name)]);
  return path(name);
}
function video(bundle,id,index) {
  const record = bundle.doc.entries.filter(item=>item.status===200&&item.digest&&/^video\/(?:mp4|webm)/.test(item.headers?.['content-type']??''));
  const selected = record[index % Math.max(1,record.length)];
  const file=selected ? join(bundle.root,'assets',selected.digest) : join(bundle.root,'original.webm');
  if(!existsSync(file))return;
  const name=id+'-'+index+'.mp4';
  const seconds=selected?'0':String(index*1.6);
  encode(['-ss',seconds,'-i',file,'-t','4.6','-vf','scale=680:-2','-an','-c:v','libx264',
    '-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',join(assets,name)]);
  return path(name);
}
let backed=0, publishedMedia=0;
for(const entry of catalog) {
  if(!['Website interactions','Reference galleries'].includes(entry.collection)) continue;
  const bundle=folder(entry.id);
  if(!bundle)continue;
  const originalCount=bundle.doc.checks.original.shots.length;
  const n=entry.id;
  const next=manifest[n]??{};
  const frames=Array.from({length:3},(_,i)=>snapshot(bundle,Math.round(i*(originalCount-1)/2),n+'-'+i+'.jpg'));
  next.sourceFrames=frames;
  if(n==='munch'){
    const photo=bundle.doc.entries.find(item=>item.status===200&&item.headers?.['content-type']==='image/webp'
      && item.url.includes('menu-smash-single.webp'));
    if(photo?.digest){
      const source=join(bundle.root,'assets',photo.digest), name='munch-smash-single.webp';
      if(existsSync(source)){copyFileSync(source,join(assets,name));next.foodPhoto=path(name);}
    }
  }
  if(n==='venice'&&originalCount>=7)next.nightFrame=snapshot(bundle,5,'venice-night.jpg');
  if(entry.component==='mediaIndex') {
    next.items=entry.options.items.map((label,index)=>{
      const src=video(bundle,n,index);
      const published = bundle.doc.entries.some(item=>item.status===200&&item.digest&&/^video\/(?:mp4|webm)/.test(item.headers?.['content-type']??''));
      if(published)publishedMedia++;
      return src?{label,src,poster:frames[index%3],capture:!published}:label;
    });
  } else if(entry.component==='motionSurface') {
    next.sourceMotion=video(bundle,n,0);
  }
  manifest[n]=next;
  backed++;
}
const clips={
  'raminnasibov-download-progress':['raminnasibov-download-progress','.16','download-original.jpg','scale=680:-2'],
  'abtste11a-trip-cards':['abtste11a-trip-cards','1.02','trip-cover.jpg','crop=418:272:300:249'],
  'extra-basit-glass-lens-wall':['basit-glass-lens-wall','.12','lens-swatches.jpg','scale=900:720'],
  'davidhaz-logo-loader':['davidhaz-logo-loader','6.5','afterglow.jpg','crop=550:470:595:130']
};
for(const [id,[find,time,name,crop]] of Object.entries(clips)) {
  const bundle=folder(id);
  const entry=bundle?.doc.entries.find(e=>e.status===200&&e.digest&&e.url.toLowerCase().includes(find)&&e.headers?.['content-type']?.startsWith('video/'));
  if(!entry)continue;
  const key = id === 'abtste11a-trip-cards' ? 'cover' : id==='extra-basit-glass-lens-wall' ? 'swatchPhoto' : id==='davidhaz-logo-loader' ? 'photo' : 'backplate';
  manifest[id]={...manifest[id],[key]:convertFrame(join(bundle.root,'assets',entry.digest),String(Number(time)),name,crop)};
  if(id==='davidhaz-logo-loader') {
    const film=join(bundle.root,'assets',entry.digest);
    const segments=[['intro','0.25','3.55','crop=288:288:496:216','afterglow-intro.mp4'],
      ['reel','5.5','3.1','crop=550:470:595:130','afterglow-reel.mp4']];
    for(const [key,start,duration,area,file] of segments) {
      encode(['-ss',start,'-i',film,'-t',duration,'-vf',area,'-an','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(assets,file)]);
      manifest[id][key]=path(file);
    }
  }
}
const studies=[
  ['gabriell-lab-volume-slider','Volume slider','960 / 720'], ['raminnasibov-download-progress','Download progress','1'],
  ['postiauxcharles-caffeine-curve','Caffeine curve','1'], ['postiauxcharles-agent-credits','Agent credits','960 / 720'],
  ['flohoeller-context-map','Context map','1130 / 720'], ['nvc-agents-subagents','Agent groups','976 / 720'],
  ['extra-anuar-node-connections','Node connections','1146 / 720'], ['extra-aethermaker-coupon-dissolve','Coupon dissolve','1'],
  ['extra-basit-glass-lens-wall','Glass lens','900 / 720'], ['extra-kippe-shader-icons','Moving icon copy','1'],
  ['davidhaz-logo-loader','Logo loader','16 / 9'], ['aliszu-colouring-loader','Color pass','1'],
  ['abtste11a-trip-cards','Trip cards','1018 / 720']
];
const comparison=[];
for(const [id,label,ratio] of studies) {
  const bundle=folder(id);
  const key=id.replace(/^extra-/,'');
  const film=bundle?.doc.entries.find(e=>e.status===200&&e.digest&&e.url.includes(key)&&e.headers?.['content-type']?.startsWith('video/'));
  if(!film)continue;
  const name=id+'-source.mp4';
  copyFileSync(join(bundle.root,'assets',film.digest),join(assets,name));
  comparison.push({id,label,ratio,source:path(name)});
  if(id==='aliszu-colouring-loader'){
    const input=join(bundle.root,'assets',film.digest);
    manifest[id]={...manifest[id],icons:[242,333,422].map((x,i)=>convertFrame(input,'3.45','color-icon-'+i+'.jpg','crop=55:61:'+x+':247'))};
  }
}
for(const [id,label,name,ratio] of [['dev-ya-trip-modes','Trip mode switch','trip-mode-switch.mp4','1'],['justyna-framer-copier','Desktop copier','copier.mp4','1166 / 720']]){
  const file=join(archive,'bencho-clips',name);
  if(!existsSync(file))continue;
  const to=id+'-source.mp4';copyFileSync(file,join(assets,to));
  comparison.push({id,label,ratio,source:path(to)});
}
manifest.comparisons=comparison;
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({backed,publishedMedia,manifest:manifestPath}));
