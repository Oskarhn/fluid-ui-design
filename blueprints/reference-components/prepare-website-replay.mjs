import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog as entries } from './catalog.mjs';

const [, , suppliedId, suppliedPath] = process.argv;
if (!/^[a-z][a-z0-9-]{0,69}$/.test(suppliedId ?? '') || !suppliedPath) {
  throw Error('Pass a catalog ID and the authorized archive made by replay-ui.mjs.');
}

const capture = resolve(suppliedPath);
const report = JSON.parse(readFileSync(join(capture,'archive.json'),'utf8'));
const catalog = {
  'wahoo-pricing':{
    title:'Wahoo Pricing · originalkode',
    target:'https://wahooservices.co.uk/pricing',
    hint:'Opptakene viser engangspris, månedspris og scroll til prisforklaringen.',
    verify(shots) {
      if (shots.length !== 4) return false;
      const selection=index=>shots[index].state.controls.find(item=>item.role==='radio'&&item.checked==='true')?.label;
      return /MONTHLY/.test(selection(0))&&/ONE-OFF/.test(selection(1))&&/MONTHLY/.test(selection(2))&&shots[3].state.scroll >= 690;
    }
  },
  wabi:{
    title:'Wabi · originalkode',
    target:'https://wabi.ai/?ref=seesaw',
    hint:'Opptakene viser scroll inn til kortene, klikk på kortkantene og scroll videre.',
    verify(shots) {
      if(shots.length!==6)return false;
      const selected=(i,name)=>shots[i].state.controls.some(item=>item.pressed==='true'&&item.label?.includes(name));
      return shots[1].state.scroll>=710&&selected(2,'Dana')&&selected(3,'Ray')&&selected(4,'Nadia')&&shots[5].state.scroll>=1300;
    }
  },
  berryreader:{
    title:'Berry Reader · originalkode',
    target:'https://berryreader.com/?ref=seesaw',
    hint:'Opptakene viser byttet mellom Atkinson Hyperlegible og Literata, scroll og åpning av FAQ.',
    verify(shots) {
      if(shots.length!==6)return false;
      const selected=(i,name)=>shots[i].state.controls.some(item=>item.pressed==='true'&&item.label?.includes(name));
      return selected(1,'Atkinson Hyperlegible')&&selected(2,'Literata')&&shots[3].state.scroll>shots[2].state.scroll&&shots[5].state.scroll>7000;
    }
  },
  zero:{
    title:'Zero · originalkode',
    target:'https://zero.inc/',
    hint:'Opptakene viser produktoversikten og at Scale AI blir valgt og fjernet i demoen.',
    verify(shots) {
      if(shots.length!==7)return false;
      const includes=(index,label)=>shots[index].state.controls.some(item=>item.label===label);
      return includes(3,'Select Scale AI')&&includes(4,'Deselect Scale AI')&&includes(5,'Select Scale AI')&&shots[6].state.scroll>=1400;
    }
  }
};
const strict = catalog[suppliedId];
const entry = entries.find(item=>item.id===suppliedId && ['Website interactions','Reference galleries'].includes(item.collection));
const original=report.checks?.original?.shots;
const copy=report.checks?.copy?.shots;
const changes = state => state.controls
  .filter(control=>['pressed','selected','expanded','checked','value'].some(key=>control[key]!=null&&control[key]!==''))
  .map(control=>JSON.stringify([control.role,control.label,control.pressed,control.selected,control.expanded,control.checked,control.value]))
  .sort().join('\u001f');
function matchesTarget(expected, recorded) {
  const a=new URL(expected),b=new URL(recorded);
  const host=url=>url.host.replace(/^www\./,'');
  const path=url=>url.pathname.replace(/\/$/,'');
  return b.protocol==='https:' && host(a)===host(b) && path(a)===path(b);
}
function compareStates(first, second) {
  return first.url===second.url&&Math.abs(first.state.scroll-second.state.scroll)<=12&&
    first.state.heading===second.state.heading&&changes(first.state)===changes(second.state);
}
function hasChange(first,second){
  return first.url!==second.url||first.state.scroll!==second.state.scroll||
    first.state.heading!==second.state.heading||changes(first.state)!==changes(second.state);
}
const valid=entry&&original?.length>1&&copy?.length===original.length&&
  matchesTarget(strict?.target??entry.url,report.finalUrl)&&
  report.entries.some(resource=>resource.url===report.finalUrl&&resource.type==='document')&&
  original.every((shot,i)=>{
    const replay=copy[i];
    return (i===0||(shot.result==='executed'&&replay.result==='executed'))&&
      new URL(shot.url).origin===new URL(report.finalUrl).origin&&compareStates(shot,replay);
  })&&original.slice(1).some((shot,i)=>hasChange(original[i],shot))&&
  (!strict||[original,copy].every(shots=>strict.verify(shots)));
if(!valid)throw Error('Both recordings must execute and reproduce the recorded location and visible UI states.');
const item=strict??{
  title:entry.title+' · originalkode',
  target:report.finalUrl,
  hint:'Registrerte steg: '+report.plan.steps.map(step=>step.label||step.action).join(' / ')+'.'
};
const here=dirname(fileURLToPath(import.meta.url));
const privateRoot=join(here,'private-reference');
const target=join(privateRoot,'website-replays',suppliedId);
mkdirSync(target,{recursive:true});
cpSync(join(capture,'assets'),join(target,'assets'),{recursive:true});
for(const name of ['archive.json','original.webm','copy.webm'])copyFileSync(join(capture,name),join(target,name));
const poster=original[0].file;
if(!/^original-00\.(jpg|png)$/.test(poster))throw Error('Expected a recorded opening frame.');
copyFileSync(join(capture,poster),join(target,poster));
const manifestPath=join(privateRoot,'websites.json');
const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):[];
const size=report.plan.viewport;
const classification={id:suppliedId,title:item.title,ratio:size.width+' / '+size.height,hint:item.hint,url:item.target,poster,states:original.length,missingRoutes:report.replayMisses?.length??0};
writeFileSync(manifestPath,JSON.stringify([...manifest.filter(entry=>entry.id!==suppliedId),classification],null,2)+'\n');
console.log(JSON.stringify({id:suppliedId,resources:report.entries.length,matchedStates:copy.length,missingRoutes:report.replayMisses?.length??0}));
