import { control, controls, listen, scope } from './shared.mjs';
import { openArchiveAtlas } from './source-atlas.mjs';

const DEFAULT_FILES = [
  { label:'Index', title:'Index', background:'#c63838', ink:'#fdf9f3' },
  { label:'Nord Festival', title:'Nord', background:'#393c3b', ink:'#f0f0ed' },
  { label:'Mono Press', title:'Mo\nno', background:'#f7f6ee', ink:'#191a18' },
  { label:'Field Notes', title:'Field', background:'#e4e0d6', ink:'#272924' },
  { label:'Archive', title:'Archive', background:'#e8e9e3', ink:'#2e302c' }
];

export function fileDrawer(root, { signal, options = {} }) {
  const id = scope(root);
  const files = options.files ?? DEFAULT_FILES;
  root.innerHTML = `
    <div class="archive-stage" data-renderer="html" data-position="closed">
      <div class="archive-fallback" aria-hidden="true"><div class="archive-lid"></div><div class="archive-tray"><div class="archive-fallback-paper"></div><div class="archive-face"></div></div></div>
      <button class="archive-pull" type="button" aria-expanded="false" aria-label="Open archive" aria-controls="${id}-files"></button>
      <div class="archive-tabs" id="${id}-files" hidden></div>
      <button class="archive-return" type="button" hidden>Return to drawer</button>
      <output class="fidelity-status" role="status"></output>
    </div>
  `;
  const stage = control(root, '.archive-stage');
  const pull = control(root, '.archive-pull');
  const tabs = control(root, '.archive-tabs');
  const hide = control(root, '.archive-return');
  const status = control(root, 'output');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let engine;
  let expanded = false;
  let active = -1;
  let current = pull;
  files.forEach((file,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = file.label;
    button.setAttribute('aria-pressed', 'false');
    listen(button, 'pointerenter', event => {
      if (event.pointerType === 'mouse' && active === -1) engine?.hover(index);
    }, signal);
    listen(button, 'pointerleave', () => engine?.hover(-1), signal);
    listen(button, 'click', () => {
      current = button;
      pick(index);
      hide.focus({ preventScroll:true });
    }, signal);
    tabs.append(button);
  });
  const buttons = controls(tabs, 'button');
  function setOpen(open) {
    expanded = open;
    stage.dataset.position = open ? 'open' : 'closed';
    pull.setAttribute('aria-expanded', String(open));
    pull.setAttribute('aria-label', open ? 'Close archive' : 'Open archive');
    if (!open) pick(-1);
    tabs.hidden = !open;
    engine?.open(open);
  }
  function pick(index) {
    active = index;
    stage.dataset.active = String(index);
    buttons.forEach((button,i) => button.setAttribute('aria-pressed',String(i===index)));
    hide.hidden = index === -1;
    status.textContent = index === -1 ? 'Drawer ' + (expanded ? 'open' : 'closed') : files[index].label + ' lifted';
    const paper = control(root, '.archive-fallback-paper');
    paper.textContent = index === -1 ? '' : files[index].title;
    engine?.select(index);
  }
  listen(pull, 'click', () => setOpen(!expanded), signal);
  listen(hide, 'click', () => { pick(-1); current.focus({preventScroll:true}); }, signal);
  listen(stage, 'keydown', event => {
    if (event.key !== 'Escape') return;
    if (active >= 0) { pick(-1);current.focus({preventScroll:true}); }
    else if (expanded) {setOpen(false);pull.focus({preventScroll:true});}
  }, signal);
  signal.addEventListener('abort', () => engine?.dispose(), {once:true});
  async function loadArtwork() {
    if (options.atlas) {
      const sampled = await openArchiveAtlas(stage,options.atlas,preference,signal).catch(() => null);
      if (sampled || signal.aborted) return sampled;
    }
    const [THREE,{RoomEnvironment}] = await Promise.all([import('./three/three.module.js'), import('./three/RoomEnvironment.js')]);
    if (!signal.aborted) return buildArchive(THREE,RoomEnvironment,stage,files,preference,signal);
  }
  loadArtwork().then(artwork => {
    if (!artwork || signal.aborted) { artwork?.dispose(); return; }
    engine = artwork;
    engine.open(expanded);
    engine.select(active);
  }).catch(() => { if (!signal.aborted) stage.dataset.renderer='html'; });
}

