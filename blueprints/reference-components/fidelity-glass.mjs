import { control, listen } from './shared.mjs';

const FRAME = { w: 1440, h: 960 };
const PANEL = { x: 77, y: 179, w: 1286, h: 703 };
const NAV = { x: 77, y: 82, w: 1286, h: 84 };
const clamp = value => Math.max(0, Math.min(1, value));

export function glassTransfer(root, { signal }) {
  root.innerHTML = `
    <div class="facet-stage" data-renderer="html" aria-label="Facet material studio">
      <div class="facet-view">
        <div class="facet-fallback-shards" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="facet-nav"><span>◆ Facet</span><span>Studio &nbsp;&nbsp; Materials &nbsp;&nbsp; Pricing</span><span>Sign in</span></div>
        <div class="facet-copy">
          <p>Real-time material studio</p><h3>Designed<br>in glass.</h3>
          <p>Author dispersion, transmission, and refraction in the browser.<br>Live previews, real materials.</p>
          <div><button type="button" data-open-studio>Open studio</button><button type="button" data-open-paper>Read paper <span aria-hidden="true">→</span></button></div>
        </div>
      </div>
      <div class="facet-paper" hidden>
        <button type="button" data-close-paper><span aria-hidden="true">←</span> Back</button>
        <article>
          <h3 tabindex="-1">Real-time glass, in five terms.</h3>
          <p><b>Iridescence.</b> Thin layers can tint a reflection according to the viewing angle.</p>
          <p><b>Index of refraction.</b> This determines how a ray bends between materials.</p>
          <p><b>Dispersion.</b> A prism bends wavelengths by different amounts.</p>
          <p><b>Transmission.</b> Some light passes through the surface instead of reflecting.</p>
          <p><b>Roughness.</b> The microstructure spreads out the reflected light.</p>
        </article>
      </div>
    </div>
  `;
  const stage = control(root, '.facet-stage');
  const view = control(root, '.facet-view');
  const paper = control(root, '.facet-paper');
  const trigger = control(root, '[data-open-paper]');
  const studio = control(root, '[data-open-studio]');
  const back = control(root, '[data-close-paper]');
  const heading = control(paper, 'h3');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let engine;
  let open = false;
  let lastTrigger = trigger;
  let timer;
  function turn(next, button) {
    if (next === open) return;
    open = next;
    stage.dataset.phase = next ? 'shattering' : 'returning';
    clearTimeout(timer);
    engine?.travel(next);
    if (open) {
      lastTrigger = button;
      view.inert = true;
      timer = setTimeout(() => {
        if (signal.aborted) return;
        paper.hidden = false;
        paper.inert = false;
        heading.focus({ preventScroll:true });
        stage.dataset.phase = 'paper';
      }, preference.matches ? 0 : 285);
    } else {
      paper.inert = true;
      paper.hidden = true;
      view.inert = false;
      lastTrigger.focus({ preventScroll:true });
      stage.dataset.phase = 'hero';
    }
  }
  listen(trigger, 'click', () => turn(true, trigger), signal);
  listen(studio, 'click', () => turn(true, studio), signal);
  listen(back, 'click', () => turn(false), signal);
  listen(stage, 'keydown', event => { if (event.key === 'Escape' && open) turn(false); }, signal);
  listen(stage, 'pointermove', event => {
    const b = stage.getBoundingClientRect();
    const x = (event.clientX - b.left) / b.width;
    const y = (event.clientY - b.top) / b.height;
    if (engine) engine.point(x,y);
    else if (!preference.matches) {
      view.style.setProperty('--tx', ((x - .5) * 10) + 'deg');
      view.style.setProperty('--ty', ((.5 - y) * 8) + 'deg');
    }
  }, signal);
  listen(stage, 'pointerleave', () => {
    engine?.point();
    view.style.removeProperty('--tx');
    view.style.removeProperty('--ty');
  }, signal);
  signal.addEventListener('abort', () => { clearTimeout(timer); engine?.dispose(); }, {once:true});
  Promise.all([import('./three/three.module.js'), import('./three/RoomEnvironment.js')])
    .then(([THREE, {RoomEnvironment}]) => {
      if (signal.aborted) return;
      engine = renderGlass(THREE, RoomEnvironment, stage, view, preference, signal);
      if (open) engine.travel(true);
    }).catch(() => { if (!signal.aborted) stage.dataset.renderer = 'html'; });
}

