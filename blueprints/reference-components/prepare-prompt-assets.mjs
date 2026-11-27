import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , promptDir, clipsDir] = process.argv;
if (!promptDir) throw Error('Pass the directory with the authorized prompt assets.');
const repo=dirname(fileURLToPath(import.meta.url));
const pack=join(repo,'private-reference');
const dir=join(pack,'context');
mkdirSync(dir,{recursive:true});
const state=join(pack,'manifest.json');
const manifest=existsSync(state)?JSON.parse(readFileSync(state,'utf8')):{};
const input=resolve(promptDir);
const link=name=>'./private-reference/context/'+name;
function convert(file,time,name,filter='scale=960:-2') {
  const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',time,'-i',file,'-vf',filter,'-frames:v','1',join(dir,name)],{windowsHide:true});
  if(r.status!==0)throw Error('Could not prepare '+name+': '+String(r.stderr??r.error).slice(0,160));
  return link(name);
}
const video=join(input,'intelligence-bg.mp4');
copyFileSync(video,join(dir,'intelligence-original.mp4'));
manifest['video-hero']={
  video:link('intelligence-original.mp4'),
  poster:convert(video,'0.30','intelligence-poster.jpg'),
  sourceTitle:'Intelligence designed to evolve'
};
for(const name of ['mons-masked.png','mons-clear.png']) copyFileSync(join(input,name),join(dir,name));
manifest['unmask-trail']={masked:link('mons-masked.png'),clear:link('mons-clear.png'),focus:[.49,.34]};
if(existsSync(join(input,'calendar.mp4'))){
  copyFileSync(join(input,'calendar.mp4'),join(dir,'calendar-source.mp4'));
  manifest.comparisons=[...(manifest.comparisons??[]).filter(row=>row.id!=='marcelodesignx-standing-calendar'),
    {id:'marcelodesignx-standing-calendar',label:'Standing calendar',ratio:'16 / 9',source:link('calendar-source.mp4')}];
}
if (clipsDir) {
  const x=resolve(clipsDir);
  manifest['notification-stack']={
    photos:['0.65','2.06','6.37'].map((time,i)=>convert(join(x,'tcosta.mp4'),time,'notice-'+i+'.jpg','crop=69:81:78:75'))
  };
  manifest['feature-cards']={
    images:[0,1,2].map(i=>convert(join(x,'kaolti.mp4'),'0.70','feature-'+i+'.jpg','crop=88:103:'+(76+i*116)+':94'))
  };
}
writeFileSync(state,JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared the supplied hero media and reusable crops.');
