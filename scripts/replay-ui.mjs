#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const usage = [
  'node replay-ui.mjs capture <url> --owned-design --out NEW_DIRECTORY [--plan PLAN.json]',
  'node replay-ui.mjs open ARCHIVE_DIRECTORY',
  'node replay-ui.mjs inspect ARCHIVE_DIRECTORY',
  'Set PLAYWRIGHT_MODULE to a locally installed Playwright package when needed.',
].join('\n');
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { help: { type: 'boolean', short: 'h' }, 'owned-design': { type: 'boolean' }, out: { type: 'string' }, plan: { type: 'string' } },
});
const [command, operand] = positionals;
const require = createRequire(import.meta.url);
const maxFile = 48 * 1024 * 1024;
const maxTotal = 180 * 1024 * 1024;
const types = new Set(['document', 'stylesheet', 'script', 'image', 'font', 'media', 'fetch', 'xhr']);
const trackedHeaders = new Set(['content-type', 'location', 'accept-ranges', 'content-range', 'access-control-allow-origin', 'access-control-allow-credentials']);
const clock = ms => new Promise(resolve => setTimeout(resolve, ms));
async function deadline(task, ms, fallback) {
  let timer;
  try {
    return await Promise.race([task, new Promise(resolve => { timer = setTimeout(() => resolve(fallback), ms); })]);
  } finally {
    clearTimeout(timer);
  }
}

