import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , clipDir, facet] = process.argv;
if (!clipDir || !facet) {
  console.error('Usage: node prepare-fidelity.mjs <authorized-x-clips-directory> <authorized-facet-preview.mp4>');
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
  'file-drawer':join(resolve(clipDir),'justynabuilds.mp4'),
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
frame('quick-actions','0.08','quick-actions.png');
function archiveAtlas(start, frames, name) {
  const columns=6;
  const rows=Math.ceil(frames/columns);
  ffmpeg(['-ss',start,'-i',sources['file-drawer'],'-t',String((frames+.2)/24),
    '-vf','fps=24,format=yuv420p,tile='+columns+'x'+rows+':nb_frames='+frames,
    '-frames:v','1','-quality','88',join(out,name)]);
  return {src:prefix+name,frames,columns};
}
const clips = [
  archiveAtlas('0.23',18,'tray.webp'),
  archiveAtlas('6.40',25,'mono.webp'),
  archiveAtlas('10.78',27,'nord.webp')
];
for (const [id,filename] of Object.entries(sources)) copyFileSync(filename,join(out,id+'.mp4'));
const manifest = {
  'collapse-icon':{backplate:prefix+'sidebar.png'},
  'quick-actions':{backplate:prefix+'quick-actions.png'},
  'file-drawer':{
    files:[{label:'Mono Press',title:'Mo\nno',background:'#f7f6ee',ink:'#191a18'},
      {label:'Nord Festival',title:'Nord',background:'#393c3b',ink:'#f0f0ed'}],
    atlas:{width:344,height:270,clips}
  }
};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared six comparison sources and optional original artwork in '+out);