function cardTexture(THREE, file, index) {
  const surface = document.createElement('canvas');
  surface.width=880;
  surface.height=560;
  const ctx=surface.getContext('2d');
  ctx.fillStyle=file.background;
  ctx.fillRect(0,0,880,560);
  ctx.strokeStyle=index%2?'#f5f4eb38':'#18181138';
  ctx.strokeRect(19,15,842,530);
  ctx.fillStyle=file.ink;
  ctx.font='700 175px Arial';
  ctx.letterSpacing='-9px';
  file.title.split('\n').forEach((line,i)=>ctx.fillText(line,42,213+i*145));
  ctx.letterSpacing='0px';
  ctx.font='400 21px Arial';
  ctx.fillText(file.label,42,78);
  ctx.font='400 18px Arial';
  ctx.fillText('Studio archive',42,508);
  ctx.fillText(String(index+1).padStart(2,'0'),750,508);
  if (index===1) {
    ctx.beginPath();ctx.arc(672,278,131,0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(surface);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
}

function buildArchive(THREE,RoomEnvironment,stage,files,preference,signal) {
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.className='archive-canvas';
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.prepend(renderer.domElement);
  stage.dataset.renderer='webgl';
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xe9e7e0);
  const camera=new THREE.OrthographicCamera(-295,295,231,-231,.5,3500);
  camera.position.set(-365,393,638);
  camera.lookAt(0,45,24);
  const room=new RoomEnvironment();
  const generator=new THREE.PMREMGenerator(renderer);
  const env=generator.fromScene(room,.048);
  room.dispose();generator.dispose();
  scene.environment=env.texture;
  const key=new THREE.DirectionalLight(0xfff8ea,2.15);
  key.position.set(-170,420,235);
  key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-430,right:430,top:360,bottom:-360});
  key.shadow.mapSize.set(768,768);
  key.shadow.normalBias=.67;
  key.shadow.radius=2.2;
  scene.add(key,new THREE.HemisphereLight(0xfcfaf3,0x777770,1.03));
  const base=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.ShadowMaterial({color:0x2e2923,opacity:.23}));
  base.rotation.x=-Math.PI/2;base.position.y=-1.2;base.receiveShadow=true;scene.add(base);
  const housing=new THREE.Group(), slide=new THREE.Group(), cabinet=new THREE.Group();
  cabinet.add(housing,slide);
  scene.add(cabinet);
  const shell=new THREE.MeshStandardMaterial({color:0x373939,roughness:.81,metalness:.18,envMapIntensity:.34});
  const dark=new THREE.MeshStandardMaterial({color:0x1a1c1c,roughness:.92,metalness:.1,envMapIntensity:.16});
  const steel=new THREE.MeshStandardMaterial({color:0x82837e,roughness:.46,metalness:.63,envMapIntensity:.58});
  const flange=new THREE.MeshStandardMaterial({color:0xadb0a7,roughness:.5,metalness:.42});
  function box(container,material,x,y,z,w,h,d) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    container.add(mesh);
    return mesh;
  }
  box(housing,shell,0,139,-15,202,11,240);
  box(housing,shell,-95,71,-15,11,129,241);
  box(housing,shell,95,71,-15,11,129,241);
  box(housing,dark,0,70,-130,188,130,9);
  box(housing,dark,0,8,-20,188,10,228);
  box(slide,dark,0,16,7,181,9,204);
  box(slide,dark,-87,57,12,7,82,211);
  box(slide,dark,87,57,12,7,82,211);
  box(slide,steel,0,66,115,187,110,10);
  box(slide,flange,0,119,119,182,2.3,3);
  box(slide,dark,0,82,121,69,14,2.7);
  box(slide,flange,0,47,122,58,4.9,5.5);
  const cards = files.map((file,index)=>{
    const art=cardTexture(THREE,file,index);
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(164,106),new THREE.MeshStandardMaterial({
      map:art,side:THREE.DoubleSide,roughness:.72,metalness:0,emissiveMap:art,emissive:0x151515
    }));
    paper.castShadow=true;paper.receiveShadow=true;
    slide.add(paper);
    box(slide,flange,-40+index*11,115,2+index*19,33,9,1.5);
    return {paper,art,lift:0,velocity:0};
  });
  let target=0, travel=0, chosen=-1, pointed=-1, frame=0, last=0, visible=true;
  const lerp=(a,b,t)=>a+(b-a)*t;
  function schedule() {
    if (!frame&&visible&&!signal.aborted&&!document.hidden) frame=requestAnimationFrame(paint);
  }
  function paint(now) {
    frame=0;
    if (signal.aborted || !visible || document.hidden){ last=0;return; }
    const dt=last?Math.min(.042,(now-last)/1000):.018;
    last=now;
    const calm=preference.matches;
    travel=calm?target:lerp(travel,target,1-Math.exp(-dt*10));
    if (Math.abs(target-travel)<.001) travel=target;
    // The dark housing comes back as the metal tray extends along its rails.
    housing.position.z=-27*travel;
    housing.rotation.x=-.041*travel;
    housing.rotation.y=-.055*travel;
    slide.position.z=153*travel;
    cabinet.rotation.y=.057*travel;
    cabinet.position.x=-14*travel;
    stage.style.setProperty('--archive-travel',travel);
    let restless=travel!==target;
    cards.forEach(({paper},i)=>{
      const model=cards[i];
      const goal = chosen === i ? 1 : pointed === i ? .13 : 0;
      if (calm) model.lift=goal;
      else {
        model.velocity+=(155*(goal-model.lift)-21*model.velocity)*dt;
        model.lift+=model.velocity*dt;
        if (Math.abs(goal-model.lift)<.001&&Math.abs(model.velocity)<.015){model.lift=goal;model.velocity=0;}
      }
      restless ||= model.lift!==goal;
      paper.position.set(-11*model.lift,66+123*model.lift,18+i*18+40*model.lift);
      paper.rotation.x=-.19-.29*model.lift;
      paper.rotation.y=-.39*model.lift;
      paper.rotation.z=-.14*model.lift;
      paper.scale.setScalar(1+.57*model.lift);
    });
    renderer.render(scene,camera);
    if (restless) schedule();
    else last=0;
  }
  const resize=new ResizeObserver(([entry])=>{
    const {width,height}=entry.contentRect;
    const aspect=width/height;
    camera.left=-231*aspect;camera.right=231*aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(Math.round(width),Math.round(height),false);schedule();
  });
  resize.observe(stage);
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});
  io.observe(stage);
  listen(document,'visibilitychange',schedule,signal);
  listen(preference,'change',schedule,signal);
  schedule();
  return {
    open(value){target=value?1:0;schedule();},
    select(index){chosen=index;schedule();},
    hover(index){pointed=index;schedule();},
    dispose(){
      cancelAnimationFrame(frame);resize.disconnect();io.disconnect();
      scene.traverse(item=>{item.geometry?.dispose();});
      [shell,dark,steel,flange,base.material].forEach(mat=>mat.dispose());
      cards.forEach(({art,paper})=>{art.dispose();paper.material.dispose();});
      env.dispose();renderer.dispose();renderer.forceContextLoss();
    }
  };
}