function publicUrl(input) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('Use a public HTTP(S) URL without embedded credentials.');
  url.hash = '';
  return url;
}
function tracked(url) {
  return ['ipwho.is','events.framer.com'].includes(url.hostname)
    || (url.hostname==='framer.com'&&url.pathname==='/edit')
    || /(?:^|[./-])(?:analytics|telemetry|sentry|doubleclick|google-analytics|googletagmanager|hotjar|clarity|vercel-scripts|collect|speed-insights|vitals)(?:[./-]|$)/i.test(url.hostname + url.pathname);
}
function cleanHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => trackedHeaders.has(name.toLowerCase())));
}
function validatePlan(input) {
  const viewport = input.viewport ?? { width: 1280, height: 800 };
  const steps = input.steps ?? [{ action: 'scroll', delta: 710, label: 'Project or section scroll' }];
  if (!Number.isInteger(viewport.width) || viewport.width < 240 || viewport.width > 1920
   || !Number.isInteger(viewport.height) || viewport.height < 240 || viewport.height > 1200) throw Error('Choose a viewport from 240–1920 by 240–1200.');
  if (!Array.isArray(steps) || steps.length > 10) throw Error('The plan accepts up to ten steps.');
  for (const step of steps) {
    const css = typeof step.selector === 'string' && step.selector.length > 0 && step.selector.length <= 400;
    const role = ['button', 'tab', 'checkbox', 'radio', 'link', 'textbox', 'spinbutton'].includes(step.role)
      && typeof step.name === 'string' && step.name.length <= 180;
    const target = css || role;
    const valid = (['click', 'hover'].includes(step.action) && target)
      || (step.action === 'fill' && target && typeof step.value === 'string' && step.value.length <= 80)
      || (step.action === 'drag' && role && ['button', 'tab'].includes(step.toRole) && typeof step.toName === 'string' && step.toName.length <= 180)
      || (step.action === 'scroll' && Number.isInteger(step.delta) && Math.abs(step.delta) <= 2500)
      || (step.action === 'key' && (target || (step.selector === undefined && step.role === undefined))
        && ['Escape', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(step.key));
    if (!valid) throw Error('Specify a CSS or accessible target, a scroll delta, or a navigation key.');
    if(step.waitMs!==undefined&&(!Number.isInteger(step.waitMs)||step.waitMs<100||step.waitMs>2500)){
      throw Error('Use a step delay from 100 to 2500 ms.');
    }
  }
  return { viewport, steps, mobile: input.mobile === true, fakeMedia: input.fakeMedia === true };
}
async function playwright() {
  try { return require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
  catch (error) {
    if(!process.env.PLAYWRIGHT_MODULE){
      try{return createRequire(join(process.cwd(),'package.json'))('playwright');}catch{}
    }
    throw Error('Install Playwright locally or set PLAYWRIGHT_MODULE to its installed package path.', { cause: error });
  }
}
async function openArchive(dir, visible) {
  const base = resolve(dir);
  const manifest = JSON.parse(await readFile(join(base, 'archive.json'), 'utf8'));
  const { chromium } = await playwright();
  const browser = await chromium.launch({ channel: 'chrome', headless: !visible });
  const context = await browser.newContext({
    viewport: manifest.plan.viewport, serviceWorkers: 'block',
    isMobile: manifest.plan.mobile, hasTouch: manifest.plan.mobile,
  });
  await replayRoutes(context, base, manifest.entries, []);
  const page = await context.newPage();
  try{
    await page.goto(manifest.finalUrl, { waitUntil: 'domcontentloaded', timeout: 18000 });
    if(!visible){
      await clock(950);
      console.log(JSON.stringify(await runLook(page)));
      return;
    }
    console.log('Opened the private archive in an isolated Chrome window. Outbound network requests are blocked.');
    if (browser.isConnected()) await new Promise(resolve => browser.on('disconnected', resolve));
  }finally{await browser.close();}
}

function archivePath(folder, digest) {
  if (!/^[0-9a-f]{64}$/.test(digest ?? '')) throw Error('Invalid archive asset key.');
  return join(folder, 'assets', digest);
}

async function replayRoutes(context, folder, entries, misses) {
  const byUrl = new Map(entries.map(entry => [entry.url, entry]));
  await context.route('**/*', async route => {
    const req = route.request();
    const entry = req.method() === 'GET' && byUrl.get(req.url());
    if (!entry) {
      if (misses.length < 160 && !misses.includes(req.url())) misses.push(req.url());
      await route.abort('blockedbyclient');
      return;
    }
    const headers = { ...entry.headers };
    if (!entry.digest) {
      await route.fulfill({ status: entry.status, headers, body: '' });
      return;
    }
    const body = await readFile(archivePath(folder, entry.digest));
    const range = req.headers().range?.match(/^bytes=(\d+)-(\d*)$/);
    if (entry.status === 200 && range && headers['content-type']?.startsWith('video/')) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      if (start >= body.length || end < start) {
        await route.fulfill({ status: 416, headers: { 'content-range': 'bytes */' + body.length } });
        return;
      }
      headers['content-range'] = 'bytes ' + start + '-' + end + '/' + body.length;
      headers['accept-ranges'] = 'bytes';
      await route.fulfill({ status: 206, headers, body: body.subarray(start, end + 1) });
      return;
    }
    await route.fulfill({ status: entry.status, headers, body });
  });
}

async function runLook(page) {
  return page.evaluate(() => {
    const visible = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom >= 0 && s.visibility === 'visible';
    };
    const heading = [...document.querySelectorAll('h1,h2')].find(visible);
    const media = [...document.querySelectorAll('video')].filter(visible).slice(0, 12);
    const controls=[...document.querySelectorAll('button,[role=button],[role=tab],[role=radio],input,select')].filter(visible).slice(0,38).map(el=>({
      tag:el.tagName,id:el.id||null,role:el.getAttribute('role'),label:el.getAttribute('aria-label')||el.innerText?.trim().slice(0,100)||null,
      type:el.getAttribute('type'),placeholder:el.getAttribute('placeholder'),pressed:el.getAttribute('aria-pressed'),
      selected:el.getAttribute('aria-selected'),expanded:el.getAttribute('aria-expanded'),checked:el.getAttribute('aria-checked'),
      value:el.matches('input[type=range]')?el.value:el.getAttribute('aria-valuenow')
    }));
    const b = getComputedStyle(document.body);
    const bounds = heading?.getBoundingClientRect();
    return {
      title:document.title, heading:heading?.textContent.trim().slice(0,180) ?? null,
      headingBox: bounds ? [bounds.x,bounds.y,bounds.width,bounds.height].map(Math.round) : null,
      scroll:Math.round(scrollY), height:document.documentElement.scrollHeight,
      color:b.color, background:b.backgroundColor, font:b.fontFamily,
      controls, playing:media.filter(v=>!v.paused&&v.readyState>=2).length,
      videos:media.map(v=>{let source=null;try{source=new URL(v.currentSrc).pathname;}catch{}return {source,ready:v.readyState,paused:v.paused};})
    };
  });
}
async function observedMedia(page) {
  return page.locator('video, video source, audio, audio source').evaluateAll(nodes=>[...new Set(nodes.flatMap(el=>
    [el.currentSrc,el.src,el.getAttribute('data-src')].filter(value=>value&&/^https?:/.test(new URL(value,location.href).protocol))
  ).map(value=>new URL(value,location.href).href))].slice(0,30));
}