function printFace(THREE, width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width * 1.5;
  canvas.height = height * 1.5;
  const ctx = canvas.getContext('2d');
  ctx.scale(1.5,1.5);
  paint(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function drawNav(ctx) {
  ctx.fillStyle = '#cbd0ce';
  ctx.font = '600 12px Arial';
  ctx.fillText('◆ Facet', 42, 44);
  ctx.font = '400 11px Arial';
  ctx.fillStyle = '#a5aca9';
  ctx.fillText('Studio      Materials      Pricing', 126, 44);
  ctx.fillText('Sign in', 1196, 44);
}

function drawPanel(ctx) {
  ctx.fillStyle = '#8f9794';
  ctx.font = '600 8px Arial';
  ctx.letterSpacing = '2px';
  ctx.fillText('REAL-TIME MATERIAL STUDIO', 45, 99);
  ctx.letterSpacing = '0px';
  const type = ctx.createLinearGradient(0,125,0,320);
  type.addColorStop(0, '#e6e7ed');
  type.addColorStop(1, '#c5c8ce');
  ctx.fillStyle = type;
  ctx.font = '500 99px Arial';
  ctx.letterSpacing = '-5.1px';
  ctx.fillText('Designed', 43, 224);
  ctx.fillText('in glass.', 43, 322);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#aeb3b0';
  ctx.font = '400 12px Arial';
  ctx.fillText('Author dispersion, transmission, and refraction in the browser.', 46, 382);
  ctx.fillText('Live previews, real materials.', 46, 400);
  ctx.fillStyle = '#e2e4e7';
  ctx.beginPath();
  ctx.roundRect(48,437,94,30,4);
  ctx.fill();
  ctx.fillStyle = '#23252b';
  ctx.font = '500 10px Arial';
  ctx.fillText('Open studio', 62,456);
  ctx.fillStyle = '#d2d0d6';
  ctx.fillText('Read paper →', 162,456);
  ctx.fillStyle = '#7d8381';
  ctx.font = '400 9px Arial';
  ctx.fillText('© Facet Lab',48,688);
  ctx.fillText('KHR_materials_dispersion',1150,688);
}

function cellRings(time, pointer) {
  const sx = (value, seed) => value + Math.sin(time * (.32 + seed * .013) + seed) * .018;
  const drift = (x, y, seed) => {
    const dx = x - pointer.x, dy = y - pointer.y;
    const strength = pointer.in ? Math.max(0, 1 - Math.hypot(dx,dy) * 2) * .053 : 0;
    return [sx(x,seed) + dx * strength, y + Math.sin(time * .31 + seed) * .027 + dy * strength];
  };
  const a = [sx(.244,2),0], b = [sx(.511,3),0], c = [sx(.838,4),0];
  const d = [sx(.344,5),1], e = [sx(.885,6),1];
  const p = drift(.393,.721,7), q = drift(.464,.605,8), r = drift(.727,.471,9);
  return [[[0,0],a,p,d,[0,1]],[a,b,q,p],[b,c,r,q],[p,q,r,e,d],[c,[1,0],[1,1],e,r]];
}

function renderGlass(THREE, RoomEnvironment, stage, view, preference, signal) {
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'default'});
  renderer.setClearColor(0x08080a);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.55));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.className = 'facet-canvas';
  stage.prepend(renderer.domElement);
  stage.dataset.renderer = 'webgl';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, FRAME.w / FRAME.h, 180, 4600);
  camera.position.z = FRAME.h / (2 * Math.tan(Math.PI / 12));
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room,.05);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const group = new THREE.Group();
  scene.add(group);
  const key = new THREE.DirectionalLight(0xe0e7fb, .91);
  key.position.set(-320,1000,550);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x7a9a83, .36);
  fill.position.set(-820,250,230);
  scene.add(fill);
  const glowCenter = { value:new THREE.Vector2() };
  const glowAmount = { value:0 };
  const navTexture = printFace(THREE, NAV.w, NAV.h, drawNav);
  const panelTexture = printFace(THREE, PANEL.w, PANEL.h, drawPanel);
  const rim = new THREE.MeshPhysicalMaterial({
    color: 0x262a2e, roughness: .32, metalness: .34, clearcoat: .72, envMapIntensity: .61,
    iridescence: .36, iridescenceIOR: 1.27
  });
  const bits = [];
  const bodies = [];
  let pointer = {x:.5,y:.5,in:false};
  let focus = -1;
  let movingToPaper = false;
  let travel = 0;
  let frame = 0, elapsed = 0, last = 0, nextCut = 0, visible = true;
  let initial = true;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const vectors = [[-25,220,490],[-850,-130,720],[-190,-660,680],[206,-470,560],[270,-630,540],[800,-370,655]];
  function createBit(index, area, texture) {
    const material = new THREE.MeshPhysicalMaterial({
      color: index === 0 ? 0x171d1b : 0x111416, roughness:.36, metalness:.20,
      clearcoat:.7, clearcoatRoughness:.12, specularIntensity:.7,
      envMapIntensity:.42, iridescence:.45, iridescenceIOR:1.3, iridescenceThicknessRange:[250,650]
    });
    material.onBeforeCompile = shader => {
      shader.uniforms.facetCenter = glowCenter;
      shader.uniforms.facetAmount = glowAmount;
      shader.vertexShader = 'varying vec2 facetPosition;\n' + shader.vertexShader.replace('#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nfacetPosition = (modelMatrix * vec4(transformed, 1.0)).xy;');
      shader.fragmentShader = 'varying vec2 facetPosition;\nuniform vec2 facetCenter;\nuniform float facetAmount;\n' +
        shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
          'vec2 facetRadius = (facetPosition - facetCenter) / 222.0;\n' +
          'totalEmissiveRadiance += vec3(0.055, 0.05, 0.093) * exp(-1.6 * dot(facetRadius, facetRadius)) * facetAmount;');
    };
    const body = new THREE.Mesh(new THREE.BufferGeometry(), [material,rim]);
    const ink = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
      map:texture, transparent:true, depthWrite:false, toneMapped:false,
      polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-2
    }));
    ink.renderOrder = 2;
    body.userData.index = index;
    const joint = new THREE.Group();
    joint.add(body, ink);
    group.add(joint);
    bodies.push(body);
    return {area, joint, body, ink, material, lift:0, speed:0, base:[0,0], index};
  }
  bits.push(createBit(0,NAV,navTexture));
  for (let i=1;i<=5;i++) bits.push(createBit(i,PANEL,panelTexture));
  function drawShape(bit, ring) {
    const { area } = bit;
    const points = ring.map(([x,y]) => [
      area.x + x * area.w - FRAME.w/2,
      FRAME.h/2 - area.y - y * area.h
    ]);
    const center = points.reduce(([x,y],[px,py]) => [x+px/points.length,y+py/points.length],[0,0]);
    const outline = points.map(([x,y]) => {
      const length = Math.hypot(x-center[0], y-center[1]) || 1;
      const inset = bit.index === 0 ? 0 : 7.3;
      return new THREE.Vector2((x-center[0]) * (1-inset/length), (y-center[1]) * (1-inset/length));
    });
    const shape = new THREE.Shape();
    for (let k=0;k<outline.length;k++) {
      const corner = outline[k], prev=outline[(k-1+outline.length)%outline.length], next=outline[(k+1)%outline.length];
      const before=corner.clone().lerp(prev,Math.min(.38, 19/corner.distanceTo(prev)));
      const after=corner.clone().lerp(next,Math.min(.38, 19/corner.distanceTo(next)));
      if (k===0) shape.moveTo(before.x,before.y);
      else shape.lineTo(before.x,before.y);
      shape.quadraticCurveTo(corner.x,corner.y,after.x,after.y);
    }
    shape.closePath();
    const volume = new THREE.ExtrudeGeometry(shape,{ depth:10, bevelEnabled:true, bevelSize:2, bevelThickness:2.2, bevelSegments:3, steps:1, curveSegments:6 });
    const face = new THREE.ShapeGeometry(shape, 6);
    const position = face.attributes.position, uv=face.attributes.uv;
    for (let i=0;i<position.count;i++) {
      uv.setXY(i,(position.getX(i)+center[0]+FRAME.w/2-area.x)/area.w,
        1-(FRAME.h/2-position.getY(i)-center[1]-area.y)/area.h);
    }
    face.translate(0,0,13.5);
    bit.body.geometry.dispose();
    bit.ink.geometry.dispose();
    bit.body.geometry=volume;
    bit.ink.geometry=face;
    bit.base=center;
  }
  function cut() {
    const rings = cellRings(preference.matches ? 0 : elapsed, pointer);
    rings.forEach((ring,i) => drawShape(bits[i+1],ring));
  }
  drawShape(bits[0], [[0,0],[1,0],[1,1],[0,1]]);
  cut();
  function paint(now) {
    frame = 0;
    if (signal.aborted || !visible || document.hidden) {last=0;return;}
    const dt = last ? Math.min(.024,(now-last)/1000) : .016;
    last = now;
    elapsed += dt;
    const calm=preference.matches;
    const dx = pointer.in ? pointer.x*2-1 : 0, dy=pointer.in ? pointer.y*2-1 : 0;
    const rotate=1-Math.exp(-dt*6);
    group.rotation.x += ((calm ? 0 : dy*.095+.012) - group.rotation.x)*rotate;
    group.rotation.y += ((calm ? 0 : dx*.118-.014) - group.rotation.y)*rotate;
    if (!calm && travel < .03 && elapsed >= nextCut) {
      nextCut = elapsed + .085;
      cut();
    }
    group.updateMatrixWorld(true);
    ndc.set(dx, -dy);
    ray.setFromCamera(ndc,camera);
    const first=pointer.in && travel<.04 && !calm ? ray.intersectObjects(bodies,false)[0] : undefined;
    focus=first?.object.userData.index ?? -1;
    stage.dataset.focus=String(focus);
    glowCenter.value.set(dx*FRAME.w*.5,-dy*FRAME.h*.5);
    glowAmount.value += ((pointer.in && !calm ? 1 : 0) - glowAmount.value) * rotate;
    const target = movingToPaper ? 1 : 0;
    travel = calm ? target : Math.max(0,Math.min(1,travel+(movingToPaper?1:-1)*dt/.84));
    for (const bit of bits) {
      const hovering = focus === bit.index;
      const lift = hovering ? (bit.index === 0 ? 31 : 49) : 0;
      bit.speed += (170 * (lift - bit.lift) - 19 * bit.speed) * dt;
      bit.lift += bit.speed * dt;
      const t=clamp((travel-bit.index*.021)/.87);
      const velocity = movingToPaper ? t*t*t : t*t*(3-2*t);
      const v=vectors[bit.index];
      bit.joint.position.set(bit.base[0]+v[0]*velocity,bit.base[1]+v[1]*velocity,bit.lift+v[2]*velocity);
      bit.joint.rotation.set(dy*bit.lift*.002+velocity*(bit.index%2===0?1.8:-2.1),
        dx*bit.lift*.003+velocity*(bit.index%2===1?1.4:-1.6),velocity*(bit.index-2)*.47);
      bit.joint.visible=travel < .998;
      bit.material.iridescence=.45+Math.max(0,bit.lift)*.009;
      bit.material.envMapIntensity=.42+Math.max(0,bit.lift)*.018;
    }
    renderer.render(scene,camera);
    initial=false;
    if (!calm) schedule();
  }
  function schedule() {
    if (!frame && visible && !document.hidden && !signal.aborted) frame=requestAnimationFrame(paint);
  }
  const size = new ResizeObserver(([entry])=>{
    renderer.setSize(Math.round(entry.contentRect.width),Math.round(entry.contentRect.height),false);
    schedule();
  });
  size.observe(stage);
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});
  io.observe(stage);
  listen(document,'visibilitychange',schedule,signal);
  listen(preference,'change',schedule,signal);
  if (initial) schedule();
  return {
    point(x,y) {
      const inBounds=typeof x==='number'&&typeof y==='number';
      pointer={x:inBounds?x:.5,y:inBounds?y:.5,in:inBounds};
      schedule();
    },
    travel(open) { movingToPaper=open;schedule(); },
    dispose() {
      cancelAnimationFrame(frame);size.disconnect();io.disconnect();
      for (const bit of bits) {
        bit.body.geometry.dispose();bit.ink.geometry.dispose();bit.material.dispose();bit.ink.material.dispose();
      }
      rim.dispose();navTexture.dispose();panelTexture.dispose();environment.dispose();
      renderer.dispose();renderer.forceContextLoss();
    }
  };
}
