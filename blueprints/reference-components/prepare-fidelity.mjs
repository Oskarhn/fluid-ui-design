import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , clipDir, facet, archiveHD] = process.argv;
if (!clipDir || !facet) {
  console.error('Usage: node prepare-fidelity.mjs <authorized-x-clips-directory> <authorized-facet-preview.mp4> [higher-resolution-archive.mp4]');
  process.exit(1);
}
const library = dirname(fileURLToPath(import.meta.url));
const out = join(library, 'private-reference');
mkdirSync(out, { recursive:true });
const sources = {
  'collapse-icon':join(resolve(clipDir),'iconists.mp4'),
  'quick-actions':join(resolve(clipDir),'sonia_axion.mp4'),
  'patient-funnel':join(resolve(clipDir),'umitceliks.mp4'),
  'calorie-flame':join(resolve(clipDir),'anuar_designx.mp4'),
  'file-drawer':archiveHD ? resolve(archiveHD) : join(resolve(clipDir),'justynabuilds.mp4'),
  'glass-transfer':resolve(facet)
};
function frame(id, time, filename) {
  ffmpeg(['-ss',time,'-i',sources[id],'-frames:v','1',join(out,filename)]);
}
function ffmpeg(args) {
  const result = spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit',windowsHide:true});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('FFmpeg failed while preparing the supplied reference.');
}
const prefix='./private-reference/';
frame('collapse-icon','0.08','sidebar.png');
ffmpeg(['-ss','0.08','-i',sources['collapse-icon'],'-vf','crop=32:32:309:115','-frames:v','1',join(out,'voice.png')]);
frame('quick-actions','0.08','quick-actions.png');
const archiveWidth = archiveHD ? 690 : 344;
const archiveHeight = archiveHD ? 540 : 270;
frame('file-drawer','1.15','archive-rest.png');
function archiveAtlas(start, frames, name) {
  const columns=6;
  const rows=Math.ceil(frames/columns);
  ffmpeg(['-ss',start,'-i',sources['file-drawer'],'-t',String((frames+.2)/24),
    '-vf','fps=24,scale='+archiveWidth+':'+archiveHeight+':flags=lanczos,format=yuv420p,tile='+columns+'x'+rows+':nb_frames='+frames,
    '-frames:v','1','-quality','88',join(out,name)]);
  return {src:prefix+name,frames,columns};
}
const clips = [
  archiveAtlas('0.23',18,'tray.webp'),
  {...archiveAtlas('6.35',26,'mono.webp'),hover:.17},
  {...archiveAtlas('10.60',32,'nord.webp'),hover:.19}
];
const archiveCards = [
  ['Kessel',[337,295,55,26]], ['Nord Festival',[385,298,74,32]], ['Field Serif',[441,310,62,31]],
  ['Halden Studio',[489,325,63,29]], ['Low Tide',[543,323,64,31]], ['Ostra',[390,377,53,27]],
  ['Mono Press',[439,383,70,27]], ['Platform 9',[495,397,59,29]],
  ['Lumen',[549,397,56,31]], ['Common Ground',[581,416,69,31]]
];
const cardColors=['#f4f1eb','#d73726','#3f3e3e','#f0ece0','#3b393d','#4d4c4e','#faf7f0','#3b3b3e','#38383b','#e5e0d7'];
function archiveFile([label],index) {
  return {label,title:label==='Mono Press'?'Mo\nno':label==='Nord Festival'?'Nord':label,
    background:cardColors[index],ink:[1,2,4,5,7,8].includes(index)?'#f7f4ec':'#272724'};
}
for (const [id,filename] of Object.entries(sources)) copyFileSync(filename,join(out,id+'.mp4'));
const manifest = {
  'collapse-icon':{backplate:prefix+'sidebar.png',voice:prefix+'voice.png'},
  'quick-actions':{backplate:prefix+'quick-actions.png'},
  'file-drawer':{
    files:archiveCards.map(archiveFile),
    atlas:{width:archiveWidth,height:archiveHeight,clips,rest:prefix+'archive-rest.png',
      hits:archiveCards.map(([,hit])=>hit.map((value,axis)=>value/(axis%2?720:920))),
      cardClips:{1:2,6:1}}
  }
};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared six comparison sources and optional original artwork in '+out);