async function captureViewport(page, path) {
  try {
    await page.screenshot({ path, type:'jpeg', quality:85, timeout:6500 });
    return 'playwright';
  } catch (error) {
    if (error.name !== 'TimeoutError') throw error;
    const cdp = await page.context().newCDPSession(page);
    try {
      // Preserve the current frame even if a remote font keeps the normal capture waiting.
      const frame = await deadline(cdp.send('Page.captureScreenshot', { format:'jpeg', quality:85 }), 6000);
      if (!frame?.data) throw error;
      await writeFile(path, Buffer.from(frame.data, 'base64'));
      return 'chrome';
    } finally {
      await cdp.detach().catch(() => {});
    }
  }
}

async function observeSequence(page, url, plan, folder, side, hook) {
  const shots=[];
  let navigationError;
  const response=await page.goto(url,{waitUntil:'commit',timeout:20000}).catch(error=>{navigationError=error.message.split('\n')[0];return null;});
  await clock(1100);
  await deadline(page.evaluate(()=>document.fonts.ready).catch(()=>{}),3000);
  const status=response?.status();
  const bodyText=await page.locator('body').innerText({timeout:2000}).then(x=>x.slice(0,380)).catch(()=>'');
  if (!status || status>=400 || /verify you are human|attention required!|just a moment|access denied|cf-challenge/i.test(bodyText)) {
    throw Error('The route did not open for anonymous browsing (HTTP ' + (status??'unknown') + ').'+(navigationError?' '+navigationError:''));
  }
  if (new URL(page.url()).origin !== new URL(url).origin) throw Error('The route redirected outside its requested origin.');
  if (hook) await hook(page);
  async function sample(label,i,result,readSource = false) {
    const file=side+'-'+String(i).padStart(2,'0')+'.jpg';
    const screenshotMethod=await captureViewport(page,join(folder,file));
    const shot={label,file,result,screenshotMethod,url:page.url(),state:await runLook(page)};
    if(readSource&&result==='executed'){
      const snippets=await page.locator('pre:visible').allTextContents();
      const code=snippets.join('\n\n').trim();
      if(code){
        shot.source=side+'-'+String(i).padStart(2,'0')+'-published-source.txt';
        await writeFile(join(folder,shot.source),code.slice(0,160000)+'\n');
      }
    }
    shots.push(shot);
  }
  await sample('Opening',0,'visible');
  for (const [i,step] of plan.steps.entries()){
    let status='executed';
    try{
      if(step.action==='scroll'){
        await page.mouse.move(Math.round(plan.viewport.width*.86),Math.round(plan.viewport.height*.75));
        await page.mouse.wheel(0,step.delta);
      }else if(step.action==='key'&&!step.selector&&!step.role){
        await page.keyboard.press(step.key);
      }else{
        const target=(step.selector?page.locator(step.selector):page.getByRole(step.role,{name:step.name,exact:true})).filter({visible:true});
        if(await target.count()!==1)throw Error('The selector needs one visible target');
        if(step.action==='key')await target.press(step.key,{timeout:2200});
        else if(step.action==='hover')await target.hover({timeout:2200});
        else if(step.action==='fill')await target.fill(step.value,{timeout:2200});
        else if(step.action==='drag'){
          const end=page.getByRole(step.toRole,{name:step.toName,exact:true}).filter({visible:true});
          if(await end.count()!==1)throw Error('The drag needs one visible destination');
          await target.scrollIntoViewIfNeeded({timeout:2200});
          const a=await target.boundingBox(), b=await end.boundingBox();
          if(!a||!b)throw Error('The drag endpoints are not visible');
          await page.mouse.move(a.x+a.width*.5,a.y+a.height*.5);
          await page.mouse.down();
          try{await page.mouse.move(b.x+b.width*.5,b.y+b.height*.74,{steps:14});}
          finally{await page.mouse.up();}
        }
        else if(step.pointer===true){
          const point=await target.evaluate(el=>{
            const r=el.getBoundingClientRect();
            const x=r.left+r.width/2,y=r.top+r.height/2;
            return !el.disabled&&el.contains(document.elementFromPoint(x,y))?{x,y}:null;
          });
          if(!point)throw Error('The moving control does not accept pointer input here');
          await page.mouse.click(point.x,point.y);
        }
        else await target.click({timeout:2200});
      }
      await clock(step.waitMs??790);
      if(new URL(page.url()).origin!==new URL(url).origin) throw Error('Action left the requested origin.');
    }catch(error){
      status='not verified: '+error.message.split('\n')[0];
    }
    await sample(step.label??step.action,i+1,status,step.readSource===true);
    if(status.startsWith('not verified: Action left'))break;
  }
  if(hook)await hook(page);
  return {status,shots};
}

async function capture(operand) {
  if (!values['owned-design'] || !values.out) throw Error(usage);
  const url=publicUrl(operand);
  const plan=validatePlan(values.plan?JSON.parse(await readFile(values.plan,'utf8').then(s=>s.replace(/^\uFEFF/,''))):{});
  const folder=resolve(values.out);
  await mkdir(resolve(folder,'..'),{recursive:true});
  await mkdir(folder);
  await mkdir(join(folder,'assets'));
  const { chromium,request }=await playwright();
  const args=['--enable-unsafe-swiftshader'];
  if(plan.fakeMedia)args.push('--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream');
  const browser=await chromium.launch({channel:'chrome',headless:true,args});
  const source=await browser.newContext({
    viewport:plan.viewport, isMobile:plan.mobile, hasTouch:plan.mobile,serviceWorkers:'block',
    recordVideo:{dir:folder,size:{width:960,height:600}}
  });
  const api=await request.newContext({timeout:18000});
  const entries=new Map(), gaps=new Set(), jobs=new Set(), media=new Set(), downloads=new Map(), attempted=new Map();
  const report={requested:url.href, finalUrl:url.href, captured:0, bytes:0, entries:[],gaps:[],plan, checks:{}};
  let total=0;
  async function store(key,status,headers,buffer,type){
    if(entries.has(key)&&entries.get(key).status===200)return;
    const entry={url:key,status,headers:cleanHeaders(headers),type};
    if(buffer){
      if(buffer.length>maxFile||total+buffer.length>maxTotal){gaps.add('Byte limit: '+key);return;}
      const digest=createHash('sha256').update(buffer).digest('hex');
      await writeFile(archivePath(folder,digest),buffer).catch(error=>{if(error.code!=='EEXIST')throw error;});
      entry.digest=digest;
      total+=buffer.length;
    }
    entries.set(key,entry);
  }
  async function wholeResource(key,type){
    if(downloads.has(key))return downloads.get(key);
    const job=(async()=>{
      const u=publicUrl(key);
      if(tracked(u))return;
      const head=await api.head(key,{maxRedirects:0,failOnStatusCode:false}).catch(()=>null);
      const bytes=Number(head?.headers()['content-length']);
      const mime=head?.headers()['content-type']??'';
      const acceptable=type==='media'?mime.startsWith('video/'):
        /^(image\/|font\/|application\/(?:javascript|font|x-font|octet-stream)|text\/(?:javascript|css))/.test(mime);
      if(!head?.ok()||!acceptable||!Number.isFinite(bytes)||bytes<=0||bytes>maxFile||total+bytes>maxTotal){
        if(type==='media')gaps.add('Video full-body not verified: '+key);return;
      }
      const res=await api.get(key,{maxRedirects:0,failOnStatusCode:false});
      if(res.status()!==200){gaps.add('Resource returned HTTP '+res.status()+': '+key);return;}
      await store(key,200,res.headers(),await res.body(),type);
    })().catch(()=>gaps.add('Resource unavailable: '+key));
    downloads.set(key,job);
    return job;
  }
  const originalPage=await source.newPage();
  originalPage.on('request',req=>{
    const u=new URL(req.url());
    const type=req.resourceType();
    if(['script','stylesheet','image','font'].includes(type)&&req.method()==='GET'&&/^https?:/.test(u.protocol)&&!tracked(u)){
      attempted.set(req.url(),type);
    }
  });
  originalPage.on('response',res=>{
    const u=new URL(res.url());
    const req=res.request();
    const type=req.resourceType();
    if(!/^https?:/.test(u.protocol)||tracked(u)||req.method()!=='GET'||!types.has(type))return;
    if(['fetch','xhr'].includes(type)&&u.origin!==url.origin)return;
    if(type==='document'&&u.origin!==url.origin)return;
    const status=res.status();
    if(status<200||status>=400)return;
    const headers=res.headers();
    if(status===206&&(headers['content-type']??'').startsWith('video/')){
      media.add(res.url());
      return;
    }
    if(status===206)return;
    if(Number(headers['content-length'])>maxFile){gaps.add('Resource exceeds byte limit: '+u.href);return;}
    const job=(async()=>{
      if(status>=300){await store(res.url(),status,headers,null,type);return;}
      const buffer=await deadline(res.body(),10000,null);
      if(!buffer){gaps.add('Body unavailable: '+u.href);return;}
      await store(res.url(),status,headers,buffer,type);
    })().catch(()=>{if(!entries.has(res.url()))gaps.add('Body unavailable: '+u.href);});
    jobs.add(job);
    job.finally(()=>jobs.delete(job));
  });
  try{
    const original=await observeSequence(originalPage,url.href,plan,folder,'original',
      async page=>{for(const value of await observedMedia(page)){if(/\.(mp4|webm)(?:[?#]|$)/i.test(value))media.add(value);}});
    report.checks.original=original;
    report.finalUrl=original.shots[0].url;
    while(jobs.size)await Promise.allSettled([...jobs]);
    // A client-side link can load only a framework payload. Preserve the document
    // for that visited route so an offline browser can also navigate to it directly.
    const visited = new Set(original.shots.filter(shot => shot.result === 'executed')
      .map(shot => publicUrl(shot.url)).filter(visitedUrl => visitedUrl.origin === url.origin)
      .map(visitedUrl => visitedUrl.href));
    for (const href of visited) {
      if (entries.has(href)) continue;
      const response = await api.get(href, { maxRedirects:0, failOnStatusCode:false }).catch(() => null);
      const headers = response?.headers();
      if (response?.status() === 200 && headers['content-type']?.startsWith('text/html')
          && !(Number(headers['content-length']) > maxFile)) {
        const body = await deadline(response.body().catch(() => null), 8000, null);
        if (body) {
          await store(href, 200, headers, body, 'document');
          continue;
        }
      }
      gaps.add('Document unavailable for visited route: '+href);
    }
    const supplement=[...media].filter(value=>!entries.has(value)).map(value=>[value,'media']);
    supplement.push(...[...attempted].filter(([value])=>!entries.has(value)).slice(0,24));
    for(let i=0;i<supplement.length;i+=4)
      await Promise.all(supplement.slice(i,i+4).map(([value,type])=>wholeResource(value,type)));
    const raw=originalPage.video();
    await source.close();
    if(raw)await rename(await raw.path(),join(folder,'original.webm')).catch(()=>{});
    report.entries=[...entries.values()];
    if(!report.entries.some(v=>v.url===report.finalUrl&&v.type==='document'))throw Error('The main HTML did not enter the archive.');
    const copy=await browser.newContext({viewport:plan.viewport,isMobile:plan.mobile,hasTouch:plan.mobile,serviceWorkers:'block',recordVideo:{dir:folder,size:{width:960,height:600}}});
    const misses=[];
    await replayRoutes(copy,folder,report.entries,misses);
    const page=await copy.newPage();
    report.checks.copy=await observeSequence(page,report.finalUrl,plan,folder,'copy');
    const recorded=page.video();
    await copy.close();
    if(recorded)await rename(await recorded.path(),join(folder,'copy.webm')).catch(()=>{});
    report.replayMisses=misses.filter(value=>{try{return !tracked(new URL(value));}catch{return true;}});
  } catch(error) {
    report.error=error.message.split('\n')[0];
    process.exitCode=1;
  } finally {
    report.entries=[...entries.values()];
    report.captured=entries.size;
    report.bytes=total;
    report.gaps=[...gaps].slice(0,150);
    await writeFile(join(folder,'archive.json'),JSON.stringify(report,null,2)+'\n');
    await browser.close();
    await api.dispose();
  }
  console.log(JSON.stringify({url:url.href,captured:report.captured,bytes:total,steps:report.checks.copy?.shots.length??0,missed:report.replayMisses?.length??0,error:report.error}));
}

if(values.help || !command) console.log(usage);
else {
 try{
  if(command==='capture'&&operand)await capture(operand);
  else if(['open','inspect'].includes(command)&&operand)await openArchive(operand,command==='open');
  else throw Error(usage);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
